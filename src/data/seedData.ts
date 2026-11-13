import { BENCHMARKS_BY_CODE, PRACTICE_DISCLAIMER } from './floridaStandards.ts';
import type {
  AssessmentItem,
  ReadingPassage,
  SavedAssessment,
  StudentAttempt,
} from '../types/ela.ts';
import { analyzePassageComplexity } from '../utils/textComplexity.ts';
import { scoreStudentSubmission } from '../utils/assessmentEngine.ts';

// =========================================================================
// SEED PASSAGE 1: GRADE 3 INFORMATIONAL — EVERGLADES SAWGRASS & FIRE
// =========================================================================
const g3Sections = [
  {
    id: 'sec-g3-1',
    label: 'Article',
    title: 'How Sawgrass Survives in the River of Grass',
    genre: 'informational' as const,
    sourceNote: 'Original Informational Text · Grade 3 Science & Florida Habitats',
    paragraphs: [
      'South Florida holds a wide, shallow sheet of moving water called the Everglades. Visitors gaze at miles of tall, gold-green blades swaying in the warm breeze. Many assume they see ordinary marsh grass. Most of that vast sea is sawgrass. This tough, sharp-edged sedge has shaped the Everglades ecosystem for thousands of years.',
      'Look close at the edge of one sawgrass blade. You will soon spot how the plant got its name. Tiny, sawlike teeth line both sides of each leaf. Those stiff ridges shield the plant from hungry marsh grazers. They also catch morning dew and guide rain down to the roots. Under the dark, muddy peat, thick stems store energy even when the dry season leaves the ground cracked and parched.',
      'For years, many folks thought every marsh fire was a bad event. They feared fire ruined wild homes for good. Scientists later learned the truth. Sawgrass hides live buds safe under wet mud. Mild winter fires burn off dead thatch without hurting those roots. Soon after the smoke clears, new green shoots push up through the ash. Bright sun reaches the water again for wading birds and small fish.',
      'Today, park rangers plan prescribed burns in cool winter months. Winds stay mild and predictable then. Crews check damp soil and weather maps before each burn. Their careful steps help sawgrass marshes stay fresh and thick. What once looked like ruin turns out to be a dependable tool for keeping Florida’s River of Grass healthy.',
    ],
  },
];

const g3Passage: ReadingPassage = {
  id: 'passage-g3-everglades',
  title: 'How Sawgrass Survives in the River of Grass',
  grade: '3',
  textType: 'informational',
  topic: 'Florida Everglades Ecology & Prescribed Fire',
  targetLength: 'standard',
  vocabularyComplexity: 'on-grade',
  alignedBenchmarks: ['ELA.3.R.2.1', 'ELA.3.R.2.2', 'ELA.3.R.2.3', 'ELA.3.V.1.3'],
  sections: g3Sections,
  glossary: [
    { term: 'sedge', definition: 'a grass-like marsh plant that usually has solid, three-sided stems' },
    { term: 'peat', definition: 'dark, spongy soil formed from decayed marsh plants over many years' },
    {
      term: 'prescribed burn',
      definition: 'a fire intentionally set and managed by trained experts to keep a habitat healthy',
    },
  ],
  vocabularyGuide: [
    {
      id: 'v-g3-1',
      word: 'vast',
      partOfSpeech: 'adjective',
      definition: 'extremely wide or large in size and extent',
      passageContextSentence:
        'Most of that vast sea is sawgrass.',
      paragraphRef: 1,
      morphologyOrClueNote: 'Context clue: "wide, shallow sheet" and "miles of tall, gold-green blades" signal great size.',
      benchmarkCode: 'ELA.3.V.1.3',
      benchmarkAlignmentNote: 'Use context clues to determine word meaning in Grade 3 informational text.',
    },
    {
      id: 'v-g3-2',
      word: 'ecosystem',
      partOfSpeech: 'noun',
      definition: 'a community of living things interacting with their nonliving environment',
      passageContextSentence:
        'This tough, sharp-edged sedge has shaped the Everglades ecosystem for thousands of years.',
      paragraphRef: 1,
      morphologyOrClueNote: 'Greek root eco- ("house/habitat") + system ("organized whole").',
      benchmarkCode: 'ELA.3.V.1.2',
      benchmarkAlignmentNote: 'Apply prefix/root knowledge and cross-curricular academic vocabulary.',
    },
    {
      id: 'v-g3-3',
      word: 'parched',
      partOfSpeech: 'adjective',
      definition: 'dried out completely from heat or lack of water',
      passageContextSentence:
        'Under the dark, muddy peat, thick stems store energy even when the dry season leaves the ground cracked and parched.',
      paragraphRef: 2,
      morphologyOrClueNote: 'Context clues: paired with "dry season" and "ground cracked".',
      benchmarkCode: 'ELA.3.V.1.3',
      benchmarkAlignmentNote: 'Determine unfamiliar descriptive vocabulary using sentence context.',
    },
    {
      id: 'v-g3-4',
      word: 'thatch',
      partOfSpeech: 'noun',
      definition: 'a thick layer of dead plant stalks and leaves built up near the ground',
      passageContextSentence:
        'Mild winter fires burn off dead thatch without hurting those roots.',
      paragraphRef: 3,
      morphologyOrClueNote: 'Contrasted with "new green shoots" pushing up after fire clears old growth.',
      benchmarkCode: 'ELA.3.V.1.3',
      benchmarkAlignmentNote: 'Use contrast clues between dead material and new growth.',
    },
    {
      id: 'v-g3-5',
      word: 'predictable',
      partOfSpeech: 'adjective',
      definition: 'able to be known or expected ahead of time',
      passageContextSentence:
        'Winds stay mild and predictable then.',
      paragraphRef: 4,
      morphologyOrClueNote: 'Prefix pre- ("before") + root dict ("say/tell") + suffix -able ("capable of").',
      benchmarkCode: 'ELA.3.V.1.2',
      benchmarkAlignmentNote: 'Use common prefixes, Latin roots, and suffixes to unlock meaning.',
    },
    {
      id: 'v-g3-6',
      word: 'dependable',
      partOfSpeech: 'adjective',
      definition: 'reliable and steady; able to be trusted to work',
      passageContextSentence:
        'What once looked like ruin turns out to be a dependable tool for keeping Florida’s River of Grass healthy.',
      paragraphRef: 4,
      morphologyOrClueNote: 'Base word depend + suffix -able ("can be relied on").',
      benchmarkCode: 'ELA.3.V.1.2',
      benchmarkAlignmentNote: 'Apply base words and affixes to determine word meaning.',
    },
  ],
  complexity: analyzePassageComplexity(g3Sections, '3', 'informational', {
    complexityTier: 'Mid',
    instructionalRecommendation:
      'Well suited for Grade 3 cold-read practice on cause/effect structure, central idea, and context vocabulary.',
  }),
  practiceDisclaimer: PRACTICE_DISCLAIMER,
  createdAt: '2026-03-10T14:00:00.000Z',
  sourceMode: 'verified-seed',
};

const g3Items: AssessmentItem[] = [
  {
    id: 'item-g3-1',
    passageId: g3Passage.id,
    grade: '3',
    itemType: 'ebsr',
    benchmarkCode: 'ELA.3.R.2.2',
    officialBenchmarkText: BENCHMARKS_BY_CODE['ELA.3.R.2.2'].officialText,
    reportingCategory: 'reading-informational-text',
    reportingCategoryLabel: 'Reading Informational Text',
    cognitiveSkill: 'Identify central idea and select supporting textual evidence',
    cognitiveRigor: 'On-Grade-Level',
    dok: 2,
    prompt: 'This question has two parts. First, answer Part A. Then, answer Part B.',
    partAPrompt: 'Part A: What is the central idea of the passage?',
    partAOptions: [
      {
        id: 'g3-1a-1',
        label: 'A',
        text: 'Visitors often mistake Everglades sawgrass for lawn grass because of its bright color.',
        isCorrect: false,
        rationale: 'This is an introductory detail in Paragraph 1, not the central idea of the whole article.',
      },
      {
        id: 'g3-1a-2',
        label: 'B',
        text: 'Sawgrass has special physical traits and underground roots that help it survive drought and benefit from mild fires.',
        isCorrect: true,
        rationale: 'Correct: captures both the plant adaptations (Paragraph 2) and the beneficial role of fire (Paragraphs 3–4).',
      },
      {
        id: 'g3-1a-3',
        label: 'C',
        text: 'Hungry marsh animals avoid eating sawgrass because its leaves taste bitter in winter.',
        isCorrect: false,
        rationale: 'Distorts Paragraph 2, which mentions sharp teeth rather than bitter taste.',
      },
      {
        id: 'g3-1a-4',
        label: 'D',
        text: 'Park rangers stop all fires in the Everglades during cooler winter months.',
        isCorrect: false,
        rationale: 'Contradicts Paragraph 4, which explains that rangers carefully plan prescribed burns.',
      },
    ],
    partBPrompt: 'Part B: Which sentence from the passage best supports the answer to Part A?',
    partBOptions: [
      {
        id: 'g3-1b-1',
        label: 'A',
        text: '“Across southern Florida stretches a wide, shallow sheet of moving water known as the Everglades.”',
        isCorrect: false,
        rationale: 'Introduces the setting rather than how sawgrass survives drought and fire.',
        paragraphRef: 1,
      },
      {
        id: 'g3-1b-2',
        label: 'B',
        text: '“Because sawgrass holds living buds safely below the wet soil, mild winter fires clear away dead thatch without harming the roots.”',
        isCorrect: true,
        rationale: 'Correct: directly shows the underground structure and why mild fires renew rather than destroy sawgrass.',
        paragraphRef: 3,
      },
      {
        id: 'g3-1b-3',
        label: 'C',
        text: '“Visitors often gaze across miles of tall, golden-green blades swaying in the warm breeze and assume they are looking at ordinary grass.”',
        isCorrect: false,
        rationale: 'Describes visitor appearance impressions rather than survival adaptations.',
        paragraphRef: 1,
      },
      {
        id: 'g3-1b-4',
        label: 'D',
        text: '“For decades, many newcomers believed that every marsh fire was a disaster that destroyed wildlife habitat.”',
        isCorrect: false,
        rationale: 'Describes an outdated belief rather than the reality supporting the central idea.',
        paragraphRef: 3,
      },
    ],
    correctAnswerSummary: 'Part A: B; Part B: B',
    correctRationale:
      'Paragraphs 2–4 explain how underground stems and buds protect sawgrass during dry weather and prescribed fires, allowing the marsh to renew.',
    textualEvidenceQuote:
      'Because sawgrass holds living buds safely below the wet soil, mild winter fires clear away dead thatch without harming the roots.',
    evidenceParagraphRef: 3,
    sourceCitation:
      'Florida B.E.S.T. Standards ELA.3.R.2.2 (p. 54) & FAST ELA Reading Test Design Summary (p. 10)',
    practiceDisclaimer: PRACTICE_DISCLAIMER,
  },
  {
    id: 'item-g3-2',
    passageId: g3Passage.id,
    grade: '3',
    itemType: 'multiple_choice',
    benchmarkCode: 'ELA.3.R.2.1',
    officialBenchmarkText: BENCHMARKS_BY_CODE['ELA.3.R.2.1'].officialText,
    reportingCategory: 'reading-informational-text',
    reportingCategoryLabel: 'Reading Informational Text',
    cognitiveSkill: 'Identify cause/effect text structure',
    cognitiveRigor: 'On-Grade-Level',
    dok: 2,
    prompt: 'How does the author mainly organize the ideas in Paragraph 3?',
    options: [
      {
        id: 'g3-2-1',
        label: 'A',
        text: 'By listing events in the order rangers check weather forecasts each morning',
        isCorrect: false,
        rationale: 'Chronological weather checks appear in Paragraph 4, not Paragraph 3.',
      },
      {
        id: 'g3-2-2',
        label: 'B',
        text: 'By explaining the cause-and-effect results of mild winter fires on sawgrass marshes',
        isCorrect: true,
        rationale: 'Correct: Paragraph 3 uses "Because..." and "Soon after..." to explain what mild fires cause (clearing thatch, new shoots, open pools).',
      },
      {
        id: 'g3-2-3',
        label: 'C',
        text: 'By comparing sawgrass roots with the roots of northern oak trees',
        isCorrect: false,
        rationale: 'No comparison to oak trees appears in the passage.',
      },
      {
        id: 'g3-2-4',
        label: 'D',
        text: 'By describing what a sawgrass leaf feels like to touch',
        isCorrect: false,
        rationale: 'Leaf texture is described in Paragraph 2.',
      },
    ],
    correctAnswerSummary: 'B',
    correctRationale:
      'Paragraph 3 explains why mild winter fires do not harm sawgrass and what effects follow (new shoots, open sunlit water for birds and fish).',
    textualEvidenceQuote:
      'Because sawgrass holds living buds safely below the wet soil, mild winter fires clear away dead thatch without harming the roots.',
    evidenceParagraphRef: 3,
    sourceCitation: 'Florida B.E.S.T. Standards ELA.3.R.2.1 (p. 54)',
    practiceDisclaimer: PRACTICE_DISCLAIMER,
  },
  {
    id: 'item-g3-3',
    passageId: g3Passage.id,
    grade: '3',
    itemType: 'hot_text',
    benchmarkCode: 'ELA.3.R.2.3',
    officialBenchmarkText: BENCHMARKS_BY_CODE['ELA.3.R.2.3'].officialText,
    reportingCategory: 'reading-informational-text',
    reportingCategoryLabel: 'Reading Informational Text',
    cognitiveSkill: 'Select textual evidence showing how the author develops purpose',
    cognitiveRigor: 'On-Grade-Level',
    dok: 2,
    prompt:
      'Select the sentence from Paragraph 4 that best shows the author’s purpose of changing readers’ minds about fire in the Everglades.',
    selectionCount: 1,
    hotTextSegments: [
      {
        id: 'g3-ht-1',
        paragraphRef: 4,
        text: 'Today, Everglades rangers carefully plan prescribed burns during cooler months when winds stay gentle and predictable.',
        isCorrect: false,
        rationale: 'Explains timing of prescribed burns, not the shift in perspective.',
      },
      {
        id: 'g3-ht-2',
        paragraphRef: 4,
        text: 'By studying soil moisture and weather forecasts beforehand, fire crews help sawgrass marshes renew themselves safely.',
        isCorrect: false,
        rationale: 'Describes crew preparation steps rather than contrasting old misconceptions with reality.',
      },
      {
        id: 'g3-ht-3',
        paragraphRef: 4,
        text: 'What once looked like destruction turns out to be one of nature’s most dependable tools for keeping Florida’s River of Grass healthy.',
        isCorrect: true,
        rationale: 'Correct: directly contrasts the common misconception ("once looked like destruction") with the author’s informative message.',
      },
    ],
    correctAnswerSummary: 'What once looked like destruction turns out to be one of nature’s most dependable tools...',
    correctRationale:
      'The closing sentence directly reframes fire from "destruction" to a "dependable tool" for ecosystem health.',
    textualEvidenceQuote:
      'What once looked like destruction turns out to be one of nature’s most dependable tools for keeping Florida’s River of Grass healthy.',
    evidenceParagraphRef: 4,
    sourceCitation: 'Florida B.E.S.T. Standards ELA.3.R.2.3 (p. 54)',
    practiceDisclaimer: PRACTICE_DISCLAIMER,
  },
  {
    id: 'item-g3-4',
    passageId: g3Passage.id,
    grade: '3',
    itemType: 'multiselect',
    benchmarkCode: 'ELA.3.V.1.3',
    officialBenchmarkText: BENCHMARKS_BY_CODE['ELA.3.V.1.3'].officialText,
    reportingCategory: 'reading-across-genres-vocabulary',
    reportingCategoryLabel: 'Reading Across Genres & Vocabulary',
    cognitiveSkill: 'Use context clues to determine meaning',
    cognitiveRigor: 'Foundational',
    dok: 2,
    prompt:
      'Read this sentence from Paragraph 2: "Under the dark, muddy peat, thick stems store energy even when the dry season leaves the ground cracked and parched." Select TWO words or phrases from the passage that help the reader understand the meaning of parched.',
    selectionCount: 2,
    options: [
      { id: 'g3-4-1', label: 'A', text: 'dark, muddy', isCorrect: false, rationale: 'Describes the wet peat underground, opposite of parched.' },
      { id: 'g3-4-2', label: 'B', text: 'dry season', isCorrect: true, rationale: 'Correct: directly signals a lack of water.' },
      { id: 'g3-4-3', label: 'C', text: 'ground cracked', isCorrect: true, rationale: 'Correct: describes ground dried out from missing moisture.' },
      { id: 'g3-4-4', label: 'D', text: 'store energy', isCorrect: false, rationale: 'Explains stem function rather than surface dryness.' },
      { id: 'g3-4-5', label: 'E', text: 'morning dew', isCorrect: false, rationale: 'Refers to moisture on leaves earlier in the paragraph.' },
    ],
    correctAnswerSummary: 'B, C',
    correctRationale:
      '"Dry season" and "ground cracked" provide direct context clues showing that parched means completely dried out.',
    textualEvidenceQuote: 'even when the dry season leaves the ground cracked and parched.',
    evidenceParagraphRef: 2,
    sourceCitation: 'Florida B.E.S.T. Standards ELA.3.V.1.3 (p. 57)',
    practiceDisclaimer: PRACTICE_DISCLAIMER,
  },
];

// =========================================================================
// SEED PASSAGE 2: GRADE 4 PAIRED PRIMARY + SECONDARY — ST. AUGUSTINE LIGHTHOUSE
// =========================================================================
const g4Sections = [
  {
    id: 'sec-g4-1',
    label: 'Passage 1 (Primary Source)',
    title: 'Excerpt from Keeper Maria Mestre de los Dolores’s Notebook, 1859',
    genre: 'literary' as const,
    authorByline: 'Adapted Original Historical Diary Entry (Simulated Primary Account)',
    sourceNote: 'Original Fictionalized Firsthand Account · Grade 4 Paired Set',
    paragraphs: [
      'October 14, 1859 — Before sunset, a northeast wind began rattling the brass latches inside the St. Augustine tower. My father always said a keeper must trust her ears as much as her eyes. By dusk, salt spray tapped against the curved glass panes like impatient fingers. That sound reminded me that coastal ships depend on our steady beam.',
      'Each evening I climb the winding iron steps with a heavy copper can of lard oil. Trimming the woven cotton wicks takes calm hands. If a wick burns unevenly, black soot clouds the precious glass prisms. Tonight the storm gusted fiercely. Still, as I lit the central lamp, amber light spilled across the dark Atlantic breakers like a golden ribbon guiding sailors safely home.',
    ],
  },
  {
    id: 'sec-g4-2',
    label: 'Passage 2 (Secondary Source)',
    title: 'Guarding the First Coast: The Science of Early Lighthouses',
    genre: 'informational' as const,
    sourceNote: 'Original Informational Article · Secondary Historical Account',
    paragraphs: [
      'During the nineteenth century, Florida’s Atlantic shoreline posed serious hazards for wooden ships. Shifting sandbars and shallow reefs waited just beneath the waves near St. Augustine. To warn captains away from danger, lighthouses used a remarkable optical invention called the Fresnel lens. This beehive-shaped frame of concentric glass prisms focused a single flame into a beam visible for miles.',
      'Maintaining that beacon demanded exhausting daily labor. Keepers hauled gallons of fuel oil up narrow spiral staircases and polished hundreds of glass edges. Every few hours, they wound heavy clockwork weights so the revolving lens never stalled. Automated electric lamps replaced oil burners in the twentieth century. Still, historical records show that early keepers’ careful routines saved countless ships along Florida’s coast.',
    ],
  },
];

const g4Passage: ReadingPassage = {
  id: 'passage-g4-lighthouse',
  title: 'Beacons on the Atlantic: St. Augustine Keepers & Fresnel Lenses',
  grade: '4',
  textType: 'paired',
  topic: 'Florida Maritime History & Primary vs. Secondary Sources',
  targetLength: 'standard',
  vocabularyComplexity: 'on-grade',
  alignedBenchmarks: ['ELA.4.R.1.3', 'ELA.4.R.2.1', 'ELA.4.R.3.1', 'ELA.4.R.3.3', 'ELA.4.V.1.2'],
  sections: g4Sections,
  glossary: [
    {
      term: 'lard oil',
      definition: 'a refined oil once burned in nineteenth-century lighthouse lamps before kerosene or electricity',
    },
    {
      term: 'Fresnel lens',
      definition: 'a stepped glass lens built of rings and prisms that concentrates light into a bright horizontal beam',
    },
  ],
  vocabularyGuide: [
    {
      id: 'v-g4-1',
      word: 'impatient',
      partOfSpeech: 'adjective',
      definition: 'restless or eager without wanting to wait',
      passageContextSentence:
        'By dusk, salt spray tapped against the curved glass panes like impatient fingers, reminding me that coastal ships depend on our steady beam.',
      paragraphRef: 1,
      morphologyOrClueNote: 'Prefix im- ("not") + root patient.',
      benchmarkCode: 'ELA.4.V.1.2',
      benchmarkAlignmentNote: 'Use prefix im- ("not") and figurative simile context.',
    },
    {
      id: 'v-g4-2',
      word: 'prisms',
      partOfSpeech: 'noun',
      definition: 'shaped pieces of clear glass that bend or focus light',
      passageContextSentence:
        'Trimming the woven cotton wicks takes calm hands; if a wick burns unevenly, black soot clouds the precious glass prisms.',
      paragraphRef: 2,
      morphologyOrClueNote: 'Cross-referenced in Passage 2 ("concentric glass prisms that focused a single flame").',
      benchmarkCode: 'ELA.4.V.1.3',
      benchmarkAlignmentNote: 'Use cross-text context clues to clarify technical noun meaning.',
    },
    {
      id: 'v-g4-3',
      word: 'hazards',
      partOfSpeech: 'noun',
      definition: 'dangers or risks that can cause harm',
      passageContextSentence:
        'During the nineteenth century, Florida’s Atlantic shoreline posed serious hazards for wooden cargo ships navigating shifting sandbars near St. Augustine.',
      paragraphRef: 3,
      morphologyOrClueNote: 'Context clue: "shifting sandbars" and "warn captains away from shallow reefs".',
      benchmarkCode: 'ELA.4.V.1.3',
      benchmarkAlignmentNote: 'Use sentence examples of dangers to infer meaning.',
    },
    {
      id: 'v-g4-4',
      word: 'concentric',
      partOfSpeech: 'adjective',
      definition: 'sharing the same center, such as circles or rings nested inside one another',
      passageContextSentence:
        'To warn captains away from shallow reefs, lighthouses used a remarkable optical invention called the Fresnel lens—a beehive-shaped frame of concentric glass prisms that focused a single flame into a beam visible for miles.',
      paragraphRef: 3,
      morphologyOrClueNote: 'Prefix con- ("together/with") + Latin root centr ("center") + suffix -ic.',
      benchmarkCode: 'ELA.4.V.1.2',
      benchmarkAlignmentNote: 'Apply Latin roots and prefixes to decode scientific vocabulary.',
    },
    {
      id: 'v-g4-5',
      word: 'automated',
      partOfSpeech: 'adjective',
      definition: 'operated by machines or equipment rather than constant human labor',
      passageContextSentence:
        'Although automated electric lamps eventually replaced oil burners in the twentieth century, historical records show that early keepers’ careful routines saved countless vessels along Florida’s coast.',
      paragraphRef: 4,
      morphologyOrClueNote: 'Greek root auto ("self") from Appendix D 3–5 root list.',
      benchmarkCode: 'ELA.4.V.1.2',
      benchmarkAlignmentNote: 'Applies Appendix D Grade 3–5 Greek root auto ("self").',
    },
  ],
  complexity: analyzePassageComplexity(g4Sections, '4', 'paired', {
    complexityTier: 'Mid',
    instructionalRecommendation:
      'Ideal for Grade 4 paired-passage instruction contrasting firsthand journal voice with secondary informational explanation.',
  }),
  practiceDisclaimer: PRACTICE_DISCLAIMER,
  createdAt: '2026-03-11T09:30:00.000Z',
  sourceMode: 'verified-seed',
};

const g4Items: AssessmentItem[] = [
  {
    id: 'item-g4-1',
    passageId: g4Passage.id,
    grade: '4',
    itemType: 'table_match',
    benchmarkCode: 'ELA.4.R.3.3',
    officialBenchmarkText: BENCHMARKS_BY_CODE['ELA.4.R.3.3'].officialText,
    reportingCategory: 'reading-across-genres-vocabulary',
    reportingCategoryLabel: 'Reading Across Genres & Vocabulary',
    cognitiveSkill: 'Compare and contrast primary and secondary accounts of the same topic',
    cognitiveRigor: 'On-Grade-Level',
    dok: 3,
    prompt:
      'Determine whether each detail is found only in Passage 1 (Primary Source), only in Passage 2 (Secondary Source), or in Both Passages.',
    tableMatch: {
      columns: [
        { id: 'p1', label: 'Passage 1 Only' },
        { id: 'p2', label: 'Passage 2 Only' },
        { id: 'both', label: 'Both Passages' },
      ],
      rows: [
        {
          id: 'r1',
          statement: 'Carrying oil up the tower stairs to keep the beacon working',
          correctColumnIds: ['both'],
          rationale: 'Both Passage 1 (Paragraph 2) and Passage 2 (Paragraph 4) describe hauling fuel oil up the steps.',
        },
        {
          id: 'r2',
          statement: 'A personal memory of what a keeper’s father advised about listening',
          correctColumnIds: ['p1'],
          rationale: 'Only Passage 1 includes the firsthand reflection from the keeper’s father.',
        },
        {
          id: 'r3',
          statement: 'How twentieth-century electric lamps eventually replaced oil burners',
          correctColumnIds: ['p2'],
          rationale: 'Only Passage 2 provides the historical overview extending into the twentieth century.',
        },
      ],
    },
    correctAnswerSummary: 'Row 1: Both Passages; Row 2: Passage 1 Only; Row 3: Passage 2 Only',
    correctRationale:
      'Primary accounts emphasize personal sensory experience in the moment, while secondary sources summarize historical context and technological shifts over decades.',
    textualEvidenceQuote:
      'Keepers hauled gallons of fuel oil up narrow spiral staircases... Although automated electric lamps eventually replaced oil burners in the twentieth century...',
    evidenceParagraphRef: 4,
    sourceCitation:
      'Florida B.E.S.T. Standards ELA.4.R.3.3 (p. 63) & FAST ELA Reading Test Design Summary (p. 10)',
    practiceDisclaimer: PRACTICE_DISCLAIMER,
  },
  {
    id: 'item-g4-2',
    passageId: g4Passage.id,
    grade: '4',
    itemType: 'ebsr',
    benchmarkCode: 'ELA.4.R.3.1',
    officialBenchmarkText: BENCHMARKS_BY_CODE['ELA.4.R.3.1'].officialText,
    reportingCategory: 'reading-across-genres-vocabulary',
    reportingCategoryLabel: 'Reading Across Genres & Vocabulary',
    cognitiveSkill: 'Explain how figurative language contributes to meaning',
    cognitiveRigor: 'On-Grade-Level',
    dok: 2,
    prompt: 'This question has two parts. First, answer Part A. Then, answer Part B.',
    partAPrompt:
      'Part A: In Passage 1, Paragraph 2, why does the narrator compare the lamp’s light to "a golden ribbon guiding sailors safely home"?',
    partAOptions: [
      {
        id: 'g4-2a-1',
        label: 'A',
        text: 'To show that the lighthouse beam formed a clear, protective path across dark ocean waves',
        isCorrect: true,
        rationale: 'Correct: the simile highlights how steady and visible the focused light looked over stormy water.',
      },
      {
        id: 'g4-2a-2',
        label: 'B',
        text: 'To suggest that sailors decorated their wooden ships with yellow cloth before storms',
        isCorrect: false,
        rationale: 'Misreads the figurative image literally.',
      },
      {
        id: 'g4-2a-3',
        label: 'C',
        text: 'To show that the lamp flame was weak and flickered like a loose thread',
        isCorrect: false,
        rationale: 'Contradicts the steady, bright effect described in the sentence.',
      },
      {
        id: 'g4-2a-4',
        label: 'D',
        text: 'To explain how cotton wicks were tied around the brass latches',
        isCorrect: false,
        rationale: 'Confuses physical lamp maintenance with the ocean simile.',
      },
    ],
    partBPrompt:
      'Part B: Which detail from Passage 2 connects directly to the effect described in Part A?',
    partBOptions: [
      {
        id: 'g4-2b-1',
        label: 'A',
        text: '“Keepers hauled gallons of fuel oil up narrow spiral staircases...”',
        isCorrect: false,
        rationale: 'Describes physical labor rather than the brightness/reach of the beam.',
        paragraphRef: 4,
      },
      {
        id: 'g4-2b-2',
        label: 'B',
        text: '“...focused a single flame into a beam visible for miles.”',
        isCorrect: true,
        rationale: 'Correct: explains the optical reason the beam stretched visibly across the dark water.',
        paragraphRef: 3,
      },
      {
        id: 'g4-2b-3',
        label: 'C',
        text: '“...wound heavy clockwork weights every few hours...”',
        isCorrect: false,
        rationale: 'Explains rotation mechanics rather than the beam reaching sailors.',
        paragraphRef: 4,
      },
      {
        id: 'g4-2b-4',
        label: 'D',
        text: '“...wooden cargo ships navigating shifting sandbars...”',
        isCorrect: false,
        rationale: 'Identifies the hazard rather than how the light guided ships.',
        paragraphRef: 3,
      },
    ],
    correctAnswerSummary: 'Part A: A; Part B: B',
    correctRationale:
      'The simile emphasizes the steady guiding beam over dark breakers, which Passage 2 explains scientifically via the Fresnel lens.',
    textualEvidenceQuote: 'amber light spilled across the dark Atlantic breakers like a golden ribbon guiding sailors safely home.',
    evidenceParagraphRef: 2,
    sourceCitation: 'Florida B.E.S.T. Standards ELA.4.R.3.1 (p. 63)',
    practiceDisclaimer: PRACTICE_DISCLAIMER,
  },
  {
    id: 'item-g4-3',
    passageId: g4Passage.id,
    grade: '4',
    itemType: 'multiple_choice',
    benchmarkCode: 'ELA.4.R.1.3',
    officialBenchmarkText: BENCHMARKS_BY_CODE['ELA.4.R.1.3'].officialText,
    reportingCategory: 'reading-prose-poetry',
    reportingCategoryLabel: 'Reading Prose and Poetry',
    cognitiveSkill: 'Distinguish narrator point of view from character perspective',
    cognitiveRigor: 'On-Grade-Level',
    dok: 2,
    prompt:
      'Which statement accurately describes the narrator’s point of view AND perspective in Passage 1?',
    options: [
      {
        id: 'g4-3-1',
        label: 'A',
        text: 'It is written in third-person point of view from a sailor who feels angry about waiting offshore.',
        isCorrect: false,
        rationale: 'Passage 1 uses first-person ("I", "my") from the lighthouse keeper.',
      },
      {
        id: 'g4-3-2',
        label: 'B',
        text: 'It is written in first-person point of view and shows the keeper’s calm sense of responsibility during a storm.',
        isCorrect: true,
        rationale: 'Correct: distinguishes first-person point of view ("I climb") from her perspective/attitude (calm duty to sailors).',
      },
      {
        id: 'g4-3-3',
        label: 'C',
        text: 'It is written in first-person point of view and shows the keeper wants to abandon the tower before dusk.',
        isCorrect: false,
        rationale: 'Contradicts her careful trimming of wicks and lighting of the lamp.',
      },
      {
        id: 'g4-3-4',
        label: 'D',
        text: 'It is written in third-person point of view and explains why modern electric lamps are easier to use.',
        isCorrect: false,
        rationale: 'Describes Passage 2 rather than Passage 1.',
      },
    ],
    correctAnswerSummary: 'B',
    correctRationale:
      'B.E.S.T. ELA.4.R.1.3 Clarification 1 distinguishes point of view (first-person narrator) from perspective (responsible, steady attitude).',
    textualEvidenceQuote: 'Trimming the woven cotton wicks takes calm hands; if a wick burns unevenly, black soot clouds the precious glass prisms.',
    evidenceParagraphRef: 2,
    sourceCitation: 'Florida B.E.S.T. Standards ELA.4.R.1.3 (p. 62)',
    practiceDisclaimer: PRACTICE_DISCLAIMER,
  },
  {
    id: 'item-g4-4',
    passageId: g4Passage.id,
    grade: '4',
    itemType: 'multiple_choice',
    benchmarkCode: 'ELA.4.V.1.2',
    officialBenchmarkText: BENCHMARKS_BY_CODE['ELA.4.V.1.2'].officialText,
    reportingCategory: 'reading-across-genres-vocabulary',
    reportingCategoryLabel: 'Reading Across Genres & Vocabulary',
    cognitiveSkill: 'Apply Greek root knowledge to unfamiliar vocabulary',
    cognitiveRigor: 'Foundational',
    dok: 1,
    prompt:
      'In Passage 2, Paragraph 4, the word automated comes from the Greek root auto, meaning "self." What does automated mean in the sentence "Although automated electric lamps eventually replaced oil burners..."?',
    options: [
      {
        id: 'g4-4-1',
        label: 'A',
        text: 'Operating on its own without constant human tending',
        isCorrect: true,
        rationale: 'Correct: connects Greek root auto ("self") with replacing keepers’ manual routines.',
      },
      {
        id: 'g4-4-2',
        label: 'B',
        text: 'Built out of heavier brass and copper parts',
        isCorrect: false,
        rationale: 'Confuses materials in Passage 1 with the root auto.',
      },
      {
        id: 'g4-4-3',
        label: 'C',
        text: 'Dimmed to prevent bright reflections on sandbars',
        isCorrect: false,
        rationale: 'Contradicts lighthouse purpose.',
      },
      {
        id: 'g4-4-4',
        label: 'D',
        text: 'Carried up spiral staircases by two keepers at once',
        isCorrect: false,
        rationale: 'Describes manual oil hauling rather than self-operating lamps.',
      },
    ],
    correctAnswerSummary: 'A',
    correctRationale: 'Appendix D Greek root auto means "self", matching electric lamps that run without manual winding and oil hauling.',
    textualEvidenceQuote: 'Although automated electric lamps eventually replaced oil burners in the twentieth century...',
    evidenceParagraphRef: 4,
    sourceCitation: 'Florida B.E.S.T. Standards ELA.4.V.1.2 (p. 66) & Appendix D (p. 200)',
    practiceDisclaimer: PRACTICE_DISCLAIMER,
  },
];

// =========================================================================
// SEED PASSAGE 3: GRADE 5 ARGUMENTATIVE INFORMATIONAL — URBAN TREE CANOPIES
// =========================================================================
const g5Sections = [
  {
    id: 'sec-g5-1',
    label: 'Article',
    title: 'Shade That Works Overtime: Why Cities Need Native Tree Canopies',
    genre: 'informational' as const,
    sourceNote: 'Original Informational Argument · Grade 5 Science & Civics',
    paragraphs: [
      'Step onto a wide asphalt lot on a July day in central Florida. Heat shimmers off the blacktop like waves over a stove. Walk fifty yards under a canopy of live oaks, though, and the air cools fast. City planners call that heat spike over paved streets the urban heat island effect. Growing proof shows that planting native trees is a smart buy for Florida towns.',
      'First, wide tree crowns cool streets and cut summer power use. Leaves transpire water and block hot sun from brick walls and roads. As a result, shaded spots stay twenty to forty degrees cooler than bare lots. Studies in coastal municipalities found that homes shaded by mature live oaks used markedly less cooling power in August heat waves. Those savings shrink bills and ease strain on power lines.',
      'Critics sometimes argue that street trees cost too much to trim and drop limbs in storms. Those concerns call for smart planning, not giving up on city trees. Wind-resistant Florida natives like live oak, bald cypress, and sable palm hold firm when given wide soil beds. Shallow-rooted ornamentals tucked into tiny sidewalk cuts fail far more often in high winds.',
      'Tree canopies also clean storm rain before it flows into ponds and springs. Deep roots break up compacted city dirt so rain soaks down into the ground. Without roots, runoff washes motor oil and trash straight into creeks. When town leaders fund native trees and routine trims, they are not just buying nice views. They are building living infrastructure that cools streets, guards clean water, and boosts town resilience.',
    ],
  },
];

const g5Passage: ReadingPassage = {
  id: 'passage-g5-canopy',
  title: 'Shade That Works Overtime: Why Cities Need Native Tree Canopies',
  grade: '5',
  textType: 'informational',
  topic: 'Urban Tree Canopies, Heat Islands & Living Infrastructure',
  targetLength: 'standard',
  vocabularyComplexity: 'on-grade',
  alignedBenchmarks: ['ELA.5.R.2.1', 'ELA.5.R.2.2', 'ELA.5.R.2.3', 'ELA.5.R.2.4', 'ELA.5.V.1.3'],
  sections: g5Sections,
  glossary: [
    {
      term: 'transpire',
      definition: 'to release water vapor into the air through tiny openings in plant leaves',
    },
    {
      term: 'municipalities',
      definition: 'cities or towns with their own local governments',
    },
  ],
  vocabularyGuide: [
    {
      id: 'v-g5-1',
      word: 'canopy',
      partOfSpeech: 'noun',
      definition: 'an overhead covering formed by the spreading branches and leaves of trees',
      passageContextSentence:
        'Walk fifty yards under a canopy of live oaks, though, and the air cools fast.',
      paragraphRef: 1,
      morphologyOrClueNote: 'Contrasted with "wide asphalt lot" and "bare lots" exposed to direct sun.',
      benchmarkCode: 'ELA.5.V.1.3',
      benchmarkAlignmentNote: 'Determine domain meaning from spatial contrast clues.',
    },
    {
      id: 'v-g5-2',
      word: 'markedly',
      partOfSpeech: 'adverb',
      definition: 'in a clear, noticeable, or significant way',
      passageContextSentence:
        'Studies in coastal municipalities found that homes shaded by mature live oaks used markedly less cooling power in August heat waves.',
      paragraphRef: 2,
      morphologyOrClueNote: 'Root mark + suffix -ed + adverb suffix -ly ("to a noticeable degree").',
      benchmarkCode: 'ELA.5.V.1.2',
      benchmarkAlignmentNote: 'Analyze suffix connection to part of speech (adverb modifying "less").',
    },
    {
      id: 'v-g5-3',
      word: 'ornamentals',
      partOfSpeech: 'noun',
      definition: 'plants grown primarily for decorative appearance rather than ecological function',
      passageContextSentence:
        'Shallow-rooted ornamentals tucked into tiny sidewalk cuts fail far more often in high winds.',
      paragraphRef: 3,
      morphologyOrClueNote: 'Contrasted with wind-resistant native species; connects to "nice views" in P4.',
      benchmarkCode: 'ELA.5.V.1.3',
      benchmarkAlignmentNote: 'Use contrast relationships across paragraphs.',
    },
    {
      id: 'v-g5-4',
      word: 'compacted',
      partOfSpeech: 'adjective',
      definition: 'pressed tightly together so little space remains for air or water',
      passageContextSentence:
        'Deep roots break up compacted city dirt so rain soaks down into the ground.',
      paragraphRef: 4,
      morphologyOrClueNote: 'Prefix com- ("together") + root pact ("fasten/press"); antonym clue "break up".',
      benchmarkCode: 'ELA.5.V.1.3',
      benchmarkAlignmentNote: 'Use context clue ("break up") and Latin prefix com-.',
    },
    {
      id: 'v-g5-5',
      word: 'infrastructure',
      partOfSpeech: 'noun',
      definition: 'the basic physical systems and facilities needed for a community to function',
      passageContextSentence:
        'They are building living infrastructure that cools streets, guards clean water, and boosts town resilience.',
      paragraphRef: 4,
      morphologyOrClueNote: 'Latin prefix infra- ("below/underneath") + root struct ("build").',
      benchmarkCode: 'ELA.5.V.1.2',
      benchmarkAlignmentNote: 'Apply Latin roots and prefixes to Grade 5 academic vocabulary.',
    },
    {
      id: 'v-g5-6',
      word: 'resilience',
      partOfSpeech: 'noun',
      definition: 'the capacity to recover quickly from difficulties or stress such as storms and heat',
      passageContextSentence:
        'They are building living infrastructure that cools streets, guards clean water, and boosts town resilience.',
      paragraphRef: 4,
      morphologyOrClueNote: 'Noun formed with suffix -ence; summarizes cooling, storm readiness, and clean water.',
      benchmarkCode: 'ELA.5.V.1.1',
      benchmarkAlignmentNote: 'Tier 2 cross-curricular academic noun.',
    },
  ],
  complexity: analyzePassageComplexity(g5Sections, '5', 'informational', {
    complexityTier: 'Mid',
    instructionalRecommendation:
      'Strong fit for Grade 5 argument tracking (claim, evidence, counterargument reasoning) and multi-clause academic vocabulary.',
  }),
  practiceDisclaimer: PRACTICE_DISCLAIMER,
  createdAt: '2026-03-12T10:15:00.000Z',
  sourceMode: 'verified-seed',
};

const g5Items: AssessmentItem[] = [
  {
    id: 'item-g5-1',
    passageId: g5Passage.id,
    grade: '5',
    itemType: 'ebsr',
    benchmarkCode: 'ELA.5.R.2.4',
    officialBenchmarkText: BENCHMARKS_BY_CODE['ELA.5.R.2.4'].officialText,
    reportingCategory: 'reading-informational-text',
    reportingCategoryLabel: 'Reading Informational Text',
    cognitiveSkill: 'Track claim, counterargument, and supporting reasoning',
    cognitiveRigor: 'Advanced',
    dok: 3,
    prompt: 'This question has two parts. First, answer Part A. Then, answer Part B.',
    partAPrompt:
      'Part A: How does the author respond to critics’ claim in Paragraph 3 that street trees are costly and drop branches during storms?',
    partAOptions: [
      {
        id: 'g5-1a-1',
        label: 'A',
        text: 'By proving that live oaks never lose any branches even in severe hurricanes',
        isCorrect: false,
        rationale: 'Overstates the claim; the author says proper species and soil volumes "dramatically reduce" storm damage.',
      },
      {
        id: 'g5-1a-2',
        label: 'B',
        text: 'By showing that smart species selection and wider soil spaces address the problem without giving up urban trees',
        isCorrect: true,
        rationale: 'Correct: acknowledges the concern ("deserve careful planning") and counters with wind-resistant native species and root-zone engineering.',
      },
      {
        id: 'g5-1a-3',
        label: 'C',
        text: 'By arguing that cities should stop paving parking lots instead of planting trees',
        isCorrect: false,
        rationale: 'Not proposed in the passage.',
      },
      {
        id: 'g5-1a-4',
        label: 'D',
        text: 'By recommending non-native ornamental trees because they grow smaller crowns',
        isCorrect: false,
        rationale: 'Contradicts Paragraph 3, which faults shallow-rooted non-native ornamentals.',
      },
    ],
    partBPrompt:
      'Part B: Which sentence from Paragraph 3 best supports the answer to Part A?',
    partBOptions: [
      {
        id: 'g5-1b-1',
        label: 'A',
        text: '“Critics sometimes argue that street trees cost too much to trim and drop limbs in storms.”',
        isCorrect: false,
        rationale: 'States the critics’ claim rather than the author’s counter-reasoning.',
        paragraphRef: 3,
      },
      {
        id: 'g5-1b-2',
        label: 'B',
        text: '“Wind-resistant Florida natives like live oak, bald cypress, and sable palm hold firm when given wide soil beds.”',
        isCorrect: true,
        rationale: 'Correct: provides the exact evidence and reasoning refuting the critics’ conclusion.',
        paragraphRef: 3,
      },
      {
        id: 'g5-1b-3',
        label: 'C',
        text: '“Those concerns call for smart planning, not giving up on city trees.”',
        isCorrect: false,
        rationale: 'States the transitional stance, whereas sentence 3 supplies the concrete evidence.',
        paragraphRef: 3,
      },
    ],
    correctAnswerSummary: 'Part A: B; Part B: B',
    correctRationale:
      'Tracking an argument requires recognizing how the author addresses counterclaims using specific species and soil-bed evidence.',
    textualEvidenceQuote:
      'Wind-resistant Florida natives like live oak, bald cypress, and sable palm hold firm when given wide soil beds.',
    evidenceParagraphRef: 3,
    sourceCitation: 'Florida B.E.S.T. Standards ELA.5.R.2.4 (p. 72)',
    practiceDisclaimer: PRACTICE_DISCLAIMER,
  },
  {
    id: 'item-g5-2',
    passageId: g5Passage.id,
    grade: '5',
    itemType: 'multiselect',
    benchmarkCode: 'ELA.5.R.2.2',
    officialBenchmarkText: BENCHMARKS_BY_CODE['ELA.5.R.2.2'].officialText,
    reportingCategory: 'reading-informational-text',
    reportingCategoryLabel: 'Reading Informational Text',
    cognitiveSkill: 'Select multiple relevant details supporting a central claim',
    cognitiveRigor: 'On-Grade-Level',
    dok: 2,
    prompt:
      'The central idea of the passage is that native urban tree canopies function as essential living infrastructure for Florida cities. Select TWO details from the passage that directly support this central idea.',
    selectionCount: 2,
    options: [
      {
        id: 'g5-2-1',
        label: 'A',
        text: 'Heat can shimmer over July asphalt parking lots like ripples on a stove.',
        isCorrect: false,
        rationale: 'Introductory sensory hook illustrating the heat island problem, not the benefits of canopies.',
      },
      {
        id: 'g5-2-2',
        label: 'B',
        text: 'Shaded neighborhoods use noticeably less air-conditioning power during peak summer heat waves.',
        isCorrect: true,
        rationale: 'Correct: demonstrates measurable energy/grid infrastructure benefit.',
      },
      {
        id: 'g5-2-3',
        label: 'C',
        text: 'Deep tree roots loosen soil so rainwater soaks underground instead of washing pollutants into waterways.',
        isCorrect: true,
        rationale: 'Correct: demonstrates stormwater filtration infrastructure benefit.',
      },
      {
        id: 'g5-2-4',
        label: 'D',
        text: 'Shallow-rooted ornamentals struggle in cramped sidewalk cutouts.',
        isCorrect: false,
        rationale: 'Explains why poor planting choices fail rather than how native canopies function as infrastructure.',
      },
      {
        id: 'g5-2-5',
        label: 'E',
        text: 'Critics sometimes worry about the cost of pruning street trees.',
        isCorrect: false,
        rationale: 'Represents the opposing concern rather than support for the central idea.',
      },
    ],
    correctAnswerSummary: 'B, C',
    correctRationale: 'Energy grid relief (Paragraph 2) and stormwater filtration (Paragraph 4) substantiate why native canopies are living infrastructure.',
    textualEvidenceQuote: 'cooling streets, protects water quality, and strengthens community resilience.',
    evidenceParagraphRef: 4,
    sourceCitation: 'Florida B.E.S.T. Standards ELA.5.R.2.2 (p. 72)',
    practiceDisclaimer: PRACTICE_DISCLAIMER,
  },
  {
    id: 'item-g5-3',
    passageId: g5Passage.id,
    grade: '5',
    itemType: 'multiple_choice',
    benchmarkCode: 'ELA.5.R.2.3',
    officialBenchmarkText: BENCHMARKS_BY_CODE['ELA.5.R.2.3'].officialText,
    reportingCategory: 'reading-informational-text',
    reportingCategoryLabel: 'Reading Informational Text',
    cognitiveSkill: 'Analyze author’s purpose and perspective',
    cognitiveRigor: 'On-Grade-Level',
    dok: 2,
    prompt:
      'Which statement best describes the author’s perspective toward city budgets for native trees?',
    options: [
      {
        id: 'g5-3-1',
        label: 'A',
        text: 'Tree budgets are an unnecessary luxury that should wait until after roads are paved.',
        isCorrect: false,
        rationale: 'Opposite of the author’s stance.',
      },
      {
        id: 'g5-3-2',
        label: 'B',
        text: 'Tree budgets are a practical, high-value investment that saves energy and protects water resources.',
        isCorrect: true,
        rationale: 'Correct: matches "smartest investments" (P1) and "building living infrastructure" (P4).',
      },
      {
        id: 'g5-3-3',
        label: 'C',
        text: 'City leaders should avoid pruning trees so neighborhoods look wilder and more natural.',
        isCorrect: false,
        rationale: 'Paragraph 4 explicitly advocates budgeting for "routine pruning."',
      },
      {
        id: 'g5-3-4',
        label: 'D',
        text: 'Private homeowners alone should pay for shade trees without municipal planning.',
        isCorrect: false,
        rationale: 'Unsupported by the text.',
      },
    ],
    correctAnswerSummary: 'B',
    correctRationale:
      'From "smartest investments" in Paragraph 1 to "living infrastructure" in Paragraph 4, the author views native tree funding as practical civic policy.',
    textualEvidenceQuote:
      'When city leaders budget for native trees and routine pruning, they are not simply buying decoration; they are building living infrastructure...',
    evidenceParagraphRef: 4,
    sourceCitation: 'Florida B.E.S.T. Standards ELA.5.R.2.3 (p. 72)',
    practiceDisclaimer: PRACTICE_DISCLAIMER,
  },
];

// =========================================================================
// SEED PASSAGE 4: GRADE 3 LITERARY — THE RAIN BARREL CLUB
// =========================================================================
const g3LitSections = [
  {
    id: 'sec-g3-lit-1',
    label: 'Story',
    title: 'The Rain Barrel Promise',
    genre: 'literary' as const,
    sourceNote: 'Original Literary Story · Grade 3 Narrative Practice',
    paragraphs: [
      'Each day after school, Mateo ran to the town garden behind his school. He checked his neat row of cherry tomatoes. All April, hot sun baked the sandy dirt. Soon the leaves drooped low like tired hats. On Tuesday, Ms. Alvarez hung a sign on the gate: "Dry Spell — Please Conserve!"',
      'Mateo sighed and stared at the empty watering cans. Across the path, his friend Priya set a blue barrel under the shed’s metal spout. "You want to catch rain when the sky holds zero clouds?" Mateo asked, arms crossed. Priya wiped her brow and grinned. "When storm clouds roll off the bay, this tub will hold fifty pails. If not, that rain runs straight down the road drain."',
      'Mateo doubted one barrel could help ten beds, yet he hated seeing his plants wilt. Next day he brought window screen from his granddad’s shed. It would keep stray leaves and bugs out of Priya’s tub. By Friday, two fourth graders joined in. Together they set a brass spigot near the base and stacked flat bricks below so cans fit underneath.',
      'Saturday came with a sudden boom of thunder. Silver sheets of rain beat on the tin roof. Mateo and Priya stood by the oak tree watching clean water surge down the spout and fill the barrel to the brim. On Monday, Mateo turned the brass spigot and filled his can without using the city hose. Looking at the perky green tomato vines, he realized big problems shrink when neighbors prepare together.',
    ],
  },
];

const g3LitPassage: ReadingPassage = {
  id: 'passage-g3-rainbarrel',
  title: 'The Rain Barrel Promise',
  grade: '3',
  textType: 'literary',
  topic: 'Community Problem-Solving & Water Conservation',
  targetLength: 'short',
  vocabularyComplexity: 'on-grade',
  alignedBenchmarks: ['ELA.3.R.1.1', 'ELA.3.R.1.2', 'ELA.3.R.1.3', 'ELA.3.R.3.1', 'ELA.3.V.1.3'],
  sections: g3LitSections,
  glossary: [
    { term: 'spigot', definition: 'a small faucet or valve used to control the flow of liquid from a container' },
  ],
  vocabularyGuide: [
    {
      id: 'v-g3l-1',
      word: 'conserve',
      partOfSpeech: 'verb',
      definition: 'to save and use carefully so something is not wasted',
      passageContextSentence:
        'On Tuesday, Ms. Alvarez hung a sign on the gate: "Dry Spell — Please Conserve!"',
      paragraphRef: 1,
      morphologyOrClueNote: 'Context clue: "Dry Spell" sign and empty watering cans.',
      benchmarkCode: 'ELA.3.V.1.3',
      benchmarkAlignmentNote: 'Determine word meaning from situational context.',
    },
    {
      id: 'v-g3l-2',
      word: 'doubted',
      partOfSpeech: 'verb',
      definition: 'felt uncertain or did not believe something would work',
      passageContextSentence:
        'Mateo doubted one barrel could help ten beds, yet he hated seeing his plants wilt.',
      paragraphRef: 3,
      morphologyOrClueNote: 'Connected to Mateo’s skeptical question and crossed arms in Paragraph 2.',
      benchmarkCode: 'ELA.3.V.1.3',
      benchmarkAlignmentNote: 'Use character reaction clues to define feeling verb.',
    },
    {
      id: 'v-g3l-3',
      word: 'wilt',
      partOfSpeech: 'verb',
      definition: 'to droop and lose stiffness from heat or lack of water',
      passageContextSentence:
        'Mateo doubted one barrel could help ten beds, yet he hated seeing his plants wilt.',
      paragraphRef: 3,
      morphologyOrClueNote: 'Connects back to Paragraph 1: "leaves drooped low like tired hats".',
      benchmarkCode: 'ELA.3.V.1.3',
      benchmarkAlignmentNote: 'Cross-paragraph synonym clue ("drooped").',
    },
    {
      id: 'v-g3l-4',
      word: 'spigot',
      partOfSpeech: 'noun',
      definition: 'a small faucet or valve used to control the flow of liquid from a container',
      passageContextSentence:
        'Together they set a brass spigot near the base and stacked flat bricks below so cans fit underneath.',
      paragraphRef: 3,
      morphologyOrClueNote: 'Context clue: turned to fill a watering can without using the city hose.',
      benchmarkCode: 'ELA.3.V.1.3',
      benchmarkAlignmentNote: 'Use functional context clues in narrative text.',
    },
    {
      id: 'v-g3l-5',
      word: 'surge',
      partOfSpeech: 'verb',
      definition: 'to rush or flow forward suddenly with force',
      passageContextSentence:
        'Mateo and Priya stood by the oak tree watching clean water surge down the spout and fill the barrel to the brim.',
      paragraphRef: 4,
      morphologyOrClueNote: 'Context clues: "Silver sheets of rain" and "fill the barrel to the brim".',
      benchmarkCode: 'ELA.3.V.1.3',
      benchmarkAlignmentNote: 'Use vivid action clues to infer meaning.',
    },
  ],
  complexity: analyzePassageComplexity(g3LitSections, '3', 'literary', {
    complexityTier: 'Mid',
    instructionalRecommendation:
      'Ideal Grade 3 narrative text for character development (R.1.1), character perspective (R.1.3), and theme (R.1.2).',
  }),
  practiceDisclaimer: PRACTICE_DISCLAIMER,
  createdAt: '2026-03-13T11:00:00.000Z',
  sourceMode: 'verified-seed',
};

const g3LitItems: AssessmentItem[] = [
  {
    id: 'item-g3l-1',
    passageId: g3LitPassage.id,
    grade: '3',
    itemType: 'multiple_choice',
    benchmarkCode: 'ELA.3.R.1.1',
    officialBenchmarkText: BENCHMARKS_BY_CODE['ELA.3.R.1.1'].officialText,
    reportingCategory: 'reading-prose-poetry',
    reportingCategoryLabel: 'Reading Prose and Poetry',
    cognitiveSkill: 'Explain how a character develops throughout the plot',
    cognitiveRigor: 'On-Grade-Level',
    dok: 2,
    prompt: 'How do Mateo’s feelings toward the rain barrel change from Paragraph 2 to Paragraph 4?',
    options: [
      {
        id: 'g3l-1-1',
        label: 'A',
        text: 'He moves from doubting Priya’s idea to helping build it and seeing how teamwork solves the problem.',
        isCorrect: true,
        rationale: 'Correct: Mateo folds his arms and doubts at first (P2–3), then brings window screen (P3) and appreciates the result (P4).',
      },
      {
        id: 'g3l-1-2',
        label: 'B',
        text: 'He starts out excited about the rain barrel and becomes frustrated when the storm overflows it.',
        isCorrect: false,
        rationale: 'Reverses Mateo’s arc.',
      },
      {
        id: 'g3l-1-3',
        label: 'C',
        text: 'He prefers using the city hose the entire time and avoids helping the fourth graders.',
        isCorrect: false,
        rationale: 'Contradicts Mateo bringing window screen and celebrating not using the hose.',
      },
      {
        id: 'g3l-1-4',
        label: 'D',
        text: 'He decides to stop growing cherry tomatoes because the soil is too sandy.',
        isCorrect: false,
        rationale: 'Contradicts the ending where his vines are "perky green".',
      },
    ],
    correctAnswerSummary: 'A',
    correctRationale:
      'Clarification 1 for ELA.3.R.1.1 emphasizes tracking feelings, motivations, and responses across plot events.',
    textualEvidenceQuote: 'Looking at the perky green tomato vines, he realized big problems shrink when neighbors prepare together.',
    evidenceParagraphRef: 4,
    sourceCitation: 'Florida B.E.S.T. Standards ELA.3.R.1.1 (p. 53)',
    practiceDisclaimer: PRACTICE_DISCLAIMER,
  },
  {
    id: 'item-g3l-2',
    passageId: g3LitPassage.id,
    grade: '3',
    itemType: 'ebsr',
    benchmarkCode: 'ELA.3.R.1.2',
    officialBenchmarkText: BENCHMARKS_BY_CODE['ELA.3.R.1.2'].officialText,
    reportingCategory: 'reading-prose-poetry',
    reportingCategoryLabel: 'Reading Prose and Poetry',
    cognitiveSkill: 'Identify theme and supporting story details',
    cognitiveRigor: 'On-Grade-Level',
    dok: 2,
    prompt: 'This question has two parts. First, answer Part A. Then, answer Part B.',
    partAPrompt: 'Part A: What is a theme of "The Rain Barrel Promise"?',
    partAOptions: [
      {
        id: 'g3l-2a-1',
        label: 'A',
        text: 'Working together to plan ahead helps a community overcome a shared challenge.',
        isCorrect: true,
        rationale: 'Correct: reflects how Priya, Mateo, and two fourth graders prepare before the storm.',
      },
      {
        id: 'g3l-2a-2',
        label: 'B',
        text: 'Gardens should only be planted during cool winter months.',
        isCorrect: false,
        rationale: 'Too narrow and unsupported.',
      },
      {
        id: 'g3l-2a-3',
        label: 'C',
        text: 'Asking grandparents for tools is easier than buying new supplies.',
        isCorrect: false,
        rationale: 'Minor plot detail rather than theme.',
      },
    ],
    partBPrompt: 'Part B: Which sentence from the story best supports the theme in Part A?',
    partBOptions: [
      {
        id: 'g3l-2b-1',
        label: 'A',
        text: '“Each day after school, Mateo ran to the town garden behind his school.”',
        isCorrect: false,
        rationale: 'Sets the scene without expressing the shared solution.',
        paragraphRef: 1,
      },
      {
        id: 'g3l-2b-2',
        label: 'B',
        text: '“Looking at the perky green tomato vines, he realized big problems shrink when neighbors prepare together.”',
        isCorrect: true,
        rationale: 'Correct: directly expresses the theme learned from their collaboration.',
        paragraphRef: 4,
      },
      {
        id: 'g3l-2b-3',
        label: 'C',
        text: '“Mateo sighed and stared at the empty watering cans.”',
        isCorrect: false,
        rationale: 'Shows the initial problem before action.',
        paragraphRef: 2,
      },
    ],
    correctAnswerSummary: 'Part A: A; Part B: B',
    correctRationale:
      'Mateo’s closing realization summarizes the lesson developed through the students’ combined efforts.',
    textualEvidenceQuote: 'Looking at the perky green tomato vines, he realized big problems shrink when neighbors prepare together.',
    evidenceParagraphRef: 4,
    sourceCitation: 'Florida B.E.S.T. Standards ELA.3.R.1.2 (p. 53)',
    practiceDisclaimer: PRACTICE_DISCLAIMER,
  },
];

export const SEED_PASSAGES: ReadingPassage[] = [
  g4Passage,
  g3Passage,
  g5Passage,
  g3LitPassage,
];

export const SEED_ITEMS: AssessmentItem[] = [
  ...g4Items,
  ...g3Items,
  ...g5Items,
  ...g3LitItems,
];

export const SEED_ASSESSMENTS: SavedAssessment[] = [
  {
    id: 'assess-g4-lighthouse',
    title: 'Grade 4 Paired Texts: St. Augustine Keepers & Fresnel Lenses',
    unitTag: 'Unit 3 · Primary & Secondary Sources',
    grade: '4',
    passage: g4Passage,
    items: g4Items,
    createdAt: '2026-03-11T09:45:00.000Z',
    updatedAt: '2026-03-11T09:45:00.000Z',
  },
  {
    id: 'assess-g3-everglades',
    title: 'Grade 3 Informational Practice: Everglades Sawgrass & Fire',
    unitTag: 'Unit 2 · Florida Habitats & Central Idea',
    grade: '3',
    passage: g3Passage,
    items: g3Items,
    createdAt: '2026-03-10T14:20:00.000Z',
    updatedAt: '2026-03-10T14:20:00.000Z',
  },
  {
    id: 'assess-g5-canopy',
    title: 'Grade 5 Informational Argument: Native Urban Tree Canopies',
    unitTag: 'Unit 4 · Argument, Evidence & Civic Writing Prep',
    grade: '5',
    passage: g5Passage,
    items: g5Items,
    createdAt: '2026-03-12T10:30:00.000Z',
    updatedAt: '2026-03-12T10:30:00.000Z',
  },
  {
    id: 'assess-g3-rainbarrel',
    title: 'Grade 3 Literary Practice: The Rain Barrel Promise',
    unitTag: 'Unit 1 · Character Development & Theme',
    grade: '3',
    passage: g3LitPassage,
    items: g3LitItems,
    createdAt: '2026-03-13T11:15:00.000Z',
    updatedAt: '2026-03-13T11:15:00.000Z',
  },
];

// Deterministic starter student attempts for immediate Analytics demonstration
const g4Responses = {
  'item-g4-1': { tableMatchSelections: { r1: ['both'], r2: ['p1'], r3: ['p2'] } },
  'item-g4-2': { partASelectedIds: ['g4-2a-1'], partBSelectedIds: ['g4-2b-1'] }, // partial 0.5
  'item-g4-3': { selectedOptionIds: ['g4-3-2'] },
  'item-g4-4': { selectedOptionIds: ['g4-4-1'] },
};
const g4Scored = scoreStudentSubmission(g4Items, g4Responses);

const g3Responses = {
  'item-g3-1': { partASelectedIds: ['g3-1a-2'], partBSelectedIds: ['g3-1b-2'] },
  'item-g3-2': { selectedOptionIds: ['g3-2-1'] }, // missed structure
  'item-g3-3': { hotTextSelectedIds: ['g3-ht-3'] },
  'item-g3-4': { selectedOptionIds: ['g3-4-2', 'g3-4-3'] },
};
const g3Scored = scoreStudentSubmission(g3Items, g3Responses);

export const SEED_ATTEMPTS: StudentAttempt[] = [
  {
    id: 'attempt-seed-1',
    assessmentId: 'assess-g4-lighthouse',
    assessmentTitle: 'Grade 4 Paired Texts: St. Augustine Keepers & Fresnel Lenses',
    grade: '4',
    studentName: 'Period 2 Small Group Sample',
    submittedAt: '2026-03-14T15:10:00.000Z',
    totalPoints: g4Scored.totalPoints,
    maxPoints: g4Scored.maxPoints,
    percentScore: g4Scored.percentScore,
    responses: g4Responses,
    itemResults: g4Scored.itemResults,
  },
  {
    id: 'attempt-seed-2',
    assessmentId: 'assess-g3-everglades',
    assessmentTitle: 'Grade 3 Informational Practice: Everglades Sawgrass & Fire',
    grade: '3',
    studentName: 'Grade 3 Cohort Sample',
    submittedAt: '2026-03-14T16:05:00.000Z',
    totalPoints: g3Scored.totalPoints,
    maxPoints: g3Scored.maxPoints,
    percentScore: g3Scored.percentScore,
    responses: g3Responses,
    itemResults: g3Scored.itemResults,
  },
];
