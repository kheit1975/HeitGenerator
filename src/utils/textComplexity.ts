import type {
  GradeLevel,
  PassageSection,
  QualitativeComplexityAnalysis,
  TextComplexityAnalysis,
  VocabularyComplexityOption,
  VocabularyWord,
} from '../types/ela.ts';

export interface OfficialComplexityBand {
  bandId: 'K-1' | '2-3' | '4-5';
  label: string;
  fkMin: number;
  fkMax: number;
  fkDisplay: string;
  lexileMin: number;
  lexileMax: number;
  lexileDisplay: string;
  sourceCitation: string;
}

export const OFFICIAL_COMPLEXITY_BANDS: Record<GradeLevel, OfficialComplexityBand> = {
  K: {
    bandId: 'K-1',
    label: 'K–1st Grade Band',
    fkMin: -1.3,
    fkMax: 2.18,
    fkDisplay: '-1.3 – 2.18',
    lexileMin: 0,
    lexileMax: 430,
    lexileDisplay: 'BR – 430L',
    sourceCitation: 'Florida B.E.S.T. Standards: ELA (2025), Appendix B, p. 148',
  },
  '1': {
    bandId: 'K-1',
    label: 'K–1st Grade Band',
    fkMin: -1.3,
    fkMax: 2.18,
    fkDisplay: '-1.3 – 2.18',
    lexileMin: 0,
    lexileMax: 430,
    lexileDisplay: 'BR – 430L',
    sourceCitation: 'Florida B.E.S.T. Standards: ELA (2025), Appendix B, p. 148',
  },
  '2': {
    bandId: '2-3',
    label: '2nd–3rd Grade Band',
    fkMin: 1.98,
    fkMax: 5.34,
    fkDisplay: '1.98 – 5.34',
    lexileMin: 420,
    lexileMax: 820,
    lexileDisplay: '420L – 820L',
    sourceCitation: 'Florida B.E.S.T. Standards: ELA (2025), Appendix B, p. 148',
  },
  '3': {
    bandId: '2-3',
    label: '2nd–3rd Grade Band',
    fkMin: 1.98,
    fkMax: 5.34,
    fkDisplay: '1.98 – 5.34',
    lexileMin: 420,
    lexileMax: 820,
    lexileDisplay: '420L – 820L',
    sourceCitation: 'Florida B.E.S.T. Standards: ELA (2025), Appendix B, p. 148',
  },
  '4': {
    bandId: '4-5',
    label: '4th–5th Grade Band',
    fkMin: 4.51,
    fkMax: 7.73,
    fkDisplay: '4.51 – 7.73',
    lexileMin: 740,
    lexileMax: 1010,
    lexileDisplay: '740L – 1010L',
    sourceCitation: 'Florida B.E.S.T. Standards: ELA (2025), Appendix B, p. 148',
  },
  '5': {
    bandId: '4-5',
    label: '4th–5th Grade Band',
    fkMin: 4.51,
    fkMax: 7.73,
    fkDisplay: '4.51 – 7.73',
    lexileMin: 740,
    lexileMax: 1010,
    lexileDisplay: '740L – 1010L',
    sourceCitation: 'Florida B.E.S.T. Standards: ELA (2025), Appendix B, p. 148',
  },
};

export function countSyllablesInWord(rawWord: string): number {
  const cleaned = rawWord.toLowerCase().replace(/[^a-z]/g, '');
  if (!cleaned) return 0;
  if (cleaned.length <= 3) return 1;

  let word = cleaned
    .replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
    .replace(/^y/, '');

  const vowelGroups = word.match(/[aeiouy]{1,2}/g);
  const count = vowelGroups ? vowelGroups.length : 1;
  return Math.max(1, count);
}

export function extractWordsAndSentences(text: string): {
  words: string[];
  sentences: string[];
} {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return { words: [], sentences: [] };
  }

  const sentences = normalized
    .split(/(?<=[.!?]["”’')\]]*)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0 && /[a-zA-Z0-9]/.test(s));

  const words = normalized
    .split(/\s+/)
    .map((w) => w.replace(/^[^a-zA-Z0-9]+|[^a-zA-Z0-9'-]+$/g, ''))
    .filter((w) => w.length > 0 && /[a-zA-Z0-9]/.test(w));

  return {
    words,
    sentences: sentences.length > 0 ? sentences : [normalized],
  };
}

/**
 * Maps measurable syntactic/lexical variables to an estimated Lexile value
 * calibrated alongside Florida B.E.S.T. Appendix B Flesch-Kincaid & Lexile bands:
 * K-1 (FK -1.3-2.18 -> BR-430L), 2-3 (FK 1.98-5.34 -> 420-820L), 4-5 (FK 4.51-7.73 -> 740-1010L).
 */
export function estimateLexileFromMetrics(
  fkGrade: number,
  avgWordsPerSentence: number,
  longWordPercentage: number
): number {
  // Piece-wise monotonic calibration aligned with B.E.S.T. Appendix B anchor points:
  // FK 1.0 -> ~310L; FK 2.0 -> ~430L; FK 3.5 -> ~620L; FK 5.0 -> ~790L; FK 6.5 -> ~910L; FK 7.7 -> ~1000L.
  let baseLexile = 190 + fkGrade * 120;
  if (fkGrade > 5.0) {
    baseLexile = 790 + (fkGrade - 5.0) * 78;
  }
  const sentenceAdjustment = (avgWordsPerSentence - 13) * 5;
  const lexicalAdjustment = (longWordPercentage - 12) * 3;
  const raw = Math.round((baseLexile + sentenceAdjustment + lexicalAdjustment) / 10) * 10;
  return Math.max(100, Math.min(1350, raw));
}

export function buildDefaultQualitativeAnalysis(
  grade: GradeLevel,
  avgWordsPerSentence: number,
  longWordPercentage: number,
  textType: 'literary' | 'informational' | 'paired',
  fkGrade: number
): QualitativeComplexityAnalysis {
  const band = OFFICIAL_COMPLEXITY_BANDS[grade];
  const tier: 'Low' | 'Mid' | 'High' =
    fkGrade <= band.fkMin + (band.fkMax - band.fkMin) * 0.35
      ? 'Low'
      : fkGrade <= band.fkMin + (band.fkMax - band.fkMin) * 0.78
      ? 'Mid'
      : 'High';

  const genreLabel =
    textType === 'literary'
      ? 'narrative prose'
      : textType === 'paired'
      ? 'paired literary and informational texts'
      : 'informational text';

  const gradeLabel = grade === 'K' ? 'Kindergarten' : `Grade ${grade}`;

  return {
    complexityTier: tier,
    meaningAndPurpose:
      tier === 'Low'
        ? `Clear, explicit central ideas or plot progression appropriate for ${genreLabel} in ${gradeLabel}, with straightforward themes and direct transitions.`
        : tier === 'Mid'
        ? `Blends explicit facts or events with implied relationships, requiring ${gradeLabel} readers to connect details across paragraphs to explain purpose or theme.`
        : `Layered meaning and nuanced authorial choices in ${genreLabel}, inviting close reading and multi-paragraph textual evidence.`,
    languageClarityAndVocabulary:
      longWordPercentage >= 18
        ? `Incorporates domain-specific academic terms and multisyllabic words (${longWordPercentage}% 3+ syllables); context clues and morphological supports help ${gradeLabel} readers unlock meaning.`
        : `Accessible, clear diction with targeted Tier 2/Tier 3 academic vocabulary (${longWordPercentage}% 3+ syllables) suitable for independent ${gradeLabel} comprehension.`,
    sentenceStructureAndOrganization:
      avgWordsPerSentence >= 15
        ? `Varied simple, compound, and complex sentence structures averaging ${avgWordsPerSentence} words per sentence with clear paragraph sequencing.`
        : `Well-paced sentence structure averaging ${avgWordsPerSentence} words per sentence, supporting fluency and clear text organization for ${gradeLabel}.`,
    knowledgeDemands:
      textType === 'informational'
        ? `Self-contained background explanations ensure ${gradeLabel} students can answer evidence-based questions directly from the passage without outside prerequisite knowledge.`
        : `Relatable age-appropriate experiences and clearly established setting cues minimize extraneous background knowledge barriers.`,
    instructionalRecommendation:
      tier === 'High'
        ? `Pair with guided annotation or chunked paragraph checks when used as an independent practice task in ${gradeLabel}.`
        : `Well suited for independent ${gradeLabel} cold-read practice, small-group close reading, and evidence-based item practice.`,
  };
}

export function analyzePassageComplexity(
  sections: PassageSection[],
  grade: GradeLevel,
  textType: 'literary' | 'informational' | 'paired',
  qualitativeOverride?: Partial<QualitativeComplexityAnalysis>
): TextComplexityAnalysis {
  const allParagraphs = sections.flatMap((s) => s.paragraphs);
  const fullText = allParagraphs.join(' ');
  const { words, sentences } = extractWordsAndSentences(fullText);

  const wordCount = words.length;
  const sentenceCount = Math.max(1, sentences.length);
  const paragraphCount = allParagraphs.length;

  let syllableCount = 0;
  let longWordCount = 0;
  for (const word of words) {
    const syl = countSyllablesInWord(word);
    syllableCount += syl;
    if (syl >= 3) {
      longWordCount += 1;
    }
  }

  const avgWordsPerSentence = Number((wordCount / sentenceCount).toFixed(1));
  const avgSyllablesPerWord = wordCount > 0 ? Number((syllableCount / wordCount).toFixed(2)) : 1.3;
  const longWordPercentage =
    wordCount > 0 ? Math.round((longWordCount / wordCount) * 100) : 0;

  // Standard Flesch-Kincaid Grade Level formula
  const rawFk =
    wordCount > 0
      ? 0.39 * (wordCount / sentenceCount) + 11.8 * (syllableCount / wordCount) - 15.59
      : 1.0;
  const fleschKincaidGrade = Number(Math.max(-1.0, Math.min(12.0, rawFk)).toFixed(2));

  const estimatedLexile = estimateLexileFromMetrics(
    fleschKincaidGrade,
    avgWordsPerSentence,
    longWordPercentage
  );
  const estimatedLexileLabel = estimatedLexile <= 200 ? 'BR200L' : `${estimatedLexile}L`;

  const band = OFFICIAL_COMPLEXITY_BANDS[grade];
  const inLexileBand = estimatedLexile >= band.lexileMin && estimatedLexile <= band.lexileMax;

  let gradeAppropriateStatus: TextComplexityAnalysis['gradeAppropriateStatus'];
  let gradeAppropriatenessExplanation: string;

  if (inLexileBand) {
    gradeAppropriateStatus = 'Within Grade Band';
    gradeAppropriatenessExplanation = `Estimated Lexile (${estimatedLexileLabel}) aligns with Florida B.E.S.T. Appendix B expectations for the ${band.label} (${band.lexileDisplay}).`;
  } else if (estimatedLexile < band.lexileMin) {
    gradeAppropriateStatus = 'Approaching Band (Accessible)';
    gradeAppropriatenessExplanation = `Estimated Lexile (${estimatedLexileLabel}) sits slightly below the ${band.label} quantitative floor (${band.lexileDisplay}), making it accessible for scaffolding or early-year PM1 practice.`;
  } else {
    const gradeLabel = grade === 'K' ? 'Kindergarten' : `Grade ${grade}`;
    gradeAppropriateStatus = 'Stretch Above Band';
    gradeAppropriatenessExplanation = `Estimated Lexile (${estimatedLexileLabel}) exceeds the ${band.label} ceiling (${band.lexileDisplay}); consider teacher scaffolding or shortening multi-clause sentences for independent ${gradeLabel} reading.`;
  }

  const defaultQual = buildDefaultQualitativeAnalysis(
    grade,
    avgWordsPerSentence,
    longWordPercentage,
    textType,
    fleschKincaidGrade
  );

  return {
    wordCount,
    sentenceCount,
    paragraphCount,
    syllableCount,
    avgWordsPerSentence,
    avgSyllablesPerWord,
    longWordPercentage,
    fleschKincaidGrade,
    estimatedLexile,
    estimatedLexileLabel,
    officialBandLabel: band.label,
    officialLexileRange: band.lexileDisplay,
    officialFkRange: band.fkDisplay,
    gradeAppropriateStatus,
    gradeAppropriatenessExplanation,
    qualitative: {
      complexityTier: qualitativeOverride?.complexityTier ?? defaultQual.complexityTier,
      meaningAndPurpose: qualitativeOverride?.meaningAndPurpose ?? defaultQual.meaningAndPurpose,
      languageClarityAndVocabulary:
        qualitativeOverride?.languageClarityAndVocabulary ?? defaultQual.languageClarityAndVocabulary,
      sentenceStructureAndOrganization:
        qualitativeOverride?.sentenceStructureAndOrganization ??
        defaultQual.sentenceStructureAndOrganization,
      knowledgeDemands: qualitativeOverride?.knowledgeDemands ?? defaultQual.knowledgeDemands,
      instructionalRecommendation:
        qualitativeOverride?.instructionalRecommendation ?? defaultQual.instructionalRecommendation,
    },
  };
}

export interface TargetLexileProfile {
  grade: GradeLevel;
  vocabularyComplexity: VocabularyComplexityOption;
  bandMin: number;
  bandMax: number;
  targetMin: number;
  targetMax: number;
  targetDisplay: string;
  avgWordsPerSentenceRange: string;
  maxSentenceWords: number;
  avgSyllablesNote: string;
}

function formatLexileBound(lexile: number): string {
  return lexile <= 200 ? 'BR200L' : `${lexile}L`;
}

const TARGET_LEXILE_MATRIX: Record<
  GradeLevel,
  Record<VocabularyComplexityOption, Omit<TargetLexileProfile, 'grade' | 'vocabularyComplexity' | 'bandMin' | 'bandMax' | 'targetDisplay'>>
> = {
  K: {
    foundational: {
      targetMin: 100,
      targetMax: 250,
      avgWordsPerSentenceRange: '5–7 words',
      maxSentenceWords: 9,
      avgSyllablesNote: 'mostly 1-syllable decodable words (~1.08–1.14 syllables/word, <3% 3+ syllable words)',
    },
    'on-grade': {
      targetMin: 150,
      targetMax: 320,
      avgWordsPerSentenceRange: '6–8 words',
      maxSentenceWords: 10,
      avgSyllablesNote: 'mostly 1- and 2-syllable words (~1.12–1.18 syllables/word, <=4% 3+ syllable words)',
    },
    stretch: {
      targetMin: 260,
      targetMax: 420,
      avgWordsPerSentenceRange: '7–9 words',
      maxSentenceWords: 11,
      avgSyllablesNote: 'simple 1- to 2-syllable words with occasional familiar 3-syllable words (~1.16–1.22 syllables/word)',
    },
  },
  '1': {
    foundational: {
      targetMin: 160,
      targetMax: 300,
      avgWordsPerSentenceRange: '6–8 words',
      maxSentenceWords: 10,
      avgSyllablesNote: 'mostly 1- and 2-syllable words (~1.12–1.17 syllables/word, <=3% 3+ syllable words)',
    },
    'on-grade': {
      targetMin: 230,
      targetMax: 400,
      avgWordsPerSentenceRange: '7–9 words',
      maxSentenceWords: 11,
      avgSyllablesNote: 'mostly 1- and 2-syllable words (~1.16–1.22 syllables/word, <=5% 3+ syllable words)',
    },
    stretch: {
      targetMin: 330,
      targetMax: 430,
      avgWordsPerSentenceRange: '8–10 words',
      maxSentenceWords: 12,
      avgSyllablesNote: 'clear 1- to 2-syllable diction with a few context-supported 3-syllable words (~1.19–1.25 syllables/word)',
    },
  },
  '2': {
    foundational: {
      targetMin: 420,
      targetMax: 540,
      avgWordsPerSentenceRange: '8–10 words',
      maxSentenceWords: 13,
      avgSyllablesNote: 'clear everyday vocabulary (~1.20–1.26 syllables/word, <=5% 3+ syllable words)',
    },
    'on-grade': {
      targetMin: 460,
      targetMax: 650,
      avgWordsPerSentenceRange: '9–11 words',
      maxSentenceWords: 14,
      avgSyllablesNote: 'accessible Tier 2 words (~1.23–1.29 syllables/word, <=7% 3+ syllable words)',
    },
    stretch: {
      targetMin: 580,
      targetMax: 760,
      avgWordsPerSentenceRange: '10–12 words',
      maxSentenceWords: 15,
      avgSyllablesNote: 'rich Tier 2 words with context support (~1.27–1.34 syllables/word, ~7–10% 3+ syllable words)',
    },
  },
  '3': {
    foundational: {
      targetMin: 450,
      targetMax: 590,
      avgWordsPerSentenceRange: '9–11 words',
      maxSentenceWords: 14,
      avgSyllablesNote: 'straightforward vocabulary (~1.22–1.28 syllables/word, <=6% 3+ syllable words)',
    },
    'on-grade': {
      targetMin: 540,
      targetMax: 750,
      avgWordsPerSentenceRange: '10–12 words',
      maxSentenceWords: 15,
      avgSyllablesNote: 'grade-level Tier 2/3 terms (~1.27–1.35 syllables/word, ~6–10% 3+ syllable words)',
    },
    stretch: {
      targetMin: 680,
      targetMax: 820,
      avgWordsPerSentenceRange: '11–13 words',
      maxSentenceWords: 16,
      avgSyllablesNote: 'elevated Tier 2/3 terms with context clues (~1.33–1.40 syllables/word, ~9–13% 3+ syllable words)',
    },
  },
  '4': {
    foundational: {
      targetMin: 740,
      targetMax: 840,
      avgWordsPerSentenceRange: '11–13 words',
      maxSentenceWords: 17,
      avgSyllablesNote: 'accessible Grade 4 academic phrasing (~1.34–1.40 syllables/word, ~8–12% 3+ syllable words)',
    },
    'on-grade': {
      targetMin: 780,
      targetMax: 930,
      avgWordsPerSentenceRange: '12–14 words',
      maxSentenceWords: 18,
      avgSyllablesNote: 'balanced Tier 2/3 academic vocabulary (~1.38–1.46 syllables/word, ~10–14% 3+ syllable words)',
    },
    stretch: {
      targetMin: 880,
      targetMax: 1010,
      avgWordsPerSentenceRange: '13–15 words',
      maxSentenceWords: 20,
      avgSyllablesNote: 'sophisticated domain/Tier 2 diction (~1.44–1.52 syllables/word, ~12–17% 3+ syllable words)',
    },
  },
  '5': {
    foundational: {
      targetMin: 760,
      targetMax: 870,
      avgWordsPerSentenceRange: '12–14 words',
      maxSentenceWords: 18,
      avgSyllablesNote: 'clear Grade 5 academic language (~1.36–1.42 syllables/word, ~9–13% 3+ syllable words)',
    },
    'on-grade': {
      targetMin: 820,
      targetMax: 960,
      avgWordsPerSentenceRange: '13–15 words',
      maxSentenceWords: 20,
      avgSyllablesNote: 'strong Grade 5 Tier 2/3 vocabulary (~1.40–1.48 syllables/word, ~11–15% 3+ syllable words)',
    },
    stretch: {
      targetMin: 900,
      targetMax: 1010,
      avgWordsPerSentenceRange: '14–16 words',
      maxSentenceWords: 22,
      avgSyllablesNote: 'complex academic syntax and morphology (~1.46–1.54 syllables/word, ~13–18% 3+ syllable words)',
    },
  },
};

export function getTargetLexileProfile(
  grade: GradeLevel,
  vocabularyComplexity: VocabularyComplexityOption = 'on-grade'
): TargetLexileProfile {
  const safeGrade: GradeLevel = TARGET_LEXILE_MATRIX[grade] ? grade : '3';
  const safeVocab: VocabularyComplexityOption =
    vocabularyComplexity === 'foundational' ||
    vocabularyComplexity === 'stretch' ||
    vocabularyComplexity === 'on-grade'
      ? vocabularyComplexity
      : 'on-grade';

  const band = OFFICIAL_COMPLEXITY_BANDS[safeGrade];
  const preset = TARGET_LEXILE_MATRIX[safeGrade][safeVocab];

  return {
    grade: safeGrade,
    vocabularyComplexity: safeVocab,
    bandMin: band.lexileMin,
    bandMax: band.lexileMax,
    targetMin: preset.targetMin,
    targetMax: preset.targetMax,
    targetDisplay: `${formatLexileBound(preset.targetMin)} – ${formatLexileBound(preset.targetMax)}`,
    avgWordsPerSentenceRange: preset.avgWordsPerSentenceRange,
    maxSentenceWords: preset.maxSentenceWords,
    avgSyllablesNote: preset.avgSyllablesNote,
  };
}

export function isWithinTargetLexile(lexile: number, profile: TargetLexileProfile): boolean {
  return lexile >= profile.targetMin && lexile <= profile.targetMax;
}

export function distanceToTargetLexile(lexile: number, profile: TargetLexileProfile): number {
  if (lexile < profile.targetMin) return profile.targetMin - lexile;
  if (lexile > profile.targetMax) return lexile - profile.targetMax;
  return 0;
}

export function isBetterLexileCandidate(
  candidate: TextComplexityAnalysis,
  currentBest: TextComplexityAnalysis,
  profile: TargetLexileProfile
): boolean {
  const candInBand =
    candidate.estimatedLexile >= profile.bandMin && candidate.estimatedLexile <= profile.bandMax;
  const bestInBand =
    currentBest.estimatedLexile >= profile.bandMin && currentBest.estimatedLexile <= profile.bandMax;

  if (candInBand !== bestInBand) {
    return candInBand;
  }

  const candDist = distanceToTargetLexile(candidate.estimatedLexile, profile);
  const bestDist = distanceToTargetLexile(currentBest.estimatedLexile, profile);
  if (candDist !== bestDist) {
    return candDist < bestDist;
  }

  const targetMid = (profile.targetMin + profile.targetMax) / 2;
  return (
    Math.abs(candidate.estimatedLexile - targetMid) <
    Math.abs(currentBest.estimatedLexile - targetMid)
  );
}

export function buildLexileRevisionInstruction(
  complexity: TextComplexityAnalysis,
  profile: TargetLexileProfile,
  grade: GradeLevel,
  wordRange: string
): string {
  const gradeLabel = grade === 'K' ? 'Kindergarten' : `Grade ${grade}`;
  const currentLexile = complexity.estimatedLexile;
  const tooHigh = currentLexile > profile.targetMax;
  const delta = tooHigh
    ? currentLexile - profile.targetMax
    : profile.targetMin - currentLexile;

  if (tooHigh) {
    return `LEXILE CALIBRATION ADJUSTMENT REQUIRED — LOWER READING COMPLEXITY:
Current draft measured at ${complexity.estimatedLexileLabel} (overshoots target ${profile.targetDisplay} by ~${delta}L).
Measured metrics: avg ${complexity.avgWordsPerSentence} words/sentence, ${complexity.avgSyllablesPerWord} syllables/word, ${complexity.longWordPercentage}% 3+ syllable words.

Rewrite the passage paragraphs to hit the target Lexile range (${profile.targetDisplay}) for ${gradeLabel}:
1. Target an average sentence length of ${profile.avgWordsPerSentenceRange} (keep nearly all sentences under ${profile.maxSentenceWords} words). Split long compound or multi-clause sentences into shorter, clear sentences.
2. Simplify multisyllabic phrasing (${profile.avgSyllablesNote}). Replace unnecessary 3- and 4-syllable abstract words (e.g., "utilize" -> "use", "demonstrate" -> "show", "significant" -> "important/major", "environment" -> "habitat/area" unless needed as a target science term) with crisp 1–2 syllable words.
3. Keep the core topic, accurate facts/plot, benchmark-aligned cues, section count/labels, and approximate total length (${wordRange}).
4. Update the 5–7 vocabularyGuide entries so every word and verbatim passageContextSentence accurately matches the revised paragraphs.`;
  }

  return `LEXILE CALIBRATION ADJUSTMENT REQUIRED — RAISE READING COMPLEXITY:
Current draft measured at ${complexity.estimatedLexileLabel} (falls below target ${profile.targetDisplay} by ~${delta}L).
Measured metrics: avg ${complexity.avgWordsPerSentence} words/sentence, ${complexity.avgSyllablesPerWord} syllables/word, ${complexity.longWordPercentage}% 3+ syllable words.

Rewrite the passage paragraphs to hit the target Lexile range (${profile.targetDisplay}) for ${gradeLabel}:
1. Target an average sentence length of ${profile.avgWordsPerSentenceRange} (up to ~${profile.maxSentenceWords} words for varied complex sentences). Combine choppy short sentences using natural subordinating conjunctions (because, although, while, since), transitions, or appositives.
2. Elevate diction (${profile.avgSyllablesNote}). Replace overly repetitive simple verbs/nouns with precise ${gradeLabel} Tier 2 academic words and domain terms supported by clear context clues.
3. Keep the core topic, accurate facts/plot, benchmark-aligned cues, section count/labels, and approximate total length (${wordRange}).
4. Update the 5–7 vocabularyGuide entries so every word and verbatim passageContextSentence accurately matches the revised paragraphs.`;
}

export function reconcileVocabularyContextSentences(
  sections: PassageSection[],
  vocabGuide: VocabularyWord[]
): VocabularyWord[] {
  const paragraphs = sections.flatMap((s) => s.paragraphs);
  if (paragraphs.length === 0 || vocabGuide.length === 0) {
    return vocabGuide;
  }

  const parsedParagraphs = paragraphs.map((p, idx) => ({
    paragraphRef: idx + 1,
    raw: p,
    sentences: extractWordsAndSentences(p).sentences,
  }));

  return vocabGuide.map((entry) => {
    const cleanedWord = entry.word.trim().toLowerCase();
    const stem = cleanedWord.replace(/[^a-z]/g, '').slice(0, Math.max(4, cleanedWord.length - 2));
    const currentIdx = Math.max(0, Math.min(paragraphs.length - 1, (entry.paragraphRef || 1) - 1));
    const quoted = entry.passageContextSentence?.trim() ?? '';

    // 1. Verbatim match in claimed paragraph
    if (quoted && parsedParagraphs[currentIdx]?.raw.includes(quoted)) {
      return entry;
    }

    // 2. Verbatim match in any other paragraph
    if (quoted) {
      const shifted = parsedParagraphs.find((p) => p.raw.includes(quoted));
      if (shifted) {
        return {
          ...entry,
          paragraphRef: shifted.paragraphRef,
        };
      }
    }

    // 3. Find exact sentence containing the word (or stem) closest to original paragraphRef
    const escapedWord = cleanedWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const exactRegex = escapedWord ? new RegExp(`\\b${escapedWord}\\b`, 'i') : null;
    const stemRegex = stem.length >= 4 ? new RegExp(`\\b${stem}[a-z]*`, 'i') : null;

    const orderedParagraphs = [...parsedParagraphs].sort(
      (a, b) => Math.abs(a.paragraphRef - (entry.paragraphRef || 1)) - Math.abs(b.paragraphRef - (entry.paragraphRef || 1))
    );

    for (const regex of [exactRegex, stemRegex]) {
      if (!regex) continue;
      for (const para of orderedParagraphs) {
        const matchedSentence = para.sentences.find((s) => regex.test(s));
        if (matchedSentence) {
          return {
            ...entry,
            paragraphRef: para.paragraphRef,
            passageContextSentence: matchedSentence.trim(),
          };
        }
      }
    }

    return entry;
  });
}
