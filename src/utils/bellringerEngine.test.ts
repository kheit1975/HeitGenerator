import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildFallbackBellringer,
  countWords,
  enforceFiveMinuteBudget,
  formatBellringerStudentMarkdown,
  formatBellringerStudentText,
  formatBellringerTeacherMarkdown,
  getBellringerEligibleBenchmarks,
} from './bellringerEngine.ts';
import type { BellringerActivity } from '../types/ela.ts';

test('getBellringerEligibleBenchmarks returns Grades K–5 benchmarks including Foundational Standards and C.3.1', () => {
  for (const grade of ['K', '1', '2', '3', '4', '5'] as const) {
    const list = getBellringerEligibleBenchmarks(grade);
    assert.ok(list.length > 0, `Expected benchmarks for Grade ${grade}`);
    assert.ok(
      list.some((b) => b.strand === 'F'),
      `Grade ${grade} bellringer list must include Foundational Standards (strand F)`
    );
    assert.ok(
      list.some((b) => b.code === `ELA.${grade}.F.1.3`),
      `Grade ${grade} bellringer list must include ELA.${grade}.F.1.3`
    );
    assert.ok(
      list.some((b) => b.code === `ELA.${grade}.F.1.4`),
      `Grade ${grade} bellringer list must include ELA.${grade}.F.1.4`
    );
    assert.ok(
      list.some((b) => b.code === `ELA.${grade}.C.3.1`),
      `Grade ${grade} bellringer list must include ELA.${grade}.C.3.1`
    );
    if (grade === 'K' || grade === '1') {
      assert.ok(
        list.some((b) => b.code === `ELA.${grade}.F.1.1`) &&
          list.some((b) => b.code === `ELA.${grade}.F.1.2`),
        `Grade ${grade} bellringer list must include F.1.1 and F.1.2`
      );
    } else {
      assert.ok(
        !list.some((b) => b.code === `ELA.${grade}.F.1.1` || b.code === `ELA.${grade}.F.1.2`),
        `Grade ${grade} must only include official F.1.3 and F.1.4`
      );
    }
  }
});

test('enforceFiveMinuteBudget trims oversized passages <= 120 words and caps questions at 2 with passage', () => {
  const longText = Array.from(
    { length: 12 },
    (_, i) =>
      `Sentence ${i + 1} explains how coastal seagrass meadows shelter young fish and crabs in shallow Florida bays.`
  ).join(' ');

  const oversized: BellringerActivity = {
    id: 'test-oversized',
    title: 'Long Passage Check',
    grade: '4',
    benchmarkCode: 'ELA.4.R.2.2',
    officialBenchmarkText: 'Explain how relevant details support the central idea, implied or explicit.',
    benchmarkTitle: 'Central Idea',
    sourceCitation: 'Test',
    purpose: 'review',
    purposeLabel: 'Review a previously taught skill',
    questionType: 'multiple_choice',
    questionTypeLabel: 'Multiple choice',
    estimatedTimeLabel: 'Approximately 5 minutes',
    directions: 'Read and answer.',
    sourceText: longText,
    questions: [
      {
        id: 'q1',
        number: 1,
        format: 'multiple_choice',
        prompt: 'Question 1?',
        correctAnswer: 'A. Answer 1',
        explanation: 'Explanation 1',
      },
      {
        id: 'q2',
        number: 2,
        format: 'multiple_choice',
        prompt: 'Question 2?',
        correctAnswer: 'B. Answer 2',
        explanation: 'Explanation 2',
      },
      {
        id: 'q3',
        number: 3,
        format: 'short_response',
        prompt: 'Question 3?',
        correctAnswer: 'Short answer 3',
        explanation: 'Explanation 3',
        maxSentences: 5,
      },
    ],
    timeAudit: {
      estimatedMinutes: 8,
      estimatedSeconds: 480,
      passageWordCount: countWords(longText),
      wasAutoTrimmed: false,
      trimNotes: [],
    },
    practiceDisclaimer: 'Practice',
    createdAt: new Date().toISOString(),
    sourceMode: 'verified-fallback',
  };

  const audited = enforceFiveMinuteBudget(oversized);
  assert.ok(audited.sourceText);
  assert.ok(countWords(audited.sourceText) <= 120, 'Passage must be <= 120 words');
  assert.equal(audited.questions.length, 2, 'Passage-based bellringer must cap at 2 questions');
  assert.ok(audited.timeAudit.wasAutoTrimmed, 'Audit must flag auto-trimming');
  assert.ok(audited.timeAudit.estimatedSeconds <= 330, 'Estimated seconds must fit ~5 minutes');
});

test('enforceFiveMinuteBudget keeps up to 3 discrete questions when no passage is included', () => {
  const discrete = buildFallbackBellringer({
    grade: '4',
    benchmarkCode: 'ELA.4.C.3.1',
    purpose: 'reinforce',
    questionType: 'grammar_editing',
    variantIndex: 0,
  });

  assert.equal(discrete.sourceText, undefined);
  assert.equal(discrete.questions.length, 3);
  assert.ok(discrete.timeAudit.estimatedSeconds <= 330);
});

test('buildFallbackBellringer produces distinct non-repetitive activities across variants while preserving selections', () => {
  const first = buildFallbackBellringer({
    grade: '4',
    benchmarkCode: 'ELA.4.V.1.3',
    purpose: 'activate',
    questionType: 'multiple_choice',
    variantIndex: 0,
  });

  const second = buildFallbackBellringer({
    grade: '4',
    benchmarkCode: 'ELA.4.V.1.3',
    purpose: 'activate',
    questionType: 'multiple_choice',
    variantIndex: 1,
    excludeTitles: [first.title],
  });

  assert.notEqual(first.title, second.title);
  assert.equal(second.grade, '4');
  assert.equal(second.benchmarkCode, 'ELA.4.V.1.3');
  assert.equal(second.purpose, 'activate');
  assert.equal(second.questionType, 'multiple_choice');
});

test('Student formatting strictly omits answer keys and explanations while Teacher formatting includes them', () => {
  const activity = buildFallbackBellringer({
    grade: '5',
    benchmarkCode: 'ELA.5.R.2.2',
    purpose: 'introduce',
    questionType: 'mixed',
    variantIndex: 0,
  });

  const studentMd = formatBellringerStudentMarkdown(activity, false);
  const studentTxt = formatBellringerStudentText(activity, true);
  const teacherMd = formatBellringerTeacherMarkdown(activity);

  assert.ok(!studentMd.includes('Correct Answer:'), 'Student Markdown must not include Answer Key header');
  assert.ok(!studentMd.includes('(Correct)'), 'Student Markdown must not mark correct choice');
  assert.ok(!studentMd.includes('Explanation:'), 'Student Markdown must not include Explanation header');
  assert.ok(!studentTxt.includes('[CORRECT]'), 'Student Text must not mark correct choice');

  for (const q of activity.questions) {
    assert.ok(!studentMd.includes(q.explanation), 'Student Markdown must omit explanations');
    assert.ok(!studentTxt.includes(q.explanation), 'Student Text must omit explanations');
    if (q.format === 'short_response') {
      assert.ok(!studentMd.includes(q.correctAnswer), 'Student Markdown must omit short-response model answer');
    }
    assert.ok(teacherMd.includes(q.correctAnswer), 'Teacher Markdown must include correctAnswer');
    assert.ok(teacherMd.includes(q.explanation), 'Teacher Markdown must include explanation');
  }

  assert.ok(!studentMd.includes('**Grade Level:**'), 'Optional grade toggle can hide grade in student header');
  assert.ok(teacherMd.includes(activity.benchmarkCode));
  assert.ok(teacherMd.includes(activity.officialBenchmarkText));
});

test('Activate prior knowledge maps Grade 3 standards to Grade 2 standards (including ELA.2.C.3.1) and bridges questions', () => {
  const grade3Codes = [
    'ELA.3.C.3.1',
    'ELA.3.R.1.4',
    'ELA.3.R.2.4',
    'ELA.3.R.3.1',
    'ELA.3.V.1.2',
    'ELA.3.V.1.3',
  ];

  for (const code of grade3Codes) {
    const expectedPrev = code.replace('ELA.3.', 'ELA.2.');
    const activity = buildFallbackBellringer({
      grade: '3',
      benchmarkCode: code,
      purpose: 'activate',
      questionType: 'multiple_choice',
      variantIndex: 0,
    });
    assert.equal(
      activity.priorKnowledgeBenchmarkCode,
      expectedPrev,
      `${code} activate bellringer must map to Grade 2 prerequisite ${expectedPrev}`
    );
    assert.ok(
      activity.priorKnowledgeBenchmarkText && activity.priorKnowledgeBenchmarkText.length > 10,
      `${code} must carry Grade 2 official text`
    );
    const teacherMd = formatBellringerTeacherMarkdown(activity);
    assert.ok(
      teacherMd.includes(expectedPrev),
      `Teacher output for ${code} must surface Grade 2 prerequisite ${expectedPrev}`
    );
    const studentTxt = formatBellringerStudentText(activity, true);
    assert.ok(
      !studentTxt.includes(expectedPrev) && !studentTxt.includes(code),
      'Student handout must omit standard codes'
    );
  }
});

test('Grade 3 ELA.3.R.1.4 poetry, ELA.3.V.1.2 morphology, and ELA.3.C.3.1 answer keys are accurate', () => {
  const poetry = buildFallbackBellringer({
    grade: '3',
    benchmarkCode: 'ELA.3.R.1.4',
    purpose: 'activate',
    questionType: 'multiple_choice',
  });
  assert.ok(poetry.sourceText && /Poem 1/i.test(poetry.sourceText), 'ELA.3.R.1.4 must supply poems');
  assert.match(
    poetry.questions.map((q) => `${q.prompt} ${q.correctAnswer} ${q.explanation}`).join(' '),
    /haiku|rhymed verse|limerick|free verse/i
  );

  const morph = buildFallbackBellringer({
    grade: '3',
    benchmarkCode: 'ELA.3.V.1.2',
    purpose: 'activate',
    questionType: 'multiple_choice',
  });
  assert.match(morph.questions[0].prompt, /unhelpful|un-/i);
  assert.match(morph.questions[0].explanation, /ELA\.2\.V\.1\.2/);

  const convShort = buildFallbackBellringer({
    grade: '3',
    benchmarkCode: 'ELA.3.C.3.1',
    purpose: 'review',
    questionType: 'short_response',
    variantIndex: 1,
  });
  for (const q of convShort.questions) {
    assert.ok(
      !q.correctAnswer.includes('for/because...'),
      'Short response answer key must not contain draft artifacts'
    );
  }
});

test('Kindergarten, Grade 1, and Grade 2 Foundational Standards generate compliant 5-minute bellringers and K-2 prior knowledge bridges', () => {
  const kPhon = buildFallbackBellringer({
    grade: 'K',
    benchmarkCode: 'ELA.K.F.1.2',
    purpose: 'activate',
    questionType: 'multiple_choice',
    variantIndex: 0,
  });
  assert.equal(kPhon.grade, 'K');
  assert.equal(kPhon.priorKnowledgeBenchmarkCode, undefined);
  assert.ok(
    kPhon.priorKnowledgeBridgeNote && !kPhon.priorKnowledgeBridgeNote.includes('ELA.PK'),
    'Kindergarten activate bridge note must not invent Pre-K benchmark codes'
  );
  const kStudent = formatBellringerStudentText(kPhon, true);
  assert.ok(kStudent.includes('Kindergarten'), 'Kindergarten student sheet should format as Kindergarten');
  assert.ok(!kStudent.includes('ELA.K.F.1.2'), 'Student text must omit benchmark code');

  const g1Print = buildFallbackBellringer({
    grade: '1',
    benchmarkCode: 'ELA.1.F.1.1',
    purpose: 'activate',
    questionType: 'multiple_choice',
    variantIndex: 0,
  });
  assert.equal(g1Print.priorKnowledgeBenchmarkCode, 'ELA.K.F.1.1');

  const g2Phonics = buildFallbackBellringer({
    grade: '2',
    benchmarkCode: 'ELA.2.F.1.3',
    purpose: 'activate',
    questionType: 'mixed',
    variantIndex: 0,
  });
  assert.equal(g2Phonics.priorKnowledgeBenchmarkCode, 'ELA.1.F.1.3');
  assert.ok(g2Phonics.timeAudit.estimatedSeconds <= 330);

  const g4Fluency = buildFallbackBellringer({
    grade: '4',
    benchmarkCode: 'ELA.4.F.1.4',
    purpose: 'reinforce',
    questionType: 'multiple_choice',
    variantIndex: 0,
  });
  assert.ok(g4Fluency.sourceText && countWords(g4Fluency.sourceText) <= 120);
});
