import 'dotenv/config';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import {
  BENCHMARKS_BY_CODE,
  FAST_ITEM_TYPE_INFO,
  PRACTICE_DISCLAIMER,
  formatGradeLabel,
  getPriorKnowledgePrerequisite,
} from './src/data/floridaStandards.ts';
import {
  SEED_ASSESSMENTS,
  SEED_ATTEMPTS,
  SEED_ITEMS,
  SEED_PASSAGES,
} from './src/data/seedData.ts';
import {
  OFFICIAL_COMPLEXITY_BANDS,
  analyzePassageComplexity,
  buildLexileRevisionInstruction,
  getTargetLexileProfile,
  isBetterLexileCandidate,
  isWithinTargetLexile,
  reconcileVocabularyContextSentences,
} from './src/utils/textComplexity.ts';
import { scoreStudentSubmission } from './src/utils/assessmentEngine.ts';
import {
  buildFallbackBellringer,
  buildPriorKnowledgeBridgeMeta,
  enforceFiveMinuteBudget,
  getPurposeLabel,
  getQuestionTypeLabel,
  needsSourcePassage,
} from './src/utils/bellringerEngine.ts';
import type {
  AssessmentItem,
  BellringerActivity,
  BellringerOption,
  BellringerPurpose,
  BellringerQuestion,
  BellringerQuestionFormat,
  BellringerQuestionType,
  CognitiveRigor,
  FastItemType,
  GradeLevel,
  PassageLengthOption,
  PassageSection,
  PassageTextType,
  ReadingPassage,
  SavedAssessment,
  StudentAttempt,
  StudentItemResponse,
  VocabularyComplexityOption,
  VocabularyWord,
  WorkspaceState,
} from './src/types/ela.ts';

const PORT = 3000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const WORKSPACE_FILE = path.join(DATA_DIR, 'studio-workspace.json');
const GEMINI_MODEL = 'gemini-4-hydrogen';

function getAiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

async function readWorkspace(): Promise<WorkspaceState> {
  try {
    const raw = await fs.readFile(WORKSPACE_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as WorkspaceState;
    return {
      passages: Array.isArray(parsed.passages) ? parsed.passages : [...SEED_PASSAGES],
      items: Array.isArray(parsed.items) ? parsed.items : [...SEED_ITEMS],
      assessments: Array.isArray(parsed.assessments) ? parsed.assessments : [...SEED_ASSESSMENTS],
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [...SEED_ATTEMPTS],
    };
  } catch {
    const initial: WorkspaceState = {
      passages: [...SEED_PASSAGES],
      items: [...SEED_ITEMS],
      assessments: [...SEED_ASSESSMENTS],
      attempts: [...SEED_ATTEMPTS],
    };
    await writeWorkspace(initial);
    return initial;
  }
}

async function writeWorkspace(state: WorkspaceState): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(WORKSPACE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

function buildVocabFallback(sections: PassageSection[], grade: GradeLevel): VocabularyWord[] {
  const paragraphs = sections.flatMap((s) => s.paragraphs);
  const stopWords = new Set([
    'about', 'after', 'again', 'against', 'almost', 'alone', 'along', 'already', 'always',
    'among', 'around', 'because', 'before', 'behind', 'below', 'between', 'could', 'during',
    'every', 'first', 'found', 'great', 'however', 'might', 'never', 'other', 'people',
    'place', 'right', 'shall', 'should', 'since', 'small', 'still', 'their', 'there',
    'these', 'thing', 'think', 'those', 'though', 'three', 'through', 'today', 'under',
    'until', 'using', 'water', 'where', 'which', 'while', 'without', 'would', 'years',
  ]);
  const vocabCode = `ELA.${grade}.V.1.3`;
  const morphCode = grade === 'K' || grade === '1' ? `ELA.${grade}.V.1.3` : `ELA.${grade}.V.1.2`;
  const gradeDisplay = formatGradeLabel(grade);

  const picked: VocabularyWord[] = [];
  const seen = new Set<string>();

  paragraphs.forEach((para, idx) => {
    const sentences = para.split(/(?<=[.!?])\s+/);
    for (const sentence of sentences) {
      const tokens = sentence.match(/[A-Za-z]{6,}/g) ?? [];
      for (const raw of tokens) {
        const lower = raw.toLowerCase();
        if (seen.has(lower) || stopWords.has(lower)) continue;
        seen.add(lower);
        const hasMorph = /(tion|ment|able|ful|less|pre|un|re|con|auto|bio|geo|graph)/.test(lower);
        picked.push({
          id: `v-${Date.now()}-${picked.length + 1}`,
          word: lower,
          partOfSpeech: lower.endsWith('ly') ? 'adverb' : lower.endsWith('ing') ? 'verb/participle' : 'academic term',
          definition: `${gradeDisplay} academic or domain vocabulary word used in Paragraph ${idx + 1}; review surrounding context clues with students.`,
          passageContextSentence: sentence.trim(),
          paragraphRef: idx + 1,
          morphologyOrClueNote: hasMorph
            ? 'Analyze base word and affixes/roots alongside sentence context.'
            : 'Examine nearby contrast, example, or explanation clues in the paragraph.',
          benchmarkCode: hasMorph ? morphCode : vocabCode,
          benchmarkAlignmentNote: hasMorph
            ? grade === 'K' || grade === '1'
              ? 'Word relationships and oral/context clues'
              : 'Word parts, base words, and affixes'
            : 'Context clues and word relationships',
        });
        if (picked.length >= 6) break;
      }
      if (picked.length >= 6) break;
    }
  });

  return picked.slice(0, 6);
}

function getWordTargetDescription(length: PassageLengthOption, grade: GradeLevel): string {
  if (grade === 'K' || grade === '1') {
    return length === 'short' ? '100–160 words' : length === 'extended' ? '220–300 words' : '160–220 words';
  }
  if (grade === '2') {
    return length === 'short' ? '180–260 words' : length === 'extended' ? '340–450 words' : '260–340 words';
  }
  if (length === 'short') return '260–350 words';
  if (length === 'extended') return '700–880 words';
  return '450–620 words';
}

function safeParseJson<T>(text: string | undefined): T {
  if (!text) {
    throw new Error('Model returned an empty response.');
  }
  const cleaned = text
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```$/i, '')
    .trim();
  return JSON.parse(cleaned) as T;
}

function normalizeBenchmarkCode(code: string, grade: GradeLevel): string {
  if (BENCHMARKS_BY_CODE[code]) return code;
  const fallback = `ELA.${grade}.R.2.2`;
  return BENCHMARKS_BY_CODE[fallback] ? fallback : 'ELA.K12.EE.1.1';
}

function buildNormalizedItem(
  raw: Record<string, unknown>,
  passage: ReadingPassage,
  requestedBenchmarkCode: string,
  requestedItemType: FastItemType,
  requestedRigor: CognitiveRigor
): AssessmentItem {
  const benchmarkCode = normalizeBenchmarkCode(
    typeof raw.benchmarkCode === 'string' ? raw.benchmarkCode : requestedBenchmarkCode,
    passage.grade
  );
  const benchmark = BENCHMARKS_BY_CODE[benchmarkCode] ?? BENCHMARKS_BY_CODE['ELA.K12.EE.1.1'];
  const itemType = (['multiple_choice', 'multiselect', 'ebsr', 'hot_text', 'table_match'].includes(
    String(raw.itemType)
  )
    ? raw.itemType
    : requestedItemType) as FastItemType;

  const rawDok = Number(raw.dok);
  const dok: 1 | 2 | 3 = rawDok === 1 || rawDok === 2 || rawDok === 3 ? rawDok : requestedRigor === 'Foundational' ? 1 : requestedRigor === 'Advanced' ? 3 : 2;
  const uid = `item-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  const mapOptions = (arr: unknown, prefix: string) => {
    if (!Array.isArray(arr)) return undefined;
    return arr.map((opt, idx) => {
      const o = opt as Record<string, unknown>;
      return {
        id: `${uid}-${prefix}-${idx + 1}`,
        label: String(o.label ?? String.fromCharCode(65 + idx)),
        text: String(o.text ?? ''),
        isCorrect: Boolean(o.isCorrect),
        rationale: String(o.rationale ?? ''),
        paragraphRef: typeof o.paragraphRef === 'number' ? o.paragraphRef : undefined,
      };
    });
  };

  const hotTextSegments = Array.isArray(raw.hotTextSegments)
    ? raw.hotTextSegments.map((seg, idx) => {
        const s = seg as Record<string, unknown>;
        return {
          id: `${uid}-ht-${idx + 1}`,
          paragraphRef: typeof s.paragraphRef === 'number' ? s.paragraphRef : 1,
          text: String(s.text ?? ''),
          isCorrect: Boolean(s.isCorrect),
          rationale: String(s.rationale ?? ''),
        };
      })
    : undefined;

  const rawTable = raw.tableMatch as Record<string, unknown> | undefined;
  const tableMatch =
    rawTable && Array.isArray(rawTable.columns) && Array.isArray(rawTable.rows)
      ? {
          columns: (rawTable.columns as Record<string, unknown>[]).map((c, idx) => ({
            id: String(c.id ?? `col-${idx + 1}`),
            label: String(c.label ?? `Column ${idx + 1}`),
          })),
          rows: (rawTable.rows as Record<string, unknown>[]).map((r, idx) => ({
            id: String(r.id ?? `row-${idx + 1}`),
            statement: String(r.statement ?? ''),
            correctColumnIds: Array.isArray(r.correctColumnIds)
              ? r.correctColumnIds.map(String)
              : [],
            rationale: String(r.rationale ?? ''),
          })),
        }
      : undefined;

  return {
    id: uid,
    passageId: passage.id,
    grade: passage.grade,
    itemType,
    benchmarkCode: benchmark.code,
    officialBenchmarkText: benchmark.officialText,
    reportingCategory: benchmark.reportingCategory,
    reportingCategoryLabel: benchmark.reportingCategoryLabel,
    cognitiveSkill: String(raw.cognitiveSkill ?? benchmark.requiredCognitiveSkills[0] ?? benchmark.benchmarkTitle),
    cognitiveRigor: requestedRigor,
    dok,
    prompt: String(raw.prompt ?? ''),
    selectionCount: typeof raw.selectionCount === 'number' ? raw.selectionCount : undefined,
    options: mapOptions(raw.options, 'opt'),
    partAPrompt: typeof raw.partAPrompt === 'string' ? raw.partAPrompt : undefined,
    partAOptions: mapOptions(raw.partAOptions, 'pa'),
    partBPrompt: typeof raw.partBPrompt === 'string' ? raw.partBPrompt : undefined,
    partBOptions: mapOptions(raw.partBOptions, 'pb'),
    hotTextSegments,
    tableMatch,
    correctAnswerSummary: String(raw.correctAnswerSummary ?? ''),
    correctRationale: String(raw.correctRationale ?? ''),
    textualEvidenceQuote: String(raw.textualEvidenceQuote ?? ''),
    evidenceParagraphRef: typeof raw.evidenceParagraphRef === 'number' ? raw.evidenceParagraphRef : 1,
    sourceCitation: `${benchmark.sourceTitle} (${benchmark.code}, p. ${benchmark.pdfPage - 1}) & FAST ELA Reading Test Design Summary (p. 10)`,
    practiceDisclaimer: PRACTICE_DISCLAIMER,
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '4mb' }));

  // =========================================================
  // WORKSPACE PERSISTENCE ROUTES
  // =========================================================
  app.get('/api/workspace', async (_req, res) => {
    try {
      const state = await readWorkspace();
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to load workspace.' });
    }
  });

  app.post('/api/workspace/passages', async (req, res) => {
    try {
      const passage = req.body.passage as ReadingPassage;
      if (!passage || !passage.id || !Array.isArray(passage.sections)) {
        res.status(400).json({ error: 'Valid passage payload is required.' });
        return;
      }
      const state = await readWorkspace();
      const idx = state.passages.findIndex((p) => p.id === passage.id);
      if (idx >= 0) {
        state.passages[idx] = passage;
      } else {
        state.passages.unshift(passage);
      }
      await writeWorkspace(state);
      res.json({ passage, passages: state.passages });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to save passage.' });
    }
  });

  app.delete('/api/workspace/passages/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const state = await readWorkspace();
      state.passages = state.passages.filter((p) => p.id !== id);
      state.items = state.items.filter((i) => i.passageId !== id);
      await writeWorkspace(state);
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete passage.' });
    }
  });

  app.post('/api/workspace/items', async (req, res) => {
    try {
      const items = req.body.items as AssessmentItem[];
      if (!Array.isArray(items)) {
        res.status(400).json({ error: 'Items array is required.' });
        return;
      }
      const state = await readWorkspace();
      for (const item of items) {
        const idx = state.items.findIndex((existing) => existing.id === item.id);
        if (idx >= 0) {
          state.items[idx] = item;
        } else {
          state.items.unshift(item);
        }
      }
      await writeWorkspace(state);
      res.json({ items: state.items });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to save items.' });
    }
  });

  app.delete('/api/workspace/items/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const state = await readWorkspace();
      state.items = state.items.filter((i) => i.id !== id);
      await writeWorkspace(state);
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete item.' });
    }
  });

  app.post('/api/workspace/assessments', async (req, res) => {
    try {
      const assessment = req.body.assessment as SavedAssessment;
      if (!assessment || !assessment.id || !assessment.passage) {
        res.status(400).json({ error: 'Valid assessment payload is required.' });
        return;
      }
      const state = await readWorkspace();
      const now = new Date().toISOString();
      const updatedAssessment: SavedAssessment = {
        ...assessment,
        updatedAt: now,
      };
      const idx = state.assessments.findIndex((a) => a.id === updatedAssessment.id);
      if (idx >= 0) {
        state.assessments[idx] = updatedAssessment;
      } else {
        state.assessments.unshift(updatedAssessment);
      }

      // Sync passage & items into bank as well
      const pIdx = state.passages.findIndex((p) => p.id === updatedAssessment.passage.id);
      if (pIdx >= 0) {
        state.passages[pIdx] = updatedAssessment.passage;
      } else {
        state.passages.unshift(updatedAssessment.passage);
      }
      for (const item of updatedAssessment.items) {
        const iIdx = state.items.findIndex((x) => x.id === item.id);
        if (iIdx >= 0) state.items[iIdx] = item;
        else state.items.unshift(item);
      }

      await writeWorkspace(state);
      res.json({ assessment: updatedAssessment, state });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to save assessment.' });
    }
  });

  app.delete('/api/workspace/assessments/:id', async (req, res) => {
    try {
      const { id } = req.params;
      const state = await readWorkspace();
      state.assessments = state.assessments.filter((a) => a.id !== id);
      await writeWorkspace(state);
      res.json(state);
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to delete assessment.' });
    }
  });

  app.post('/api/workspace/attempts', async (req, res) => {
    try {
      const { assessmentId, studentName, responses } = req.body as {
        assessmentId: string;
        studentName: string;
        responses: Record<string, StudentItemResponse>;
      };
      const state = await readWorkspace();
      const assessment = state.assessments.find((a) => a.id === assessmentId);
      if (!assessment) {
        res.status(404).json({ error: 'Assessment not found.' });
        return;
      }
      const scored = scoreStudentSubmission(assessment.items, responses ?? {});
      const attempt: StudentAttempt = {
        id: `attempt-${Date.now()}`,
        assessmentId: assessment.id,
        assessmentTitle: assessment.title,
        grade: assessment.grade,
        studentName: (studentName ?? '').trim() || 'Student Practice Session',
        submittedAt: new Date().toISOString(),
        totalPoints: scored.totalPoints,
        maxPoints: scored.maxPoints,
        percentScore: scored.percentScore,
        responses: responses ?? {},
        itemResults: scored.itemResults,
      };
      state.attempts.unshift(attempt);
      await writeWorkspace(state);
      res.json({ attempt, attempts: state.attempts });
    } catch (error) {
      res.status(500).json({ error: error instanceof Error ? error.message : 'Failed to record attempt.' });
    }
  });

  // =========================================================
  // SERVER-SIDE GEMINI GENERATION & ANALYSIS ROUTES
  // =========================================================
  app.post('/api/generate-passage', async (req, res) => {
    try {
      const {
        grade,
        textType,
        targetLength,
        vocabularyComplexity,
        topic,
        benchmarkCodes,
      } = req.body as {
        grade: GradeLevel;
        textType: PassageTextType;
        targetLength: PassageLengthOption;
        vocabularyComplexity: VocabularyComplexityOption;
        topic: string;
        benchmarkCodes: string[];
      };

      if (!topic || !topic.trim()) {
        res.status(400).json({ error: 'Please provide a topic or subject area for the passage.' });
        return;
      }

      const ai = getAiClient();
      if (!ai) {
        res.status(503).json({
          error:
            'Server Gemini API key is not configured. You can still paste or edit custom passages and run Text Complexity & Vocabulary analysis locally.',
        });
        return;
      }

      const safeVocabLevel: VocabularyComplexityOption =
        vocabularyComplexity === 'foundational' ||
        vocabularyComplexity === 'stretch' ||
        vocabularyComplexity === 'on-grade'
          ? vocabularyComplexity
          : 'on-grade';

      const lexileProfile = getTargetLexileProfile(grade, safeVocabLevel);
      const officialBand = OFFICIAL_COMPLEXITY_BANDS[grade] ?? OFFICIAL_COMPLEXITY_BANDS['3'];

      const selectedBenchmarks = (benchmarkCodes ?? [])
        .map((code) => BENCHMARKS_BY_CODE[code])
        .filter(Boolean);
      const gradeLabel = formatGradeLabel(grade);
      const benchmarkContext =
        selectedBenchmarks.length > 0
          ? selectedBenchmarks
              .map(
                (b) =>
                  `- ${b.code}: "${b.officialText}"${b.clarifications.length > 0 ? ` (Clarifications: ${b.clarifications.join(' ')})` : ''}`
              )
              .join('\n')
          : `- ELA.${grade}.R.2.2 / ELA.${grade}.R.1.1 (${gradeLabel} comprehension)`;

      const wordRange = getWordTargetDescription(targetLength, grade);
      const isPaired = textType === 'paired';
      const allowedVocabCodes =
        grade === 'K' || grade === '1'
          ? `ELA.${grade}.V.1.1 or ELA.${grade}.V.1.3`
          : `ELA.${grade}.V.1.1, ELA.${grade}.V.1.2, or ELA.${grade}.V.1.3`;

      const prompt = `Create an original, instructionally rich ${gradeLabel} reading passage set for Florida B.E.S.T. ELA practice.

Topic / Subject: ${topic.trim()}
Text Type: ${
        isPaired
          ? 'Paired Literary & Informational Texts (or Primary & Secondary Source pair) with meaningful connections for compare/contrast/synthesis'
          : textType === 'literary'
          ? 'Original Literary Narrative'
          : 'Original Informational Article'
      }
Target Total Word Count: ${wordRange}
Vocabulary Level: ${safeVocabLevel} (appropriate for ${gradeLabel})
Target Quantitative Lexile Range: ${lexileProfile.targetDisplay} (inside Florida B.E.S.T. Appendix B ${officialBand.label}: ${officialBand.lexileDisplay})
Syntactic & Diction Targets to Hit Lexile Range:
- Average sentence length: ${lexileProfile.avgWordsPerSentenceRange} (keep almost all sentences <= ${lexileProfile.maxSentenceWords} words)
- Word/syllable complexity: ${lexileProfile.avgSyllablesNote}

Target Florida B.E.S.T. Benchmarks:
${benchmarkContext}

Strict Quality Rules:
1. Write 100% original text. Never copy or paraphrase copyrighted or secure FAST test passages.
2. Provide sufficient explicit details, figurative or structural cues (as aligned to the selected benchmarks), and self-contained context so students do not need unfair outside background knowledge.
3. Strictly calibrate sentence length and syllable density to hit the Target Quantitative Lexile Range (${lexileProfile.targetDisplay}) for ${gradeLabel}. Do NOT write overly long multi-clause sentences or dense academic abstractions for Grades K–3, and do NOT write overly choppy, under-leveled dialogue/sentences for Grades 4–5.
4. Organize into clear, well-paced paragraphs (each element of paragraphs[] is one full paragraph without leading numbers).
5. Include 1–3 helpful Glossary terms (FAST-style footnote glossary for technical/specialized terms).
6. Identify 5 to 7 key vocabulary words from the passage(s) suitable for ${gradeLabel} instruction. Each vocabulary item MUST include an exact sentence copied verbatim from the passage, accurate 1-based paragraph number across all paragraphs in order, definition, part of speech, morphology/context-clue instructional note, and an authentic ${gradeLabel} Florida B.E.S.T. vocabulary benchmark code (${allowedVocabCodes}).
7. Provide concise qualitative text complexity notes following Florida B.E.S.T. Appendix B criteria (meaning/purpose, language clarity/vocabulary, sentence structure/organization, knowledge demands, instructional recommendation).`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            'You are an expert Florida elementary ELA curriculum writer and assessment specialist. Output strictly valid JSON matching the requested schema.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              sections: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    title: { type: Type.STRING },
                    genre: { type: Type.STRING },
                    sourceNote: { type: Type.STRING },
                    paragraphs: { type: Type.ARRAY, items: { type: Type.STRING } },
                  },
                  required: ['label', 'title', 'genre', 'paragraphs'],
                },
              },
              glossary: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    term: { type: Type.STRING },
                    definition: { type: Type.STRING },
                  },
                  required: ['term', 'definition'],
                },
              },
              vocabularyGuide: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    word: { type: Type.STRING },
                    partOfSpeech: { type: Type.STRING },
                    definition: { type: Type.STRING },
                    passageContextSentence: { type: Type.STRING },
                    paragraphRef: { type: Type.INTEGER },
                    morphologyOrClueNote: { type: Type.STRING },
                    benchmarkCode: { type: Type.STRING },
                    benchmarkAlignmentNote: { type: Type.STRING },
                  },
                  required: [
                    'word',
                    'partOfSpeech',
                    'definition',
                    'passageContextSentence',
                    'paragraphRef',
                    'morphologyOrClueNote',
                    'benchmarkCode',
                    'benchmarkAlignmentNote',
                  ],
                },
              },
              qualitative: {
                type: Type.OBJECT,
                properties: {
                  complexityTier: { type: Type.STRING },
                  meaningAndPurpose: { type: Type.STRING },
                  languageClarityAndVocabulary: { type: Type.STRING },
                  sentenceStructureAndOrganization: { type: Type.STRING },
                  knowledgeDemands: { type: Type.STRING },
                  instructionalRecommendation: { type: Type.STRING },
                },
              },
            },
            required: ['title', 'sections', 'glossary', 'vocabularyGuide', 'qualitative'],
          },
        },
      });

      const parsed = safeParseJson<{
        title: string;
        sections: {
          label: string;
          title: string;
          genre: string;
          sourceNote?: string;
          paragraphs: string[];
        }[];
        glossary: { term: string; definition: string }[];
        vocabularyGuide: Omit<VocabularyWord, 'id'>[];
        qualitative: {
          complexityTier?: string;
          meaningAndPurpose?: string;
          languageClarityAndVocabulary?: string;
          sentenceStructureAndOrganization?: string;
          knowledgeDemands?: string;
          instructionalRecommendation?: string;
        };
      }>(response.text);

      let bestSections: PassageSection[] = (parsed.sections ?? []).map((s, idx) => ({
        id: `sec-${Date.now()}-${idx + 1}`,
        label: s.label || (isPaired ? `Passage ${idx + 1}` : 'Passage'),
        title: s.title || parsed.title,
        genre: s.genre === 'literary' ? 'literary' : 'informational',
        sourceNote: s.sourceNote || `Original Practice Text · ${formatGradeLabel(grade)}`,
        paragraphs: (s.paragraphs ?? []).filter((p) => p.trim().length > 0),
      }));

      const tier =
        parsed.qualitative?.complexityTier === 'Low' ||
        parsed.qualitative?.complexityTier === 'High'
          ? parsed.qualitative.complexityTier
          : 'Mid';

      const qualitativeSeed = {
        ...parsed.qualitative,
        complexityTier: tier,
      } as const;

      let bestComplexity = analyzePassageComplexity(bestSections, grade, textType, qualitativeSeed);
      let bestVocabGuide: VocabularyWord[] = (parsed.vocabularyGuide ?? [])
        .slice(0, 7)
        .map((v, idx) => ({
          ...v,
          id: `v-${Date.now()}-${idx + 1}`,
          benchmarkCode: BENCHMARKS_BY_CODE[v.benchmarkCode]
            ? v.benchmarkCode
            : `ELA.${grade}.V.1.3`,
        }));

      // Closed-loop Lexile calibration (up to 2 targeted passes) if initial draft misses target range
      const MAX_CALIBRATION_PASSES = 2;
      for (let pass = 0; pass < MAX_CALIBRATION_PASSES; pass++) {
        if (isWithinTargetLexile(bestComplexity.estimatedLexile, lexileProfile)) {
          break;
        }
        try {
          const revisionInstruction = buildLexileRevisionInstruction(
            bestComplexity,
            lexileProfile,
            grade,
            wordRange
          );
          const revisionPrompt = `${revisionInstruction}

Current Passage Title: ${parsed.title || topic.trim()}
Keep exactly ${bestSections.length} section(s) with the same labels/titles/genres.
Vocabulary Benchmark Codes allowed: ${allowedVocabCodes}

Current Sections JSON:
${JSON.stringify(
  bestSections.map((s) => ({
    label: s.label,
    title: s.title,
    genre: s.genre,
    paragraphs: s.paragraphs,
  })),
  null,
  2
)}`;

          const revisionRes = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: revisionPrompt,
            config: {
              systemInstruction:
                'You are an expert Florida elementary ELA curriculum writer calibrating reading text to an exact Lexile target. Output strictly valid JSON matching the schema.',
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  sections: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        label: { type: Type.STRING },
                        title: { type: Type.STRING },
                        genre: { type: Type.STRING },
                        paragraphs: { type: Type.ARRAY, items: { type: Type.STRING } },
                      },
                      required: ['label', 'title', 'genre', 'paragraphs'],
                    },
                  },
                  vocabularyGuide: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        word: { type: Type.STRING },
                        partOfSpeech: { type: Type.STRING },
                        definition: { type: Type.STRING },
                        passageContextSentence: { type: Type.STRING },
                        paragraphRef: { type: Type.INTEGER },
                        morphologyOrClueNote: { type: Type.STRING },
                        benchmarkCode: { type: Type.STRING },
                        benchmarkAlignmentNote: { type: Type.STRING },
                      },
                      required: [
                        'word',
                        'partOfSpeech',
                        'definition',
                        'passageContextSentence',
                        'paragraphRef',
                        'morphologyOrClueNote',
                        'benchmarkCode',
                        'benchmarkAlignmentNote',
                      ],
                    },
                  },
                },
                required: ['sections', 'vocabularyGuide'],
              },
            },
          });

          const revisedParsed = safeParseJson<{
            sections?: {
              label: string;
              title: string;
              genre: string;
              paragraphs: string[];
            }[];
            vocabularyGuide?: Omit<VocabularyWord, 'id'>[];
          }>(revisionRes.text);

          const candidateSections: PassageSection[] = (revisedParsed.sections ?? []).map(
            (s, idx) => ({
              id: bestSections[idx]?.id ?? `sec-${Date.now()}-${idx + 1}`,
              label: bestSections[idx]?.label || s.label || (isPaired ? `Passage ${idx + 1}` : 'Passage'),
              title: bestSections[idx]?.title || s.title || parsed.title,
              genre: bestSections[idx]?.genre ?? (s.genre === 'literary' ? 'literary' : 'informational'),
              sourceNote:
                bestSections[idx]?.sourceNote || `Original Practice Text · ${formatGradeLabel(grade)}`,
              paragraphs: (s.paragraphs ?? []).filter((p) => p.trim().length > 0),
            })
          );

          const isValidStructure =
            candidateSections.length === bestSections.length &&
            candidateSections.every((s) => s.paragraphs.length > 0);

          if (!isValidStructure) {
            continue;
          }

          const candidateComplexity = analyzePassageComplexity(
            candidateSections,
            grade,
            textType,
            qualitativeSeed
          );

          if (isBetterLexileCandidate(candidateComplexity, bestComplexity, lexileProfile)) {
            bestSections = candidateSections;
            bestComplexity = candidateComplexity;
            if (Array.isArray(revisedParsed.vocabularyGuide) && revisedParsed.vocabularyGuide.length >= 5) {
              bestVocabGuide = revisedParsed.vocabularyGuide.slice(0, 7).map((v, idx) => ({
                ...v,
                id: `v-${Date.now()}-${idx + 1}`,
                benchmarkCode: BENCHMARKS_BY_CODE[v.benchmarkCode]
                  ? v.benchmarkCode
                  : `ELA.${grade}.V.1.3`,
              }));
            }
          }
        } catch {
          // Preserve best candidate on transient revision failure
          break;
        }
      }

      const reconciledVocab = reconcileVocabularyContextSentences(bestSections, bestVocabGuide);
      const fullPassageTextLower = bestSections
        .flatMap((s) => s.paragraphs)
        .join(' ')
        .toLowerCase();
      const verifiedVocab = reconciledVocab.filter((v) => {
        const clean = v.word.trim().toLowerCase();
        if (!clean) return false;
        const stem = clean.replace(/[^a-z]/g, '').slice(0, Math.max(4, clean.length - 2));
        return fullPassageTextLower.includes(clean) || (stem.length >= 4 && fullPassageTextLower.includes(stem));
      });
      let finalVocabGuide = verifiedVocab;
      if (finalVocabGuide.length < 5) {
        const seenWords = new Set(finalVocabGuide.map((v) => v.word.toLowerCase()));
        const extras = buildVocabFallback(bestSections, grade).filter(
          (v) => !seenWords.has(v.word.toLowerCase())
        );
        finalVocabGuide = [...finalVocabGuide, ...extras].slice(0, 6);
      }

      const passage: ReadingPassage = {
        id: `passage-${Date.now()}`,
        title: parsed.title || topic.trim(),
        grade,
        textType,
        topic: topic.trim(),
        targetLength,
        vocabularyComplexity: safeVocabLevel,
        alignedBenchmarks:
          selectedBenchmarks.length > 0
            ? selectedBenchmarks.map((b) => b.code)
            : [`ELA.${grade}.R.2.2`],
        sections: bestSections,
        glossary: parsed.glossary ?? [],
        vocabularyGuide:
          finalVocabGuide.length >= 5 ? finalVocabGuide : buildVocabFallback(bestSections, grade),
        complexity: bestComplexity,
        practiceDisclaimer: PRACTICE_DISCLAIMER,
        createdAt: new Date().toISOString(),
        sourceMode: 'ai-generated',
      };

      const state = await readWorkspace();
      state.passages.unshift(passage);
      await writeWorkspace(state);

      res.json({ passage });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate reading passage.',
      });
    }
  });

  app.post('/api/analyze-passage', async (req, res) => {
    try {
      const { sections, grade, textType, extractVocabulary } = req.body as {
        sections: PassageSection[];
        grade: GradeLevel;
        textType: PassageTextType;
        extractVocabulary?: boolean;
      };

      if (!Array.isArray(sections) || sections.flatMap((s) => s.paragraphs).length === 0) {
        res.status(400).json({ error: 'Provide at least one paragraph to analyze.' });
        return;
      }

      let qualitativeOverride: Record<string, string> | undefined;
      let vocabularyGuide: VocabularyWord[] | undefined;

      const ai = getAiClient();
      if (ai && extractVocabulary !== false) {
        try {
          const numberedText = sections
            .flatMap((s) => s.paragraphs)
            .map((p, idx) => `[${idx + 1}] ${p}`)
            .join('\n\n');

          const allowedVocabCodes =
            grade === 'K' || grade === '1'
              ? `ELA.${grade}.V.1.1 or ELA.${grade}.V.1.3`
              : `ELA.${grade}.V.1.1, ELA.${grade}.V.1.2, or ELA.${grade}.V.1.3`;
          const response = await ai.models.generateContent({
            model: GEMINI_MODEL,
            contents: `Analyze this ${formatGradeLabel(grade)} passage for Florida B.E.S.T. qualitative text complexity and extract 5 to 7 key ${formatGradeLabel(grade)} vocabulary words with exact passage context sentences and official Florida B.E.S.T. vocabulary benchmark codes (${allowedVocabCodes}).\n\n${numberedText}`,
            config: {
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  vocabularyGuide: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        word: { type: Type.STRING },
                        partOfSpeech: { type: Type.STRING },
                        definition: { type: Type.STRING },
                        passageContextSentence: { type: Type.STRING },
                        paragraphRef: { type: Type.INTEGER },
                        morphologyOrClueNote: { type: Type.STRING },
                        benchmarkCode: { type: Type.STRING },
                        benchmarkAlignmentNote: { type: Type.STRING },
                      },
                    },
                  },
                  qualitative: {
                    type: Type.OBJECT,
                    properties: {
                      complexityTier: { type: Type.STRING },
                      meaningAndPurpose: { type: Type.STRING },
                      languageClarityAndVocabulary: { type: Type.STRING },
                      sentenceStructureAndOrganization: { type: Type.STRING },
                      knowledgeDemands: { type: Type.STRING },
                      instructionalRecommendation: { type: Type.STRING },
                    },
                  },
                },
              },
            },
          });

          const parsed = safeParseJson<{
            vocabularyGuide?: Omit<VocabularyWord, 'id'>[];
            qualitative?: Record<string, string>;
          }>(response.text);

          qualitativeOverride = parsed.qualitative;
          if (Array.isArray(parsed.vocabularyGuide) && parsed.vocabularyGuide.length >= 5) {
            vocabularyGuide = parsed.vocabularyGuide.slice(0, 7).map((v, idx) => ({
              ...v,
              id: `v-${Date.now()}-${idx + 1}`,
              benchmarkCode: BENCHMARKS_BY_CODE[v.benchmarkCode]
                ? v.benchmarkCode
                : `ELA.${grade}.V.1.3`,
            }));
          }
        } catch {
          // Graceful deterministic fallback if Gemini call fails
        }
      }

      const complexity = analyzePassageComplexity(
        sections,
        grade,
        textType,
        qualitativeOverride as Partial<ReadingPassage['complexity']['qualitative']> | undefined
      );
      const finalVocab =
        vocabularyGuide && vocabularyGuide.length >= 5
          ? vocabularyGuide
          : buildVocabFallback(sections, grade);

      res.json({
        complexity,
        vocabularyGuide: finalVocab,
      });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to analyze passage.',
      });
    }
  });

  app.post('/api/generate-items', async (req, res) => {
    try {
      const { passage, benchmarkCodes, itemTypes, count, rigor } = req.body as {
        passage: ReadingPassage;
        benchmarkCodes: string[];
        itemTypes: FastItemType[];
        count: number;
        rigor: CognitiveRigor;
      };

      if (!passage || !passage.sections?.length) {
        res.status(400).json({ error: 'A passage is required to generate assessment items.' });
        return;
      }

      const ai = getAiClient();
      if (!ai) {
        res.status(503).json({
          error: 'Server Gemini API key is not configured.',
        });
        return;
      }

      const safeCount = Math.max(1, Math.min(8, Number(count) || 4));
      const requestedTypes = itemTypes?.length ? itemTypes : (['multiple_choice', 'ebsr'] as FastItemType[]);
      const benchmarks = (benchmarkCodes ?? [])
        .map((c) => BENCHMARKS_BY_CODE[c])
        .filter(Boolean);
      const fallbackBench = BENCHMARKS_BY_CODE[`ELA.${passage.grade}.R.2.2`] ?? BENCHMARKS_BY_CODE['ELA.K12.EE.1.1'];
      const targetBenchmarks = benchmarks.length > 0 ? benchmarks : [fallbackBench];

      const numberedPassage = passage.sections
        .map((sec) => {
          const paras = sec.paragraphs.map((p, idx) => `[P${idx + 1}] ${p}`).join('\n');
          return `=== ${sec.label}: ${sec.title} ===\n${paras}`;
        })
        .join('\n\n');

      const benchmarkSpecText = targetBenchmarks
        .map(
          (b) =>
            `- ${b.code} (${b.reportingCategoryLabel}): "${b.officialText}" | Required Skills: ${b.requiredCognitiveSkills.join('; ')}${
              b.clarifications.length > 0 ? ` | Clarification: ${b.clarifications.join(' ')}` : ''
            }`
        )
        .join('\n');

      const typeGuidance = requestedTypes
        .map((t) => `- ${t}: ${FAST_ITEM_TYPE_INFO[t].description}`)
        .join('\n');

      const prompt = `Generate ${safeCount} original FAST-aligned ELA Reading assessment items for Grade ${passage.grade} based strictly on the passage below.

Target Cognitive Rigor: ${rigor} (calibrate DOK 1–3 accordingly; avoid trivial recall-only questions unless Foundational vocabulary).

Official Florida B.E.S.T. Benchmarks to Assess:
${benchmarkSpecText}

Allowed FAST Item Formats (distribute across the ${safeCount} items):
${typeGuidance}

Format Requirements per itemType:
- For "multiple_choice": include 4 options (labels A, B, C, D) in options[] with exactly 1 isCorrect=true and distractor rationale explaining the student misconception on every option.
- For "multiselect": include 5 or 6 options in options[], set selectionCount (e.g., 2), and mark exactly selectionCount options isCorrect=true. Prompt MUST tell the student the exact count (e.g., "Select TWO...").
- For "ebsr": include partAPrompt, partAOptions (4 options A-D, 1 correct), partBPrompt ("Which detail/sentence best supports the answer to Part A?"), partBOptions (4 options A-D with exact passage quotes and paragraphRef, 1 correct).
- For "hot_text": include hotTextSegments (3–5 verbatim sentences or phrases from the passage with paragraphRef, 1 or 2 marked isCorrect=true) and set selectionCount.
- For "table_match": include tableMatch { columns: [{id, label}...], rows: [{id, statement, correctColumnIds, rationale}...] } with 2–3 columns and 3 rows.

Every item MUST include:
- benchmarkCode (exact code from the list above)
- cognitiveSkill (specific skill measured)
- dok (1, 2, or 3)
- correctAnswerSummary
- correctRationale
- textualEvidenceQuote (verbatim sentence/phrase from the passage)
- evidenceParagraphRef (1-based integer)

PASSAGE:
${numberedPassage}`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          systemInstruction:
            'You are a Florida elementary ELA assessment specialist creating original Grade K-5 practice items aligned strictly to Florida B.E.S.T. Standards and FAST Test Design Specifications. Every item must measure the exact cognitive demand of the benchmark, provide plausible distractors with misconception rationales, and cite exact verbatim passage evidence.',
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              items: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    itemType: { type: Type.STRING },
                    benchmarkCode: { type: Type.STRING },
                    cognitiveSkill: { type: Type.STRING },
                    dok: { type: Type.INTEGER },
                    prompt: { type: Type.STRING },
                    selectionCount: { type: Type.INTEGER },
                    options: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          text: { type: Type.STRING },
                          isCorrect: { type: Type.BOOLEAN },
                          rationale: { type: Type.STRING },
                          paragraphRef: { type: Type.INTEGER },
                        },
                      },
                    },
                    partAPrompt: { type: Type.STRING },
                    partAOptions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          text: { type: Type.STRING },
                          isCorrect: { type: Type.BOOLEAN },
                          rationale: { type: Type.STRING },
                        },
                      },
                    },
                    partBPrompt: { type: Type.STRING },
                    partBOptions: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          label: { type: Type.STRING },
                          text: { type: Type.STRING },
                          isCorrect: { type: Type.BOOLEAN },
                          rationale: { type: Type.STRING },
                          paragraphRef: { type: Type.INTEGER },
                        },
                      },
                    },
                    hotTextSegments: {
                      type: Type.ARRAY,
                      items: {
                        type: Type.OBJECT,
                        properties: {
                          paragraphRef: { type: Type.INTEGER },
                          text: { type: Type.STRING },
                          isCorrect: { type: Type.BOOLEAN },
                          rationale: { type: Type.STRING },
                        },
                      },
                    },
                    tableMatch: {
                      type: Type.OBJECT,
                      properties: {
                        columns: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              id: { type: Type.STRING },
                              label: { type: Type.STRING },
                            },
                          },
                        },
                        rows: {
                          type: Type.ARRAY,
                          items: {
                            type: Type.OBJECT,
                            properties: {
                              id: { type: Type.STRING },
                              statement: { type: Type.STRING },
                              correctColumnIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                              rationale: { type: Type.STRING },
                            },
                          },
                        },
                      },
                    },
                    correctAnswerSummary: { type: Type.STRING },
                    correctRationale: { type: Type.STRING },
                    textualEvidenceQuote: { type: Type.STRING },
                    evidenceParagraphRef: { type: Type.INTEGER },
                  },
                  required: [
                    'itemType',
                    'benchmarkCode',
                    'cognitiveSkill',
                    'dok',
                    'prompt',
                    'correctAnswerSummary',
                    'correctRationale',
                    'textualEvidenceQuote',
                    'evidenceParagraphRef',
                  ],
                },
              },
            },
            required: ['items'],
          },
        },
      });

      const parsed = safeParseJson<{ items: Record<string, unknown>[] }>(response.text);
      const items = (parsed.items ?? []).map((raw, idx) =>
        buildNormalizedItem(
          raw,
          passage,
          targetBenchmarks[idx % targetBenchmarks.length].code,
          requestedTypes[idx % requestedTypes.length],
          rigor
        )
      );

      const state = await readWorkspace();
      for (const item of items) {
        state.items.unshift(item);
      }
      await writeWorkspace(state);

      res.json({ items });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate assessment items.',
      });
    }
  });

  app.post('/api/regenerate-item', async (req, res) => {
    try {
      const { passage, benchmarkCode, itemType, rigor, previousPrompt } = req.body as {
        passage: ReadingPassage;
        benchmarkCode: string;
        itemType: FastItemType;
        rigor: CognitiveRigor;
        previousPrompt?: string;
      };

      const ai = getAiClient();
      if (!ai) {
        res.status(503).json({ error: 'Server Gemini API key is not configured.' });
        return;
      }

      const bench = BENCHMARKS_BY_CODE[benchmarkCode] ?? BENCHMARKS_BY_CODE['ELA.K12.EE.1.1'];
      const numberedPassage = passage.sections
        .map((sec) => {
          const paras = sec.paragraphs.map((p, idx) => `[P${idx + 1}] ${p}`).join('\n');
          return `=== ${sec.label}: ${sec.title} ===\n${paras}`;
        })
        .join('\n\n');

      const prompt = `Create 1 brand-new, distinct Grade ${passage.grade} ${FAST_ITEM_TYPE_INFO[itemType].label} item assessing ${bench.code}: "${bench.officialText}".
Do NOT repeat the angle or stem of this previous question: "${previousPrompt ?? 'N/A'}".
Cognitive Rigor: ${rigor}.
${FAST_ITEM_TYPE_INFO[itemType].description}
Cite exact verbatim textual evidence from the passage.

PASSAGE:
${numberedPassage}`;

      const response = await ai.models.generateContent({
        model: GEMINI_MODEL,
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              itemType: { type: Type.STRING },
              benchmarkCode: { type: Type.STRING },
              cognitiveSkill: { type: Type.STRING },
              dok: { type: Type.INTEGER },
              prompt: { type: Type.STRING },
              selectionCount: { type: Type.INTEGER },
              options: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    text: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN },
                    rationale: { type: Type.STRING },
                  },
                },
              },
              partAPrompt: { type: Type.STRING },
              partAOptions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    text: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN },
                    rationale: { type: Type.STRING },
                  },
                },
              },
              partBPrompt: { type: Type.STRING },
              partBOptions: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    label: { type: Type.STRING },
                    text: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN },
                    rationale: { type: Type.STRING },
                    paragraphRef: { type: Type.INTEGER },
                  },
                },
              },
              hotTextSegments: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    paragraphRef: { type: Type.INTEGER },
                    text: { type: Type.STRING },
                    isCorrect: { type: Type.BOOLEAN },
                    rationale: { type: Type.STRING },
                  },
                },
              },
              tableMatch: {
                type: Type.OBJECT,
                properties: {
                  columns: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: { id: { type: Type.STRING }, label: { type: Type.STRING } },
                    },
                  },
                  rows: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        id: { type: Type.STRING },
                        statement: { type: Type.STRING },
                        correctColumnIds: { type: Type.ARRAY, items: { type: Type.STRING } },
                        rationale: { type: Type.STRING },
                      },
                    },
                  },
                },
              },
              correctAnswerSummary: { type: Type.STRING },
              correctRationale: { type: Type.STRING },
              textualEvidenceQuote: { type: Type.STRING },
              evidenceParagraphRef: { type: Type.INTEGER },
            },
          },
        },
      });

      const raw = safeParseJson<Record<string, unknown>>(response.text);
      const item = buildNormalizedItem(raw, passage, bench.code, itemType, rigor);
      res.json({ item });
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to regenerate item.',
      });
    }
  });

  app.post('/api/generate-bellringer', async (req, res) => {
    try {
      const body = req.body as {
        grade?: string;
        benchmarkCode?: string;
        purpose?: string;
        questionType?: string;
        variantIndex?: number;
        excludeTitles?: string[];
        excludePrompts?: string[];
      };

      const validGrades: GradeLevel[] = ['K', '1', '2', '3', '4', '5'];
      const grade: GradeLevel = validGrades.includes(body.grade as GradeLevel)
        ? (body.grade as GradeLevel)
        : '4';
      const gradeLabel = formatGradeLabel(grade);

      const validPurposes: BellringerPurpose[] = ['review', 'activate', 'introduce', 'reinforce'];
      const purpose: BellringerPurpose = validPurposes.includes(body.purpose as BellringerPurpose)
        ? (body.purpose as BellringerPurpose)
        : 'review';

      const validTypes: BellringerQuestionType[] = [
        'multiple_choice',
        'grammar_editing',
        'short_response',
        'mixed',
      ];
      const questionType: BellringerQuestionType = validTypes.includes(
        body.questionType as BellringerQuestionType
      )
        ? (body.questionType as BellringerQuestionType)
        : 'multiple_choice';

      const bench =
        (body.benchmarkCode && BENCHMARKS_BY_CODE[body.benchmarkCode]) ||
        BENCHMARKS_BY_CODE[`ELA.${grade}.F.1.3`] ||
        BENCHMARKS_BY_CODE[`ELA.${grade}.V.1.3`] ||
        BENCHMARKS_BY_CODE[`ELA.${grade}.R.2.2`];

      const variantIndex = typeof body.variantIndex === 'number' ? body.variantIndex : 0;
      const excludeTitles = Array.isArray(body.excludeTitles)
        ? body.excludeTitles.filter((t): t is string => typeof t === 'string')
        : [];
      const excludePrompts = Array.isArray(body.excludePrompts)
        ? body.excludePrompts.filter((p): p is string => typeof p === 'string')
        : [];

      const ai = getAiClient();
      if (!ai || !bench) {
        const fallback = buildFallbackBellringer({
          grade,
          benchmarkCode: bench?.code ?? `ELA.${grade}.V.1.3`,
          purpose,
          questionType,
          variantIndex,
          excludeTitles,
        });
        res.json({ bellringer: fallback });
        return;
      }

      const requirePassage = needsSourcePassage(bench.code, questionType);
      const purposeLabel = getPurposeLabel(purpose);
      const questionTypeLabel = getQuestionTypeLabel(questionType);
      const clarificationsText =
        bench.clarifications.length > 0 ? bench.clarifications.join(' ') : 'None provided.';
      const priorBench =
        purpose === 'activate' ? getPriorKnowledgePrerequisite(bench.code, grade) : undefined;
      const bridgeMeta = buildPriorKnowledgeBridgeMeta(grade, bench, purpose);

      const priorKnowledgePromptSection =
        purpose === 'activate' && priorBench
          ? `\nPRIOR KNOWLEDGE PREREQUISITE STANDARD (${formatGradeLabel(priorBench.grade).toUpperCase()} -> BRIDGING TO ${gradeLabel.toUpperCase()}):
- Prerequisite Code: ${priorBench.code}
- Prerequisite Title: ${priorBench.benchmarkTitle}
- Official Text: "${priorBench.officialText}"
- Prerequisite Clarifications: ${priorBench.clarifications.length > 0 ? priorBench.clarifications.join(' ') : 'None provided.'}
ACTIVATE PRIOR KNOWLEDGE BRIDGE RULES:
- Question 1 MUST explicitly activate students' prior knowledge from ${formatGradeLabel(priorBench.grade)} (${priorBench.code}) as an approachable entry point.
- Question 2 (and Question 3 if no passage is used) MUST bridge from ${priorBench.code} into the target ${gradeLabel} standard (${bench.code}).
- In each teacher explanation, explicitly note how the question connects ${formatGradeLabel(priorBench.grade)} (${priorBench.code}) to ${gradeLabel} (${bench.code}).\n`
          : purpose === 'activate' && grade === 'K'
            ? `\nACTIVATE PRIOR KNOWLEDGE (KINDERGARTEN):
- Do NOT invent any Pre-K standard code.
- Question 1 should activate everyday spoken language, listening story sense, or environmental print awareness before bridging into ${bench.code}.\n`
            : '';

      const foundationalGuidance =
        bench.strand === 'F'
          ? `\nFOUNDATIONAL READING STANDARD GUIDANCE (${bench.code}):
- F.1.1 (Print Concepts): Focus on book/print navigation (K: letters vs. words, spaces, directionality, front/back cover, upper/lowercase; Grade 1: title, author, illustrator, table of contents, glossary).
- F.1.2 (Phonological Awareness): Keep strictly focused on SPOKEN sound patterns (rhymes, syllables, onset-rime, blending/segmenting/deleting/substituting phonemes).
- F.1.3 (Phonics & Word Analysis): Align to the exact grade's decoding scope (K: CVC short/long vowels; Gr 1: digraphs, blends, r-controlled, final -e, vowel teams, inflections; Gr 2: diphthongs, open/closed/-Cle, silent letters, affixes; Gr 3-5: roots, derivational suffixes, multisyllabic decoding).
- F.1.4 (Fluency): For Kindergarten, assess automatic recognition of high-frequency sight words; for Grades 1-5, pair a brief 45-90 word connected text with questions checking phrasing, punctuation prosody, expression, or self-correction.\n`
          : '';

      const passageWordTarget =
        grade === 'K' || grade === '1'
          ? '40–70 words'
          : grade === '2'
            ? '55–85 words'
            : '65–110 words';

      const formatRules =
        questionType === 'multiple_choice'
          ? 'All questions must use format "multiple_choice" with exactly 4 options labeled A, B, C, D and 1 correct option.'
          : questionType === 'grammar_editing'
            ? 'All questions must use format "grammar_editing" with a sentence to edit (targetSentence) and either 4 editing choices (A-D) OR a concise sentence revision task.'
            : questionType === 'short_response'
              ? 'All questions must use format "short_response" with no options array; each answer must require only 1–2 sentences (maxSentences: 2).'
              : 'Mix formats appropriately across questions (e.g., 1 multiple_choice or grammar_editing question plus 1 short_response question limited to 1–2 sentences).';

      const exclusionClause =
        excludeTitles.length > 0 || excludePrompts.length > 0
          ? `\nDO NOT repeat or closely imitate these prior titles: ${excludeTitles.join(' | ') || 'none'}.\nDO NOT reuse these prior question stems: ${excludePrompts.join(' | ') || 'none'}.`
          : '';

      const prompt = `You are a Florida elementary ELA instructional coach creating an independent 5-MINUTE classroom bellringer (warm-up / do-now) for ${gradeLabel}.

TARGET FLORIDA B.E.S.T. STANDARD (ONLY THIS ONE TARGET STANDARD):
- Code: ${bench.code}
- Title: ${bench.benchmarkTitle}
- Official Text: "${bench.officialText}"
- Official Clarifications: ${clarificationsText}
${priorKnowledgePromptSection}${foundationalGuidance}
TEACHER SELECTIONS:
- Instructional Purpose: ${purposeLabel}
- Question Type: ${questionTypeLabel}
- Strict Time Budget: Students must complete the entire bellringer independently in ~5 minutes.

STRUCTURE & LENGTH RULES:
${
  requirePassage
    ? '- Include a brief, engaging, original ' +
      gradeLabel +
      ' sourceText (strictly ' +
      passageWordTarget +
      '; NEVER exceed 120 words) that directly supports the standard.\n- Generate EXACTLY 2 focused questions directly tied to the sourceText and ' +
      bench.code +
      '.'
    : '- Do NOT include a long reading passage (omit sourceText or leave empty) so students stay focused on discrete sentence/word/sound work.\n- Generate EXACTLY 3 short, focused questions aligned to ' +
      bench.code +
      '.'
}
- ${formatRules}
- Every question must include:
  * "prompt": crisp, grade-appropriate student question
  * "correctAnswer": exact right answer (e.g., "B. ..." for MC or model 1–2 sentence response)
  * "explanation": clear teacher explanation of why the answer is right (and why distractors are wrong when MC)
  * "textualEvidence": exact quote from sourceText or targetSentence when applicable
- Keep directions concise and student-friendly.${exclusionClause}`;

      try {
        const response = await ai.models.generateContent({
          model: GEMINI_MODEL,
          contents: prompt,
          config: {
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                directions: { type: Type.STRING },
                sourceTextLabel: { type: Type.STRING },
                sourceText: { type: Type.STRING },
                questions: {
                  type: Type.ARRAY,
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      format: { type: Type.STRING },
                      prompt: { type: Type.STRING },
                      targetSentence: { type: Type.STRING },
                      options: {
                        type: Type.ARRAY,
                        items: {
                          type: Type.OBJECT,
                          properties: {
                            label: { type: Type.STRING },
                            text: { type: Type.STRING },
                            isCorrect: { type: Type.BOOLEAN },
                            rationale: { type: Type.STRING },
                          },
                          required: ['label', 'text', 'isCorrect'],
                        },
                      },
                      correctAnswer: { type: Type.STRING },
                      explanation: { type: Type.STRING },
                      textualEvidence: { type: Type.STRING },
                      maxSentences: { type: Type.INTEGER },
                    },
                    required: ['format', 'prompt', 'correctAnswer', 'explanation'],
                  },
                },
              },
              required: ['title', 'directions', 'questions'],
            },
          },
        });

        const parsed = safeParseJson<{
          title?: string;
          directions?: string;
          sourceTextLabel?: string;
          sourceText?: string;
          questions?: Record<string, unknown>[];
        }>(response.text);

        const rawQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
        if (rawQuestions.length === 0) {
          throw new Error('Model returned zero bellringer questions.');
        }

        const normalizedQuestions: BellringerQuestion[] = rawQuestions.map((rq, idx) => {
          const rawFmt = String(rq.format ?? '');
          const format: BellringerQuestionFormat =
            rawFmt === 'grammar_editing' || rawFmt === 'short_response' || rawFmt === 'multiple_choice'
              ? rawFmt
              : questionType === 'short_response'
                ? 'short_response'
                : questionType === 'grammar_editing'
                  ? 'grammar_editing'
                  : 'multiple_choice';

          const rawOptions = Array.isArray(rq.options)
            ? (rq.options as Record<string, unknown>[])
            : [];
          const options: BellringerOption[] | undefined =
            rawOptions.length >= 2 && format !== 'short_response'
              ? rawOptions.slice(0, 4).map((opt, optIdx) => ({
                  id: `opt-${idx + 1}-${optIdx + 1}`,
                  label: String(opt.label ?? ['A', 'B', 'C', 'D'][optIdx] ?? `${optIdx + 1}`),
                  text: String(opt.text ?? ''),
                  isCorrect: Boolean(opt.isCorrect),
                  rationale: opt.rationale ? String(opt.rationale) : undefined,
                }))
              : undefined;

          return {
            id: `br-q-${Date.now()}-${idx + 1}`,
            number: idx + 1,
            format,
            prompt: String(rq.prompt ?? ''),
            targetSentence: rq.targetSentence ? String(rq.targetSentence) : undefined,
            options,
            correctAnswer: String(rq.correctAnswer ?? ''),
            explanation: String(rq.explanation ?? ''),
            textualEvidence: rq.textualEvidence ? String(rq.textualEvidence) : undefined,
            maxSentences:
              format === 'short_response'
                ? Math.min(2, Number(rq.maxSentences ?? 2) || 2)
                : undefined,
          };
        });

        const rawActivity: BellringerActivity = {
          id: `bellringer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          title: parsed.title?.trim() || `${bench.benchmarkTitle} Warm-Up`,
          grade,
          benchmarkCode: bench.code,
          officialBenchmarkText: bench.officialText,
          benchmarkTitle: bench.benchmarkTitle,
          sourceCitation: `${bench.sourceTitle}, PDF p. ${bench.pdfPage}`,
          ...bridgeMeta,
          purpose,
          purposeLabel,
          questionType,
          questionTypeLabel,
          estimatedTimeLabel: 'Approximately 5 minutes',
          directions:
            parsed.directions?.trim() ||
            'Read carefully and complete each question in approximately 5 minutes.',
          sourceText: parsed.sourceText?.trim() || undefined,
          sourceTextLabel:
            parsed.sourceTextLabel?.trim() ||
            (parsed.sourceText?.trim() ? 'Mini-Passage' : undefined),
          questions: normalizedQuestions,
          timeAudit: {
            estimatedMinutes: 5,
            estimatedSeconds: 260,
            passageWordCount: 0,
            wasAutoTrimmed: false,
            trimNotes: [],
          },
          practiceDisclaimer: PRACTICE_DISCLAIMER,
          createdAt: new Date().toISOString(),
          sourceMode: 'ai-generated',
        };

        const audited = enforceFiveMinuteBudget(rawActivity);
        res.json({ bellringer: audited });
      } catch {
        const fallback = buildFallbackBellringer({
          grade,
          benchmarkCode: bench.code,
          purpose,
          questionType,
          variantIndex,
          excludeTitles,
        });
        res.json({ bellringer: fallback });
      }
    } catch (error) {
      res.status(500).json({
        error: error instanceof Error ? error.message : 'Failed to generate bellringer.',
      });
    }
  });

  // =========================================================
  // VITE / STATIC SERVING
  // =========================================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Florida ELA Assessment Studio server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
