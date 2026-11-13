import type {
  FastAssessedGrade,
  FastItemType,
  FloridaBenchmark,
  GradeLevel,
  ReportingCategoryId,
} from '../types/ela.ts';

export const FDOE_SOURCES = {
  bestStandards: {
    title: "Florida's B.E.S.T. Standards: English Language Arts (2025)",
    url: 'https://www.fldoe.org/standardsreview/',
    localPdfUrl: '/assets/aistudio/elabeststandardsfinal_27c1ee51.pdf',
  },
  fastTds: {
    title: 'Test Design Summary and Blueprint: FAST ELA Reading and B.E.S.T. Writing (June 2024)',
    url: 'https://flfast.org/',
    localPdfUrl: '/assets/aistudio/TDS-FAST-ELA_4da592c0.pdf',
  },
  reportingCategories: {
    title: 'Reporting Category Statements: B.E.S.T. Standards: ELA (May 2024)',
    url: 'https://flfast.org/',
    localPdfUrl: '/assets/aistudio/best-ela-rcs_1086ef5d.pdf',
  },
  k2FactSheet: {
    title: '2026–2027 FAST Grades K–2 Fact Sheet',
    url: 'https://flfast.org/',
    localPdfUrl: '/assets/aistudio/2627FASTK2FS_98d3ec2e.pdf',
  },
  grade3Release: {
    title: 'FAST Grade 3 ELA Reading Practice Test Release Support Document (2024)',
    url: 'https://flfast.org/',
    localPdfUrl:
      '/assets/aistudio/2024_Test_Release_Support_Document_Practice_Test_Reading_Grade_3_508_0e3f84de.pdf',
  },
  grade4Release: {
    title: 'FAST Grade 4 ELA Reading Test Release Support Document (2026)',
    url: 'https://flfast.org/',
    localPdfUrl:
      '/assets/aistudio/2026_Test_Release_Support_Document_FAST_ELA_Reading_Grade_4_508_975a6d5c.pdf',
  },
  grade4PracticeRelease: {
    title: 'FAST Grade 4 ELA Reading Practice Test Release Support Document (2026)',
    url: 'https://flfast.org/',
    localPdfUrl:
      '/assets/aistudio/2026_Test_Release_Support_Document_Practice_Test_Reading_Grade_4_508_ddbfb5d2.pdf',
  },
  grade5Release: {
    title: 'FAST Grade 5 ELA Reading Practice Test Release Support Document (2025)',
    url: 'https://flfast.org/',
    localPdfUrl:
      '/assets/aistudio/2025_Test_Release_Support_Document_Practice_Test_Reading_Grade_5_508_dc803f3e.pdf',
  },
} as const;

export const PRACTICE_DISCLAIMER =
  'Original instructional practice material aligned to Florida B.E.S.T. Standards — not an official FDOE or FAST secure assessment item.';

const REPORTING_CATEGORY_LABELS: Record<ReportingCategoryId, string> = {
  'reading-prose-poetry': 'Reading Prose and Poetry',
  'reading-informational-text': 'Reading Informational Text',
  'reading-across-genres-vocabulary': 'Reading Across Genres & Vocabulary',
  'foundational-skills': 'Foundational Skills',
  'communication-writing': 'Communication & Writing',
  'ela-expectations': 'ELA Expectations (K–12)',
};

function makeBenchmark(
  entry: Omit<
    FloridaBenchmark,
    'reportingCategoryLabel' | 'sourceTitle' | 'sourceUrl' | 'localPdfUrl'
  > & {
    sourceTitle?: string;
    sourceUrl?: string;
    localPdfUrl?: string;
  }
): FloridaBenchmark {
  return {
    ...entry,
    reportingCategoryLabel: REPORTING_CATEGORY_LABELS[entry.reportingCategory],
    sourceTitle: entry.sourceTitle ?? FDOE_SOURCES.bestStandards.title,
    sourceUrl: entry.sourceUrl ?? FDOE_SOURCES.bestStandards.url,
    localPdfUrl: entry.localPdfUrl ?? FDOE_SOURCES.bestStandards.localPdfUrl,
  };
}

export const FLORIDA_BENCHMARKS: FloridaBenchmark[] = [
  // =========================================================
  // K-12 ELA EXPECTATIONS (Appendix A, doc p. 8 & p. 147)
  // =========================================================
  makeBenchmark({
    code: 'ELA.K12.EE.1.1',
    grade: 'K12',
    strand: 'EE',
    strandName: 'ELA Expectations',
    standardGroup: 'Cite Evidence',
    benchmarkTitle: 'Cite Evidence',
    reportingCategory: 'ela-expectations',
    officialText: 'Cite evidence to explain and justify reasoning.',
    clarifications: [
      'Students use explicit textual details, quotations, and paragraph references to justify analyses and inferences across literary and informational texts.',
    ],
    fastAssessed: true,
    keywords: ['evidence', 'cite', 'justify', 'text evidence', 'support', 'quote', 'proof'],
    requiredCognitiveSkills: [
      'Locate relevant textual details',
      'Connect cited evidence directly to a claim or inference',
    ],
    suggestedItemTypes: ['ebsr', 'hot_text', 'multiple_choice'],
    pdfPage: 148,
  }),
  makeBenchmark({
    code: 'ELA.K12.EE.2.1',
    grade: 'K12',
    strand: 'EE',
    strandName: 'ELA Expectations',
    standardGroup: 'Read and Comprehend Proficiently',
    benchmarkTitle: 'Read and Comprehend Proficiently',
    reportingCategory: 'ela-expectations',
    officialText: 'Read and comprehend grade-level complex texts proficiently.',
    clarifications: [
      'Grade-level text complexity is evaluated using both quantitative measures (Lexile bands) and qualitative text features (Appendix B).',
    ],
    fastAssessed: true,
    keywords: ['comprehend', 'complexity', 'lexile', 'grade-level', 'proficient', 'fluency'],
    requiredCognitiveSkills: [
      'Monitor comprehension across complex texts',
      'Synthesize explicit and implicit meaning independently',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr'],
    pdfPage: 148,
  }),
  makeBenchmark({
    code: 'ELA.K12.EE.3.1',
    grade: 'K12',
    strand: 'EE',
    strandName: 'ELA Expectations',
    standardGroup: 'Make Inferences',
    benchmarkTitle: 'Make Inferences',
    reportingCategory: 'ela-expectations',
    officialText: 'Make inferences to support comprehension.',
    clarifications: [
      'Students combine explicit clues in the text with logical reasoning to draw unstated conclusions.',
    ],
    fastAssessed: true,
    keywords: ['inference', 'infer', 'imply', 'implied', 'conclude', 'conclusion', 'draw conclusions'],
    requiredCognitiveSkills: [
      'Draw logical conclusions from unstated textual clues',
      'Distinguish valid text-supported inferences from unsupported assumptions',
    ],
    suggestedItemTypes: ['ebsr', 'multiple_choice', 'hot_text'],
    pdfPage: 148,
  }),
  makeBenchmark({
    code: 'ELA.K12.EE.5.1',
    grade: 'K12',
    strand: 'EE',
    strandName: 'ELA Expectations',
    standardGroup: 'Use Appropriate Format',
    benchmarkTitle: 'Use Appropriate Format',
    reportingCategory: 'ela-expectations',
    officialText: 'Use the accepted rules governing a specific format to create quality work.',
    clarifications: [
      'Applies to academic writing, evidence responses, and structured reading summaries.',
    ],
    fastAssessed: false,
    keywords: ['format', 'conventions', 'structure', 'writing format'],
    requiredCognitiveSkills: ['Apply format rules appropriate to genre and audience'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 148,
  }),
  makeBenchmark({
    code: 'ELA.K12.EE.6.1',
    grade: 'K12',
    strand: 'EE',
    strandName: 'ELA Expectations',
    standardGroup: 'Use Appropriate Tone and Voice',
    benchmarkTitle: 'Use Appropriate Tone and Voice',
    reportingCategory: 'ela-expectations',
    officialText: 'Use appropriate voice and tone when speaking or writing.',
    clarifications: [
      'Tone should match the purpose, audience, and academic context.',
    ],
    fastAssessed: false,
    keywords: ['tone', 'voice', 'audience', 'academic register'],
    requiredCognitiveSkills: ['Select appropriate academic tone and voice for context'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 148,
  }),

  // =========================================================
  // KINDERGARTEN (doc pp. 26-32 -> PDF pp. 27-33)
  // =========================================================
  makeBenchmark({
    code: 'ELA.K.F.1.1',
    grade: 'K',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Print Concepts',
    reportingCategory: 'foundational-skills',
    officialText:
      'Demonstrate knowledge of the basic concepts of print. a. Locate a printed word on a page. b. Distinguish letters from words within sentences. c. Match print to speech to demonstrate that language is represented by print. d. Identify parts of a book (front cover, back cover, title page). e. Move top to bottom and left to right on the printed page; returning to the beginning of the next line. f. Identify all upper- and lowercase letters of the alphabet. g. Recognize that print conveys specific meaning and pictures may support meaning.',
    clarifications: [
      'Kindergarten print concepts establish directionality (top-to-bottom, left-to-right, return sweep), book parts, letter-word distinction, and alphabet recognition.',
    ],
    fastAssessed: false,
    keywords: ['print concepts', 'foundations', 'alphabet', 'letters', 'words', 'book parts', 'directionality'],
    requiredCognitiveSkills: [
      'Identify parts of a book and print directionality',
      'Distinguish letters from printed words and recognize upper/lowercase letters',
    ],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 27,
  }),
  makeBenchmark({
    code: 'ELA.K.F.1.2',
    grade: 'K',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Phonological Awareness',
    reportingCategory: 'foundational-skills',
    officialText:
      'Demonstrate phonological awareness. a. Blend and segment syllables in spoken words. b. Identify and produce alliterative and rhyming words. c. Blend and segment onset and rimes of single-syllable words. d. Identify the initial, medial, and final sound of spoken words. e. Add or delete phonemes at the beginning or end of a spoken word and say the resulting word. f. Segment and blend phonemes in single-syllable spoken words.',
    clarifications: [
      'Clarification 1: Phonological awareness only requires students to recognize and manipulate sounds in spoken words; it does not require print or letter knowledge.',
    ],
    fastAssessed: false,
    keywords: ['phonological awareness', 'phonemic awareness', 'rhyming', 'syllables', 'onset rime', 'phonemes', 'foundations'],
    requiredCognitiveSkills: [
      'Blend, segment, and manipulate syllables, onset-rimes, and spoken phonemes',
      'Identify and produce rhyming and alliterative words',
    ],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 27,
  }),
  makeBenchmark({
    code: 'ELA.K.F.1.3',
    grade: 'K',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Phonics and Word Analysis',
    reportingCategory: 'foundational-skills',
    officialText:
      'Use knowledge of grade-appropriate phonics and word-analysis skills to decode words accurately. a. Demonstrate knowledge of the most frequent sound for each consonant. b. Demonstrate knowledge of the short and long sounds for the five major vowels. c. Decode consonant-vowel-consonant (CVC) words. d. Encode consonant-vowel-consonant (CVC) words.',
    clarifications: [
      'Clarification 1: Phonics refers to the relationship between graphemes (letters or letter combinations) and phonemes (speech sounds).',
      'Clarification 2: Kindergarten students decode and encode regular CVC words using most frequent consonant and short/long vowel sounds.',
    ],
    fastAssessed: false,
    keywords: ['phonics', 'decode', 'encode', 'cvc', 'letter sounds', 'vowels', 'consonants', 'foundations'],
    requiredCognitiveSkills: ['Match letters to sounds', 'Decode and encode regular CVC words'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 28,
  }),
  makeBenchmark({
    code: 'ELA.K.F.1.4',
    grade: 'K',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Fluency — High Frequency Words',
    reportingCategory: 'foundational-skills',
    officialText: 'Recognize and read with automaticity grade-level high frequency words.',
    clarifications: [
      'Clarification 1: High-frequency words (e.g., Dolch or Fry lists) include both phonetically regular words and temporarily irregular words practiced until automatic.',
    ],
    fastAssessed: false,
    keywords: ['fluency', 'high frequency words', 'sight words', 'automaticity', 'foundations'],
    requiredCognitiveSkills: ['Recognize and read grade-level high-frequency words with automaticity'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 28,
  }),
  makeBenchmark({
    code: 'ELA.K.R.1.1',
    grade: 'K',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Literary Elements',
    benchmarkTitle: 'Literary Elements',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Describe the main character(s), setting, and important events in a story.',
    clarifications: [
      'Kindergarten students identify who is in the story, where/when it happens, and key events.',
    ],
    fastAssessed: false,
    keywords: ['character', 'setting', 'events', 'story elements', 'literary elements'],
    requiredCognitiveSkills: ['Identify main characters', 'Describe setting and important story events'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 29,
  }),
  makeBenchmark({
    code: 'ELA.K.R.1.3',
    grade: 'K',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Perspective and Point of View',
    benchmarkTitle: 'Author and Illustrator Roles',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Explain the roles of author and illustrator of a story.',
    clarifications: ['Clarifies that the author writes the words and the illustrator creates the pictures.'],
    fastAssessed: false,
    keywords: ['author', 'illustrator', 'roles', 'story', 'pictures'],
    requiredCognitiveSkills: ['Distinguish the role of the author from the illustrator'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 29,
  }),
  makeBenchmark({
    code: 'ELA.K.R.1.4',
    grade: 'K',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Poetry',
    benchmarkTitle: 'Poetry — Rhyme',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Identify rhyme in a poem.',
    clarifications: ['Focuses on recognizing words with the same ending sounds in poems.'],
    fastAssessed: false,
    keywords: ['rhyme', 'poetry', 'poem', 'rhyming words'],
    requiredCognitiveSkills: ['Recognize rhyming words in read-aloud or short poems'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 29,
  }),
  makeBenchmark({
    code: 'ELA.K.R.2.1',
    grade: 'K',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Structure',
    benchmarkTitle: 'Text Features',
    reportingCategory: 'reading-informational-text',
    officialText: 'Use titles, headings, and illustrations to predict and confirm the topic of texts.',
    clarifications: ['Informational text features introduce the topic before and during reading.'],
    fastAssessed: false,
    keywords: ['title', 'heading', 'illustration', 'text features', 'predict', 'topic'],
    requiredCognitiveSkills: ['Use titles and illustrations to predict text topic'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 29,
  }),
  makeBenchmark({
    code: 'ELA.K.R.2.2',
    grade: 'K',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Central Idea',
    benchmarkTitle: 'Topic and Details',
    reportingCategory: 'reading-informational-text',
    officialText: 'Identify the topic of and multiple details in a text.',
    clarifications: [
      'Students distinguish what the text is mostly about (topic) and recall stated facts (details).',
    ],
    fastAssessed: false,
    keywords: ['topic', 'main idea', 'central idea', 'details', 'facts'],
    requiredCognitiveSkills: ['Identify the topic of an informational text', 'Recall stated details'],
    suggestedItemTypes: ['multiple_choice', 'multiselect'],
    pdfPage: 29,
  }),
  makeBenchmark({
    code: 'ELA.K.R.2.4',
    grade: 'K',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Argument',
    benchmarkTitle: 'Facts and Opinions',
    reportingCategory: 'reading-informational-text',
    officialText: 'Explain the difference between opinions and facts about a topic.',
    clarifications: ['Facts can be proven true; opinions share what someone thinks or feels.'],
    fastAssessed: false,
    keywords: ['fact', 'opinion', 'argument', 'topic'],
    requiredCognitiveSkills: ['Distinguish a fact from an opinion'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 29,
  }),
  makeBenchmark({
    code: 'ELA.K.R.3.1',
    grade: 'K',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Figurative Language',
    benchmarkTitle: 'Descriptive Words',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText: 'Identify and explain descriptive words in text(s).',
    clarifications: ['Focuses on sensory and descriptive words that help readers picture the text.'],
    fastAssessed: false,
    keywords: ['descriptive words', 'figurative language', 'sensory', 'adjectives', 'imagery'],
    requiredCognitiveSkills: ['Identify descriptive words and explain what they help the reader picture'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 30,
  }),
  makeBenchmark({
    code: 'ELA.K.R.3.2',
    grade: 'K',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Paraphrasing and Summarizing',
    benchmarkTitle: 'Retell Orally',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Retell a text orally to enhance comprehension: a. Use main character(s), setting, and important events for a story. b. Use topic and details for an informational text.',
    clarifications: ['Oral retell scaffolds early sequencing and comprehension.'],
    fastAssessed: false,
    keywords: ['retell', 'summary', 'summarize', 'story elements', 'topic'],
    requiredCognitiveSkills: ['Retell key story elements or informational topic and details'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 30,
  }),
  makeBenchmark({
    code: 'ELA.K.R.3.3',
    grade: 'K',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Comparative Reading',
    benchmarkTitle: 'Compare Characters’ Experiences',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText: 'Compare and contrast characters’ experiences in stories.',
    clarifications: ['Students notice how characters’ experiences in two stories are alike and different.'],
    fastAssessed: false,
    keywords: ['compare', 'contrast', 'characters', 'experiences'],
    requiredCognitiveSkills: ['Identify similarities and differences in character experiences'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 30,
  }),
  makeBenchmark({
    code: 'ELA.K.V.1.1',
    grade: 'K',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Academic Vocabulary',
    benchmarkTitle: 'Academic Vocabulary',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText: 'Use grade-level academic vocabulary appropriately in speaking and writing.',
    clarifications: ['Includes cross-curricular Tier 2 vocabulary learned through read-alouds and discussion.'],
    fastAssessed: false,
    keywords: ['vocabulary', 'academic vocabulary', 'word meaning', 'tier 2'],
    requiredCognitiveSkills: ['Use grade-appropriate academic words accurately'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 32,
  }),
  makeBenchmark({
    code: 'ELA.K.V.1.2',
    grade: 'K',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Morphology',
    benchmarkTitle: 'Word Parts and Affixes',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Ask and answer questions about unfamiliar words in grade-level content.',
    clarifications: ['Encourages curiosity and questioning about unknown words encountered in texts.'],
    fastAssessed: false,
    keywords: ['vocabulary', 'unfamiliar words', 'morphology', 'word meaning'],
    requiredCognitiveSkills: ['Recognize unfamiliar words and use clues/questions to learn meaning'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 32,
  }),
  makeBenchmark({
    code: 'ELA.K.V.1.3',
    grade: 'K',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Context and Connotation',
    benchmarkTitle: 'Context Clues and Picture Clues',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Identify and sort common words into basic categories, relating vocabulary to background knowledge.',
    clarifications: ['Supports semantic category building and background connections.'],
    fastAssessed: false,
    keywords: ['vocabulary', 'sort', 'categories', 'context clues', 'background knowledge'],
    requiredCognitiveSkills: ['Categorize common words and connect to background knowledge'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 32,
  }),

  makeBenchmark({
    code: 'ELA.K.C.3.1',
    grade: 'K',
    strand: 'C',
    strandName: 'Communication',
    standardGroup: 'Following Conventions',
    benchmarkTitle: 'Follow Standard English Conventions (Kindergarten)',
    reportingCategory: 'communication-writing',
    officialText:
      'Follow the rules of standard English grammar, punctuation, capitalization, and spelling appropriate to grade level.',
    clarifications: [
      'Clarification 1: Skills to be mastered at this grade level are: Begin each sentence with a capital letter and use ending punctuation; Capitalize the days of the week, the months of the year, and the pronoun I; Form regular plural nouns orally by adding /s/ or /es/; Use interrogatives to ask questions.',
      'Clarification 1 (Skills to be implemented): Capitalize proper nouns; Form and use simple verb tenses for regular verbs by adding the affix -ed; Form and use complete simple sentences; Use possessives; Use subject-verb agreement in simple sentences.',
    ],
    fastAssessed: false,
    keywords: ['conventions', 'capitalization', 'ending punctuation', 'plural nouns', 'interrogatives', 'pronoun I'],
    requiredCognitiveSkills: [
      'Capitalize sentence beginnings, days, months, and the pronoun I',
      'Use ending punctuation and form oral regular plurals and question words',
    ],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 32,
  }),

  // =========================================================
  // GRADE 1 (doc pp. 35-40 -> PDF pp. 36-41)
  // =========================================================
  makeBenchmark({
    code: 'ELA.1.F.1.1',
    grade: '1',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Print Concepts',
    reportingCategory: 'foundational-skills',
    officialText:
      'Locate the title, table of contents, names of author(s) and illustrator(s), and glossary of books.',
    clarifications: [
      'Builds on Kindergarten print concepts by locating organizational parts of print and digital books.',
    ],
    fastAssessed: false,
    keywords: ['print concepts', 'title', 'table of contents', 'author', 'illustrator', 'glossary', 'foundations'],
    requiredCognitiveSkills: ['Locate the title, table of contents, author/illustrator names, and glossary'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 36,
  }),
  makeBenchmark({
    code: 'ELA.1.F.1.2',
    grade: '1',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Phonological Awareness',
    reportingCategory: 'foundational-skills',
    officialText:
      'Demonstrate phonological awareness. a. Segment spoken words into initial, medial, and final phonemes, including words with digraphs, blends, and trigraphs. b. Orally blend initial, medial, and final phonemes together to produce a single-syllable word that includes digraphs, blends, or trigraphs. c. Blend single-syllable spoken words with at least five phonemes. d. Segment single-syllable spoken words with at least five phonemes. e. Segment and blend phonemes in multi-syllable spoken words.',
    clarifications: [
      'Clarification 1: Phonological awareness only requires students to recognize and manipulate sounds in spoken words; it does not require print or letter knowledge.',
    ],
    fastAssessed: false,
    keywords: ['phonological awareness', 'phonemes', 'blends', 'digraphs', 'trigraphs', 'multi-syllable', 'foundations'],
    requiredCognitiveSkills: [
      'Segment and orally blend single-syllable words with digraphs, blends, trigraphs, and 5+ phonemes',
      'Segment and blend phonemes in multi-syllable spoken words',
    ],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 36,
  }),
  makeBenchmark({
    code: 'ELA.1.F.1.3',
    grade: '1',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Phonics and Word Analysis',
    reportingCategory: 'foundational-skills',
    officialText:
      'Use knowledge of grade-appropriate phonics and word-analysis skills to decode words accurately. a. Decode words using knowledge of spelling-sound correspondences for common consonant digraphs, trigraphs, and blends. b. Decode simple words with r-controlled vowels. c. Decode and encode regularly spelled one-syllable words. d. Decode words with inflectional endings. e. Decode two-syllable words with basic patterns by breaking the words into syllables. f. Decode words that use final –e and vowel teams to make long-vowel sound.',
    clarifications: [
      'Clarification 1: Phonics refers to the relationship between graphemes (letters or letter combinations) and phonemes (speech sounds).',
      'Includes digraphs (sh, ch, th, wh, ph), blends, r-controlled vowels (ar, er, ir, or, ur), final -e, vowel teams, inflectional endings (-s, -ed, -ing), and two-syllable decoding.',
    ],
    fastAssessed: false,
    keywords: ['phonics', 'decode', 'encode', 'digraphs', 'blends', 'r-controlled', 'vowel teams', 'final e', 'foundations'],
    requiredCognitiveSkills: [
      'Decode digraphs, blends, r-controlled vowels, final -e, vowel teams, and inflectional endings',
      'Break regular two-syllable words into syllables to decode',
    ],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 36,
  }),
  makeBenchmark({
    code: 'ELA.1.F.1.4',
    grade: '1',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Fluency',
    reportingCategory: 'foundational-skills',
    officialText:
      'Read grade-level texts with accuracy, automaticity, and appropriate prosody or expression. a. Recognize and read with automaticity the grade-level sight words.',
    clarifications: [
      'Clarification 1: Fluency combines reading accuracy, automaticity (rate without conscious decoding effort), and prosody (expression, phrasing, and intonation).',
      'Clarification 2: Grade-level high-frequency/sight words support fluent connected reading.',
    ],
    fastAssessed: false,
    keywords: ['fluency', 'accuracy', 'automaticity', 'prosody', 'expression', 'sight words', 'foundations'],
    requiredCognitiveSkills: [
      'Read Grade 1 texts accurately and expressively',
      'Recognize grade-level sight words automatically',
    ],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 37,
  }),
  makeBenchmark({
    code: 'ELA.1.R.1.1',
    grade: '1',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Literary Elements',
    benchmarkTitle: 'Main Story Elements',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Identify and describe the main story elements in a story.',
    clarifications: ['Includes characters, setting, and sequence of events (beginning, middle, end).'],
    fastAssessed: false,
    keywords: ['story elements', 'character', 'setting', 'events', 'literary elements'],
    requiredCognitiveSkills: ['Identify and describe characters, setting, and key events'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 38,
  }),
  makeBenchmark({
    code: 'ELA.1.R.1.2',
    grade: '1',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Theme',
    benchmarkTitle: 'Moral of a Story',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Identify and explain the moral of a story.',
    clarifications: ['Focuses on the lesson or moral a story teaches (e.g., fables and folktales).'],
    fastAssessed: false,
    keywords: ['moral', 'theme', 'lesson', 'message'],
    requiredCognitiveSkills: ['Identify the moral of a story and cite an event that shows it'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 38,
  }),
  makeBenchmark({
    code: 'ELA.1.R.1.3',
    grade: '1',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Perspective and Point of View',
    benchmarkTitle: 'Who Is Telling the Story',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Explain who is telling the story using context clues.',
    clarifications: ['Students use pronouns and dialogue clues to identify the narrator.'],
    fastAssessed: false,
    keywords: ['narrator', 'point of view', 'speaker', 'telling the story', 'inference'],
    requiredCognitiveSkills: ['Identify who is telling the story from textual clues'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 38,
  }),
  makeBenchmark({
    code: 'ELA.1.R.1.4',
    grade: '1',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Poetry',
    benchmarkTitle: 'Stanzas and Line Breaks',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Identify stanzas and line breaks in poems.',
    clarifications: ['Introduces basic visual and structural features of poetry.'],
    fastAssessed: false,
    keywords: ['poetry', 'poem', 'stanzas', 'line breaks'],
    requiredCognitiveSkills: ['Identify stanzas and line breaks in a poem'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 38,
  }),
  makeBenchmark({
    code: 'ELA.1.R.2.1',
    grade: '1',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Structure',
    benchmarkTitle: 'Text Features',
    reportingCategory: 'reading-informational-text',
    officialText:
      'Use text features including titles, headings, captions, graphs, maps, glossaries, and/or illustrations to demonstrate understanding of texts.',
    clarifications: ['Students locate information using informational text features.'],
    fastAssessed: false,
    keywords: ['text features', 'headings', 'captions', 'maps', 'glossary', 'graphs'],
    requiredCognitiveSkills: ['Locate and interpret information from basic text features'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 38,
  }),
  makeBenchmark({
    code: 'ELA.1.R.2.2',
    grade: '1',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Central Idea',
    benchmarkTitle: 'Topic and Relevant Details',
    reportingCategory: 'reading-informational-text',
    officialText: 'Identify the topic of and relevant details in a text.',
    clarifications: ['Students distinguish relevant details about the topic from minor details.'],
    fastAssessed: false,
    keywords: ['topic', 'main idea', 'central idea', 'relevant details'],
    requiredCognitiveSkills: ['Identify the topic and relevant supporting details'],
    suggestedItemTypes: ['multiple_choice', 'multiselect'],
    pdfPage: 38,
  }),
  makeBenchmark({
    code: 'ELA.1.R.2.3',
    grade: '1',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Purpose and Perspective',
    benchmarkTitle: 'Visuals and Words',
    reportingCategory: 'reading-informational-text',
    officialText:
      'Explain similarities and differences between information provided in visuals and words in an informational text.',
    clarifications: ['Students compare what a picture/diagram shows with what the words state.'],
    fastAssessed: false,
    keywords: ['visuals', 'illustrations', 'words', 'compare', 'informational'],
    requiredCognitiveSkills: ['Compare information in text visuals and written sentences'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 38,
  }),
  makeBenchmark({
    code: 'ELA.1.R.2.4',
    grade: '1',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Argument',
    benchmarkTitle: 'Author’s Opinion',
    reportingCategory: 'reading-informational-text',
    officialText: 'Identify an author’s opinion(s) about the topic.',
    clarifications: ['Students recognize statements expressing the author’s viewpoint or opinion.'],
    fastAssessed: false,
    keywords: ['opinion', 'author', 'claim', 'argument'],
    requiredCognitiveSkills: ['Identify the author’s opinion about a topic'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 38,
  }),
  makeBenchmark({
    code: 'ELA.1.R.3.1',
    grade: '1',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Figurative Language',
    benchmarkTitle: 'Descriptive Words and Phrases',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText: 'Identify and explain descriptive words and phrases in text(s).',
    clarifications: ['Focuses on how descriptive words and phrases add sensory detail or feeling.'],
    fastAssessed: false,
    keywords: ['descriptive words', 'phrases', 'figurative language', 'sensory details'],
    requiredCognitiveSkills: ['Identify descriptive phrases and explain their meaning'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 39,
  }),
  makeBenchmark({
    code: 'ELA.1.R.3.2',
    grade: '1',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Paraphrasing and Summarizing',
    benchmarkTitle: 'Retell Beginning, Middle, End / Topic and Details',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Retell a text in oral or written form to enhance comprehension: a. Use main story elements at the beginning, middle, and end for a literary text. b. Use topic and important details for an informational text.',
    clarifications: ['Introduces written retelling alongside oral retelling.'],
    fastAssessed: false,
    keywords: ['retell', 'summary', 'summarize', 'beginning middle end', 'details'],
    requiredCognitiveSkills: ['Retell key events in order or summarize topic and details'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 39,
  }),
  makeBenchmark({
    code: 'ELA.1.R.3.3',
    grade: '1',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Comparative Reading',
    benchmarkTitle: 'Compare Two Texts on the Same Topic',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText: 'Compare and contrast two texts on the same topic.',
    clarifications: ['Compares facts and details presented across two short informational texts.'],
    fastAssessed: false,
    keywords: ['compare', 'contrast', 'two texts', 'same topic'],
    requiredCognitiveSkills: ['Identify shared and differing facts across two texts'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 39,
  }),
  makeBenchmark({
    code: 'ELA.1.V.1.1',
    grade: '1',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Academic Vocabulary',
    benchmarkTitle: 'Academic Vocabulary',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText: 'Use grade-level academic vocabulary appropriately in speaking and writing.',
    clarifications: ['Cross-curricular words vital to comprehension and discussion in Grade 1.'],
    fastAssessed: false,
    keywords: ['vocabulary', 'academic vocabulary', 'word meaning'],
    requiredCognitiveSkills: ['Apply academic vocabulary in context'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 41,
  }),
  makeBenchmark({
    code: 'ELA.1.V.1.2',
    grade: '1',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Morphology',
    benchmarkTitle: 'Base Words and Inflections',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Identify and use frequently occurring base words and their common inflections in grade-level content.',
    clarifications: ['Focuses on inflectional endings (-s, -es, -ed, -ing) and base words.'],
    fastAssessed: false,
    keywords: ['morphology', 'base words', 'inflections', 'suffixes', 'word parts'],
    requiredCognitiveSkills: ['Identify base words and inflectional endings'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 41,
  }),
  makeBenchmark({
    code: 'ELA.1.V.1.3',
    grade: '1',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Context and Connotation',
    benchmarkTitle: 'Context Clues and Word Relationships',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Identify and use picture clues, context clues, word relationships, reference materials, and/or background knowledge to determine the meaning of unknown words.',
    clarifications: ['Uses sentence and illustration clues to determine unfamiliar word meanings.'],
    fastAssessed: false,
    keywords: ['context clues', 'picture clues', 'unknown words', 'vocabulary'],
    requiredCognitiveSkills: ['Use picture and sentence clues to define unknown words'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 41,
  }),

  makeBenchmark({
    code: 'ELA.1.C.3.1',
    grade: '1',
    strand: 'C',
    strandName: 'Communication',
    standardGroup: 'Following Conventions',
    benchmarkTitle: 'Follow Standard English Conventions (Grade 1)',
    reportingCategory: 'communication-writing',
    officialText:
      'Follow the rules of standard English grammar, punctuation, capitalization, and spelling appropriate to grade level.',
    clarifications: [
      'Clarification 1: Skills to be mastered at this grade level are: Capitalize proper nouns; Form and use simple verb tenses for regular verbs by adding the affix -ed; Form and use complete simple sentences; Use possessives; Use subject-verb agreement in simple sentences.',
      'Clarification 1 (Skills to be implemented): Form plurals -y to -ies; Form and use frequently occurring irregular plural nouns; Form and use the past tense of frequently occurring irregular verbs; Use apostrophes to form contractions; Appropriately use pronouns; Use commas in a series; Use plural possessives; Use interjections.',
    ],
    fastAssessed: false,
    keywords: ['conventions', 'proper nouns', 'capitalization', 'possessives', 'subject-verb agreement', 'simple sentences', 'verb tense'],
    requiredCognitiveSkills: [
      'Capitalize proper nouns and use simple past -ed verbs',
      'Form complete simple sentences with subject-verb agreement and possessives',
    ],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 40,
  }),

  // =========================================================
  // GRADE 2 (doc pp. 43-48 -> PDF pp. 44-49)
  // =========================================================
  makeBenchmark({
    code: 'ELA.2.F.1.3',
    grade: '2',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Phonics and Word Analysis',
    reportingCategory: 'foundational-skills',
    officialText:
      'Use knowledge of grade-appropriate phonics and word-analysis skills to decode words. a. Decode words with variable vowel teams (e.g., oo, ea, ou) and vowel diphthongs (e.g., oi, oy, ow). b. Decode regularly spelled two-syllable words with long and short vowels. c. Decode words with open (e.g., hi, baby, moment) and closed (e.g., bag, sunshine, chop) syllables and consonant -le (e.g., purple, circle, stumble). d. Decode words with common prefixes and suffixes. e. Decode words with silent letter combinations (e.g., knight, comb, island, ghost).',
    clarifications: [
      'Includes variable vowel teams, diphthongs, open/closed/consonant-le syllables, common prefixes/suffixes, and silent letter combinations.',
    ],
    fastAssessed: false,
    keywords: ['phonics', 'decode', 'syllables', 'vowel teams', 'diphthongs', 'open closed syllable', 'silent letters', 'foundations'],
    requiredCognitiveSkills: [
      'Decode variable vowel teams, diphthongs, and silent-letter words',
      'Apply open, closed, consonant -le, and affix syllable patterns to decode two-syllable words',
    ],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 44,
  }),
  makeBenchmark({
    code: 'ELA.2.F.1.4',
    grade: '2',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Fluency',
    reportingCategory: 'foundational-skills',
    officialText: 'Read grade-level texts with accuracy, automaticity, and appropriate prosody or expression.',
    clarifications: [
      'Grade 2 fluency focuses on accurate decoding in connected text, appropriate reading rate, and expressive phrasing anchored to punctuation.',
    ],
    fastAssessed: false,
    keywords: ['fluency', 'accuracy', 'automaticity', 'prosody', 'expression', 'foundations'],
    requiredCognitiveSkills: ['Read Grade 2 texts with accuracy, automaticity, and expressive phrasing'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 44,
  }),
  makeBenchmark({
    code: 'ELA.2.R.1.1',
    grade: '2',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Literary Elements',
    benchmarkTitle: 'Plot Structure and Story Elements',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Identify plot structure and describe main story elements in a literary text.',
    clarifications: ['Includes characters, setting, problem/conflict, and resolution.'],
    fastAssessed: false,
    keywords: ['plot', 'story elements', 'character', 'setting', 'conflict', 'resolution'],
    requiredCognitiveSkills: ['Identify plot structure and describe main story elements'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 46,
  }),
  makeBenchmark({
    code: 'ELA.2.R.1.2',
    grade: '2',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Theme',
    benchmarkTitle: 'Theme of a Literary Text',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Identify and explain a theme of a literary text.',
    clarifications: ['Transitions from moral (Grade 1) to theme supported by story events.'],
    fastAssessed: false,
    keywords: ['theme', 'message', 'lesson', 'central message'],
    requiredCognitiveSkills: ['Identify a literary theme and explain supporting story details'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 46,
  }),
  makeBenchmark({
    code: 'ELA.2.R.1.3',
    grade: '2',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Perspective and Point of View',
    benchmarkTitle: 'Characters’ Perspectives',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Identify different characters’ perspectives in a literary text.',
    clarifications: [
      'The term perspective means “a particular attitude toward or way of regarding something.” The term point of view is used when referring to the person of the narrator. This is to prevent confusion and conflation.',
    ],
    fastAssessed: false,
    keywords: ['perspective', 'point of view', 'character attitude', 'feelings'],
    requiredCognitiveSkills: ['Distinguish and describe different characters’ attitudes or perspectives'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 46,
  }),
  makeBenchmark({
    code: 'ELA.2.R.1.4',
    grade: '2',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Poetry',
    benchmarkTitle: 'Rhyme Schemes',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Identify rhyme schemes in poems.',
    clarifications: ['Includes recognizing simple patterns such as AABB and ABAB.'],
    fastAssessed: false,
    keywords: ['rhyme scheme', 'poetry', 'poem', 'AABB', 'ABAB'],
    requiredCognitiveSkills: ['Identify end-rhyme patterns in stanzas'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 46,
  }),
  makeBenchmark({
    code: 'ELA.2.R.2.1',
    grade: '2',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Structure',
    benchmarkTitle: 'Text Features Contribute to Meaning',
    reportingCategory: 'reading-informational-text',
    officialText:
      'Explain how text features—including titles, headings, captions, graphs, maps, glossaries, and/or illustrations—contribute to the meaning of texts.',
    clarifications: ['Moves beyond locating features to explaining how they help readers understand text.'],
    fastAssessed: false,
    keywords: ['text features', 'headings', 'captions', 'maps', 'glossary', 'meaning'],
    requiredCognitiveSkills: ['Explain how a text feature clarifies or extends text meaning'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 46,
  }),
  makeBenchmark({
    code: 'ELA.2.R.2.2',
    grade: '2',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Central Idea',
    benchmarkTitle: 'Central Idea and Relevant Details',
    reportingCategory: 'reading-informational-text',
    officialText: 'Identify the central idea and relevant details in a text.',
    clarifications: ['Introduces the term central idea (often searched as main idea) and relevant details.'],
    fastAssessed: false,
    keywords: ['central idea', 'main idea', 'relevant details', 'informational'],
    requiredCognitiveSkills: ['Identify the central idea and match relevant supporting details'],
    suggestedItemTypes: ['multiple_choice', 'multiselect'],
    pdfPage: 46,
  }),
  makeBenchmark({
    code: 'ELA.2.R.2.3',
    grade: '2',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Purpose and Perspective',
    benchmarkTitle: 'Author’s Purpose',
    reportingCategory: 'reading-informational-text',
    officialText: 'Explain an author’s purpose in an informational text.',
    clarifications: ['Focuses on why the author wrote the text (to inform, explain, or persuade/describe).'],
    fastAssessed: false,
    keywords: ['author purpose', 'purpose', 'inform', 'explain', 'persuade'],
    requiredCognitiveSkills: ['Explain why the author wrote the informational text using text details'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 46,
  }),
  makeBenchmark({
    code: 'ELA.2.R.2.4',
    grade: '2',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Argument',
    benchmarkTitle: 'Author’s Opinion and Supporting Evidence',
    reportingCategory: 'reading-informational-text',
    officialText: 'Explain an author’s opinion(s) and supporting evidence.',
    clarifications: ['Students connect an author’s stated opinion to reasons or facts given in the text.'],
    fastAssessed: false,
    keywords: ['opinion', 'evidence', 'argument', 'reasons', 'claim'],
    requiredCognitiveSkills: ['Identify an author’s opinion and explain supporting evidence'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 46,
  }),
  makeBenchmark({
    code: 'ELA.2.R.3.1',
    grade: '2',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Figurative Language',
    benchmarkTitle: 'Similes, Idioms, and Alliteration',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText: 'Identify and explain similes, idioms, and alliteration in text(s).',
    clarifications: ['Introduces specific figurative language types expected by Grade 2.'],
    fastAssessed: false,
    keywords: ['figurative language', 'simile', 'idiom', 'alliteration'],
    requiredCognitiveSkills: ['Identify similes, idioms, and alliteration and explain their meaning'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 47,
  }),
  makeBenchmark({
    code: 'ELA.2.R.3.2',
    grade: '2',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Paraphrasing and Summarizing',
    benchmarkTitle: 'Retell Story Elements or Central Idea',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Retell a text to enhance comprehension: a. Use main story elements in a logical sequence for a literary text. b. Use the central idea and relevant details for an informational text.',
    clarifications: ['Emphasizes logical sequence in stories and central idea + details in informational text.'],
    fastAssessed: false,
    keywords: ['retell', 'summary', 'summarize', 'sequence', 'central idea'],
    requiredCognitiveSkills: ['Sequence main story events or organize central idea and details'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 47,
  }),
  makeBenchmark({
    code: 'ELA.2.R.3.3',
    grade: '2',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Comparative Reading',
    benchmarkTitle: 'Compare and Contrast Important Details',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Compare and contrast important details presented by two texts on the same topic or theme.',
    clarifications: ['Applies to paired texts on a shared topic or theme.'],
    fastAssessed: false,
    keywords: ['compare', 'contrast', 'paired texts', 'same topic', 'theme'],
    requiredCognitiveSkills: ['Compare important details across two texts'],
    suggestedItemTypes: ['multiple_choice', 'table_match'],
    pdfPage: 47,
  }),
  makeBenchmark({
    code: 'ELA.2.V.1.1',
    grade: '2',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Academic Vocabulary',
    benchmarkTitle: 'Academic Vocabulary',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText: 'Use grade-level academic vocabulary appropriately in speaking and writing.',
    clarifications: ['Cross-curricular Tier 2 words vital for Grade 2 reading comprehension.'],
    fastAssessed: false,
    keywords: ['vocabulary', 'academic vocabulary'],
    requiredCognitiveSkills: ['Use grade-level academic vocabulary accurately'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 49,
  }),
  makeBenchmark({
    code: 'ELA.2.V.1.2',
    grade: '2',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Morphology',
    benchmarkTitle: 'Base Words and Affixes',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Identify and use base words and affixes to determine the meaning of unfamiliar words in grade-level content.',
    clarifications: ['Common prefixes (un-, re-, pre-, dis-) and suffixes (-ful, -less, -ly).'],
    fastAssessed: false,
    keywords: ['morphology', 'prefixes', 'suffixes', 'affixes', 'base words'],
    requiredCognitiveSkills: ['Break apart base words and affixes to infer word meaning'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 49,
  }),
  makeBenchmark({
    code: 'ELA.2.V.1.3',
    grade: '2',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Context and Connotation',
    benchmarkTitle: 'Context Clues and Multiple-Meaning Words',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Identify and use context clues, word relationships, reference materials, and/or background knowledge to determine the meaning of multiple-meaning and unknown words.',
    clarifications: ['Introduces multiple-meaning words alongside context clues.'],
    fastAssessed: false,
    keywords: ['context clues', 'multiple-meaning', 'synonyms', 'antonyms', 'vocabulary'],
    requiredCognitiveSkills: ['Use context clues and word relationships to determine meaning'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 49,
  }),
  makeBenchmark({
    code: 'ELA.2.C.3.1',
    grade: '2',
    strand: 'C',
    strandName: 'Communication',
    standardGroup: 'Following Conventions',
    benchmarkTitle: 'Follow Standard English Conventions (Grade 2)',
    reportingCategory: 'communication-writing',
    officialText:
      'Follow the rules of standard English grammar, punctuation, capitalization, and spelling appropriate to grade level.',
    clarifications: [
      'Clarification 1: Skills to be mastered at this grade level are: Form and use irregular plural nouns; Form and use the past tense of frequently occurring irregular verbs; Use apostrophes to form contractions; Appropriately use pronouns; Use commas in a series; Use plural possessives; Maintain consistent verb tense across sentences.',
      'Clarification 1 (Skills to be implemented): Conjugate regular and irregular verb tenses; Form and use regular and frequently occurring irregular plural nouns; Form and use the past tense of frequently occurring irregular verbs; Maintain consistent verb tense across paragraphs; Use simple modifiers; Use prepositions and prepositional phrases; Form and use compound sentences; Use quotation marks with dialogue and direct quotations; Use commas to indicate direct address.',
    ],
    fastAssessed: false,
    keywords: [
      'conventions',
      'grammar',
      'punctuation',
      'capitalization',
      'irregular plural nouns',
      'irregular verbs',
      'contractions',
      'apostrophes',
      'commas',
      'verb tense',
    ],
    requiredCognitiveSkills: [
      'Apply Grade 2 grammar, capitalization, irregular plurals/verbs, apostrophes, and sentence punctuation rules',
    ],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 48,
  }),

  // =========================================================
  // GRADE 3 (doc pp. 51-56 -> PDF pp. 52-57)
  // =========================================================
  makeBenchmark({
    code: 'ELA.3.F.1.3',
    grade: '3',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Phonics and Word Analysis',
    reportingCategory: 'foundational-skills',
    officialText:
      'Use knowledge of grade-level phonics and word-analysis skills to decode words. a. Decode words with common Greek and Latin roots and affixes. (See benchmark 3.V.1.2) b. Decode words with common derivational suffixes and describe how they turn words into different parts of speech (e.g., -ful, -less, -est). c. Decode multisyllabic words.',
    clarifications: [
      'Clarification 1: See benchmark 3.V.1.2 for Greek and Latin roots and affixes (Appendix D).',
      'Supports multisyllabic decoding alongside derivational suffixes that shift part of speech (e.g., care -> careless, joy -> joyful).',
    ],
    fastAssessed: false,
    keywords: ['phonics', 'decode', 'multisyllabic', 'derivational suffixes', 'roots', 'affixes', 'foundations'],
    requiredCognitiveSkills: [
      'Decode multisyllabic words using roots, affixes, and syllable patterns',
      'Explain how derivational suffixes alter part of speech and meaning',
    ],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 52,
  }),
  makeBenchmark({
    code: 'ELA.3.F.1.4',
    grade: '3',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Fluency',
    reportingCategory: 'foundational-skills',
    officialText: 'Read grade-level texts with accuracy, automaticity, and appropriate prosody or expression.',
    clarifications: [
      'Clarification 1: See Fluency Norms (Appendix B) for oral reading fluency words-correct-per-minute benchmarks.',
      'Grade 3 fluency reinforces phrased, expressive reading across longer literary and informational passages.',
    ],
    fastAssessed: false,
    keywords: ['fluency', 'accuracy', 'automaticity', 'prosody', 'expression', 'wcpm', 'foundations'],
    requiredCognitiveSkills: ['Read Grade 3 texts fluently with accuracy, automaticity, and prosody'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 52,
  }),
  makeBenchmark({
    code: 'ELA.3.R.1.1',
    grade: '3',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Literary Elements',
    benchmarkTitle: 'Character Development',
    reportingCategory: 'reading-prose-poetry',
    officialText:
      'Explain how one or more characters develop throughout the plot in a literary text.',
    clarifications: [
      'Clarification 1: When explaining character development, students will include character traits, feelings, motivations, and responses to situations.',
    ],
    fastAssessed: true,
    keywords: ['character', 'character development', 'traits', 'feelings', 'motivations', 'plot', 'inference'],
    requiredCognitiveSkills: [
      'Analyze character traits, feelings, and motivations',
      'Explain how a character responds to events and changes across the plot',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr', 'hot_text', 'multiselect'],
    pdfPage: 53,
  }),
  makeBenchmark({
    code: 'ELA.3.R.1.2',
    grade: '3',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Theme',
    benchmarkTitle: 'Theme Development',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Explain a theme and how it develops, using details, in a literary text.',
    clarifications: [
      'Theme is the underlying message or big idea about life; students trace how events and character actions develop it.',
    ],
    fastAssessed: true,
    keywords: ['theme', 'message', 'big idea', 'lesson', 'details', 'inference'],
    requiredCognitiveSkills: [
      'Determine the theme of a literary text',
      'Explain how specific details develop the theme',
    ],
    suggestedItemTypes: ['ebsr', 'multiple_choice', 'multiselect'],
    pdfPage: 53,
  }),
  makeBenchmark({
    code: 'ELA.3.R.1.3',
    grade: '3',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Perspective and Point of View',
    benchmarkTitle: 'Characters’ Perspectives',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Explain different characters’ perspectives in a literary text.',
    clarifications: [
      'Clarification 1: The term perspective means “a particular attitude toward or way of regarding something.” The term point of view is used when referring to the person of the narrator. This is to prevent confusion and conflation.',
    ],
    fastAssessed: true,
    keywords: ['perspective', 'point of view', 'character attitude', 'thoughts', 'feelings', 'inference'],
    requiredCognitiveSkills: [
      'Compare or explain differing character attitudes toward events',
      'Support perspective analysis with dialogue or action evidence',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr', 'table_match'],
    pdfPage: 53,
  }),
  makeBenchmark({
    code: 'ELA.3.R.1.4',
    grade: '3',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Poetry',
    benchmarkTitle: 'Types of Poems',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Identify types of poems: free verse, rhymed verse, haiku, and limerick.',
    clarifications: [
      'Students distinguish structural features of free verse, rhymed verse, haiku (5-7-5 syllables), and limerick (AABBA rhyme/meter).',
    ],
    fastAssessed: true,
    keywords: ['poetry', 'poem', 'free verse', 'rhymed verse', 'haiku', 'limerick'],
    requiredCognitiveSkills: [
      'Identify poetic form based on rhyme, rhythm, and stanza structure',
    ],
    suggestedItemTypes: ['multiple_choice', 'multiselect'],
    pdfPage: 53,
  }),
  makeBenchmark({
    code: 'ELA.3.R.2.1',
    grade: '3',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Structure',
    benchmarkTitle: 'Text Features & Structures',
    reportingCategory: 'reading-informational-text',
    officialText:
      'Explain how text features contribute to meaning and identify the text structures of chronology, comparison, and cause/effect in texts.',
    clarifications: [
      'Text structures assessed at Grade 3: chronology, comparison, and cause/effect; text features include headings, captions, maps, graphs, glossaries, and illustrations.',
    ],
    fastAssessed: true,
    keywords: [
      'text structure',
      'text features',
      'chronology',
      'chronological',
      'comparison',
      'cause and effect',
      'headings',
      'captions',
    ],
    requiredCognitiveSkills: [
      'Explain how a specific text feature contributes to meaning',
      'Identify chronology, comparison, or cause/effect structure',
    ],
    suggestedItemTypes: ['multiple_choice', 'table_match', 'multiselect'],
    pdfPage: 54,
  }),
  makeBenchmark({
    code: 'ELA.3.R.2.2',
    grade: '3',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Central Idea',
    benchmarkTitle: 'Central Idea & Relevant Details',
    reportingCategory: 'reading-informational-text',
    officialText:
      'Identify the central idea and explain how relevant details support that idea in a text.',
    clarifications: [
      'Central idea corresponds to main idea in informational text; students distinguish relevant supporting evidence from unrelated facts.',
    ],
    fastAssessed: true,
    keywords: ['central idea', 'main idea', 'relevant details', 'supporting details', 'key idea'],
    requiredCognitiveSkills: [
      'Identify the central idea of a section or entire text',
      'Explain how relevant details support the central idea',
    ],
    suggestedItemTypes: ['ebsr', 'multiple_choice', 'multiselect', 'hot_text'],
    pdfPage: 54,
  }),
  makeBenchmark({
    code: 'ELA.3.R.2.3',
    grade: '3',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Purpose and Perspective',
    benchmarkTitle: 'Author’s Purpose Development',
    reportingCategory: 'reading-informational-text',
    officialText: 'Explain the development of an author’s purpose in an informational text.',
    clarifications: [
      'Students explain why the author wrote the text and how facts, examples, or explanations develop that purpose.',
    ],
    fastAssessed: true,
    keywords: ['author purpose', 'purpose', 'develop', 'informational', 'inference'],
    requiredCognitiveSkills: [
      'Determine the author’s purpose',
      'Explain how specific paragraphs or details develop that purpose',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr'],
    pdfPage: 54,
  }),
  makeBenchmark({
    code: 'ELA.3.R.2.4',
    grade: '3',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Argument',
    benchmarkTitle: 'Claim and Evidence',
    reportingCategory: 'reading-informational-text',
    officialText:
      'Identify an author’s claim and explain how an author uses evidence to support the claim.',
    clarifications: [
      'Students locate the author’s major point (claim) and evaluate which textual facts serve as supporting evidence.',
    ],
    fastAssessed: true,
    keywords: ['claim', 'argument', 'evidence', 'support', 'major point'],
    requiredCognitiveSkills: [
      'Identify an author’s specific claim',
      'Match supporting textual evidence to the claim',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr', 'hot_text'],
    pdfPage: 54,
  }),
  makeBenchmark({
    code: 'ELA.3.R.3.1',
    grade: '3',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Figurative Language',
    benchmarkTitle: 'Metaphors, Personification, and Hyperbole',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText: 'Identify and explain metaphors, personification, and hyperbole in text(s).',
    clarifications: [
      'Clarification 1: In addition to the types of figurative language listed in this benchmark, students are still working with types from previous grades such as simile, alliteration, and idiom. Other examples can be used in instruction.',
    ],
    fastAssessed: true,
    keywords: ['figurative language', 'metaphor', 'personification', 'hyperbole', 'simile', 'idiom'],
    requiredCognitiveSkills: [
      'Recognize metaphor, personification, or hyperbole in context',
      'Explain the figurative meaning and what it reveals in the text',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr', 'hot_text'],
    pdfPage: 54,
  }),
  makeBenchmark({
    code: 'ELA.3.R.3.2',
    grade: '3',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Paraphrasing and Summarizing',
    benchmarkTitle: 'Summarize a Text',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Summarize a text to enhance comprehension. a. Include plot and theme for a literary text. b. Use the central idea and relevant details for an informational text.',
    clarifications: [
      'Effective summaries are concise, objective, and exclude minor or irrelevant details.',
    ],
    fastAssessed: true,
    keywords: ['summarize', 'summary', 'paraphrase', 'plot', 'theme', 'central idea'],
    requiredCognitiveSkills: [
      'Select an accurate summary capturing plot/theme or central idea/relevant details',
    ],
    suggestedItemTypes: ['multiple_choice', 'multiselect'],
    pdfPage: 54,
  }),
  makeBenchmark({
    code: 'ELA.3.R.3.3',
    grade: '3',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Comparative Reading',
    benchmarkTitle: 'Compare and Contrast Two Authors',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Compare and contrast how two authors present information on the same topic or theme.',
    clarifications: [
      'Requires paired passages or dual accounts examining similarities and differences in presentation.',
    ],
    fastAssessed: true,
    keywords: ['compare', 'contrast', 'two authors', 'paired passages', 'same topic', 'theme'],
    requiredCognitiveSkills: [
      'Compare how two texts present similar or differing details on the same topic/theme',
    ],
    suggestedItemTypes: ['table_match', 'multiple_choice', 'multiselect'],
    pdfPage: 54,
  }),
  makeBenchmark({
    code: 'ELA.3.V.1.1',
    grade: '3',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Academic Vocabulary',
    benchmarkTitle: 'Grade-Level Academic Vocabulary',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText: 'Use grade-level academic vocabulary appropriately in speaking and writing.',
    clarifications: [
      'Clarification 1: Grade-level academic vocabulary consists of words that are likely to appear across subject areas for the current grade level and beyond, vital to comprehension, critical for academic discussions and writing, and usually require explicit instruction.',
    ],
    fastAssessed: false,
    keywords: ['vocabulary', 'academic vocabulary', 'tier 2', 'word choice'],
    requiredCognitiveSkills: ['Use Tier 2 cross-curricular words accurately in context'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 57,
  }),
  makeBenchmark({
    code: 'ELA.3.V.1.2',
    grade: '3',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Morphology',
    benchmarkTitle: 'Greek and Latin Roots, Base Words, and Affixes',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Identify and apply knowledge of common Greek and Latin roots, base words, and affixes to determine the meaning of unfamiliar words in grade-level content.',
    clarifications: [
      'Draws from Appendix D Greek & Latin roots (e.g., aqua, aud, bio, geo, graph, port, tele, vid/vis) and common prefixes/suffixes.',
    ],
    fastAssessed: true,
    keywords: ['morphology', 'roots', 'greek', 'latin', 'prefixes', 'suffixes', 'affixes', 'base words'],
    requiredCognitiveSkills: [
      'Analyze roots, prefixes, and suffixes to determine unfamiliar word meanings',
    ],
    suggestedItemTypes: ['multiple_choice', 'multiselect'],
    pdfPage: 57,
  }),
  makeBenchmark({
    code: 'ELA.3.V.1.3',
    grade: '3',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Context and Connotation',
    benchmarkTitle: 'Context Clues, Word Relationships & Multiple-Meaning Words',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Use context clues, figurative language, word relationships, reference materials, and/or background knowledge to determine the meaning of multiple-meaning and unknown words and phrases, appropriate to grade level.',
    clarifications: [
      'Clarification 1: Instruction for this benchmark should include text read-alouds and think-alouds aimed at building and activating background knowledge. Review of words learned in this way is critical to building background knowledge and related vocabulary. Texts read aloud can be two grade levels higher than student reading level.',
      'Clarification 2: See Context Clues and Word Relationships.',
      'Clarification 3: See ELA.3.R.3.1 and Elementary Figurative Language.',
    ],
    fastAssessed: true,
    keywords: ['context clues', 'vocabulary', 'multiple-meaning', 'synonyms', 'antonyms', 'connotation'],
    requiredCognitiveSkills: [
      'Use surrounding context clues and word relationships to determine word or phrase meaning',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr', 'hot_text'],
    pdfPage: 57,
  }),

  // =========================================================
  // GRADE 4 (doc pp. 60-65 -> PDF pp. 61-66)
  // =========================================================
  makeBenchmark({
    code: 'ELA.4.F.1.3',
    grade: '4',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Phonics and Word Analysis',
    reportingCategory: 'foundational-skills',
    officialText:
      'Use knowledge of grade-appropriate phonics and word-analysis skills to decode words. a. Apply knowledge of all letter-sound correspondences, syllabication patterns, and morphology to read and write unfamiliar single-syllable and multisyllabic words in and out of context.',
    clarifications: [
      'Clarification 1: At this level of reading, a student who is decoding at the phoneme level (i.e., “e-n-t-e-r-t-a-i-n”) may decode a given text but will struggle with comprehension. Students should be able to decode at the syllable and morpheme levels (i.e., “en-ter-tain” or “enter-tain”).',
    ],
    fastAssessed: false,
    keywords: ['phonics', 'decode', 'syllabication', 'multisyllabic', 'morphology', 'foundations'],
    requiredCognitiveSkills: ['Decode unfamiliar single- and multisyllabic words using morphology and syllabication'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 61,
  }),
  makeBenchmark({
    code: 'ELA.4.F.1.4',
    grade: '4',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Fluency',
    reportingCategory: 'foundational-skills',
    officialText: 'Read grade-level texts with accuracy, automaticity, and appropriate prosody or expression.',
    clarifications: [
      'Clarification 1: Grade 4 fluency supports comprehension of increasingly complex syntax, dialogue, and informational structures.',
    ],
    fastAssessed: false,
    keywords: ['fluency', 'accuracy', 'automaticity', 'prosody', 'expression', 'foundations'],
    requiredCognitiveSkills: ['Read Grade 4 texts accurately with automaticity and prosody'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 61,
  }),
  makeBenchmark({
    code: 'ELA.4.R.1.1',
    grade: '4',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Literary Elements',
    benchmarkTitle: 'Setting, Events, Conflict & Character Development',
    reportingCategory: 'reading-prose-poetry',
    officialText:
      'Explain how setting, events, conflict, and character development contribute to the plot in a literary text.',
    clarifications: [
      'Students explain how interaction among setting, conflict, events, and character change drives the plot forward.',
    ],
    fastAssessed: true,
    keywords: ['setting', 'events', 'conflict', 'character development', 'plot', 'literary elements', 'inference'],
    requiredCognitiveSkills: [
      'Explain how setting or conflict shapes plot events',
      'Connect character decisions and changes to plot progression',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr', 'hot_text', 'multiselect'],
    pdfPage: 62,
  }),
  makeBenchmark({
    code: 'ELA.4.R.1.2',
    grade: '4',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Theme',
    benchmarkTitle: 'Stated or Implied Theme Development',
    reportingCategory: 'reading-prose-poetry',
    officialText:
      'Explain a stated or implied theme and how it develops, using details, in a literary text.',
    clarifications: [
      'Clarification 1: An explanation of how the theme develops should include how characters respond to situations and how the speaker reflects upon a topic in a literary text.',
    ],
    fastAssessed: true,
    keywords: ['theme', 'implied theme', 'stated theme', 'message', 'character response', 'inference'],
    requiredCognitiveSkills: [
      'Determine a stated or implied theme',
      'Explain how character responses or speaker reflection develop the theme',
    ],
    suggestedItemTypes: ['ebsr', 'multiple_choice', 'multiselect'],
    pdfPage: 62,
  }),
  makeBenchmark({
    code: 'ELA.4.R.1.3',
    grade: '4',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Perspective and Point of View',
    benchmarkTitle: 'Narrator Point of View vs. Character Perspective',
    reportingCategory: 'reading-prose-poetry',
    officialText:
      'Identify the narrator’s point of view and explain the difference between a narrator’s point of view and character perspective in a literary text.',
    clarifications: [
      'Clarification 1: The term perspective means “a particular attitude toward or way of regarding something.” The term point of view is used when referring to the person of the narrator. This is to prevent confusion and conflation.',
    ],
    fastAssessed: true,
    keywords: ['point of view', 'narrator', 'first person', 'third person', 'perspective', 'attitude'],
    requiredCognitiveSkills: [
      'Identify first-person or third-person point of view',
      'Distinguish narrator point of view from character perspective',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr', 'table_match'],
    pdfPage: 62,
  }),
  makeBenchmark({
    code: 'ELA.4.R.1.4',
    grade: '4',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Poetry',
    benchmarkTitle: 'Rhyme and Structure in Poetry',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Explain how rhyme and structure create meaning in a poem.',
    clarifications: [
      'Moves beyond identifying poem types to explaining how stanzas, line breaks, and rhyme create meaning or emphasis.',
    ],
    fastAssessed: true,
    keywords: ['poetry', 'poem', 'rhyme', 'structure', 'stanzas', 'meaning'],
    requiredCognitiveSkills: [
      'Explain how rhyme patterns and stanza organization contribute to a poem’s meaning',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr'],
    pdfPage: 62,
  }),
  makeBenchmark({
    code: 'ELA.4.R.2.1',
    grade: '4',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Structure',
    benchmarkTitle: 'Text Features & Problem/Solution, Sequence, Description',
    reportingCategory: 'reading-informational-text',
    officialText:
      'Explain how text features contribute to the meaning and identify the text structures of problem/solution, sequence, and description in texts.',
    clarifications: [
      'Introduces problem/solution, sequence, and description alongside Grade 3 structures (chronology, comparison, cause/effect).',
    ],
    fastAssessed: true,
    keywords: [
      'text structure',
      'text features',
      'problem and solution',
      'sequence',
      'description',
      'headings',
      'charts',
    ],
    requiredCognitiveSkills: [
      'Identify problem/solution, sequence, or description structures',
      'Explain how text features clarify or deepen informational meaning',
    ],
    suggestedItemTypes: ['multiple_choice', 'table_match', 'multiselect'],
    pdfPage: 63,
  }),
  makeBenchmark({
    code: 'ELA.4.R.2.2',
    grade: '4',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Central Idea',
    benchmarkTitle: 'Central Idea (Implied or Explicit) & Relevant Details',
    reportingCategory: 'reading-informational-text',
    officialText: 'Explain how relevant details support the central idea, implied or explicit.',
    clarifications: [
      'Covers both explicitly stated and implied central ideas (main ideas) in Grade 4 informational texts.',
    ],
    fastAssessed: true,
    keywords: ['central idea', 'main idea', 'implied', 'relevant details', 'supporting evidence', 'inference'],
    requiredCognitiveSkills: [
      'Determine an explicit or implied central idea',
      'Explain how relevant details support that central idea',
    ],
    suggestedItemTypes: ['ebsr', 'multiple_choice', 'multiselect', 'hot_text'],
    pdfPage: 63,
  }),
  makeBenchmark({
    code: 'ELA.4.R.2.3',
    grade: '4',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Purpose and Perspective',
    benchmarkTitle: 'Author’s Perspective',
    reportingCategory: 'reading-informational-text',
    officialText: 'Explain an author’s perspective toward a topic in an informational text.',
    clarifications: [
      'Clarification 1: The term perspective means “a particular attitude toward or way of regarding something.”',
    ],
    fastAssessed: true,
    keywords: ['author perspective', 'perspective', 'attitude', 'viewpoint', 'inference'],
    requiredCognitiveSkills: [
      'Infer and explain the author’s attitude toward a topic using word choice and evidence',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr', 'hot_text'],
    pdfPage: 63,
  }),
  makeBenchmark({
    code: 'ELA.4.R.2.4',
    grade: '4',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Argument',
    benchmarkTitle: 'Claim, Reasons, and Evidence',
    reportingCategory: 'reading-informational-text',
    officialText:
      'Explain an author’s claim and the reasons and evidence used to support the claim.',
    clarifications: [
      'Distinguishes reasons (logical points) and evidence (facts, examples, data) supporting a claim.',
    ],
    fastAssessed: true,
    keywords: ['claim', 'argument', 'reasons', 'evidence', 'persuasive'],
    requiredCognitiveSkills: [
      'Explain an author’s stated or implied claim',
      'Connect specific reasons and textual evidence to the claim',
    ],
    suggestedItemTypes: ['ebsr', 'multiple_choice', 'hot_text', 'multiselect'],
    pdfPage: 63,
  }),
  makeBenchmark({
    code: 'ELA.4.R.3.1',
    grade: '4',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Figurative Language',
    benchmarkTitle: 'Figurative Language Contributes to Meaning',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText: 'Explain how figurative language contributes to meaning in text(s).',
    clarifications: [
      'Clarification 1: Figurative language for the purposes of this benchmark refers to metaphor, simile, alliteration, personification, hyperbole, and idiom. Other examples can be used in instruction.',
    ],
    fastAssessed: true,
    keywords: [
      'figurative language',
      'metaphor',
      'simile',
      'alliteration',
      'personification',
      'hyperbole',
      'idiom',
    ],
    requiredCognitiveSkills: [
      'Interpret figurative phrases in context',
      'Explain how figurative language contributes to meaning or tone',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr', 'hot_text'],
    pdfPage: 63,
  }),
  makeBenchmark({
    code: 'ELA.4.R.3.2',
    grade: '4',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Paraphrasing and Summarizing',
    benchmarkTitle: 'Summarize a Text',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Summarize a text to enhance comprehension. a. Include plot and theme for a literary text. b. Include the central idea and relevant details for an informational text.',
    clarifications: [
      'Summaries must reflect key plot/theme or central idea/relevant details accurately and concisely.',
    ],
    fastAssessed: true,
    keywords: ['summarize', 'summary', 'paraphrase', 'plot', 'theme', 'central idea'],
    requiredCognitiveSkills: [
      'Distinguish essential plot/theme or central idea details from minor details in a summary',
    ],
    suggestedItemTypes: ['multiple_choice', 'multiselect'],
    pdfPage: 63,
  }),
  makeBenchmark({
    code: 'ELA.4.R.3.3',
    grade: '4',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Comparative Reading',
    benchmarkTitle: 'Primary and Secondary Source Accounts',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Compare and contrast accounts of the same event using primary and/or secondary sources.',
    clarifications: ['Clarification 1: Introduce the terms primary sources and secondary sources.'],
    fastAssessed: true,
    keywords: [
      'primary source',
      'secondary source',
      'firsthand',
      'secondhand',
      'compare',
      'contrast',
      'paired',
    ],
    requiredCognitiveSkills: [
      'Distinguish primary (firsthand) and secondary (secondhand) accounts',
      'Compare focus, details, and perspective across paired accounts',
    ],
    suggestedItemTypes: ['table_match', 'multiple_choice', 'multiselect'],
    pdfPage: 63,
  }),
  makeBenchmark({
    code: 'ELA.4.V.1.1',
    grade: '4',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Academic Vocabulary',
    benchmarkTitle: 'Grade-Level Academic Vocabulary',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText: 'Use grade-level academic vocabulary appropriately in speaking and writing.',
    clarifications: [
      'Clarification 1: Grade-level academic vocabulary consists of words that are likely to appear across subject areas for the current grade level and beyond, vital to comprehension, critical for academic discussions and writing, and usually require explicit instruction.',
    ],
    fastAssessed: false,
    keywords: ['vocabulary', 'academic vocabulary', 'tier 2'],
    requiredCognitiveSkills: ['Use cross-curricular academic words accurately'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 66,
  }),
  makeBenchmark({
    code: 'ELA.4.V.1.2',
    grade: '4',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Morphology',
    benchmarkTitle: 'Greek and Latin Roots, Base Words, and Affixes',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Apply knowledge of common Greek and Latin roots, base words, and affixes to determine the meaning of unfamiliar words in grade-level content.',
    clarifications: [
      'Students actively apply Appendix D 3–5 roots and affixes to unlock unfamiliar vocabulary.',
    ],
    fastAssessed: true,
    keywords: ['morphology', 'roots', 'greek', 'latin', 'affixes', 'prefixes', 'suffixes'],
    requiredCognitiveSkills: [
      'Deconstruct unfamiliar words using roots and affixes to determine meaning',
    ],
    suggestedItemTypes: ['multiple_choice', 'multiselect'],
    pdfPage: 66,
  }),
  makeBenchmark({
    code: 'ELA.4.V.1.3',
    grade: '4',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Context and Connotation',
    benchmarkTitle: 'Context Clues, Word Relationships & Multiple-Meaning Words',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Use context clues, figurative language, word relationships, reference materials, and/or background knowledge to determine the meaning of multiple-meaning and unknown words and phrases, appropriate to grade level.',
    clarifications: [
      'Clarification 1: Instruction for this benchmark should include text read-alouds and think-alouds aimed at building and activating background knowledge. Review of words learned in this way is critical to building background knowledge and related vocabulary. Texts read aloud can be two grade levels higher than student reading level.',
      'Clarification 2: See Context Clues and Word Relationships.',
      'Clarification 3: See ELA.4.R.3.1 and Elementary Figurative Language.',
    ],
    fastAssessed: true,
    keywords: ['context clues', 'vocabulary', 'synonyms', 'antonyms', 'multiple-meaning', 'connotation'],
    requiredCognitiveSkills: [
      'Determine word or phrase meaning from context clues and word relationships',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr', 'hot_text'],
    pdfPage: 66,
  }),

  // =========================================================
  // GRADE 5 (doc pp. 69-74 -> PDF pp. 70-75)
  // =========================================================
  makeBenchmark({
    code: 'ELA.5.F.1.3',
    grade: '5',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Phonics and Word Analysis',
    reportingCategory: 'foundational-skills',
    officialText:
      'Use knowledge of grade-appropriate phonics and word-analysis skills to decode words. a. Apply knowledge of all letter-sound correspondences, syllabication patterns, and morphology to read and write unfamiliar single-syllable and multisyllabic words in and out of context.',
    clarifications: [
      'Applies syllable division alongside Greek and Latin roots and affixes when decoding unfamiliar academic words in and out of context.',
    ],
    fastAssessed: false,
    keywords: ['phonics', 'decode', 'syllabication', 'morphology', 'multisyllabic', 'foundations'],
    requiredCognitiveSkills: ['Decode unfamiliar multisyllabic words using syllabication and morphological analysis'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 70,
  }),
  makeBenchmark({
    code: 'ELA.5.F.1.4',
    grade: '5',
    strand: 'F',
    strandName: 'Foundations',
    standardGroup: 'Learning and Applying Foundational Reading Skills',
    benchmarkTitle: 'Fluency',
    reportingCategory: 'foundational-skills',
    officialText: 'Read grade-level texts with accuracy, automaticity, and appropriate prosody or expression.',
    clarifications: [
      'Supports fluent comprehension of Grade 5 complex literary and informational texts with self-monitoring and prosodic phrasing.',
    ],
    fastAssessed: false,
    keywords: ['fluency', 'accuracy', 'automaticity', 'prosody', 'expression', 'foundations'],
    requiredCognitiveSkills: ['Read Grade 5 texts accurately with automaticity and prosody'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 70,
  }),
  makeBenchmark({
    code: 'ELA.5.R.1.1',
    grade: '5',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Literary Elements',
    benchmarkTitle: 'Setting, Events, Conflict & Characterization',
    reportingCategory: 'reading-prose-poetry',
    officialText:
      'Analyze how setting, events, conflict, and characterization contribute to the plot in a literary text.',
    clarifications: [
      'Shifts to analytical level: how characterization and conflict interact with setting and events to advance the plot.',
    ],
    fastAssessed: true,
    keywords: ['characterization', 'setting', 'conflict', 'plot', 'events', 'analyze', 'inference'],
    requiredCognitiveSkills: [
      'Analyze how characterization, conflict, and setting interact to drive plot outcomes',
    ],
    suggestedItemTypes: ['ebsr', 'multiple_choice', 'hot_text', 'multiselect'],
    pdfPage: 71,
  }),
  makeBenchmark({
    code: 'ELA.5.R.1.2',
    grade: '5',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Theme',
    benchmarkTitle: 'Development of Stated or Implied Theme(s)',
    reportingCategory: 'reading-prose-poetry',
    officialText:
      'Explain the development of stated or implied theme(s) throughout a literary text.',
    clarifications: [
      'Clarification 1: Where the development of multiple themes is being explained, the themes may come from the same or multiple literary texts.',
    ],
    fastAssessed: true,
    keywords: ['theme', 'themes', 'implied theme', 'stated theme', 'development', 'inference'],
    requiredCognitiveSkills: [
      'Trace how stated or implied theme(s) develop across beginning, middle, and resolution',
    ],
    suggestedItemTypes: ['ebsr', 'multiple_choice', 'multiselect', 'table_match'],
    pdfPage: 71,
  }),
  makeBenchmark({
    code: 'ELA.5.R.1.3',
    grade: '5',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Perspective and Point of View',
    benchmarkTitle: 'Developing a Character’s Perspective',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Describe how an author develops a character’s perspective in a literary text.',
    clarifications: [
      'Clarification 1: The term perspective means “a particular attitude toward or way of regarding something.”',
    ],
    fastAssessed: true,
    keywords: ['perspective', 'character perspective', 'author craft', 'attitude', 'inference'],
    requiredCognitiveSkills: [
      'Describe the techniques and details an author uses to develop a character’s perspective',
    ],
    suggestedItemTypes: ['ebsr', 'multiple_choice', 'hot_text'],
    pdfPage: 71,
  }),
  makeBenchmark({
    code: 'ELA.5.R.1.4',
    grade: '5',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Poetry',
    benchmarkTitle: 'Figurative Language & Poetic Elements',
    reportingCategory: 'reading-prose-poetry',
    officialText: 'Explain how figurative language and other poetic elements work together in a poem.',
    clarifications: [
      'Clarification 1: Figurative language for the purposes of this benchmark refers to metaphor, simile, alliteration, personification, hyperbole, imagery, and idiom. Other examples can be used in instruction.',
      'Clarification 2: Poetic elements to be used for the purposes of this benchmark are form, rhyme, meter, line breaks, and imagery.',
    ],
    fastAssessed: true,
    keywords: ['poetry', 'poem', 'figurative language', 'form', 'rhyme', 'meter', 'line breaks', 'imagery'],
    requiredCognitiveSkills: [
      'Explain how poetic elements (form, rhyme, meter, line breaks, imagery) and figurative language interact',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr', 'multiselect'],
    pdfPage: 71,
  }),
  makeBenchmark({
    code: 'ELA.5.R.2.1',
    grade: '5',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Structure',
    benchmarkTitle: 'Text Structures & Features Overall Meaning',
    reportingCategory: 'reading-informational-text',
    officialText:
      'Explain how text structures and/or features contribute to the overall meaning of texts.',
    clarifications: [
      'Assesses how overall structure (chronology, comparison, cause/effect, problem/solution, sequence, description) and text features shape overall comprehension.',
    ],
    fastAssessed: true,
    keywords: [
      'text structure',
      'text features',
      'overall meaning',
      'chronology',
      'cause and effect',
      'problem and solution',
      'comparison',
    ],
    requiredCognitiveSkills: [
      'Explain why an author uses a particular text structure or feature and how it supports overall meaning',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr', 'table_match'],
    pdfPage: 72,
  }),
  makeBenchmark({
    code: 'ELA.5.R.2.2',
    grade: '5',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Central Idea',
    benchmarkTitle: 'Central Idea(s), Implied or Explicit',
    reportingCategory: 'reading-informational-text',
    officialText: 'Explain how relevant details support the central idea(s), implied or explicit.',
    clarifications: [
      'Grade 5 passages may develop multiple or implied central ideas requiring cross-paragraph synthesis.',
    ],
    fastAssessed: true,
    keywords: ['central idea', 'main idea', 'implied', 'relevant details', 'multiple central ideas', 'inference'],
    requiredCognitiveSkills: [
      'Synthesize explicit or implied central idea(s)',
      'Explain how complex details support central idea(s)',
    ],
    suggestedItemTypes: ['ebsr', 'multiple_choice', 'multiselect', 'hot_text'],
    pdfPage: 72,
  }),
  makeBenchmark({
    code: 'ELA.5.R.2.3',
    grade: '5',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Purpose and Perspective',
    benchmarkTitle: 'Author’s Purpose and/or Perspective',
    reportingCategory: 'reading-informational-text',
    officialText: 'Analyze an author’s purpose and/or perspective in an informational text.',
    clarifications: [
      'Clarification 1: The term perspective means “a particular attitude toward or way of regarding something.”',
    ],
    fastAssessed: true,
    keywords: ['author purpose', 'perspective', 'analyze', 'attitude', 'inference'],
    requiredCognitiveSkills: [
      'Analyze how an author establishes and develops purpose and perspective in informational text',
    ],
    suggestedItemTypes: ['ebsr', 'multiple_choice', 'hot_text'],
    pdfPage: 72,
  }),
  makeBenchmark({
    code: 'ELA.5.R.2.4',
    grade: '5',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Argument',
    benchmarkTitle: 'Track Argument Development',
    reportingCategory: 'reading-informational-text',
    officialText:
      'Track the development of an argument, identifying the specific claim(s), evidence, and reasoning.',
    clarifications: [
      'Clarification 1: A claim is a statement that asserts something is true. A claim can either be fact or opinion. Claims can be used alone or with other claims to form a larger argument.',
    ],
    fastAssessed: true,
    keywords: ['argument', 'claim', 'claims', 'evidence', 'reasoning', 'track'],
    requiredCognitiveSkills: [
      'Distinguish claims, evidence, and reasoning across an informational argument',
      'Track how multiple claims or evidence build an argument',
    ],
    suggestedItemTypes: ['table_match', 'ebsr', 'multiple_choice', 'multiselect'],
    pdfPage: 72,
  }),
  makeBenchmark({
    code: 'ELA.5.R.3.1',
    grade: '5',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Figurative Language',
    benchmarkTitle: 'Analyze Figurative Language',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText: 'Analyze how figurative language contributes to meaning in text(s).',
    clarifications: [
      'Includes metaphor, simile, alliteration, personification, hyperbole, imagery, and idiom (Appendix B Elementary Figurative Language).',
    ],
    fastAssessed: true,
    keywords: [
      'figurative language',
      'metaphor',
      'simile',
      'imagery',
      'personification',
      'hyperbole',
      'idiom',
      'alliteration',
    ],
    requiredCognitiveSkills: [
      'Analyze how figurative language shapes implied meaning, mood, or characterization',
    ],
    suggestedItemTypes: ['ebsr', 'multiple_choice', 'hot_text'],
    pdfPage: 72,
  }),
  makeBenchmark({
    code: 'ELA.5.R.3.2',
    grade: '5',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Paraphrasing and Summarizing',
    benchmarkTitle: 'Summarize a Text',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Summarize a text to enhance comprehension: a. Include plot and theme for a literary text. b. Include the central idea and relevant details for an informational text.',
    clarifications: [
      'Summaries synthesize essential elements without extraneous opinions or minor details.',
    ],
    fastAssessed: true,
    keywords: ['summarize', 'summary', 'paraphrase', 'plot', 'theme', 'central idea'],
    requiredCognitiveSkills: [
      'Select or evaluate a concise summary capturing essential details of a text',
    ],
    suggestedItemTypes: ['multiple_choice', 'multiselect'],
    pdfPage: 72,
  }),
  makeBenchmark({
    code: 'ELA.5.R.3.3',
    grade: '5',
    strand: 'R',
    strandName: 'Reading',
    standardGroup: 'Comparative Reading',
    benchmarkTitle: 'Compare & Contrast Primary and Secondary Sources',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Compare and contrast primary and secondary sources related to the same topic.',
    clarifications: [
      'Focuses on comparing how primary (firsthand) and secondary (secondhand) sources contribute to understanding the same topic.',
    ],
    fastAssessed: true,
    keywords: [
      'primary source',
      'secondary source',
      'compare',
      'contrast',
      'paired passages',
      'same topic',
    ],
    requiredCognitiveSkills: [
      'Compare and contrast details, emphasis, and perspective across primary and secondary sources',
    ],
    suggestedItemTypes: ['table_match', 'ebsr', 'multiple_choice', 'multiselect'],
    pdfPage: 72,
  }),
  makeBenchmark({
    code: 'ELA.5.V.1.1',
    grade: '5',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Academic Vocabulary',
    benchmarkTitle: 'Grade-Level Academic Vocabulary',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText: 'Use grade-level academic vocabulary appropriately in speaking and writing.',
    clarifications: [
      'Clarification 1: Grade-level academic vocabulary consists of words that are likely to appear across subject areas for the current grade level and beyond, vital to comprehension, critical for academic discussions and writing, and usually require explicit instruction.',
    ],
    fastAssessed: false,
    keywords: ['vocabulary', 'academic vocabulary', 'tier 2'],
    requiredCognitiveSkills: ['Use Tier 2 academic words accurately in speaking and writing'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 75,
  }),
  makeBenchmark({
    code: 'ELA.5.V.1.2',
    grade: '5',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Morphology',
    benchmarkTitle: 'Greek and Latin Roots, Base Words, and Affixes',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Apply knowledge of Greek and Latin roots, base words, and affixes to determine the meaning of unfamiliar words in grade-level content.',
    clarifications: [
      'Connects affixes and parts of speech (e.g., noun-forming vs. adjective-forming suffixes) with Appendix D Greek & Latin roots.',
    ],
    fastAssessed: true,
    keywords: ['morphology', 'roots', 'greek', 'latin', 'affixes', 'prefixes', 'suffixes', 'part of speech'],
    requiredCognitiveSkills: [
      'Apply Greek/Latin roots and affixes (including part-of-speech shifts) to determine word meaning',
    ],
    suggestedItemTypes: ['multiple_choice', 'multiselect'],
    pdfPage: 75,
  }),
  makeBenchmark({
    code: 'ELA.5.V.1.3',
    grade: '5',
    strand: 'V',
    strandName: 'Vocabulary',
    standardGroup: 'Context and Connotation',
    benchmarkTitle: 'Context Clues, Word Relationships & Multiple-Meaning Words',
    reportingCategory: 'reading-across-genres-vocabulary',
    officialText:
      'Use context clues, figurative language, word relationships, reference materials, and/or background knowledge to determine the meaning of multiple-meaning and unknown words and phrases, appropriate to grade level.',
    clarifications: [
      'Clarification 1: Instruction for this benchmark should include text read-alouds and think-alouds aimed at building and activating background knowledge. Review of words learned in this way is critical to building background knowledge and related vocabulary. Texts read aloud can be two grade levels higher than student reading level.',
      'Clarification 2: See Context Clues and Word Relationships.',
      'Clarification 3: See ELA.5.R.3.1 and Elementary Figurative Language.',
    ],
    fastAssessed: true,
    keywords: ['context clues', 'connotation', 'multiple-meaning', 'vocabulary', 'synonyms', 'antonyms'],
    requiredCognitiveSkills: [
      'Determine denotative or contextual meaning of complex and multiple-meaning words/phrases',
    ],
    suggestedItemTypes: ['multiple_choice', 'ebsr', 'hot_text'],
    pdfPage: 75,
  }),

  // Key Communication benchmarks (Grades 3-5 Writing/Research reference)
  makeBenchmark({
    code: 'ELA.3.C.1.4',
    grade: '3',
    strand: 'C',
    strandName: 'Communication',
    standardGroup: 'Expository Writing',
    benchmarkTitle: 'Expository Writing',
    reportingCategory: 'communication-writing',
    officialText:
      'Write expository texts about a topic, using one or more sources, providing an introduction, facts and details, some elaboration, transitions, and a conclusion.',
    clarifications: ['Connected to text-based informational comprehension and evidence use.'],
    fastAssessed: false,
    keywords: ['writing', 'expository', 'sources', 'transitions', 'evidence'],
    requiredCognitiveSkills: ['Organize expository writing from source details'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 55,
  }),
  makeBenchmark({
    code: 'ELA.4.C.1.3',
    grade: '4',
    strand: 'C',
    strandName: 'Communication',
    standardGroup: 'Argumentative Writing',
    benchmarkTitle: 'Argumentative Writing (B.E.S.T. Writing)',
    reportingCategory: 'communication-writing',
    officialText:
      'Write to make a claim supporting a perspective with logical reasons, using evidence from multiple sources, elaboration, and an organizational structure with transitions.',
    clarifications: ['Assessed in Grade 4 B.E.S.T. Writing using 2–4 paired sources (800–1300 combined words).'],
    fastAssessed: false,
    keywords: ['argumentative writing', 'claim', 'sources', 'transitions', 'best writing'],
    requiredCognitiveSkills: ['Support a claim with reasons and evidence from multiple sources'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 64,
  }),
  makeBenchmark({
    code: 'ELA.5.C.1.4',
    grade: '5',
    strand: 'C',
    strandName: 'Communication',
    standardGroup: 'Expository Writing (B.E.S.T. Writing)',
    benchmarkTitle: 'Expository Writing (B.E.S.T. Writing)',
    reportingCategory: 'communication-writing',
    officialText:
      'Write expository texts about a topic using multiple sources and including an organizational structure, relevant elaboration, and varied transitions.',
    clarifications: ['Assessed in Grade 5 B.E.S.T. Writing using 2–4 paired sources (800–1300 combined words).'],
    fastAssessed: false,
    keywords: ['expository writing', 'multiple sources', 'elaboration', 'best writing'],
    requiredCognitiveSkills: ['Synthesize evidence across multiple sources into structured writing'],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 73,
  }),

  // Conventions benchmarks (Grades 3-5 Grammar & Editing)
  makeBenchmark({
    code: 'ELA.3.C.3.1',
    grade: '3',
    strand: 'C',
    strandName: 'Communication',
    standardGroup: 'Following Conventions',
    benchmarkTitle: 'Follow Standard English Conventions (Grade 3)',
    reportingCategory: 'communication-writing',
    officialText:
      'Follow the rules of standard English grammar, punctuation, capitalization, and spelling appropriate to grade level.',
    clarifications: [
      'Clarification 1: Skills to be mastered at this grade level are: Conjugate regular and irregular verb tenses; Form and use regular and frequently occurring irregular plural nouns; Form and use the past tense of frequently occurring irregular verbs; Maintain consistent verb tense across paragraphs; Form and use the progressive and perfect verb tenses; Use simple modifiers; Use prepositions and prepositional phrases; Form and use compound sentences; Use quotation marks with dialogue and direct quotations; Use commas to indicate direct address.',
      'Clarification 1 (Skills to be implemented): Use subject-verb agreement with intervening clauses and phrases; Produce complete sentences, recognizing and correcting inappropriate fragments and run-ons; Use conjunctions; Use principal modals to indicate the mood of a verb; Use appositives, main clauses, and subordinate clauses.',
    ],
    fastAssessed: false,
    keywords: [
      'conventions',
      'grammar',
      'editing',
      'punctuation',
      'capitalization',
      'spelling',
      'verb tense',
      'plural nouns',
      'compound sentences',
      'quotation marks',
      'commas',
      'prepositions',
    ],
    requiredCognitiveSkills: [
      'Apply Grade 3 grammar, verb tense, plural noun, compound sentence, and punctuation rules in editing sentences',
    ],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 55,
  }),
  makeBenchmark({
    code: 'ELA.4.C.3.1',
    grade: '4',
    strand: 'C',
    strandName: 'Communication',
    standardGroup: 'Following Conventions',
    benchmarkTitle: 'Follow Standard English Conventions (Grade 4)',
    reportingCategory: 'communication-writing',
    officialText:
      'Follow the rules of standard English grammar, punctuation, capitalization, and spelling appropriate to grade level.',
    clarifications: [
      'Clarification 1: Skills to be mastered at this grade level are: Use subject-verb agreement with intervening clauses and phrases; Produce complete sentences, recognizing and correcting inappropriate fragments and run-ons; Use conjunctions.',
      'Clarification 1 (Skills to be implemented): Use principal modals to indicate the mood of a verb; Use appositives, main clauses, and subordinate clauses; Recognize and correct inappropriate shifts in tense and number; Use conjunctions correctly to join words and phrases in a sentence; Use verbals including gerunds, infinitives, and participial phrases; Use pronouns correctly with regard to case, number, and person, correcting for vague pronoun reference.',
    ],
    fastAssessed: false,
    keywords: [
      'conventions',
      'grammar',
      'editing',
      'punctuation',
      'capitalization',
      'spelling',
      'subject-verb agreement',
      'fragments',
      'run-ons',
      'conjunctions',
      'complete sentences',
    ],
    requiredCognitiveSkills: [
      'Edit subject-verb agreement, fragments, run-ons, conjunctions, and standard English mechanics',
    ],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 65,
  }),
  makeBenchmark({
    code: 'ELA.5.C.3.1',
    grade: '5',
    strand: 'C',
    strandName: 'Communication',
    standardGroup: 'Following Conventions',
    benchmarkTitle: 'Follow Standard English Conventions (Grade 5)',
    reportingCategory: 'communication-writing',
    officialText:
      'Follow the rules of standard English grammar, punctuation, capitalization, and spelling appropriate to grade level.',
    clarifications: [
      'Clarification 1: Skills to be mastered at this grade level are: Use principal modals to indicate the mood of a verb; Use appositives, main clauses, and subordinate clauses; Recognize and correct inappropriate shifts in tense and number; Use conjunctions correctly to join words and phrases in a sentence.',
      'Clarification 1 (Skills to be implemented): Use verbals including gerunds, infinitives, and participial phrases; Use comparative and superlative forms of adjectives; Use pronouns correctly with regard to case, number, and person, correcting for vague pronoun reference; Vary sentence structure.',
    ],
    fastAssessed: false,
    keywords: [
      'conventions',
      'grammar',
      'editing',
      'punctuation',
      'capitalization',
      'spelling',
      'modals',
      'appositives',
      'clauses',
      'tense shift',
      'conjunctions',
    ],
    requiredCognitiveSkills: [
      'Edit modal verbs, appositives, clauses, tense/number shifts, and conjunction usage in grade-level sentences',
    ],
    suggestedItemTypes: ['multiple_choice'],
    pdfPage: 73,
  }),
];

export interface FastBlueprintRow {
  reportingCategoryId: ReportingCategoryId;
  reportingCategoryLabel: string;
  weight: string;
  benchmarks: string[];
}

export const FAST_READING_BLUEPRINTS: Record<FastAssessedGrade, FastBlueprintRow[]> = {
  '3': [
    {
      reportingCategoryId: 'reading-prose-poetry',
      reportingCategoryLabel: 'Reading Prose and Poetry',
      weight: '25–35%',
      benchmarks: ['ELA.3.R.1.1', 'ELA.3.R.1.2', 'ELA.3.R.1.3', 'ELA.3.R.1.4'],
    },
    {
      reportingCategoryId: 'reading-informational-text',
      reportingCategoryLabel: 'Reading Informational Text',
      weight: '25–35%',
      benchmarks: ['ELA.3.R.2.1', 'ELA.3.R.2.2', 'ELA.3.R.2.3', 'ELA.3.R.2.4'],
    },
    {
      reportingCategoryId: 'reading-across-genres-vocabulary',
      reportingCategoryLabel: 'Reading Across Genres & Vocabulary',
      weight: '35–50%',
      benchmarks: ['ELA.3.R.3.1', 'ELA.3.R.3.2', 'ELA.3.R.3.3', 'ELA.3.V.1.2', 'ELA.3.V.1.3'],
    },
  ],
  '4': [
    {
      reportingCategoryId: 'reading-prose-poetry',
      reportingCategoryLabel: 'Reading Prose and Poetry',
      weight: '25–35%',
      benchmarks: ['ELA.4.R.1.1', 'ELA.4.R.1.2', 'ELA.4.R.1.3', 'ELA.4.R.1.4'],
    },
    {
      reportingCategoryId: 'reading-informational-text',
      reportingCategoryLabel: 'Reading Informational Text',
      weight: '25–35%',
      benchmarks: ['ELA.4.R.2.1', 'ELA.4.R.2.2', 'ELA.4.R.2.3', 'ELA.4.R.2.4'],
    },
    {
      reportingCategoryId: 'reading-across-genres-vocabulary',
      reportingCategoryLabel: 'Reading Across Genres & Vocabulary',
      weight: '35–50%',
      benchmarks: ['ELA.4.R.3.1', 'ELA.4.R.3.2', 'ELA.4.R.3.3', 'ELA.4.V.1.2', 'ELA.4.V.1.3'],
    },
  ],
  '5': [
    {
      reportingCategoryId: 'reading-prose-poetry',
      reportingCategoryLabel: 'Reading Prose and Poetry',
      weight: '25–35%',
      benchmarks: ['ELA.5.R.1.1', 'ELA.5.R.1.2', 'ELA.5.R.1.3', 'ELA.5.R.1.4'],
    },
    {
      reportingCategoryId: 'reading-informational-text',
      reportingCategoryLabel: 'Reading Informational Text',
      weight: '25–35%',
      benchmarks: ['ELA.5.R.2.1', 'ELA.5.R.2.2', 'ELA.5.R.2.3', 'ELA.5.R.2.4'],
    },
    {
      reportingCategoryId: 'reading-across-genres-vocabulary',
      reportingCategoryLabel: 'Reading Across Genres & Vocabulary',
      weight: '35–50%',
      benchmarks: ['ELA.5.R.3.1', 'ELA.5.R.3.2', 'ELA.5.R.3.3', 'ELA.5.V.1.2', 'ELA.5.V.1.3'],
    },
  ],
};

export interface ReportingCategoryGuidance {
  belowExpectations: {
    whatResultsMean: string[];
    nextSteps: string[];
  };
  atNearExpectations: {
    whatResultsMean: string[];
    nextSteps: string[];
  };
  aboveExpectations: {
    whatResultsMean: string[];
    nextSteps: string[];
  };
}

export const REPORTING_CATEGORY_STATEMENTS: Record<
  FastAssessedGrade,
  Record<
    'reading-prose-poetry' | 'reading-informational-text' | 'reading-across-genres-vocabulary',
    ReportingCategoryGuidance
  >
> = {
  '3': {
    'reading-prose-poetry': {
      belowExpectations: {
        whatResultsMean: [
          'Answer questions about a character’s feelings, personality, motivations, and/or actions.',
          'Identify simple details about the theme (message/big idea) of a story.',
          'Answer simple questions about a character’s perspective (thoughts, feelings, and reactions about what is happening) in a story.',
          'Identify a feature of one type of poem (free verse, rhymed verse, haiku, or limerick).',
        ],
        nextSteps: [
          'Retell the story and talk about how the characters’ thoughts, feelings, and/or actions are important to the story.',
          'Talk about the story’s message/big idea using some stated details from the story.',
          'Talk about how different characters feel, think, or react.',
        ],
      },
      atNearExpectations: {
        whatResultsMean: [
          'Explain how a character thinks, feels, and/or acts in response to a particular event.',
          'Explain some details about the story’s theme (message/big idea).',
          'Explain multiple characters’ perspectives throughout a story.',
          'Identify features from different types of poems (free verse, rhymed verse, haiku, or limerick).',
        ],
        nextSteps: [
          'Explain how the characters’ thoughts, feelings, and/or actions relate to specific events from the story.',
          'Describe, using details from the story, the theme (message/big idea) that was learned.',
          'Explain multiple characters’ perspectives (thoughts, feelings, and reactions about what is happening).',
        ],
      },
      aboveExpectations: {
        whatResultsMean: [
          'Describe, using details from a story, how one or more characters develop throughout the plot by the way they think, feel, and act in response to particular events.',
          'Explain important details that help support a complex theme (message/big idea).',
          'Explain multiple characters’ perspectives in a complex story.',
          'Identify and explain different types of poems (free verse, rhymed verse, haiku, or limerick).',
        ],
        nextSteps: [
          'Explain how one or more characters develop throughout the plot by explaining traits, feelings, motivations, and responses to situations.',
          'Explain the theme and discuss how the theme is developed as the story progresses using specific examples.',
        ],
      },
    },
    'reading-informational-text': {
      belowExpectations: {
        whatResultsMean: [
          'Explain how simple text features such as titles, headings, captions, graphs, maps, glossaries, and/or illustrations add to the meaning of the text.',
          'Identify how text is organized (chronological, cause/effect, compare/contrast).',
          'Identify simple details about a clearly stated central idea (important idea).',
          'Identify why the author wrote about the topic and/or the author’s claim (major point) using a single detail.',
        ],
        nextSteps: [
          'Talk about how text features, such as captions and illustrations, add meaning to the text.',
          'Talk about the text structure (chronological, cause/effect, compare/contrast).',
          'Retell the central idea (important idea) and identify the author’s claim.',
        ],
      },
      atNearExpectations: {
        whatResultsMean: [
          'Explain how text features add to the meaning of the text.',
          'Identify text structure (chronological, cause/effect, compare/contrast).',
          'Identify important details that support a clearly stated central idea (important idea).',
          'Explain how the author develops the purpose of the text and identify/explain the claim.',
        ],
        nextSteps: [
          'Talk about how text features, such as headings, subheadings, and graphs, connect or add meaning to the text.',
          'Explain the central idea (important idea) of the text and details that support it.',
          'Identify how the author develops the purpose and claim using details from the text.',
        ],
      },
      aboveExpectations: {
        whatResultsMean: [
          'Explain how multiple text features add to the meaning of the text.',
          'Explain the text structure (chronological, cause/effect, compare/contrast).',
          'Explain details from the text that support a complex central idea (important idea).',
          'Explain how the author develops the purpose and uses evidence to support the claim.',
        ],
        nextSteps: [
          'Describe different text features, such as maps, graphs, and timelines, and why or how the features contribute to the text.',
          'Identify clearly stated and assumed details that support the complex central idea.',
        ],
      },
    },
    'reading-across-genres-vocabulary': {
      belowExpectations: {
        whatResultsMean: [
          'Identify simple figurative language in a text.',
          'Summarize a simple story or informational text including some details.',
          'Answer questions about how two authors present information on the same topic or theme.',
          'Use word parts (affixes and common Greek/Latin roots) and simple context clues to determine unknown words.',
        ],
        nextSteps: [
          'Talk about how metaphors, personification, and hyperbole are used to help the reader understand the text.',
          'Retell a story or informational text using details and compare details presented in two texts.',
          'Talk about the parts of an unknown word and clues in the sentence.',
        ],
      },
      atNearExpectations: {
        whatResultsMean: [
          'Identify and explain figurative language in a text.',
          'Summarize a story or informational text to include important details such as central idea, theme, or storyline.',
          'Compare how different authors present information on the same topic or theme.',
          'Identify and apply word parts, context clues, synonyms, and antonyms to determine unknown word meanings.',
        ],
        nextSteps: [
          'Explain how metaphors, personification, and hyperbole add meaning to the text.',
          'Use details to provide a summary including storyline/theme or central idea/relevant details.',
          'Explain similarities and differences between two sources on the same theme or topic.',
        ],
      },
      aboveExpectations: {
        whatResultsMean: [
          'Identify and explain complex figurative language in a text.',
          'Summarize a text to include essential details to enhance understanding.',
          'Compare and contrast how different authors present information on the same topic or theme in complex texts.',
          'Apply word parts and multiple context-clue strategies to determine complex and unfamiliar words.',
        ],
        nextSteps: [
          'Explain how metaphors, personification, and hyperbole add meaning and why the author uses them.',
          'Explain how similarities and differences between two texts contribute to overall understanding.',
        ],
      },
    },
  },
  '4': {
    'reading-prose-poetry': {
      belowExpectations: {
        whatResultsMean: [
          'Answer questions regarding how characters, settings, events, and/or conflict that are explicitly stated add to a story.',
          'Identify a stated theme (message/big idea) of a story.',
          'Identify the narrator and the narrator’s perspective in a story.',
          'Identify rhyme and structure (organization) in a poem.',
        ],
        nextSteps: [
          'Talk about how characters’ traits, thoughts, feelings, actions, setting, events, and conflict are important to the story.',
          'Talk about the stated theme and find details from the story about the theme.',
        ],
      },
      atNearExpectations: {
        whatResultsMean: [
          'Explain how clearly stated and implied details about characters, settings, events, and/or conflict contribute to the storyline.',
          'Explain a clearly stated theme (message/big idea) and details that support the theme.',
          'Identify the narrator and narrator’s point of view, and explain the difference between point of view and a character’s perspective.',
          'Explain how rhyme and structure add to the meaning of a poem.',
        ],
        nextSteps: [
          'Explain how setting, events, conflict, and/or character development impact the story.',
          'Use details from the story to explain how the theme develops throughout the story.',
          'Identify narrator’s point of view and contrast it with a character’s perspective.',
        ],
      },
      aboveExpectations: {
        whatResultsMean: [
          'Explain how clearly stated and implied details about characters, settings, events, and/or conflict contribute to the storyline.',
          'Explain a clearly stated and/or implied theme and important details that support the theme.',
          'Identify narrator’s point of view and explain the difference between point of view and character perspective.',
          'Explain how rhyme and structure create the meaning of a poem.',
        ],
        nextSteps: [
          'Explain how and why setting, events, conflict, and/or character development impact the story.',
          'Explain how the author uses details from the story to develop point of view and character perspective.',
        ],
      },
    },
    'reading-informational-text': {
      belowExpectations: {
        whatResultsMean: [
          'Explain how simple text features add meaning to the text.',
          'Identify how text is organized (chronological order, comparison, cause and effect, problem/solution, sequence, and description).',
          'Identify relevant details to support a clearly stated central idea (important idea).',
          'Identify the author’s perspective and a clearly stated claim with evidence.',
        ],
        nextSteps: [
          'Talk about how text features and signal words help organize and clarify the text.',
          'Talk about the central idea and which details helped identify it.',
        ],
      },
      atNearExpectations: {
        whatResultsMean: [
          'Explain how text features add to the meaning of the text.',
          'Identify text structure (chronological order, comparison, cause and effect, problem/solution, sequence, and description).',
          'Explain how important details support the clearly stated central idea (important idea).',
          'Explain the author’s perspective and a clearly stated claim with evidence and/or reasons.',
        ],
        nextSteps: [
          'Explain how text features help the reader gain greater understanding of the presented topic.',
          'Explain a stated or implied central idea and how relevant details support it.',
          'Explain the author’s claim and the reasons and evidence used to support it.',
        ],
      },
      aboveExpectations: {
        whatResultsMean: [
          'Explain how text features and organization add to the meaning of the text.',
          'Explain how important details support the clearly stated or implied central idea.',
          'Explain the author’s perspective toward a complex topic using evidence and inferences.',
          'Explain an implied claim and how the author uses important evidence and reasons.',
        ],
        nextSteps: [
          'Describe how text features and text structure add to the meaning of the text.',
          'Explain the author’s implied claim and the relevant reasons and evidence that support it.',
        ],
      },
    },
    'reading-across-genres-vocabulary': {
      belowExpectations: {
        whatResultsMean: [
          'Explain how simple figurative language adds to the meaning of a text.',
          'Use some details to provide a simple summary of a text.',
          'Identify similarities and/or differences in primary (firsthand) and/or secondary (secondhand) accounts.',
          'Use word parts and simple context clues to determine unknown words.',
        ],
        nextSteps: [
          'Talk about how metaphors, similes, alliteration, personification, idiom, and hyperboles add meaning.',
          'Discuss similarities and differences between primary and secondary accounts of the same event.',
        ],
      },
      atNearExpectations: {
        whatResultsMean: [
          'Explain how figurative language adds to the meaning of a text.',
          'Summarize a story or informational text to include important relevant details such as central idea, theme, or storyline.',
          'Compare and contrast accounts of the same event using primary and/or secondary accounts.',
          'Identify and apply word parts, context clues, synonyms, and antonyms to determine word meaning.',
        ],
        nextSteps: [
          'Use details to provide a summary that includes plot/theme or central idea/relevant details.',
          'Compare and contrast two accounts of the same event using primary and secondary sources.',
          'Explain strategies used to determine the meaning of unknown words or phrases.',
        ],
      },
      aboveExpectations: {
        whatResultsMean: [
          'Explain how multiple uses of figurative language add to the meaning of a text.',
          'Summarize a text to include complex or implied relevant details to enhance understanding.',
          'Compare and contrast accounts by considering the importance of details in primary and/or secondary accounts.',
          'Apply word parts and multiple context-clue strategies for complex and unfamiliar words.',
        ],
        nextSteps: [
          'Explain how similarities and differences between two sources contribute to an overall understanding of the same event or topic.',
          'Apply knowledge of prefixes, suffixes, roots, and multiple strategies to complex vocabulary.',
        ],
      },
    },
  },
  '5': {
    'reading-prose-poetry': {
      belowExpectations: {
        whatResultsMean: [
          'Explain how clearly stated details about characters, settings, events, and/or conflict impact the plot.',
          'Identify details that help support a simple theme (message/big idea).',
          'Identify simple details the author uses to explain a main character’s perspective.',
          'Identify simple uses of figurative language and poetic elements (form, rhyme, meter, line breaks, and imagery).',
        ],
        nextSteps: [
          'Talk about how character perspective, settings, events, and conflicts are important to the story.',
          'Talk about how simple poetic elements help the reader understand what is being described.',
        ],
      },
      atNearExpectations: {
        whatResultsMean: [
          'Explain how clearly stated and implied details about characters, settings, events, and/or conflict impact the plot.',
          'Explain the development of a theme using details about the events and characters.',
          'Describe how the author uses details to explain a character’s perspective.',
          'Explain how simple uses of figurative language and poetic elements work together in a poem.',
        ],
        nextSteps: [
          'Explain how character perspective, settings, events, and/or conflicts impact the plot.',
          'Identify details that explain a character’s perspective and discuss why they are important.',
          'Explain how poetic elements and figurative language work together in a poem.',
        ],
      },
      aboveExpectations: {
        whatResultsMean: [
          'Analyze how characters, settings, events, and conflict contribute to the plot.',
          'Explain how the clearly stated or implied theme is supported throughout the plot.',
          'Describe how an author uses details to explain multiple characters’ perspectives.',
          'Analyze how figurative language and complex poetic elements work together in a poem.',
        ],
        nextSteps: [
          'Explain how and why character perspectives, settings, events, and conflicts affect the storyline.',
          'Explain the development of complex stated or implied themes present in the story.',
        ],
      },
    },
    'reading-informational-text': {
      belowExpectations: {
        whatResultsMean: [
          'Explain how a simple text structure or text feature adds to the meaning of a text.',
          'Identify relevant details that support a clearly stated central idea.',
          'Describe the author’s purpose or perspective.',
          'Track the development of a clearly stated argument and identify stated evidence for a claim.',
        ],
        nextSteps: [
          'Talk about how text organization and features help understand part of the text.',
          'Track the development of a simple argument and identify evidence supporting a specific claim.',
        ],
      },
      atNearExpectations: {
        whatResultsMean: [
          'Explain how a text structure and/or text features impact the overall meaning of a text.',
          'Explain how important details support the clearly stated central idea(s).',
          'Explain how the author develops the purpose and/or perspective.',
          'Track the development of a simple argument and identify a specific claim with clearly stated evidence and/or reasoning.',
        ],
        nextSteps: [
          'Explain how text organization and text features help the reader understand overall meaning.',
          'Track how a simple argument develops throughout the text using claims, evidence, and reasoning.',
        ],
      },
      aboveExpectations: {
        whatResultsMean: [
          'Explain how text structure and/or complex text features contribute to the overall meaning of a text.',
          'Explain how important details support clearly stated or implied central idea(s).',
          'Analyze how the author develops purpose and perspective.',
          'Track the development of a complex argument by identifying claims, evidence, and reasoning.',
        ],
        nextSteps: [
          'Explain how and why multiple text structures and features help understand overall meaning.',
          'Track the development of an argument and explain how evidence and reasoning support multiple claims.',
        ],
      },
    },
    'reading-across-genres-vocabulary': {
      belowExpectations: {
        whatResultsMean: [
          'Explain how figurative language adds to the meaning of the text(s).',
          'Use some details to provide a simple summary of a text.',
          'Compare and contrast simple primary and/or secondary sources related to the same topic.',
          'Use word parts and simple context clues to determine unfamiliar word meanings.',
        ],
        nextSteps: [
          'Talk about how figurative language adds meaning and which details belong in a summary.',
          'Talk about word parts and sentence clues to figure out unknown words.',
        ],
      },
      atNearExpectations: {
        whatResultsMean: [
          'Explain how figurative language adds to the meaning of the text(s).',
          'Summarize a text to include important relevant details such as central idea, theme, or storyline.',
          'Compare and contrast information from primary and/or secondary sources related to the same topic.',
          'Apply word parts (recognizing connections to parts of speech) and context clues to determine word meaning.',
        ],
        nextSteps: [
          'Explain similarities and differences between primary and secondary sources on the same topic.',
          'Explain how affixes change a word’s meaning and part of speech, and explain which context strategy was used.',
        ],
      },
      aboveExpectations: {
        whatResultsMean: [
          'Analyze how figurative language adds to implied meaning of the text(s).',
          'Summarize a text to include complex or implied details to enhance understanding.',
          'Compare and contrast primary and secondary sources and explain how they support the same topic.',
          'Apply knowledge of word parts, parts of speech, and multiple strategies to determine complex words and phrases.',
        ],
        nextSteps: [
          'Analyze how multiple instances of figurative language contribute to complex meaning.',
          'Explain how similarities and differences between primary and secondary sources build overall topic understanding.',
        ],
      },
    },
  },
};

export const APPENDIX_D_GREEK_LATIN_ROOTS_3_5 = [
  { root: 'ant, anti', meaning: 'against, opposite', examples: 'antonym, antifreeze' },
  { root: 'aqua', meaning: 'water', examples: 'aquarium, aquatic' },
  { root: 'aud', meaning: 'hear', examples: 'audience, audible' },
  { root: 'auto', meaning: 'self', examples: 'autograph, automatic' },
  { root: 'bio', meaning: 'life', examples: 'biography, biology' },
  { root: 'cent', meaning: 'one hundred', examples: 'century, percent' },
  { root: 'chron', meaning: 'time', examples: 'chronological, synchronize' },
  { root: 'cir, circum', meaning: 'around', examples: 'circumference, circulate' },
  { root: 'duc, duct', meaning: 'lead, make', examples: 'conduct, educate' },
  { root: 'form', meaning: 'shape', examples: 'transform, uniform' },
  { root: 'geo', meaning: 'earth', examples: 'geography, geology' },
  { root: 'graph', meaning: 'write', examples: 'autograph, paragraph' },
  { root: 'hetero', meaning: 'different', examples: 'heterogeneous' },
  { root: 'homo', meaning: 'same', examples: 'homophone, homograph' },
  { root: 'logy', meaning: 'study of', examples: 'biology, mythology' },
  { root: 'mal', meaning: 'bad, wretched', examples: 'malfunction, dismal' },
  { root: 'meter, metr', meaning: 'measure', examples: 'thermometer, perimeter' },
  { root: 'micro', meaning: 'small', examples: 'microscope, microphone' },
  { root: 'mono', meaning: 'one', examples: 'monologue, monotone' },
  { root: 'multi', meaning: 'many', examples: 'multiply, multipurpose' },
  { root: 'photo', meaning: 'light', examples: 'photograph, photosynthesis' },
  { root: 'port', meaning: 'carry', examples: 'transport, portable' },
  { root: 'scope', meaning: 'viewing instrument', examples: 'telescope, microscope' },
  { root: 'spect', meaning: 'look', examples: 'inspect, spectator' },
  { root: 'tele', meaning: 'far off', examples: 'telescope, telephone' },
  { root: 'vid, vis', meaning: 'see', examples: 'video, visible, vision' },
] as const;

export const OFFICIAL_TEXT_STRUCTURES = [
  {
    name: 'Description',
    definition: 'Provides characteristics, features, and examples to explain a topic.',
    gradeIntroduced: 'Grade 4 (Appendix B)',
  },
  {
    name: 'Problem and Solution',
    definition: 'Identifies a problem or challenge and explains one or more solutions.',
    gradeIntroduced: 'Grade 4 (Appendix B)',
  },
  {
    name: 'Chronological',
    definition: 'Presents events in the order in which they occurred in time.',
    gradeIntroduced: 'Grade 3 (Appendix B)',
  },
  {
    name: 'Compare and Contrast',
    definition: 'Examines similarities and differences between two or more subjects.',
    gradeIntroduced: 'Grade 3 (Appendix B)',
  },
  {
    name: 'Cause and Effect',
    definition: 'Explains why something happened (cause) and what happened as a result (effect).',
    gradeIntroduced: 'Grade 3 (Appendix B)',
  },
  {
    name: 'Sequence',
    definition: 'Presents steps in a process or ordered instructions.',
    gradeIntroduced: 'Grade 4 (Appendix B)',
  },
] as const;

export const ELEMENTARY_FIGURATIVE_LANGUAGE = [
  { term: 'Alliteration', definition: 'Repetition of initial consonant sounds in nearby words.' },
  { term: 'Hyperbole', definition: 'Deliberate exaggeration used for emphasis or effect.' },
  { term: 'Idiom', definition: 'An expression whose figurative meaning differs from its literal words.' },
  { term: 'Imagery', definition: 'Descriptive language that appeals to the five senses.' },
  { term: 'Metaphor', definition: 'A direct comparison between two unrelated things without using like or as.' },
  { term: 'Onomatopoeia', definition: 'Words whose sounds imitate the natural sound they name.' },
  { term: 'Personification', definition: 'Giving human traits, feelings, or actions to non-human objects or ideas.' },
  { term: 'Simile', definition: 'A comparison between two things using like or as.' },
] as const;

export const FAST_ITEM_TYPE_INFO: Record<
  FastItemType,
  {
    label: string;
    shortLabel: string;
    description: string;
    sourceCitation: string;
  }
> = {
  multiple_choice: {
    label: 'Multiple Choice',
    shortLabel: 'MC',
    description: 'Traditional single-select question with four options (A–D) and one correct answer.',
    sourceCitation: 'FAST ELA Reading Test Design Summary (June 2024), p. 10',
  },
  multiselect: {
    label: 'Multiselect',
    shortLabel: 'Multiselect',
    description:
      'Directs students to select a specific number of correct answers from among five or six options.',
    sourceCitation: 'FAST ELA Reading Test Design Summary (June 2024), p. 10',
  },
  ebsr: {
    label: 'Evidence-Based Selected Response (EBSR)',
    shortLabel: 'EBSR',
    description:
      'Two-part item: Part A asks the student to make an analysis or inference, and Part B requires selecting textual evidence to support Part A.',
    sourceCitation: 'FAST ELA Reading Test Design Summary (June 2024), p. 10',
  },
  hot_text: {
    label: 'Selectable Hot Text',
    shortLabel: 'Hot Text',
    description:
      'Presents excerpted sentences or phrases from the passage that highlight and can be clicked to select textual evidence.',
    sourceCitation: 'FAST ELA Reading Test Design Summary (June 2024), p. 10',
  },
  table_match: {
    label: 'Table Match',
    shortLabel: 'Table Match',
    description:
      'Presents options in columns and rows (e.g., Text 1 / Text 2 / Both, or Claim / Evidence) where students click a box to match row and column.',
    sourceCitation: 'FAST ELA Reading Test Design Summary (June 2024), p. 10',
  },
};

export const BENCHMARKS_BY_CODE: Record<string, FloridaBenchmark> = Object.fromEntries(
  FLORIDA_BENCHMARKS.map((b) => [b.code, b])
);

export const FOUNDATIONAL_STANDARDS_PROGRESSION = [
  {
    codeGroup: 'F.1.1 · Print Concepts',
    grades: 'Grades K–1 (PDF pp. 12, 27, 36)',
    summary:
      'K: Locate words, distinguish letters/words, match speech to print, book parts, left-to-right sweep, upper/lowercase letters. Grade 1: Locate title, table of contents, author/illustrator names, and glossary.',
  },
  {
    codeGroup: 'F.1.2 · Phonological Awareness',
    grades: 'Grades K–1 (PDF pp. 12, 27, 36)',
    summary:
      'Oral-only sound work. K: Syllables, rhyme/alliteration, onset-rime, initial/medial/final sounds, phoneme addition/deletion, CVC phoneme blending/segmenting. Grade 1: Digraphs, blends, trigraphs, 5+ phoneme words, and multi-syllable words.',
  },
  {
    codeGroup: 'F.1.3 · Phonics and Word Analysis',
    grades: 'Grades K–5 (PDF pp. 13, 28, 36, 44, 52, 61, 70)',
    summary:
      'K: Consonants, short/long vowels, CVC decode/encode. Gr 1: Digraphs, blends, r-controlled, final -e, vowel teams, inflections, 2-syllable. Gr 2: Variable vowel teams, diphthongs, open/closed/consonant-le, affixes, silent letters. Gr 3: Roots, derivational suffixes, multisyllabic. Gr 4–5: Syllable & morpheme-level decoding in and out of context.',
  },
  {
    codeGroup: 'F.1.4 · Fluency',
    grades: 'Grades K–5 (PDF pp. 13, 28, 37, 44, 52, 61, 70)',
    summary:
      'K: Recognize and read grade-level high-frequency words with automaticity. Grades 1–5: Read grade-level texts with accuracy, automaticity, and appropriate prosody or expression (Gr 1 includes grade-level sight words).',
  },
] as const;

export const K2_STAR_SCREENING_ROWS: Record<
  'K' | '1' | '2',
  {
    assessmentName: string;
    itemFormat: string;
    estimatedTime: string;
    keyDomains: string[];
    transitionRule: string;
  }
> = {
  K: {
    assessmentName: 'FAST Kindergarten — Renaissance Star Early Literacy',
    itemFormat: '27 computer-adaptive items (audio-supported) · Classroom oral/print warm-ups',
    estimatedTime: 'Approximately 10–15 minutes (PM1, PM2, PM3)',
    keyDomains: [
      'Print Concepts & Alphabet Knowledge (ELA.K.F.1.1)',
      'Phonological & Phonemic Awareness (ELA.K.F.1.2)',
      'Phonics / CVC Decoding & High-Frequency Words (ELA.K.F.1.3, ELA.K.F.1.4)',
      'Oral Comprehension & Vocabulary (ELA.K.R.*, ELA.K.V.1.*)',
    ],
    transitionRule:
      'Transitions to Star Reading upon achieving a Scaled Score of 852 (Probable Reader).',
  },
  '1': {
    assessmentName: 'FAST Grade 1 — Star Early Literacy / Star Reading',
    itemFormat: 'Star Early Literacy (27 adaptive items) → Star Reading (34 adaptive items)',
    estimatedTime: '10–20 minutes (PM1, PM2, PM3)',
    keyDomains: [
      'Book Print Features & Phonological Blending/Segmenting (ELA.1.F.1.1, ELA.1.F.1.2)',
      'Digraphs, Vowel Teams, r-Controlled Vowels & Fluency (ELA.1.F.1.3, ELA.1.F.1.4)',
      'Story Elements, Central Topic, Text Features & Vocabulary (ELA.1.R.*, ELA.1.V.1.*)',
    ],
    transitionRule:
      'Students begin PM1 in Star Early Literacy and automatically transition to Star Reading at Scaled Score 852.',
  },
  '2': {
    assessmentName: 'FAST Grade 2 — Renaissance Star Reading',
    itemFormat: '34 computer-adaptive items · Foundational + Reading Comprehension checks',
    estimatedTime: 'Approximately 15–20 minutes (PM1, PM2, PM3)',
    keyDomains: [
      'Multisyllabic / Syllable-Type Decoding & Connected Fluency (ELA.2.F.1.3, ELA.2.F.1.4)',
      'Plot, Theme, Perspectives & Rhyme Schemes (ELA.2.R.1.1–1.4)',
      'Central Idea, Author Purpose/Opinion & Vocabulary (ELA.2.R.2.*, ELA.2.V.1.*)',
    ],
    transitionRule:
      'Directly scaffolds Grade 3 B.E.S.T. Reading, Vocabulary, and Grammar expectations prior to FAST Reading Grade 3.',
  },
};

export function formatGradeLabel(grade: GradeLevel | 'K12' | 'ALL'): string {
  if (grade === 'K') return 'Kindergarten';
  if (grade === 'K12') return 'Grades K–12';
  if (grade === 'ALL') return 'All Grades (K–5)';
  return `Grade ${grade}`;
}

export function getBenchmarksForGrade(grade: GradeLevel | 'ALL'): FloridaBenchmark[] {
  if (grade === 'ALL') {
    return FLORIDA_BENCHMARKS;
  }
  return FLORIDA_BENCHMARKS.filter((b) => b.grade === grade || b.grade === 'K12');
}

export function getPriorKnowledgePrerequisite(
  benchmarkCode: string,
  targetGrade: GradeLevel
): FloridaBenchmark | undefined {
  if (targetGrade === 'K') {
    return undefined;
  }

  const prevGradeMap: Record<Exclude<GradeLevel, 'K'>, GradeLevel> = {
    '1': 'K',
    '2': '1',
    '3': '2',
    '4': '3',
    '5': '4',
  };
  const prevGrade = prevGradeMap[targetGrade];

  const explicitOverrides: Record<string, string> = {
    'ELA.1.R.1.2': 'ELA.K.R.1.1',
    'ELA.1.R.2.3': 'ELA.K.R.2.1',
    'ELA.3.C.1.4': 'ELA.2.R.2.2',
    'ELA.4.C.1.3': 'ELA.3.R.2.4',
    'ELA.5.C.1.4': 'ELA.4.R.2.2',
    'ELA.K12.EE.1.1': `ELA.${prevGrade}.R.2.2`,
    'ELA.K12.EE.2.1': `ELA.${prevGrade}.R.2.2`,
    'ELA.K12.EE.3.1': `ELA.${prevGrade}.R.1.1`,
    'ELA.K12.EE.5.1': `ELA.${prevGrade}.C.3.1`,
    'ELA.K12.EE.6.1':
      prevGrade === 'K' ? 'ELA.K.R.2.1' : prevGrade === '1' ? 'ELA.1.R.2.3' : `ELA.${prevGrade}.R.2.3`,
  };

  if (explicitOverrides[benchmarkCode]) {
    return BENCHMARKS_BY_CODE[explicitOverrides[benchmarkCode]];
  }

  const parts = benchmarkCode.split('.');
  if (
    parts.length >= 4 &&
    parts[0] === 'ELA' &&
    (parts[1] === '1' || parts[1] === '2' || parts[1] === '3' || parts[1] === '4' || parts[1] === '5')
  ) {
    const mappedGrade = prevGradeMap[parts[1]];
    const candidateCode = `ELA.${mappedGrade}.${parts.slice(2).join('.')}`;
    if (BENCHMARKS_BY_CODE[candidateCode]) {
      return BENCHMARKS_BY_CODE[candidateCode];
    }
  }

  return BENCHMARKS_BY_CODE[`ELA.${prevGrade}.R.2.2`];
}
