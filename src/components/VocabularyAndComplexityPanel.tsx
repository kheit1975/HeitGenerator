import type { ReadingPassage } from '../types/ela.ts';
import { BENCHMARKS_BY_CODE, formatGradeLabel } from '../data/floridaStandards.ts';
import { getTargetLexileProfile } from '../utils/textComplexity.ts';
import { STANDARD_CODE_PILL } from '../utils/themeTokens.ts';

interface ComplexitySidebarProps {
  passage: ReadingPassage;
}

export function TextComplexitySidebar({ passage }: ComplexitySidebarProps) {
  const { complexity } = passage;
  const targetProfile = getTargetLexileProfile(passage.grade, passage.vocabularyComplexity);
  const vocabLabel =
    passage.vocabularyComplexity === 'foundational'
      ? 'Foundational'
      : passage.vocabularyComplexity === 'stretch'
      ? 'Stretch'
      : 'On-Grade';
  const statusColor =
    complexity.gradeAppropriateStatus === 'Within Grade Band'
      ? 'text-[#245436] bg-[#E9F3EC] border-[#C3DFCB]'
      : complexity.gradeAppropriateStatus === 'Approaching Band (Accessible)'
      ? 'text-[#19547B] bg-[#E6F2FA] border-[#BFE0F5]'
      : 'text-[#9C382A] bg-[#FDF1EE] border-[#F5C6BD]';

  return (
    <aside
      aria-label="Text Complexity Analysis"
      className="studio-card p-5 space-y-5"
    >
      <div className="border-b border-[#EAE1D2] pb-4">
        <div className="text-xs font-mono text-[#434D7B] font-medium">
          Appendix B Text Complexity · {formatGradeLabel(passage.grade)}
        </div>
        <h3 className="text-lg font-semibold text-[#2D2A26] mt-1">
          Text Complexity Analysis
        </h3>
        <div className={`mt-3 border rounded-xl px-3 py-2 text-xs font-semibold ${statusColor}`}>
          Status: {complexity.gradeAppropriateStatus}
        </div>
        <p className="text-xs text-[#625D56] leading-relaxed mt-2">
          {complexity.gradeAppropriatenessExplanation}
        </p>
      </div>

      {/* Quantitative Metrics */}
      <div>
        <h4 className="text-xs font-semibold text-[#434D7B] uppercase tracking-wider mb-3">
          Quantitative Measures
        </h4>
        <dl className="grid grid-cols-2 gap-3">
          <div className="bg-[#F5EFE6] border border-[#E5DDD0] rounded-xl p-3">
            <dt className="text-xs text-[#625D56]">Estimated Lexile</dt>
            <dd className="text-lg font-mono font-semibold text-[#155E63] tabular-nums mt-0.5">
              {complexity.estimatedLexileLabel}
            </dd>
          </div>
          <div className="bg-[#F5EFE6] border border-[#E5DDD0] rounded-xl p-3">
            <dt className="text-xs text-[#625D56]">Word Count</dt>
            <dd className="text-lg font-mono font-semibold text-[#434D7B] tabular-nums mt-0.5">
              {complexity.wordCount}
            </dd>
          </div>
          <div className="bg-[#F5EFE6] border border-[#E5DDD0] rounded-xl p-3">
            <dt className="text-xs text-[#625D56]">Avg Words / Sent.</dt>
            <dd className="text-base font-mono font-semibold text-[#2D2A26] tabular-nums mt-0.5">
              {complexity.avgWordsPerSentence}
            </dd>
          </div>
          <div className="bg-[#F5EFE6] border border-[#E5DDD0] rounded-xl p-3">
            <dt className="text-xs text-[#625D56]">Paragraphs</dt>
            <dd className="text-base font-mono font-semibold text-[#2D2A26] tabular-nums mt-0.5">
              {complexity.paragraphCount}
            </dd>
          </div>
        </dl>
        <div className="mt-3 text-xs text-[#625D56] space-y-1.5">
          <div className="flex justify-between gap-2">
            <span>Official B.E.S.T. Band:</span>
            <span className="font-mono font-semibold text-[#2D2A26] tabular-nums">
              {complexity.officialBandLabel}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Official Lexile Band:</span>
            <span className="font-mono text-[#2D2A26] tabular-nums">
              {complexity.officialLexileRange}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Target Lexile ({vocabLabel}):</span>
            <span className="font-mono font-semibold text-[#434D7B] tabular-nums">
              {targetProfile.targetDisplay}
            </span>
          </div>
          <div className="flex justify-between gap-2">
            <span>Multisyllabic Words (3+ syl):</span>
            <span className="font-mono text-[#2D2A26] tabular-nums">
              {complexity.longWordPercentage}%
            </span>
          </div>
        </div>
      </div>

      {/* Qualitative Analysis */}
      <div className="border-t border-[#EAE1D2] pt-4 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-xs font-semibold text-[#434D7B] uppercase tracking-wider">
            Qualitative Features
          </h4>
          <span className="text-xs font-mono text-[#E05A47] font-semibold">
            {complexity.qualitative.complexityTier} Complexity
          </span>
        </div>

        <div className="space-y-2.5 text-xs text-[#625D56] leading-relaxed">
          <div>
            <span className="font-semibold text-[#2D2A26] block">Meaning &amp; Purpose</span>
            {complexity.qualitative.meaningAndPurpose}
          </div>
          <div>
            <span className="font-semibold text-[#2D2A26] block">Language Clarity &amp; Vocabulary</span>
            {complexity.qualitative.languageClarityAndVocabulary}
          </div>
          <div>
            <span className="font-semibold text-[#2D2A26] block">Sentence Structure &amp; Organization</span>
            {complexity.qualitative.sentenceStructureAndOrganization}
          </div>
          <div>
            <span className="font-semibold text-[#2D2A26] block">Knowledge Demands</span>
            {complexity.qualitative.knowledgeDemands}
          </div>
          <div className="bg-[#EEF0F8] border border-[#D0D6EA] rounded-xl p-3 text-[#2D2A26]">
            <span className="font-semibold text-[#434D7B] block mb-0.5">Instructional Coach Note</span>
            {complexity.qualitative.instructionalRecommendation}
          </div>
        </div>
      </div>

      <div className="border-t border-[#EAE1D2] pt-3 text-[11px] text-[#625D56]">
        Reference: Florida B.E.S.T. Standards Appendix B (2025), pp. 148–150. Lexile values are studio estimates calibrated to FDOE bands.
      </div>
    </aside>
  );
}

interface VocabularyToolPanelProps {
  passage: ReadingPassage;
}

export function VocabularyToolPanel({ passage }: VocabularyToolPanelProps) {
  const words = passage.vocabularyGuide;

  return (
    <section
      aria-label="Passage Vocabulary Tool"
      className="studio-card p-6"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-4 border-b border-[#EAE1D2] pb-4 mb-5">
        <div>
          <div className="text-xs font-mono text-[#434D7B] font-medium">
            {formatGradeLabel(passage.grade)} Instructional Vocabulary Tool · {words.length} Key Terms
          </div>
          <h3 className="text-xl font-semibold text-[#2D2A26] mt-1">
            Key Passage Vocabulary &amp; B.E.S.T. Alignment
          </h3>
        </div>
        <div className="text-xs text-[#625D56]">
          Aligned to Florida B.E.S.T. Strand V (Academic Vocabulary, Morphology &amp; Context)
        </div>
      </div>

      {words.length === 0 ? (
        <p className="text-sm text-[#625D56]">
          No vocabulary words extracted yet. Run passage analysis to generate 5–7 key terms.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {words.map((entry, idx) => {
            const bench = BENCHMARKS_BY_CODE[entry.benchmarkCode];
            return (
              <article
                key={entry.id}
                className="bg-[#F5EFE6] border border-[#E5DDD0] rounded-2xl p-4 space-y-2.5"
              >
                <div className="flex items-baseline justify-between gap-3">
                  <div className="flex items-baseline gap-2.5">
                    <span className="text-xs font-mono text-[#434D7B] font-semibold tabular-nums">
                      0{idx + 1}
                    </span>
                    <h4 className="text-base font-semibold text-[#155E63]">
                      {entry.word}
                    </h4>
                    <span className="text-xs text-[#625D56] italic">
                      ({entry.partOfSpeech})
                    </span>
                  </div>
                  <span className={STANDARD_CODE_PILL}>
                    {entry.benchmarkCode}
                  </span>
                </div>

                <p className="text-sm text-[#2D2A26] leading-snug">
                  {entry.definition}
                </p>

                <div className="text-xs text-[#625D56] bg-[#FFFDF9] border border-[#E5DDD0] rounded-xl p-2.5 leading-relaxed">
                  <span className="font-semibold text-[#2D2A26]">
                    In Context (Paragraph {entry.paragraphRef}):{' '}
                  </span>
                  &ldquo;{entry.passageContextSentence}&rdquo;
                </div>

                <div className="text-xs text-[#625D56] space-y-1">
                  <div>
                    <span className="font-semibold text-[#2D2A26]">Strategy / Morphology: </span>
                    {entry.morphologyOrClueNote}
                  </div>
                  <div>
                    <span className="font-semibold text-[#2D2A26]">B.E.S.T. Alignment: </span>
                    {entry.benchmarkAlignmentNote}
                    {bench ? ` — "${bench.officialText}"` : ''}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

