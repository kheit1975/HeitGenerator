import { FAST_ITEM_TYPE_INFO, formatGradeLabel } from '../data/floridaStandards.ts';
import type {
  AssessmentItem,
  BellringerActivity,
  BellringerQuestion,
  GradeLevel,
  ItemOption,
  SavedAssessment,
} from '../types/ela.ts';

const PALETTE = {
  deepTeal: '#1B6B63',
  warmCharcoal: '#1E242B',
  slateGray: '#5A6570',
  notebookIndigo: '#3D5A80',
  coachTint: '#F0F4F8',
  coachBorder: '#CBD5E1',
  forestGreen: '#166534',
  forestFill: '#ECFDF5',
  forestBorder: '#86EFAC',
  mintBorder: '#B8D8D4',
  mintCreamFill: '#F4FAF8',
  passageBorder: '#D0DDD9',
  softSand: '#F3EFE6',
  softSandAlt: '#FAF7F0',
  tableBorder: '#94A3B8',
  pillBg: '#EEF2F7',
  pillBorder: '#C5D1E0',
  white: '#FFFFFF',
};

const EARLY_READER_FONT =
  '"Century Gothic", "Lexend", "Comic Sans MS", "Arial Rounded MT Bold", Arial, sans-serif';
const MONO_FONT = '"Consolas", "Courier New", monospace';

interface GradeBandTypography {
  isPrimary: boolean;
  passageFontSize: string;
  passageLineHeight: string;
  passageWordSpacing: string;
  questionFontSize: string;
  optionFontSize: string;
  questionLineHeight: string;
  questionWordSpacing: string;
  paraNumFontSize: string;
}

function getGradeBandTypography(grade: GradeLevel): GradeBandTypography {
  const isPrimary = grade === 'K' || grade === '1' || grade === '2';
  if (isPrimary) {
    return {
      isPrimary: true,
      passageFontSize: '14.5pt',
      passageLineHeight: '1.5',
      passageWordSpacing: '2.5pt',
      questionFontSize: '14pt',
      optionFontSize: '14pt',
      questionLineHeight: '1.5',
      questionWordSpacing: '2pt',
      paraNumFontSize: '11.5pt',
    };
  }
  return {
    isPrimary: false,
    passageFontSize: '12pt',
    passageLineHeight: '1.35',
    passageWordSpacing: 'normal',
    questionFontSize: '12pt',
    optionFontSize: '11.5pt',
    questionLineHeight: '1.35',
    questionWordSpacing: 'normal',
    paraNumFontSize: '10pt',
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function stripPartPrefix(prompt: string | undefined, part: 'A' | 'B'): string {
  const fallback = part === 'A' ? 'Select the best answer.' : 'Which detail supports your answer?';
  if (!prompt || !prompt.trim()) return fallback;
  let cleaned = prompt.trim();
  const re = new RegExp(`^(?:Part\\s*${part}\\s*[:.\\-–—]?\\s*)+`, 'i');
  cleaned = cleaned.replace(re, '').trim();
  return cleaned || fallback;
}

const STOPWORD_TARGET_TERMS = new Set([
  'word',
  'words',
  'phrase',
  'phrases',
  'sentence',
  'sentences',
  'passage',
  'text',
  'story',
  'poem',
  'article',
  'author',
  'reader',
  'meaning',
  'context',
  'clue',
  'clues',
  'this',
  'that',
  'these',
  'those',
  'the',
  'part',
  'second',
  'first',
  'final',
  'last',
]);

function isValidTargetTerm(candidate: string): boolean {
  const clean = candidate.trim().replace(/^["'“”‘’]+|["'“”‘’]+$/g, '');
  if (clean.length < 3 || clean.length > 28) return false;
  const wordCount = clean.split(/\s+/).length;
  if (wordCount > 3) return false;
  if (STOPWORD_TARGET_TERMS.has(clean.toLowerCase())) return false;
  return /^[A-Za-z][A-Za-z\s'-]*$/.test(clean);
}

function extractTargetWordsFromPromptText(prompt: string): string[] {
  const found: string[] = [];
  const patterns: RegExp[] = [
    /what\s+does\s+(?:the\s+(?:multiple-meaning\s+)?(?:word|phrase)\s+)?["“]([^"”]+)["”]\s+mean/gi,
    /meaning\s+of\s+(?:the\s+(?:multiple-meaning\s+)?(?:word|phrase)\s+)?["“]([^"”]+)["”]/gi,
    /(?:look\s+at|understand|determine|clarify)\s+(?:the\s+meaning\s+of\s+)?(?:the\s+(?:word|phrase)\s+)?["“]([^"”]+)["”]/gi,
    /(?:word|phrase)\s+["“]([^"”]+)["”]/gi,
    /meaning\s+of\s+(?:the\s+(?:word|phrase)\s+)?([A-Za-z][A-Za-z'-]{2,24})(?=[.,?;!\s]|$)/gi,
    /the\s+word\s+([A-Za-z][A-Za-z'-]{2,24})\s+(?:comes\s+from|mean|means|in\s+(?:Paragraph|Sentence|Passage))/gi,
    /what\s+does\s+([A-Za-z][A-Za-z'-]{2,24})\s+mean/gi,
  ];

  for (const regex of patterns) {
    let match: RegExpExecArray | null;
    while ((match = regex.exec(prompt)) !== null) {
      const candidate = match[1]?.trim();
      if (candidate && isValidTargetTerm(candidate)) {
        found.push(candidate);
      }
    }
  }
  return Array.from(new Set(found.map((w) => w.trim())));
}

function isBellringerVocabularyFocused(activity: BellringerActivity): boolean {
  if (activity.benchmarkCode.includes('.V.')) return true;
  const haystack = `${activity.title} ${activity.directions} ${activity.benchmarkTitle}`.toLowerCase();
  return /context clue|word meaning|vocabulary|multiple-meaning/.test(haystack);
}

function collectBellringerTargetWords(activity: BellringerActivity): string[] {
  const terms: string[] = [];
  const vocabFocused = isBellringerVocabularyFocused(activity);
  for (const q of activity.questions) {
    terms.push(...extractTargetWordsFromPromptText(q.prompt));
  }
  if (vocabFocused && terms.length === 0 && activity.sourceText) {
    for (const q of activity.questions) {
      if (q.correctAnswer) {
        const quoted = q.correctAnswer.match(/["“]([A-Za-z][A-Za-z\s'-]{2,24})["”]/g) ?? [];
        for (const raw of quoted) {
          const clean = raw.replace(/["“”]/g, '').trim();
          if (isValidTargetTerm(clean)) terms.push(clean);
        }
      }
    }
  }
  return Array.from(new Set(terms));
}

function collectAssessmentTargetWords(assessment: SavedAssessment): string[] {
  const terms: string[] = [];
  for (const v of assessment.passage.vocabularyGuide) {
    if (v.word && isValidTargetTerm(v.word)) {
      terms.push(v.word.trim());
    }
  }
  for (const g of assessment.passage.glossary) {
    if (g.term && isValidTargetTerm(g.term)) {
      terms.push(g.term.trim());
    }
  }
  for (const item of assessment.items) {
    terms.push(...extractTargetWordsFromPromptText(item.prompt));
    if (item.partAPrompt) terms.push(...extractTargetWordsFromPromptText(item.partAPrompt));
    if (item.partBPrompt) terms.push(...extractTargetWordsFromPromptText(item.partBPrompt));
  }
  return Array.from(new Set(terms));
}

function highlightTargetWordsHtml(rawText: string, targetWords: string[]): string {
  const validTargets = Array.from(
    new Set(targetWords.map((w) => w.trim()).filter((w) => isValidTargetTerm(w)))
  ).sort((a, b) => b.length - a.length);

  if (validTargets.length === 0) {
    return escapeHtml(rawText);
  }

  const pattern = new RegExp(`\\b(${validTargets.map(escapeRegExp).join('|')})\\b`, 'gi');
  let result = '';
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = pattern.exec(rawText)) !== null) {
    if (match.index > lastIndex) {
      result += escapeHtml(rawText.slice(lastIndex, match.index));
    }
    result += `<strong style="color: ${PALETTE.deepTeal}; text-decoration: underline;">${escapeHtml(match[0])}</strong>`;
    lastIndex = pattern.lastIndex;
  }

  if (lastIndex < rawText.length) {
    result += escapeHtml(rawText.slice(lastIndex));
  }

  return result;
}

function formatQuestionStemHtml(rawPrompt: string): string {
  const stemTargets = extractTargetWordsFromPromptText(rawPrompt);
  if (stemTargets.length === 0) {
    return escapeHtml(rawPrompt);
  }
  return highlightTargetWordsHtml(rawPrompt, stemTargets);
}

function renderMonospacePillHtml(code: string): string {
  return `<span style="font-family: ${MONO_FONT}; font-size: 8.5pt; font-weight: bold; color: ${PALETTE.notebookIndigo}; background-color: ${PALETTE.pillBg}; border: 1pt solid ${PALETTE.pillBorder}; padding: 1.5pt 5pt; white-space: nowrap;">${escapeHtml(code)}</span>`;
}

function renderNeutralBadgeHtml(label: string): string {
  return `<span style="font-family: ${EARLY_READER_FONT}; font-size: 8.5pt; font-weight: bold; color: ${PALETTE.warmCharcoal}; background-color: ${PALETTE.softSand}; border: 1pt solid ${PALETTE.passageBorder}; padding: 1.5pt 6pt; white-space: nowrap;">${escapeHtml(label)}</span>`;
}

function renderWritingLinesHtml(isPrimary: boolean, lineCount: number): string {
  const count = Math.max(1, lineCount);
  if (isPrimary) {
    // Primary handwriting lines: solid top line, dashed middle line, solid bottom baseline
    const blocks = Array.from({ length: count })
      .map(
        () => `
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 7pt 0 3pt 0;">
          <tr>
            <td style="height: 0.21in; border-top: 1pt solid ${PALETTE.slateGray}; border-bottom: 1pt dashed #94A3B8; font-size: 1pt; line-height: 1pt;">&nbsp;</td>
          </tr>
          <tr>
            <td style="height: 0.21in; border-bottom: 1.25pt solid ${PALETTE.warmCharcoal}; font-size: 1pt; line-height: 1pt;">&nbsp;</td>
          </tr>
        </table>`
      )
      .join('\n');
    return `<div style="margin-top: 4pt;">${blocks}</div>`;
  }

  // Upper elementary open-response lines: wide 0.4in tall writing lines
  const rows = Array.from({ length: count })
    .map(
      () => `
      <tr>
        <td style="height: 0.4in; border-bottom: 1pt solid ${PALETTE.slateGray}; font-size: 1pt; line-height: 1pt;">&nbsp;</td>
      </tr>`
    )
    .join('\n');
  return `
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 4pt 0 2pt 0;">
      ${rows}
    </table>`;
}

function renderStudentBubbleOptionsHtml(
  options: { label: string; text: string }[],
  typo: GradeBandTypography,
  compact = false
): string {
  const gap = compact ? '5pt' : '6pt';
  return options
    .map(
      (opt) => `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 0 0 ${gap} 0;">
        <tr>
          <td style="width: 40pt; vertical-align: top; padding: 1pt 4pt 1pt 6pt; font-family: ${EARLY_READER_FONT}; font-size: ${typo.optionFontSize}; line-height: ${typo.questionLineHeight}; font-weight: bold; color: ${PALETTE.slateGray}; white-space: nowrap;">
            ( ${escapeHtml(opt.label)} )
          </td>
          <td style="vertical-align: top; padding: 1pt 0; font-family: ${EARLY_READER_FONT}; font-size: ${typo.optionFontSize}; line-height: ${typo.questionLineHeight}; word-spacing: ${typo.questionWordSpacing}; color: ${PALETTE.warmCharcoal};">
            ${escapeHtml(opt.text)}
          </td>
        </tr>
      </table>`
    )
    .join('\n');
}

function renderTeacherOptionsHtml(
  options: { label: string; text: string; isCorrect: boolean; rationale?: string }[],
  typo: GradeBandTypography
): string {
  return options
    .map((opt) => {
      const rowBg = opt.isCorrect ? PALETTE.forestFill : PALETTE.white;
      const rowBorder = opt.isCorrect ? `1pt solid ${PALETTE.forestBorder}` : 'none';
      const labelColor = opt.isCorrect ? PALETTE.forestGreen : PALETTE.slateGray;
      const textColor = opt.isCorrect ? PALETTE.forestGreen : PALETTE.warmCharcoal;
      const prefix = opt.isCorrect ? `&#10003; ( ${escapeHtml(opt.label)} )` : `( ${escapeHtml(opt.label)} )`;
      const badge = opt.isCorrect
        ? ` <span style="font-size: 8.5pt; font-weight: bold; color: ${PALETTE.forestGreen};">[CORRECT]</span>`
        : '';
      const rationaleHtml = opt.rationale
        ? `<div style="margin-top: 2pt; font-size: 9.5pt; line-height: 1.3; font-weight: normal; color: ${PALETTE.slateGray};">${escapeHtml(opt.rationale)}</div>`
        : '';

      return `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 0 0 5pt 0; background-color: ${rowBg}; border: ${rowBorder};">
        <tr>
          <td style="width: 52pt; vertical-align: top; padding: 3pt 4pt 3pt 6pt; font-family: ${EARLY_READER_FONT}; font-size: ${typo.optionFontSize}; line-height: ${typo.questionLineHeight}; font-weight: bold; color: ${labelColor}; white-space: nowrap;">
            ${prefix}
          </td>
          <td style="vertical-align: top; padding: 3pt 6pt 3pt 0; font-family: ${EARLY_READER_FONT}; font-size: ${typo.optionFontSize}; line-height: ${typo.questionLineHeight}; word-spacing: ${typo.questionWordSpacing}; color: ${textColor}; font-weight: ${opt.isCorrect ? 'bold' : 'normal'};">
            ${escapeHtml(opt.text)}${badge}
            ${rationaleHtml}
          </td>
        </tr>
      </table>`;
    })
    .join('\n');
}

function renderStudentHeaderRowHtml(compact: boolean): string {
  const padBottom = compact ? '6pt' : '8pt';
  const marginBottom = compact ? '8pt' : '12pt';
  return `
  <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 4pt 0 ${marginBottom} 0; border-bottom: 1pt solid ${PALETTE.passageBorder};">
    <tr>
      <td style="width: 63%; padding: 0 8pt ${padBottom} 0; font-family: ${EARLY_READER_FONT}; font-size: 10.5pt; font-weight: bold; color: ${PALETTE.warmCharcoal};">
        Name: _____________________________________
      </td>
      <td style="width: 37%; text-align: right; padding: 0 0 ${padBottom} 8pt; font-family: ${EARLY_READER_FONT}; font-size: 10.5pt; font-weight: bold; color: ${PALETTE.warmCharcoal};">
        Date: _________________
      </td>
    </tr>
  </table>`;
}

function renderTeacherEditionBannerHtml(subtitle: string): string {
  return `
  <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 0 0 10pt 0; background-color: ${PALETTE.notebookIndigo};">
    <tr>
      <td style="padding: 8pt 12pt; font-family: ${EARLY_READER_FONT}; font-size: 11pt; font-weight: bold; color: ${PALETTE.white}; letter-spacing: 0.5pt;">
        TEACHER EDITION &amp; INSTRUCTIONAL COACH GUIDE
      </td>
      <td style="padding: 8pt 12pt; text-align: right; font-family: ${EARLY_READER_FONT}; font-size: 9pt; font-weight: bold; color: ${PALETTE.softSand};">
        ${escapeHtml(subtitle)}
      </td>
    </tr>
  </table>`;
}

function renderAssessmentPassageContainersHtml(
  assessment: SavedAssessment,
  targetWords: string[],
  typo: GradeBandTypography
): string {
  let runningPara = 0;

  return assessment.passage.sections
    .map((section, sIdx) => {
      const parasHtml = section.paragraphs
        .map((para) => {
          runningPara += 1;
          return `
            <p style="margin: 0 0 8pt 0; font-family: ${EARLY_READER_FONT}; font-size: ${typo.passageFontSize}; line-height: ${typo.passageLineHeight}; word-spacing: ${typo.passageWordSpacing}; color: ${PALETTE.warmCharcoal};">
              <strong style="color: ${PALETTE.deepTeal}; font-size: ${typo.paraNumFontSize}; margin-right: 5pt;">[${runningPara}]</strong>${highlightTargetWordsHtml(para, targetWords)}
            </p>`;
        })
        .join('\n');

      const genreNote = section.sourceNote ? section.sourceNote : section.label;

      return `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1.5pt solid ${PALETTE.passageBorder}; background-color: ${PALETTE.white}; margin: 0 0 12pt 0;">
        <tr>
          <td style="background-color: ${PALETTE.softSand}; border-bottom: 1pt solid ${PALETTE.passageBorder}; padding: 6pt 12pt;">
            <span style="font-family: ${EARLY_READER_FONT}; font-size: 10.5pt; font-weight: bold; color: ${PALETTE.deepTeal}; letter-spacing: 0.6pt;">PASSAGE ${sIdx + 1}</span>
            <span style="font-family: ${EARLY_READER_FONT}; font-size: 10.5pt; font-style: italic; color: ${PALETTE.slateGray};"> &middot; ${escapeHtml(section.label)}</span>
          </td>
        </tr>
        <tr>
          <td style="background-color: ${PALETTE.white}; padding: 12pt;">
            <div style="font-family: ${EARLY_READER_FONT}; font-size: 14pt; font-weight: bold; color: ${PALETTE.warmCharcoal}; margin: 0 0 3pt 0;">
              ${escapeHtml(section.title)}
            </div>
            <div style="font-family: ${EARLY_READER_FONT}; font-size: 10.5pt; font-style: italic; color: ${PALETTE.slateGray}; margin: 0 0 9pt 0;">
              ${escapeHtml(genreNote)}
            </div>
            ${parasHtml}
          </td>
        </tr>
      </table>`;
    })
    .join('\n');
}

function renderGlossaryCalloutBoxHtml(glossary: { term: string; definition: string }[]): string {
  if (glossary.length === 0) return '';
  const itemsHtml = glossary
    .map(
      (g) =>
        `<div style="margin: 0 0 3pt 0; font-family: ${EARLY_READER_FONT}; font-size: 10pt; line-height: 1.35; color: ${PALETTE.warmCharcoal};">
          <strong style="color: ${PALETTE.deepTeal};">${escapeHtml(g.term)}:</strong> ${escapeHtml(g.definition)}
        </div>`
    )
    .join('\n');

  return `
  <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1pt solid ${PALETTE.mintBorder}; background-color: ${PALETTE.mintCreamFill}; margin: 0 0 12pt 0;">
    <tr>
      <td style="padding: 8pt 12pt;">
        <div style="font-family: ${EARLY_READER_FONT}; font-size: 10.5pt; font-weight: bold; color: ${PALETTE.deepTeal}; margin: 0 0 4pt 0;">
          Glossary &amp; Word Help
        </div>
        ${itemsHtml}
      </td>
    </tr>
  </table>`;
}

function renderCoachCalloutBoxHtml(params: {
  answerKey: string;
  rationale: string;
  evidence?: string;
  sourceCitation?: string;
}): string {
  const { answerKey, rationale, evidence, sourceCitation } = params;
  return `
  <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; background-color: ${PALETTE.coachTint}; border-top: 0.5pt solid ${PALETTE.coachBorder}; border-right: 0.5pt solid ${PALETTE.coachBorder}; border-bottom: 0.5pt solid ${PALETTE.coachBorder}; border-left: 4pt solid ${PALETTE.notebookIndigo}; margin: 6pt 0 0 0;">
    <tr>
      <td style="padding: 7pt 10pt; font-family: ${EARLY_READER_FONT}; font-size: 10pt; line-height: 1.35; color: ${PALETTE.warmCharcoal};">
        <div style="margin: 0 0 3pt 0;">
          <strong style="color: ${PALETTE.notebookIndigo};">Answer Key:</strong>
          <strong style="color: ${PALETTE.forestGreen};"> ${escapeHtml(answerKey)}</strong>
        </div>
        <div style="margin: 0 0 3pt 0;">
          <strong style="color: ${PALETTE.notebookIndigo};">Instructional Rationale:</strong> ${escapeHtml(rationale)}
        </div>
        ${
          evidence
            ? `<div style="margin: 0 0 3pt 0;">
                <strong style="color: ${PALETTE.notebookIndigo};">Textual Evidence:</strong> <em>${escapeHtml(evidence)}</em>
              </div>`
            : ''
        }
        ${
          sourceCitation
            ? `<div style="margin: 2pt 0 0 0; font-size: 9pt; color: ${PALETTE.slateGray};">
                <strong>B.E.S.T. Source Reference:</strong> ${escapeHtml(sourceCitation)}
              </div>`
            : ''
        }
      </td>
    </tr>
  </table>`;
}

function wrapWordDocumentHtml(
  title: string,
  bodyHtml: string,
  options: { marginInches: number; typo: GradeBandTypography }
): string {
  const { marginInches, typo } = options;
  return `<!DOCTYPE html>
<html xmlns:o="urn:schemas-microsoft-com:office:office"
      xmlns:w="urn:schemas-microsoft-com:office:word"
      xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(title)}</title>
  <!--[if gte mso 9]>
  <xml>
    <w:WordDocument>
      <w:View>Print</w:View>
      <w:Zoom>100</w:Zoom>
      <w:DoNotOptimizeForBrowser/>
    </w:WordDocument>
  </xml>
  <![endif]-->
  <style>
    @page {
      size: letter;
      margin: ${marginInches}in;
    }
    body {
      font-family: ${EARLY_READER_FONT};
      font-size: ${typo.questionFontSize};
      line-height: ${typo.questionLineHeight};
      color: ${PALETTE.warmCharcoal};
      margin: 0;
      padding: 0;
    }
    h1 {
      font-family: ${EARLY_READER_FONT};
      font-size: 18pt;
      font-weight: bold;
      color: ${PALETTE.deepTeal};
      margin: 0 0 6pt 0;
      line-height: 1.2;
    }
    h2 {
      font-family: ${EARLY_READER_FONT};
      font-size: 13.5pt;
      font-weight: bold;
      color: ${PALETTE.deepTeal};
      margin: 12pt 0 6pt 0;
      border-bottom: 1pt solid ${PALETTE.passageBorder};
      padding-bottom: 3pt;
    }
    .question-block {
      margin-bottom: 12pt;
      page-break-inside: avoid;
    }
    .page-break {
      page-break-before: always;
    }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

function renderStudentAssessmentItemBodyHtml(
  item: AssessmentItem,
  typo: GradeBandTypography
): string {
  if (item.itemType === 'ebsr' || (item.partAOptions && item.partAOptions.length > 0)) {
    const partAText = stripPartPrefix(item.partAPrompt, 'A');
    const partBText = stripPartPrefix(item.partBPrompt, 'B');
    const partAOpts = renderStudentBubbleOptionsHtml(item.partAOptions ?? [], typo);
    const partBOpts = renderStudentBubbleOptionsHtml(item.partBOptions ?? [], typo);

    return `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1pt solid ${PALETTE.mintBorder}; background-color: ${PALETTE.white}; margin-top: 5pt;">
        <tr>
          <td style="padding: 9pt 11pt;">
            <div style="margin: 0 0 5pt 0; font-family: ${EARLY_READER_FONT}; font-size: ${typo.questionFontSize}; line-height: ${typo.questionLineHeight}; color: ${PALETTE.warmCharcoal};">
              <span style="background-color: ${PALETTE.mintCreamFill}; border: 1pt solid ${PALETTE.mintBorder}; color: ${PALETTE.deepTeal}; font-weight: bold; font-size: 9.5pt; padding: 1.5pt 6pt; margin-right: 5pt;">Part A</span>
              <strong>${formatQuestionStemHtml(partAText)}</strong>
            </div>
            ${partAOpts}
            <div style="margin: 8pt 0 5pt 0; padding-top: 7pt; border-top: 1pt dashed ${PALETTE.passageBorder}; font-family: ${EARLY_READER_FONT}; font-size: ${typo.questionFontSize}; line-height: ${typo.questionLineHeight}; color: ${PALETTE.warmCharcoal};">
              <span style="background-color: ${PALETTE.mintCreamFill}; border: 1pt solid ${PALETTE.mintBorder}; color: ${PALETTE.deepTeal}; font-weight: bold; font-size: 9.5pt; padding: 1.5pt 6pt; margin-right: 5pt;">Part B</span>
              <strong>${formatQuestionStemHtml(partBText)}</strong>
            </div>
            ${partBOpts}
          </td>
        </tr>
      </table>`;
  }

  if (item.options && item.options.length > 0) {
    return renderStudentBubbleOptionsHtml(item.options, typo);
  }

  if (item.hotTextSegments && item.hotTextSegments.length > 0) {
    return item.hotTextSegments
      .map(
        (seg) => `
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 0 0 6pt 0;">
          <tr>
            <td style="width: 44pt; vertical-align: top; padding: 1pt 4pt 1pt 6pt; font-family: ${EARLY_READER_FONT}; font-size: ${typo.optionFontSize}; font-weight: bold; color: ${PALETTE.slateGray}; white-space: nowrap;">
              [ &nbsp;&nbsp; ]
            </td>
            <td style="vertical-align: top; padding: 1pt 0; font-family: ${EARLY_READER_FONT}; font-size: ${typo.optionFontSize}; line-height: ${typo.questionLineHeight}; word-spacing: ${typo.questionWordSpacing}; color: ${PALETTE.warmCharcoal};">
              <strong style="color: ${PALETTE.deepTeal};">[Paragraph ${seg.paragraphRef}]</strong> &ldquo;${escapeHtml(seg.text)}&rdquo;
            </td>
          </tr>
        </table>`
      )
      .join('\n');
  }

  if (item.tableMatch) {
    const colWidth = `${Math.max(12, Math.floor(42 / Math.max(1, item.tableMatch.columns.length)))}%`;
    const headers = item.tableMatch.columns
      .map(
        (c) =>
          `<th style="width: ${colWidth}; border: 1pt solid ${PALETTE.tableBorder}; background-color: ${PALETTE.softSand}; color: ${PALETTE.warmCharcoal}; padding: 6pt 7pt; text-align: center; font-family: ${EARLY_READER_FONT}; font-size: 10pt; font-weight: bold;">${escapeHtml(c.label)}</th>`
      )
      .join('');
    const rows = item.tableMatch.rows
      .map((r) => {
        const cells = item.tableMatch!.columns
          .map(
            () =>
              `<td style="border: 1pt solid ${PALETTE.tableBorder}; padding: 6pt 7pt; text-align: center; vertical-align: middle; font-family: ${EARLY_READER_FONT}; font-size: 11pt; font-weight: bold; color: ${PALETTE.slateGray};">[ &nbsp;&nbsp; ]</td>`
          )
          .join('');
        return `
          <tr>
            <td style="border: 1pt solid ${PALETTE.tableBorder}; padding: 6pt 8pt; text-align: left; vertical-align: middle; font-family: ${EARLY_READER_FONT}; font-size: ${typo.optionFontSize}; line-height: ${typo.questionLineHeight}; color: ${PALETTE.warmCharcoal};">
              ${escapeHtml(r.statement)}
            </td>
            ${cells}
          </tr>`;
      })
      .join('\n');

    return `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 6pt 0 4pt 0;">
        <thead>
          <tr>
            <th style="border: 1pt solid ${PALETTE.tableBorder}; background-color: ${PALETTE.softSand}; color: ${PALETTE.warmCharcoal}; padding: 6pt 8pt; text-align: left; font-family: ${EARLY_READER_FONT}; font-size: 10pt; font-weight: bold;">Detail / Statement</th>
            ${headers}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  return renderWritingLinesHtml(typo.isPrimary, 3);
}

function renderTeacherAssessmentItemBodyHtml(
  item: AssessmentItem,
  typo: GradeBandTypography
): string {
  if (item.itemType === 'ebsr' || (item.partAOptions && item.partAOptions.length > 0)) {
    const partAText = stripPartPrefix(item.partAPrompt, 'A');
    const partBText = stripPartPrefix(item.partBPrompt, 'B');
    const partAOpts = renderTeacherOptionsHtml(item.partAOptions ?? [], typo);
    const partBOpts = renderTeacherOptionsHtml(item.partBOptions ?? [], typo);

    return `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1pt solid ${PALETTE.mintBorder}; background-color: ${PALETTE.white}; margin-top: 4pt;">
        <tr>
          <td style="padding: 8pt 10pt;">
            <div style="margin: 0 0 5pt 0; font-family: ${EARLY_READER_FONT}; font-size: ${typo.questionFontSize}; line-height: ${typo.questionLineHeight}; color: ${PALETTE.warmCharcoal};">
              <span style="background-color: ${PALETTE.mintCreamFill}; border: 1pt solid ${PALETTE.mintBorder}; color: ${PALETTE.deepTeal}; font-weight: bold; font-size: 9pt; padding: 1.5pt 6pt; margin-right: 5pt;">Part A</span>
              <strong>${formatQuestionStemHtml(partAText)}</strong>
            </div>
            ${partAOpts}
            <div style="margin: 8pt 0 5pt 0; padding-top: 7pt; border-top: 1pt dashed ${PALETTE.passageBorder}; font-family: ${EARLY_READER_FONT}; font-size: ${typo.questionFontSize}; line-height: ${typo.questionLineHeight}; color: ${PALETTE.warmCharcoal};">
              <span style="background-color: ${PALETTE.mintCreamFill}; border: 1pt solid ${PALETTE.mintBorder}; color: ${PALETTE.deepTeal}; font-weight: bold; font-size: 9pt; padding: 1.5pt 6pt; margin-right: 5pt;">Part B</span>
              <strong>${formatQuestionStemHtml(partBText)}</strong>
            </div>
            ${partBOpts}
          </td>
        </tr>
      </table>`;
  }

  if (item.options && item.options.length > 0) {
    return renderTeacherOptionsHtml(item.options, typo);
  }

  if (item.hotTextSegments && item.hotTextSegments.length > 0) {
    return item.hotTextSegments
      .map((seg) => {
        const bg = seg.isCorrect ? PALETTE.forestFill : PALETTE.white;
        const border = seg.isCorrect ? `1pt solid ${PALETTE.forestBorder}` : 'none';
        const color = seg.isCorrect ? PALETTE.forestGreen : PALETTE.warmCharcoal;
        const marker = seg.isCorrect ? '&#10003; [TARGET EVIDENCE]' : '[ &nbsp; ]';
        return `
        <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 0 0 5pt 0; background-color: ${bg}; border: ${border};">
          <tr>
            <td style="padding: 4pt 7pt; font-family: ${EARLY_READER_FONT}; font-size: ${typo.optionFontSize}; line-height: ${typo.questionLineHeight}; color: ${color}; font-weight: ${seg.isCorrect ? 'bold' : 'normal'};">
              <span style="margin-right: 5pt;">${marker}</span>
              <strong style="color: ${PALETTE.deepTeal};">[P${seg.paragraphRef}]</strong> &ldquo;${escapeHtml(seg.text)}&rdquo;
              ${seg.rationale ? `<div style="margin-top: 2pt; font-size: 9.5pt; font-weight: normal; color: ${PALETTE.slateGray};">${escapeHtml(seg.rationale)}</div>` : ''}
            </td>
          </tr>
        </table>`;
      })
      .join('\n');
  }

  if (item.tableMatch) {
    const colWidth = `${Math.max(14, Math.floor(44 / Math.max(1, item.tableMatch.columns.length)))}%`;
    const headers = item.tableMatch.columns
      .map(
        (c) =>
          `<th style="width: ${colWidth}; border: 1pt solid ${PALETTE.tableBorder}; background-color: ${PALETTE.softSand}; color: ${PALETTE.warmCharcoal}; padding: 5pt 7pt; text-align: center; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; font-weight: bold;">${escapeHtml(c.label)}</th>`
      )
      .join('');
    const rows = item.tableMatch.rows
      .map((r) => {
        const cells = item.tableMatch!.columns
          .map((c) => {
            const match = r.correctColumnIds.includes(c.id);
            return `<td style="border: 1pt solid ${PALETTE.tableBorder}; padding: 5pt 6pt; text-align: center; vertical-align: middle; background-color: ${match ? PALETTE.forestFill : PALETTE.white}; color: ${match ? PALETTE.forestGreen : PALETTE.tableBorder}; font-family: ${EARLY_READER_FONT}; font-size: 9pt; font-weight: bold;">${match ? '&#10003; CORRECT' : '&#8212;'}</td>`;
          })
          .join('');
        return `
          <tr>
            <td style="border: 1pt solid ${PALETTE.tableBorder}; padding: 5pt 7pt; text-align: left; vertical-align: top; font-family: ${EARLY_READER_FONT}; font-size: ${typo.optionFontSize}; color: ${PALETTE.warmCharcoal};">
              <div>${escapeHtml(r.statement)}</div>
              ${r.rationale ? `<div style="margin-top: 2pt; font-size: 9pt; color: ${PALETTE.slateGray};">${escapeHtml(r.rationale)}</div>` : ''}
            </td>
            ${cells}
          </tr>`;
      })
      .join('\n');

    return `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 5pt 0 4pt 0;">
        <thead>
          <tr>
            <th style="border: 1pt solid ${PALETTE.tableBorder}; background-color: ${PALETTE.softSand}; color: ${PALETTE.warmCharcoal}; padding: 5pt 7pt; text-align: left; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; font-weight: bold;">Detail / Statement</th>
            ${headers}
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>`;
  }

  return '';
}

export function buildAssessmentStudentDocHtml(assessment: SavedAssessment): string {
  const typo = getGradeBandTypography(assessment.grade);
  const targetWords = collectAssessmentTargetWords(assessment);

  const passagesHtml = renderAssessmentPassageContainersHtml(assessment, targetWords, typo);
  const glossaryHtml = renderGlossaryCalloutBoxHtml(assessment.passage.glossary);

  const itemsHtml = assessment.items
    .map((item, idx) => {
      const body = renderStudentAssessmentItemBodyHtml(item, typo);
      return `
        <div class="question-block">
          <div style="font-family: ${EARLY_READER_FONT}; font-size: ${typo.isPrimary ? '13.5pt' : '11.5pt'}; font-weight: bold; color: ${PALETTE.deepTeal}; margin: 0 0 3pt 0;">
            Question ${idx + 1}
          </div>
          <div style="font-family: ${EARLY_READER_FONT}; font-size: ${typo.questionFontSize}; line-height: ${typo.questionLineHeight}; word-spacing: ${typo.questionWordSpacing}; font-weight: bold; color: ${PALETTE.warmCharcoal}; margin: 0 0 6pt 0;">
            ${formatQuestionStemHtml(item.prompt)}
          </div>
          ${body}
        </div>`;
    })
    .join('\n');

  const bodyHtml = `
    <div style="font-family: ${EARLY_READER_FONT}; font-size: 10.5pt; font-style: italic; color: ${PALETTE.slateGray}; margin: 0 0 3pt 0;">
      ${escapeHtml(formatGradeLabel(assessment.grade))} ELA Reading Practice &middot; Student Worksheet
    </div>
    <h1>${escapeHtml(assessment.title)}</h1>
    ${renderStudentHeaderRowHtml(false)}
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1pt solid ${PALETTE.mintBorder}; background-color: ${PALETTE.mintCreamFill}; margin: 0 0 12pt 0;">
      <tr>
        <td style="padding: 7pt 10pt; font-family: ${EARLY_READER_FONT}; font-size: 10.5pt; line-height: 1.35; color: ${PALETTE.warmCharcoal};">
          <strong style="color: ${PALETTE.deepTeal};">Directions:</strong> Read the passage(s) carefully. Circle or mark your best answer for each question.
        </td>
      </tr>
    </table>
    ${passagesHtml}
    ${glossaryHtml}
    <div class="page-break"></div>
    <h2>Assessment Questions (${assessment.items.length})</h2>
    ${itemsHtml}
  `;

  return wrapWordDocumentHtml(`${assessment.title} — Student Version`, bodyHtml, {
    marginInches: 0.75,
    typo,
  });
}

export function buildAssessmentTeacherDocHtml(assessment: SavedAssessment): string {
  const typo = getGradeBandTypography(assessment.grade);
  const targetWords = collectAssessmentTargetWords(assessment);

  const benchmarkBadgesHtml = assessment.passage.alignedBenchmarks
    .map((code) => renderMonospacePillHtml(code))
    .join(' &nbsp; ');

  const metadataGridHtml = `
  <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1pt solid ${PALETTE.passageBorder}; margin: 0 0 12pt 0;">
    <tr>
      <td style="width: 24%; background-color: ${PALETTE.softSand}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; font-weight: bold; color: ${PALETTE.warmCharcoal};">
        Grade Level
      </td>
      <td style="width: 26%; background-color: ${PALETTE.white}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; color: ${PALETTE.warmCharcoal};">
        ${escapeHtml(formatGradeLabel(assessment.grade))}
      </td>
      <td style="width: 18%; background-color: ${PALETTE.softSand}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; font-weight: bold; color: ${PALETTE.warmCharcoal};">
        Unit / Tag
      </td>
      <td style="width: 32%; background-color: ${PALETTE.white}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; color: ${PALETTE.warmCharcoal};">
        ${escapeHtml(assessment.unitTag || 'General Practice')}
      </td>
    </tr>
    <tr>
      <td style="background-color: ${PALETTE.softSand}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; font-weight: bold; color: ${PALETTE.warmCharcoal};">
        Target B.E.S.T. Benchmarks
      </td>
      <td colspan="3" style="background-color: ${PALETTE.white}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt;">
        ${benchmarkBadgesHtml}
      </td>
    </tr>
    <tr>
      <td style="background-color: ${PALETTE.softSand}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; font-weight: bold; color: ${PALETTE.warmCharcoal};">
        Text Complexity / Lexile Band
      </td>
      <td colspan="3" style="background-color: ${PALETTE.white}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; color: ${PALETTE.warmCharcoal};">
        <strong>${escapeHtml(assessment.passage.complexity.estimatedLexileLabel)}</strong> &middot; ${escapeHtml(assessment.passage.complexity.officialBandLabel)} (${escapeHtml(assessment.passage.complexity.officialLexileRange)}) &middot; ${assessment.passage.complexity.wordCount} words
        <div style="margin-top: 2pt; font-size: 9pt; color: ${PALETTE.slateGray};">
          ${escapeHtml(assessment.passage.complexity.gradeAppropriatenessExplanation)}
        </div>
      </td>
    </tr>
  </table>`;

  const preTeachVocabHtml =
    assessment.passage.vocabularyGuide.length > 0
      ? `
      <h2>Pre-Teaching Key Vocabulary Tool</h2>
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1pt solid ${PALETTE.passageBorder}; margin: 0 0 14pt 0;">
        <thead>
          <tr>
            <th style="width: 24%; border: 1pt solid ${PALETTE.passageBorder}; background-color: ${PALETTE.notebookIndigo}; color: ${PALETTE.white}; padding: 6pt 8pt; text-align: left; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; font-weight: bold;">Target Word &amp; Benchmark</th>
            <th style="width: 35%; border: 1pt solid ${PALETTE.passageBorder}; background-color: ${PALETTE.notebookIndigo}; color: ${PALETTE.white}; padding: 6pt 8pt; text-align: left; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; font-weight: bold;">Student-Friendly Definition</th>
            <th style="width: 41%; border: 1pt solid ${PALETTE.passageBorder}; background-color: ${PALETTE.notebookIndigo}; color: ${PALETTE.white}; padding: 6pt 8pt; text-align: left; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; font-weight: bold;">Context Clue Sentence from Text</th>
          </tr>
        </thead>
        <tbody>
          ${assessment.passage.vocabularyGuide
            .map((v, vIdx) => {
              const rowBg = vIdx % 2 === 1 ? PALETTE.softSand : PALETTE.white;
              return `
              <tr>
                <td style="border: 1pt solid ${PALETTE.passageBorder}; background-color: ${rowBg}; padding: 6pt 8pt; vertical-align: top; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt;">
                  <div style="font-weight: bold; color: ${PALETTE.deepTeal}; font-size: 10.5pt;">${escapeHtml(v.word)}</div>
                  <div style="font-style: italic; color: ${PALETTE.slateGray}; font-size: 8.5pt; margin: 1pt 0 4pt 0;">${escapeHtml(v.partOfSpeech)}</div>
                  <div>${renderMonospacePillHtml(v.benchmarkCode)}</div>
                </td>
                <td style="border: 1pt solid ${PALETTE.passageBorder}; background-color: ${rowBg}; padding: 6pt 8pt; vertical-align: top; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; line-height: 1.35; color: ${PALETTE.warmCharcoal};">
                  <div>${escapeHtml(v.definition)}</div>
                  ${v.morphologyOrClueNote ? `<div style="margin-top: 3pt; font-size: 8.5pt; color: ${PALETTE.slateGray};"><em>Clue:</em> ${escapeHtml(v.morphologyOrClueNote)}</div>` : ''}
                </td>
                <td style="border: 1pt solid ${PALETTE.passageBorder}; background-color: ${rowBg}; padding: 6pt 8pt; vertical-align: top; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; line-height: 1.35; color: ${PALETTE.warmCharcoal};">
                  <strong style="color: ${PALETTE.deepTeal};">[P${v.paragraphRef}]</strong> &ldquo;${highlightTargetWordsHtml(v.passageContextSentence, [v.word])}&rdquo;
                </td>
              </tr>`;
            })
            .join('\n')}
        </tbody>
      </table>`
      : '';

  const passagesHtml = renderAssessmentPassageContainersHtml(assessment, targetWords, typo);
  const glossaryHtml = renderGlossaryCalloutBoxHtml(assessment.passage.glossary);

  const itemsHtml = assessment.items
    .map((item, idx) => {
      const optionsHtml = renderTeacherAssessmentItemBodyHtml(item, typo);
      const coachHtml = renderCoachCalloutBoxHtml({
        answerKey: item.correctAnswerSummary,
        rationale: item.correctRationale,
        evidence: `[Paragraph ${item.evidenceParagraphRef}] "${item.textualEvidenceQuote}"`,
        sourceCitation: item.sourceCitation,
      });

      return `
        <div class="question-block">
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 0 0 4pt 0;">
            <tr>
              <td style="vertical-align: middle; font-family: ${EARLY_READER_FONT}; font-size: ${typo.isPrimary ? '13pt' : '11.5pt'}; font-weight: bold; color: ${PALETTE.deepTeal};">
                Question ${idx + 1}
              </td>
              <td style="vertical-align: middle; text-align: right;">
                ${renderNeutralBadgeHtml(FAST_ITEM_TYPE_INFO[item.itemType].label)} &nbsp;
                ${renderMonospacePillHtml(item.benchmarkCode)} &nbsp;
                ${renderNeutralBadgeHtml(`DOK ${item.dok}`)}
              </td>
            </tr>
          </table>
          <div style="font-family: ${EARLY_READER_FONT}; font-size: ${typo.questionFontSize}; line-height: ${typo.questionLineHeight}; word-spacing: ${typo.questionWordSpacing}; font-weight: bold; color: ${PALETTE.warmCharcoal}; margin: 0 0 6pt 0;">
            ${formatQuestionStemHtml(item.prompt)}
          </div>
          ${optionsHtml}
          ${coachHtml}
        </div>`;
    })
    .join('\n');

  const bodyHtml = `
    ${renderTeacherEditionBannerHtml(`${formatGradeLabel(assessment.grade).toUpperCase()} · ANSWER KEY`)}
    <h1>${escapeHtml(assessment.title)}</h1>
    ${metadataGridHtml}
    ${preTeachVocabHtml}
    <h2>Reading Passage &amp; Annotated Vocabulary</h2>
    ${passagesHtml}
    ${glossaryHtml}
    <div class="page-break"></div>
    <h2>Assessment Questions, Answer Key &amp; Instructional Rationales</h2>
    ${itemsHtml}
    <div style="font-family: ${EARLY_READER_FONT}; font-size: 8.5pt; color: ${PALETTE.slateGray}; border-top: 1pt solid ${PALETTE.passageBorder}; padding-top: 6pt; margin-top: 14pt;">
      ${escapeHtml(assessment.passage.practiceDisclaimer)}
    </div>
  `;

  return wrapWordDocumentHtml(`${assessment.title} — Teacher Version`, bodyHtml, {
    marginInches: 0.75,
    typo,
  });
}

function formatBellringerQuestionFormatBadge(q: BellringerQuestion): string {
  if (q.format === 'short_response') return 'Short Constructed Response';
  if (q.format === 'grammar_editing') return 'Grammar & Editing';
  return 'Multiple Choice';
}

export function buildBellringerStudentDocHtml(
  activity: BellringerActivity,
  includeGradeLevel = true
): string {
  const typo = getGradeBandTypography(activity.grade);
  const targetWords = collectBellringerTargetWords(activity);

  const sourceHtml = activity.sourceText
    ? `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1.5pt solid ${PALETTE.passageBorder}; background-color: ${PALETTE.white}; margin: 0 0 9pt 0;">
        <tr>
          <td style="background-color: ${PALETTE.softSand}; border-bottom: 1pt solid ${PALETTE.passageBorder}; padding: 4pt 10pt;">
            <span style="font-family: ${EARLY_READER_FONT}; font-size: 10pt; font-weight: bold; color: ${PALETTE.deepTeal}; letter-spacing: 0.4pt;">
              ${escapeHtml((activity.sourceTextLabel ?? 'Read the Passage').toUpperCase())}
            </span>
          </td>
        </tr>
        <tr>
          <td style="background-color: ${PALETTE.white}; padding: 8pt 10pt; font-family: ${EARLY_READER_FONT}; font-size: ${typo.passageFontSize}; line-height: ${typo.passageLineHeight}; word-spacing: ${typo.passageWordSpacing}; color: ${PALETTE.warmCharcoal};">
            ${highlightTargetWordsHtml(activity.sourceText, targetWords)}
          </td>
        </tr>
      </table>`
    : '';

  const questionsHtml = activity.questions
    .map((q) => {
      const targetHtml = q.targetSentence
        ? `
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1pt solid ${PALETTE.passageBorder}; background-color: ${PALETTE.softSandAlt}; margin: 4pt 0 5pt 0;">
            <tr>
              <td style="padding: 5pt 9pt; font-family: ${EARLY_READER_FONT}; font-size: ${typo.passageFontSize}; line-height: ${typo.passageLineHeight}; word-spacing: ${typo.questionWordSpacing}; font-weight: bold; color: ${PALETTE.warmCharcoal};">
                ${highlightTargetWordsHtml(q.targetSentence, targetWords)}
              </td>
            </tr>
          </table>`
        : '';

      let responseHtml = '';
      if (q.options && q.options.length > 0) {
        responseHtml = renderStudentBubbleOptionsHtml(q.options, typo, true);
      } else {
        const hint =
          q.format === 'short_response'
            ? `Write ${q.maxSentences === 1 ? '1 complete sentence' : '1–2 complete sentences'} on the lines below.`
            : 'Write your revised sentence on the lines below.';
        const lineCount = q.format === 'short_response' ? Math.max(2, q.maxSentences ?? 2) : 2;
        responseHtml = `
          <div style="font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; font-style: italic; color: ${PALETTE.slateGray}; margin: 2pt 0 2pt 0;">
            ${escapeHtml(hint)}
          </div>
          ${renderWritingLinesHtml(typo.isPrimary, lineCount)}
        `;
      }

      return `
        <div class="question-block" style="margin-bottom: 9pt;">
          <div style="font-family: ${EARLY_READER_FONT}; font-size: ${typo.isPrimary ? '13pt' : '11.5pt'}; font-weight: bold; color: ${PALETTE.deepTeal}; margin: 0 0 2pt 0;">
            Question ${q.number}
          </div>
          <div style="font-family: ${EARLY_READER_FONT}; font-size: ${typo.questionFontSize}; line-height: ${typo.questionLineHeight}; word-spacing: ${typo.questionWordSpacing}; font-weight: bold; color: ${PALETTE.warmCharcoal}; margin: 0 0 5pt 0;">
            ${formatQuestionStemHtml(q.prompt)}
          </div>
          ${targetHtml}
          ${responseHtml}
        </div>`;
    })
    .join('\n');

  const subheader = includeGradeLevel
    ? `${formatGradeLabel(activity.grade)} ELA Warm-Up · Estimated completion time: 5 minutes`
    : 'ELA Warm-Up · Estimated completion time: 5 minutes';

  const bodyHtml = `
    <div style="font-family: ${EARLY_READER_FONT}; font-size: 10.5pt; font-style: italic; color: ${PALETTE.slateGray}; margin: 0 0 2pt 0;">
      ${escapeHtml(subheader)}
    </div>
    <h1 style="margin: 0 0 4pt 0;">${escapeHtml(activity.title)}</h1>
    ${renderStudentHeaderRowHtml(true)}
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1pt solid ${PALETTE.mintBorder}; background-color: ${PALETTE.mintCreamFill}; margin: 0 0 8pt 0;">
      <tr>
        <td style="padding: 5pt 9pt; font-family: ${EARLY_READER_FONT}; font-size: 10pt; line-height: 1.35; color: ${PALETTE.warmCharcoal};">
          <strong style="color: ${PALETTE.deepTeal};">Directions:</strong> ${escapeHtml(activity.directions)}
        </td>
      </tr>
    </table>
    ${sourceHtml}
    ${questionsHtml}
  `;

  return wrapWordDocumentHtml(`${activity.title} — Student Version`, bodyHtml, {
    marginInches: 0.5,
    typo,
  });
}

export function buildBellringerTeacherDocHtml(activity: BellringerActivity): string {
  const typo = getGradeBandTypography(activity.grade);
  const targetWords = collectBellringerTargetWords(activity);

  const metadataGridHtml = `
  <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1pt solid ${PALETTE.passageBorder}; margin: 0 0 10pt 0;">
    <tr>
      <td style="width: 22%; background-color: ${PALETTE.softSand}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; font-weight: bold; color: ${PALETTE.warmCharcoal};">
        Grade &amp; Time
      </td>
      <td style="width: 28%; background-color: ${PALETTE.white}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; color: ${PALETTE.warmCharcoal};">
        ${escapeHtml(formatGradeLabel(activity.grade))} &middot; ${escapeHtml(activity.estimatedTimeLabel)}
      </td>
      <td style="width: 20%; background-color: ${PALETTE.softSand}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; font-weight: bold; color: ${PALETTE.warmCharcoal};">
        Purpose &amp; Format
      </td>
      <td style="width: 30%; background-color: ${PALETTE.white}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; color: ${PALETTE.warmCharcoal};">
        ${escapeHtml(activity.purposeLabel)} &middot; ${escapeHtml(activity.questionTypeLabel)}
      </td>
    </tr>
    <tr>
      <td style="background-color: ${PALETTE.softSand}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; font-weight: bold; color: ${PALETTE.warmCharcoal};">
        ELA Standard
      </td>
      <td colspan="3" style="background-color: ${PALETTE.white}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; color: ${PALETTE.warmCharcoal};">
        ${renderMonospacePillHtml(activity.benchmarkCode)} &nbsp; <strong>${escapeHtml(activity.benchmarkTitle)}</strong>
        <div style="margin-top: 3pt;">${escapeHtml(activity.officialBenchmarkText)}</div>
        <div style="margin-top: 2pt; font-size: 8.5pt; color: ${PALETTE.slateGray};"><strong>Authoritative Source:</strong> ${escapeHtml(activity.sourceCitation)}</div>
      </td>
    </tr>
    ${
      activity.priorKnowledgeBenchmarkCode && activity.priorKnowledgeBenchmarkText
        ? `<tr>
            <td style="background-color: ${PALETTE.softSand}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; font-weight: bold; color: ${PALETTE.warmCharcoal};">
              Prior Knowledge Bridge
            </td>
            <td colspan="3" style="background-color: ${PALETTE.white}; border: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 8pt; font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; color: ${PALETTE.warmCharcoal};">
              ${renderMonospacePillHtml(activity.priorKnowledgeBenchmarkCode)} &nbsp; <strong>${escapeHtml(activity.priorKnowledgeBenchmarkTitle ?? '')}</strong>
              <div style="margin-top: 2pt;">${escapeHtml(activity.priorKnowledgeBenchmarkText)}</div>
            </td>
          </tr>`
        : ''
    }
  </table>`;

  const sourceHtml = activity.sourceText
    ? `
      <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1.5pt solid ${PALETTE.passageBorder}; background-color: ${PALETTE.white}; margin: 0 0 10pt 0;">
        <tr>
          <td style="background-color: ${PALETTE.softSand}; border-bottom: 1pt solid ${PALETTE.passageBorder}; padding: 5pt 10pt;">
            <span style="font-family: ${EARLY_READER_FONT}; font-size: 10pt; font-weight: bold; color: ${PALETTE.deepTeal};">
              ${escapeHtml((activity.sourceTextLabel ?? 'Source Text').toUpperCase())}
            </span>
            <span style="font-family: ${EARLY_READER_FONT}; font-size: 9.5pt; font-style: italic; color: ${PALETTE.slateGray};">
              &nbsp;&middot; ${activity.timeAudit.passageWordCount} words
            </span>
          </td>
        </tr>
        <tr>
          <td style="background-color: ${PALETTE.white}; padding: 9pt 10pt; font-family: ${EARLY_READER_FONT}; font-size: ${typo.passageFontSize}; line-height: ${typo.passageLineHeight}; word-spacing: ${typo.passageWordSpacing}; color: ${PALETTE.warmCharcoal};">
            ${highlightTargetWordsHtml(activity.sourceText, targetWords)}
          </td>
        </tr>
      </table>`
    : '';

  const questionsHtml = activity.questions
    .map((q) => {
      const targetHtml = q.targetSentence
        ? `
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1pt solid ${PALETTE.passageBorder}; background-color: ${PALETTE.softSandAlt}; margin: 4pt 0 5pt 0;">
            <tr>
              <td style="padding: 5pt 9pt; font-family: ${EARLY_READER_FONT}; font-size: ${typo.passageFontSize}; line-height: ${typo.passageLineHeight}; font-weight: bold; color: ${PALETTE.warmCharcoal};">
                ${highlightTargetWordsHtml(q.targetSentence, targetWords)}
              </td>
            </tr>
          </table>`
        : '';

      const optionsHtml =
        q.options && q.options.length > 0
          ? renderTeacherOptionsHtml(q.options, typo)
          : '';

      const coachHtml = renderCoachCalloutBoxHtml({
        answerKey: q.correctAnswer,
        rationale: q.explanation,
        evidence: q.textualEvidence,
        sourceCitation: activity.sourceCitation,
      });

      return `
        <div class="question-block">
          <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; margin: 0 0 3pt 0;">
            <tr>
              <td style="vertical-align: middle; font-family: ${EARLY_READER_FONT}; font-size: ${typo.isPrimary ? '13pt' : '11.5pt'}; font-weight: bold; color: ${PALETTE.deepTeal};">
                Question ${q.number}
              </td>
              <td style="vertical-align: middle; text-align: right;">
                ${renderNeutralBadgeHtml(formatBellringerQuestionFormatBadge(q))} &nbsp;
                ${renderMonospacePillHtml(activity.benchmarkCode)} &nbsp;
                ${renderNeutralBadgeHtml(activity.estimatedTimeLabel)}
              </td>
            </tr>
          </table>
          <div style="font-family: ${EARLY_READER_FONT}; font-size: ${typo.questionFontSize}; line-height: ${typo.questionLineHeight}; word-spacing: ${typo.questionWordSpacing}; font-weight: bold; color: ${PALETTE.warmCharcoal}; margin: 0 0 5pt 0;">
            ${formatQuestionStemHtml(q.prompt)}
          </div>
          ${targetHtml}
          ${optionsHtml}
          ${coachHtml}
        </div>`;
    })
    .join('\n');

  const bodyHtml = `
    ${renderTeacherEditionBannerHtml(`${formatGradeLabel(activity.grade).toUpperCase()} · 5-MIN WARM-UP KEY`)}
    <h1>${escapeHtml(activity.title)}</h1>
    ${metadataGridHtml}
    <table width="100%" cellspacing="0" cellpadding="0" style="border-collapse: collapse; border: 1pt solid ${PALETTE.mintBorder}; background-color: ${PALETTE.mintCreamFill}; margin: 0 0 10pt 0;">
      <tr>
        <td style="padding: 6pt 10pt; font-family: ${EARLY_READER_FONT}; font-size: 10pt; line-height: 1.35; color: ${PALETTE.warmCharcoal};">
          <strong style="color: ${PALETTE.deepTeal};">Student Directions:</strong> ${escapeHtml(activity.directions)}
        </td>
      </tr>
    </table>
    ${sourceHtml}
    <h2>Questions, Answer Key &amp; Coach Explanations</h2>
    ${questionsHtml}
    <div style="font-family: ${EARLY_READER_FONT}; font-size: 8.5pt; color: ${PALETTE.slateGray}; border-top: 1pt solid ${PALETTE.passageBorder}; padding-top: 6pt; margin-top: 12pt;">
      ${escapeHtml(activity.practiceDisclaimer)}
    </div>
  `;

  return wrapWordDocumentHtml(`${activity.title} — Teacher Version`, bodyHtml, {
    marginInches: 0.55,
    typo,
  });
}

export function slugifyFilename(title: string, fallback = 'document'): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50);
  return slug || fallback;
}

export function downloadDocFile(filename: string, htmlContent: string): void {
  const normalizedName = filename.toLowerCase().endsWith('.doc')
    ? filename
    : `${filename}.doc`;
  const blob = new Blob([htmlContent], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = normalizedName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
