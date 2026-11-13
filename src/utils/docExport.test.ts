import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildAssessmentStudentDocHtml,
  buildAssessmentTeacherDocHtml,
  buildBellringerStudentDocHtml,
  buildBellringerTeacherDocHtml,
} from './docExport.ts';
import { buildFallbackBellringer } from './bellringerEngine.ts';
import { SEED_ASSESSMENTS } from '../data/seedData.ts';

function decodeHtml(html: string): string {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#10003;/g, '✓')
    .replace(/&nbsp;/g, ' ');
}

test('Doc exports use early-reader typography, forbid serif/Times/Calibri, and scale font sizes by grade band', () => {
  const k2Activity = buildFallbackBellringer({
    grade: '1',
    benchmarkCode: 'ELA.1.V.1.3',
    purpose: 'reinforce',
    questionType: 'multiple_choice',
    variantIndex: 0,
  });
  const g4Activity = buildFallbackBellringer({
    grade: '4',
    benchmarkCode: 'ELA.4.V.1.3',
    purpose: 'reinforce',
    questionType: 'multiple_choice',
    variantIndex: 0,
  });

  const k2Html = buildBellringerStudentDocHtml(k2Activity, true);
  const g4Html = buildBellringerStudentDocHtml(g4Activity, true);

  for (const html of [k2Html, g4Html]) {
    assert.ok(html.includes('Century Gothic'));
    assert.ok(html.includes('Lexend'));
    assert.ok(!/Times New Roman|Calibri|Georgia/i.test(html));
    assert.ok(html.includes('#1B6B63'), 'Should style headings/targets in Deep Teal #1B6B63');
  }

  // K-2 uses 14pt-16pt body + 1.5 line-height + extra word spacing
  assert.ok(k2Html.includes('14.5pt'));
  assert.ok(k2Html.includes('line-height: 1.5'));
  assert.ok(k2Html.includes('word-spacing: 2.5pt'));
  assert.ok(k2Html.includes('margin: 0.5in'));

  // Grades 3-5 uses 12pt passage + 1.35 line-height
  assert.ok(g4Html.includes('12pt'));
  assert.ok(g4Html.includes('line-height: 1.35'));
});

test('Context clues bellringers highlight target words in passage and question stems and render primary vs upper writing lines', () => {
  const k2Short = buildFallbackBellringer({
    grade: '1',
    benchmarkCode: 'ELA.1.V.1.3',
    purpose: 'reinforce',
    questionType: 'short_response',
    variantIndex: 0,
  });
  const g4Short = buildFallbackBellringer({
    grade: '4',
    benchmarkCode: 'ELA.4.V.1.3',
    purpose: 'reinforce',
    questionType: 'short_response',
    variantIndex: 0,
  });

  const k2Html = buildBellringerStudentDocHtml(k2Short, true);
  const g4Html = buildBellringerStudentDocHtml(g4Short, true);

  // Target vocabulary word "chilly" highlighted in Bold + Underlined Deep Teal in passage and stem
  assert.ok(
    k2Html.includes('<strong style="color: #1B6B63; text-decoration: underline;">chilly</strong>'),
    'K-2 passage and stem should bold-underline target word chilly'
  );
  // Target word "resilient" highlighted in Tide Pool passage and stem
  assert.ok(
    g4Html.includes('<strong style="color: #1B6B63; text-decoration: underline;">resilient</strong>'),
    'Grade 4 Tide Pool passage and stem should bold-underline target word resilient'
  );

  // K-2 primary handwriting lines (solid top, dashed middle, solid bottom)
  assert.ok(k2Html.includes('border-bottom: 1pt dashed #94A3B8'));
  assert.ok(k2Html.includes('border-bottom: 1.25pt solid #1E242B'));

  // Grades 3-5 0.4in open-response lines
  assert.ok(g4Html.includes('height: 0.4in'));
});

test('Assessment Student .doc enforces strict content separation, bordered passage tables, bubble options, Table Match grids, and EBSR deduplication', () => {
  const pairedAssessment = SEED_ASSESSMENTS[0]; // Grade 4 Paired Texts + Table Match + EBSR
  const studentHtml = buildAssessmentStudentDocHtml(pairedAssessment);
  const teacherHtml = buildAssessmentTeacherDocHtml(pairedAssessment);
  const studentPlain = decodeHtml(studentHtml);
  const teacherPlain = decodeHtml(teacherHtml);

  // Margins & Paired Passage Containers
  assert.ok(studentHtml.includes('margin: 0.75in'));
  assert.ok(studentHtml.includes('1.5pt solid #D0DDD9'));
  assert.ok(studentHtml.includes('#F3EFE6'));
  assert.ok(studentPlain.includes('PASSAGE 1'));
  assert.ok(studentPlain.includes('PASSAGE 2'));

  // Student Footnote Glossary Callout Box
  assert.ok(studentHtml.includes('#B8D8D4'));
  assert.ok(studentHtml.includes('#F4FAF8'));
  assert.ok(studentPlain.includes('Glossary & Word Help'));

  // Clean Question Headers & Open Bubble Choices
  assert.ok(studentPlain.includes('Question 1'));
  assert.ok(studentPlain.includes('( A )'));
  assert.ok(studentPlain.includes('( B )'));
  assert.ok(!studentPlain.includes('• A.'));

  // Table Match Grid (no plain-text "Columns:" dump, uses real table with 1pt solid #94A3B8)
  assert.ok(!studentPlain.includes('Columns: Passage 1 Only'));
  assert.ok(studentHtml.includes('1pt solid #94A3B8'));
  assert.ok(studentPlain.includes('Passage 1 Only'));
  assert.ok(studentPlain.includes('Both Passages'));
  assert.ok(studentPlain.includes('[    ]') || studentHtml.includes('[ &nbsp;&nbsp; ]'));

  // EBSR clean Part A / Part B without duplicate "Part A: Part A:"
  assert.ok(!studentPlain.includes('Part A: Part A:'));
  assert.ok(!studentPlain.includes('Part B: Part B:'));
  assert.ok(studentPlain.includes('Part A'));
  assert.ok(studentPlain.includes('Part B'));

  // Strict stripping of adult metadata in Student Version
  assert.ok(!studentPlain.includes('ELA.4.R.3.3'));
  assert.ok(!studentPlain.includes('DOK 3'));
  assert.ok(!studentPlain.includes('Answer Key:'));
  assert.ok(!studentPlain.includes('Instructional Rationale:'));
  assert.ok(!studentPlain.includes('Key Vocabulary Tool'));
  assert.ok(!studentPlain.includes('Text Complexity'));
  assert.ok(!studentPlain.includes(pairedAssessment.passage.practiceDisclaimer));
  for (const item of pairedAssessment.items) {
    assert.ok(!studentPlain.includes(item.correctRationale));
  }

  // Teacher Version & Instructional Coach Styling
  assert.ok(teacherHtml.includes('#3D5A80'));
  assert.ok(teacherPlain.includes('TEACHER EDITION & INSTRUCTIONAL COACH GUIDE'));
  assert.ok(teacherPlain.includes('Pre-Teaching Key Vocabulary Tool'));
  assert.ok(teacherPlain.includes('Target Word & Benchmark'));
  assert.ok(teacherPlain.includes('Context Clue Sentence from Text'));
  // Pre-Teaching Vocab appears BEFORE Reading Passage in Teacher Version
  assert.ok(
    teacherPlain.indexOf('Pre-Teaching Key Vocabulary Tool') <
      teacherPlain.indexOf('Reading Passage & Annotated Vocabulary')
  );
  assert.ok(teacherHtml.includes('#166534'), 'Correct choices highlighted in Deep Forest Green');
  assert.ok(teacherPlain.includes('✓ ( A )') || teacherPlain.includes('✓ ( B )'));
  assert.ok(teacherPlain.includes('✓ CORRECT'), 'Teacher Table Match cells pre-filled with ✓ CORRECT');
  assert.ok(teacherHtml.includes('#F0F4F8'), 'Coach callout box background');
  assert.ok(teacherHtml.includes('4pt solid #3D5A80'), 'Coach callout left accent border');
  assert.ok(teacherPlain.includes('Answer Key:'));
  assert.ok(teacherPlain.includes('Instructional Rationale:'));
  assert.ok(teacherPlain.includes('B.E.S.T. Source Reference:'));
  for (const item of pairedAssessment.items) {
    assert.ok(teacherPlain.includes(item.benchmarkCode));
  }
});

test('Bellringer Student .doc strips adult metadata while Teacher .doc renders Notebook Indigo coach guide', () => {
  const activity = buildFallbackBellringer({
    grade: '4',
    benchmarkCode: 'ELA.4.C.3.1',
    purpose: 'reinforce',
    questionType: 'mixed',
    variantIndex: 0,
  });

  const studentHtml = buildBellringerStudentDocHtml(activity, true);
  const teacherHtml = buildBellringerTeacherDocHtml(activity);
  const studentPlain = decodeHtml(studentHtml);
  const teacherPlain = decodeHtml(teacherHtml);

  assert.ok(studentHtml.includes('urn:schemas-microsoft-com:office:word'));
  assert.ok(studentPlain.includes('Estimated completion time: 5 minutes'));
  assert.ok(studentPlain.includes('Name:'));
  assert.ok(!studentPlain.includes(activity.benchmarkCode));
  assert.ok(!studentPlain.includes('Answer Key:'));
  assert.ok(!studentPlain.includes('Instructional Rationale:'));
  assert.ok(!studentPlain.includes(activity.practiceDisclaimer));

  for (const q of activity.questions) {
    assert.ok(!studentPlain.includes(q.explanation));
    if (q.format === 'short_response') {
      assert.ok(!studentPlain.includes(q.correctAnswer));
    }
    assert.ok(teacherPlain.includes(q.explanation));
  }

  assert.ok(teacherPlain.includes('TEACHER EDITION & INSTRUCTIONAL COACH GUIDE'));
  assert.ok(teacherPlain.includes(activity.benchmarkCode));
  assert.ok(teacherPlain.includes(activity.officialBenchmarkText));
  assert.ok(teacherPlain.includes('Answer Key:'));
  assert.ok(teacherPlain.includes('Instructional Rationale:'));
});
