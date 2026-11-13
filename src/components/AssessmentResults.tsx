import { useMemo, useState } from 'react';
import { AlertTriangle, BookOpen, CheckCircle2, ChevronDown, ChevronUp, XCircle } from 'lucide-react';
import {
  BENCHMARKS_BY_CODE,
  FAST_ITEM_TYPE_INFO,
  formatGradeLabel,
} from '../data/floridaStandards.ts';
import { computeBenchmarkAnalytics } from '../utils/assessmentEngine.ts';
import { STANDARD_CODE_PILL } from '../utils/themeTokens.ts';
import type { GradeLevel, SavedAssessment, StudentAttempt } from '../types/ela.ts';

interface AssessmentResultsProps {
  attempts: StudentAttempt[];
  assessments: SavedAssessment[];
}

const GRADE_FILTERS: { value: GradeLevel | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Grades (K–5)' },
  { value: 'K', label: 'K' },
  { value: '1', label: 'Gr 1' },
  { value: '2', label: 'Gr 2' },
  { value: '3', label: 'Gr 3' },
  { value: '4', label: 'Gr 4' },
  { value: '5', label: 'Gr 5' },
];

export function AssessmentResults({
  attempts,
  assessments,
}: AssessmentResultsProps) {
  const [gradeFilter, setGradeFilter] = useState<GradeLevel | 'ALL'>('ALL');
  const [expandedAttemptId, setExpandedAttemptId] = useState<string | null>(
    attempts[0]?.id ?? null
  );

  const report = useMemo(
    () => computeBenchmarkAnalytics(attempts, gradeFilter === 'ALL' ? undefined : gradeFilter),
    [attempts, gradeFilter]
  );

  const filteredAttempts = useMemo(
    () => (gradeFilter === 'ALL' ? attempts : attempts.filter((a) => a.grade === gradeFilter)),
    [attempts, gradeFilter]
  );

  const assessmentById = useMemo(
    () => Object.fromEntries(assessments.map((a) => [a.id, a])),
    [assessments]
  );

  return (
    <div className="space-y-6">
      {/* Header & Filter */}
      <section className="studio-card p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#434D7B] font-medium">
              Formative Benchmark &amp; Reporting Category Analytics
            </div>
            <h2 className="text-2xl font-bold text-[#2D2A26] mt-1">
              Assessment Results &amp; Instructional Next Steps
            </h2>
            <p className="text-sm text-[#625D56] mt-1 max-w-2xl">
              Review student practice performance grouped by Florida B.E.S.T. benchmark code and FAST Reporting Category, paired with official FDOE Next Steps guidance.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter results by grade">
            {GRADE_FILTERS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setGradeFilter(opt.value)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                  gradeFilter === opt.value
                    ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63] shadow-sm'
                    : 'bg-[#F5EFE6] text-[#625D56] border-[#DFD5C5] hover:bg-[#EAE1D2] hover:text-[#2D2A26]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Summary KPI Strip */}
        <dl className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-[#EAE1D2]">
          <div className="bg-[#FAF6F0] border border-[#E5DDD0] rounded-xl p-4">
            <dt className="text-xs text-[#625D56]">Practice Attempts Analyzed</dt>
            <dd className="text-2xl font-mono font-semibold text-[#155E63] tabular-nums mt-1">
              {report.attemptCount}
            </dd>
          </div>
          <div className="bg-[#FAF6F0] border border-[#E5DDD0] rounded-xl p-4">
            <dt className="text-xs text-[#625D56]">Total Items Answered</dt>
            <dd className="text-2xl font-mono font-semibold text-[#434D7B] tabular-nums mt-1">
              {report.totalItemsAnswered}
            </dd>
          </div>
          <div className="bg-[#FAF6F0] border border-[#E5DDD0] rounded-xl p-4">
            <dt className="text-xs text-[#625D56]">Average Practice Score</dt>
            <dd className="text-2xl font-mono font-semibold text-[#434D7B] tabular-nums mt-1">
              {report.attemptCount > 0 ? `${report.averageScorePercent}%` : '—'}
            </dd>
          </div>
        </dl>

        {/* FDOE Small-Sample Guardrail */}
        <div
          role="note"
          className="bg-[#FDF8EC] border border-[#E9D7AD] rounded-xl p-4 flex items-start gap-3 text-xs text-[#694A18] leading-relaxed"
        >
          <AlertTriangle className="w-4 h-4 text-[#B45309] shrink-0 mt-0.5" />
          <div className="space-y-1">
            <div className="font-semibold">
              {report.isSmallSample
                ? `Small-Sample Guardrail Active (${report.totalItemsAnswered} items analyzed)`
                : 'FDOE Reporting Category Interpretation Rule'}
            </div>
            <p>{report.smallSampleGuardrail}</p>
          </div>
        </div>
      </section>

      {filteredAttempts.length === 0 ? (
        <section className="studio-card p-8 text-center space-y-3">
          <div className="text-base font-semibold text-[#2D2A26]">
            No practice attempts recorded for this filter yet
          </div>
          <p className="text-sm text-[#625D56] max-w-md mx-auto">
            Select another grade level above to inspect recorded benchmark accuracy and FDOE Reporting Category next steps.
          </p>
        </section>
      ) : (
        <>
          {/* Benchmark Mastery Breakdown */}
          <section className="studio-card p-6 space-y-4">
            <div>
              <div className="text-xs font-mono text-[#434D7B] font-medium">
                Sorted from Lowest to Highest Mastery Signal
              </div>
              <h3 className="text-lg font-semibold text-[#2D2A26]">
                Accuracy by Florida B.E.S.T. Benchmark
              </h3>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#E5DDD0] text-[#625D56]">
                    <th className="py-2 pr-4 font-semibold">Benchmark</th>
                    <th className="py-2 pr-4 font-semibold">Official Focus</th>
                    <th className="py-2 pr-4 font-semibold text-right">Points</th>
                    <th className="py-2 font-semibold text-right">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#EAE1D2]">
                  {report.benchmarkSummaries.map((row) => {
                    const bench = BENCHMARKS_BY_CODE[row.benchmarkCode];
                    return (
                      <tr key={row.benchmarkCode}>
                        <td className="py-3 pr-4 whitespace-nowrap align-top">
                          <span className={STANDARD_CODE_PILL}>{row.benchmarkCode}</span>
                        </td>
                        <td className="py-3 pr-4 align-top">
                          <div className="font-semibold text-[#2D2A26]">{row.benchmarkTitle}</div>
                          {bench && (
                            <div className="text-[#625D56] mt-0.5 line-clamp-2">
                              {bench.officialText}
                            </div>
                          )}
                        </td>
                        <td className="py-3 pr-4 font-mono text-[#625D56] text-right tabular-nums whitespace-nowrap align-top">
                          {row.pointsEarned} / {row.maxPoints}
                        </td>
                        <td className="py-3 text-right align-top whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            <div className="w-20 h-2 bg-[#EFE8DC] rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  row.accuracyPercent >= 85
                                    ? 'bg-[#2E7D4F]'
                                    : row.accuracyPercent >= 60
                                    ? 'bg-[#D97706]'
                                    : 'bg-[#E05A47]'
                                }`}
                                style={{ width: `${row.accuracyPercent}%` }}
                              />
                            </div>
                            <span className="font-mono font-semibold text-[#2D2A26] tabular-nums w-9 text-right">
                              {row.accuracyPercent}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Official FDOE Reporting Category Guidance */}
          <section className="space-y-4">
            <div>
              <div className="text-xs font-mono text-[#434D7B] font-medium">
                FDOE Reporting Category Statements: B.E.S.T. Standards: ELA (May 2024)
              </div>
              <h3 className="text-lg font-semibold text-[#2D2A26]">
                What These Results Mean &amp; Instructional Next Steps
              </h3>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
              {report.reportingCategories.map((cat) => (
                <article
                  key={cat.categoryId}
                  className="studio-card p-5 flex flex-col justify-between gap-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-start justify-between gap-2 border-b border-[#EAE1D2] pb-3">
                      <div>
                        <div className="text-xs font-mono text-[#625D56]">
                          {cat.itemsAnswered} items · {cat.accuracyPercent}%
                        </div>
                        <h4 className="text-base font-semibold text-[#2D2A26] mt-0.5">
                          {cat.categoryLabel}
                        </h4>
                      </div>
                      <span
                        className={`px-2.5 py-0.5 text-[11px] font-semibold rounded-full whitespace-nowrap ${
                          cat.tier === 'aboveExpectations'
                            ? 'bg-[#E9F3EC] text-[#245436] border border-[#C3DFCB]'
                            : cat.tier === 'atNearExpectations'
                            ? 'bg-[#FDF8EC] text-[#694A18] border border-[#E9D7AD]'
                            : 'bg-[#FDF1EE] text-[#9C382A] border border-[#F5C6BD]'
                        }`}
                      >
                        {cat.tierLabel}
                      </span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-xs font-semibold text-[#2D2A26]">
                        What These Results Mean (FDOE)
                      </div>
                      <ul className="space-y-1.5 text-xs text-[#625D56] leading-relaxed list-disc pl-4">
                        {cat.whatResultsMean.map((line, i) => (
                          <li key={i}>{line}</li>
                        ))}
                      </ul>
                    </div>

                    <div className="space-y-1.5 bg-[#EEF0F8] border border-[#D0D6EA] rounded-xl p-3.5">
                      <div className="text-xs font-semibold text-[#434D7B] flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-[#434D7B]" />
                        Recommended Coach Next Steps
                      </div>
                      <ul className="space-y-1.5 text-xs text-[#2D2A26] leading-relaxed list-disc pl-4">
                        {cat.nextSteps.map((step, i) => (
                          <li key={i}>{step}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          {/* Session-by-Session Distractor & Missed Item Review */}
          <section className="studio-card p-6 space-y-4">
            <div>
              <div className="text-xs font-mono text-[#434D7B] font-medium">
                Item-Level Selection &amp; Misconception Audit
              </div>
              <h3 className="text-lg font-semibold text-[#2D2A26]">
                Completed Practice Sessions
              </h3>
            </div>

            <div className="divide-y divide-[#EAE1D2]">
              {filteredAttempts.map((attempt) => {
                const isExpanded = expandedAttemptId === attempt.id;
                const linkedAssessment = assessmentById[attempt.assessmentId];
                const formattedDate = new Date(attempt.submittedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                });

                return (
                  <div key={attempt.id} className="py-4 first:pt-0 last:pb-0">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="space-y-0.5 min-w-0">
                        <div className="text-xs font-mono text-[#625D56]">
                          {formatGradeLabel(attempt.grade)} · {attempt.studentName} · {formattedDate}
                        </div>
                        <div className="text-sm font-semibold text-[#2D2A26]">
                          {attempt.assessmentTitle}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right font-mono text-xs tabular-nums">
                          <span className="font-semibold text-[#155E63]">
                            {attempt.percentScore}%
                          </span>{' '}
                          <span className="text-[#625D56]">
                            ({attempt.totalPoints}/{attempt.maxPoints})
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedAttemptId(isExpanded ? null : attempt.id)
                          }
                          aria-expanded={isExpanded}
                          className="inline-flex items-center gap-1 px-3.5 py-1.5 text-xs font-semibold text-[#2D2A26] bg-[#FFFDF9] border border-[#DFD5C5] rounded-full hover:bg-[#F5EFE6] cursor-pointer whitespace-nowrap"
                        >
                          {isExpanded ? (
                            <>
                              Hide Breakdown
                              <ChevronUp className="w-3.5 h-3.5" />
                            </>
                          ) : (
                            <>
                              Inspect Items
                              <ChevronDown className="w-3.5 h-3.5" />
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {isExpanded && (
                      <div className="mt-4 bg-[#F5EFE6] border border-[#E5DDD0] rounded-2xl p-4 space-y-3">
                        {attempt.itemResults.map((res, idx) => {
                          const itemObj = linkedAssessment?.items.find((i) => i.id === res.itemId);
                          return (
                            <div
                              key={res.itemId}
                              className="bg-[#FFFDF9] border border-[#E5DDD0] rounded-xl p-3.5 space-y-2 text-xs"
                            >
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <div className="flex flex-wrap items-center gap-2 font-mono text-[#625D56]">
                                  <span>Item {idx + 1}</span>
                                  <span className={STANDARD_CODE_PILL}>{res.benchmarkCode}</span>
                                  <span>{FAST_ITEM_TYPE_INFO[res.itemType].shortLabel}</span>
                                </div>
                                <div
                                  className={`inline-flex items-center gap-1 font-semibold ${
                                    res.isCorrect
                                      ? 'text-[#245436]'
                                      : res.score > 0
                                      ? 'text-[#B45309]'
                                      : 'text-[#C84836]'
                                  }`}
                                >
                                  {res.isCorrect ? (
                                    <CheckCircle2 className="w-3.5 h-3.5" />
                                  ) : (
                                    <XCircle className="w-3.5 h-3.5" />
                                  )}
                                  {res.score} / 1 pt
                                </div>
                              </div>

                              {itemObj && (
                                <p className="font-student text-[#2D2A26] font-medium">{itemObj.prompt}</p>
                              )}

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[#625D56] pt-1">
                                <div>
                                  <span className="font-semibold text-[#2D2A26]">Student Selection: </span>
                                  {res.selectedLabels.length > 0
                                    ? res.selectedLabels.join(', ')
                                    : 'No selection'}
                                </div>
                                <div>
                                  <span className="font-semibold text-[#2D2A26]">Expected Key: </span>
                                  {res.correctLabels.join(', ')}
                                </div>
                              </div>

                              {!res.isCorrect && itemObj && (
                                <div className="bg-[#EEF0F8] border border-[#D0D6EA] rounded-lg p-2.5 text-[#2D2A26]">
                                  <span className="font-semibold text-[#434D7B]">
                                    Instructional Rationale:{' '}
                                  </span>
                                  {itemObj.correctRationale}
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}
    </div>
  );
}

