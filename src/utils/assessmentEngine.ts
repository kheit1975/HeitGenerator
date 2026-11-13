import {
  BENCHMARKS_BY_CODE,
  FAST_ITEM_TYPE_INFO,
  FLORIDA_BENCHMARKS,
  REPORTING_CATEGORY_STATEMENTS,
  formatGradeLabel,
} from '../data/floridaStandards.ts';
import type {
  AssessmentItem,
  FastAssessedGrade,
  FastItemType,
  FloridaBenchmark,
  GradeLevel,
  ReportingCategoryId,
  SavedAssessment,
  ScoredItemResult,
  StrandCode,
  StudentAttempt,
  StudentItemResponse,
} from '../types/ela.ts';

const PEDAGOGICAL_QUERY_EXPANSIONS: Record<string, string[]> = {
  'main idea': ['central idea', 'topic', 'r.2.2'],
  'central idea': ['main idea', 'relevant details', 'r.2.2'],
  inference: ['infer', 'implied', 'ee.3.1', 'imply', 'draw conclusions'],
  infer: ['inference', 'implied', 'ee.3.1'],
  'figurative language': [
    'metaphor',
    'simile',
    'personification',
    'hyperbole',
    'idiom',
    'alliteration',
    'imagery',
    'r.3.1',
  ],
  theme: ['moral', 'message', 'big idea', 'r.1.2'],
  'point of view': ['narrator', 'perspective', 'r.1.3'],
  perspective: ['attitude', 'point of view', 'r.1.3', 'r.2.3'],
  'text structure': [
    'chronology',
    'chronological',
    'comparison',
    'cause and effect',
    'problem and solution',
    'sequence',
    'description',
    'r.2.1',
  ],
  summary: ['summarize', 'retell', 'paraphrase', 'r.3.2'],
  summarize: ['summary', 'retell', 'paraphrase', 'r.3.2'],
  vocabulary: ['context clues', 'morphology', 'roots', 'affixes', 'v.1'],
  morphology: ['roots', 'greek', 'latin', 'affixes', 'prefixes', 'suffixes', 'v.1.2'],
  'context clues': ['multiple-meaning', 'synonyms', 'antonyms', 'v.1.3'],
  evidence: ['cite', 'ee.1.1', 'claim', 'r.2.4', 'hot text', 'ebsr'],
  argument: ['claim', 'reasons', 'evidence', 'r.2.4'],
  poetry: ['poem', 'stanzas', 'rhyme', 'haiku', 'limerick', 'r.1.4'],
  paired: ['compare', 'contrast', 'primary source', 'secondary source', 'r.3.3'],
  foundations: ['phonics', 'phonological', 'fluency', 'print concepts', 'decoding', 'f.1'],
  phonics: ['decoding', 'cvc', 'digraphs', 'syllables', 'morpheme', 'f.1.3'],
  phonological: ['rhyme', 'phoneme', 'syllables', 'blending', 'segmenting', 'f.1.2'],
  fluency: ['prosody', 'automaticity', 'high-frequency', 'accuracy', 'f.1.4'],
  'print concepts': ['book', 'table of contents', 'glossary', 'letters', 'f.1.1'],
};

export interface BenchmarkSearchFilters {
  grade?: GradeLevel | 'ALL';
  strand?: StrandCode | 'ALL';
  fastOnly?: boolean;
  query?: string;
}

export function searchBenchmarks(filters: BenchmarkSearchFilters): FloridaBenchmark[] {
  const { grade = 'ALL', strand = 'ALL', fastOnly = false, query = '' } = filters;
  const trimmed = query.trim().toLowerCase();

  const candidateTerms = new Set<string>();
  if (trimmed) {
    candidateTerms.add(trimmed);
    for (const [phrase, synonyms] of Object.entries(PEDAGOGICAL_QUERY_EXPANSIONS)) {
      if (trimmed.includes(phrase) || phrase.includes(trimmed)) {
        for (const syn of synonyms) {
          candidateTerms.add(syn);
        }
      }
    }
    for (const token of trimmed.split(/\s+/)) {
      if (token.length >= 3) {
        candidateTerms.add(token);
      }
    }
  }

  const scored: { benchmark: FloridaBenchmark; score: number }[] = [];

  for (const benchmark of FLORIDA_BENCHMARKS) {
    if (grade !== 'ALL' && benchmark.grade !== grade && benchmark.grade !== 'K12') {
      continue;
    }
    if (strand !== 'ALL' && benchmark.strand !== strand) {
      continue;
    }
    if (fastOnly && !benchmark.fastAssessed) {
      continue;
    }

    if (!trimmed) {
      scored.push({ benchmark, score: benchmark.grade === 'K12' ? 1 : 2 });
      continue;
    }

    const haystack = [
      benchmark.code,
      benchmark.benchmarkTitle,
      benchmark.standardGroup,
      benchmark.officialText,
      ...benchmark.clarifications,
      ...benchmark.keywords,
    ]
      .join(' ')
      .toLowerCase();

    let matchScore = 0;
    if (benchmark.code.toLowerCase().includes(trimmed)) {
      matchScore += 20;
    }
    if (benchmark.officialText.toLowerCase().includes(trimmed)) {
      matchScore += 12;
    }
    if (benchmark.benchmarkTitle.toLowerCase().includes(trimmed)) {
      matchScore += 10;
    }
    if (benchmark.keywords.some((k) => k.toLowerCase() === trimmed)) {
      matchScore += 10;
    }

    for (const term of candidateTerms) {
      if (haystack.includes(term)) {
        matchScore += term === trimmed ? 6 : 3;
      }
    }

    if (matchScore > 0) {
      // Slight preference for grade-specific benchmarks over K12 expectations when searching within a grade
      if (grade !== 'ALL' && benchmark.grade === grade) {
        matchScore += 2;
      }
      scored.push({ benchmark, score: matchScore });
    }
  }

  return scored
    .sort((a, b) => b.score - a.score || a.benchmark.code.localeCompare(b.benchmark.code))
    .map((entry) => entry.benchmark);
}

export interface ValidationIssue {
  level: 'info' | 'warning';
  message: string;
}

export function validateItemFormatForGradeAndBenchmark(
  grade: GradeLevel,
  benchmarkCode: string,
  itemType: FastItemType
): { compatible: boolean; issues: ValidationIssue[] } {
  const issues: ValidationIssue[] = [];
  const benchmark = BENCHMARKS_BY_CODE[benchmarkCode];

  if (grade === 'K' || grade === '1' || grade === '2') {
    issues.push({
      level: 'warning',
      message: `Grades K–2 statewide screening uses Renaissance Star Early Literacy / Star Reading rather than Grades 3–5 FAST TEIs. Use Multiple Choice or teacher-guided oral checks for ${formatGradeLabel(grade)}.`,
    });
  }

  if (benchmark) {
    if (benchmark.grade !== 'K12' && benchmark.grade !== grade) {
      issues.push({
        level: 'warning',
        message: `${benchmark.code} is a ${formatGradeLabel(benchmark.grade)} benchmark, while ${formatGradeLabel(grade)} is selected.`,
      });
    }
    if (!benchmark.suggestedItemTypes.includes(itemType)) {
      issues.push({
        level: 'info',
        message: `${FAST_ITEM_TYPE_INFO[itemType].label} is less typical for ${benchmark.code}; FAST items commonly use ${benchmark.suggestedItemTypes
          .map((t) => FAST_ITEM_TYPE_INFO[t].shortLabel)
          .join(', ')}.`,
      });
    }
  }

  const hasWarning = issues.some((i) => i.level === 'warning');
  return {
    compatible: !hasWarning,
    issues,
  };
}

export function scoreStudentSubmission(
  items: AssessmentItem[],
  responses: Record<string, StudentItemResponse>
): {
  totalPoints: number;
  maxPoints: number;
  percentScore: number;
  itemResults: ScoredItemResult[];
} {
  const itemResults: ScoredItemResult[] = [];
  let totalPoints = 0;

  for (const item of items) {
    const response = responses[item.id] ?? {};
    let score = 0;
    let selectedLabels: string[] = [];
    let correctLabels: string[] = [];

    if (item.itemType === 'multiple_choice') {
      const options = item.options ?? [];
      const correctOption = options.find((o) => o.isCorrect);
      correctLabels = correctOption ? [correctOption.label] : [];
      const selectedIds = response.selectedOptionIds ?? [];
      selectedLabels = options
        .filter((o) => selectedIds.includes(o.id))
        .map((o) => o.label);
      if (correctOption && selectedIds.length === 1 && selectedIds[0] === correctOption.id) {
        score = 1;
      }
    } else if (item.itemType === 'multiselect') {
      const options = item.options ?? [];
      const correctSet = new Set(options.filter((o) => o.isCorrect).map((o) => o.id));
      correctLabels = options.filter((o) => o.isCorrect).map((o) => o.label);
      const selectedIds = response.selectedOptionIds ?? [];
      selectedLabels = options
        .filter((o) => selectedIds.includes(o.id))
        .map((o) => o.label);

      if (
        selectedIds.length === correctSet.size &&
        selectedIds.every((id) => correctSet.has(id))
      ) {
        score = 1;
      }
    } else if (item.itemType === 'ebsr') {
      const partA = item.partAOptions ?? [];
      const partB = item.partBOptions ?? [];
      const correctA = partA.filter((o) => o.isCorrect).map((o) => o.id);
      const correctB = partB.filter((o) => o.isCorrect).map((o) => o.id);

      const selA = response.partASelectedIds ?? [];
      const selB = response.partBSelectedIds ?? [];

      const selALabels = partA.filter((o) => selA.includes(o.id)).map((o) => `A:${o.label}`);
      const selBLabels = partB.filter((o) => selB.includes(o.id)).map((o) => `B:${o.label}`);
      selectedLabels = [...selALabels, ...selBLabels];

      correctLabels = [
        ...partA.filter((o) => o.isCorrect).map((o) => `A:${o.label}`),
        ...partB.filter((o) => o.isCorrect).map((o) => `B:${o.label}`),
      ];

      const aMatch =
        selA.length === correctA.length && selA.every((id) => correctA.includes(id));
      const bMatch =
        selB.length === correctB.length && selB.every((id) => correctB.includes(id));

      if (aMatch && bMatch) {
        score = 1;
      } else if (aMatch) {
        score = 0.5;
      }
    } else if (item.itemType === 'hot_text') {
      const segments = item.hotTextSegments ?? [];
      const correctSegs = segments.filter((s) => s.isCorrect);
      const correctSet = new Set(correctSegs.map((s) => s.id));
      correctLabels = correctSegs.map((s, idx) => `Excerpt ${idx + 1} (P${s.paragraphRef})`);
      const selectedIds = response.hotTextSelectedIds ?? [];
      selectedLabels = segments
        .filter((s) => selectedIds.includes(s.id))
        .map((s) => `P${s.paragraphRef}: "${s.text.slice(0, 32)}..."`);

      if (
        selectedIds.length === correctSet.size &&
        selectedIds.every((id) => correctSet.has(id))
      ) {
        score = 1;
      }
    } else if (item.itemType === 'table_match') {
      const config = item.tableMatch;
      if (config) {
        let matchedRows = 0;
        for (const row of config.rows) {
          const userCols = response.tableMatchSelections?.[row.id] ?? [];
          const colLabels = config.columns
            .filter((c) => userCols.includes(c.id))
            .map((c) => c.label);
          const targetLabels = config.columns
            .filter((c) => row.correctColumnIds.includes(c.id))
            .map((c) => c.label);

          selectedLabels.push(`${row.statement.slice(0, 22)}→${colLabels.join('/') || '—'}`);
          correctLabels.push(`${row.statement.slice(0, 22)}→${targetLabels.join('/')}`);

          const exactMatch =
            userCols.length === row.correctColumnIds.length &&
            userCols.every((id) => row.correctColumnIds.includes(id));
          if (exactMatch) {
            matchedRows += 1;
          }
        }
        if (config.rows.length > 0) {
          score = Number((matchedRows / config.rows.length).toFixed(2));
        }
      }
    }

    totalPoints += score;
    itemResults.push({
      itemId: item.id,
      benchmarkCode: item.benchmarkCode,
      reportingCategory: item.reportingCategory,
      itemType: item.itemType,
      score,
      isCorrect: score === 1,
      selectedLabels,
      correctLabels,
    });
  }

  const maxPoints = items.length;
  const percentScore = maxPoints > 0 ? Math.round((totalPoints / maxPoints) * 100) : 0;

  return {
    totalPoints: Number(totalPoints.toFixed(2)),
    maxPoints,
    percentScore,
    itemResults,
  };
}

export interface BenchmarkMetricSummary {
  benchmarkCode: string;
  benchmarkTitle: string;
  reportingCategory: ReportingCategoryId;
  attemptsCount: number;
  pointsEarned: number;
  maxPoints: number;
  accuracyPercent: number;
}

export interface ReportingCategoryPerformance {
  categoryId: 'reading-prose-poetry' | 'reading-informational-text' | 'reading-across-genres-vocabulary';
  categoryLabel: string;
  itemsAnswered: number;
  accuracyPercent: number;
  tier: 'belowExpectations' | 'atNearExpectations' | 'aboveExpectations';
  tierLabel: 'Below Expectations' | 'At/Near Expectations' | 'Above Expectations';
  whatResultsMean: string[];
  nextSteps: string[];
}

export interface AssessmentAnalyticsReport {
  attemptCount: number;
  totalItemsAnswered: number;
  averageScorePercent: number;
  benchmarkSummaries: BenchmarkMetricSummary[];
  reportingCategories: ReportingCategoryPerformance[];
  smallSampleGuardrail: string;
  isSmallSample: boolean;
}

export function computeBenchmarkAnalytics(
  attempts: StudentAttempt[],
  gradeFilter?: GradeLevel
): AssessmentAnalyticsReport {
  const filteredAttempts = gradeFilter
    ? attempts.filter((a) => a.grade === gradeFilter)
    : attempts;

  const benchmarkAccumulator = new Map<
    string,
    {
      pointsEarned: number;
      maxPoints: number;
      reportingCategory: ReportingCategoryId;
    }
  >();

  const categoryAccumulator = new Map<
    'reading-prose-poetry' | 'reading-informational-text' | 'reading-across-genres-vocabulary',
    { pointsEarned: number; maxPoints: number }
  >();

  let totalItemsAnswered = 0;
  let totalPercentSum = 0;

  for (const attempt of filteredAttempts) {
    totalPercentSum += attempt.percentScore;
    for (const res of attempt.itemResults) {
      totalItemsAnswered += 1;
      const existingB = benchmarkAccumulator.get(res.benchmarkCode) ?? {
        pointsEarned: 0,
        maxPoints: 0,
        reportingCategory: res.reportingCategory,
      };
      existingB.pointsEarned += res.score;
      existingB.maxPoints += 1;
      benchmarkAccumulator.set(res.benchmarkCode, existingB);

      if (
        res.reportingCategory === 'reading-prose-poetry' ||
        res.reportingCategory === 'reading-informational-text' ||
        res.reportingCategory === 'reading-across-genres-vocabulary'
      ) {
        const existingC = categoryAccumulator.get(res.reportingCategory) ?? {
          pointsEarned: 0,
          maxPoints: 0,
        };
        existingC.pointsEarned += res.score;
        existingC.maxPoints += 1;
        categoryAccumulator.set(res.reportingCategory, existingC);
      }
    }
  }

  const benchmarkSummaries: BenchmarkMetricSummary[] = Array.from(
    benchmarkAccumulator.entries()
  )
    .map(([code, data]) => {
      const bench = BENCHMARKS_BY_CODE[code];
      return {
        benchmarkCode: code,
        benchmarkTitle: bench?.benchmarkTitle ?? code,
        reportingCategory: data.reportingCategory,
        attemptsCount: data.maxPoints,
        pointsEarned: Number(data.pointsEarned.toFixed(2)),
        maxPoints: data.maxPoints,
        accuracyPercent:
          data.maxPoints > 0 ? Math.round((data.pointsEarned / data.maxPoints) * 100) : 0,
      };
    })
    .sort((a, b) => a.accuracyPercent - b.accuracyPercent);

  const guidanceGrade: FastAssessedGrade =
    gradeFilter === '3' || gradeFilter === '4' || gradeFilter === '5'
      ? gradeFilter
      : filteredAttempts[0]?.grade === '3' ||
        filteredAttempts[0]?.grade === '4' ||
        filteredAttempts[0]?.grade === '5'
      ? (filteredAttempts[0].grade as FastAssessedGrade)
      : '4';

  const categoryLabels: Record<
    'reading-prose-poetry' | 'reading-informational-text' | 'reading-across-genres-vocabulary',
    string
  > = {
    'reading-prose-poetry': 'Reading Prose and Poetry',
    'reading-informational-text': 'Reading Informational Text',
    'reading-across-genres-vocabulary': 'Reading Across Genres & Vocabulary',
  };

  const reportingCategories: ReportingCategoryPerformance[] = (
    [
      'reading-prose-poetry',
      'reading-informational-text',
      'reading-across-genres-vocabulary',
    ] as const
  )
    .filter((catId) => categoryAccumulator.has(catId))
    .map((catId) => {
      const data = categoryAccumulator.get(catId)!;
      const accuracyPercent = Math.round((data.pointsEarned / data.maxPoints) * 100);
      const tier: ReportingCategoryPerformance['tier'] =
        accuracyPercent < 60
          ? 'belowExpectations'
          : accuracyPercent < 85
          ? 'atNearExpectations'
          : 'aboveExpectations';
      const tierLabel: ReportingCategoryPerformance['tierLabel'] =
        tier === 'belowExpectations'
          ? 'Below Expectations'
          : tier === 'atNearExpectations'
          ? 'At/Near Expectations'
          : 'Above Expectations';
      const statements = REPORTING_CATEGORY_STATEMENTS[guidanceGrade][catId][tier];

      return {
        categoryId: catId,
        categoryLabel: categoryLabels[catId],
        itemsAnswered: data.maxPoints,
        accuracyPercent,
        tier,
        tierLabel,
        whatResultsMean: statements.whatResultsMean,
        nextSteps: statements.nextSteps,
      };
    });

  return {
    attemptCount: filteredAttempts.length,
    totalItemsAnswered,
    averageScorePercent:
      filteredAttempts.length > 0
        ? Math.round(totalPercentSum / filteredAttempts.length)
        : 0,
    benchmarkSummaries,
    reportingCategories,
    isSmallSample: totalItemsAnswered < 12,
    smallSampleGuardrail:
      'Per Florida Department of Education Reporting Category Statements (May 2024, p. 4): "Due to the relatively small size of each reporting category, neither individual nor combined reporting category performance should be used to infer overall performance." Use these results strictly as formative instructional signals.',
  };
}

export function formatAssessmentMarkdown(assessment: SavedAssessment): string {
  const lines: string[] = [];
  lines.push(`# ${assessment.title}`);
  lines.push(
    `**Grade:** ${formatGradeLabel(assessment.grade)} | **Unit:** ${assessment.unitTag || 'General Practice'} | **Benchmarks:** ${assessment.passage.alignedBenchmarks.join(', ')}`
  );
  lines.push('');
  lines.push(`> *${assessment.passage.practiceDisclaimer}*`);
  lines.push('');

  for (const section of assessment.passage.sections) {
    lines.push(`## ${section.label}: ${section.title}`);
    if (section.sourceNote) {
      lines.push(`*${section.sourceNote}*`);
    }
    lines.push('');
    section.paragraphs.forEach((p, idx) => {
      lines.push(`[${idx + 1}] ${p}`);
      lines.push('');
    });
  }

  if (assessment.passage.glossary.length > 0) {
    lines.push('### Glossary');
    for (const g of assessment.passage.glossary) {
      lines.push(`- **${g.term}**: ${g.definition}`);
    }
    lines.push('');
  }

  lines.push('### Key Vocabulary Tool');
  for (const v of assessment.passage.vocabularyGuide) {
    lines.push(
      `- **${v.word}** (${v.partOfSpeech}) [${v.benchmarkCode}]: ${v.definition} — *Context (P${v.paragraphRef}):* "${v.passageContextSentence}"`
    );
  }
  lines.push('');

  lines.push('### Text Complexity Analysis');
  lines.push(
    `- Estimated Lexile: **${assessment.passage.complexity.estimatedLexileLabel}** | Official Band: **${assessment.passage.complexity.officialBandLabel} (${assessment.passage.complexity.officialLexileRange})**`
  );
  lines.push(`- ${assessment.passage.complexity.gradeAppropriatenessExplanation}`);
  lines.push('');

  lines.push('---');
  lines.push('## Assessment Items');
  lines.push('');

  assessment.items.forEach((item, idx) => {
    lines.push(
      `### Item ${idx + 1} (${FAST_ITEM_TYPE_INFO[item.itemType].label} · ${item.benchmarkCode} · DOK ${item.dok})`
    );
    lines.push(item.prompt);
    lines.push('');

    if (item.options) {
      for (const opt of item.options) {
        lines.push(`- **${opt.label}.** ${opt.text}`);
      }
    }
    if (item.partAPrompt && item.partAOptions) {
      const partAText = item.partAPrompt.replace(/^(?:Part\s*A\s*[:.\-–—]?\s*)+/i, '').trim();
      lines.push(`**Part A:** ${partAText}`);
      for (const opt of item.partAOptions) {
        lines.push(`- **${opt.label}.** ${opt.text}`);
      }
      const partBText = (item.partBPrompt ?? '').replace(/^(?:Part\s*B\s*[:.\-–—]?\s*)+/i, '').trim();
      lines.push(`**Part B:** ${partBText}`);
      for (const opt of item.partBOptions ?? []) {
        lines.push(`- **${opt.label}.** ${opt.text}`);
      }
    }
    if (item.hotTextSegments) {
      for (const seg of item.hotTextSegments) {
        lines.push(`- [P${seg.paragraphRef}] "${seg.text}"`);
      }
    }
    if (item.tableMatch) {
      lines.push(`Columns: ${item.tableMatch.columns.map((c) => c.label).join(' | ')}`);
      for (const row of item.tableMatch.rows) {
        lines.push(`- ${row.statement}`);
      }
    }

    lines.push('');
    lines.push(`**Answer Key:** ${item.correctAnswerSummary}`);
    lines.push(`**Rationale:** ${item.correctRationale}`);
    lines.push(
      `**Textual Evidence (P${item.evidenceParagraphRef}):** "${item.textualEvidenceQuote}"`
    );
    lines.push(`**Source Reference:** ${item.sourceCitation}`);
    lines.push('');
  });

  return lines.join('\n');
}
