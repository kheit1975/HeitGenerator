import { ArrowRight, BookOpen, CheckSquare, Clock, Download, FileText, Printer, Search } from 'lucide-react';
import {
  FAST_READING_BLUEPRINTS,
  FDOE_SOURCES,
  K2_STAR_SCREENING_ROWS,
  formatGradeLabel,
} from '../data/floridaStandards.ts';
import {
  buildAssessmentStudentDocHtml,
  buildAssessmentTeacherDocHtml,
  downloadDocFile,
  slugifyFilename,
} from '../utils/docExport.ts';
import {
  STANDARD_CODE_PILL,
  SUBJECT_BADGES,
  inferSubjectBadge,
} from '../utils/themeTokens.ts';
import type { GradeLevel, SavedAssessment, StudentAttempt } from '../types/ela.ts';

export type StudioSection =
  | 'dashboard'
  | 'standards'
  | 'passage'
  | 'items'
  | 'bellringer'
  | 'builder'
  | 'results'
  | 'bank'
  | 'resources';

interface HomeDashboardProps {
  assessments: SavedAssessment[];
  attempts: StudentAttempt[];
  selectedGrade: GradeLevel;
  onSelectGrade: (grade: GradeLevel) => void;
  onNavigate: (section: StudioSection) => void;
  onOpenAssessmentInBuilder: (id: string) => void;
}

export function HomeDashboard({
  assessments,
  attempts,
  selectedGrade,
  onSelectGrade,
  onNavigate,
  onOpenAssessmentInBuilder,
}: HomeDashboardProps) {
  const isFastBlueprint =
    selectedGrade === '3' || selectedGrade === '4' || selectedGrade === '5';
  const blueprintRows = isFastBlueprint ? FAST_READING_BLUEPRINTS[selectedGrade] : null;
  const k2StarInfo =
    selectedGrade === 'K' || selectedGrade === '1' || selectedGrade === '2'
      ? K2_STAR_SCREENING_ROWS[selectedGrade]
      : null;

  const recentAssessments = assessments.slice(0, 4);
  const avgScore =
    attempts.length > 0
      ? Math.round(attempts.reduce((sum, a) => sum + a.percentScore, 0) / attempts.length)
      : null;

  return (
    <div className="space-y-8">
      {/* Hero / Focal Anchor */}
      <section className="studio-card p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          <div className="lg:col-span-8 space-y-4">
            <div className="text-xs font-mono text-[#434D7B] font-semibold">
              Florida Elementary ELA Coach &amp; Teacher Workspace · Grades K–5 (FAST Focus: 3–5)
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold text-[#2D2A26] leading-tight text-balance">
              Authoritative Florida B.E.S.T. Passages, Morning Bellwork &amp; Practice Assessments
            </h1>
            <p className="text-base text-[#625D56] leading-relaxed max-w-2xl">
              Build original, grade-calibrated reading passages with embedded Lexile &amp; qualitative complexity analysis, 5–7 context-aligned vocabulary terms, 5-minute morning bellringers, and printable FAST-style assessment packets grounded strictly in official Florida Department of Education specifications.
            </p>
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('passage')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#E05A47] text-[#FFFDF9] text-sm font-semibold rounded-xl hover:bg-[#C84836] shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <FileText className="w-4 h-4" />
                Create Reading Passage
                <ArrowRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => onNavigate('bellringer')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#155E63] text-[#FFFDF9] text-sm font-semibold rounded-xl hover:bg-[#0F4C50] shadow-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Clock className="w-4 h-4" />
                5-Min Bellringer Generator
              </button>
              <button
                type="button"
                onClick={() => onNavigate('standards')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFFDF9] border border-[#DFD5C5] text-[#2D2A26] text-sm font-medium rounded-xl hover:bg-[#F5EFE6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Search className="w-4 h-4 text-[#434D7B]" />
                Search B.E.S.T. Standards
              </button>
              <button
                type="button"
                onClick={() => onNavigate('builder')}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#FFFDF9] border border-[#DFD5C5] text-[#2D2A26] text-sm font-medium rounded-xl hover:bg-[#F5EFE6] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Printer className="w-4 h-4 text-[#155E63]" />
                Printable Assessments (.doc)
              </button>
            </div>
          </div>

          {/* Right Quick Summary Strip */}
          <div className="lg:col-span-4 bg-[#F2ECE1] border border-[#E2D8C8] rounded-2xl p-5 space-y-4">
            <div className="text-xs font-semibold text-[#434D7B] uppercase tracking-wider">
              Coach Workspace Snapshot
            </div>
            <dl className="grid grid-cols-2 gap-4">
              <div>
                <dt className="text-xs text-[#625D56]">Saved Assessments</dt>
                <dd className="text-2xl font-mono font-semibold text-[#155E63] tabular-nums mt-0.5">
                  {assessments.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#625D56]">Practice Sessions</dt>
                <dd className="text-2xl font-mono font-semibold text-[#434D7B] tabular-nums mt-0.5">
                  {attempts.length}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#625D56]">Sample Avg Score</dt>
                <dd className="text-2xl font-mono font-semibold text-[#434D7B] tabular-nums mt-0.5">
                  {avgScore !== null ? `${avgScore}%` : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-xs text-[#625D56]">Official FDOE PDFs</dt>
                <dd className="text-2xl font-mono font-semibold text-[#155E63] tabular-nums mt-0.5">
                  8
                </dd>
              </div>
            </dl>
            <div className="border-t border-[#E0D6C5] pt-3 space-y-2">
              <div className="text-[11px] font-semibold text-[#625D56]">
                Cross-Curricular Subject Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className={SUBJECT_BADGES.ela.className}>{SUBJECT_BADGES.ela.label}</span>
                <span className={SUBJECT_BADGES.math.className}>{SUBJECT_BADGES.math.label}</span>
                <span className={SUBJECT_BADGES.science_ss.className}>
                  {SUBJECT_BADGES.science_ss.label}
                </span>
              </div>
            </div>
            <div className="border-t border-[#E0D6C5] pt-3 text-xs text-[#625D56] leading-relaxed">
              Original practice materials only — clearly separated from official FDOE test documents.
            </div>
          </div>
        </div>
      </section>

      {/* Grade K-5 Blueprint / Star Overview & Active Assessments */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Blueprint Snapshot */}
        <section className="lg:col-span-5 studio-card p-6 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#EAE1D2] pb-3">
            <div>
              <div className="text-xs font-mono text-[#434D7B] font-medium">
                {isFastBlueprint
                  ? 'FDOE Test Design Summary (June 2024)'
                  : '2026–2027 FAST Grades K–2 Fact Sheet'}
              </div>
              <h2 className="text-lg font-semibold text-[#2D2A26]">
                {isFastBlueprint
                  ? 'FAST ELA Reading Blueprint'
                  : `${formatGradeLabel(selectedGrade)} Star & Foundational Focus`}
              </h2>
            </div>
            <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Blueprint grade level">
              {(['K', '1', '2', '3', '4', '5'] as GradeLevel[]).map((g) => (
                <button
                  key={g}
                  type="button"
                  onClick={() => onSelectGrade(g)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                    selectedGrade === g
                      ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63] shadow-sm'
                      : 'bg-[#F5EFE6] text-[#625D56] border-[#DFD5C5] hover:bg-[#EAE1D2] hover:text-[#2D2A26]'
                  }`}
                >
                  {g === 'K' ? 'K' : `Gr ${g}`}
                </button>
              ))}
            </div>
          </div>

          {blueprintRows ? (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-[#E5DDD0] text-[#625D56]">
                      <th className="py-2 pr-3 font-semibold">Reporting Category</th>
                      <th className="py-2 pr-3 font-semibold">Benchmarks</th>
                      <th className="py-2 font-semibold text-right">% of Test</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#EAE1D2]">
                    {blueprintRows.map((row) => (
                      <tr key={row.reportingCategoryId}>
                        <td className="py-2.5 pr-3 font-medium text-[#2D2A26] align-top">
                          {row.reportingCategoryLabel}
                        </td>
                        <td className="py-2.5 pr-3 align-top">
                          <div className="flex flex-wrap gap-1">
                            {row.benchmarks.map((code) => (
                              <span key={code} className={STANDARD_CODE_PILL}>
                                {code}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 font-mono font-semibold text-[#155E63] text-right tabular-nums align-top whitespace-nowrap">
                          {row.weight}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="bg-[#F5EFE6] border border-[#E5DDD0] rounded-xl p-3.5 text-xs text-[#625D56] space-y-1">
                <div className="font-semibold text-[#2D2A26]">
                  Grades 3–5 Administration Specifications
                </div>
                <div>36–40 operational items (+5 field test on PM3) · 50/50 Fiction/Informational balance</div>
                <div>PM1 &amp; PM2: Up to 90 minutes · PM3: Up to 120 minutes</div>
                <div className="pt-1 text-[11px]">
                  Includes Foundational Phonics &amp; Fluency support (F.1.3–F.1.4).{' '}
                  <button
                    type="button"
                    onClick={() => onNavigate('resources')}
                    className="underline font-semibold text-[#155E63] hover:text-[#E05A47] cursor-pointer"
                  >
                    View full official tables
                  </button>
                </div>
              </div>
            </>
          ) : (
            k2StarInfo && (
              <div className="space-y-3 text-xs text-[#2D2A26]">
                <div className="bg-[#EEF0F8] border border-[#D0D6EA] rounded-xl p-3.5 space-y-1.5">
                  <div className="font-semibold text-[#434D7B]">{k2StarInfo.assessmentName}</div>
                  <div>
                    <span className="font-semibold text-[#2D2A26]">Format: </span>
                    {k2StarInfo.itemFormat}
                  </div>
                  <div>
                    <span className="font-semibold text-[#2D2A26]">Timing: </span>
                    {k2StarInfo.estimatedTime}
                  </div>
                </div>

                <div className="space-y-1.5">
                  <div className="font-semibold text-[#2D2A26]">
                    Key B.E.S.T. Foundational &amp; Comprehension Domains
                  </div>
                  <ul className="space-y-1 list-disc pl-4 text-[#625D56] leading-relaxed">
                    {k2StarInfo.keyDomains.map((domain) => (
                      <li key={domain}>{domain}</li>
                    ))}
                  </ul>
                </div>

                <div className="bg-[#F5EFE6] border border-[#E5DDD0] rounded-xl p-3.5 text-[#625D56] space-y-1">
                  <div className="font-semibold text-[#2D2A26]">Progression &amp; Transition</div>
                  <div>{k2StarInfo.transitionRule}</div>
                  <div className="pt-1">
                    <button
                      type="button"
                      onClick={() => onNavigate('resources')}
                      className="underline font-semibold text-[#155E63] hover:text-[#E05A47] cursor-pointer"
                    >
                      View Foundational Progression &amp; Official Tables
                    </button>
                  </div>
                </div>
              </div>
            )
          )}
        </section>

        {/* Ready-to-Use Assessments */}
        <section className="lg:col-span-7 studio-card p-6 space-y-4">
          <div className="flex items-center justify-between gap-4 border-b border-[#EAE1D2] pb-3">
            <div>
              <div className="text-xs font-mono text-[#434D7B] font-medium">
                Ready for Classroom &amp; Small-Group Use
              </div>
              <h2 className="text-lg font-semibold text-[#2D2A26]">
                Starter &amp; Saved Practice Assessments
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('bank')}
              className="text-xs font-semibold text-[#155E63] hover:underline cursor-pointer whitespace-nowrap"
            >
              Open Question Bank
            </button>
          </div>

          <div className="divide-y divide-[#EAE1D2]">
            {recentAssessments.map((assessment) => {
              const subjectBadge = inferSubjectBadge(
                `${assessment.title} ${assessment.passage.topic} ${assessment.passage.textType}`
              );
              return (
                <div
                  key={assessment.id}
                  className="py-4 first:pt-1 last:pb-1 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1.5 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#625D56]">
                      <span className={subjectBadge.className}>{subjectBadge.label}</span>
                      <span className="font-mono">
                        {formatGradeLabel(assessment.grade)} · {assessment.passage.textType} ·{' '}
                        {assessment.passage.complexity.estimatedLexileLabel} ·{' '}
                        {assessment.items.length} items
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-[#2D2A26] truncate">
                      {assessment.title}
                    </h3>
                    <div className="flex flex-wrap items-center gap-1.5">
                      {assessment.passage.alignedBenchmarks.slice(0, 4).map((code) => (
                        <span key={code} className={STANDARD_CODE_PILL}>
                          {code}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => onOpenAssessmentInBuilder(assessment.id)}
                      className="px-3 py-1.5 text-xs font-semibold text-[#2D2A26] bg-[#FFFDF9] border border-[#DFD5C5] rounded-xl hover:bg-[#F5EFE6] cursor-pointer whitespace-nowrap"
                    >
                      Open in Builder
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const gradeSlug =
                          assessment.grade === 'K' ? 'kindergarten' : `grade-${assessment.grade}`;
                        downloadDocFile(
                          `${slugifyFilename(assessment.title, 'assessment')}-${gradeSlug}-student-version.doc`,
                          buildAssessmentStudentDocHtml(assessment)
                        );
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#FFFDF9] bg-[#155E63] rounded-xl hover:bg-[#0F4C50] cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Student .doc
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const gradeSlug =
                          assessment.grade === 'K' ? 'kindergarten' : `grade-${assessment.grade}`;
                        downloadDocFile(
                          `${slugifyFilename(assessment.title, 'assessment')}-${gradeSlug}-teacher-version.doc`,
                          buildAssessmentTeacherDocHtml(assessment)
                        );
                      }}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-[#2D2A26] bg-[#F5EFE6] border border-[#DFD5C5] rounded-xl hover:bg-[#EAE1D2] cursor-pointer whitespace-nowrap"
                    >
                      <Download className="w-3.5 h-3.5 text-[#434D7B]" />
                      Teacher .doc
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* 4-Step Instructional Workflow */}
      <section className="studio-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
          <div>
            <h2 className="text-lg font-semibold text-[#2D2A26]">
              Instructional Design Workflow
            </h2>
            <p className="text-xs text-[#625D56] mt-0.5">
              Every generated passage, morning bellringer, and assessment item traces back to official Florida B.E.S.T. language.
            </p>
          </div>
          <a
            href={FDOE_SOURCES.bestStandards.localPdfUrl}
            target="_blank"
            rel="noreferrer"
            className="text-xs font-semibold text-[#155E63] underline hover:text-[#E05A47] inline-flex items-center gap-1.5 whitespace-nowrap"
          >
            <BookOpen className="w-3.5 h-3.5" />
            Open Florida B.E.S.T. Standards PDF
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            {
              step: '01',
              title: 'Select K–5 Benchmarks',
              desc: 'Search exact official B.E.S.T. wording by keyword ("inference", "main idea", "figurative language") and inspect clarifications.',
              action: () => onNavigate('standards'),
              cta: 'Standards Explorer',
            },
            {
              step: '02',
              title: 'Generate & Verify Text',
              desc: 'Build literary, informational, or paired passages with side-by-side Lexile & qualitative complexity analysis and 5–7 vocabulary cards.',
              action: () => onNavigate('passage'),
              cta: 'Passage Generator',
            },
            {
              step: '03',
              title: 'Author FAST-Style Items',
              desc: 'Create MC, Multiselect, 2-Part EBSR, Hot Text, and Table Match items with distractor rationales and evidence quotes.',
              action: () => onNavigate('items'),
              cta: 'Item Generator',
            },
            {
              step: '04',
              title: 'Print & Download .doc',
              desc: 'Print or download Student and Teacher .doc packets for paper assessments and 5-minute classroom bellringers.',
              action: () => onNavigate('builder'),
              cta: 'Assessment Builder',
            },
          ].map((card) => (
            <div
              key={card.step}
              className="bg-[#F5EFE6] border border-[#E5DDD0] rounded-2xl p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-1.5">
                <div className="text-xs font-mono text-[#434D7B] font-semibold">
                  Step {card.step}
                </div>
                <h3 className="text-sm font-semibold text-[#2D2A26]">{card.title}</h3>
                <p className="text-xs text-[#625D56] leading-relaxed">{card.desc}</p>
              </div>
              <button
                type="button"
                onClick={card.action}
                className="text-xs font-semibold text-[#155E63] hover:text-[#E05A47] inline-flex items-center gap-1 self-start cursor-pointer"
              >
                <CheckSquare className="w-3.5 h-3.5" />
                {card.cta}
              </button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

