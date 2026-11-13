import test from 'node:test';
import assert from 'node:assert/strict';
import {
  computeBenchmarkAnalytics,
  formatAssessmentMarkdown,
  scoreStudentSubmission,
  searchBenchmarks,
  validateItemFormatForGradeAndBenchmark,
} from './assessmentEngine.ts';
import {
  OFFICIAL_COMPLEXITY_BANDS,
  analyzePassageComplexity,
  buildLexileRevisionInstruction,
  distanceToTargetLexile,
  getTargetLexileProfile,
  isBetterLexileCandidate,
  isWithinTargetLexile,
  reconcileVocabularyContextSentences,
} from './textComplexity.ts';
import { SEED_ASSESSMENTS, SEED_ATTEMPTS } from '../data/seedData.ts';
import type {
  AssessmentItem,
  GradeLevel,
  PassageSection,
  VocabularyComplexityOption,
  VocabularyWord,
} from '../types/ela.ts';

test('searchBenchmarks supports keyword searches for inference, main idea, and figurative language within selected grade', () => {
  const grade4MainIdea = searchBenchmarks({ grade: '4', query: 'main idea' });
  assert.ok(
    grade4MainIdea.some((b) => b.code === 'ELA.4.R.2.2'),
    'Expected main idea search in Grade 4 to return ELA.4.R.2.2'
  );

  const grade3Inference = searchBenchmarks({ grade: '3', query: 'inference' });
  assert.ok(
    grade3Inference.some((b) => b.code === 'ELA.K12.EE.3.1'),
    'Expected inference search to return ELA.K12.EE.3.1'
  );
  assert.ok(
    grade3Inference.every((b) => b.grade === '3' || b.grade === 'K12'),
    'Expected Grade 3 filter to exclude Grade 4/5 benchmarks'
  );

  const grade5FigLang = searchBenchmarks({ grade: '5', query: 'figurative language' });
  assert.ok(
    grade5FigLang.some((b) => b.code === 'ELA.5.R.3.1'),
    'Expected figurative language search in Grade 5 to return ELA.5.R.3.1'
  );

  const kFoundations = searchBenchmarks({ grade: 'K', strand: 'F' });
  assert.ok(
    kFoundations.some((b) => b.code === 'ELA.K.F.1.1') &&
      kFoundations.some((b) => b.code === 'ELA.K.F.1.2') &&
      kFoundations.some((b) => b.code === 'ELA.K.F.1.3') &&
      kFoundations.some((b) => b.code === 'ELA.K.F.1.4'),
    'Expected Kindergarten Foundations filter to return ELA.K.F.1.1 through ELA.K.F.1.4'
  );

  const g1Phonics = searchBenchmarks({ grade: '1', query: 'phonics' });
  assert.ok(
    g1Phonics.some((b) => b.code === 'ELA.1.F.1.3'),
    'Expected Grade 1 phonics search to return ELA.1.F.1.3'
  );

  const allFoundations = searchBenchmarks({ grade: 'ALL', strand: 'F', query: 'fluency' });
  assert.ok(
    allFoundations.some((b) => b.code === 'ELA.2.F.1.4') &&
      allFoundations.some((b) => b.code === 'ELA.5.F.1.4'),
    'Expected All Grades Foundations fluency search to return K-5 F.1.4 benchmarks'
  );
});

test('analyzePassageComplexity calibrates estimated Lexile against Florida B.E.S.T. Appendix B bands', () => {
  const kSection: PassageSection[] = [
    {
      id: 'k1',
      label: 'Passage',
      title: 'The Red Wagon',
      genre: 'literary',
      paragraphs: [
        'Sam has a red wagon. He puts his big blue ball in it. He pulls the wagon up the hill. The ball rolls out. Sam runs to get his ball. He puts it back in the wagon and smiles.',
      ],
    },
  ];
  const kResult = analyzePassageComplexity(kSection, 'K', 'literary');
  assert.equal(kResult.officialBandLabel, 'K–1st Grade Band');
  assert.ok(kResult.estimatedLexile <= 430, `Expected K Lexile <= 430, got ${kResult.estimatedLexile}`);
  assert.equal(kResult.gradeAppropriateStatus, 'Within Grade Band');

  const g5Section: PassageSection[] = [
    {
      id: 'g5',
      label: 'Article',
      title: 'Estuary Restoration',
      genre: 'informational',
      paragraphs: [
        'Coastal estuaries serve as biological nurseries where freshwater rivers gradually merge with saltwater tides along Florida shorelines. Because mangrove roots trap suspended sediment and buffer storm surges, coastal engineers increasingly prioritize habitat restoration over concrete seawalls.',
        'Hydrologists measure dissolved oxygen, salinity gradients, and oyster reef recruitment across multiple seasons before concluding whether a restoration project strengthens local biodiversity.',
      ],
    },
  ];
  const g5Result = analyzePassageComplexity(g5Section, '5', 'informational');
  assert.equal(g5Result.officialBandLabel, '4th–5th Grade Band');
  assert.ok(g5Result.estimatedLexile >= 740, `Expected Grade 5 Lexile >= 740, got ${g5Result.estimatedLexile}`);
});

test('validateItemFormatForGradeAndBenchmark flags K-2 FAST TEI mismatch and grade mismatches', () => {
  const kCheck = validateItemFormatForGradeAndBenchmark('1', 'ELA.1.R.1.1', 'ebsr');
  assert.equal(kCheck.compatible, false);
  assert.ok(kCheck.issues.some((i) => i.message.includes('Renaissance Star')));

  const gradeMismatch = validateItemFormatForGradeAndBenchmark('3', 'ELA.5.R.2.4', 'multiple_choice');
  assert.equal(gradeMismatch.compatible, false);

  const validG4 = validateItemFormatForGradeAndBenchmark('4', 'ELA.4.R.2.2', 'ebsr');
  assert.equal(validG4.compatible, true);
});

test('scoreStudentSubmission scores all 5 FAST item types accurately including partial EBSR and Table Match', () => {
  const sampleItems: AssessmentItem[] = [
    {
      id: 'i1',
      passageId: 'p1',
      grade: '4',
      itemType: 'multiple_choice',
      benchmarkCode: 'ELA.4.R.2.2',
      officialBenchmarkText: 'Explain how relevant details support the central idea, implied or explicit.',
      reportingCategory: 'reading-informational-text',
      reportingCategoryLabel: 'Reading Informational Text',
      cognitiveSkill: 'Central Idea',
      cognitiveRigor: 'On-Grade-Level',
      dok: 2,
      prompt: 'Prompt 1',
      options: [
        { id: 'o1', label: 'A', text: 'Opt A', isCorrect: false, rationale: 'No' },
        { id: 'o2', label: 'B', text: 'Opt B', isCorrect: true, rationale: 'Yes' },
      ],
      correctAnswerSummary: 'B',
      correctRationale: 'Yes',
      textualEvidenceQuote: 'Quote',
      evidenceParagraphRef: 1,
      sourceCitation: 'FDOE',
      practiceDisclaimer: 'Practice',
    },
    {
      id: 'i2',
      passageId: 'p1',
      grade: '4',
      itemType: 'multiselect',
      benchmarkCode: 'ELA.4.R.2.2',
      officialBenchmarkText: 'Explain how relevant details support the central idea, implied or explicit.',
      reportingCategory: 'reading-informational-text',
      reportingCategoryLabel: 'Reading Informational Text',
      cognitiveSkill: 'Relevant Details',
      cognitiveRigor: 'On-Grade-Level',
      dok: 2,
      prompt: 'Select TWO',
      selectionCount: 2,
      options: [
        { id: 'm1', label: 'A', text: 'A', isCorrect: true, rationale: 'Yes' },
        { id: 'm2', label: 'B', text: 'B', isCorrect: false, rationale: 'No' },
        { id: 'm3', label: 'C', text: 'C', isCorrect: true, rationale: 'Yes' },
      ],
      correctAnswerSummary: 'A, C',
      correctRationale: 'Yes',
      textualEvidenceQuote: 'Quote',
      evidenceParagraphRef: 2,
      sourceCitation: 'FDOE',
      practiceDisclaimer: 'Practice',
    },
    {
      id: 'i3',
      passageId: 'p1',
      grade: '4',
      itemType: 'ebsr',
      benchmarkCode: 'ELA.4.R.1.1',
      officialBenchmarkText: 'Explain how setting, events, conflict, and character development contribute to the plot in a literary text.',
      reportingCategory: 'reading-prose-poetry',
      reportingCategoryLabel: 'Reading Prose and Poetry',
      cognitiveSkill: 'Inference',
      cognitiveRigor: 'On-Grade-Level',
      dok: 3,
      prompt: 'Two-part EBSR',
      partAPrompt: 'Part A',
      partAOptions: [
        { id: 'a1', label: 'A', text: 'Correct A', isCorrect: true, rationale: 'Yes' },
        { id: 'a2', label: 'B', text: 'Wrong A', isCorrect: false, rationale: 'No' },
      ],
      partBPrompt: 'Part B',
      partBOptions: [
        { id: 'b1', label: 'A', text: 'Wrong B', isCorrect: false, rationale: 'No' },
        { id: 'b2', label: 'B', text: 'Correct B', isCorrect: true, rationale: 'Yes' },
      ],
      correctAnswerSummary: 'Part A: A; Part B: B',
      correctRationale: 'Yes',
      textualEvidenceQuote: 'Quote',
      evidenceParagraphRef: 1,
      sourceCitation: 'FDOE',
      practiceDisclaimer: 'Practice',
    },
    {
      id: 'i4',
      passageId: 'p1',
      grade: '4',
      itemType: 'hot_text',
      benchmarkCode: 'ELA.4.R.3.1',
      officialBenchmarkText: 'Explain how figurative language contributes to meaning in text(s).',
      reportingCategory: 'reading-across-genres-vocabulary',
      reportingCategoryLabel: 'Reading Across Genres & Vocabulary',
      cognitiveSkill: 'Evidence Selection',
      cognitiveRigor: 'On-Grade-Level',
      dok: 2,
      prompt: 'Select sentence',
      selectionCount: 1,
      hotTextSegments: [
        { id: 'h1', paragraphRef: 1, text: 'Seg 1', isCorrect: false, rationale: 'No' },
        { id: 'h2', paragraphRef: 2, text: 'Seg 2', isCorrect: true, rationale: 'Yes' },
      ],
      correctAnswerSummary: 'Seg 2',
      correctRationale: 'Yes',
      textualEvidenceQuote: 'Seg 2',
      evidenceParagraphRef: 2,
      sourceCitation: 'FDOE',
      practiceDisclaimer: 'Practice',
    },
    {
      id: 'i5',
      passageId: 'p1',
      grade: '4',
      itemType: 'table_match',
      benchmarkCode: 'ELA.4.R.3.3',
      officialBenchmarkText: 'Compare and contrast accounts of the same event using primary and/or secondary sources.',
      reportingCategory: 'reading-across-genres-vocabulary',
      reportingCategoryLabel: 'Reading Across Genres & Vocabulary',
      cognitiveSkill: 'Compare Accounts',
      cognitiveRigor: 'On-Grade-Level',
      dok: 3,
      prompt: 'Match rows',
      tableMatch: {
        columns: [
          { id: 'c1', label: 'Source 1' },
          { id: 'c2', label: 'Source 2' },
        ],
        rows: [
          { id: 'r1', statement: 'Row 1', correctColumnIds: ['c1'], rationale: 'R1' },
          { id: 'r2', statement: 'Row 2', correctColumnIds: ['c2'], rationale: 'R2' },
        ],
      },
      correctAnswerSummary: 'R1->Source 1, R2->Source 2',
      correctRationale: 'Both matched',
      textualEvidenceQuote: 'Quote',
      evidenceParagraphRef: 1,
      sourceCitation: 'FDOE',
      practiceDisclaimer: 'Practice',
    },
  ];

  const scored = scoreStudentSubmission(sampleItems, {
    i1: { selectedOptionIds: ['o2'] }, // 1
    i2: { selectedOptionIds: ['m1', 'm3'] }, // 1
    i3: { partASelectedIds: ['a1'], partBSelectedIds: ['b1'] }, // 0.5 (Part A right, Part B wrong)
    i4: { hotTextSelectedIds: ['h2'] }, // 1
    i5: { tableMatchSelections: { r1: ['c1'], r2: ['c1'] } }, // 0.5 (1 of 2 rows right)
  });

  assert.equal(scored.totalPoints, 4);
  assert.equal(scored.maxPoints, 5);
  assert.equal(scored.percentScore, 80);
});

test('computeBenchmarkAnalytics includes small-sample guardrail and Reporting Category guidance', () => {
  const report = computeBenchmarkAnalytics(SEED_ATTEMPTS, '4');
  assert.ok(report.attemptCount >= 1);
  assert.equal(report.isSmallSample, true);
  assert.ok(report.smallSampleGuardrail.includes('relatively small size of each reporting category'));
  assert.ok(report.reportingCategories.length > 0);
  assert.ok(report.reportingCategories[0].nextSteps.length > 0);
});

test('seed assessments contain 5-7 vocabulary words and export clean Markdown', () => {
  for (const assessment of SEED_ASSESSMENTS) {
    assert.ok(
      assessment.passage.vocabularyGuide.length >= 5 &&
        assessment.passage.vocabularyGuide.length <= 7,
      `Expected 5-7 vocab words in ${assessment.title}, found ${assessment.passage.vocabularyGuide.length}`
    );
    const md = formatAssessmentMarkdown(assessment);
    assert.ok(md.includes(assessment.title));
    assert.ok(md.includes('Key Vocabulary Tool'));
    assert.ok(md.includes('Text Complexity Analysis'));
  }
});

test('getTargetLexileProfile spans K-5 within official Florida B.E.S.T. Appendix B bands monotonically', () => {
  const grades: GradeLevel[] = ['K', '1', '2', '3', '4', '5'];
  const tiers: VocabularyComplexityOption[] = ['foundational', 'on-grade', 'stretch'];

  for (const grade of grades) {
    const band = OFFICIAL_COMPLEXITY_BANDS[grade];
    const profiles = tiers.map((t) => getTargetLexileProfile(grade, t));

    for (const profile of profiles) {
      assert.ok(
        profile.targetMin >= band.lexileMin && profile.targetMax <= band.lexileMax,
        `Expected ${grade}/${profile.vocabularyComplexity} (${profile.targetMin}-${profile.targetMax}) inside ${band.lexileMin}-${band.lexileMax}`
      );
      assert.ok(profile.targetMin < profile.targetMax);
    }

    assert.ok(profiles[0].targetMin <= profiles[1].targetMin && profiles[1].targetMin <= profiles[2].targetMin);
    assert.ok(profiles[0].targetMax <= profiles[1].targetMax && profiles[1].targetMax <= profiles[2].targetMax);
  }
});

test('buildLexileRevisionInstruction and candidate ranking guide Lexile toward target range', () => {
  const g3OnGrade = getTargetLexileProfile('3', 'on-grade');
  assert.equal(isWithinTargetLexile(640, g3OnGrade), true);
  assert.equal(isWithinTargetLexile(940, g3OnGrade), false);
  assert.equal(distanceToTargetLexile(640, g3OnGrade), 0);
  assert.ok(distanceToTargetLexile(940, g3OnGrade) > 0);

  const highComplexity = analyzePassageComplexity(
    [
      {
        id: 's1',
        label: 'Article',
        title: 'Test',
        genre: 'informational',
        paragraphs: [
          'Environmental hydrologists systematically investigate subterranean aquifer ecosystems throughout Florida, evaluating precipitation patterns, limestone permeability, and agricultural conservation methodologies across interconnected watersheds.',
        ],
      },
    ],
    '3',
    'informational'
  );
  assert.ok(highComplexity.estimatedLexile > g3OnGrade.targetMax);

  const lowerInstr = buildLexileRevisionInstruction(highComplexity, g3OnGrade, '3', '450–620 words');
  assert.ok(lowerInstr.includes('LOWER READING COMPLEXITY'));
  assert.ok(lowerInstr.includes(g3OnGrade.targetDisplay));

  const g5OnGrade = getTargetLexileProfile('5', 'on-grade');
  const lowComplexity = analyzePassageComplexity(
    [
      {
        id: 's2',
        label: 'Story',
        title: 'Short',
        genre: 'literary',
        paragraphs: ['Sam has a dog. The dog can run fast. They play in the sun. It is fun.'],
      },
    ],
    '5',
    'literary'
  );
  assert.ok(lowComplexity.estimatedLexile < g5OnGrade.targetMin);

  const raiseInstr = buildLexileRevisionInstruction(lowComplexity, g5OnGrade, '5', '450–620 words');
  assert.ok(raiseInstr.includes('RAISE READING COMPLEXITY'));
  assert.ok(raiseInstr.includes(g5OnGrade.targetDisplay));

  const balancedG3 = analyzePassageComplexity(
    [
      {
        id: 's3',
        label: 'Article',
        title: 'Florida Springs',
        genre: 'informational',
        paragraphs: [
          'Clear water bubbles up from rocks deep below Florida ground. Many plants and fish live in these cool springs. Manatees swim into warm springs when winter air turns cold.',
        ],
      },
    ],
    '3',
    'informational'
  );
  assert.equal(isBetterLexileCandidate(balancedG3, highComplexity, g3OnGrade), true);
});

test('reconcileVocabularyContextSentences updates paragraphRef and stale context quotes after text calibration', () => {
  const revisedSections: PassageSection[] = [
    {
      id: 'sec-1',
      label: 'Article',
      title: 'Sawgrass Marsh',
      genre: 'informational',
      paragraphs: [
        'Shallow water covers much of the Everglades during the rainy summer season.',
        'Tall sawgrass plants thrive in soggy soil because their strong roots hold tight during storms.',
      ],
    },
  ];

  const staleVocab: VocabularyWord[] = [
    {
      id: 'v1',
      word: 'thrive',
      partOfSpeech: 'verb',
      definition: 'to grow well',
      passageContextSentence: 'In the wet marshland, tall sawgrass plants consistently thrive despite flooding.',
      paragraphRef: 1,
      morphologyOrClueNote: 'Use context clues.',
      benchmarkCode: 'ELA.3.V.1.3',
      benchmarkAlignmentNote: 'Context clues',
    },
  ];

  const reconciled = reconcileVocabularyContextSentences(revisedSections, staleVocab);
  assert.equal(reconciled[0].paragraphRef, 2);
  assert.equal(
    reconciled[0].passageContextSentence,
    'Tall sawgrass plants thrive in soggy soil because their strong roots hold tight during storms.'
  );
});
