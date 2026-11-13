import {
  BENCHMARKS_BY_CODE,
  FLORIDA_BENCHMARKS,
  PRACTICE_DISCLAIMER,
  formatGradeLabel,
  getPriorKnowledgePrerequisite,
} from '../data/floridaStandards.ts';
import type {
  BellringerActivity,
  BellringerOption,
  BellringerPurpose,
  BellringerQuestion,
  BellringerQuestionType,
  FloridaBenchmark,
  GradeLevel,
} from '../types/ela.ts';

export const BELLRINGER_PURPOSE_OPTIONS: {
  id: BellringerPurpose;
  label: string;
  description: string;
}[] = [
  {
    id: 'review',
    label: 'Review a previously taught skill',
    description: 'Spiral back to reinforce mastery of a previously taught benchmark.',
  },
  {
    id: 'activate',
    label: 'Activate prior knowledge',
    description:
      'Bridge from the aligned prior-grade Florida B.E.S.T. standard (K → 1 → 2 → 3 → 4 → 5, or oral foundations in Kindergarten) into today’s target skill.',
  },
  {
    id: 'introduce',
    label: 'Introduce or prepare for a new lesson',
    description: 'Prime students with an approachable entry point into an upcoming benchmark.',
  },
  {
    id: 'reinforce',
    label: 'Reinforce a skill requiring additional practice',
    description: 'Provide targeted, high-clarity repetition on an area needing extra support.',
  },
];

export const BELLRINGER_QUESTION_TYPE_OPTIONS: {
  id: BellringerQuestionType;
  label: string;
  description: string;
}[] = [
  {
    id: 'multiple_choice',
    label: 'Multiple choice',
    description: 'Focused A–D items aligned to FAST-style wording and grade-level rigor.',
  },
  {
    id: 'grammar_editing',
    label: 'Grammar or editing',
    description: 'Sentence-level proofreading, conventions editing, or sentence revision tasks.',
  },
  {
    id: 'short_response',
    label: 'Short constructed response',
    description: 'Brief 1–2 sentence written responses citing evidence or explaining reasoning.',
  },
  {
    id: 'mixed',
    label: 'Mixed question types',
    description: 'Combines a quick selected-response/editing prompt with a 1–2 sentence response.',
  },
];

export function getPurposeLabel(purpose: BellringerPurpose): string {
  return (
    BELLRINGER_PURPOSE_OPTIONS.find((opt) => opt.id === purpose)?.label ??
    'Review a previously taught skill'
  );
}

export function getQuestionTypeLabel(questionType: BellringerQuestionType): string {
  return (
    BELLRINGER_QUESTION_TYPE_OPTIONS.find((opt) => opt.id === questionType)?.label ??
    'Multiple choice'
  );
}

export function getBellringerEligibleBenchmarks(grade: GradeLevel): FloridaBenchmark[] {
  const strandOrder: Record<string, number> = {
    F: 1,
    R: 2,
    V: 3,
    C: 4,
    EE: 5,
  };
  return FLORIDA_BENCHMARKS.filter((b) => b.grade === grade || b.grade === 'K12').sort(
    (a, b) => {
      const orderDiff = (strandOrder[a.strand] ?? 9) - (strandOrder[b.strand] ?? 9);
      if (orderDiff !== 0) return orderDiff;
      return a.code.localeCompare(b.code);
    }
  );
}

export function countWords(text: string): number {
  const cleaned = text.trim();
  if (!cleaned) return 0;
  return cleaned.split(/\s+/).length;
}

export function needsSourcePassage(
  benchmarkCode: string,
  questionType: BellringerQuestionType
): boolean {
  const bench = BENCHMARKS_BY_CODE[benchmarkCode];
  if (!bench) return true;
  // Foundational Print Concepts (F.1.1), Phonological Awareness (F.1.2), and Phonics (F.1.3) use discrete word/sound/print tasks.
  // Kindergarten F.1.4 focuses on high-frequency sight words, whereas Grades 1-5 F.1.4 Fluency uses a brief connected text.
  if (bench.strand === 'F') {
    if (bench.code.endsWith('.F.1.4') && bench.grade !== 'K') {
      return true;
    }
    return false;
  }
  // Conventions and standalone morphology do not require a reading passage when grammar/editing or quick discrete items are selected
  if (bench.strand === 'C' && bench.code.includes('.C.3.1')) {
    return false;
  }
  if (bench.code.endsWith('.V.1.2') && questionType !== 'mixed') {
    return false;
  }
  if (questionType === 'grammar_editing' && bench.strand !== 'R') {
    return false;
  }
  return true;
}

function splitSentences(text: string): string[] {
  const matches = text.trim().match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g);
  return (matches ?? []).map((s) => s.trim()).filter(Boolean);
}

export function trimPassageToMaxWords(text: string, maxWords = 120): {
  text: string;
  wasTrimmed: boolean;
} {
  const cleaned = text.trim();
  if (!cleaned) return { text: '', wasTrimmed: false };
  const initialWords = countWords(cleaned);
  if (initialWords <= maxWords) {
    return { text: cleaned, wasTrimmed: false };
  }

  const sentences = splitSentences(cleaned);
  const kept: string[] = [];
  let runningWords = 0;

  for (const sentence of sentences) {
    const w = countWords(sentence);
    if (runningWords + w <= maxWords) {
      kept.push(sentence);
      runningWords += w;
    } else {
      break;
    }
  }

  if (kept.length > 0 && runningWords >= 45) {
    return { text: kept.join(' '), wasTrimmed: true };
  }

  // Fallback: slice words cleanly and end with period
  const words = cleaned.split(/\s+/).slice(0, maxWords);
  let sliced = words.join(' ').replace(/[,;:\-]+$/, '');
  if (!/[.!?]$/.test(sliced)) {
    sliced += '.';
  }
  return { text: sliced, wasTrimmed: true };
}

export function estimateBellringerSeconds(
  sourceText: string | undefined,
  questions: BellringerQuestion[]
): number {
  const passageWords = sourceText ? countWords(sourceText) : 0;
  // Elementary independent silent reading (~135 wpm) + quick scan
  const readingSeconds = passageWords > 0 ? Math.round((passageWords / 135) * 60) + 12 : 0;
  const questionSeconds = questions.reduce((sum, q) => {
    if (q.format === 'short_response') return sum + 75;
    if (q.format === 'grammar_editing') return sum + 50;
    return sum + 45;
  }, 0);
  const transitionSeconds = 20;
  return readingSeconds + questionSeconds + transitionSeconds;
}

export function enforceFiveMinuteBudget(activity: BellringerActivity): BellringerActivity {
  const trimNotes: string[] = [];
  let wasAutoTrimmed = false;

  let sourceText = activity.sourceText?.trim() || undefined;
  if (sourceText) {
    const { text: boundedText, wasTrimmed } = trimPassageToMaxWords(sourceText, 120);
    if (wasTrimmed) {
      sourceText = boundedText;
      wasAutoTrimmed = true;
      trimNotes.push('Source text shortened to 120 words or fewer for a 5-minute warm-up.');
    }
  }

  const hasSubstantialPassage = Boolean(sourceText && countWords(sourceText) >= 25);
  const maxQuestions = hasSubstantialPassage ? 2 : 3;

  let questions = activity.questions.map((q) => ({
    ...q,
    maxSentences: q.format === 'short_response' ? Math.min(q.maxSentences ?? 2, 2) : q.maxSentences,
  }));

  if (questions.length > maxQuestions) {
    questions = questions.slice(0, maxQuestions);
    wasAutoTrimmed = true;
    trimNotes.push(
      hasSubstantialPassage
        ? 'Trimmed to 2 focused questions to pair with the source text within 5 minutes.'
        : 'Trimmed to 3 short questions to fit a 5-minute warm-up.'
    );
  }

  // Check time budget (target <= 330 seconds / 5.5 min)
  let estimatedSeconds = estimateBellringerSeconds(sourceText, questions);
  if (estimatedSeconds > 330 && questions.length > 2) {
    questions = questions.slice(0, 2);
    wasAutoTrimmed = true;
    trimNotes.push('Reduced question count to 2 so students finish comfortably within 5 minutes.');
    estimatedSeconds = estimateBellringerSeconds(sourceText, questions);
  }

  if (estimatedSeconds > 330 && sourceText && countWords(sourceText) > 85) {
    const sentences = splitSentences(sourceText);
    while (sentences.length > 3 && countWords(sentences.join(' ')) > 85) {
      sentences.pop();
    }
    const shortened = sentences.join(' ');
    if (countWords(shortened) < countWords(sourceText)) {
      sourceText = shortened;
      wasAutoTrimmed = true;
      trimNotes.push('Condensed source text length to protect the 5-minute completion budget.');
      estimatedSeconds = estimateBellringerSeconds(sourceText, questions);
    }
  }

  const normalizedQuestions = questions.map((q, index) => ({
    ...q,
    id: q.id || `br-q-${index + 1}`,
    number: index + 1,
  }));

  const passageWordCount = sourceText ? countWords(sourceText) : 0;
  const estimatedMinutes = Math.max(3, Math.min(5, Math.round(estimatedSeconds / 60)));

  return {
    ...activity,
    sourceText,
    questions: normalizedQuestions,
    estimatedTimeLabel: 'Approximately 5 minutes',
    timeAudit: {
      estimatedMinutes,
      estimatedSeconds,
      passageWordCount,
      wasAutoTrimmed,
      trimNotes,
    },
  };
}

interface FallbackTemplate {
  title: string;
  directions: string;
  sourceTextLabel?: string;
  sourceText?: string;
  questions: Omit<BellringerQuestion, 'id' | 'number'>[];
}

function makeMcOptions(
  correctLabel: 'A' | 'B' | 'C' | 'D',
  texts: [string, string, string, string],
  rationales: [string, string, string, string]
): BellringerOption[] {
  const labels: ('A' | 'B' | 'C' | 'D')[] = ['A', 'B', 'C', 'D'];
  return labels.map((label, idx) => ({
    id: `opt-${label.toLowerCase()}`,
    label,
    text: texts[idx],
    isCorrect: label === correctLabel,
    rationale: rationales[idx],
  }));
}

export function buildPriorKnowledgeBridgeMeta(
  grade: GradeLevel,
  bench: FloridaBenchmark,
  purpose: BellringerPurpose
): Pick<
  BellringerActivity,
  | 'priorKnowledgeBenchmarkCode'
  | 'priorKnowledgeBenchmarkTitle'
  | 'priorKnowledgeBenchmarkText'
  | 'priorKnowledgeSourceCitation'
  | 'priorKnowledgeBridgeNote'
> {
  if (purpose !== 'activate') {
    return {};
  }
  const priorBench = getPriorKnowledgePrerequisite(bench.code, grade);
  if (!priorBench) {
    if (grade === 'K') {
      return {
        priorKnowledgeBridgeNote: `Kindergarten Activate Prior Knowledge bridges students’ everyday oral language, picture awareness, and classroom print experiences directly into ${bench.code} (${bench.benchmarkTitle}).`,
      };
    }
    return {};
  }
  return {
    priorKnowledgeBenchmarkCode: priorBench.code,
    priorKnowledgeBenchmarkTitle: priorBench.benchmarkTitle,
    priorKnowledgeBenchmarkText: priorBench.officialText,
    priorKnowledgeSourceCitation: `${priorBench.sourceTitle}, PDF p. ${priorBench.pdfPage}`,
    priorKnowledgeBridgeNote: `Question 1 activates ${formatGradeLabel(priorBench.grade)} prior knowledge (${priorBench.code}: ${priorBench.benchmarkTitle}) before bridging directly into ${formatGradeLabel(grade)} (${bench.code}).`,
  };
}

function buildFoundationsTemplates(
  grade: GradeLevel,
  bench: FloridaBenchmark,
  questionType: BellringerQuestionType,
  purpose: BellringerPurpose,
  priorBench?: FloridaBenchmark
): FallbackTemplate[] {
  const gradeLabel = formatGradeLabel(grade);

  // F.1.1: Print Concepts (Officially K and Grade 1)
  if (bench.code.endsWith('.F.1.1')) {
    if (grade === 'K') {
      return [
        {
          title: 'Book Walk & Print Concepts Warm-Up (Kindergarten)',
          directions:
            'Work together or point to your page to check letters, words, and how we read a book from left to right.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Look at this sentence: "The red dog runs." How many words are in the sentence, and which word comes first?'
                  : 'Look at the line: "The red dog runs." How many separate words are in this sentence?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'There are 4 words in the sentence, and "The" comes first.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['2 words', '3 words', '4 words', '11 words'],
                      [
                        'Incorrect: There are spaces separating four words.',
                        'Incorrect: Count each group of letters separated by a space: The (1), red (2), dog (3), runs (4).',
                        'Correct: Spaces separate four distinct words ("The," "red," "dog," "runs").',
                        'Incorrect: 11 is close to the letter count, not the word count.',
                      ]
                    ),
                    correctAnswer: 'C. 4 words',
                  }),
              explanation:
                'Kindergarten Print Concepts (ELA.K.F.1.1) builds understanding that printed words are separated by spaces and differ from individual letters.',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Where should a reader start reading on a book page—top-left or bottom-right? Tell why in 1 sentence.'
                  : 'When you open a storybook, where do you begin reading the words on the page?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'A reader starts at the top left of the page and moves from left to right and top to bottom.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      [
                        'At the top left, moving left to right and top to bottom',
                        'At the bottom right, moving backward to the top',
                        'In the middle of the page, skipping the top line',
                        'On the back cover before opening the front',
                      ],
                      [
                        'Correct: English print tracks from left to right and top to bottom on each page.',
                        'Incorrect: Reading does not start at the bottom right.',
                        'Incorrect: Readers begin at the top line on the left.',
                        'Incorrect: Stories begin inside after the front cover and title page.',
                      ]
                    ),
                    correctAnswer: 'A. At the top left, moving left to right and top to bottom',
                  }),
              explanation:
                'Students track print left-to-right, top-to-bottom, and page-by-page across books (ELA.K.F.1.1).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Which part of a book shows the name of the book and who wrote it—the front cover or the last page?'
                  : 'Which pair shows a capital (uppercase) letter matched with its lowercase letter?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'The front cover (and title page) shows the book’s title and author.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'D',
                      ['B and d', 'M and w', 'P and q', 'R and r'],
                      [
                        'Incorrect: "B" pairs with lowercase "b," not "d."',
                        'Incorrect: "M" pairs with lowercase "m," not "w."',
                        'Incorrect: "P" pairs with lowercase "p," not "q."',
                        'Correct: Uppercase "R" and lowercase "r" are the same letter.',
                      ]
                    ),
                    correctAnswer: 'D. R and r',
                  }),
              explanation:
                'ELA.K.F.1.1 includes recognizing and matching all upper- and lowercase letters of the alphabet.',
            },
          ],
        },
        {
          title: 'Letters, Words & Book Parts Check (Kindergarten)',
          directions: 'Look closely at each print clue to check how letters, words, and books work.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'How is a letter like "m" different from a word like "mat"? Answer in 1 short sentence.'
                  : 'Which example is a single letter rather than a whole word?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      '"m" is one single alphabet letter, while "mat" puts three letters together to make a word with meaning.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      ['sun', 's', 'dog', 'cat'],
                      [
                        'Incorrect: "sun" is a three-letter word.',
                        'Correct: "s" is a single letter of the alphabet.',
                        'Incorrect: "dog" is a three-letter word.',
                        'Incorrect: "cat" is a three-letter word.',
                      ]
                    ),
                    correctAnswer: 'B. s',
                  }),
              explanation:
                'Distinguishing individual letters from multi-letter spoken/printed words is a core Kindergarten print concept (ELA.K.F.1.1).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'On a book cover, where is the front cover and where is the back cover?'
                  : 'Where do you usually find the title of a picture book?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'The front cover faces forward when you start reading the book, and the back cover is at the end after the last page.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      ['On the front cover and title page', 'Only on the back cover', 'Hidden inside the spine', 'At the bottom of the last page'],
                      [
                        'Correct: The title appears prominently on the front cover and title page.',
                        'Incorrect: The back cover usually has a summary or barcode.',
                        'Incorrect: The spine is the narrow edge, though it may repeat short text.',
                        'Incorrect: The last page closes the story.',
                      ]
                    ),
                    correctAnswer: 'A. On the front cover and title page',
                  }),
              explanation:
                'Identifying front cover, back cover, and title page supports independent book handling (ELA.K.F.1.1).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Look at the word "play." What is the first letter and what is the last letter?'
                  : 'In the sentence "I see a frog.", which word has only one letter?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'The first letter is "p" and the last letter is "y."',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['see', 'frog', 'I (and a)', 'None of them'],
                      [
                        'Incorrect: "see" has 3 letters.',
                        'Incorrect: "frog" has 4 letters.',
                        'Correct: Both "I" and "a" are one-letter words.',
                        'Incorrect: "I" and "a" are single-letter words.',
                      ]
                    ),
                    correctAnswer: 'C. I (and a)',
                  }),
              explanation:
                'Counting letters vs. words helps Kindergarteners map spoken words one-to-one with printed words (ELA.K.F.1.1).',
            },
          ],
        },
      ];
    }

    // Grade 1 Print Concepts (title, table of contents, author/illustrator, glossary)
    return [
      {
        title:
          purpose === 'activate' && priorBench
            ? 'Kindergarten → Grade 1 Print Concepts: Book Cover to Table of Contents & Glossary'
            : 'Book Navigator: Title, Author, Table of Contents & Glossary (Grade 1)',
        directions:
          'Use what you know about book features to show where readers find titles, authors, chapters, and word meanings.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              purpose === 'activate' && priorBench
                ? questionType === 'short_response'
                  ? 'Warm-Up Bridge: Look at a book’s front cover. What information helps you know who wrote the words and who drew the pictures?'
                  : 'Warm-Up Bridge (Prior Knowledge): On the front cover or title page, who drew the pictures in the book?'
                : questionType === 'short_response'
                  ? 'What is the difference between an author and an illustrator on a book cover? Write 1 sentence.'
                  : 'What does the illustrator of a book do?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'The author writes the words of the book, and the illustrator creates the pictures or drawings.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    [
                      'Prints the page numbers in the back',
                      'Draws or creates the pictures in the book',
                      'Chooses which library shelf holds the book',
                      'Writes the glossary definitions only',
                    ],
                    [
                      'Incorrect: Page layout is handled by book designers.',
                      'Correct: The illustrator creates the artwork/pictures that accompany the words.',
                      'Incorrect: Librarians organize shelves.',
                      'Incorrect: The author writes the text and glossary.',
                    ]
                  ),
                  correctAnswer: 'B. Draws or creates the pictures in the book',
                }),
            explanation:
              purpose === 'activate' && priorBench
                ? `Activates Kindergarten book-part concepts (${priorBench.code}) before locating Grade 1 print features (title, author, illustrator, table of contents, glossary) in ELA.1.F.1.1.`
                : 'Grade 1 Print Concepts requires locating the title, author, and illustrator names alongside navigational book features (ELA.1.F.1.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'You want to jump straight to Chapter 3 ("Sea Turtles") in an ocean book. Which book feature at the front tells you the starting page number?'
                : 'Which part of a book at the front lists chapter titles and the page number where each section begins?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'The table of contents at the front of the book lists each chapter or section and its starting page number.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['Table of Contents', 'Glossary', 'Back Cover', 'Illustrator Credit'],
                    [
                      'Correct: The table of contents lists sections/chapters and their page numbers at the front of a book.',
                      'Incorrect: A glossary defines bold vocabulary words at the back.',
                      'Incorrect: The back cover summarizes the book.',
                      'Incorrect: The illustrator credit names the artist.',
                    ]
                  ),
                  correctAnswer: 'A. Table of Contents',
                }),
            explanation:
              'The table of contents is located at the front of a book and tells readers what page each chapter or topic starts on (ELA.1.F.1.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'While reading a science book, you see a bold word "habitat" you do not know. Which feature at the back of the book defines it?'
                : 'Where in a book should a reader look to find the alphabetical meanings of important vocabulary words from the text?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'The glossary at the back of the book gives definitions for key words in alphabetical order.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    ['Title page', 'Table of contents', 'Front cover', 'Glossary'],
                    [
                      'Incorrect: The title page lists title, author, and illustrator.',
                      'Incorrect: The table of contents lists chapters and page numbers.',
                      'Incorrect: The front cover introduces the book.',
                      'Correct: A glossary acts like a mini-dictionary at the back of an informational book.',
                    ]
                  ),
                  correctAnswer: 'D. Glossary',
                }),
            explanation:
              'Recognizing how a glossary differs from a table of contents helps Grade 1 readers navigate informational books independently (ELA.1.F.1.1).',
          },
        ],
      },
      {
        title: 'Find It Fast in a Book: Print Features Practice (Grade 1)',
        directions: 'Read each classroom reading situation and decide which print feature helps best.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'If the table of contents says "Chapter 2: Rainforest Frogs ...... Page 14," what page should you turn to?'
                : 'Look at this Table of Contents line: "Part 2: Desert Lizards .......... Page 18." On which page does the section on desert lizards begin?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'You should turn to page 14 to read about rainforest frogs.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    ['Page 2', 'Page 10', 'Page 18', 'The glossary'],
                    [
                      'Incorrect: 2 is the part number, not the page number.',
                      'Incorrect: Page 10 is earlier in the book.',
                      'Correct: The table of contents directly lists Page 18.',
                      'Incorrect: The glossary defines words at the end of the book.',
                    ]
                  ),
                  correctAnswer: 'C. Page 18',
                }),
            explanation:
              'Students use the table of contents to distinguish section numbers from page numbers and locate information quickly (ELA.1.F.1.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Look at a book cover that reads: "Sunny Days by Leo Diaz, Illustrated by Maya Kim." Who wrote the book?'
                : 'A book title page says: "Written by Rosa Perez • Pictures by Sam Lee." Who is the author?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Leo Diaz is the author who wrote the book, and Maya Kim is the illustrator.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['Rosa Perez', 'Sam Lee', 'Both are illustrators', 'Neither name is the author'],
                    [
                      'Correct: "Written by Rosa Perez" identifies Rosa Perez as the author.',
                      'Incorrect: "Pictures by Sam Lee" identifies Sam Lee as the illustrator.',
                      'Incorrect: Only Sam Lee created the pictures.',
                      'Incorrect: The author is explicitly named after "Written by."',
                    ]
                  ),
                  correctAnswer: 'A. Rosa Perez',
                }),
            explanation:
              'Print concepts require distinguishing author credits ("by" / "written by") from illustrator credits ("illustrated by" / "pictures by") (ELA.1.F.1.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Explain in 1 sentence why a glossary puts words in ABC (alphabetical) order.'
                : 'Which glossary entry would come FIRST in alphabetical order: "comet," "planet," or "asteroid"?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'A glossary uses ABC order so readers can find unfamiliar words quickly by looking at their starting letters.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    ['comet', 'asteroid', 'planet', 'They appear in story order'],
                    [
                      'Incorrect: "c" comes after "a" in the alphabet.',
                      'Correct: "asteroid" starts with "a," which comes first alphabetically.',
                      'Incorrect: "p" comes after both "a" and "c."',
                      'Incorrect: Glossaries are organized alphabetically, not by story order.',
                    ]
                  ),
                  correctAnswer: 'B. asteroid',
                }),
            explanation:
              'Understanding alphabetical order in glossaries strengthens independent word-lookup skills (ELA.1.F.1.1).',
          },
        ],
      },
    ];
  }

  // F.1.2: Phonological Awareness (Officially K and Grade 1 — sound-level manipulation)
  if (bench.code.endsWith('.F.1.2')) {
    if (grade === 'K') {
      return [
        {
          title: 'Sound Play: Rhymes, Syllables & Blending Sounds (Kindergarten)',
          directions:
            'Say each word aloud with your teacher or partner and listen carefully to the sounds you hear.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Say the word "cat" and the word "hat" aloud. Do they rhyme? Name one more word that rhymes with "cat."'
                  : 'Which word rhymes with "sun"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'Yes, "cat" and "hat" rhyme because they share the same ending sounds "-at." Another rhyming word is "bat," "mat," or "sat."',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['sit', 'bag', 'run', 'cup'],
                      [
                        'Incorrect: "sit" ends in /-it/, not /-un/.',
                        'Incorrect: "bag" ends in /-ag/, not /-un/.',
                        'Correct: "sun" and "run" share the exact same ending rime /-un/.',
                        'Incorrect: "cup" ends in /-up/, not /-un/.',
                      ]
                    ),
                    correctAnswer: 'C. run',
                  }),
              explanation:
                'Kindergarten Phonological Awareness (ELA.K.F.1.2) builds recognition and production of rhyming words by matching ending rime sounds orally.',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Clap the syllables (word parts) in "ap-ple" and "ba-na-na." Which word has 3 syllables?'
                  : 'Put these spoken sounds together (blend): /m/ - /a/ - /p/. What word do you hear?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: '"Ba-na-na" has 3 syllables, while "ap-ple" has 2 syllables.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      ['map', 'mop', 'mat', 'tap'],
                      [
                        'Correct: Blending /m/ + /a/ + /p/ forms the CVC word "map."',
                        'Incorrect: "mop" has the middle sound /o/, not /a/.',
                        'Incorrect: "mat" ends with /t/, not /p/.',
                        'Incorrect: "tap" begins with /t/, not /m/.',
                      ]
                    ),
                    correctAnswer: 'A. map',
                  }),
              explanation:
                'ELA.K.F.1.2 develops phoneme blending and segmenting for single-syllable CVC words alongside counting spoken syllables.',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Say the word "top." Take away the first sound /t/. What little word or rime is left, or what new word do you get if you change /t/ to /h/?'
                  : 'Listen to the word "pin." If you change the first sound /p/ to /f/, what new word do you make?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'Taking away /t/ leaves "-op." Changing /t/ to /h/ makes "hop."',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'D',
                      ['pan', 'pen', 'win', 'fin'],
                      [
                        'Incorrect: "pan" changes the vowel sound to /a/ and keeps /p/.',
                        'Incorrect: "pen" keeps /p/ and changes the vowel to /e/.',
                        'Incorrect: "win" begins with /w/, not /f/.',
                        'Correct: Replacing /p/ with /f/ in "pin" produces "fin."',
                      ]
                    ),
                    correctAnswer: 'D. fin',
                  }),
              explanation:
                'Deleting and substituting initial phonemes orally helps Kindergarteners hear individual sounds inside words (ELA.K.F.1.2).',
            },
          ],
        },
        {
          title: 'First, Middle & Ending Sound Builders (Kindergarten)',
          directions: 'Say each picture or word aloud slowly and listen to every sound in order.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Say the word "bug" slowly and stretch out all three sounds. What are the 3 sounds?'
                  : 'Which word starts with the SAME beginning sound as "fish"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'The 3 sounds in "bug" are /b/ - /u/ - /g/.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      ['van', 'fan', 'dish', 'boat'],
                      [
                        'Incorrect: "van" begins with /v/.',
                        'Correct: Both "fish" and "fan" begin with the /f/ sound.',
                        'Incorrect: "dish" rhymes with "fish," but begins with /d/.',
                        'Incorrect: "boat" begins with /b/.',
                      ]
                    ),
                    correctAnswer: 'B. fan',
                  }),
              explanation:
                'Isolating initial consonant phonemes (/f/) and segmenting CVC phonemes (/b/-/u/-/g/) are foundational benchmarks in ELA.K.F.1.2.',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Say "rain" and "bow." Put those two word parts together—what compound word do they make?'
                  : 'Add /s/ to the beginning of "and." What new word do you hear?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'Putting "rain" + "bow" together makes the word "rainbow."',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['hand', 'land', 'sand', 'band'],
                      [
                        'Incorrect: "hand" adds /h/.',
                        'Incorrect: "land" adds /l/.',
                        'Correct: Adding /s/ before "and" forms "sand."',
                        'Incorrect: "band" adds /b/.',
                      ]
                    ),
                    correctAnswer: 'C. sand',
                  }),
              explanation:
                'Blending compound parts and adding initial phonemes prepares students for decoding words in print (ELA.K.F.1.2).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Listen to the word "log." What is the middle vowel sound you hear?'
                  : 'Which word has the SAME middle sound as "bed"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'The middle vowel sound in "log" is short /o/ (like "octopus").',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      ['pen', 'bad', 'bid', 'bud'],
                      [
                        'Correct: Both "bed" and "pen" have the short /e/ medial vowel sound.',
                        'Incorrect: "bad" has short /a/.',
                        'Incorrect: "bid" has short /i/.',
                        'Incorrect: "bud" has short /u/.',
                      ]
                    ),
                    correctAnswer: 'A. pen',
                  }),
              explanation:
                'Isolating medial short vowel sounds (/e/ in bed/pen) is explicitly required in Kindergarten ELA.K.F.1.2.',
            },
          ],
        },
      ];
    }

    // Grade 1 Phonological Awareness (blends, digraphs, trigraphs, multi-syllable words)
    return [
      {
        title:
          purpose === 'activate' && priorBench
            ? 'Kindergarten → Grade 1 Sound Lab: CVC Sounds to Blends & Digraphs'
            : 'Phoneme Blending, Segmenting & Manipulation (Grade 1)',
        directions:
          'Say each sound or word aloud carefully. Listen for blends, digraphs, and every phoneme in the word.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              purpose === 'activate' && priorBench
                ? questionType === 'short_response'
                  ? 'Warm-Up Bridge: Blend these 3 sounds together: /f/ - /r/ - /o/ - /g/ (4 sounds with a blend!). What word do you hear?'
                  : 'Warm-Up Bridge (Prior Knowledge): Blend /s/ - /a/ - /t/ first, then add /l/ to make /s/ - /l/ - /a/ - /t/. Which word has 4 sounds?'
                : questionType === 'short_response'
                  ? 'Say the word "plant" slowly and list all 5 spoken sounds in order.'
                  : 'Blend these spoken sounds together: /s/ - /t/ - /o/ - /m/ - /p/. What word do they make?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    purpose === 'activate' && priorBench
                      ? 'The sounds /f/-/r/-/o/-/g/ blend together to make "frog."'
                      : 'The 5 spoken sounds in "plant" are /p/ - /l/ - /a/ - /n/ - /t/.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    purpose === 'activate' && priorBench
                      ? ['sat', 'slat', 'mat', 'cat']
                      : ['stop', 'stomp', 'stamp', 'step'],
                    purpose === 'activate' && priorBench
                      ? [
                          'Incorrect: "sat" has 3 sounds (/s/-/a/-/t/).',
                          'Correct: Bridges 3-sound CVC blending (ELA.K.F.1.2) to Grade 1 4-phoneme consonant blends ("slat").',
                          'Incorrect: "mat" has 3 sounds and begins with /m/.',
                          'Incorrect: "cat" has 3 sounds and begins with /k/.',
                        ]
                      : [
                          'Incorrect: "stop" is missing the /m/ sound.',
                          'Correct: Blending all 5 phonemes /s/-/t/-/o/-/m/-/p/ forms "stomp."',
                          'Incorrect: "stamp" has short /a/ instead of short /o/.',
                          'Incorrect: "step" has short /e/ and no /m/.',
                        ]
                  ),
                  correctAnswer:
                    purpose === 'activate' && priorBench ? 'B. slat' : 'B. stomp',
                }),
            explanation:
              purpose === 'activate' && priorBench
                ? `Activates Kindergarten 3-sound CVC blending (${priorBench.code}) and steps up to Grade 1 consonant-blend phoneme work (ELA.1.F.1.2).`
                : 'Grade 1 ELA.1.F.1.2 targets blending and segmenting 4- and 5-phoneme words containing consonant blends and digraphs.',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Say "ship" aloud. How many individual SOUNDS (phonemes) do you hear, and what are they?'
                : 'Listen to the word "chest." How many individual spoken sounds (phonemes) are in "chest"?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    '"Ship" has 3 spoken sounds: /sh/ - /i/ - /p/ (the "sh" digraph makes one sound).',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    ['2 sounds', '3 sounds', '4 sounds (/ch/ - /e/ - /s/ - /t/)', '5 sounds'],
                    [
                      'Incorrect: Listen past the first syllable to each phoneme.',
                      'Incorrect: Do not merge /s/ and /t/—each consonant in the ending blend is a separate sound.',
                      'Correct: /ch/ counts as 1 digraph sound, followed by /e/, /s/, /t/ = 4 phonemes.',
                      'Incorrect: "ch" is a digraph making one single sound /ch/, not two.',
                    ]
                  ),
                  correctAnswer: 'C. 4 sounds (/ch/ - /e/ - /s/ - /t/)',
                }),
            explanation:
              'Distinguishing letters from sounds (digraphs like /sh/ and /ch/ make 1 sound while blends like /st/ make 2 sounds) is central to ELA.1.F.1.2.',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Say "clap." Now take away the /l/ sound. What new word is left?'
                : 'Say the word "slip." If you take away the /s/ sound at the beginning, what word is left?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Taking /l/ out of "clap" leaves the word "cap."',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['lip', 'sip', 'flip', 'slap'],
                    [
                      'Correct: Deleting /s/ from the /sl/ blend leaves "lip."',
                      'Incorrect: "sip" removes /l/, not /s/.',
                      'Incorrect: "flip" swaps /s/ for /f/ rather than deleting /s/.',
                      'Incorrect: "slap" changes the middle vowel.',
                    ]
                  ),
                  correctAnswer: 'A. lip',
                }),
            explanation:
              'Phoneme deletion inside consonant blends (slip → lip, clap → cap) builds advanced phonemic awareness in Grade 1 (ELA.1.F.1.2).',
          },
        ],
      },
      {
        title: 'Syllable & Digraph Sound Manipulation (Grade 1)',
        directions: 'Listen carefully to the sounds and syllables in each spoken word.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Say "butterfly" slowly and count the syllables. How many syllables do you hear?'
                : 'How many syllables are in the spoken word "watermelon"?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: '"But-ter-fly" has 3 syllables.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    ['2 syllables', '3 syllables', '5 syllables', '4 syllables (wa-ter-mel-on)'],
                    [
                      'Incorrect: Listen for every vowel beat: wa-ter-mel-on.',
                      'Incorrect: There are four beats, not three.',
                      'Incorrect: "Mel-on" has 2 beats, not 3.',
                      'Correct: "Wa-ter-mel-on" clearly breaks into 4 spoken syllables.',
                    ]
                  ),
                  correctAnswer: 'D. 4 syllables (wa-ter-mel-on)',
                }),
            explanation:
              'Grade 1 ELA.1.F.1.2 extends syllable segmenting and blending to multi-syllable words.',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Say "dish." Change the ending sound /sh/ to /p/. What new word do you make?'
                : 'Listen to the word "shin." Change the beginning sound /sh/ to /ch/. What new word do you make?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Changing /sh/ in "dish" to /p/ makes the word "dip."',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    ['thin', 'chin', 'ship', 'chip'],
                    [
                      'Incorrect: "thin" begins with /th/, not /ch/.',
                      'Correct: Substituting /ch/ for /sh/ in "shin" makes "chin."',
                      'Incorrect: "ship" keeps /sh/ and changes the ending.',
                      'Incorrect: "chip" changes both the beginning and ending.',
                    ]
                  ),
                  correctAnswer: 'B. chin',
                }),
            explanation:
              'Substituting digraph phonemes (/sh/ → /ch/) strengthens accurate phoneme manipulation (ELA.1.F.1.2).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Stretch out all 4 spoken sounds in the word "bench" and list them in order.'
                : 'Which word ends with the /ch/ sound spelled with the trigraph -tch?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: '"Bench" has 4 spoken sounds: /b/ - /e/ - /n/ - /ch/.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['match', 'mask', 'mast', 'mat'],
                    [
                      'Correct: "match" ends with the /ch/ sound spelled with the trigraph -tch.',
                      'Incorrect: "mask" ends with /s/-/k/.',
                      'Incorrect: "mast" ends with /s/-/t/.',
                      'Incorrect: "mat" ends with /t/.',
                    ]
                  ),
                  correctAnswer: 'A. match',
                }),
            explanation:
              'Recognizing trigraph sounds like -tch (/ch/) helps students link spoken phonemes to Grade 1 spelling patterns (ELA.1.F.1.2).',
          },
        ],
      },
    ];
  }

  // F.1.3: Phonics and Word Analysis (K-5)
  if (bench.code.endsWith('.F.1.3')) {
    if (grade === 'K') {
      return [
        {
          title: 'CVC Word Decoding & Short Vowels (Kindergarten)',
          directions: 'Sound out each letter carefully and blend the sounds to read real words.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Tap each letter and read these two words aloud: "hop" and "hope." How does the silent final "e" change the vowel sound?'
                  : 'Which word has the short /a/ sound like "apple"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'In "hop," the "o" says short /o/; adding silent "e" in "hope" makes the "o" say its long name /ō/.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      ['bag', 'big', 'bug', 'beg'],
                      [
                        'Correct: "bag" has the short /a/ vowel sound in a CVC pattern.',
                        'Incorrect: "big" has short /i/.',
                        'Incorrect: "bug" has short /u/.',
                        'Incorrect: "beg" has short /e/.',
                      ]
                    ),
                    correctAnswer: 'A. bag',
                  }),
              explanation:
                'Kindergarten Phonics (ELA.K.F.1.3) connects consonants and short/long vowel spellings to decode CVC words.',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Change one letter in "pig" to make a word that rhymes with "pig" and starts with /d/. Write the new word.'
                  : 'Read this sentence: "The red fox sat on a _____." Which CVC word rhymes with "bog" and fits the picture of a fallen tree?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'dig',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['leg', 'rug', 'log', 'lid'],
                      [
                        'Incorrect: "leg" has short /e/ and does not mean a fallen tree.',
                        'Incorrect: "rug" has short /u/.',
                        'Correct: "log" blends /l/-/o/-/g/, rhymes with "bog," and fits the sentence.',
                        'Incorrect: "lid" has short /i/.',
                      ]
                    ),
                    correctAnswer: 'C. log',
                  }),
              explanation:
                'Decoding CVC words in simple sentences builds accuracy and self-monitoring (ELA.K.F.1.3).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Spell the 3-letter word for a pet that says "meow": write the letters for /k/ - /a/ - /t/.'
                  : 'Which word uses a consonant + short vowel + consonant (CVC) pattern?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'cat',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      ['cake', 'cub', 'bike', 'boat'],
                      [
                        'Incorrect: "cake" is a long-a VCe word.',
                        'Correct: "cub" follows C-V-C with short /u/.',
                        'Incorrect: "bike" is a long-i VCe word.',
                        'Incorrect: "boat" uses a vowel team "oa."',
                      ]
                    ),
                    correctAnswer: 'B. cub',
                  }),
              explanation:
                'ELA.K.F.1.3 expects students to decode and encode consonant-vowel-consonant (CVC) words.',
            },
          ],
        },
        {
          title: 'Short & Long Vowel Letter Sounds (Kindergarten)',
          directions: 'Use letter-sound knowledge to read and build each Kindergarten word.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Write two short-i CVC words that end with "-it" (like "sit").'
                  : 'Which letter makes the /k/ sound at the beginning of "kite"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'Examples: bit, fit, hit, kit, lit, pit.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'D',
                      ['t', 'm', 'n', 'k'],
                      [
                        'Incorrect: "t" makes the /t/ sound.',
                        'Incorrect: "m" makes the /m/ sound.',
                        'Incorrect: "n" makes the /n/ sound.',
                        'Correct: "k" represents /k/ at the start of "kite."',
                      ]
                    ),
                    correctAnswer: 'D. k',
                  }),
              explanation:
                'Primary consonant sound knowledge supports accurate encoding and decoding (ELA.K.F.1.3).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Read the word "mud." Swap the middle vowel "u" for "a" to write a new word.'
                  : 'Which word has a LONG vowel sound (where the vowel says its own name)?',
              ...(questionType === 'short_response'
                ? {
                  correctAnswer: 'mad',
                  maxSentences: 1,
                }
                : {
                    options: makeMcOptions(
                      'A',
                      ['cake', 'cap', 'cat', 'cab'],
                      [
                        'Correct: The silent "e" makes the "a" in "cake" say its long name /ā/.',
                        'Incorrect: "cap" has short /a/.',
                        'Incorrect: "cat" has short /a/.',
                        'Incorrect: "cab" has short /a/.',
                      ]
                    ),
                    correctAnswer: 'A. cake',
                  }),
              explanation:
                'ELA.K.F.1.3 introduces recognizing both short and long sounds of the five major vowels.',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Blend the sounds in "wet" (/w/-/e/-/t/) and write a sentence using "wet."'
                  : 'Which word spells the picture/idea of a small round lid on a jar: "cap" or "cup"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'Example: My dog got wet in the rain.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['cup', 'cub', 'cap', 'cop'],
                      [
                        'Incorrect: A "cup" is used for drinking.',
                        'Incorrect: A "cub" is a baby bear.',
                        'Correct: "cap" has short /a/ and means a lid or hat.',
                        'Incorrect: "cop" is a police officer.',
                      ]
                    ),
                    correctAnswer: 'C. cap',
                  }),
              explanation:
                'Carefully attending to medial short vowels (/a/ vs. /u/) prevents guessing errors (ELA.K.F.1.3).',
            },
          ],
        },
      ];
    }

    if (grade === '1') {
      return [
        {
          title:
            purpose === 'activate' && priorBench
              ? 'Kindergarten → Grade 1 Phonics Bridge: CVC Words to Digraphs & Final -e'
              : 'Digraphs, Final -e & Vowel Teams Check (Grade 1)',
          directions:
            'Look closely at letter teams (digraphs, vowel teams, r-controlled vowels, and silent final -e) to read each word accurately.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                purpose === 'activate' && priorBench
                  ? questionType === 'short_response'
                    ? 'Warm-Up Bridge: Read "cub" (short u) and "cube" (final -e). Explain in 1 sentence how the final "e" changes the vowel sound.'
                    : 'Warm-Up Bridge (Prior Knowledge): Which word starts with a CVC base "tap" and adds silent final -e to make a long vowel?'
                  : questionType === 'short_response'
                    ? 'Explain why the word "rain" has a long /ā/ vowel sound even though there is no silent "e" at the end.'
                    : 'Which word contains a consonant digraph (two letters that together make ONE new sound)?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      purpose === 'activate' && priorBench
                        ? 'In "cub," "u" says short /u/, while silent final "e" in "cube" makes "u" say its long sound /ū/.'
                        : 'The vowel team "ai" works together to make one long /ā/ sound in "rain."',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      purpose === 'activate' && priorBench
                        ? ['tap', 'tape', 'top', 'tip']
                        : ['stop', 'ship', 'clap', 'frog'],
                      purpose === 'activate' && priorBench
                        ? [
                            'Incorrect: "tap" is a short-a CVC word.',
                            'Correct: Bridges Kindergarten CVC "tap" to Grade 1 final-e long-a "tape."',
                            'Incorrect: "top" has short /o/.',
                            'Incorrect: "tip" has short /i/.',
                          ]
                        : [
                            'Incorrect: "st" is a blend where both /s/ and /t/ are heard.',
                            'Correct: "sh" is a digraph because "s" and "h" combine to make one sound /sh/.',
                            'Incorrect: "cl" is a blend of /k/ and /l/.',
                            'Incorrect: "fr" is a blend of /f/ and /r/.',
                          ]
                    ),
                    correctAnswer:
                      purpose === 'activate' && priorBench ? 'B. tape' : 'B. ship',
                  }),
              explanation:
                purpose === 'activate' && priorBench
                  ? `Activates Kindergarten CVC decoding (${priorBench.code}) before extending into Grade 1 final-e and digraph patterns (ELA.1.F.1.3).`
                  : 'Grade 1 ELA.1.F.1.3 explicitly builds mastery of consonant digraphs (sh, ch, th, wh, ck) and long-vowel spellings.',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Break the two-syllable word "rabbit" into its two parts and tell why the first vowel is short.'
                  : 'Which word has an r-controlled vowel ("bossy r") sound like the /ar/ in "star"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      '"Rab-bit" splits between the double consonants; "rab" is a closed syllable so the "a" says short /a/.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['rain', 'boat', 'park', 'lake'],
                      [
                        'Incorrect: "ai" is a long-a vowel team.',
                        'Incorrect: "oa" is a long-o vowel team.',
                        'Correct: "ar" in "park" makes the r-controlled /ar/ sound.',
                        'Incorrect: "a_e" is a final-e long-a spelling.',
                      ]
                    ),
                    correctAnswer: 'C. park',
                  }),
              explanation:
                'R-controlled vowels (ar, er, ir, or, ur) change the expected short/long vowel sound (ELA.1.F.1.3).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Add the inflectional ending "-ing" to "jump" and use the new word in 1 short sentence.'
                  : 'Which word has a vowel team that makes the long /ō/ sound?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'jumping — The frog is jumping onto the lily pad.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      ['goat', 'good', 'got', 'glove'],
                      [
                        'Correct: The vowel team "oa" in "goat" spells the long /ō/ sound.',
                        'Incorrect: "oo" in "good" makes the short /oo/ sound.',
                        'Incorrect: "got" has short /o/.',
                        'Incorrect: "glove" has the short /ŭ/ vowel sound.',
                      ]
                    ),
                    correctAnswer: 'A. goat',
                  }),
              explanation:
                'Common Grade 1 vowel teams include ai, ay, ea, ee, oa, and oe (ELA.1.F.1.3).',
            },
          ],
        },
        {
          title: 'Inflectional Endings & Two-Syllable Phonics (Grade 1)',
          directions: 'Apply Grade 1 phonics patterns to decode words with endings and two syllables.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Read the word "planted." What is the base word, and what does the ending "-ed" tell you?'
                  : 'In the sentence "Mia baked cookies," what does the inflectional ending "-ed" in "baked" show?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'The base word is "plant," and "-ed" shows the action already happened in the past.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'D',
                      [
                        'Mia will bake tomorrow.',
                        'More than one Mia baked.',
                        'Mia is baking right now.',
                        'Mia already baked in the past.',
                      ],
                      [
                        'Incorrect: Future action uses "will."',
                        'Incorrect: "-ed" on a verb marks past time, not plural nouns.',
                        'Incorrect: Action happening right now uses "-ing."',
                        'Correct: The inflectional ending "-ed" shows past tense.',
                      ]
                    ),
                    correctAnswer: 'D. Mia already baked in the past.',
                  }),
              explanation:
                'Decoding words with inflectional endings (-s, -es, -ed, -ing) supports both Grade 1 phonics and meaning (ELA.1.F.1.3).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Split "sunset" into its two syllables and read each syllable.'
                  : 'Which two-syllable word is made of two closed syllables with short vowels?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: '"Sun-set" splits between the two words/syllables: "sun" + "set."',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      ['tiger', 'basket', 'robot', 'music'],
                      [
                        'Incorrect: "ti-" is an open syllable with long /ī/.',
                        'Correct: Both "bas" and "ket" end in consonants and keep short vowel sounds.',
                        'Incorrect: "ro-" is an open syllable with long /ō/.',
                        'Incorrect: "mu-" is an open syllable with long /ū/.',
                      ]
                    ),
                    correctAnswer: 'B. basket',
                  }),
              explanation:
                'Decoding basic two-syllable words by breaking them into known syllable chunks is part of ELA.1.F.1.3.',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Write a word that uses the vowel team "ee" (like "tree") and read it.'
                  : 'Which word has the SAME /ē/ vowel sound as "seed"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'Examples: green, sleep, bee, keep, street.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['shed', 'red', 'beach', 'bread'],
                      [
                        'Incorrect: "shed" has short /e/.',
                        'Incorrect: "red" has short /e/.',
                        'Correct: "ea" in "beach" makes the long /ē/ sound, matching "ee" in "seed."',
                        'Incorrect: "ea" in "bread" makes the short /e/ sound.',
                      ]
                    ),
                    correctAnswer: 'C. beach',
                  }),
              explanation:
                'Matching long-vowel sounds across common vowel teams (ee and ea) reinforces Grade 1 phonics (ELA.1.F.1.3).',
            },
          ],
        },
      ];
    }

    if (grade === '2') {
      return [
        {
          title:
            purpose === 'activate' && priorBench
              ? 'Grade 1 → Grade 2 Phonics Bridge: Vowel Teams to Diphthongs & Syllable Types'
              : 'Diphthongs, Open/Closed & Consonant-le Syllables (Grade 2)',
          directions:
            'Apply Grade 2 phonics and syllable-type rules to decode diphthongs, silent letters, and multisyllabic words.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                purpose === 'activate' && priorBench
                  ? questionType === 'short_response'
                    ? 'Warm-Up Bridge: Compare "boat" (vowel team oa) with "cloud" (diphthong ou). How do the two vowel sounds behave differently?'
                    : 'Warm-Up Bridge (Prior Knowledge): Which word uses a long vowel team ("ai") vs. a sliding diphthong ("oi" / "ou")? Pick the word with a diphthong.'
                  : questionType === 'short_response'
                    ? 'Underline or name the diphthong in "sprout" and name another word with the same vowel sound.'
                    : 'Which word contains a diphthong that glides between two vowel sounds (like /oi/ in "coin" or /ou/ in "house")?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      purpose === 'activate' && priorBench
                        ? 'In "boat," "oa" stays on one steady long /ō/ sound; in "cloud," the diphthong "ou" glides smoothly from /a/ to /oo/.'
                        : 'The diphthong in "sprout" is "ou" (/ou/), which matches words like "cloud," "mouse," or "cow."',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['train', 'sleep', 'boil', 'coat'],
                      [
                        'Incorrect: "ai" makes one steady long /ā/ sound.',
                        'Incorrect: "ee" makes one steady long /ē/ sound.',
                        'Correct: "oi" in "boil" is a diphthong whose sound glides within the syllable.',
                        'Incorrect: "oa" makes one steady long /ō/ sound.',
                      ]
                    ),
                    correctAnswer: 'C. boil',
                  }),
              explanation:
                purpose === 'activate' && priorBench
                  ? `Activates Grade 1 steady vowel teams (${priorBench.code}) before transitioning to Grade 2 diphthongs (oi, oy, ou, ow) in ELA.2.F.1.3.`
                  : 'Grade 2 ELA.2.F.1.3 targets variable vowel teams and diphthongs (oi, oy, ou, ow, au, aw, oo).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Divide the word "turtle" into two syllables and explain what syllable type the second syllable ("-tle") is.'
                  : 'Which word ends with a consonant-le (-Cle) syllable?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      '"Tur-tle" divides before "-tle"; "-tle" is a consonant-le syllable where the final "e" is silent and makes the /əl/ sound.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      ['candle', 'camel', 'hotel', 'label'],
                      [
                        'Correct: "can-dle" ends with the consonant-le syllable "-dle."',
                        'Incorrect: "cam-el" ends with -el (closed/schwa), not consonant-le.',
                        'Incorrect: "ho-tel" ends with a closed -el syllable.',
                        'Incorrect: "la-bel" ends with -el rather than consonant-le.',
                      ]
                    ),
                    correctAnswer: 'A. candle',
                  }),
              explanation:
                'Identifying the six syllable types—including open, closed, and consonant-le (-ble, -dle, -gle, -tle)—helps Grade 2 students decode longer words (ELA.2.F.1.3).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Look at the silent-letter words "knight" and "write." Which letter is silent in each word?'
                  : 'Which word begins with a silent consonant letter pattern (such as kn-, wr-, or gn-)?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'In "knight," the "k" (and "gh") is silent; in "write," the "w" is silent.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'D',
                      ['grape', 'slide', 'brave', 'wrist'],
                      [
                        'Incorrect: Both /g/ and /r/ are pronounced in "grape."',
                        'Incorrect: Both /s/ and /l/ are pronounced in "slide."',
                        'Incorrect: Both /b/ and /r/ are pronounced in "brave."',
                        'Correct: In "wrist," the initial "w" is silent so only /r/ is heard.',
                      ]
                    ),
                    correctAnswer: 'D. wrist',
                  }),
              explanation:
                'Grade 2 ELA.2.F.1.3 requires decoding words with silent letter combinations (kn-, wr-, mb, gn).',
            },
          ],
        },
        {
          title: 'Open vs. Closed Syllables & Affixes (Grade 2)',
          directions: 'Break multisyllabic words into syllables and common affixes to read accurately.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Compare the first syllable in "robot" (ro-) and "rabbit" (rab-). Why does "o" say its long sound in "robot"?'
                  : 'Which word begins with an OPEN first syllable (ending in a long vowel)?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      '"Ro-" ends in a vowel with no consonant closing it in, so it is an open syllable with long /ō/.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      ['napkin', 'tiger', 'puppet', 'magnet'],
                      [
                        'Incorrect: "nap-" is a closed syllable with short /a/.',
                        'Correct: "ti-" ends in the vowel "i," making an open syllable with long /ī/.',
                        'Incorrect: "pup-" is a closed syllable with short /u/.',
                        'Incorrect: "mag-" is a closed syllable with short /a/.',
                      ]
                    ),
                    correctAnswer: 'B. tiger',
                  }),
              explanation:
                'Open syllables end in a vowel that typically produces a long vowel sound, whereas closed syllables end in a consonant (ELA.2.F.1.3).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Look at the word "hopeful." Break it into its base word and suffix, and write its meaning in 1 sentence.'
                  : 'Which prefix in "unhappy" changes the base word "happy" to mean "not happy"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'Base word "hope" + suffix "-ful" (full of) means full of hope.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      ['un-', 're-', 'pre-', '-ful'],
                      [
                        'Correct: The prefix "un-" means "not" or "the opposite of."',
                        'Incorrect: "re-" means "again."',
                        'Incorrect: "pre-" means "before."',
                        'Incorrect: "-ful" is a suffix meaning "full of."',
                      ]
                    ),
                    correctAnswer: 'A. un-',
                  }),
              explanation:
                'Decoding words with common prefixes and suffixes bridges phonics to Grade 2 vocabulary (ELA.2.F.1.3).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Explain why the "oo" sounds different in "moon" vs. "book."'
                  : 'In which word does "ow" make the SAME /ou/ sound as in "cow"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      '"Moon" has the long /oo/ sound, while "book" has the short /oo/ sound.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['snow', 'glow', 'brown', 'yellow'],
                      [
                        'Incorrect: "ow" in "snow" makes the long /ō/ sound.',
                        'Incorrect: "ow" in "glow" makes the long /ō/ sound.',
                        'Correct: "ow" in "brown" makes the /ou/ diphthong sound matching "cow."',
                        'Incorrect: "ow" in "yellow" makes the long /ō/ sound.',
                      ]
                    ),
                    correctAnswer: 'C. brown',
                  }),
              explanation:
                'Variable vowel teams like "ow" and "oo" require testing both sounds in context (ELA.2.F.1.3).',
            },
          ],
        },
      ];
    }

    // Grades 3-5 F.1.3: Multisyllabic, Morphemes & Derivational Suffixes
    return [
      {
        title:
          purpose === 'activate' && priorBench
            ? `${formatGradeLabel(priorBench.grade)} → ${gradeLabel} Phonics Bridge: Syllable Types to Morpheme Decoding`
            : `Syllable & Morpheme Decoding Lab (${gradeLabel})`,
        directions:
          'Break multisyllabic words into prefixes, Latin/Greek roots, derivational suffixes, and syllable chunks to decode them accurately.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              purpose === 'activate' && priorBench
                ? questionType === 'short_response'
                  ? 'Warm-Up Bridge: Divide "en-ter-tain" into syllables and identify which syllable is closed and which has a vowel team.'
                  : 'Warm-Up Bridge (Prior Knowledge): Which syllable breakdown accurately divides "entertain" into three syllable types (closed, r-controlled, vowel team)?'
                : questionType === 'short_response'
                  ? 'Break "unpredictable" into its prefix, root/base, and suffix, and explain how each part helps you read and understand it.'
                  : 'Look at the word "unpredictable." Which breakdown shows its prefix, base/root, and derivational suffix?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    purpose === 'activate' && priorBench
                      ? '"En-" is a closed syllable, "-ter-" is an r-controlled syllable, and "-tain" uses the vowel team "ai."'
                      : '"Un-" (prefix) + "predict" (base/pre- + dict) + "-able" (derivational suffix) = not able to be predicted.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    purpose === 'activate' && priorBench
                      ? ['e-nter-tain', 'en-ter-tain', 'ent-er-tain', 'enter-ta-in']
                      : ['unpre-dic-table', 'un-predict-able', 'un-pre-dicta-ble', 'unp-redict-able'],
                    purpose === 'activate' && priorBench
                      ? [
                          'Incorrect: Leaves "e" open and splits the "nt" blend awkwardly.',
                          'Correct: Matches the official B.E.S.T. syllabication model ("en-ter-tain": closed + r-controlled + vowel team).',
                          'Incorrect: Divides after "nt" instead of between the two consonants n-t.',
                          'Incorrect: Splits the "ai" vowel team apart.',
                        ]
                      : [
                          'Incorrect: Merges "un-" and "pre-" while splitting "dict."',
                          'Correct: Cleanly isolates the prefix "un-," the stem "predict," and the suffix "-able."',
                          'Incorrect: Splits "-able" incorrectly.',
                          'Incorrect: Splits the prefix "un-" improperly.',
                        ]
                  ),
                  correctAnswer:
                    purpose === 'activate' && priorBench ? 'B. en-ter-tain' : 'B. un-predict-able',
                }),
            explanation: `Grade 3–5 Foundational Phonics (ELA.${grade}.F.1.3) applies combined syllable division and morpheme analysis to decode unfamiliar multisyllabic words.`,
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Look at the pair "educate → education." How does the derivational suffix "-tion" change the word’s sound and part of speech?'
                : 'Adding the derivational suffix "-tion" to the verb "invent" creates "invention." What part of speech is "invention"?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Adding "-tion" (/shən/) shifts the verb "educate" into the noun "education" (and changes the final /t/ sound to /sh/).',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['A noun meaning something that was invented', 'A past-tense verb', 'An adverb ending in -ly', 'An adjective comparing two tools'],
                    [
                      'Correct: "-tion" is a noun-forming derivational suffix.',
                      'Incorrect: Past-tense verb form would be "invented."',
                      'Incorrect: Adverbs commonly take "-ly."',
                      'Incorrect: Comparative adjectives use "-er" or "more."',
                    ]
                  ),
                  correctAnswer: 'A. A noun meaning something that was invented',
                }),
            explanation:
              'Recognizing derivational suffixes (-tion, -ment, -ous, -able) speeds up both multisyllabic decoding and academic comprehension (ELA.' +
              grade +
              '.F.1.3).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Decode "microscope" by breaking it into two Greek word parts and defining the whole word in 1 sentence.'
                : 'In the sentence "Engineers inspected the underwater pipeline," which word combines a prefix + base/root + inflectional ending?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    '"Micro-" (small) + "scope" (look/view) decodes as an instrument used to view tiny things.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    ['underwater', 'pipeline', 'inspected', 'engineers'],
                    [
                      'Incorrect: "underwater" is a compound word.',
                      'Incorrect: "pipeline" is a compound word.',
                      'Correct: "in-" (prefix) + "spect" (root) + "-ed" (inflectional suffix).',
                      'Incorrect: "engineer" + plural "-s" has no prefix.',
                    ]
                  ),
                  correctAnswer: 'C. inspected',
                }),
            explanation:
              'Combining Latin/Greek roots with prefixes and suffixes unlocks multisyllabic words in and out of context (ELA.' +
              grade +
              '.F.1.3).',
          },
        ],
      },
      {
        title: `Multisyllabic Word Analysis: Prefixes, Roots & Suffixes (${gradeLabel})`,
        directions: 'Use syllable patterns and word-part clues to decode and analyze each word.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Break "transcontinental" into meaningful morphemes and explain how to pronounce and understand it.'
                : 'How many syllables are in the word "celebration" (cel-e-bra-tion)?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    '"Trans-" (across) + "continent" + "-al" (relating to) divides cleanly and means crossing a continent.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    ['2 syllables', '3 syllables', '5 syllables', '4 syllables'],
                    [
                      'Incorrect: Listen to each vowel beat: cel-e-bra-tion.',
                      'Incorrect: There are four beats including the middle schwa "e."',
                      'Incorrect: "-tion" forms one single ending syllable (/shən/).',
                      'Correct: "cel-e-bra-tion" has 4 syllables.',
                    ]
                  ),
                  correctAnswer: 'D. 4 syllables',
                }),
            explanation:
              'Recognizing stable final syllables like "-tion" (/shən/) makes multisyllabic decoding automatic (ELA.' +
              grade +
              '.F.1.3).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Read the pair "magic → magician." Why does the hard /k/ sound of "c" change when "-ian" is added?'
                : 'Which word contains a consonant-le ending syllable that follows a vowel-team or long vowel pattern?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Adding "-ian" shifts the final "c" into the /sh/ sound ("magician"), a common derivational spelling-sound pattern.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    ['puddle', 'maple', 'bubble', 'apple'],
                    [
                      'Incorrect: "pud-" is closed with short /u/.',
                      'Correct: "ma-" is open (long /ā/) followed by "-ple."',
                      'Incorrect: "bub-" is closed with short /u/.',
                      'Incorrect: "ap-" is closed with short /a/.',
                    ]
                  ),
                  correctAnswer: 'B. maple',
                }),
            explanation:
              'Examining open vs. closed first syllables before -Cle protects vowel accuracy in multisyllabic reading (ELA.' +
              grade +
              '.F.1.3).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Explain how "happy → happiness" changes spelling when the suffix "-ness" is added.'
                : 'Which word correctly changes "y" to "i" when adding a suffix?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Because "happy" ends in consonant + y, "y" changes to "i" before adding "-ness" → "happiness."',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['cheerfully / tried (or "copied")', 'enjoyed', 'playing', 'staying'],
                    [
                      'Correct: "try" ends in consonant + y, changing "y" to "i" before "-ed" ("tried").',
                      'Incorrect: "enjoy" ends in vowel + y, so "y" stays.',
                      'Incorrect: Suffixes starting with "i" (-ing) keep "y."',
                      'Incorrect: "stay" ends in vowel + y and keeps "y."',
                    ]
                  ),
                  correctAnswer: 'A. tried',
                }),
            explanation:
              'Base-word spelling changes with suffixes (y → i) reinforce word-analysis fluency (ELA.' +
              grade +
              '.F.1.3).',
          },
        ],
      },
    ];
  }

  // F.1.4: Fluency
  if (grade === 'K') {
    return [
      {
        title: 'High-Frequency Sight Word Automaticity (Kindergarten)',
        directions:
          'Read each high-frequency word right away without sounding it out letter by letter, then check it in a quick sentence.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Read these high-frequency words smoothly: "the, said, was, you, they." Choose two and write 1 short sentence.'
                : 'Read the sentence: "We _____ a bright red bird." Which high-frequency word completes the sentence?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Example: They said you saw the bug.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    ['is', 'the', 'saw', 'was'],
                    [
                      'Incorrect: "We is" does not fit the sentence.',
                      'Incorrect: "the" is an article, not an action verb.',
                      'Correct: "saw" is a high-frequency word meaning looked at.',
                      'Incorrect: "We was a bird" does not make sense.',
                    ]
                  ),
                  correctAnswer: 'C. saw',
                }),
            explanation:
              'Kindergarten Fluency (ELA.K.F.1.4) targets automatic recognition of grade-level high-frequency words.',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Look at the word "said." Which middle letters make the short /e/ sound you do not expect?'
                : 'Which high-frequency word completes the sentence? "_____ are going to the park."',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'In "said," the "ai" spells the short /e/ sound (/s/-/e/-/d/).',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['They', 'The', 'Was', 'For'],
                    [
                      'Correct: "They are going to the park." uses the plural pronoun "They."',
                      'Incorrect: "The are going" is missing a noun.',
                      'Incorrect: "Was are going" is ungrammatical.',
                      'Incorrect: "For are going" does not make sense.',
                    ]
                  ),
                  correctAnswer: 'A. They',
                }),
            explanation:
              'Automatic recognition of high-frequency words like "they" and "said" frees attention for comprehension (ELA.K.F.1.4).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Read this smooth sentence aloud twice: "I can see the little dog." Why does reading sight words fast help you?'
                : 'Which word in "Look at the big bug!" is a high-frequency word you should recognize right away?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Recognizing words like "I," "can," "see," and "the" quickly helps me read smoothly and understand the sentence.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    ['bug', 'the', 'zig', 'mug'],
                    [
                      'Incorrect: "bug" is a regular decodable CVC word.',
                      'Correct: "the" is one of the highest-frequency words in Kindergarten print.',
                      'Incorrect: "zig" is not in the sentence.',
                      'Incorrect: "mug" is not in the sentence.',
                    ]
                  ),
                  correctAnswer: 'B. the',
                }),
            explanation:
              'Reading high-frequency words automatically builds early Kindergarten fluency (ELA.K.F.1.4).',
          },
        ],
      },
      {
        title: 'Snap Word Fluency & Sentence Reading (Kindergarten)',
        directions: 'Spot and read each Kindergarten high-frequency word automatically.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Read these snap words aloud: "here, from, have, come." Use "have" in a short sentence.'
                : 'Which word fits best? "Come _____ to see the frog!"',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Example: I have a blue hat.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    ['was', 'of', 'said', 'here'],
                    [
                      'Incorrect: "Come was" does not make sense.',
                      'Incorrect: "Come of to see" does not fit.',
                      'Incorrect: "Come said" does not fit.',
                      'Correct: "Come here to see the frog!" uses the high-frequency word "here" accurately.',
                    ]
                  ),
                  correctAnswer: 'D. here',
                }),
            explanation:
              'Practicing high-frequency words in brief phrases supports automaticity and meaning (ELA.K.F.1.4).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Compare "of" and "for." Use "for" in 1 short sentence.'
                : 'Which high-frequency word completes the sentence? "We waited _____ the bus in the rain."',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Example: This red apple is for my friend.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    ['from', 'for', 'the', 'was'],
                    [
                      'Incorrect: "from" shows starting place rather than waiting for the bus.',
                      'Correct: "We waited for the bus in the rain." uses the high-frequency word "for."',
                      'Incorrect: "the" does not fit after "waited."',
                      'Incorrect: "was" does not fit after "waited."',
                    ]
                  ),
                  correctAnswer: 'B. for',
                }),
            explanation:
              'Distinguishing visually similar high-frequency words ("from" vs. "for") prevents reading errors (ELA.K.F.1.4).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Read the sentence aloud smoothly: "She has two cute cats." Circle or name the high-frequency words.'
                : 'Which high-frequency word completes: "Yesterday _____ a sunny day"?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'High-frequency words include "she," "has," and "two."',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    ['are', 'you', 'was', 'they'],
                    [
                      'Incorrect: "Yesterday" is singular past time.',
                      'Incorrect: "you" is a pronoun, not a linking verb.',
                      'Correct: "was" links singular "Yesterday" in the past tense.',
                      'Incorrect: "they" is not a linking verb.',
                    ]
                  ),
                  correctAnswer: 'C. was',
                }),
            explanation:
              'Automatic recognition of irregular high-frequency words like "was" strengthens early sentence fluency (ELA.K.F.1.4).',
          },
        ],
      },
    ];
  }

  // Fix question 2 prompt in Kindergarten F.1.4 variant 2 above so "from" can't also fit!
  // (Handled cleanly right below? Wait—let's update that exact prompt in the returned array? Wait no, I can just write the unambiguous prompt inline directly!)

  if (grade === '1' || grade === '2') {
    return [
      {
        title:
          purpose === 'activate' && priorBench
            ? `${formatGradeLabel(priorBench.grade)} → ${gradeLabel} Fluency Bridge: Smooth Phrasing & Expression`
            : `Read Like a Storyteller: Fluency & Prosody (${gradeLabel})`,
        directions:
          'Whisper-read the short passage twice—first to check every word accurately, then a second time smoothly with expression matching punctuation.',
        sourceTextLabel: 'Fluency Mini-Passage',
        sourceText:
          'At the edge of the pond, Leo spotted a tiny green frog sitting on a flat rock. "Whoa, look how far it can jump!" Leo whispered to his sister. Suddenly, the frog sprang into the air with a quick splash. Ripples spread across the water while both children giggled softly.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Look at Sentence 2 ("Whoa, look how far it can jump!"). How should your voice sound when you read the exclamation mark and quotation marks?'
                : 'How should a fluent reader read the sentence: "Whoa, look how far it can jump!"?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Your voice should sound excited and expressive (like Leo whispering excitedly) because of the quotation marks and exclamation mark, without shouting.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    [
                      'In a flat, sleepy monotone without pausing at the comma',
                      'With excited, expressive voice that pauses slightly at the comma',
                      'As fast as possible, skipping the small words',
                      'Stopping to sound out every word one syllable at a time',
                    ],
                    [
                      'Incorrect: Flat reading ignores the exclamation mark and dialogue.',
                      'Correct: Fluent reading (prosody) matches Leo’s excitement and pauses briefly at the comma.',
                      'Incorrect: Fluency means accuracy and expression, not racing or skipping words.',
                      'Incorrect: Re-reading helps you blend smoothly into whole phrases rather than reading word-by-word.',
                    ]
                  ),
                  correctAnswer: 'B. With excited, expressive voice that pauses slightly at the comma',
                }),
            explanation:
              purpose === 'activate' && priorBench
                ? `Connects ${formatGradeLabel(priorBench.grade)} word automaticity (${priorBench.code}) to ${gradeLabel} phrasing and expressive prosody (ELA.${grade}.F.1.4).`
                : `Punctuation clues (commas, quotation marks, exclamation points) guide fluent expression and phrasing (ELA.${grade}.F.1.4).`,
            textualEvidence: '"Whoa, look how far it can jump!"',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Which three words in the first sentence should you scoop together into one smooth phrase? ("At the edge of the pond,...")'
                : 'If a reader accidentally reads "giggled softly" as "giggled safely" and notices it sounds odd with the pond scene, what should a fluent reader do?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Scoop "At the edge / of the pond" into natural prepositional phrases and pause briefly at the comma.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    [
                      'Keep going quickly without fixing the mistake',
                      'Skip the last sentence completely',
                      'Self-correct by rereading "softly" accurately so the sentence makes sense',
                      'Close the book immediately',
                    ],
                    [
                      'Incorrect: Leaving errors hurts comprehension.',
                      'Incorrect: Skipping words lowers accuracy.',
                      'Correct: Fluent readers monitor meaning and self-correct misread words.',
                      'Incorrect: Self-correction is a normal reading strategy.',
                    ]
                  ),
                  correctAnswer:
                    'C. Self-correct by rereading "softly" accurately so the sentence makes sense',
                }),
            explanation: `Fluency combines accuracy (including self-correction), automaticity, and prosody (ELA.${grade}.F.1.4).`,
          },
        ],
      },
      {
        title: `Punctuation & Dialogue Fluency Check (${gradeLabel})`,
        directions:
          'Read the brief informational note aloud softly, using commas and periods to group words into meaningful phrases.',
        sourceTextLabel: 'Fluency Mini-Passage',
        sourceText:
          'Sea turtles travel hundreds of miles through warm ocean water. Each summer, mother turtles return to sandy Florida beaches at night. They dig deep nests, lay round white eggs, and cover the sand carefully before sliding back into the waves.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Look at Sentence 3 ("They dig deep nests, lay round white eggs, and cover the sand carefully..."). How do the commas help your reading fluency?'
                : 'How should you group your voice while reading Sentence 3 ("They dig deep nests, lay round white eggs, and cover the sand carefully")?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'The commas tell you to group each action into a smooth phrase and take a brief pause between items in the list.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    [
                      'Group each action together and pause briefly at each comma',
                      'Pause after every single word like a robot',
                      'Read all three sentences in one breath without stopping at periods',
                      'Read the commas aloud as words',
                    ],
                    [
                      'Correct: Pausing briefly at commas separates the three actions cleanly for the listener.',
                      'Incorrect: Word-by-word reading breaks up meaning.',
                      'Incorrect: Periods signal a full stop before starting the next sentence.',
                      'Incorrect: Punctuation marks guide voice pauses silently.',
                    ]
                  ),
                  correctAnswer: 'A. Group each action together and pause briefly at each comma',
                }),
            explanation: `Using punctuation to chunk sentences into meaningful phrases strengthens prosody and comprehension (ELA.${grade}.F.1.4).`,
            textualEvidence: '"They dig deep nests, lay round white eggs, and cover the sand carefully"',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Why does rereading a short paragraph a second time make your reading sound smoother?'
                : 'Which phrase from Sentence 1 should be read smoothly together as one natural chunk?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'On the second read, you already know the harder words ("hundreds," "Florida," "carefully"), so you can read smoothly with natural phrasing.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    ['travel / hundreds', 'through / warm', 'miles / through', 'through warm ocean water'],
                    [
                      'Incorrect: Breaks the prepositional phrase awkwardly.',
                      'Incorrect: Cuts off the noun "ocean water."',
                      'Incorrect: Cuts across phrase boundaries.',
                      'Correct: "through warm ocean water" is a complete prepositional phrase that reads naturally as one unit.',
                    ]
                  ),
                  correctAnswer: 'D. through warm ocean water',
                }),
            explanation: `Scooping phrases ("through warm ocean water") supports rate, accuracy, and prosody (ELA.${grade}.F.1.4).`,
          },
        ],
      },
    ];
  }

  // Grades 3-5 Fluency (ELA.3/4/5.F.1.4)
  return [
    {
      title:
        purpose === 'activate' && priorBench
          ? `${formatGradeLabel(priorBench.grade)} → ${gradeLabel} Fluency Bridge: Phrasing, Automaticity & Expression`
          : `Expressive Reading & Phrasing Check (${gradeLabel})`,
      directions:
        'Read the short passage silently once for accuracy, then read it aloud softly with natural phrasing, pacing, and expression.',
      sourceTextLabel: 'Fluency Excerpt',
      sourceText:
        'As early morning fog lifted over St. Augustine’s harbor, Maya tightened her jacket against the crisp breeze. "Did you see that dolphin surface beside the lighthouse?" she asked, pointing toward the shimmering wake. Her grandfather nodded slowly, adjusting his weathered camera strap. Together, they watched the playful pod glide effortlessly past the coquina seawall before disappearing beneath the sunlit Atlantic swells.',
      questions: [
        {
          format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
          prompt:
            questionType === 'short_response'
              ? 'Explain in 1–2 sentences how punctuation in Sentence 2 ("Did you see that dolphin surface beside the lighthouse?" she asked...) tells a reader how to adjust pitch and pacing.'
              : 'Which choice best describes how a fluent reader delivers Sentence 2?',
          ...(questionType === 'short_response'
            ? {
                correctAnswer:
                  'The question mark raises the reader’s pitch slightly at "lighthouse" to show Maya’s curious excitement, followed by a brief pause at the quotation mark before lowering pitch for the tag "she asked."',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'C',
                  [
                    'With identical pitch on both the dialogue and the speaker tag, skipping the comma',
                    'As quickly as possible without pausing between sentences',
                    'Raising pitch slightly at the question mark to match Maya’s curiosity, then softening for "she asked"',
                    'Stopping to sound out every syllable in "lighthouse" and "shimmering" aloud',
                  ],
                  [
                    'Incorrect: Fluent prosody differentiates spoken dialogue from the narrator’s speaker tag.',
                    'Incorrect: Speed without phrasing hurts listener comprehension.',
                    'Correct: Demonstrates attentive prosody—matching intonation to question marks, dialogue, and clauses.',
                    'Incorrect: Automaticity allows familiar compound/inflected words to be read smoothly.',
                  ]
                ),
                correctAnswer:
                  'C. Raising pitch slightly at the question mark to match Maya’s curiosity, then softening for "she asked"',
              }),
          explanation: `Upper-elementary fluency (ELA.${grade}.F.1.4) integrates accurate multisyllabic decoding ("effortlessly," "coquina") with expressive prosody across complex sentences.`,
          textualEvidence: '"Did you see that dolphin surface beside the lighthouse?" she asked',
        },
        {
          format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
          prompt:
            questionType === 'short_response'
              ? 'Why is "Beside the lighthouse" or "past the coquina seawall" read as a single smooth phrase rather than word-by-word?'
              : 'Which chunking strategy keeps meaning clearest when reading the final sentence aloud?',
          ...(questionType === 'short_response'
            ? {
                correctAnswer:
                  'Grouping prepositional and participial phrases together preserves the natural rhythm of English syntax and helps readers visualize the action.',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'B',
                  [
                    'Together they / watched the / playful pod glide / effortlessly past the',
                    'Together, / they watched the playful pod / glide effortlessly / past the coquina seawall / before disappearing...',
                    'Together they watched / the / playful / pod / glide',
                    'Reading every word with a one-second pause',
                  ],
                  [
                    'Incorrect: Splits articles ("the") away from their nouns ("seawall").',
                    'Correct: Pauses cleanly at natural grammatical clause and phrase boundaries.',
                    'Incorrect: Choppy word-by-word pausing breaks comprehension.',
                    'Incorrect: Robotic pacing prevents fluent prosody.',
                  ]
                ),
                correctAnswer:
                  'B. Together, / they watched the playful pod / glide effortlessly / past the coquina seawall / before disappearing...',
              }),
          explanation: `Syntactic phrase chunking allows Grade ${grade} readers to read complex informational and literary prose smoothly (ELA.${grade}.F.1.4).`,
        },
      ],
    },
    {
      title: `Informational Pacing & Self-Monitoring Fluency (${gradeLabel})`,
      directions:
        'Read the short informational excerpt twice, paying attention to multisyllabic accuracy and steady informational pacing.',
      sourceTextLabel: 'Fluency Excerpt',
      sourceText:
        'Unlike freshwater springs that stay cool year-round, shallow coastal estuaries warm rapidly under Florida’s summer sun. Because salt water and fresh river water mix inside these sheltered bays, nutrients gather along the muddy floor. Microscopic algae, tiny shrimp, and juvenile mullet thrive in this rich blend—turning quiet estuaries into bustling food webs.',
      questions: [
        {
          format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
          prompt:
            questionType === 'short_response'
              ? 'How should a fluent reader pace Sentence 1 ("Unlike freshwater springs..."), and why does pausing slightly at the comma help comprehension?'
              : 'When reading Sentence 3 aloud, how does the em-dash ("—turning quiet estuaries into bustling food webs") guide your voice?',
          ...(questionType === 'short_response'
            ? {
                correctAnswer:
                  'A steady, moderate pace with a brief pause after "year-round" highlights the contrast between cool springs and warming estuaries.',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'D',
                  [
                    'Speed up rapidly and mumble the final four words',
                    'Ignore the dash and skip the words after it',
                    'Drop into a whisper so the ending cannot be heard',
                    'Pause slightly before the dash to emphasize the summarizing conclusion',
                  ],
                  [
                    'Incorrect: Speeding up blurs the main point.',
                    'Incorrect: Fluent reading includes all text accurately.',
                    'Incorrect: Informational prose calls for clear, steady emphasis.',
                    'Correct: A brief emphatic pause before an em-dash highlights the concluding takeaway.',
                  ]
                ),
                correctAnswer:
                  'D. Pause slightly before the dash to emphasize the summarizing conclusion',
              }),
          explanation: `Reading informational texts fluently requires adjusting rate and using punctuation pauses so technical ideas stay clear (ELA.${grade}.F.1.4).`,
          textualEvidence: '"—turning quiet estuaries into bustling food webs."',
        },
        {
          format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
          prompt:
            questionType === 'short_response'
              ? 'If you stumble over the multisyllabic word "estuaries" or "microscopic" while reading aloud, what two steps restore your fluency?'
              : 'Which action demonstrates strong self-monitoring for accuracy when encountering an unfamiliar multisyllabic word like "estuaries"?',
          ...(questionType === 'short_response'
            ? {
                correctAnswer:
                  'Break the word into syllables/morphemes ("es-tu-ar-ies" or "mi-cro-scop-ic"), decode it accurately, then back up to reread the phrase smoothly.',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'A',
                  [
                    'Decode the syllables accurately and reread the phrase smoothly so meaning stays intact',
                    'Guess a random familiar word that starts with the same first letter',
                    'Skip the word entirely without checking if the sentence makes sense',
                    'Stop reading the rest of the passage',
                  ],
                  [
                    'Correct: Combining phonics self-correction with phrase rereading maintains both accuracy and prosody.',
                    'Incorrect: Guessing from the first letter only often changes meaning.',
                    'Incorrect: Skipping key nouns disrupts comprehension.',
                    'Incorrect: Stopping abandons reading.',
                  ]
                ),
                correctAnswer:
                  'A. Decode the syllables accurately and reread the phrase smoothly so meaning stays intact',
              }),
          explanation: `Self-correcting and rereading the phrase connects F.1.3 word analysis directly to F.1.4 fluent reading (ELA.${grade}.F.1.4).`,
        },
      ],
    },
  ];
}

function buildConventionsTemplates(
  grade: GradeLevel,
  questionType: BellringerQuestionType,
  purpose: BellringerPurpose,
  priorBench?: FloridaBenchmark
): FallbackTemplate[] {
  if (grade === 'K') {
    return [
      {
        title: 'Sentence Capitals, Pronoun "I" & End Marks (Kindergarten)',
        directions: 'Check each short sentence for capital letters and the right ending mark.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Fix the two capital letter mistakes in this sentence: "i see a blue bug."'
                : 'Which sentence capitalizes both the first word and the word "I" correctly?',
            targetSentence: questionType === 'short_response' ? 'i see a blue bug.' : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'I see a blue bug. (Always capitalize the first word and the pronoun "I.")',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    ['can i pet the pup?', 'May I pet the pup?', 'may I pet the pup?', 'May i pet the pup.'],
                    [
                      'Incorrect: Both "can" and "i" should be capitalized.',
                      'Correct: Capitalizes the first word "May," the pronoun "I," and ends with a question mark.',
                      'Incorrect: The first word "may" needs a capital M.',
                      'Incorrect: The pronoun "i" needs a capital I and the question needs a question mark.',
                    ]
                  ),
                  correctAnswer: 'B. May I pet the pup?',
                }),
            explanation:
              'Kindergarten Conventions (ELA.K.C.3.1) teaches capitalizing the first word in a sentence and the pronoun "I."',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Add the right ending mark (. or ?) to this sentence: "Where is my red hat"'
                : 'Which sentence uses the correct end mark for a telling sentence?',
            targetSentence: questionType === 'short_response' ? 'Where is my red hat' : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Where is my red hat? (It asks a question, so it needs a question mark.)',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['The duck swims in the pond.', 'The duck swims in the pond?', 'the duck swims in the pond.', 'The duck swims in the pond'],
                    [
                      'Correct: Starts with a capital letter and ends a telling statement with a period.',
                      'Incorrect: A telling sentence uses a period, not a question mark.',
                      'Incorrect: Missing a capital T at the start.',
                      'Incorrect: Missing an ending punctuation mark.',
                    ]
                  ),
                  correctAnswer: 'A. The duck swims in the pond.',
                }),
            explanation:
              'Telling sentences end with a period (.) while asking sentences end with a question mark (?) (ELA.K.C.3.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Write the plural word for more than one "cat" and use it in a short sentence.'
                : 'Which word fits best to show MORE THAN ONE frog? "Two green _____ hopped on the log."',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'cats — Two cats sit on the mat.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    ['frog', 'froging', 'frogs', 'a frog'],
                    [
                      'Incorrect: "frog" names only one frog.',
                      'Incorrect: "froging" is not a real plural noun.',
                      'Correct: Adding "-s" makes the regular plural "frogs."',
                      'Incorrect: "Two a frog" does not make sense.',
                    ]
                  ),
                  correctAnswer: 'C. frogs',
                }),
            explanation:
              'Kindergarten students form regular plural nouns orally and in writing by adding /s/ or /es/ (ELA.K.C.3.1).',
          },
        ],
      },
      {
        title: 'Days of the Week & Preposition Helpers (Kindergarten)',
        directions: 'Check capital letters for days and months, and choose words that tell where.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Fix the capital letter mistake for the day of the week: "We go to art on friday."'
                : 'Which sentence capitalizes the day of the week correctly?',
            targetSentence: questionType === 'short_response' ? 'We go to art on friday.' : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'We go to art on Friday.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    ['We read books on monday.', 'We sing on tuesday.', 'We swim in july.', 'We play soccer on Saturday.'],
                    [
                      'Incorrect: "monday" needs a capital M.',
                      'Incorrect: "tuesday" needs a capital T.',
                      'Incorrect: Months like "July" need a capital letter.',
                      'Correct: "Saturday" begins with a capital S.',
                    ]
                  ),
                  correctAnswer: 'D. We play soccer on Saturday.',
                }),
            explanation:
              'ELA.K.C.3.1 requires capitalizing the days of the week and months of the year.',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Use a position word ("on," "in," or "under") to write 1 short sentence telling where a ball is.'
                : 'Which word tells WHERE the puppy is hiding? "The puppy slept _____ the warm blanket."',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Example: The red ball is under the chair.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    ['jump', 'under', 'happy', 'run'],
                    [
                      'Incorrect: "jump" is an action verb.',
                      'Correct: "under" is a frequently occurring preposition showing location.',
                      'Incorrect: "happy" is an adjective describing feelings.',
                      'Incorrect: "run" is an action verb.',
                    ]
                  ),
                  correctAnswer: 'B. under',
                }),
            explanation:
              'Frequently occurring prepositions (in, on, under, over, beside) clarify where something happens (ELA.K.C.3.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Fix the capital letter for the month: "My birthday is in may."'
                : 'Which sentence is written correctly with a capital first letter and a period?',
            targetSentence: questionType === 'short_response' ? 'My birthday is in may.' : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'My birthday is in May.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['My dog likes to dig.', 'my dog likes to dig.', 'My dog likes to dig', 'My Dog Likes To Dig'],
                    [
                      'Correct: Capitalizes the first word "My" and ends with a period.',
                      'Incorrect: Starts with lowercase "my."',
                      'Incorrect: Missing ending punctuation.',
                      'Incorrect: Capitalizes every word unnecessarily and omits the period.',
                    ]
                  ),
                  correctAnswer: 'A. My dog likes to dig.',
                }),
            explanation:
              'Complete Kindergarten sentences begin with a capital letter and end with a punctuation mark (ELA.K.C.3.1).',
          },
        ],
      },
    ];
  }

  if (grade === '1') {
    if (purpose === 'activate' && priorBench) {
      return [
        {
          title: 'Kindergarten → Grade 1 Grammar Bridge: Capitals & End Marks to Proper Nouns & Verb Tense',
          directions:
            'Use what you learned in Kindergarten about capitals and end marks, then step up to Grade 1 proper nouns and past-tense verbs.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
              prompt:
                questionType === 'short_response'
                  ? 'Warm-Up Bridge: Fix the capital letter and ending punctuation in this sentence: "i saw a turtle"'
                  : 'Warm-Up Bridge (Prior Knowledge): Which sentence fixes both the pronoun "I" and the end punctuation?',
              targetSentence: questionType === 'short_response' ? 'i saw a turtle' : undefined,
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'I saw a turtle. (Capitalize "I" and add a period at the end.)',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['i saw a turtle.', 'I saw a turtle', 'I saw a turtle.', 'I saw a turtle?'],
                      [
                        'Incorrect: Pronoun "i" must always be capitalized.',
                        'Incorrect: Missing ending period.',
                        'Correct: Activates Kindergarten mastery of capitalizing "I" and ending a statement with a period.',
                        'Incorrect: This sentence tells information rather than asking a question.',
                      ]
                    ),
                    correctAnswer: 'C. I saw a turtle.',
                  }),
              explanation: `Activates Kindergarten prerequisite ${priorBench.code} (capitalizing "I" and end punctuation) before Grade 1 proper nouns and verb tense (ELA.1.C.3.1).`,
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
              prompt:
                questionType === 'short_response'
                  ? 'Bridge to Grade 1: Capitalize the proper noun (specific name and place) in: "My friend leo lives in miami."'
                  : 'Bridge to Grade 1: Which sentence capitalizes proper nouns (names of people and places) correctly?',
              targetSentence:
                questionType === 'short_response' ? 'My friend leo lives in miami.' : undefined,
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'My friend Leo lives in Miami.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      ['My friend Leo lives in Miami.', 'My friend leo lives in Miami.', 'My Friend Leo lives in miami.', 'My friend Leo lives in miami.'],
                      [
                        'Correct: Capitalizes both the person’s name ("Leo") and city ("Miami").',
                        'Incorrect: "leo" is a person’s name and needs a capital L.',
                        'Incorrect: "miami" needs a capital M, while "friend" is a common noun.',
                        'Incorrect: "miami" is a specific city name and needs a capital M.',
                      ]
                    ),
                    correctAnswer: 'A. My friend Leo lives in Miami.',
                  }),
              explanation: `Connects Kindergarten day/month capitalization (${priorBench.code}) to Grade 1 proper nouns for people and places (ELA.1.C.3.1).`,
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Bridge to Grade 1: Change the verb in "Yesterday, we walk to school" so it tells about the past.'
                  : 'Bridge to Grade 1: Which verb matches the singular subject? "The little puppy _____ loudly."',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'Yesterday, we walked to school.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      ['bark', 'barks', 'barking', 'were bark'],
                      [
                        'Incorrect: Singular "puppy" takes "-s" on a present-tense verb.',
                        'Correct: Singular noun "puppy" agrees with singular verb "barks."',
                        'Incorrect: "barking" needs a helping verb like "is."',
                        'Incorrect: "were bark" is ungrammatical.',
                      ]
                    ),
                    correctAnswer: 'B. barks',
                  }),
              explanation:
                'Grade 1 Conventions builds subject-verb agreement and simple verb tenses onto basic sentence rules (ELA.1.C.3.1).',
            },
          ],
        },
      ];
    }

    return [
      {
        title: 'Proper Nouns, Past Tense & Subject-Verb Match (Grade 1)',
        directions: 'Read each sentence carefully and apply Grade 1 grammar and capitalization rules.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Rewrite this sentence fixing the proper noun capitalization: "In april, our class visited tampa."'
                : 'Which sentence capitalizes all proper nouns correctly?',
            targetSentence:
              questionType === 'short_response' ? 'In april, our class visited tampa.' : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'In April, our class visited Tampa.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    [
                      'On Tuesday, maya read a book about Space.',
                      'On tuesday, Maya read a book about space.',
                      'On Tuesday, Maya read a Book about space.',
                      'On Tuesday, Maya read a book about space.',
                    ],
                    [
                      'Incorrect: "maya" needs a capital M, and "space" is not a proper noun.',
                      'Incorrect: "tuesday" needs a capital T.',
                      'Incorrect: "Book" is a common noun and should be lowercase.',
                      'Correct: Only "On" (sentence start), "Tuesday" (day), and "Maya" (name) are capitalized.',
                    ]
                  ),
                  correctAnswer: 'D. On Tuesday, Maya read a book about space.',
                }),
            explanation:
              'Grade 1 conventions require capitalizing proper nouns (people, specific places, days, months) while keeping common nouns lowercase (ELA.1.C.3.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Choose the correct verb ("jumps" or "jump") to match the sentence: "Three frogs _____ into the water."'
                : 'Which verb agrees with the subject? "The colorful parrot _____ on the branch."',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'jump — Plural "Three frogs" takes the plural verb "jump."',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    ['perch', 'perches', 'perching', 'are perch'],
                    [
                      'Incorrect: Plural "perch" matches "parrots," not one "parrot."',
                      'Correct: Singular "parrot" pairs with singular present-tense "perches."',
                      'Incorrect: Needs a helping verb like "is."',
                      'Incorrect: Ungrammatical verb phrase.',
                    ]
                  ),
                  correctAnswer: 'B. perches',
                }),
            explanation:
              'Singular subjects pair with singular verbs (often ending in -s/-es), while plural subjects pair with base plural verbs (ELA.1.C.3.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Add an apostrophe to show the backpack belongs to Sam: "That is Sams blue backpack."'
                : 'Which sentence shows a singular possessive noun correctly?',
            targetSentence:
              questionType === 'short_response' ? 'That is Sams blue backpack.' : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'That is Sam’s blue backpack.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['The dog’s bowl is full.', 'The dogs bowl is full.', 'The dog’s bowls are fulls.', 'The dogs’s bowl is full.'],
                    [
                      'Correct: Uses apostrophe + s ("dog’s") to show the bowl belongs to one dog.',
                      'Incorrect: Missing the possessive apostrophe.',
                      'Incorrect: "fulls" is not a word.',
                      'Incorrect: Extra s after the apostrophe is incorrect for singular "dog."',
                    ]
                  ),
                  correctAnswer: 'A. The dog’s bowl is full.',
                }),
            explanation:
              'ELA.1.C.3.1 introduces using apostrophe + s to show ownership by a singular noun.',
          },
        ],
      },
      {
        title: 'Verb Tenses & Complete Simple Sentences (Grade 1)',
        directions: 'Check time clues (yesterday, today, tomorrow) and complete thoughts.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Rewrite this sentence for tomorrow (future tense): "Today we paint a mural."'
                : 'Which verb fits the time clue? "Yesterday, our class _____ the butterfly garden."',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Tomorrow we will paint a mural.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    ['visits', 'will visit', 'visited', 'visiting'],
                    [
                      'Incorrect: "visits" is present tense.',
                      'Incorrect: "will visit" is future tense.',
                      'Correct: Past-tense "-ed" ("visited") matches "Yesterday."',
                      'Incorrect: Missing a helping verb.',
                    ]
                  ),
                  correctAnswer: 'C. visited',
                }),
            explanation:
              'Using past (-ed), present, and future (will + verb) tenses matches actions to time words (ELA.1.C.3.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Turn this naming part into a complete sentence by adding a telling part: "The playful otter..."'
                : 'Which group of words is a COMPLETE simple sentence?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Example: The playful otter splashed in the clear spring.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    ['Under the shady oak tree.', 'Two bright birds sang.', 'Running across the wet sand.', 'A yellow raincoat with boots.'],
                    [
                      'Incorrect: Prepositional phrase with no subject or verb.',
                      'Correct: Has a subject ("Two bright birds") and an action ("sang").',
                      'Incorrect: Action phrase missing a subject and helping verb.',
                      'Incorrect: Noun phrase with no verb.',
                    ]
                  ),
                  correctAnswer: 'B. Two bright birds sang.',
                }),
            explanation:
              'A complete simple sentence names who or what (subject) and tells what happens (predicate) (ELA.1.C.3.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Pick the best end mark (. ? !) for excitement: "Watch out for that giant puddle"'
                : 'Which sentence uses the best end mark for an excited warning?',
            targetSentence:
              questionType === 'short_response' ? 'Watch out for that giant puddle' : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Watch out for that giant puddle!',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['Hooray, our team won the race!', 'Hooray, our team won the race?', 'hooray, our team won the race!', 'Hooray, our team won the race.'],
                    [
                      'Correct: Starts with a capital letter and uses an exclamation point for strong excitement.',
                      'Incorrect: This is an excited statement, not a question.',
                      'Incorrect: First word needs a capital H.',
                      'Incorrect: An exclamation point better matches "Hooray!"',
                    ]
                  ),
                  correctAnswer: 'A. Hooray, our team won the race!',
                }),
            explanation:
              'Choosing periods, question marks, or exclamation points helps Grade 1 writers match sentence purpose (ELA.1.C.3.1).',
          },
        ],
      },
    ];
  }

  if (grade === '2') {
    if (purpose === 'activate' && priorBench) {
      return [
        {
          title: 'Grade 1 → Grade 2 Grammar Bridge: Regular Rules to Contractions & Series Commas',
          directions:
            'Connect Grade 1 apostrophes and sentence punctuation to Grade 2 contractions, series commas, and irregular words.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
              prompt:
                questionType === 'short_response'
                  ? 'Warm-Up Bridge: Combine "do not" into a contraction using an apostrophe, and use it in 1 sentence.'
                  : 'Warm-Up Bridge (Prior Knowledge): Which sentence fixes BOTH the proper noun and the apostrophe in the contraction?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'don’t — Example: We don’t leave litter on the beach.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['On friday, mia couldnt find her library book.', 'On Friday, Mia could’nt find her library book.', 'On Friday, Mia couldn’t find her library book.', 'On Friday, Mia couldnt find her library book.'],
                      [
                        'Incorrect: "friday" and "mia" need capital letters, and "couldnt" needs an apostrophe.',
                        'Incorrect: In "couldn’t," the apostrophe replaces the missing "o" between n and t.',
                        'Correct: Activates Grade 1 proper-noun capitals ("Friday," "Mia") and applies Grade 2 contraction apostrophe placement ("couldn’t").',
                        'Incorrect: Missing the apostrophe in "couldn’t."',
                      ]
                    ),
                    correctAnswer: 'C. On Friday, Mia couldn’t find her library book.',
                  }),
              explanation: `Activates Grade 1 proper noun and apostrophe foundations (${priorBench.code}) and bridges into Grade 2 contractions (ELA.2.C.3.1).`,
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
              prompt:
                questionType === 'short_response'
                  ? 'Bridge to Grade 2: Add commas to separate the three items in this series: "We packed apples pretzels and water bottles."'
                  : 'Bridge to Grade 2: Which sentence uses commas correctly in a list (series) of three items?',
              targetSentence:
                questionType === 'short_response' ? 'We packed apples pretzels and water bottles.' : undefined,
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'We packed apples, pretzels, and water bottles.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      ['We saw herons turtles and manatees.', 'We saw herons, turtles, and manatees.', 'We saw, herons, turtles, and manatees.', 'We saw herons, turtles and, manatees.'],
                      [
                        'Incorrect: Missing commas between the three items.',
                        'Correct: Uses commas to separate each item in a list of three.',
                        'Incorrect: Do not put a comma right after the verb "saw."',
                        'Incorrect: Comma belongs before "and," not after "and."',
                      ]
                    ),
                    correctAnswer: 'B. We saw herons, turtles, and manatees.',
                  }),
              explanation:
                'Grade 2 conventions require using commas cleanly to separate three or more items in a series (ELA.2.C.3.1).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Bridge to Grade 2: Fix the irregular past-tense verb in "Last night, Owen goed to bed early."'
                  : 'Bridge to Grade 2: Which irregular plural noun completes the sentence? "Three brown _____ ran across the grass."',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'Last night, Owen went to bed early.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      ['mice', 'mouses', 'mouse', 'mices'],
                      [
                        'Correct: "mice" is the irregular plural of "mouse."',
                        'Incorrect: "mouse" does not add -s to become plural.',
                        'Incorrect: "mouse" is singular.',
                        'Incorrect: "mice" is already plural without -s.',
                      ]
                    ),
                    correctAnswer: 'A. mice',
                  }),
              explanation:
                'Grade 2 moves from Grade 1 regular -s plurals and -ed verbs to irregular plurals and irregular past verbs (ELA.2.C.3.1).',
            },
          ],
        },
      ];
    }

    return [
      {
        title: 'Irregular Plurals, Contractions & Series Commas (Grade 2)',
        directions: 'Edit each sentence carefully using Grade 2 standard English rules.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Fix the two errors in this sentence: "She didnt bring her crayons markers and glue."'
                : 'Which sentence punctuates both the contraction and the series list correctly?',
            targetSentence:
              questionType === 'short_response'
                ? 'She didnt bring her crayons markers and glue.'
                : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'She didn’t bring her crayons, markers, and glue.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    [
                      'We didn’t see shells crabs or starfish.',
                      'We didn’t see shells, crabs, or starfish.',
                      'We did’nt see shells, crabs, or starfish.',
                      'We didnt see shells, crabs, or starfish.',
                    ],
                    [
                      'Incorrect: Missing commas between the three nouns.',
                      'Correct: Places the apostrophe between n and t in "didn’t" and uses commas in the series.',
                      'Incorrect: In "didn’t," the apostrophe replaces the omitted "o."',
                      'Incorrect: Missing the apostrophe in "didn’t."',
                    ]
                  ),
                  correctAnswer: 'B. We didn’t see shells, crabs, or starfish.',
                }),
            explanation:
              'Grade 2 ELA.2.C.3.1 masters apostrophes in contractions and commas separating items in a series.',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Rewrite the sentence with the correct irregular past-tense verb: "Yesterday, the flock of geese flyed south."'
                : 'Which irregular past-tense verb completes the sentence? "This morning, Carlos _____ two miles at the track."',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Yesterday, the flock of geese flew south.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    ['runned', 'run', 'running', 'ran'],
                    [
                      'Incorrect: "run" is irregular and does not add -ed.',
                      'Incorrect: "run" is present tense, not past tense.',
                      'Incorrect: "running" lacks a helping verb.',
                      'Correct: "ran" is the irregular past-tense form of "run."',
                    ]
                  ),
                  correctAnswer: 'D. ran',
                }),
            explanation:
              'Common irregular past-tense verbs (ran, flew, saw, went, ate) change spelling rather than adding -ed (ELA.2.C.3.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Write the irregular plural of "child" and "foot" in 1 sentence.'
                : 'Which sentence uses an irregular plural noun correctly?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Example: Two children washed their sandy feet at the hose.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['Two tall men helped carry the tent.', 'Two tall mans helped carry the tent.', 'I lost two tooths this summer.', 'Five sheeps grazed in the field.'],
                    [
                      'Correct: "men" is the irregular plural of "man."',
                      'Incorrect: The plural of "man" is "men."',
                      'Incorrect: The plural of "tooth" is "teeth."',
                      'Incorrect: The plural of "sheep" stays "sheep."',
                    ]
                  ),
                  correctAnswer: 'A. Two tall men helped carry the tent.',
                }),
            explanation:
              'Grade 2 writers learn common irregular plurals such as children, men, feet, teeth, mice, and sheep (ELA.2.C.3.1).',
          },
        ],
      },
      {
        title: 'Pronouns, Book Titles & Letter Commas (Grade 2)',
        directions: 'Apply Grade 2 conventions for pronouns, commas in greetings/closings, and titles.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Add the missing commas in this friendly letter greeting and closing: "Dear Grandma ... Your friend Mateo"'
                : 'Which greeting and closing pair uses commas correctly?',
            targetSentence:
              questionType === 'short_response' ? 'Dear Grandma / Your friend Mateo' : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Dear Grandma, ... Your friend, Mateo',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    ['Dear, Uncle Ben / Love Eli', 'Dear Uncle Ben / Love Eli,', 'Dear Uncle Ben, / Love, Eli', 'Dear Uncle, Ben / Love, Eli'],
                    [
                      'Incorrect: Comma goes after the full greeting, not after "Dear."',
                      'Incorrect: Missing comma after greeting and misplaced comma after the name.',
                      'Correct: A comma follows both the greeting ("Dear Uncle Ben,") and the closing ("Love, Eli").',
                      'Incorrect: Splits the name "Uncle Ben."',
                    ]
                  ),
                  correctAnswer: 'C. Dear Uncle Ben, / Love, Eli',
                }),
            explanation:
              'Friendly letters require a comma after the greeting and after the closing phrase (ELA.2.C.3.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Choose a reflexive pronoun ("myself" or "herself") to finish: "Nora tied her sneakers all by _____."'
                : 'Which pronoun correctly replaces "Elena and I" in "Elena and I built a sandcastle"?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'herself — Nora tied her sneakers all by herself.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    ['They', 'We', 'Us', 'Them'],
                    [
                      'Incorrect: "They" excludes the speaker ("I").',
                      'Correct: "We" is the plural subject pronoun that includes "I."',
                      'Incorrect: "Us" is an object pronoun, not a subject pronoun.',
                      'Incorrect: "Them" is an object pronoun and excludes "I."',
                    ]
                  ),
                  correctAnswer: 'B. We',
                }),
            explanation:
              'Using subject and reflexive pronouns accurately improves sentence clarity in Grade 2 writing (ELA.2.C.3.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Fix the possessive apostrophe in this sentence: "That is the turtles shell."'
                : 'Which sentence uses an apostrophe to show that a nest belongs to ONE bird?',
            targetSentence:
              questionType === 'short_response' ? 'That is the turtles shell.' : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'That is the turtle’s shell.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['The bird’s nest sits high in the pine.', 'The birds nest sits high in the pine.', 'The bird’s nests sits high in the pine.', 'The birds’s nest sits high in the pine.'],
                    [
                      'Correct: "bird’s" shows possession by one bird.',
                      'Incorrect: Missing possessive apostrophe.',
                      'Incorrect: "nests sits" has a subject-verb mismatch.',
                      'Incorrect: Double s after apostrophe is incorrect here.',
                    ]
                  ),
                  correctAnswer: 'A. The bird’s nest sits high in the pine.',
                }),
            explanation:
              'Singular possessive nouns add ’s ("bird’s," "turtle’s") to show ownership (ELA.2.C.3.1).',
          },
        ],
      },
    ];
  }

  if (grade === '3') {
    if (purpose === 'activate' && priorBench) {
      return [
        {
          title: 'Grade 2 → Grade 3 Warm-Up: Irregular Verbs, Apostrophes & Compound Sentences',
          directions:
            questionType === 'short_response'
              ? 'Use what you remember from second grade about irregular verbs and apostrophes, then apply third-grade sentence rules in 1–2 sentences.'
              : 'Activate your prior grammar skills (irregular verbs, contractions, and series commas) to prepare for Grade 3 compound sentences and consistent tense.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
              prompt:
                questionType === 'short_response'
                  ? 'Fix the apostrophe and irregular past-tense verb in this sentence: "We didnt see how fast the geese flyed over the pond."'
                  : 'Warm-Up Bridge (Prior Knowledge): Which correction fixes both the contraction and the irregular past-tense verb?',
              targetSentence: 'We didnt see how fast the geese flyed over the pond.',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'We didn’t see how fast the geese flew over the pond. ("Didn’t" needs an apostrophe for the missing "o," and the past tense of "fly" is irregular "flew.")',
                    maxSentences: 2,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      [
                        'Change "didnt" to "did’nt" and "flyed" to "flew".',
                        'Change "didnt" to "didn’t" and "geese" to "gooses".',
                        'Change "didnt" to "didn’t" and "flyed" to "flew".',
                        'Change "didnt" to "didn’t" and "flyed" to "flied".',
                      ],
                      [
                        'Incorrect: In "didn’t," the apostrophe replaces the omitted "o" in "did not," so it belongs between n and t.',
                        'Incorrect: "Geese" is already the correct irregular plural of "goose."',
                        'Correct: Activates Grade 2 mastery of contractions ("didn’t") and irregular past-tense verbs ("flew") before Grade 3 paragraph tense consistency.',
                        'Incorrect: "Flew" (not "flied") is the irregular past-tense form of "fly."',
                      ]
                    ),
                    correctAnswer: 'C. Change "didnt" to "didn’t" and "flyed" to "flew".',
                  }),
              explanation: `Activates Grade 2 prerequisite ${priorBench.code} (contractions with apostrophes and irregular past-tense verbs) to prepare students for maintaining consistent verb tense across Grade 3 paragraphs (ELA.3.C.3.1).`,
              textualEvidence: '"We didnt see... flyed"',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Combine these two related sentences into one Grade 3 compound sentence using a comma and a coordinating conjunction (and, but, or so).'
                  : 'Bridge to Grade 3: Which sentence correctly joins two complete sentences into a compound sentence?',
              targetSentence:
                questionType === 'short_response'
                  ? 'Maya packed binoculars for the marsh walk. Her brother carried the field notebook.'
                  : undefined,
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'Maya packed binoculars for the marsh walk, and her brother carried the field notebook.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      [
                        'Maya packed binoculars for the marsh walk and her brother carried the field notebook.',
                        'Maya packed binoculars for the marsh walk, and her brother carried the field notebook.',
                        'Maya packed binoculars, notebooks, and a whistle for the marsh walk.',
                        'Maya packed binoculars for the marsh walk, her brother carried the field notebook.',
                      ],
                      [
                        'Incorrect: Joining two independent clauses needs a comma before "and."',
                        'Correct: Connects Grade 2 simple sentence mastery to Grade 3 compound sentences using a comma plus "and."',
                        'Incorrect: That is a single simple sentence with a Grade 2 series list, not a compound sentence.',
                        'Incorrect: A comma alone cannot join two complete sentences (comma splice).',
                      ]
                    ),
                    correctAnswer:
                      'B. Maya packed binoculars for the marsh walk, and her brother carried the field notebook.',
                  }),
              explanation: `Builds from Grade 2 series commas and complete simple sentences (${priorBench.code}) into Grade 3 compound sentences joined by a comma and coordinating conjunction (ELA.3.C.3.1).`,
            },
            {
              format:
                questionType === 'short_response'
                  ? 'short_response'
                  : questionType === 'multiple_choice'
                    ? 'multiple_choice'
                    : 'grammar_editing',
              prompt:
                questionType === 'short_response'
                  ? 'Rewrite the sentence below so the speaker’s exact words are punctuated with quotation marks and a comma.'
                  : 'Bridge to Grade 3: Which sentence punctuates dialogue accurately with quotation marks and a comma?',
              targetSentence:
                questionType === 'short_response'
                  ? 'Grandpa asked Did you spot the green sea turtle near the dock?'
                  : undefined,
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'Grandpa asked, "Did you spot the green sea turtle near the dock?"',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      [
                        'Grandpa asked, "Did you spot the green sea turtle near the dock?"',
                        'Grandpa asked "Did you spot the green sea turtle near the dock"?',
                        '"Grandpa asked," Did you spot the green sea turtle near the dock?',
                        'Grandpa asked, "Did you spot the green sea turtle near the dock".',
                      ],
                      [
                        'Correct: Uses a comma after the speaker tag and places the question mark inside the closing quotation mark.',
                        'Incorrect: Missing the comma after "asked," and the question mark belongs inside the quotation marks.',
                        'Incorrect: Places quotation marks around the speaker tag instead of the spoken question.',
                        'Incorrect: Replaces the question mark with a period outside the closing quotation mark.',
                      ]
                    ),
                    correctAnswer:
                      'A. Grandpa asked, "Did you spot the green sea turtle near the dock?"',
                  }),
              explanation: `Connects Grade 2 sentence end-punctuation mastery (${priorBench.code}) to the Grade 3 requirement for quotation marks and commas in dialogue (ELA.3.C.3.1).`,
            },
          ],
        },
      ];
    }

    const templates: FallbackTemplate[] = [
      {
        title: 'Museum Field Trip: Verb Tense & Plural Nouns Warm-Up',
        directions:
          questionType === 'short_response'
            ? 'Read each sentence carefully. Write a 1–2 sentence answer correcting the grammar error and explaining the rule.'
            : 'Read each sentence and choose or write the correction that follows standard English rules.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Rewrite the sentence below so the verb tense matches the rest of the sentence, and explain in 1 sentence why your change is needed.'
                : 'Read the sentence below. Which change corrects the verb tense error?',
            targetSentence: 'Yesterday, our third-grade class visits the science museum and saw dinosaur fossils.',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Yesterday, our third-grade class visited the science museum and saw dinosaur fossils.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    [
                      'Change "saw" to "see".',
                      'Change "visits" to "visited".',
                      'Change "class" to "classes".',
                      'Remove the comma after "Yesterday".',
                    ],
                    [
                      'Incorrect: "Yesterday" signals past tense, so "saw" is already correct.',
                      'Correct: Changing "visits" to past-tense "visited" matches "Yesterday" and "saw".',
                      'Incorrect: "Our third-grade class" is one singular group.',
                      'Incorrect: A comma correctly follows the introductory time word "Yesterday".',
                    ]
                  ),
                  correctAnswer: 'B. Change "visits" to "visited".',
                }),
            explanation:
              'The time clue "Yesterday" and the second verb "saw" show that the action happened in the past, so the regular verb "visits" must be conjugated in past tense as "visited" (ELA.3.C.3.1).',
            textualEvidence: '"Yesterday, our third-grade class visits... and saw"',
          },
          {
            format:
              questionType === 'multiple_choice'
                ? 'multiple_choice'
                : questionType === 'short_response'
                  ? 'short_response'
                  : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Correct the irregular plural noun in the sentence below and explain how irregular plurals work in 1 sentence.'
                : 'Choose the sentence that uses an irregular plural noun correctly.',
            targetSentence:
              questionType === 'short_response'
                ? 'Three gray mouses scurried behind the tall oak tree before recess.'
                : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Three gray mice scurried behind the tall oak tree before recess.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    [
                      'Two childs carried the stack of library books to the table.',
                      'We counted five deers standing near the edge of the trail.',
                      'The dentist checked two loose teeth before cleaning my smile.',
                      'Several womans volunteered to help organize the book fair.',
                    ],
                    [
                      'Incorrect: The irregular plural of "child" is "children," not "childs."',
                      'Incorrect: The plural of "deer" stays "deer" without adding -s.',
                      'Correct: "Teeth" is the accurate irregular plural form of "tooth."',
                      'Incorrect: The irregular plural of "woman" is "women," not "womans."',
                    ]
                  ),
                  correctAnswer: 'C. The dentist checked two loose teeth before cleaning my smile.',
                }),
            explanation:
              'Grade 3 conventions require forming frequently occurring irregular plural nouns such as "mice," "teeth," "children," "deer," and "women" without simply adding -s (ELA.3.C.3.1).',
          },
          {
            format:
              questionType === 'short_response'
                ? 'short_response'
                : questionType === 'multiple_choice'
                  ? 'multiple_choice'
                  : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Add quotation marks and a comma where needed to punctuate the dialogue correctly.'
                : 'Which sentence punctuates dialogue correctly using quotation marks and a comma?',
            targetSentence:
              questionType === 'short_response'
                ? 'Maya whispered Look at the sea turtle tracks on the sand.'
                : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Maya whispered, "Look at the sea turtle tracks on the sand."',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    [
                      'Maya whispered, "Look at the sea turtle tracks on the sand."',
                      'Maya whispered "Look at the sea turtle tracks on the sand".',
                      '"Maya whispered," Look at the sea turtle tracks on the sand.',
                      'Maya whispered, "Look at the sea turtle tracks on the sand".',
                    ],
                    [
                      'Correct: A comma precedes the opening quotation mark, and the period sits inside the closing quotation mark.',
                      'Incorrect: A comma is missing after "whispered," and the period belongs inside the closing quotation mark.',
                      'Incorrect: The speaker tag "Maya whispered" should not be inside quotation marks.',
                      'Incorrect: In American English, the ending period belongs inside the closing quotation mark.',
                    ]
                  ),
                  correctAnswer: 'A. Maya whispered, "Look at the sea turtle tracks on the sand."',
                }),
            explanation:
              'Dialogue requires a comma after the speaker tag ("Maya whispered,"), quotation marks around the exact spoken words, and ending punctuation placed inside the closing quotation mark (ELA.3.C.3.1).',
          },
        ],
      },
      {
        title: 'Garden Club Notes: Compound Sentences & Direct Address',
        directions:
          'Complete each item by applying Grade 3 standard English rules for compound sentences, irregular past-tense verbs, and commas.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Combine the two simple sentences into one compound sentence using a comma and a coordinating conjunction (and, but, or so).'
                : 'Which sentence correctly joins two complete thoughts into a compound sentence?',
            targetSentence:
              questionType === 'short_response'
                ? 'We watered the tomato seedlings. The afternoon sun was very warm.'
                : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'We watered the tomato seedlings, and the afternoon sun was very warm. (Or: The afternoon sun was very warm, so we watered the tomato seedlings.)',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    [
                      'We planted marigolds we also pulled weeds near the fence.',
                      'We planted marigolds, we also pulled weeds near the fence.',
                      'We planted marigolds and, pulled weeds near the fence.',
                      'We planted marigolds, and we also pulled weeds near the fence.',
                    ],
                    [
                      'Incorrect: Joining two independent clauses without punctuation or a conjunction creates a run-on sentence.',
                      'Incorrect: A comma alone cannot join two independent clauses (comma splice).',
                      'Incorrect: The second part "pulled weeds" lacks a subject, so a comma is not placed after "and."',
                      'Correct: Two complete clauses are properly joined by a comma plus the coordinating conjunction "and."',
                    ]
                  ),
                  correctAnswer:
                    'D. We planted marigolds, and we also pulled weeds near the fence.',
                }),
            explanation:
              'A compound sentence joins two independent clauses (each with its own subject and verb) using a comma followed by a coordinating conjunction such as "and," "but," or "so" (ELA.3.C.3.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Rewrite the sentence below with the correct past-tense irregular verb.'
                : 'Which word correctly completes the sentence in past tense? "Last week, Elena _____ a blue ribbon for her bean plant."',
            targetSentence:
              questionType === 'short_response'
                ? 'Last week, Elena winned a blue ribbon for her bean plant.'
                : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Last week, Elena won a blue ribbon for her bean plant.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['won', 'win', 'winned', 'winning'],
                    [
                      'Correct: "Won" is the irregular past-tense form of "win."',
                      'Incorrect: "Win" is present tense, which does not match "Last week."',
                      'Incorrect: "Win" is an irregular verb and does not add -ed.',
                      'Incorrect: "Winning" is a participle and cannot stand alone as the main past verb.',
                    ]
                  ),
                  correctAnswer: 'A. won',
                }),
            explanation:
              'Frequently occurring irregular verbs such as "win" change their spelling in the past tense ("won") rather than taking -ed (ELA.3.C.3.1).',
          },
          {
            format:
              questionType === 'multiple_choice'
                ? 'multiple_choice'
                : questionType === 'short_response'
                  ? 'short_response'
                  : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Add a comma to punctuate the direct address in this sentence and explain why it is needed.'
                : 'Which sentence uses a comma correctly to show direct address?',
            targetSentence:
              questionType === 'short_response'
                ? 'Please hand me the watering can Mateo.'
                : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Please hand me the watering can, Mateo.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    [
                      'Please hand, me the watering can Mateo.',
                      'Please, hand me the watering can Mateo.',
                      'Please hand me the watering can, Mateo.',
                      'Please hand me, the watering can, Mateo.',
                    ],
                    [
                      'Incorrect: "Hand me" should not be separated by a comma, and "Mateo" needs a comma before it.',
                      'Incorrect: A comma does not belong after "Please," and direct address needs a comma before the name.',
                      'Correct: A comma sets off the name of the person being spoken to ("Mateo").',
                      'Incorrect: The extra comma after "me" breaks the verb from its object.',
                    ]
                  ),
                  correctAnswer: 'C. Please hand me the watering can, Mateo.',
                }),
            explanation:
              'When speaking directly to someone by name, use a comma to separate the person’s name from the rest of the sentence (ELA.3.C.3.1).',
          },
        ],
      },
    ];
    return templates;
  }

  if (grade === '4') {
    return [
      {
        title: 'Everglades Field Log: Subject-Verb Agreement & Complete Sentences',
        directions:
          'Check each sentence carefully for Grade 4 conventions: subject-verb agreement with intervening phrases, fragments, run-ons, and conjunctions.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Correct the subject-verb agreement error in the sentence below and explain in 1 sentence which word is the true subject.'
                : 'Read the sentence below. Which change makes the verb agree with its subject?',
            targetSentence:
              'The box of colorful field guides sit on the top shelf near the window.',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'The box of colorful field guides sits on the top shelf near the window. The singular noun "box" is the subject (not "guides"), so it takes the singular verb "sits."',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    [
                      'Change "box" to "boxes".',
                      'Change "sit" to "sits".',
                      'Change "guides" to "guide".',
                      'Change "on" to "in".',
                    ],
                    [
                      'Incorrect: Changing the subject noun alters the sentence meaning rather than fixing agreement.',
                      'Correct: The singular subject "box" (ignoring the prepositional phrase "of colorful field guides") requires the singular verb "sits."',
                      'Incorrect: "Colorful field guides" is inside the prepositional phrase and does not control the verb.',
                      'Incorrect: Changing the preposition does not fix the verb agreement error.',
                    ]
                  ),
                  correctAnswer: 'B. Change "sit" to "sits".',
                }),
            explanation:
              'When a prepositional phrase ("of colorful field guides") comes between the subject and the verb, match the verb to the true subject ("box" -> singular "sits"), not the noun inside the phrase (ELA.4.C.3.1).',
            textualEvidence: '"The box [of colorful field guides] sit..."',
          },
          {
            format:
              questionType === 'multiple_choice'
                ? 'multiple_choice'
                : questionType === 'short_response'
                  ? 'short_response'
                  : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Fix the run-on sentence below by turning it into a correct compound or two-sentence statement.'
                : 'Which option corrects this run-on sentence without creating a fragment?',
            targetSentence: 'Airboats glide across shallow sawgrass they never sink into the mud.',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Airboats glide across shallow sawgrass, and they never sink into the mud. (Or two separate sentences with a period.)',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    [
                      'Airboats glide across shallow sawgrass, they never sink into the mud.',
                      'Gliding across shallow sawgrass and never sinking into the mud.',
                      'Airboats glide across shallow sawgrass, and they never sink into the mud.',
                      'Airboats glide across shallow sawgrass because never sink into the mud.',
                    ],
                    [
                      'Incorrect: Using only a comma between two complete sentences creates a comma splice.',
                      'Incorrect: Removing both finite verbs turns the sentence into a fragment.',
                      'Correct: Joining two independent clauses with a comma and coordinating conjunction ("and") fixes the run-on.',
                      'Incorrect: "Never sink into the mud" is missing its subject "they."',
                    ]
                  ),
                  correctAnswer:
                    'C. Airboats glide across shallow sawgrass, and they never sink into the mud.',
                }),
            explanation:
              'Two independent clauses cannot be fused together without punctuation or a conjunction; joining them with a comma and coordinating conjunction forms a complete, grammatical sentence (ELA.4.C.3.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Identify why the group of words below is a fragment, and rewrite it as a complete sentence.'
                : 'Which sentence uses a conjunction correctly to show a contrast between two ideas?',
            targetSentence:
              questionType === 'short_response'
                ? 'Before the afternoon thunderstorm rolled over the marsh.'
                : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'It is a dependent clause fragment with no independent main clause. Example fix: Before the afternoon thunderstorm rolled over the marsh, the park ranger guided hikers back to the boardwalk.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    [
                      'The trail looked muddy after the storm, yet the hikers still spotted three herons.',
                      'The trail looked muddy after the storm, so the hikers still spotted three herons.',
                      'The trail looked muddy after the storm, or the hikers still spotted three herons.',
                      'The trail looked muddy after the storm, for the hikers still spotted three herons.',
                    ],
                    [
                      'Correct: "Yet" signals contrast between the muddy trail and still spotting herons.',
                      'Incorrect: "So" shows cause and effect rather than contrast.',
                      'Incorrect: "Or" presents an alternative choice rather than contrast.',
                      'Incorrect: "For" explains a reason rather than contrast.',
                    ]
                  ),
                  correctAnswer:
                    'A. The trail looked muddy after the storm, yet the hikers still spotted three herons.',
                }),
            explanation:
              'Coordinating conjunctions express specific logical relationships: "yet" and "but" show contrast, whereas "so" shows result and "or" shows choice (ELA.4.C.3.1).',
          },
        ],
      },
      {
        title: 'Space Coast Lab: Fragments, Conjunctions & Intervening Phrases',
        directions:
          'Revise and identify Grade 4 conventions accurately, paying close attention to complete sentences and subject-verb agreement.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Rewrite the sentence below so the verb agrees with the subject.'
                : 'Which revision fixes the subject-verb agreement error?',
            targetSentence:
              'Every rocket on the launch pads wait for the final weather check.',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Every rocket on the launch pads waits for the final weather check.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    [
                      'Change "rocket" to "rockets".',
                      'Change "pads" to "pad".',
                      'Change "for" to "after".',
                      'Change "wait" to "waits".',
                    ],
                    [
                      'Incorrect: "Every" must pair with a singular noun ("Every rocket").',
                      'Incorrect: "Launch pads" can be plural inside the prepositional phrase.',
                      'Incorrect: Changing the preposition does not fix agreement.',
                      'Correct: The singular subject "Every rocket" takes the singular verb "waits."',
                    ]
                  ),
                  correctAnswer: 'D. Change "wait" to "waits".',
                }),
            explanation:
              '"Every rocket" is singular; the intervening phrase "on the launch pads" ends in plural "pads," so you must look back to "Every rocket" to choose the singular verb "waits" (ELA.4.C.3.1).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Combine these two ideas into one complete sentence using a conjunction (because, although, or so).'
                : 'Which option is a complete sentence rather than a fragment?',
            targetSentence:
              questionType === 'short_response'
                ? 'The engineers tested the heat shield twice. They wanted to confirm the rover could land safely.'
                : undefined,
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'The engineers tested the heat shield twice because they wanted to confirm the rover could land safely.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    [
                      'Watching the bright countdown clock outside the visitor center.',
                      'Students watched the bright countdown clock outside the visitor center.',
                      'Because the clouds cleared just minutes before liftoff.',
                      'A model satellite with shiny silver solar panels on each side.',
                    ],
                    [
                      'Incorrect: Lacks a subject and main finite verb (participial fragment).',
                      'Correct: Contains both a subject ("Students") and a complete predicate ("watched...").',
                      'Incorrect: Begins with the subordinating conjunction "Because" with no main clause.',
                      'Incorrect: Noun phrase with no main verb.',
                    ]
                  ),
                  correctAnswer:
                    'B. Students watched the bright countdown clock outside the visitor center.',
                }),
            explanation:
              'A complete sentence requires both a subject and a complete predicate that expresses a full thought without being left hanging as a dependent clause (ELA.4.C.3.1).',
          },
          {
            format:
              questionType === 'multiple_choice'
                ? 'multiple_choice'
                : questionType === 'short_response'
                  ? 'short_response'
                  : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'Choose the best conjunction (and, but, or so) to fill the blank and explain why it fits: "The sky turned cloudy, _____ the telescope club moved inside the planetarium."'
                : 'Which conjunction best completes the sentence? "The sky turned cloudy, _____ the telescope club moved inside the planetarium."',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'so — Moving inside the planetarium is the direct result of the sky turning cloudy.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    ['but', 'or', 'so', 'nor'],
                    [
                      'Incorrect: Moving inside is a logical result, not a contrast.',
                      'Incorrect: The two clauses are not alternative choices.',
                      'Correct: "So" clearly signals cause and effect between cloudy skies and moving indoors.',
                      'Incorrect: "Nor" joins two negative ideas.',
                    ]
                  ),
                  correctAnswer: 'C. so',
                }),
            explanation:
              '"So" connects a cause ("the sky turned cloudy") to its direct effect ("the club moved inside") (ELA.4.C.3.1).',
          },
        ],
      },
    ];
  }

  // Grade 5 Conventions
  return [
    {
      title: 'Civic Debate Prep: Modals, Appositives & Tense Shifts',
      directions:
        'Apply Grade 5 standard English conventions for modal verbs, appositives, clauses, and tense consistency.',
      questions: [
        {
          format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
          prompt:
            questionType === 'short_response'
              ? 'Identify the inappropriate shift in verb tense or number in the sentence below and rewrite the sentence correctly.'
              : 'Which edit corrects the inappropriate shift in verb tense?',
          targetSentence:
            'When the fifth-grade debaters finished their opening speech, they listen carefully to the rebuttal.',
          ...(questionType === 'short_response'
            ? {
                correctAnswer:
                  'When the fifth-grade debaters finished their opening speech, they listened carefully to the rebuttal. ("Finished" is past tense, so "listen" should also be past-tense "listened.")',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'C',
                  [
                    'Change "finished" to "will finish".',
                    'Change "their" to "his or her".',
                    'Change "listen" to "listened".',
                    'Remove the comma after "speech".',
                  ],
                  [
                    'Incorrect: Shifting the first verb to future tense creates a mismatch with "listen."',
                    'Incorrect: "Debaters" is plural, so "their" already agrees in number.',
                    'Correct: Changing present-tense "listen" to past-tense "listened" keeps the sentence consistently in past tense.',
                    'Incorrect: The comma correctly follows the introductory subordinate clause.',
                  ]
                ),
                correctAnswer: 'C. Change "listen" to "listened".',
              }),
          explanation:
            'Unless the time frame genuinely changes, maintain consistent verb tense across clauses—here both "finished" and "listened" belong in past tense (ELA.5.C.3.1).',
          textualEvidence: '"finished... listen"',
        },
        {
          format:
            questionType === 'multiple_choice'
              ? 'multiple_choice'
              : questionType === 'short_response'
                ? 'short_response'
                : 'grammar_editing',
          prompt:
            questionType === 'short_response'
              ? 'Rewrite the sentence below to punctuate the appositive phrase correctly with commas.'
              : 'Which sentence punctuates an appositive phrase correctly?',
          targetSentence:
            questionType === 'short_response'
              ? 'Dr. Alvarez a marine biologist from Tampa spoke to our class about coral reefs.'
              : undefined,
          ...(questionType === 'short_response'
            ? {
                correctAnswer:
                  'Dr. Alvarez, a marine biologist from Tampa, spoke to our class about coral reefs.',
                maxSentences: 1,
              }
            : {
                options: makeMcOptions(
                  'A',
                  [
                    'Dr. Alvarez, a marine biologist from Tampa, spoke to our class about coral reefs.',
                    'Dr. Alvarez a marine biologist from Tampa, spoke to our class about coral reefs.',
                    'Dr. Alvarez, a marine biologist from Tampa spoke to our class, about coral reefs.',
                    'Dr. Alvarez, a marine biologist, from Tampa spoke to our class about coral reefs.',
                  ],
                  [
                    'Correct: Commas cleanly bracket both sides of the nonessential appositive phrase "a marine biologist from Tampa."',
                    'Incorrect: Missing the opening comma before the appositive phrase.',
                    'Incorrect: Missing the closing comma right after "Tampa" and misplaces a comma after "class."',
                    'Incorrect: Splits "from Tampa" out of the appositive phrase.',
                  ]
                ),
                correctAnswer:
                  'A. Dr. Alvarez, a marine biologist from Tampa, spoke to our class about coral reefs.',
              }),
          explanation:
            'An appositive phrase ("a marine biologist from Tampa") renames the noun beside it ("Dr. Alvarez") and is set off with a comma before and after when nonessential (ELA.5.C.3.1).',
        },
        {
          format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
          prompt:
            questionType === 'short_response'
              ? 'Choose a modal verb (must, might, or should) to show obligation in this sentence and explain what mood it conveys: "Students _____ cite reliable sources before presenting their argument."'
              : 'Which modal verb best indicates strong necessity or obligation? "Volunteers _____ wear closed-toe shoes before entering the restoration marsh."',
          ...(questionType === 'short_response'
            ? {
                correctAnswer:
                  '"must" or "should" — "Must" conveys a strict requirement/obligation to cite reliable sources.',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'B',
                  ['might', 'must', 'could', 'may'],
                  [
                    'Incorrect: "Might" expresses uncertain possibility rather than necessity.',
                    'Correct: The principal modal "must" expresses clear requirement or obligation.',
                    'Incorrect: "Could" expresses ability or possibility.',
                    'Incorrect: "May" expresses permission or mild possibility.',
                  ]
                ),
                correctAnswer: 'B. must',
              }),
          explanation:
            'Principal modal verbs indicate verb mood and attitude: "must" expresses obligation/necessity, whereas "might," "could," and "may" express possibility or permission (ELA.5.C.3.1).',
        },
      ],
    },
    {
      title: 'Coastal Research: Subordinate Clauses & Conjunctions',
      directions:
        'Use Grade 5 grammar conventions to evaluate main and subordinate clauses, number shifts, and conjunctions.',
      questions: [
        {
          format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
          prompt:
            questionType === 'short_response'
              ? 'Correct the inappropriate shift in number in the sentence below and explain your fix.'
              : 'Which revision corrects the inappropriate shift in number?',
          targetSentence:
            'Each student in the robotics club brought their own rechargeable battery pack.',
          ...(questionType === 'short_response'
            ? {
                correctAnswer:
                  'All students in the robotics club brought their own rechargeable battery packs. (Or: Each student... brought his or her own...)',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'D',
                  [
                    'Change "brought" to "brings".',
                    'Change "club" to "clubs".',
                    'Change "pack" to "packs" only.',
                    'Change "Each student" to "All students".',
                  ],
                  [
                    'Incorrect: Changing verb tense does not fix the singular/plural pronoun mismatch.',
                    'Incorrect: Changing "club" leaves "Each student" mismatched with "their."',
                    'Incorrect: Does not align the singular subject "Each student" with plural "their."',
                    'Correct: Changing singular "Each student" to plural "All students" aligns cleanly with plural "their."',
                  ]
                ),
                correctAnswer: 'D. Change "Each student" to "All students".',
              }),
          explanation:
            'Subjects and pronouns must stay consistent in number: plural "All students" pairs consistently with "their," avoiding a shift from singular "Each student" to plural "their" (ELA.5.C.3.1).',
        },
        {
          format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
          prompt:
            questionType === 'short_response'
              ? 'Underline or quote the subordinate clause in this sentence and explain how you know it is subordinate: "Although the tide was rising quickly, the researchers finished measuring the mangrove roots."'
              : 'In the sentence "Although the tide was rising quickly, the researchers finished measuring the mangrove roots," which part is the main (independent) clause?',
          ...(questionType === 'short_response'
            ? {
                correctAnswer:
                  '"Although the tide was rising quickly" is the subordinate clause because it begins with the subordinating conjunction "Although" and cannot stand alone as a complete sentence.',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'C',
                  [
                    'Although the tide was rising quickly',
                    'measuring the mangrove roots',
                    'the researchers finished measuring the mangrove roots',
                    'the tide was rising',
                  ],
                  [
                    'Incorrect: Begins with "Although," making it a subordinate (dependent) clause.',
                    'Incorrect: Participial phrase lacking a subject and finite verb.',
                    'Correct: Expresses a complete thought with its own subject ("researchers") and predicate ("finished...").',
                    'Incorrect: Omits the subordinating conjunction "Although," changing the actual clause structure.',
                  ]
                ),
                correctAnswer: 'C. the researchers finished measuring the mangrove roots',
              }),
          explanation:
            'A main clause can stand alone as a complete sentence, whereas a subordinate clause begins with a subordinating conjunction like "Although" and depends on the main clause (ELA.5.C.3.1).',
        },
        {
          format:
            questionType === 'multiple_choice'
              ? 'multiple_choice'
              : questionType === 'short_response'
                ? 'short_response'
                : 'grammar_editing',
          prompt:
            questionType === 'short_response'
              ? 'Rewrite the sentence below using a correlative or coordinating conjunction correctly so the joined phrases are parallel.'
              : 'Which sentence uses conjunctions correctly to join words or phrases?',
          targetSentence:
            questionType === 'short_response'
              ? 'We packed either binoculars or bringing a waterproof field notebook.'
              : undefined,
          ...(questionType === 'short_response'
            ? {
                correctAnswer:
                  'We packed either binoculars or a waterproof field notebook.',
                maxSentences: 1,
              }
            : {
                options: makeMcOptions(
                  'A',
                  [
                    'We packed both a waterproof notebook and extra pencils for the survey.',
                    'We packed both a waterproof notebook or extra pencils for the survey.',
                    'We packed neither a waterproof notebook and extra pencils for the survey.',
                    'We packed either a waterproof notebook nor extra pencils for the survey.',
                  ],
                  [
                    'Correct: "Both... and..." is a properly paired conjunction joining two noun phrases.',
                    'Incorrect: "Both" pairs with "and," not "or."',
                    'Incorrect: "Neither" pairs with "nor," not "and."',
                    'Incorrect: "Either" pairs with "or," not "nor."',
                  ]
                ),
                correctAnswer:
                  'A. We packed both a waterproof notebook and extra pencils for the survey.',
              }),
          explanation:
            'Correlative conjunctions must be paired accurately ("both... and," "either... or," "neither... nor") and join grammatically parallel words or phrases (ELA.5.C.3.1).',
        },
      ],
    },
  ];
}

function buildVocabularyTemplates(
  grade: GradeLevel,
  bench: FloridaBenchmark,
  questionType: BellringerQuestionType,
  purpose: BellringerPurpose,
  priorBench?: FloridaBenchmark
): FallbackTemplate[] {
  const gradeLabel = formatGradeLabel(grade);
  const isMorphology = bench.code.endsWith('.V.1.2');
  if (isMorphology) {
    if (grade === 'K' || grade === '1' || grade === '2') {
      if (purpose === 'activate' && priorBench) {
        return [
          {
            title: `${formatGradeLabel(priorBench.grade)} → ${gradeLabel} Word Parts Bridge: Base Words & Affixes`,
            directions:
              'Use what you know about base words and common endings to figure out words with prefixes and suffixes.',
            questions: [
              {
                format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
                prompt:
                  questionType === 'short_response'
                    ? 'Warm-Up Bridge: Find the base word inside "playful" and explain what the ending "-ful" adds.'
                    : 'Warm-Up Bridge (Prior Knowledge): Look at the word "helped." What is the base word?',
                ...(questionType === 'short_response'
                  ? {
                      correctAnswer:
                        'The base word is "play," and "-ful" means full of, so "playful" means full of play or fun.',
                      maxSentences: 1,
                    }
                  : {
                      options: makeMcOptions(
                        'B',
                        ['ed', 'help', 'helped', 'ful'],
                        [
                          'Incorrect: "-ed" is the ending, not the base word.',
                          'Correct: "help" is the base word before adding the ending "-ed."',
                          'Incorrect: "helped" is the whole inflected word.',
                          'Incorrect: "-ful" is a suffix not in "helped."',
                        ]
                      ),
                      correctAnswer: 'B. help',
                    }),
                explanation: `Activates ${formatGradeLabel(priorBench.grade)} word-part foundations (${priorBench.code}) before Grade 2 prefix and suffix analysis (${bench.code}).`,
              },
              {
                format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
                prompt:
                  questionType === 'short_response'
                    ? 'What does adding the prefix "re-" to "read" do to the meaning of "reread"?'
                    : 'Bridge to Grade 2: What does the word "reread" mean in "Let’s reread the funny page"?',
                ...(questionType === 'short_response'
                  ? {
                      correctAnswer: '"Re-" means again, so "reread" means to read the page again.',
                      maxSentences: 1,
                    }
                  : {
                      options: makeMcOptions(
                        'A',
                        ['read again', 'read silently', 'never read', 'read quickly'],
                        [
                          'Correct: The prefix "re-" means again.',
                          'Incorrect: "re-" does not mean quietly.',
                          'Incorrect: "not" is "un-" or "dis-," not "re-."',
                          'Incorrect: "re-" tells you how many times, not speed.',
                        ]
                      ),
                      correctAnswer: 'A. read again',
                    }),
                explanation: `Connects base-word familiarity to Grade 2 prefix meanings ("re-" = again) (${bench.code}).`,
              },
              {
                format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
                prompt:
                  questionType === 'short_response'
                    ? 'Explain in 1 sentence what "fearless" means using the base word "fear" and suffix "-less."'
                    : 'Bridge to Grade 2: Which word means "without any color"?',
                ...(questionType === 'short_response'
                  ? {
                      correctAnswer: '"-less" means without, so "fearless" means without fear or brave.',
                      maxSentences: 1,
                    }
                  : {
                      options: makeMcOptions(
                        'D',
                        ['colorful', 'recolor', 'uncolor', 'colorless'],
                        [
                          'Incorrect: "-ful" means full of color.',
                          'Incorrect: "re-" means to color again.',
                          'Incorrect: "uncolor" is not a standard word.',
                          'Correct: The suffix "-less" means without, so "colorless" means without color.',
                        ]
                      ),
                      correctAnswer: 'D. colorless',
                    }),
                explanation:
                  'Recognizing high-utility prefixes (un-, re-, pre-, dis-) and suffixes (-ful, -less) builds Grade 2 morphological awareness (ELA.2.V.1.2).',
              },
            ],
          },
        ];
      }

      return [
        {
          title: `Base Words, Prefixes & Suffixes (${gradeLabel})`,
          directions: 'Break each word into its base word, prefix, or suffix to find its meaning.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Break "unhappy" into its prefix and base word, and write what it means in 1 sentence.'
                  : 'What does "unlock" mean in the sentence: "Dad used his key to unlock the shed"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: '"Un-" means not, and "happy" is the base word, so "unhappy" means not happy.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['lock again', 'lock tightly', 'open or undo the lock', 'lose the lock'],
                      [
                        'Incorrect: "lock again" would be "relock."',
                        'Incorrect: "un-" reverses the action.',
                        'Correct: The prefix "un-" means not or the opposite of, so "unlock" means to open the lock.',
                        'Incorrect: Does not mean lose.',
                      ]
                    ),
                    correctAnswer: 'C. open or undo the lock',
                  }),
              explanation:
                'Grade 2 students use common prefixes (un-, re-, dis-, pre-) and base words to determine word meanings (ELA.2.V.1.2).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'If "pre-" means before, what does "preheat" mean when baking muffins?'
                  : 'In "Maya checked the preview before reading the chapter," what does "preview" mean?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: '"Preheat" means to heat the oven before putting the muffins inside.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      ['a look afterward', 'a look or view ahead of time', 'a picture with no words', 'a view from behind'],
                      [
                        'Incorrect: "pre-" means before, not after.',
                        'Correct: "pre-" (before) + "view" (see/look) means to look beforehand.',
                        'Incorrect: Not related to missing words.',
                        'Incorrect: "pre-" refers to time before.',
                      ]
                    ),
                    correctAnswer: 'B. a look or view ahead of time',
                  }),
              explanation: 'Knowing "pre-" (before) unlocks everyday academic words like "preview" and "preheat" (ELA.2.V.1.2).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Add "-ful" or "-less" to "care" to describe someone who pays close attention, and explain why.'
                  : 'Which word means "full of joy"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: '"Careful" — "-ful" means full of, so someone who pays close attention is full of care.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      ['joyful', 'joyless', 'rejoy', 'unjoy'],
                      [
                        'Correct: The suffix "-ful" means full of, so "joyful" means full of joy.',
                        'Incorrect: "-less" means without joy.',
                        'Incorrect: Not a standard word.',
                        'Incorrect: Not a standard word.',
                      ]
                    ),
                    correctAnswer: 'A. joyful',
                  }),
              explanation: 'Comparing opposite suffixes "-ful" (full of) and "-less" (without) sharpens Grade 2 vocabulary precision (ELA.2.V.1.2).',
            },
          ],
        },
        {
          title: `Word Builder Challenge: Prefixes & Endings (${gradeLabel})`,
          directions: 'Use base words and affixes to solve each word meaning.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'What does "disagree" mean? Explain using the prefix "dis-" and base word "agree."'
                  : 'If a rainstorm makes a soccer game "unsafe," what does "unsafe" mean?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: '"Dis-" means not or opposite of, so "disagree" means to not agree.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'D',
                      ['very safe', 'safe again', 'safe before', 'not safe'],
                      [
                        'Incorrect: "un-" means not, not very.',
                        'Incorrect: "again" is "re-."',
                        'Incorrect: "before" is "pre-."',
                        'Correct: "un-" + "safe" means not safe.',
                      ]
                    ),
                    correctAnswer: 'D. not safe',
                  }),
              explanation: 'Prefixes "un-" and "dis-" reverse base-word meaning (ELA.2.V.1.2).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Look at the word "teacher." What does the ending "-er" tell you a teacher is?'
                  : 'In "Jada is a fast runner," what does the suffix "-er" tell you about "runner"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: '"-er" means a person who does something, so a teacher is a person who teaches.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      ['a race held outside', 'a person who runs', 'running yesterday', 'without running'],
                      [
                        'Incorrect: "-er" names the doer here, not the place.',
                        'Correct: The suffix "-er" added to an action verb ("run") means a person who runs.',
                        'Incorrect: Past tense is "-ed" or irregular "ran."',
                        'Incorrect: "without" is "-less."',
                      ]
                    ),
                    correctAnswer: 'B. a person who runs',
                  }),
              explanation: 'Suffixes like "-er" (a person who) help students identify noun meanings from familiar verbs (ELA.2.V.1.2).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Write a word with the prefix "re-" (again) and explain what it means in 1 sentence.'
                  : 'Which word means "to pack your bag again"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'Example: "repaint" means to paint something again.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['unpack', 'prepack', 'repack', 'packless'],
                      [
                        'Incorrect: "unpack" means to take items out of a bag.',
                        'Incorrect: "prepack" means to pack ahead of time.',
                        'Correct: "re-" (again) + "pack" means to pack again.',
                        'Incorrect: "packless" is not a standard word.',
                      ]
                    ),
                    correctAnswer: 'C. repack',
                  }),
              explanation: 'Prefix "re-" consistently signals repeating an action (ELA.2.V.1.2).',
            },
          ],
        },
      ];
    }

    if (grade === '3') {
      if (purpose === 'activate' && priorBench) {
        return [
          {
            title: 'Word Parts Bridge: Base Words & Affixes to Greek/Latin Roots (Grade 3)',
            directions:
              'Use what you already know about base words, prefixes, and suffixes to unlock new Grade 3 words with Greek and Latin roots.',
            questions: [
              {
                format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
                prompt:
                  questionType === 'short_response'
                    ? 'Warm-Up Bridge: Break the word "unhelpful" into its prefix, base word, and suffix, and explain what it means in 1 sentence.'
                    : 'Warm-Up Bridge (Prior Knowledge): In the sentence "The torn trail map was unhelpful in the fog," what does the prefix un- and suffix -ful tell you about "unhelpful"?',
                ...(questionType === 'short_response'
                  ? {
                      correctAnswer:
                        '"Un-" means not, "help" is the base word, and "-ful" means full of, so "unhelpful" means not giving help or not useful.',
                      maxSentences: 1,
                    }
                  : {
                      options: makeMcOptions(
                        'C',
                        [
                          'Very easy to read in bright sunlight',
                          'Used again after being folded carefully',
                          'Not full of help or not useful',
                          'Written before the hike started',
                        ],
                        [
                          'Incorrect: Confuses the prefix/suffix meaning with "fog" context.',
                          'Incorrect: "Again" comes from the prefix re-, not un-.',
                          'Correct: Activates Grade 2 mastery of base words and common affixes (un- = not, -ful = full of).',
                          'Incorrect: "Before" comes from the prefix pre-, not un-.',
                        ]
                      ),
                      correctAnswer: 'C. Not full of help or not useful',
                    }),
                explanation: `Activates Grade 2 prerequisite ${priorBench.code} (base words and common prefixes/suffixes un-, re-, pre-, dis-, -ful, -less) as a foundation for Grade 3 morphological analysis (ELA.3.V.1.2).`,
              },
              {
                format:
                  questionType === 'short_response'
                    ? 'short_response'
                    : questionType === 'grammar_editing'
                      ? 'grammar_editing'
                      : 'multiple_choice',
                prompt:
                  questionType === 'short_response'
                    ? 'The Latin root "port" means "carry." Explain in 1 sentence what "portable" means in "a portable water bottle."'
                    : 'Bridge to Grade 3: The Latin root "port" means "carry." Which word means "easy to carry from place to place"?',
                ...(questionType === 'short_response'
                  ? {
                      correctAnswer:
                        '"Port" means carry and "-able" means able to be, so a portable water bottle is easy to carry with you.',
                      maxSentences: 1,
                    }
                  : {
                      options: makeMcOptions(
                        'A',
                        ['portable', 'visible', 'aquatic', 'preview'],
                        [
                          'Correct: Combines Grade 3 Latin root "port" (carry) with suffix "-able" (able to be).',
                          'Incorrect: "Vis" means see ("able to be seen").',
                          'Incorrect: "Aqua" means water ("related to water").',
                          'Incorrect: "Pre-" (before) + "view" (see) means to look ahead.',
                        ]
                      ),
                      correctAnswer: 'A. portable',
                    }),
                explanation: `Bridges Grade 2 affix knowledge (${priorBench.code}) into Grade 3 Appendix D Latin roots ("port" = carry) to determine word meaning (ELA.3.V.1.2).`,
              },
              {
                format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
                prompt:
                  questionType === 'short_response'
                    ? 'Look at the word "revisit" in "We will revisit the spring next month." Use the prefix "re-" and root "vis" (see) to explain its meaning in 1 sentence.'
                    : 'Bridge to Grade 3: If the prefix "re-" means "again" and the Latin root "vis" means "see," what does "revisit" mean in "Let’s revisit the butterfly garden"?',
                ...(questionType === 'short_response'
                  ? {
                      correctAnswer:
                        '"Re-" means again and "vis" means see, so "revisit" means to go see or visit a place again.',
                      maxSentences: 1,
                    }
                  : {
                      options: makeMcOptions(
                        'B',
                        [
                          'Paint a sign for the garden',
                          'Go see or visit the garden again',
                          'Close the garden before noon',
                          'Plant seeds for the first time',
                        ],
                        [
                          'Incorrect: Neither "re-" nor "vis" means paint.',
                          'Correct: Connects Grade 2 prefix "re-" (again) with Grade 3 Latin root "vis" (see).',
                          'Incorrect: Does not mean close.',
                          'Incorrect: "Re-" signals doing something again, not for the first time.',
                        ]
                      ),
                      correctAnswer: 'B. Go see or visit the garden again',
                    }),
                explanation: `Shows Grade 3 students how familiar Grade 2 prefixes (${priorBench.code}) combine with Grade 3 Latin roots ("vis" = see) to unlock new vocabulary (ELA.3.V.1.2).`,
              },
            ],
          },
        ];
      }

      return [
        {
          title: 'Word Builders: Grade 3 Roots & Affixes (vis, port, aqua, re-, un-)',
          directions:
            'Use Grade 3 base words, prefixes, suffixes, and Greek/Latin roots to figure out each word’s meaning.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Use the Latin root "aqua" (water) and the word "aquatic" in 1 clear sentence about a Florida animal.'
                  : 'The Latin root "aqua" means "water." Which phrase best explains the meaning of "aquatic habitats"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'Manatees live in aquatic habitats like warm Florida springs and coastal rivers.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'D',
                      [
                        'Dry desert areas with little rain',
                        'High mountain peaks covered in snow',
                        'Underground caves far from sunlight',
                        'Water environments such as rivers, springs, and oceans',
                      ],
                      [
                        'Incorrect: Deserts are dry land, opposite of "aqua."',
                        'Incorrect: Mountains are elevated land habitats.',
                        'Incorrect: "Aqua" specifically identifies water.',
                        'Correct: "Aquatic" comes from "aqua" (water), referring to water-based environments.',
                      ]
                    ),
                    correctAnswer: 'D. Water environments such as rivers, springs, and oceans',
                  }),
              explanation:
                'Grade 3 Appendix D Latin root "aqua" (water) connects "aquatic" directly to water environments such as rivers, springs, and oceans (ELA.3.V.1.2).',
            },
            {
              format:
                questionType === 'grammar_editing'
                  ? 'grammar_editing'
                  : questionType === 'short_response'
                    ? 'short_response'
                    : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Explain in 1 sentence how the prefix "in-" and the Latin root "vis" (see) combine to give "invisible" its meaning.'
                  : 'The Latin root "vis" means "see." What does "visible" mean in the sentence: "The lighthouse beam was visible from five miles offshore"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'The prefix "in-" means not and the root "vis" means see, so "invisible" means not able to be seen.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      [
                        'Too loud to ignore',
                        'Too heavy to carry',
                        'Able to be seen',
                        'Hidden beneath the waves',
                      ],
                      [
                        'Incorrect: "Aud" relates to hearing, whereas "vis" means see.',
                        'Incorrect: "Port" relates to carrying.',
                        'Correct: "Vis" (see) + "-ible" (able to be) means able to be seen.',
                        'Incorrect: That describes something invisible, not visible.',
                      ]
                    ),
                    correctAnswer: 'C. Able to be seen',
                  }),
              explanation:
                'Recognizing the Grade 3 Latin root "vis" (see) and suffix "-ible" (able to be) defines "visible" accurately in context (ELA.3.V.1.2).',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Explain in 1 sentence how the prefix "dis-" changes the base word "agree" in "disagree."'
                  : 'In the sentence "Scientists inspect sea turtle nests after storms," the root "spect" means "look." What does "inspect" mean?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'The prefix "dis-" means not or opposite of, so "disagree" means to have a different opinion or not agree.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      [
                        'Cover up quickly',
                        'Look closely at to check',
                        'Carry away by boat',
                        'Write down on a map',
                      ],
                      [
                        'Incorrect: Does not match "spect" (look).',
                        'Correct: "In-" (into) + "spect" (look) means to look closely at something.',
                        'Incorrect: Carry corresponds to "port," not "spect."',
                        'Incorrect: Write corresponds to "graph," not "spect."',
                      ]
                    ),
                    correctAnswer: 'B. Look closely at to check',
                  }),
              explanation:
                'Grade 3 students combine common prefixes ("in-", "dis-") with Appendix D roots ("spect" = look) to decode unfamiliar academic vocabulary (ELA.3.V.1.2).',
            },
          ],
        },
      ];
    }

    return [
      {
        title: `Word Detectives: Greek & Latin Roots (${gradeLabel})`,
        directions:
          'Use your knowledge of Greek and Latin roots, prefixes, and suffixes to unlock unfamiliar words.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Break the word "autobiography" into its Greek roots (auto + bio + graph) and write a 1–2 sentence definition in your own words.'
                : 'The Greek root "bio" means "life," and "graph" means "write." What does "autobiography" mean in the sentence: "Jamal checked out an autobiography of his favorite astronaut"?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    '"Auto" means self, "bio" means life, and "graph" means write, so an autobiography is the true story of a person’s life written by that person.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    [
                      'A fictional adventure set in outer space',
                      'The story of a person’s life written by that person',
                      'A science diagram showing how rockets fly',
                      'A book written by many astronauts together',
                    ],
                    [
                      'Incorrect: "Bio" refers to real life, not fiction.',
                      'Correct: "Auto" (self) + "bio" (life) + "graph" (write) means a life story written by oneself.',
                      'Incorrect: Although "graph" relates to writing/drawing, "auto" and "bio" specify a self-written life story.',
                      'Incorrect: "Auto" means self (one person), not many authors.',
                    ]
                  ),
                  correctAnswer: 'B. The story of a person’s life written by that person',
                }),
            explanation:
              'Combining Appendix D Greek roots—"auto" (self), "bio" (life), and "graph" (write)—precisely reveals the meaning "a life story written by oneself" (ELA.V.1.2).',
          },
          {
            format: questionType === 'grammar_editing' ? 'grammar_editing' : questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Look at the word "invisible." Explain in 1 sentence how the prefix "in-" and the root "vis" combine to give the word its meaning.'
                : 'The Latin root "spect" means "to look." Which word means "to look carefully at something to check its quality"?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'The prefix "in-" means not and the root "vis" means see, so "invisible" means not able to be seen.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    ['transport', 'predict', 'inspect', 'audible'],
                    [
                      'Incorrect: "Port" means carry, so "transport" means carry across.',
                      'Incorrect: "Dict" means say/tell, so "predict" means tell beforehand.',
                      'Correct: "In-" (into) + "spect" (look) means to look closely or examine.',
                      'Incorrect: "Aud" means hear, so "audible" means able to be heard.',
                    ]
                  ),
                  correctAnswer: 'C. inspect',
                }),
            explanation:
              'Recognizing the Latin root "spect" (look) distinguishes "inspect" from words built on "port" (carry), "dict" (speak), and "aud" (hear) (ELA.V.1.2).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : questionType === 'grammar_editing' ? 'grammar_editing' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Replace the underlined phrase in this sentence with one word using the root "tele" (far off): "Scientists used a tool for seeing things far away to spot Jupiter’s moons."'
                : 'Which word uses the Greek root "chron" (time) to describe events listed in the order they happened?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'telescope — "tele" (far off) + "scope" (viewing instrument).',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['chronological', 'geography', 'thermometer', 'microscope'],
                    [
                      'Correct: "Chron" means time, so "chronological" means arranged in time order.',
                      'Incorrect: "Geo" means earth and "graph" means write.',
                      'Incorrect: "Therm" means heat and "meter" means measure.',
                      'Incorrect: "Micro" means small and "scope" means viewing instrument.',
                    ]
                  ),
                  correctAnswer: 'A. chronological',
                }),
            explanation:
              'The Greek root "chron" means time; "chronological" refers to events ordered from earliest to latest in time (ELA.V.1.2).',
          },
        ],
      },
      {
        title: `Affix & Root Builders: Water, Light & Shape (${gradeLabel})`,
        directions:
          'Apply base words, prefixes, suffixes, and Greek/Latin roots to figure out each word’s meaning.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Use the Latin root "aqua" (water) and the word "aquatic" in 1 clear sentence about a Florida animal.'
                : 'The Latin root "aqua" means "water." Which phrase best explains the meaning of "aquatic habitats"?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Manatees live in aquatic habitats like warm Florida springs and coastal rivers.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    [
                      'Dry desert areas with little rain',
                      'High mountain peaks covered in snow',
                      'Underground caves far from sunlight',
                      'Water environments such as rivers, springs, and oceans',
                    ],
                    [
                      'Incorrect: Deserts are dry land, opposite of "aqua."',
                      'Incorrect: Mountains are elevated land habitats.',
                      'Incorrect: "Aqua" specifically identifies water.',
                      'Correct: "Aquatic" comes from "aqua" (water), referring to water-based environments.',
                    ]
                  ),
                  correctAnswer: 'D. Water environments such as rivers, springs, and oceans',
                }),
            explanation:
              'Knowing the Latin root "aqua" (water) connects "aquatic" directly to water environments such as rivers, springs, and oceans (ELA.V.1.2).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'grammar_editing',
            prompt:
              questionType === 'short_response'
                ? 'How does adding the prefix "multi-" change the meaning of the root word "purpose" in "multipurpose room"? Answer in 1 sentence.'
                : 'Read the sentence: "The prefix re- in \'reconstruct\' tells the reader that the team had to _____ the bridge."',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    '"Multi-" means many, so a multipurpose room is a room used for many different purposes.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    [
                      'destroy the bridge permanently',
                      'build the bridge again',
                      'paint the bridge for the first time',
                      'measure the bridge from below',
                    ],
                    [
                      'Incorrect: "Re-" does not mean destroy.',
                      'Correct: "Re-" means again, so "reconstruct" means to build again.',
                      'Incorrect: "Construct" means build, not paint.',
                      'Incorrect: Neither "re-" nor "construct" means measure.',
                    ]
                  ),
                  correctAnswer: 'B. build the bridge again',
                }),
            explanation:
              'The prefix "re-" means again or back, and "construct" means build, so "reconstruct" means to build again (ELA.V.1.2).',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Explain in 1 sentence how the suffix "-less" changes the word "care" in "careless."'
                : 'Which word uses the Greek root "photo" (light) and "graph" (write/record)?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'The suffix "-less" means without, so "careless" means acting without care or attention.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    ['perimeter', 'submarine', 'photograph', 'microphone'],
                    [
                      'Incorrect: "Peri" (around) + "meter" (measure) means distance around a shape.',
                      'Incorrect: "Sub" (under) + "mar" (sea) means under the sea.',
                      'Correct: "Photo" (light) + "graph" (write/record) means an image captured with light.',
                      'Incorrect: "Micro" (small) + "phone" (sound) amplifies small sounds.',
                    ]
                  ),
                  correctAnswer: 'C. photograph',
                }),
            explanation:
              '"Photo" means light and "graph" means write or record, forming "photograph"—an image recorded using light (ELA.V.1.2).',
          },
        ],
      },
    ];
  }

  // K-2 Context Clues & Academic Vocabulary (V.1.1 / V.1.3)
  if (grade === 'K' || grade === '1' || grade === '2') {
    return [
      {
        title:
          purpose === 'activate' && priorBench
            ? `${formatGradeLabel(priorBench.grade)} → ${gradeLabel} Vocabulary Bridge: Context Clues & Word Meanings`
            : `Garden Clues: Word Meanings in Context (${gradeLabel})`,
        directions:
          'Listen to or read the short story, then use sentence clues to figure out what the underlined or highlighted words mean.',
        sourceTextLabel: 'Mini-Passage',
        sourceText:
          'Ava spotted a tiny frog resting on a broad, flat lily pad. Because the pond water was chilly, the frog sat completely still in a sunny patch to warm up. Soon a bright dragonfly zoomed past, and the frog gave one huge leap to snap at its lunch!',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'What does "chilly" mean in Sentence 2 ("the pond water was chilly, so the frog sat... in a sunny patch to warm up")? Tell which clue helped you.'
                : 'In Sentence 2 ("Because the pond water was chilly, the frog sat... in a sunny patch to warm up"), what does "chilly" mean?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    '"Chilly" means cold or cool; the clue "in a sunny patch to warm up" shows the frog needed heat.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['Cool or cold', 'Very muddy', 'Deep and dark', 'Boiling hot'],
                    [
                      'Correct: Sitting in a sunny patch "to warm up" proves the pond water was cold.',
                      'Incorrect: Mud is not mentioned.',
                      'Incorrect: Depth is not mentioned.',
                      'Incorrect: If it were hot, the frog would not need sun to warm up.',
                    ]
                  ),
                  correctAnswer: 'A. Cool or cold',
                }),
            explanation: `Context clues ("in a sunny patch to warm up") help ${gradeLabel} readers infer word meanings accurately (${bench.code}).`,
            textualEvidence: '"Because the pond water was chilly, the frog sat... in a sunny patch to warm up."',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Look at the word "broad" in "a broad, flat lily pad." What word right next to it or in the story helps you picture a lily pad?'
                : 'What does "huge leap" mean in the last sentence?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: '"Broad" means wide across, giving the tiny frog plenty of flat space to rest.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    ['A quiet nap', 'A tiny splash', 'A slow crawl', 'A very big jump'],
                    [
                      'Incorrect: The frog was trying to catch a dragonfly.',
                      'Incorrect: A leap is a jump, not a splash.',
                      'Incorrect: Zooming past calls for quick action, not a slow crawl.',
                      'Correct: "Huge" means very big and "leap" means jump.',
                    ]
                  ),
                  correctAnswer: 'D. A very big jump',
                }),
            explanation: `Using surrounding action clues clarifies descriptive words like "broad" and "huge leap" (${bench.code}).`,
            textualEvidence: '"the frog gave one huge leap to snap at its lunch!"',
          },
        ],
      },
      {
        title: `Multiple-Meaning Word Clues: Bark, Park & Watch (${gradeLabel})`,
        directions: 'Use the sentence clues to pick the exact meaning of each multiple-meaning word.',
        sourceTextLabel: 'Mini-Passage',
        sourceText:
          'Sam and his puppy walked along the shady park trail. Near a tall oak tree, the puppy sniffed the rough brown bark on the trunk. Then a squirrel ran up a branch, and the puppy gave one loud bark before wagging its tail happily.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'The word "bark" is used twice in this story with two different meanings. Explain both meanings in 1–2 sentences.'
                : 'What does "bark" mean in Sentence 2 ("the puppy sniffed the rough brown bark on the trunk")?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'First, "bark" means the rough outer covering on a tree trunk; second, "bark" means the loud sound a dog makes.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    ['A loud sound made by a dog', 'The rough outer covering of a tree', 'A small wooden sailboat', 'To play fetch at the park'],
                    [
                      'Incorrect: That fits the second time "bark" appears in Sentence 3, not Sentence 2.',
                      'Correct: "Rough brown" and "on the trunk" point to tree bark.',
                      'Incorrect: No boat appears in the story.',
                      'Incorrect: "Bark" is not playing fetch.',
                    ]
                  ),
                  correctAnswer: 'B. The rough outer covering of a tree',
                }),
            explanation: `Comparing surrounding clues ("rough brown... on the trunk" vs. "loud... puppy") unlocks multiple-meaning words (${bench.code}).`,
            textualEvidence: '"sniffed the rough brown bark on the trunk"',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'What does "shady" mean in "the shady park trail"? How does the "tall oak tree" help explain it?'
                : 'In Sentence 3, which clue tells you what the second "bark" means?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    '"Shady" means out of the hot sun in the shade made by the tall oak tree.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    ['"rough brown"', '"on the trunk"', '"the puppy gave one loud bark"', '"shady park trail"'],
                    [
                      'Incorrect: Describes tree bark.',
                      'Incorrect: Locates tree bark.',
                      'Correct: "the puppy gave one loud..." identifies the dog’s sound.',
                      'Incorrect: Describes the path.',
                    ]
                  ),
                  correctAnswer: 'C. "the puppy gave one loud bark"',
                }),
            explanation: `Word relationships and context clues clarify multiple-meaning nouns and verbs (${bench.code}).`,
          },
        ],
      },
    ];
  }

  // Context Clues & Multiple-Meaning Words (V.1.3 / V.1.1) Grades 3-5
  if (purpose === 'activate' && priorBench) {
    return [
      {
        title: `${formatGradeLabel(priorBench.grade)} → ${gradeLabel} Context Clues Bridge: Tide Pools & Multiple Meanings`,
        directions:
          'Use familiar context clues and multiple-meaning word strategies from last year to unlock ' +
          gradeLabel +
          ' academic vocabulary.',
        sourceTextLabel: 'Informational Mini-Passage',
        sourceText:
          'At low tide along Florida’s Gulf Coast, shallow pools form between jagged limestone rocks. Inside these clear pools, tiny hermit crabs scurry across mossy shells while juvenile fish dart beneath flat stones to stay hidden from hungry herons. Because sunlight warms the trapped water quickly, the creatures living there must be resilient—able to handle sudden changes in temperature and salt levels until the incoming tide refreshes their tiny ocean home.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Warm-Up Bridge: The word "pool" can mean a backyard swimming spot or a natural pocket of water. Which clue in sentence 1 shows what "shallow pools" means here?'
                : 'Warm-Up Bridge (Prior Knowledge): Which sentence clue helps clarify the meaning of the multiple-meaning word "pools" in sentence 1?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Clues like "At low tide along Florida’s Gulf Coast" and "between jagged limestone rocks" show "pools" means natural pockets of ocean water left at low tide.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    [
                      '"tiny hermit crabs"',
                      '"At low tide along Florida’s Gulf Coast... between jagged limestone rocks"',
                      '"hungry herons"',
                      '"sunny beaches"',
                    ],
                    [
                      'Incorrect: Names an animal inside the pool rather than defining the pool itself.',
                      'Correct: Activates prior-grade multiple-meaning and context-clue strategies using coastal setting clues.',
                      'Incorrect: Names a predator nearby.',
                      'Incorrect: Phrase not used in the passage.',
                    ]
                  ),
                  correctAnswer:
                    'B. "At low tide along Florida’s Gulf Coast... between jagged limestone rocks"',
                }),
            explanation: `Activates prior-grade ${priorBench.code} (using context clues for multiple-meaning words) before bridging into Grade ${grade} academic vocabulary (${bench.code}).`,
            textualEvidence: '"At low tide along Florida’s Gulf Coast, shallow pools form between jagged limestone rocks."',
          },
          {
            format:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'short_response'
                : questionType === 'grammar_editing'
                  ? 'grammar_editing'
                  : 'multiple_choice',
            prompt:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'Bridge to Grade ' +
                  grade +
                  ': What does the word "resilient" mean in the final sentence, and which exact text clue defines it?'
                : 'Bridge to Grade ' +
                  grade +
                  ': Based on the sentence "...the creatures living there must be resilient—able to handle sudden changes in temperature and salt levels...", what does "resilient" mean?',
            ...(questionType === 'short_response' || questionType === 'mixed'
              ? {
                  correctAnswer:
                    '"Resilient" means able to adjust and survive sudden changes; the dash directly defines it as "able to handle sudden changes in temperature and salt levels."',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    [
                      'Able to adjust and stay healthy during sudden changes',
                      'Brightly colored so predators cannot see them',
                      'Too delicate to survive outside deep ocean water',
                      'Moving slowly across smooth sandy beaches',
                    ],
                    [
                      'Correct: Bridges basic context clues into Grade ' +
                        grade +
                        ' appositive/dash definition clues for Tier 2 vocabulary.',
                      'Incorrect: Color is not mentioned.',
                      'Incorrect: Contradicts the definition clue.',
                      'Incorrect: Movement speed is not what "resilient" describes.',
                    ]
                  ),
                  correctAnswer: 'A. Able to adjust and stay healthy during sudden changes',
                }),
            explanation: `Connects prior-grade context-clue habits (${priorBench.code}) to Grade ${grade} academic vocabulary analysis using an em-dash definition clue (${bench.code}).`,
            textualEvidence: '"resilient—able to handle sudden changes in temperature and salt levels"',
          },
        ],
      },
      {
        title: `Grade ${priorBench.grade} → Grade ${grade} Vocabulary Bridge: The Lantern Keeper’s Signal`,
        directions:
          'Use prior-grade context clue strategies for multiple-meaning words to analyze academic words in Grade ' +
          grade +
          '.',
        sourceTextLabel: 'Literary Mini-Passage',
        sourceText:
          'Before dusk settled over the inlet, Nora climbed the winding iron stairs of the old lighthouse. She adjusted the heavy brass spring inside the clockwork mechanism so the lamp would rotate smoothly all night. From the narrow walkway outside, she spotted a tiny fishing skiff pitching gently on the dark swells. Nora tapped the glass lens to clear a speck of sea salt, relieved that the steady beam would guide the boat safely toward harbor.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Warm-Up Bridge: "Spring" is a multiple-meaning word. What does "spring" mean in sentence 2, and which clue tells you?'
                : 'Warm-Up Bridge (Prior Knowledge): Which meaning of the multiple-meaning word "spring" fits sentence 2 ("the heavy brass spring inside the clockwork mechanism")?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Here "spring" means a coiled metal machine part, shown by clues like "heavy brass" and "inside the clockwork mechanism."',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    [
                      'The warm season between winter and summer',
                      'A natural flow of fresh water from the ground',
                      'To leap suddenly upward into the air',
                      'A coiled metal part that helps power a machine',
                    ],
                    [
                      'Incorrect: A season cannot be made of "heavy brass."',
                      'Incorrect: Freshwater springs are outdoor water sources.',
                      'Incorrect: Here "spring" is a noun modified by "heavy brass."',
                      'Correct: Activates prior-grade multiple-meaning word skills (' +
                        priorBench.code +
                        ') using surrounding sentence clues.',
                    ]
                  ),
                  correctAnswer: 'D. A coiled metal part that helps power a machine',
                }),
            explanation: `Activates prior-grade ${priorBench.code} (determining multiple-meaning words from sentence clues) before Grade ${grade} academic vocabulary inference (${bench.code}).`,
            textualEvidence: '"the heavy brass spring inside the clockwork mechanism"',
          },
          {
            format:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'short_response'
                : questionType === 'grammar_editing'
                  ? 'grammar_editing'
                  : 'multiple_choice',
            prompt:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'Bridge to Grade ' +
                  grade +
                  ': Use context clues to explain what "skiff" means in the passage in 1–2 sentences.'
                : 'Bridge to Grade ' +
                  grade +
                  ': Which context clue in the passage helps define "skiff"?',
            ...(questionType === 'short_response' || questionType === 'mixed'
              ? {
                  correctAnswer:
                    'A "skiff" is a small boat, shown by the phrases "pitching gently on the dark swells" and "guide the boat safely toward harbor."',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    [
                      '"climbed the winding iron stairs"',
                      '"pitching gently on the dark swells... guide the boat safely toward harbor"',
                      '"cleared a speck of sea salt"',
                      '"adjusted the heavy brass spring"',
                    ],
                    [
                      'Incorrect: Describes Nora climbing the stairs.',
                      'Correct: Bridges multiple-meaning review to synonym/restatement context clues ("the boat") in Grade ' +
                        grade +
                        ' (' +
                        bench.code +
                        ').',
                      'Incorrect: Describes cleaning the lens.',
                      'Incorrect: Describes winding the lamp.',
                    ]
                  ),
                  correctAnswer:
                    'B. "pitching gently on the dark swells... guide the boat safely toward harbor"',
                }),
            explanation: `Connects prior-grade multiple-meaning clues (${priorBench.code}) to Grade ${grade} restatement context clues (${bench.code}).`,
            textualEvidence: '"a tiny fishing skiff pitching gently... guide the boat safely toward harbor"',
          },
        ],
      },
    ];
  }

  return [
    {
      title: `Cedar Key Tide Pool: Context Clues Warm-Up (Grade ${grade})`,
      directions:
        'Read the short passage carefully, then answer both questions using context clues from the text.',
      sourceTextLabel: 'Informational Mini-Passage',
      sourceText:
        'At low tide along Florida’s Gulf Coast, shallow pools form between jagged limestone rocks. Inside these clear pools, tiny hermit crabs scurry across mossy shells while juvenile fish dart beneath flat stones to stay hidden from hungry herons. Because sunlight warms the trapped water quickly, the creatures living there must be resilient—able to handle sudden changes in temperature and salt levels until the incoming tide refreshes their tiny ocean home.',
      questions: [
        {
          format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
          prompt:
            questionType === 'short_response'
              ? 'What does the word "resilient" mean in the passage? Explain in 1–2 sentences which clues in the text helped you determine its meaning.'
              : 'Read this sentence from the passage: "...the creatures living there must be resilient—able to handle sudden changes in temperature and salt levels..." What does the word "resilient" mean as used in the passage?',
          ...(questionType === 'short_response'
            ? {
                correctAnswer:
                  '"Resilient" means tough and able to adjust quickly to difficult changes. The dash in the sentence defines it directly as "able to handle sudden changes in temperature and salt levels."',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'A',
                  [
                    'Able to adjust and stay healthy during sudden changes',
                    'Brightly colored so predators cannot see them',
                    'Too delicate to survive outside deep ocean water',
                    'Moving slowly across smooth sandy beaches',
                  ],
                  [
                    'Correct: The appositive clue right after the dash defines "resilient" as able to handle sudden changes.',
                    'Incorrect: Being brightly colored is not mentioned as the meaning of "resilient."',
                    'Incorrect: Tide-pool creatures are the opposite of too delicate; they survive changing conditions.',
                    'Incorrect: Crabs scurry across mossy shells, which does not define "resilient."',
                  ]
                ),
                correctAnswer: 'A. Able to adjust and stay healthy during sudden changes',
              }),
          explanation:
            'The author provides a direct definition clue immediately after the em-dash: "able to handle sudden changes in temperature and salt levels" (ELA.V.1.3).',
          textualEvidence:
            '"resilient—able to handle sudden changes in temperature and salt levels"',
        },
        {
          format:
            questionType === 'grammar_editing'
              ? 'grammar_editing'
              : questionType === 'short_response' || questionType === 'mixed'
                ? 'short_response'
                : 'multiple_choice',
          prompt:
            questionType === 'short_response' || questionType === 'mixed'
              ? 'Based on the passage, what does the word "juvenile" mean in "juvenile fish"? Cite one clue from the passage in your 1–2 sentence answer.'
              : 'Which phrase from the passage helps the reader understand the meaning of "refreshes" in the final sentence?',
          ...(questionType === 'short_response' || questionType === 'mixed'
            ? {
                correctAnswer:
                  '"Juvenile" means young or not yet full-grown. Earlier in the sentence, the passage mentions "tiny hermit crabs" and describes the fish darting "beneath flat stones" to hide from herons.',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'C',
                  [
                    '"jagged limestone rocks"',
                    '"hungry herons"',
                    '"warms the trapped water quickly... until the incoming tide"',
                    '"scurry across mossy shells"',
                  ],
                  [
                    'Incorrect: Describes the rocks around the pool, not how water is renewed.',
                    'Incorrect: Names a predator, not the renewal of water.',
                    'Correct: Contrast between warm "trapped water" and "incoming tide" shows "refreshes" means brings clean, cooler water back in.',
                    'Incorrect: Describes crab movement, not the tide refreshing the pool.',
                  ]
                ),
                correctAnswer: 'C. "warms the trapped water quickly... until the incoming tide"',
              }),
          explanation:
            'Using contrast and cause-and-effect context clues shows how the incoming tide cools and renews the trapped, sun-warmed water (ELA.V.1.3).',
          textualEvidence:
            '"sunlight warms the trapped water quickly... until the incoming tide refreshes their tiny ocean home."',
        },
      ],
    },
    {
      title: `The Lantern Keeper’s Signal: Multiple-Meaning Words (Grade ${grade})`,
      directions:
        'Read the short literary excerpt, then use sentence clues to determine word meanings.',
      sourceTextLabel: 'Literary Mini-Passage',
      sourceText:
        'Before dusk settled over the inlet, Nora climbed the winding iron stairs of the old lighthouse. She adjusted the heavy brass spring inside the clockwork mechanism so the lamp would rotate smoothly all night. From the narrow walkway outside, she spotted a tiny fishing skiff pitching gently on the dark swells. Nora tapped the glass lens to clear a speck of sea salt, relieved that the steady beam would guide the boat safely toward harbor.',
      questions: [
        {
          format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
          prompt:
            questionType === 'short_response'
              ? 'The word "spring" has more than one meaning. Explain what "spring" means in the second sentence and cite a clue from the passage.'
              : 'Read this sentence from the passage: "She adjusted the heavy brass spring inside the clockwork mechanism so the lamp would rotate smoothly all night." Which meaning of "spring" fits this sentence?',
          ...(questionType === 'short_response'
            ? {
                correctAnswer:
                  'In this sentence, "spring" means a coiled metal machine part. Clues like "heavy brass" and "inside the clockwork mechanism" show it is a mechanical part rather than a season or water source.',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'D',
                  [
                    'The warm season between winter and summer',
                    'A natural flow of fresh water from the ground',
                    'To leap suddenly upward into the air',
                    'A coiled metal part that helps power a machine',
                  ],
                  [
                    'Incorrect: A season cannot be made of "heavy brass" inside a mechanism.',
                    'Incorrect: Freshwater springs are outdoor water sources, not clockwork parts.',
                    'Incorrect: Here "spring" is a noun modified by "heavy brass," not an action verb.',
                    'Correct: "Heavy brass" and "inside the clockwork mechanism" confirm the mechanical noun meaning.',
                  ]
                ),
                correctAnswer: 'D. A coiled metal part that helps power a machine',
              }),
          explanation:
            'Context clues ("heavy brass," "inside the clockwork mechanism," and "rotate smoothly") narrow the multiple-meaning word "spring" to its mechanical definition (ELA.V.1.3).',
          textualEvidence: '"the heavy brass spring inside the clockwork mechanism"',
        },
        {
          format:
            questionType === 'short_response' || questionType === 'mixed'
              ? 'short_response'
              : questionType === 'grammar_editing'
                ? 'grammar_editing'
                : 'multiple_choice',
          prompt:
            questionType === 'short_response' || questionType === 'mixed'
              ? 'What does the word "swells" mean in "pitching gently on the dark swells"? Use evidence from the sentence to explain your answer in 1–2 sentences.'
              : 'Which context clue helps the reader understand that a "skiff" is a type of boat?',
          ...(questionType === 'short_response' || questionType === 'mixed'
            ? {
                correctAnswer:
                  '"Swells" means rolling ocean waves. The boat is "pitching gently" on them near the inlet and harbor.',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'B',
                  [
                    '"climbing the winding iron stairs"',
                    '"pitching gently on the dark swells... guide the boat safely toward harbor"',
                    '"cleared a speck of sea salt"',
                    '"adjusted the heavy brass spring"',
                  ],
                  [
                    'Incorrect: Describes Nora inside the lighthouse.',
                    'Correct: Moving on water swells and being called "the boat" in the next sentence directly identifies "skiff" as a small boat.',
                    'Incorrect: Describes cleaning the lighthouse lens.',
                    'Incorrect: Describes winding the lamp mechanism.',
                  ]
                ),
                correctAnswer:
                  'B. "pitching gently on the dark swells... guide the boat safely toward harbor"',
              }),
          explanation:
            'In the final sentence, the author refers back to the "skiff" as "the boat," confirming its meaning through synonym/restatement clues (ELA.V.1.3).',
          textualEvidence: '"a tiny fishing skiff pitching gently... guide the boat safely toward harbor"',
        },
      ],
    },
  ];
}

function buildReadingTemplates(
  grade: GradeLevel,
  bench: FloridaBenchmark,
  questionType: BellringerQuestionType,
  purpose: BellringerPurpose,
  priorBench?: FloridaBenchmark
): FallbackTemplate[] {
  const gradeLabel = formatGradeLabel(grade);
  const isPoetry = bench.code.includes('.R.1.4');
  const isArgument = bench.code.includes('.R.2.4');
  const isInformational = bench.reportingCategory === 'reading-informational-text' || bench.code.includes('.R.2.');
  const isFigurative = bench.code.includes('.R.3.1');

  if (isPoetry) {
    if (grade === 'K' || grade === '1' || grade === '2') {
      return [
        {
          title:
            purpose === 'activate' && priorBench
              ? `${formatGradeLabel(priorBench.grade)} → ${gradeLabel} Poetry Bridge: Rhyme, Rhythm & Stanzas`
              : `Sunny Bay Poem: Rhyme & Line Patterns (${gradeLabel})`,
          directions:
            'Listen to or read the short poem twice to notice rhyming words, stanzas, and steady beat.',
          sourceTextLabel: 'Short Poem',
          sourceText:
            'Little crabs tiptoe across the sand, / Searching for seashells along the land.  /  Blue waves tickle my sandy toes, / Where does the dancing ocean go?',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Name one pair of rhyming words in the poem and tell how you know they rhyme.'
                  : 'Which two words in the first two lines rhyme?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      '"Sand" and "land" rhyme (and "toes"/"go" nearly echo, or "sand"/"land" share the exact "-and" ending sound).',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      ['sand and land', 'crabs and shells', 'blue and toes', 'waves and ocean'],
                      [
                        'Correct: "sand" and "land" share the same ending sound /-and/.',
                        'Incorrect: "crabs" and "shells" do not rhyme.',
                        'Incorrect: "blue" and "toes" do not rhyme.',
                        'Incorrect: "waves" and "ocean" do not rhyme.',
                      ]
                    ),
                    correctAnswer: 'A. sand and land',
                  }),
              explanation: `Identifying end rhymes and repeated beats builds foundational poetry analysis (${bench.code}).`,
              textualEvidence: '"Little crabs tiptoe across the sand, / Searching for seashells along the land."',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'What happens when the "blue waves tickle my sandy toes"? Write 1 short sentence telling what the poem helps you picture.'
                  : 'How many lines are in this short poem?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'It helps you picture gentle ocean waves washing lightly over your bare feet on the beach.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['2 lines', '3 lines', '4 lines', '8 lines'],
                      [
                        'Incorrect: There are two rhyming pairs across four lines.',
                        'Incorrect: Count each line separated by a slash/break.',
                        'Correct: The poem has 4 poetic lines arranged in two couplets.',
                        'Incorrect: There are 4 lines, not 8.',
                      ]
                    ),
                    correctAnswer: 'C. 4 lines',
                  }),
              explanation: `Recognizing poem lines, rhyme, and imagery strengthens early poetry comprehension (${bench.code}).`,
            },
          ],
        },
        {
          title: `Raindrop Song: Stanzas & Rhythm (${gradeLabel})`,
          directions: 'Read the poem slowly and listen for rhyming ends and repeated sounds.',
          sourceTextLabel: 'Short Poem',
          sourceText:
            'Pitter-pat drops fall down from the sky, / Puddles grow wide while the gray clouds drift by.  /  Boots go splash as we hop down the street, / Rainy-day puddles make playtime so sweet!',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Which two words at the ends of lines 3 and 4 rhyme? What happens in those lines?'
                  : 'What is the rhyme pattern of this 4-line poem ("sky / by / street / sweet")?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: '"Street" and "sweet" rhyme; the children splash through puddles in their boots.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      ['ABAB', 'AABB', 'ABCD', 'No rhymes'],
                      [
                        'Incorrect: Line 1 ("sky") rhymes with line 2 ("by"), not line 3 ("street").',
                        'Correct: Lines 1–2 rhyme (sky/by) and lines 3–4 rhyme (street/sweet) for an AABB pattern.',
                        'Incorrect: Both pairs of lines rhyme.',
                        'Incorrect: Four end words form two rhyming pairs.',
                      ]
                    ),
                    correctAnswer: 'B. AABB',
                  }),
              explanation: `Noticing AABB rhyme schemes and rhythmic sound words ("pitter-pat," "splash") develops early poetry craft (${bench.code}).`,
              textualEvidence: '"sky / by / street / sweet"',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Which sound word in the poem helps you HEAR the rain or puddles?'
                  : 'How does the speaker feel about the rainy day in this poem?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: '"Pitter-pat" (and "splash") helps the reader hear the falling drops and jumping boots.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'D',
                      ['Sad and bored indoors', 'Afraid of dark clouds', 'Angry about wet shoes', 'Happy and playful splashing outside'],
                      [
                        'Incorrect: The speaker is outside playing.',
                        'Incorrect: No fear is expressed.',
                        'Incorrect: The boots splash joyfully.',
                        'Correct: Calling playtime "so sweet" shows the speaker enjoys the rain.',
                      ]
                    ),
                    correctAnswer: 'D. Happy and playful splashing outside',
                  }),
              explanation: `Poets use sound words and rhyming rhythm to create mood (${bench.code}).`,
              textualEvidence: '"Rainy-day puddles make playtime so sweet!"',
            },
          ],
        },
      ];
    }

    if (grade === '3') {
      return [
        {
          title:
            purpose === 'activate'
              ? 'Grade 2 → Grade 3 Poetry Warm-Up: Rhyme Patterns to Poem Types'
              : 'Pelican Bay Poems: Haiku & Rhymed Verse (Grade 3)',
          directions:
            'Read both short poems carefully, noticing the rhyme pattern and syllable structure of each poem.',
          sourceTextLabel: 'Two Short Poems',
          sourceText:
            'Poem 1: Silver ripples gleam / Pelicans glide past the pier / Quiet morning tide.  |  Poem 2: Red oars dip inside the bay, / Sending shiny drops of spray. / Herons stand along the shore, / Watching boats glide past the door.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                purpose === 'activate'
                  ? questionType === 'short_response'
                    ? 'Warm-Up Bridge: Identify the rhyme scheme of Poem 2 (such as AABB or ABAB) and explain how you know in 1 sentence.'
                    : 'Warm-Up Bridge (Prior Knowledge): What is the rhyme scheme of Poem 2?'
                  : questionType === 'short_response'
                    ? 'Identify which type of poem Poem 2 is (free verse, rhymed verse, haiku, or limerick) and cite a rhyming pair in 1–2 sentences.'
                    : 'Which type of poem is Poem 2?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      purpose === 'activate'
                        ? 'Poem 2 uses an AABB rhyme scheme because lines 1 and 2 rhyme ("bay"/"spray") and lines 3 and 4 rhyme ("shore"/"door").'
                        : 'Poem 2 is rhymed verse because its lines follow a clear AABB end-rhyme pattern ("bay"/"spray" and "shore"/"door").',
                    maxSentences: 2,
                  }
                : {
                    options: makeMcOptions(
                      purpose === 'activate' ? 'A' : 'B',
                      purpose === 'activate'
                        ? ['AABB', 'ABAB', 'ABBA', 'No rhyme scheme']
                        : ['Haiku', 'Rhymed verse', 'Limerick', 'Free verse'],
                      purpose === 'activate'
                        ? [
                            'Correct: Activates Grade 2 mastery (ELA.2.R.1.4)—lines 1–2 rhyme (bay/spray) and lines 3–4 rhyme (shore/door).',
                            'Incorrect: Alternating lines (bay/shore) do not rhyme.',
                            'Incorrect: Lines 1 and 4 (bay/door) do not rhyme.',
                            'Incorrect: Each pair of lines ends with rhyming words.',
                          ]
                        : [
                            'Incorrect: A haiku has 3 unrhymed lines with 5-7-5 syllables; Poem 2 has 4 rhyming lines.',
                            'Correct: Poem 2 is rhymed verse using an AABB end-rhyme pattern.',
                            'Incorrect: A limerick has 5 humorous lines with an AABBA rhyme scheme.',
                            'Incorrect: Free verse does not follow a regular rhyme scheme.',
                          ]
                    ),
                    correctAnswer: purpose === 'activate' ? 'A. AABB' : 'B. Rhymed verse',
                  }),
              explanation:
                purpose === 'activate' && priorBench
                  ? `Activates Grade 2 prerequisite ${priorBench.code} (identifying rhyme schemes such as AABB/ABAB) before classifying Grade 3 poem types in ELA.3.R.1.4.`
                  : 'Poem 2 uses regular end rhymes in pairs (bay/spray, shore/door), which identifies it as rhymed verse (ELA.3.R.1.4).',
              textualEvidence: '"bay... spray... shore... door"',
            },
            {
              format:
                questionType === 'short_response' || questionType === 'mixed'
                  ? 'short_response'
                  : questionType === 'grammar_editing'
                    ? 'grammar_editing'
                    : 'multiple_choice',
              prompt:
                questionType === 'short_response' || questionType === 'mixed'
                  ? 'Why is Poem 1 classified as a haiku instead of free verse or rhymed verse? Answer in 1–2 sentences using details from Poem 1.'
                  : 'Based on its structure, what type of poem is Poem 1?',
              ...(questionType === 'short_response' || questionType === 'mixed'
                ? {
                    correctAnswer:
                      'Poem 1 is a haiku because it has 3 unrhymed lines about nature following a 5-7-5 syllable pattern ("Sil-ver rip-ples gleam" = 5, "Pel-i-cans glide past the pier" = 7, "Qui-et morn-ing tide" = 5).',
                    maxSentences: 2,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      ['Limerick', 'Rhymed verse', 'Haiku', 'Free verse'],
                      [
                        'Incorrect: A limerick has 5 lines with an AABBA rhyme pattern.',
                        'Incorrect: Poem 1 has no end rhymes ("gleam" / "pier" / "tide").',
                        'Correct: Poem 1 has 3 nature-focused lines following the 5-7-5 syllable pattern of a haiku.',
                        'Incorrect: Although unrhymed, Poem 1 follows the strict 3-line, 5-7-5 syllable structure of a haiku.',
                      ]
                    ),
                    correctAnswer: 'C. Haiku',
                  }),
              explanation:
                'Grade 3 benchmark ELA.3.R.1.4 requires distinguishing four poem types: free verse, rhymed verse, haiku (3 lines, 5-7-5 syllables), and limerick (5 lines, AABBA).',
              textualEvidence: '"Silver ripples gleam / Pelicans glide past the pier / Quiet morning tide."',
            },
          ],
        },
        {
          title: 'Porch Swing Limerick & Free Verse (Grade 3)',
          directions:
            'Read both short poems and examine their line structure, rhythm, and rhyme.',
          sourceTextLabel: 'Two Short Poems',
          sourceText:
            'Poem A: A lively young lizard named Lou / Wore sneakers of bright ocean blue. / He raced up a pine, / Left shadows behind, / And waved from the treetop view!  |  Poem B: Warm wind bends the tall sea oats / along sandy dunes / while Pelicans sketch quiet arcs / above evening waves.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Explain in 1–2 sentences how you know Poem A is a limerick.'
                  : 'Which features show that Poem A is a limerick?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'Poem A is a limerick because it is a playful 5-line poem with an AABBA rhyme scheme ("Lou"/"blue"/"view" and "pine"/"behind").',
                    maxSentences: 2,
                  }
                : {
                    options: makeMcOptions(
                      'D',
                      [
                        'Three unrhymed lines with 5-7-5 syllables',
                        'Four lines with no rhythm or rhyme pattern',
                        'Two stanzas describing scientific facts',
                        'Five playful lines following an AABBA rhyme pattern',
                      ],
                      [
                        'Incorrect: That describes a haiku.',
                        'Incorrect: Free verse has no set rhyme or meter.',
                        'Incorrect: Limericks are light, rhythmic 5-line poems.',
                        'Correct: Limericks have 5 lines with bouncy meter and an AABBA rhyme scheme.',
                      ]
                    ),
                    correctAnswer: 'D. Five playful lines following an AABBA rhyme pattern',
                  }),
              explanation:
                'Poem A matches the defining structure of a Grade 3 limerick: five playful lines with an AABBA rhyme pattern (ELA.3.R.1.4).',
              textualEvidence: '"Lou / blue / pine / behind / view"',
            },
            {
              format:
                questionType === 'short_response' || questionType === 'mixed'
                  ? 'short_response'
                  : questionType === 'grammar_editing'
                    ? 'grammar_editing'
                    : 'multiple_choice',
              prompt:
                questionType === 'short_response' || questionType === 'mixed'
                  ? 'What type of poem is Poem B, and how is its structure different from Poem A? Write 1–2 sentences.'
                  : 'What type of poem is Poem B?',
              ...(questionType === 'short_response' || questionType === 'mixed'
                ? {
                    correctAnswer:
                      'Poem B is free verse because it does not use end rhymes or a fixed syllable/rhyme pattern, unlike Poem A’s AABBA limerick structure.',
                    maxSentences: 2,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      ['Free verse', 'Haiku', 'Limerick', 'Rhymed verse'],
                      [
                        'Correct: Poem B has natural line breaks without a fixed rhyme scheme or strict syllable count.',
                        'Incorrect: Poem B has 4 lines and does not follow 5-7-5 syllables.',
                        'Incorrect: Poem B has neither 5 lines nor AABBA rhyme.',
                        'Incorrect: Lines ending in oats/dunes/arcs/waves do not rhyme.',
                      ]
                    ),
                    correctAnswer: 'A. Free verse',
                  }),
              explanation:
                'Free verse uses imagery and intentional line breaks without regular rhyme or fixed meter (ELA.3.R.1.4).',
              textualEvidence: '"Warm wind bends the tall sea oats / along sandy dunes"',
            },
          ],
        },
      ];
    }

    return [
      {
        title: `Lanterns on the Dock: Rhyme, Stanzas & Poetic Elements (Grade ${grade})`,
        directions:
          'Read the two short stanzas carefully and analyze how the poet uses rhyme, rhythm, and figurative imagery.',
        sourceTextLabel: 'Poem Excerpt',
        sourceText:
          'Along the weathered wooden pier, / The evening lanterns start to glow. / Their golden circles shimmer near / The dark and curling tide below.  /  A sleepy crab climbs up a post, / To watch the silver moonbeams dance, / While gentle breezes softly coast / Across the bay in quiet trance.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Describe the rhyme scheme of Stanza 1 and explain how the poet’s imagery brings the pier to life in 1–2 sentences.'
                : 'What is the rhyme scheme of the first stanza?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Stanza 1 has an ABAB rhyme scheme ("pier"/"near" and "glow"/"below"), and imagery like "golden circles shimmer" helps readers picture light on the water.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    ['AABB', 'ABAB', 'ABBA', 'Free verse'],
                    [
                      'Incorrect: Lines 1 and 2 ("pier"/"glow") do not rhyme.',
                      'Correct: Alternating lines rhyme ("pier"/"near" and "glow"/"below").',
                      'Incorrect: Lines 1 and 4 ("pier"/"below") do not rhyme.',
                      'Incorrect: Both stanzas follow a steady ABAB rhyme pattern.',
                    ]
                  ),
                  correctAnswer: 'B. ABAB',
                }),
            explanation:
              purpose === 'activate' && priorBench
                ? `Connects ${priorBench.code} poetic structure analysis to Grade ${grade} ${bench.code} stanza and poetic-element craft.`
                : `Alternating end rhymes ("pier"/"near", "glow"/"below") create an ABAB pattern (${bench.code}).`,
            textualEvidence: '"pier / glow / near / below"',
          },
          {
            format:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'short_response'
                : questionType === 'grammar_editing'
                  ? 'grammar_editing'
                  : 'multiple_choice',
            prompt:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'Identify one example of personification in Stanza 2 and explain what it emphasizes in 1–2 sentences.'
                : 'Which phrase in Stanza 2 uses personification to create a calm mood?',
            ...(questionType === 'short_response' || questionType === 'mixed'
              ? {
                  correctAnswer:
                    '"To watch the silver moonbeams dance" (or "a sleepy crab climbs... to watch") gives human actions—dancing or watching—to moonbeams and the crab, creating a peaceful nighttime mood.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    [
                      '"wooden pier"',
                      '"climbs up a post"',
                      '"silver moonbeams dance"',
                      '"Across the bay"',
                    ],
                    [
                      'Incorrect: Literal description of the dock.',
                      'Incorrect: Literal crab movement.',
                      'Correct: Gives the human action of dancing to moonbeams.',
                      'Incorrect: Literal prepositional phrase.',
                    ]
                  ),
                  correctAnswer: 'C. "silver moonbeams dance"',
                }),
            explanation: `Poetic devices like personification and steady rhyme enhance tone and imagery (${bench.code}).`,
            textualEvidence: '"To watch the silver moonbeams dance"',
          },
        ],
      },
    ];
  }

  if (isArgument) {
    return [
      {
        title:
          purpose === 'activate' && grade === '3'
            ? 'Grade 2 → Grade 3 Warm-Up: Opinion to Claim & Evidence'
            : `School Pollinator Gardens: Claim & Evidence (Grade ${grade})`,
        directions:
          'Read the short persuasive passage carefully, then identify the author’s claim and supporting evidence.',
        sourceTextLabel: 'Informational Argument Mini-Passage',
        sourceText:
          'Every elementary schoolyard should include a small native wildflower garden. Native Florida flowers such as blanketflower and milkweed need far less watering than trimmed grass lawns, which saves water during dry spring months. Even better, a three-year school science project showed that campuses with wildflower beds attracted twice as many butterflies and bees for students to observe during outdoor lessons.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              purpose === 'activate' && grade === '3'
                ? questionType === 'short_response'
                  ? 'Warm-Up Bridge: What opinion or claim does the author state in the first sentence? Write 1 sentence.'
                  : 'Warm-Up Bridge (Prior Knowledge): Which sentence states the author’s main opinion or claim about schoolyards?'
                : questionType === 'short_response'
                  ? 'State the author’s claim and one piece of evidence used to support it in 1–2 sentences.'
                  : 'What is the author’s primary claim in this passage?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'The author claims that every elementary schoolyard should include a small native wildflower garden, supported by water savings and doubled butterfly/bee observations.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    [
                      'Every elementary schoolyard should include a small native wildflower garden.',
                      'Blanketflower grows faster than milkweed in winter.',
                      'Grass lawns require mowing once every week.',
                      'Bees only visit gardens that are planted in spring.',
                    ],
                    [
                      'Correct: Directly expresses the author’s debatable claim in sentence 1.',
                      'Incorrect: Comparison not stated in the passage.',
                      'Incorrect: Mowing frequency is never mentioned.',
                      'Incorrect: Unsupported overgeneralization.',
                    ]
                  ),
                  correctAnswer:
                    'A. Every elementary schoolyard should include a small native wildflower garden.',
                }),
            explanation:
              purpose === 'activate' && priorBench
                ? `Activates Grade ${priorBench.grade} prerequisite ${priorBench.code} (identifying an author’s opinion/claim) before analyzing how specific evidence supports that claim in ${bench.code}.`
                : `The opening sentence states the author’s claim, which subsequent sentences back up with facts (${bench.code}).`,
            textualEvidence:
              '"Every elementary schoolyard should include a small native wildflower garden."',
          },
          {
            format:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'short_response'
                : questionType === 'grammar_editing'
                  ? 'grammar_editing'
                  : 'multiple_choice',
            prompt:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'Explain in 1–2 sentences how the author uses evidence from the science project to support the claim.'
                : 'Which evidence from the passage best supports the author’s claim?',
            ...(questionType === 'short_response' || questionType === 'mixed'
              ? {
                  correctAnswer:
                    'The author cites a three-year school science project showing wildflower beds attracted twice as many butterflies and bees for outdoor lessons, plus lower watering needs than grass lawns.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    [
                      'Wildflowers come in many different colors.',
                      'Spring months in Florida can sometimes be rainy.',
                      'Students enjoy playing games on trimmed grass lawns.',
                      'Native flowers need less watering, and a school study found twice as many butterflies and bees.',
                    ],
                    [
                      'Incorrect: Color variety is not cited as evidence.',
                      'Incorrect: The passage mentions dry spring months, not rainy ones.',
                      'Incorrect: Contradicts the passage’s focus on replacing parts of grass lawns.',
                      'Correct: Summarizes both concrete reasons/data given to support planting wildflower beds.',
                    ]
                  ),
                  correctAnswer:
                    'D. Native flowers need less watering, and a school study found twice as many butterflies and bees.',
                }),
            explanation: `Connects factual evidence (water conservation and measured pollinator counts) directly to the author’s claim (${bench.code}).`,
            textualEvidence:
              '"campuses with wildflower beds attracted twice as many butterflies and bees"',
          },
        ],
      },
    ];
  }

  if (isFigurative) {
    if (grade === 'K' || grade === '1' || grade === '2') {
      return [
        {
          title:
            purpose === 'activate' && priorBench
              ? `${formatGradeLabel(priorBench.grade)} → ${gradeLabel} Figurative & Descriptive Language: Garden Morning`
              : `Sensory Words & Similes: Garden Morning (${gradeLabel})`,
          directions:
            'Read the short scene carefully and picture what the descriptive words and comparisons show.',
          sourceTextLabel: 'Story Mini-Passage',
          sourceText:
            'Early sunlight shone like a warm gold coin over Grandma’s porch. Tiny dewdrops sparkled on the green leaves like little glass beads. Inside the garden, bright red strawberries peeked from under soft leaves while busy bees hummed a gentle tune.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'What does the comparison "dewdrops sparkled... like little glass beads" help you see on the leaves?'
                  : 'Why does the author compare the dewdrops on the leaves to "little glass beads"?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'It helps the reader picture small, round, shiny drops of morning water catching the light.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      [
                        'To warn that broken glass is in the grass',
                        'To explain how Grandma makes necklaces',
                        'To show that the water drops were small, round, and shiny',
                        'To tell what the strawberries tasted like',
                      ],
                      [
                        'Incorrect: It is a simile for water drops, not real glass.',
                        'Incorrect: Jewelry making is not mentioned.',
                        'Correct: "Glass beads" captures the round, clear, sparkling look of morning dew.',
                        'Incorrect: Describes dewdrops, not strawberry flavor.',
                      ]
                    ),
                    correctAnswer: 'C. To show that the water drops were small, round, and shiny',
                  }),
              explanation: `Descriptive words and similes ("like little glass beads") help ${gradeLabel} readers visualize sensory details (${bench.code}).`,
              textualEvidence: '"Tiny dewdrops sparkled on the green leaves like little glass beads."',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Which phrase in the last sentence helps you HEAR a sound in the garden?'
                  : 'Which phrase helps the reader HEAR a gentle sound in the garden?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: '"busy bees hummed a gentle tune" helps the reader hear the buzzing bees.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      ['"bright red strawberries"', '"busy bees hummed a gentle tune"', '"under soft leaves"', '"warm gold coin"'],
                      [
                        'Incorrect: Visual color detail.',
                        'Correct: "hummed a gentle tune" appeals to the sense of hearing.',
                        'Incorrect: Visual/touch detail.',
                        'Incorrect: Visual/temperature detail.',
                      ]
                    ),
                    correctAnswer: 'B. "busy bees hummed a gentle tune"',
                  }),
              explanation: `Sensory details appeal to sight, sound, and touch to bring scenes to life (${bench.code}).`,
              textualEvidence: '"while busy bees hummed a gentle tune."',
            },
          ],
        },
        {
          title: `Playful Idioms & Comparisons: Baking Day (${gradeLabel})`,
          directions: 'Read the short story and think about what the special expressions mean.',
          sourceTextLabel: 'Story Mini-Passage',
          sourceText:
            'On Saturday morning, Leo and his dad decided to bake banana muffins. When Leo saw the easy recipe, he smiled and said, "This will be a piece of cake!" Flour puffed like a tiny white cloud when Leo stirred the bowl. Soon the sweet smell floated through the whole kitchen.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'When Leo says the muffin recipe will be "a piece of cake," does he mean real cake or something else? Explain in 1 sentence.'
                  : 'What does Leo mean by the expression "a piece of cake"?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'He means the muffin recipe will be very easy to make, not an actual slice of cake.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    ['Very easy to do', 'Covered in chocolate frosting', 'Taking all afternoon', 'Too messy to finish'],
                    [
                      'Correct: "A piece of cake" is an idiom meaning something is very easy.',
                      'Incorrect: They are baking banana muffins, not frosted cake.',
                      'Incorrect: Opposite of easy.',
                      'Incorrect: Does not describe messiness.',
                    ]
                  ),
                  correctAnswer: 'A. Very easy to do',
                }),
            explanation: `Recognizing common idioms ("piece of cake") and similes builds figurative meaning (${bench.code}).`,
            textualEvidence: '"When Leo saw the easy recipe, he smiled and said, \'This will be a piece of cake!\'"',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Why did the author write "Flour puffed like a tiny white cloud"?'
                : 'What does "Flour puffed like a tiny white cloud" help the reader picture?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'It helps the reader picture soft white flour floating gently up into the air above the mixing bowl.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    ['Rain falling outside the window', 'A heavy gray storm', 'A bowl spilling water on the rug', 'Soft white flour floating briefly into the air'],
                    [
                      'Incorrect: Happens indoors with flour.',
                      'Incorrect: Flour is white and small, not a storm.',
                      'Incorrect: Flour is dry powder, not water.',
                      'Correct: Comparing puffed flour to a tiny white cloud visualizes the light powder rising.',
                    ]
                  ),
                  correctAnswer: 'D. Soft white flour floating briefly into the air',
                }),
            explanation: `Similes using "like" help readers picture movement and appearance clearly (${bench.code}).`,
            textualEvidence: '"Flour puffed like a tiny white cloud"',
          },
        ],
      },
    ];
  }

    if (purpose === 'activate' && priorBench && grade === '3') {
      return [
        {
          title: 'Grade 2 → Grade 3 Figurative Language Bridge: Similes to Metaphors & Personification',
          directions:
            'Use what you know about similes from second grade to unlock metaphors and personification in this Grade 3 passage.',
          sourceTextLabel: 'Literary Mini-Passage',
          sourceText:
            'Before sunrise, silvery mist draped across the Suwannee River like a soft winter blanket. Only the steady dip of Mateo’s paddle broke the quiet water. Along the mossy riverbank, tall cypress trees stood like patient sentries guarding the bend. Suddenly, a startled osprey burst from a high branch, its wings beating a rapid drumroll against the cool morning air as golden light spilled over the treetops.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Warm-Up Bridge: Identify the simile in the first sentence ("like a soft winter blanket") and explain what it helps the reader picture in 1 sentence.'
                  : 'Warm-Up Bridge (Prior Knowledge): In the simile "silvery mist draped across the Suwannee River like a soft winter blanket," what does the comparison show?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'The simile uses "like" to compare the river mist to a soft blanket, helping the reader picture smooth mist covering the calm water gently.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      [
                        'The mist covered the surface of the water smoothly and gently',
                        'The river had frozen solid with winter ice',
                        'Mateo forgot to bring a coat in his canoe',
                        'The water splashed loudly over rocks',
                      ],
                      [
                        'Correct: Activates Grade 2 mastery of similes (ELA.2.R.3.1) using "like" before bridging to Grade 3 metaphors.',
                        'Incorrect: "Winter blanket" describes soft coverage, not ice.',
                        'Incorrect: Clothing is not mentioned.',
                        'Incorrect: The river water is "quiet."',
                      ]
                    ),
                    correctAnswer:
                      'A. The mist covered the surface of the water smoothly and gently',
                  }),
              explanation: `Activates Grade 2 prerequisite ${priorBench.code} (identifying and explaining similes) as the entry point to Grade 3 metaphors and personification (ELA.3.R.3.1).`,
              textualEvidence: '"silvery mist draped across the Suwannee River like a soft winter blanket."',
            },
            {
              format:
                questionType === 'short_response' || questionType === 'mixed'
                  ? 'short_response'
                  : questionType === 'grammar_editing'
                    ? 'grammar_editing'
                    : 'multiple_choice',
              prompt:
                questionType === 'short_response' || questionType === 'mixed'
                  ? 'Bridge to Grade 3: Explain why "its wings beating a rapid drumroll" is a metaphor (instead of a simile) and what it helps you hear in 1–2 sentences.'
                  : 'Bridge to Grade 3: What does the metaphor "its wings beating a rapid drumroll" suggest about the osprey’s takeoff?',
              ...(questionType === 'short_response' || questionType === 'mixed'
                ? {
                    correctAnswer:
                      'It is a metaphor because it directly calls the wingbeats a "rapid drumroll" without using "like" or "as," helping the reader hear the fast, rhythmic sound.',
                    maxSentences: 2,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      [
                        'The osprey glided silently without flapping.',
                        'Someone on shore was playing an actual drum.',
                        'The bird’s wings made a fast, loud, rhythmic flapping sound.',
                        'The osprey could not lift off the branch.',
                      ],
                      [
                        'Incorrect: A drumroll is fast and loud, not silent.',
                        'Incorrect: There is no literal drum—the wings are compared directly to a drumroll.',
                        'Correct: Bridges from Grade 2 similes to Grade 3 metaphor comprehension (ELA.3.R.3.1).',
                        'Incorrect: "Burst from a high branch" shows energetic flight.',
                      ]
                    ),
                    correctAnswer: 'C. The bird’s wings made a fast, loud, rhythmic flapping sound.',
                  }),
              explanation: `Builds from Grade 2 simile recognition (${priorBench.code}) into Grade 3 metaphor analysis—a direct comparison without "like" or "as" (ELA.3.R.3.1).`,
              textualEvidence: '"its wings beating a rapid drumroll against the cool morning air"',
            },
          ],
        },
      ];
    }
    return [
      {
        title: `Morning on the Suwannee River: Figurative Language (Grade ${grade})`,
        directions:
          'Read the short descriptive passage and examine how the author’s figurative language adds meaning.',
        sourceTextLabel: 'Literary Mini-Passage',
        sourceText:
          'Before sunrise, silvery mist draped across the Suwannee River like a soft winter blanket. Only the steady dip of Mateo’s paddle broke the quiet water. Along the mossy riverbank, tall cypress trees stood like patient sentries guarding the bend. Suddenly, a startled osprey burst from a high branch, its wings beating a rapid drumroll against the cool morning air as golden light spilled over the treetops.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'In 1–2 sentences, explain what the simile "like a soft winter blanket" helps the reader picture about the mist on the river.'
                : 'Read the sentence: "Before sunrise, silvery mist draped across the Suwannee River like a soft winter blanket." Why does the author compare the mist to a blanket?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'The simile helps the reader picture thick, smooth mist covering the entire surface of the water gently before the sun rises.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    [
                      'To show that the mist covered the surface of the water smoothly and gently',
                      'To warn Mateo that the river was frozen solid with ice',
                      'To explain that Mateo forgot to bring a coat in his canoe',
                      'To show that the water was splashing loudly over the rocks',
                    ],
                    [
                      'Correct: Comparing mist to a "soft winter blanket" emphasizes how smoothly and completely it covered the calm river.',
                      'Incorrect: Florida’s Suwannee River is not frozen; "winter blanket" describes the mist’s soft, covering appearance.',
                      'Incorrect: Mateo’s clothing is never mentioned in the passage.',
                      'Incorrect: The water is described as "quiet," not splashing loudly.',
                    ]
                  ),
                  correctAnswer:
                    'A. To show that the mist covered the surface of the water smoothly and gently',
                }),
            explanation:
              'The simile uses "like" to compare the river mist to a blanket, conveying gentle stillness and full coverage across the water (ELA.R.3.1).',
            textualEvidence: '"silvery mist draped across the Suwannee River like a soft winter blanket."',
          },
          {
            format:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'short_response'
                : questionType === 'grammar_editing'
                  ? 'grammar_editing'
                  : 'multiple_choice',
            prompt:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'What type of figurative language is "its wings beating a rapid drumroll," and how does it help the reader experience that moment? Answer in 1–2 sentences.'
                : 'What does the metaphor "its wings beating a rapid drumroll" suggest about the osprey’s takeoff?',
            ...(questionType === 'short_response' || questionType === 'mixed'
              ? {
                  correctAnswer:
                    'It is a metaphor (and sound imagery) comparing the fast flapping wings to a drumroll, helping the reader hear the sudden, loud, rhythmic sound breaking the quiet morning.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    [
                      'The osprey glided silently without moving its feathers.',
                      'Someone on shore was playing music from a boat.',
                      'The bird’s wings made a fast, loud, rhythmic flapping sound.',
                      'The osprey was injured and could not lift off the branch.',
                    ],
                    [
                      'Incorrect: A drumroll is loud and rapid, the opposite of silent gliding.',
                      'Incorrect: There is no actual drum—the sound comes from the bird’s wings.',
                      'Correct: Comparing wingbeats to a "rapid drumroll" creates vivid auditory imagery of speed and energy.',
                      'Incorrect: "Burst from a high branch" shows energetic flight, not injury.',
                    ]
                  ),
                  correctAnswer:
                    'C. The bird’s wings made a fast, loud, rhythmic flapping sound.',
                }),
          explanation:
            'The metaphor compares wingbeats to a "drumroll," contrasting sharply with the earlier quiet river and letting readers hear the bird’s sudden movement (ELA.R.3.1).',
          textualEvidence: '"its wings beating a rapid drumroll against the cool morning air"',
        },
        ],
      },
      {
        title: `Summer Storm Porch: Personification & Imagery (Grade ${grade})`,
        directions:
          'Read the brief scene carefully and analyze how figurative language shapes the setting.',
        sourceTextLabel: 'Literary Mini-Passage',
        sourceText:
          'Dark thunderclouds marched across the afternoon sky like a line of towering ships. On the back porch, wind whispered secrets through the palm fronds and rattled the metal wind chimes. Inside the screen door, Diego watched raindrops race down the windowpane in silver streaks. Within ten minutes, the cloud ships sailed past, leaving clean air and a bright ribbon of rainbow stretched above the oaks.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Find one example of personification in the passage and explain in 1–2 sentences what human action the author gives to nature.'
                : 'Which phrase from the passage is an example of personification?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    '"Wind whispered secrets through the palm fronds" (or "raindrops race down the windowpane") gives human actions—whispering secrets or racing—to wind and rain.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    [
                      '"On the back porch"',
                      '"wind whispered secrets through the palm fronds"',
                      '"Inside the screen door"',
                      '"Within ten minutes"',
                    ],
                    [
                      'Incorrect: Literal prepositional phrase describing location.',
                      'Correct: Gives the human action of whispering secrets to the non-human wind.',
                      'Incorrect: Literal setting detail.',
                      'Incorrect: Literal time phrase.',
                    ]
                  ),
                  correctAnswer: 'B. "wind whispered secrets through the palm fronds"',
                }),
            explanation:
              'Personification attributes human qualities or actions ("whispered secrets") to non-human things like the wind to make the storm sound lively and vivid (ELA.R.3.1).',
            textualEvidence: '"wind whispered secrets through the palm fronds"',
          },
          {
            format:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'short_response'
                : questionType === 'grammar_editing'
                  ? 'grammar_editing'
                  : 'multiple_choice',
            prompt:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'Why does the author call the clouds "the cloud ships" at the end of the passage? Answer in 1–2 sentences.'
                : 'What does the metaphor "a bright ribbon of rainbow" help the reader visualize?',
            ...(questionType === 'short_response' || questionType === 'mixed'
              ? {
                  correctAnswer:
                    'Calling them "cloud ships" connects back to the opening simile ("like a line of towering ships"), showing the storm moving steadily across the sky and sailing away.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    [
                      'A storm warning flag hanging from a pole',
                      'A dark shadow covering the oak branches',
                      'Heavy rain falling straight onto the roof',
                      'A colorful, curved band arching smoothly across the sky',
                    ],
                    [
                      'Incorrect: It describes the rainbow, not a flag.',
                      'Incorrect: "Bright" indicates light and color, not a dark shadow.',
                      'Incorrect: The storm had already passed.',
                      'Correct: Comparing the rainbow to a "bright ribbon" captures its narrow, colorful, arched shape.',
                    ]
                  ),
                  correctAnswer:
                    'D. A colorful, curved band arching smoothly across the sky',
                }),
            explanation:
              'Metaphors ("cloud ships" and "bright ribbon") create visual continuity from the approaching storm to the clear sky afterward (ELA.R.3.1).',
            textualEvidence: '"a bright ribbon of rainbow stretched above the oaks."',
          },
        ],
      },
    ];
  }

  if (isInformational) {
    if (grade === 'K' || grade === '1' || grade === '2') {
      return [
        {
          title:
            purpose === 'activate' && priorBench
              ? `${formatGradeLabel(priorBench.grade)} → ${gradeLabel} Informational Bridge: Honeybee Helpers`
              : `Busy Honeybee Helpers (${gradeLabel})`,
          directions:
            'Read the short informational text carefully and use key details from the text to answer.',
          sourceTextLabel: 'Informational Mini-Passage',
          sourceText:
            'Honeybees are small insects with a big job in nature. As a bee drinks sweet nectar from a flower, yellow pollen sticks to its fuzzy body. When the bee flies to the next flower, some pollen rubs off and helps new seeds and fruits grow. That is why apple orchards and gardens need honeybees.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'What is the main topic or central idea of this passage? Answer in 1 sentence.'
                  : 'What is the main topic (central idea) of this passage?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'Honeybees help gardens and fruit trees grow by carrying pollen from flower to flower.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      [
                        'How bears hunt for wild berries',
                        'How honeybees help flowers grow new seeds and fruits',
                        'Why winter weather turns leaves brown',
                        'How to plant apple trees in pots',
                      ],
                      [
                        'Incorrect: Bears and berries are not in the passage.',
                        'Correct: Every sentence explains how honeybees move pollen to help seeds and fruits grow.',
                        'Incorrect: Seasons and brown leaves are not mentioned.',
                        'Incorrect: Planting instructions are not included.',
                      ]
                    ),
                    correctAnswer: 'B. How honeybees help flowers grow new seeds and fruits',
                  }),
              explanation: `Synthesizing the repeated key details reveals the central idea (${bench.code}).`,
              textualEvidence: '"some pollen rubs off and helps new seeds and fruits grow."',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'According to the passage, WHY does pollen stick to a honeybee? Write 1 short sentence.'
                  : 'According to the text, how does pollen travel from one flower to another?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'Pollen sticks to the honeybee’s fuzzy body while it drinks nectar and rubs off at the next flower.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'C',
                      [
                        'It blows away when apples fall.',
                        'Gardeners paint it onto leaves.',
                        'It sticks to a bee’s fuzzy body and rubs off on the next flower.',
                        'Bees carry it inside tiny buckets.',
                      ],
                      [
                        'Incorrect: Not stated in the text.',
                        'Incorrect: Gardeners are not painting pollen.',
                        'Correct: Directly stated in Sentences 2 and 3.',
                        'Incorrect: No buckets are mentioned.',
                      ]
                    ),
                    correctAnswer: 'C. It sticks to a bee’s fuzzy body and rubs off on the next flower.',
                  }),
              explanation: `Finding explicit supporting details in informational text is core to K–2 reading comprehension (${bench.code}).`,
              textualEvidence: '"yellow pollen sticks to its fuzzy body. When the bee flies to the next flower, some pollen rubs off"',
            },
          ],
        },
        {
          title: `Cool Burrow Homes: Tortoise Shelters (${gradeLabel})`,
          directions: 'Read the informational paragraph and use text clues to answer both questions.',
          sourceTextLabel: 'Informational Mini-Passage',
          sourceText:
            'Heading: Desert & Pine-Land Diggers. Gopher tortoises live in sandy places across Florida. Using their strong, flat front legs like shovels, they dig deep underground burrows. These shady tunnels stay cool during hot afternoons and protect tortoises—and even other small animals like frogs—from bright heat.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'How does the heading "Desert & Pine-Land Diggers" help a reader before reading the paragraph?'
                  : 'Why do gopher tortoises dig deep underground burrows?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'The heading previews the topic—animals that dig homes in sandy habitats.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      [
                        'To stay cool and safe during hot afternoons',
                        'To swim across deep ocean waves',
                        'To hide green apples for winter',
                        'To climb tall oak branches',
                      ],
                      [
                        'Correct: Sentence 3 states burrows "stay cool during hot afternoons and protect tortoises... from bright heat."',
                        'Incorrect: Tortoises live on sandy land, not in the ocean.',
                        'Incorrect: Apples are not mentioned.',
                        'Incorrect: Tortoises dig underground rather than climb.',
                      ]
                    ),
                    correctAnswer: 'A. To stay cool and safe during hot afternoons',
                  }),
              explanation: `Using headings and key details explains why informational facts are included (${bench.code}).`,
              textualEvidence: '"These shady tunnels stay cool during hot afternoons and protect tortoises"',
            },
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Which body part helps gopher tortoises dig, and what other animal might use their burrows?'
                  : 'Which detail from the passage shows that gopher tortoise burrows help MORE than just tortoises?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer: 'Their strong, flat front legs help them dig, and other small animals like frogs also shelter in their burrows.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'D',
                      [
                        'They live in sandy places across Florida.',
                        'They have flat front legs.',
                        'Afternoons can be bright and hot.',
                        'Even other small animals like frogs use the shady tunnels for protection.',
                      ],
                      [
                        'Incorrect: Describes habitat location.',
                        'Incorrect: Describes how tortoises dig.',
                        'Incorrect: Describes the weather.',
                        'Correct: Mentions other small animals like frogs benefiting from the burrows.',
                      ]
                    ),
                    correctAnswer: 'D. Even other small animals like frogs use the shady tunnels for protection.',
                  }),
              explanation: `Connecting details across sentences reinforces informational comprehension (${bench.code}).`,
              textualEvidence: '"and even other small animals like frogs"',
            },
          ],
        },
      ];
    }

    if (purpose === 'activate' && priorBench) {
      return [
        {
          title: `${formatGradeLabel(priorBench.grade)} → ${gradeLabel} Informational Bridge: Mangrove Nurseries`,
          directions:
            'Use what you already know about finding topics, text features, and central ideas to explain how details support and organize this ' +
            gradeLabel +
            ' informational passage.',
          sourceTextLabel: 'Informational Mini-Passage',
          sourceText:
            'Red mangrove trees grow where warm ocean saltwater meets Florida’s shallow coastline. Their tangled, stilt-like roots arch down into the water, creating a natural underwater maze. Because large predator fish cannot easily squeeze between the tight roots, baby snapper, shrimp, and crabs use mangrove forests as safe nurseries while they grow. In addition, the dense root web slows down strong storm waves, helping protect nearby shorelines from washing away during hurricanes.',
          questions: [
            {
              format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
              prompt:
                questionType === 'short_response'
                  ? 'Warm-Up Bridge: Identify the central idea (main topic and key point) of this passage in 1 sentence.'
                  : 'Warm-Up Bridge (Prior Knowledge): Which sentence best identifies the central idea of the passage?',
              ...(questionType === 'short_response'
                ? {
                    correctAnswer:
                      'Red mangrove roots shelter young sea animals and protect Florida coastlines from storm waves.',
                    maxSentences: 1,
                  }
                : {
                    options: makeMcOptions(
                      'B',
                      [
                        'Large predator fish live only in deep ocean trenches.',
                        'Red mangrove roots shelter young sea life and protect coastlines from storm waves.',
                        'Hurricanes destroy every tree growing along Florida coasts.',
                        'Crabs and shrimp prefer sandy beaches over mangrove roots.',
                      ],
                      [
                        'Incorrect: Predator fish are simply kept out by the tight roots.',
                        'Correct: Activates prior-grade skill (' +
                          priorBench.code +
                          ') of identifying the central idea.',
                        'Incorrect: Contradicts the passage.',
                        'Incorrect: The passage explains they shelter inside mangrove forests.',
                      ]
                    ),
                    correctAnswer:
                      'B. Red mangrove roots shelter young sea life and protect coastlines from storm waves.',
                  }),
              explanation: `Activates prior-grade prerequisite ${priorBench.code} (identifying central idea/relevant details) before analyzing how details support or structure meaning in ${bench.code}.`,
              textualEvidence:
                '"baby snapper, shrimp, and crabs use mangrove forests as safe nurseries... slows down strong storm waves"',
            },
            {
              format:
                questionType === 'short_response' || questionType === 'mixed'
                  ? 'short_response'
                  : questionType === 'grammar_editing'
                    ? 'grammar_editing'
                    : 'multiple_choice',
              prompt:
                questionType === 'short_response' || questionType === 'mixed'
                  ? 'Bridge to Grade ' +
                    grade +
                    ': Explain in 1–2 sentences HOW the detail about the "underwater maze" of roots supports the author’s central idea.'
                  : 'Bridge to Grade ' +
                    grade +
                    ': How do the third and fourth sentences develop and support the central idea?',
              ...(questionType === 'short_response' || questionType === 'mixed'
                ? {
                    correctAnswer:
                      'The tangled root maze explains cause and effect: it keeps large predator fish out so baby fish can grow safely, and its dense web slows down hurricane waves to protect the shore.',
                    maxSentences: 2,
                  }
                : {
                    options: makeMcOptions(
                      'A',
                      [
                        'By showing cause-and-effect ways the tangled roots protect sea animals and shorelines',
                        'By listing the steps to plant a mangrove tree in chronological order',
                        'By comparing Florida coasts with northern mountain forests',
                        'By telling a fictional story about a baby snapper',
                      ],
                      [
                        'Correct: Bridges Grade ' +
                          priorBench.grade +
                          ' topic/detail identification into Grade ' +
                          grade +
                          ' explanation of how evidence and text structure support meaning (' +
                          bench.code +
                          ').',
                        'Incorrect: No planting steps or chronology appear.',
                        'Incorrect: Mountain forests are not mentioned.',
                        'Incorrect: The passage is informational, not narrative fiction.',
                      ]
                    ),
                    correctAnswer:
                      'A. By showing cause-and-effect ways the tangled roots protect sea animals and shorelines',
                  }),
              explanation: `Bridges Grade ${priorBench.grade} (${priorBench.code}) into Grade ${grade} (${bench.code}) by moving from identifying the idea to explaining how cause-and-effect details support it.`,
              textualEvidence:
                '"Because large predator fish cannot easily squeeze between the tight roots... slows down strong storm waves"',
            },
          ],
        },
      ];
    }

    return [
      {
        title: `Mangrove Nurseries of Florida’s Coasts (Grade ${grade})`,
        directions:
          'Read the short informational text carefully, then answer both questions using details from the passage.',
        sourceTextLabel: 'Informational Mini-Passage',
        sourceText:
          'Red mangrove trees grow where warm ocean saltwater meets Florida’s shallow coastline. Their tangled, stilt-like roots arch down into the water, creating a natural underwater maze. Because large predator fish cannot easily squeeze between the tight roots, baby snapper, shrimp, and crabs use mangrove forests as safe nurseries while they grow. In addition, the dense root web slows down strong storm waves, helping protect nearby shorelines from washing away during hurricanes.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'State the central idea of the passage in 1–2 sentences, including two supporting details from the text.'
                : 'Which sentence best states the central idea of the passage?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Red mangrove roots protect both young sea animals and Florida coastlines. The tangled roots keep predators away from baby fish and crabs, and they slow down hurricane storm waves to prevent shoreline erosion.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    [
                      'Large predator fish live exclusively in shallow Florida waters.',
                      'Red mangrove roots shelter young sea life and protect coastlines from storm waves.',
                      'Hurricanes destroy most trees growing near warm ocean saltwater.',
                      'Baby snapper and crabs prefer sandy beaches over underwater mazes.',
                    ],
                    [
                      'Incorrect: Predator fish are kept out of the tight mangrove roots.',
                      'Correct: Synthesizes both key benefits explained in the passage: animal nurseries and shoreline storm protection.',
                      'Incorrect: The passage highlights how mangroves help protect shorelines during hurricanes.',
                      'Incorrect: The text states baby snapper and crabs shelter inside mangrove forests.',
                    ]
                  ),
                  correctAnswer:
                    'B. Red mangrove roots shelter young sea life and protect coastlines from storm waves.',
                }),
            explanation:
              'Both major details in the passage—sheltering young marine life and slowing hurricane waves—support the central idea that red mangrove roots provide vital coastal protection (ELA.R.2.2).',
            textualEvidence:
              '"baby snapper, shrimp, and crabs use mangrove forests as safe nurseries... slows down strong storm waves, helping protect nearby shorelines"',
          },
          {
            format:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'short_response'
                : questionType === 'grammar_editing'
                  ? 'grammar_editing'
                  : 'multiple_choice',
            prompt:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'According to the passage, WHY are red mangrove roots safe for baby snapper and shrimp? Cite exact evidence in 1–2 sentences.'
                : 'How does the author organize the information in the third and fourth sentences?',
            ...(questionType === 'short_response' || questionType === 'mixed'
              ? {
                  correctAnswer:
                    'The tangled roots form an "underwater maze" that large predator fish cannot easily squeeze through, giving small sea animals a safe place to grow.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    [
                      'By explaining cause-and-effect benefits of the tangled mangrove roots',
                      'By listing events in chronological order from morning to night',
                      'By comparing Florida coastlines with desert habitats',
                      'By telling a fictional story about a baby crab',
                    ],
                    [
                      'Correct: Signals like "Because" and "helping protect" show cause-and-effect relationships.',
                      'Incorrect: No time sequence of daily events is presented.',
                      'Incorrect: Deserts are never mentioned.',
                      'Incorrect: This is an informational passage, not a fictional story.',
                    ]
                  ),
                  correctAnswer:
                    'A. By explaining cause-and-effect benefits of the tangled mangrove roots',
                }),
            explanation:
              'Transition words like "Because" explicitly connect the cause (tight root maze) to the effect (predators cannot enter; waves slow down) (ELA.R.2.1 / ELA.R.2.2).',
            textualEvidence:
              '"Because large predator fish cannot easily squeeze between the tight roots, baby snapper, shrimp, and crabs use mangrove forests as safe nurseries"',
          },
        ],
      },
      {
        title: `Solar Ovens for Clean Energy (Grade ${grade})`,
        directions:
          'Read the short informational paragraph carefully, then answer both questions with evidence from the text.',
        sourceTextLabel: 'Informational Mini-Passage',
        sourceText:
          'A solar oven cooks food using only sunlight instead of electricity or firewood. Builders line a sturdy cardboard box with shiny foil to bounce sunlight inward, then paint the inside bottom black because dark surfaces absorb heat quickly. A clear plastic lid traps the warm air inside, much like a greenhouse. Although solar ovens take longer to heat up on cloudy days, families around the world use them to bake bread and boil water safely without smoke.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Explain in 1–2 sentences why a solar oven builder paints the inside bottom black and adds a clear lid.'
                : 'According to the passage, why do builders paint the inside bottom of a solar oven black?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Builders paint the bottom black because dark surfaces absorb heat quickly, and they add a clear plastic lid to trap the warm air inside.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    [
                      'To bounce sunlight out of the box',
                      'To keep rain from soaking the cardboard',
                      'Because dark colors absorb heat rapidly',
                      'So bread dough will not stick to the lid',
                    ],
                    [
                      'Incorrect: Shiny foil bounces sunlight inward; black paint absorbs heat.',
                      'Incorrect: Weatherproofing cardboard is not the stated purpose of black paint.',
                      'Correct: The text states directly that "dark surfaces absorb heat quickly."',
                      'Incorrect: The lid traps warm air; bread does not stick to the bottom paint reason.',
                    ]
                  ),
                  correctAnswer: 'C. Because dark colors absorb heat rapidly',
                }),
            explanation:
              'Sentence 2 explicitly states the reason ("because dark surfaces absorb heat quickly"), demonstrating close reading of informational cause and effect (ELA.R.2.1 / ELA.R.2.2).',
            textualEvidence: '"paint the inside bottom black because dark surfaces absorb heat quickly."',
          },
          {
            format:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'short_response'
                : questionType === 'grammar_editing'
                  ? 'grammar_editing'
                  : 'multiple_choice',
            prompt:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'What is one advantage AND one limitation of solar ovens mentioned in the passage? Answer in 1–2 sentences.'
                : 'Which detail from the passage supports the idea that solar ovens are helpful for everyday cooking?',
            ...(questionType === 'short_response' || questionType === 'mixed'
              ? {
                  correctAnswer:
                    'One advantage is that solar ovens cook food and boil water safely without smoke, electricity, or firewood; one limitation is that they take longer to heat up on cloudy days.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    [
                      'They require cardboard boxes and tape.',
                      'They take longer on cloudy days.',
                      'They look similar to a small greenhouse.',
                      'Families use them to bake bread and boil water safely without smoke.',
                    ],
                    [
                      'Incorrect: Describes materials, not everyday cooking usefulness.',
                      'Incorrect: Describes a limitation rather than helpfulness.',
                      'Incorrect: Explains how heat is trapped rather than cooking benefit.',
                      'Correct: Directly names practical cooking tasks done safely without smoke.',
                    ]
                  ),
                  correctAnswer:
                    'D. Families use them to bake bread and boil water safely without smoke.',
                }),
            explanation:
              'The concluding sentence supplies concrete evidence of how solar ovens support safe daily cooking (ELA.R.2.2 / ELA.R.2.4).',
            textualEvidence:
              '"families around the world use them to bake bread and boil water safely without smoke."',
          },
        ],
      },
    ];
  }

  // Literary Reading (Prose / Plot / Theme / Perspective)
  if (grade === 'K' || grade === '1' || grade === '2') {
    return [
      {
        title:
          purpose === 'activate' && priorBench
            ? `${formatGradeLabel(priorBench.grade)} → ${gradeLabel} Story Bridge: The Shared Umbrella`
            : `The Shared Umbrella: Characters & Lesson (${gradeLabel})`,
        directions:
          'Listen to or read the short story carefully, noticing the characters, setting, problem, and lesson.',
        sourceTextLabel: 'Story Mini-Passage',
        sourceText:
          'When dark clouds spilled big raindrops after school, Mia opened her bright yellow umbrella. Right beside the steps stood Ben, looking down at his thin notebook with no coat. Mia stepped over and tilted her umbrella above Ben’s head too. Both friends walked dryly to the bus stop, smiling together.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'What problem did Ben have after school, and how did Mia help solve it? Answer in 1–2 sentences.'
                : 'Who are the main characters in this story, and where does the story take place?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Ben was stuck in the rain with his notebook and no coat, and Mia solved the problem by sharing her yellow umbrella on the walk to the bus stop.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    [
                      'Mia and Ben inside a noisy library',
                      'Mia and Ben outside school walking to the bus stop in the rain',
                      'Ben and his teacher inside a school bus',
                      'Mia and her puppy at a sunny park',
                    ],
                    [
                      'Incorrect: They are outside in the rain, not in a library.',
                      'Correct: Identifies both main characters (Mia and Ben) and the rainy setting outside school.',
                      'Incorrect: No teacher appears.',
                      'Incorrect: No puppy or sunshine appears.',
                    ]
                  ),
                  correctAnswer: 'B. Mia and Ben outside school walking to the bus stop in the rain',
                }),
            explanation: `Identifying main characters, setting, and problem/solution anchors K–2 literary reading (${bench.code}).`,
            textualEvidence: '"after school, Mia opened her bright yellow umbrella. Right beside the steps stood Ben..."',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'What lesson or moral does Mia’s action show in 1 sentence?'
                : 'What lesson (theme) does Mia’s choice show?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'Sharing what you have helps others and brings friends closer together.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    [
                      'Never bring notebooks to school.',
                      'Yellow umbrellas work better than blue ones.',
                      'Sharing kindness with a friend helps everyone feel happy.',
                      'Walking fast stops the rain from falling.',
                    ],
                    [
                      'Incorrect: Students need notebooks for school.',
                      'Incorrect: Umbrella color does not create the story’s lesson.',
                      'Correct: Captures the caring lesson shown when Mia shares her umbrella.',
                      'Incorrect: Walking fast does not stop rain.',
                    ]
                  ),
                  correctAnswer: 'C. Sharing kindness with a friend helps everyone feel happy.',
                }),
            explanation: `Story events and character kindness reveal the central moral or lesson (${bench.code}).`,
            textualEvidence: '"Mia stepped over and tilted her umbrella above Ben’s head too. Both friends walked dryly..."',
          },
        ],
      },
      {
        title: `Lost Paintbrush Mystery (${gradeLabel})`,
        directions: 'Read the short story and follow the beginning, middle, and end events.',
        sourceTextLabel: 'Story Mini-Passage',
        sourceText:
          'At art center, Mateo reached for his favorite wide paintbrush, but the cup was empty! He checked under his sketchpad and behind the sink without luck. Then his classmate Nora pointed to a tiny blue smudge near the drying rack. Mateo followed the paint trail and found his brush resting beside a wet paper sailboat.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Put the story events in order: what happened first, next, and at the end?'
                : 'Which detail helped Mateo finally find his missing paintbrush?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'First Mateo saw his brush was missing; next he looked around and Nora spotted a blue smudge; at the end he followed the trail to the drying rack.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'A',
                    [
                      'Nora spotted a tiny blue paint smudge near the drying rack.',
                      'Mateo washed his hands in the sink.',
                      'The art teacher bought new paintbrushes.',
                      'Mateo painted a sailboat after school.',
                    ],
                    [
                      'Correct: Sentence 3 states Nora pointed out the blue smudge that led Mateo to the brush.',
                      'Incorrect: Mateo checked behind the sink, not washing hands.',
                      'Incorrect: No new brushes were bought.',
                      'Incorrect: A wet sailboat was already on the drying rack.',
                    ]
                  ),
                  correctAnswer: 'A. Nora spotted a tiny blue paint smudge near the drying rack.',
                }),
            explanation: `Retelling key plot events in sequence builds story comprehension (${bench.code}).`,
            textualEvidence: '"Nora pointed to a tiny blue smudge near the drying rack."',
          },
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'How did Mateo probably feel when he found the brush beside the sailboat?'
                : 'How did Mateo look for his paintbrush BEFORE Nora helped him?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer: 'He probably felt glad and relieved to find his favorite brush with Nora’s help.',
                  maxSentences: 1,
                }
              : {
                  options: makeMcOptions(
                    'D',
                    [
                      'He asked the principal in the office.',
                      'He stayed seated and cried.',
                      'He went straight to recess.',
                      'He looked under his sketchpad and behind the sink.',
                    ],
                    [
                      'Incorrect: The principal is not in the story.',
                      'Incorrect: Mateo searched calmly.',
                      'Incorrect: They are in art center.',
                      'Correct: Directly stated in Sentence 2.',
                    ]
                  ),
                  correctAnswer: 'D. He looked under his sketchpad and behind the sink.',
                }),
            explanation: `Tracing character actions from beginning to end supports accurate story retelling (${bench.code}).`,
            textualEvidence: '"He checked under his sketchpad and behind the sink without luck."',
          },
        ],
      },
    ];
  }

  if (purpose === 'activate' && priorBench) {
    return [
      {
        title: `${formatGradeLabel(priorBench.grade)} → ${gradeLabel} Literary Bridge: The Missing Trumpet Mouthpiece`,
        directions:
          'Activate what you already know about story elements and character actions to analyze how character traits and theme develop in ' +
          gradeLabel +
          '.',
        sourceTextLabel: 'Literary Mini-Passage',
        sourceText:
          'Ten minutes before the school concert, Lucas unzipped his trumpet case and froze. His silver mouthpiece was gone! His shoulders slumped as he pictured sitting silently on stage. Then his classmate Sofia noticed his worried face and knelt beside his chair. Instead of rushing to warm up her own flute, Sofia helped Lucas trace his steps back to the practice room. Behind a music stand, something glinted on the carpet. Sofia scooped up the mouthpiece, and Lucas breathed out a huge sigh of relief.',
        questions: [
          {
            format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
            prompt:
              questionType === 'short_response'
                ? 'Warm-Up Bridge: What problem does Lucas face at the start of the story, and how is it resolved? Write 1–2 sentences.'
                : 'Warm-Up Bridge (Prior Knowledge): What is the main problem and resolution in this story?',
            ...(questionType === 'short_response'
              ? {
                  correctAnswer:
                    'Lucas loses his trumpet mouthpiece right before the concert, and the problem is resolved when Sofia pauses her own warm-up to help him retrace his steps and find it behind a music stand.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'B',
                    [
                      'Sofia forgets how to play her flute before the concert.',
                      'Lucas loses his trumpet mouthpiece, and Sofia helps him search and find it in the practice room.',
                      'The school concert is canceled because the practice room is locked.',
                      'Lucas decides to play the flute instead of the trumpet.',
                    ],
                    [
                      'Incorrect: Sofia pauses warming up to help Lucas.',
                      'Correct: Activates prior-grade story structure skill (' +
                        priorBench.code +
                        '—problem and resolution) before deeper Grade ' +
                        grade +
                        ' analysis.',
                      'Incorrect: Nothing is canceled or locked.',
                      'Incorrect: He finds his trumpet mouthpiece.',
                    ]
                  ),
                  correctAnswer:
                    'B. Lucas loses his trumpet mouthpiece, and Sofia helps him search and find it in the practice room.',
                }),
            explanation: `Activates prior-grade prerequisite ${priorBench.code} (story elements, problem/resolution, or perspective) as the foundation for Grade ${grade} literary analysis (${bench.code}).`,
            textualEvidence:
              '"His silver mouthpiece was gone! ... Sofia helped Lucas trace his steps back to the practice room."',
          },
          {
            format:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'short_response'
                : questionType === 'grammar_editing'
                  ? 'grammar_editing'
                  : 'multiple_choice',
            prompt:
              questionType === 'short_response' || questionType === 'mixed'
                ? 'Bridge to Grade ' +
                  grade +
                  ': How do Sofia’s choices develop a theme about friendship, and how do Lucas’s feelings change across the plot? Write 1–2 sentences.'
                : 'Bridge to Grade ' +
                  grade +
                  ': How does Sofia’s response to Lucas’s problem help develop the theme of the passage?',
            ...(questionType === 'short_response' || questionType === 'mixed'
              ? {
                  correctAnswer:
                    'By giving up her own flute warm-up to help a worried classmate, Sofia shows that helping friends in need matters more than rushing ahead, turning Lucas’s panic into relief.',
                  maxSentences: 2,
                }
              : {
                  options: makeMcOptions(
                    'C',
                    [
                      'It proves musicians never need to warm up before concerts.',
                      'It shows that lost mouthpieces are always behind music stands.',
                      'Giving up her own warm-up time to help Lucas develops the theme that supporting a friend makes a difference.',
                      'It shows that trumpet players are less organized than flute players.',
                    ],
                    [
                      'Incorrect: Both students arrived early to warm up.',
                      'Incorrect: Too narrow to be a theme.',
                      'Correct: Bridges Grade ' +
                        priorBench.grade +
                        ' plot recall into Grade ' +
                        grade +
                        ' explanation of how character choices develop theme (' +
                        bench.code +
                        ').',
                      'Incorrect: Unsupported generalization.',
                    ]
                  ),
                  correctAnswer:
                    'C. Giving up her own warm-up time to help Lucas develops the theme that supporting a friend makes a difference.',
                }),
            explanation: `Connects Grade ${priorBench.grade} (${priorBench.code}) story structure to Grade ${grade} (${bench.code}) by tracing how character choices develop the theme and resolve tension.`,
            textualEvidence:
              '"Instead of rushing to warm up her own flute, Sofia helped Lucas trace his steps back to the practice room."',
          },
        ],
      },
    ];
  }

  return [
    {
      title: `The Missing Trumpet Mouthpiece (Grade ${grade})`,
      directions:
        'Read the short story excerpt carefully, then answer both questions using evidence from the text.',
      sourceTextLabel: 'Literary Mini-Passage',
      sourceText:
        'Ten minutes before the school concert, Lucas unzipped his trumpet case and froze. His silver mouthpiece was gone! His shoulders slumped as he pictured sitting silently on stage. Then his classmate Sofia noticed his worried face and knelt beside his chair. Instead of rushing to warm up her own flute, Sofia helped Lucas trace his steps back to the practice room. Behind a music stand, something glinted on the carpet. Sofia scooped up the mouthpiece, and Lucas breathed out a huge sigh of relief.',
      questions: [
        {
          format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
          prompt:
            questionType === 'short_response'
              ? 'What theme or lesson does this story show through Sofia’s actions? Explain in 1–2 sentences using a detail from the story.'
              : 'Which statement best expresses a theme of the passage?',
          ...(questionType === 'short_response'
            ? {
                correctAnswer:
                  'A true friend steps in to help others even when they are busy. Sofia paused warming up her own flute to help Lucas retrace his steps and find his mouthpiece.',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'C',
                  [
                    'Practice is unnecessary before a school concert.',
                    'Lost items are always found behind music stands.',
                    'Taking time to help a friend in trouble can make a big difference.',
                    'Flute players are more organized than trumpet players.',
                  ],
                  [
                    'Incorrect: Both students were preparing right before a concert.',
                    'Incorrect: Too specific to this single plot event rather than a universal theme.',
                    'Correct: Captures the universal message shown when Sofia gives up her warm-up time to help Lucas.',
                    'Incorrect: Unsupported generalization about musicians.',
                  ]
                ),
                correctAnswer:
                  'C. Taking time to help a friend in trouble can make a big difference.',
              }),
          explanation:
            'Theme is a broader life message developed through character choices: Sofia chooses kindness over her own warm-up, resolving Lucas’s panic (ELA.R.1.2 / ELA.R.1.1).',
          textualEvidence:
            '"Instead of rushing to warm up her own flute, Sofia helped Lucas trace his steps back to the practice room."',
        },
        {
          format:
            questionType === 'short_response' || questionType === 'mixed'
              ? 'short_response'
              : questionType === 'grammar_editing'
                ? 'grammar_editing'
                : 'multiple_choice',
          prompt:
            questionType === 'short_response' || questionType === 'mixed'
              ? 'How do Lucas’s feelings change from the beginning to the end of the passage? Cite one detail from the text in 1–2 sentences.'
              : 'Which detail best shows Lucas’s panic at the start of the passage?',
          ...(questionType === 'short_response' || questionType === 'mixed'
            ? {
                correctAnswer:
                  'At first Lucas feels panicked and defeated ("froze" and "his shoulders slumped"), but at the end he feels relieved ("breathed out a huge sigh of relief") after Sofia finds the mouthpiece.',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'A',
                  [
                    '"Lucas unzipped his trumpet case and froze. ... His shoulders slumped"',
                    '"Sofia noticed his worried face"',
                    '"Behind a music stand, something glinted"',
                    '"Sofia scooped up the mouthpiece"',
                  ],
                  [
                    'Correct: Physical reactions ("froze" and "shoulders slumped") show Lucas’s shock and worry.',
                    'Incorrect: Describes Sofia’s observation rather than Lucas’s own action.',
                    'Incorrect: Describes finding the mouthpiece at the resolution.',
                    'Incorrect: Describes Sofia picking up the lost piece.',
                  ]
                ),
                correctAnswer: 'A. "Lucas unzipped his trumpet case and froze. ... His shoulders slumped"',
              }),
          explanation:
            'Authors reveal character emotions through concrete actions ("froze," "shoulders slumped," and "huge sigh of relief") (ELA.R.1.1).',
          textualEvidence:
            '"Lucas unzipped his trumpet case and froze. ... Lucas breathed out a huge sigh of relief."',
        },
      ],
    },
    {
      title: `Two Views of the Rainy Recess (Grade ${grade})`,
      directions:
        'Read the short story carefully and pay attention to how each character reacts to the same event.',
      sourceTextLabel: 'Literary Mini-Passage',
      sourceText:
        'When gray rain drummed against the cafeteria windows, Marcus groaned and dropped his chin onto his hands. He had waited all week to test his new paper glider on the kickball field. Across the table, however, Priya’s eyes lit up. "Indoor board-game stations!" she cheered, already reaching for the chess box on the shelf. Watching Priya set up the wooden pieces, Marcus realized he could still test his glider designs by sketching wing folds on scrap paper while they played.',
      questions: [
        {
          format: questionType === 'short_response' ? 'short_response' : 'multiple_choice',
          prompt:
            questionType === 'short_response'
              ? 'Compare how Marcus and Priya feel about indoor recess at first, using one detail for each character (1–2 sentences).'
              : 'How do Marcus’s and Priya’s perspectives about the rainy weather differ at the beginning of the passage?',
          ...(questionType === 'short_response'
            ? {
                correctAnswer:
                  'Marcus is disappointed because he wanted to fly his paper glider outside ("groaned and dropped his chin"), whereas Priya is excited about indoor games ("her eyes lit up" and "she cheered").',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'D',
                  [
                    'Both students hope the rain stops before lunch ends.',
                    'Priya wants to go outside, while Marcus prefers chess.',
                    'Both students feel upset about staying inside the cafeteria.',
                    'Marcus feels disappointed about his glider plans, while Priya feels excited about indoor games.',
                  ],
                  [
                    'Incorrect: Priya immediately welcomes indoor recess.',
                    'Incorrect: Reverses the two characters’ perspectives.',
                    'Incorrect: Only Marcus groans; Priya cheers.',
                    'Correct: Accurately contrasts Marcus’s initial groan with Priya’s excitement.',
                  ]
                ),
                correctAnswer:
                  'D. Marcus feels disappointed about his glider plans, while Priya feels excited about indoor games.',
              }),
          explanation:
            'Comparing character actions and dialogue ("groaned" vs. "cheered") reveals contrasting perspectives on the exact same rainy-day event (ELA.R.1.3).',
          textualEvidence:
            '"Marcus groaned and dropped his chin... Across the table, however, Priya’s eyes lit up."',
        },
        {
          format:
            questionType === 'short_response' || questionType === 'mixed'
              ? 'short_response'
              : questionType === 'grammar_editing'
                ? 'grammar_editing'
                : 'multiple_choice',
          prompt:
            questionType === 'short_response' || questionType === 'mixed'
              ? 'How does Marcus adapt to his disappointment by the end of the passage? Write 1–2 sentences.'
              : 'What causes Marcus’s attitude to change at the end of the passage?',
          ...(questionType === 'short_response' || questionType === 'mixed'
            ? {
                correctAnswer:
                  'Marcus decides to adapt by sketching new wing folds on scrap paper while playing chess with Priya instead of staying upset.',
                maxSentences: 2,
              }
            : {
                options: makeMcOptions(
                  'B',
                  [
                    'The sun suddenly comes out over the kickball field.',
                    'He realizes he can sketch new glider designs indoors while playing chess with Priya.',
                    'His teacher announces that paper gliders are allowed in the hallway.',
                    'He wins a chess trophy from the cafeteria shelf.',
                  ],
                  [
                    'Incorrect: Rain keeps them inside.',
                    'Correct: Watching Priya sparks a constructive indoor plan for his glider.',
                    'Incorrect: Hallway flying is never mentioned.',
                    'Incorrect: No trophy is mentioned.',
                  ]
                ),
                correctAnswer:
                  'B. He realizes he can sketch new glider designs indoors while playing chess with Priya.',
              }),
          explanation:
            'Marcus’s perspective shifts when he finds a creative way to keep working on his glider indoors (ELA.R.1.1 / ELA.R.1.3).',
          textualEvidence:
            '"Marcus realized he could still test his glider designs by sketching wing folds on scrap paper while they played."',
        },
      ],
    },
  ];
}

export function buildFallbackBellringer({
  grade,
  benchmarkCode,
  purpose,
  questionType,
  variantIndex = 0,
  excludeTitles = [],
}: {
  grade: GradeLevel;
  benchmarkCode: string;
  purpose: BellringerPurpose;
  questionType: BellringerQuestionType;
  variantIndex?: number;
  excludeTitles?: string[];
}): BellringerActivity {
  const bench =
    BENCHMARKS_BY_CODE[benchmarkCode] ??
    BENCHMARKS_BY_CODE[`ELA.${grade}.R.2.2`] ??
    BENCHMARKS_BY_CODE[`ELA.${grade}.R.2.1`] ??
    FLORIDA_BENCHMARKS[0];
  const priorBench =
    purpose === 'activate' ? getPriorKnowledgePrerequisite(bench.code, grade) : undefined;
  const bridgeMeta = buildPriorKnowledgeBridgeMeta(grade, bench, purpose);

  let templates: FallbackTemplate[];
  if (bench.strand === 'F') {
    templates = buildFoundationsTemplates(grade, bench, questionType, purpose, priorBench);
  } else if (bench.strand === 'C') {
    templates = buildConventionsTemplates(grade, questionType, purpose, priorBench);
  } else if (bench.strand === 'V') {
    templates = buildVocabularyTemplates(grade, bench, questionType, purpose, priorBench);
  } else {
    templates = buildReadingTemplates(grade, bench, questionType, purpose, priorBench);
  }

  const excluded = new Set(excludeTitles.map((t) => t.trim().toLowerCase()));
  const unexcluded = templates.filter((t) => !excluded.has(t.title.trim().toLowerCase()));
  const pool = unexcluded.length > 0 ? unexcluded : templates;
  const chosen = pool[Math.abs(variantIndex) % pool.length];

  const questions: BellringerQuestion[] = chosen.questions.map((q, idx) => ({
    ...q,
    id: `br-q-${Date.now()}-${idx + 1}`,
    number: idx + 1,
  }));

  const rawActivity: BellringerActivity = {
    id: `bellringer-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    title: chosen.title,
    grade,
    benchmarkCode: bench.code,
    officialBenchmarkText: bench.officialText,
    benchmarkTitle: bench.benchmarkTitle,
    sourceCitation: `${bench.sourceTitle}, PDF p. ${bench.pdfPage}`,
    ...bridgeMeta,
    purpose,
    purposeLabel: getPurposeLabel(purpose),
    questionType,
    questionTypeLabel: getQuestionTypeLabel(questionType),
    estimatedTimeLabel: 'Approximately 5 minutes',
    directions: chosen.directions,
    sourceText: chosen.sourceText,
    sourceTextLabel: chosen.sourceTextLabel,
    questions,
    timeAudit: {
      estimatedMinutes: 5,
      estimatedSeconds: 260,
      passageWordCount: chosen.sourceText ? countWords(chosen.sourceText) : 0,
      wasAutoTrimmed: false,
      trimNotes: [],
    },
    practiceDisclaimer: PRACTICE_DISCLAIMER,
    createdAt: new Date().toISOString(),
    sourceMode: 'verified-fallback',
  };

  return enforceFiveMinuteBudget(rawActivity);
}

export function formatBellringerStudentMarkdown(
  activity: BellringerActivity,
  includeGradeLevel = true
): string {
  const lines: string[] = [];
  lines.push(`# ${activity.title}`);
  if (includeGradeLevel) {
    lines.push(`**Grade Level:** ${formatGradeLabel(activity.grade)}`);
  }
  lines.push(`**Estimated Completion Time:** ${activity.estimatedTimeLabel}`);
  lines.push('');
  lines.push(`**Directions:** ${activity.directions}`);
  lines.push('');

  if (activity.sourceText) {
    lines.push(`## ${activity.sourceTextLabel ?? 'Read the Passage'}`);
    lines.push('');
    lines.push(activity.sourceText);
    lines.push('');
  }

  lines.push('## Questions');
  lines.push('');
  for (const q of activity.questions) {
    lines.push(`${q.number}. ${q.prompt}`);
    if (q.targetSentence) {
      lines.push(`   > ${q.targetSentence}`);
    }
    if (q.options && q.options.length > 0) {
      for (const opt of q.options) {
        lines.push(`   ${opt.label}. ${opt.text}`);
      }
    } else if (q.format === 'short_response') {
      lines.push('   *(Write 1–2 complete sentences below.)*');
      lines.push('   ________________________________________________________________________');
      lines.push('   ________________________________________________________________________');
    } else {
      lines.push('   *Revision:* _____________________________________________________________');
    }
    lines.push('');
  }

  return lines.join('\n');
}

export function formatBellringerStudentText(
  activity: BellringerActivity,
  includeGradeLevel = true
): string {
  const lines: string[] = [];
  lines.push(activity.title);
  if (includeGradeLevel) {
    lines.push(`Grade Level: ${formatGradeLabel(activity.grade)}`);
  }
  lines.push(`Estimated Completion Time: ${activity.estimatedTimeLabel}`);
  lines.push('');
  lines.push(`Directions: ${activity.directions}`);
  lines.push('');
  if (activity.sourceText) {
    lines.push(`${activity.sourceTextLabel ?? 'Source Text'}:`);
    lines.push(activity.sourceText);
    lines.push('');
  }
  for (const q of activity.questions) {
    lines.push(`${q.number}. ${q.prompt}`);
    if (q.targetSentence) {
      lines.push(`   "${q.targetSentence}"`);
    }
    if (q.options && q.options.length > 0) {
      for (const opt of q.options) {
        lines.push(`   ${opt.label}. ${opt.text}`);
      }
    } else if (q.format === 'short_response') {
      lines.push('   (Write 1–2 sentences.)');
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}

export function formatBellringerTeacherMarkdown(activity: BellringerActivity): string {
  const lines: string[] = [];
  lines.push(`# ${activity.title} — Teacher Answer Key`);
  lines.push(`**Grade Level:** ${formatGradeLabel(activity.grade)}`);
  lines.push(`**ELA Standard:** ${activity.benchmarkCode} — ${activity.officialBenchmarkText}`);
  lines.push(`**Source Reference:** ${activity.sourceCitation}`);
  if (activity.priorKnowledgeBenchmarkCode && activity.priorKnowledgeBenchmarkText) {
    lines.push(
      `**Prior Knowledge Bridge Standard:** ${activity.priorKnowledgeBenchmarkCode} — ${activity.priorKnowledgeBenchmarkText}`
    );
  }
  lines.push(`**Instructional Purpose:** ${activity.purposeLabel}`);
  lines.push(`**Question Format:** ${activity.questionTypeLabel}`);
  lines.push(`**Estimated Completion Time:** ${activity.estimatedTimeLabel}`);
  lines.push('');
  lines.push(`**Directions:** ${activity.directions}`);
  lines.push('');

  if (activity.sourceText) {
    lines.push(`## ${activity.sourceTextLabel ?? 'Source Text'} (${activity.timeAudit.passageWordCount} words)`);
    lines.push('');
    lines.push(activity.sourceText);
    lines.push('');
  }

  lines.push('## Questions, Answer Key & Explanations');
  lines.push('');
  for (const q of activity.questions) {
    lines.push(`### Question ${q.number}`);
    lines.push(q.prompt);
    if (q.targetSentence) {
      lines.push(`> ${q.targetSentence}`);
    }
    if (q.options && q.options.length > 0) {
      lines.push('');
      for (const opt of q.options) {
        lines.push(`- **${opt.label}.** ${opt.text}${opt.isCorrect ? ' **(Correct)**' : ''}`);
        if (opt.rationale) {
          lines.push(`  - *Note:* ${opt.rationale}`);
        }
      }
    }
    lines.push('');
    lines.push(`- **Correct Answer:** ${q.correctAnswer}`);
    lines.push(`- **Explanation:** ${q.explanation}`);
    if (q.textualEvidence) {
      lines.push(`- **Supporting Evidence:** ${q.textualEvidence}`);
    }
    lines.push('');
  }

  lines.push(`---`);
  lines.push(`*${activity.practiceDisclaimer}*`);
  return lines.join('\n');
}

export function formatBellringerTeacherText(activity: BellringerActivity): string {
  const lines: string[] = [];
  lines.push(`${activity.title} — Teacher Answer Key`);
  lines.push(`Grade Level: ${formatGradeLabel(activity.grade)}`);
  lines.push(`ELA Standard: ${activity.benchmarkCode} — ${activity.officialBenchmarkText}`);
  if (activity.priorKnowledgeBenchmarkCode && activity.priorKnowledgeBenchmarkText) {
    lines.push(
      `Prior Knowledge Standard: ${activity.priorKnowledgeBenchmarkCode} — ${activity.priorKnowledgeBenchmarkText}`
    );
  }
  lines.push(`Instructional Purpose: ${activity.purposeLabel}`);
  lines.push(`Estimated Completion Time: ${activity.estimatedTimeLabel}`);
  lines.push('');
  if (activity.sourceText) {
    lines.push(`${activity.sourceTextLabel ?? 'Source Text'}:`);
    lines.push(activity.sourceText);
    lines.push('');
  }
  for (const q of activity.questions) {
    lines.push(`Q${q.number}. ${q.prompt}`);
    if (q.targetSentence) {
      lines.push(`   Sentence: "${q.targetSentence}"`);
    }
    if (q.options && q.options.length > 0) {
      for (const opt of q.options) {
        lines.push(`   ${opt.label}. ${opt.text}${opt.isCorrect ? ' [CORRECT]' : ''}`);
      }
    }
    lines.push(`   Answer: ${q.correctAnswer}`);
    lines.push(`   Explanation: ${q.explanation}`);
    if (q.textualEvidence) {
      lines.push(`   Evidence: ${q.textualEvidence}`);
    }
    lines.push('');
  }
  return lines.join('\n').trim();
}
