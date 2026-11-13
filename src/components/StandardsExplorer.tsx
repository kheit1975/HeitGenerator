import { useMemo, useState } from 'react';
import { BookOpen, Check, ExternalLink, FileText, PlusSquare, Search, X } from 'lucide-react';
import { BENCHMARKS_BY_CODE, formatGradeLabel } from '../data/floridaStandards.ts';
import { searchBenchmarks } from '../utils/assessmentEngine.ts';
import { STANDARD_CODE_PILL, SUBJECT_BADGES } from '../utils/themeTokens.ts';
import type { GradeLevel, StrandCode } from '../types/ela.ts';

interface StandardsExplorerProps {
  selectedGrade: GradeLevel | 'ALL';
  onChangeGrade: (grade: GradeLevel | 'ALL') => void;
  selectedBenchmarkCodes: string[];
  onToggleBenchmark: (code: string) => void;
  onClearBenchmarks: () => void;
  onSendToPassageGenerator: () => void;
  onSendToItemGenerator: () => void;
}

const QUICK_KEYWORD_CHIPS = [
  'phonics',
  'phonological',
  'fluency',
  'print concepts',
  'inference',
  'main idea',
  'figurative language',
  'theme',
  'point of view',
  'text structure',
  'summary',
  'morphology',
  'context clues',
  'claim',
];

const GRADE_OPTIONS: { value: GradeLevel | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Grades (K–5)' },
  { value: 'K', label: 'Kindergarten' },
  { value: '1', label: 'Grade 1' },
  { value: '2', label: 'Grade 2' },
  { value: '3', label: 'Grade 3' },
  { value: '4', label: 'Grade 4' },
  { value: '5', label: 'Grade 5' },
];

const STRAND_OPTIONS: { value: StrandCode | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Strands' },
  { value: 'F', label: 'F · Foundations' },
  { value: 'R', label: 'R · Reading' },
  { value: 'V', label: 'V · Vocabulary' },
  { value: 'EE', label: 'EE · Expectations' },
  { value: 'C', label: 'C · Communication' },
];

export function StandardsExplorer({
  selectedGrade,
  onChangeGrade,
  selectedBenchmarkCodes,
  onToggleBenchmark,
  onClearBenchmarks,
  onSendToPassageGenerator,
  onSendToItemGenerator,
}: StandardsExplorerProps) {
  const [query, setQuery] = useState('');
  const [strand, setStrand] = useState<StrandCode | 'ALL'>('ALL');
  const [fastOnly, setFastOnly] = useState(false);

  const results = useMemo(
    () =>
      searchBenchmarks({
        grade: selectedGrade,
        strand,
        fastOnly,
        query,
      }),
    [selectedGrade, strand, fastOnly, query]
  );

  return (
    <div className="space-y-6">
      {/* Header & Search Controls */}
      <section className="studio-card p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#434D7B] font-medium">
              Official Verbatim Language · Florida B.E.S.T. Standards: ELA (2025)
            </div>
            <h1 className="text-2xl font-bold text-[#2D2A26] mt-1">
              Florida B.E.S.T. Standards Explorer &amp; Keyword Search
            </h1>
            <p className="text-sm text-[#625D56] mt-1 max-w-3xl">
              Search official Grades K–5 benchmarks (including Foundational Skills, Reading, Vocabulary, ELA Expectations, and Communication) by code or pedagogical concept such as &ldquo;phonics&rdquo;, &ldquo;inference&rdquo;, &ldquo;main idea&rdquo;, or &ldquo;figurative language&rdquo;. Select one or more benchmarks to build aligned passages and items.
            </p>
          </div>
          <div className="text-xs font-mono text-[#434D7B] font-semibold tabular-nums shrink-0">
            Showing {results.length} verified benchmark{results.length === 1 ? '' : 's'}
          </div>
        </div>

        {/* Search Input + FAST Toggle */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
          <div className="lg:col-span-9">
            <label
              htmlFor="standards-keyword-search"
              className="block text-xs font-semibold text-[#2D2A26] mb-1.5"
            >
              Keyword or Benchmark Code Search
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#625D56] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                id="standards-keyword-search"
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Try 'inference', 'main idea', 'figurative language', 'ELA.4.R.2.2'..."
                className="w-full pl-10 pr-9 py-2.5 text-sm bg-[#FFFDF9] border border-[#DFD5C5] text-[#2D2A26] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155E63]/30 focus:border-[#155E63]"
              />
              {query && (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  aria-label="Clear keyword search"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#625D56] hover:text-[#2D2A26] cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>

          <div className="lg:col-span-3 flex items-center lg:justify-end">
            <button
              type="button"
              onClick={() => setFastOnly((prev) => !prev)}
              aria-pressed={fastOnly}
              className={`w-full lg:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                fastOnly
                  ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63] shadow-sm'
                  : 'bg-[#F5EFE6] text-[#2D2A26] border-[#DFD5C5] hover:bg-[#EAE1D2]'
              }`}
            >
              {fastOnly && <Check className="w-3.5 h-3.5" />}
              FAST Assessed Only
            </button>
          </div>
        </div>

        {/* Clickable Pill Toggle Chips: Grade Level & Strand */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <div className="bg-[#FAF6F0] border border-[#E5DDD0] rounded-xl p-3.5 space-y-2">
            <div className="text-xs font-semibold text-[#2D2A26]">Grade Level</div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by Grade Level">
              {GRADE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => onChangeGrade(opt.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                    selectedGrade === opt.value
                      ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63] shadow-sm'
                      : 'bg-[#FFFDF9] text-[#625D56] border-[#DFD5C5] hover:bg-[#F5EFE6] hover:text-[#2D2A26]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-[#FAF6F0] border border-[#E5DDD0] rounded-xl p-3.5 space-y-2">
            <div className="text-xs font-semibold text-[#2D2A26]">B.E.S.T. Strand</div>
            <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by Strand">
              {STRAND_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setStrand(opt.value)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                    strand === opt.value
                      ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63] shadow-sm'
                      : 'bg-[#FFFDF9] text-[#625D56] border-[#DFD5C5] hover:bg-[#F5EFE6] hover:text-[#2D2A26]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Quick Pedagogical Keyword Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-xs font-semibold text-[#625D56] mr-1">Quick terms:</span>
          {QUICK_KEYWORD_CHIPS.map((term) => {
            const active = query.toLowerCase() === term;
            return (
              <button
                key={term}
                type="button"
                onClick={() => setQuery(active ? '' : term)}
                className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                  active
                    ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63] shadow-sm'
                    : 'bg-[#F5EFE6] text-[#2D2A26] border-[#DFD5C5] hover:bg-[#EAE1D2]'
                }`}
              >
                {term}
              </button>
            );
          })}
        </div>
      </section>

      {/* Selected Benchmarks Action Tray (Coach Indigo) */}
      {selectedBenchmarkCodes.length > 0 && (
        <section
          aria-label="Selected Benchmarks Tray"
          className="bg-[#434D7B] text-[#FFFDF9] rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-sm"
        >
          <div className="space-y-1.5">
            <div className="text-xs font-mono text-[#E8ECFA] font-medium">
              {selectedBenchmarkCodes.length} Benchmark
              {selectedBenchmarkCodes.length === 1 ? '' : 's'} Selected for Assessment Design
            </div>
            <div className="text-sm font-medium flex flex-wrap items-center gap-2">
              {selectedBenchmarkCodes.map((code) => (
                <button
                  key={code}
                  type="button"
                  onClick={() => onToggleBenchmark(code)}
                  title={`Remove ${code}`}
                  className="inline-flex items-center gap-1.5 bg-white/15 hover:bg-white/25 px-3 py-1 rounded-full text-xs font-mono cursor-pointer whitespace-nowrap transition-colors"
                >
                  {code}
                  <X className="w-3 h-3" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onClearBenchmarks}
              className="px-3 py-1.5 text-xs font-medium text-[#E8ECFA] hover:text-white cursor-pointer whitespace-nowrap"
            >
              Clear Selection
            </button>
            <button
              type="button"
              onClick={onSendToPassageGenerator}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold bg-[#FFFDF9] text-[#155E63] rounded-xl hover:bg-[#F5EFE6] cursor-pointer whitespace-nowrap transition-colors"
            >
              <FileText className="w-3.5 h-3.5" />
              Send to Passage Generator
            </button>
            <button
              type="button"
              onClick={onSendToItemGenerator}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-[#E05A47] text-[#FFFDF9] rounded-xl hover:bg-[#C84836] shadow-sm cursor-pointer whitespace-nowrap transition-colors"
            >
              <PlusSquare className="w-3.5 h-3.5" />
              Send to Item Generator
            </button>
          </div>
        </section>
      )}

      {/* Results List */}
      {results.length === 0 ? (
        <div className="studio-card p-10 text-center space-y-2">
          <p className="text-base font-semibold text-[#2D2A26]">
            No matching Florida B.E.S.T. benchmarks found
          </p>
          <p className="text-sm text-[#625D56]">
            Try switching Grade Level to &ldquo;All Grades&rdquo; or clearing the strand/FAST filter.
          </p>
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setStrand('ALL');
              setFastOnly(false);
            }}
            className="mt-2 px-4 py-2 text-xs font-semibold bg-[#155E63] text-[#FFFDF9] rounded-xl hover:bg-[#0F4C50] cursor-pointer"
          >
            Reset Filters
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {results.map((b) => {
            const isSelected = selectedBenchmarkCodes.includes(b.code);
            return (
              <article
                key={b.code}
                className={`studio-card p-5 transition-colors ${
                  isSelected ? 'border-[#155E63] ring-2 ring-[#155E63]/20' : ''
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="space-y-2.5 flex-1">
                    {/* Metadata Row with Monospace Standard Code Pill */}
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[#625D56]">
                      <span className={STANDARD_CODE_PILL}>{b.code}</span>
                      <span className={SUBJECT_BADGES.ela.className}>
                        {SUBJECT_BADGES.ela.label}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="font-medium text-[#2D2A26]">
                        {formatGradeLabel(b.grade)}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{b.reportingCategoryLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className={b.fastAssessed ? 'text-[#E05A47] font-semibold' : 'text-[#625D56]'}>
                        {b.fastAssessed ? 'FAST Reading Blueprint' : 'Instructional / Star'}
                      </span>
                    </div>

                    <h2 className="text-base font-semibold text-[#2D2A26]">
                      {b.standardGroup} — {b.benchmarkTitle}
                    </h2>

                    {/* Exact Verbatim Official Benchmark Wording */}
                    <blockquote className="bg-[#F5EFE6] border border-[#E5DDD0] rounded-xl p-3.5 text-sm text-[#2D2A26] leading-relaxed">
                      <span className="text-[11px] font-mono text-[#434D7B] font-semibold block mb-1">
                        Official Verbatim Benchmark Language
                      </span>
                      &ldquo;{b.officialText}&rdquo;
                    </blockquote>

                    {/* Clarifications */}
                    {b.clarifications.length > 0 && (
                      <div className="text-xs text-[#625D56] space-y-1">
                        <span className="font-semibold text-[#2D2A26]">
                          Official Benchmark Clarifications &amp; Instructional Scope:
                        </span>
                        {b.clarifications.map((c, idx) => (
                          <p key={idx} className="leading-relaxed">
                            {c}
                          </p>
                        ))}
                      </div>
                    )}

                    {/* Cognitive Skills & Source Citation */}
                    <div className="pt-2 flex flex-wrap items-center justify-between gap-3 text-xs text-[#625D56] border-t border-[#EAE1D2]">
                      <div>
                        <span className="font-semibold text-[#2D2A26]">Student Skills: </span>
                        {b.requiredCognitiveSkills.join(' · ')}
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <a
                          href={`${b.localPdfUrl}#page=${b.pdfPage}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#155E63] hover:underline font-semibold"
                        >
                          <BookOpen className="w-3.5 h-3.5" />
                          FDOE PDF (p. {b.pdfPage - 1})
                        </a>
                        <a
                          href={b.sourceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-[#625D56] hover:text-[#155E63] hover:underline"
                        >
                          fldoe.org
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Select Action */}
                  <div className="shrink-0">
                    <button
                      type="button"
                      onClick={() => onToggleBenchmark(b.code)}
                      aria-pressed={isSelected}
                      aria-label={isSelected ? `Deselect ${b.code}` : `Select ${b.code}`}
                      className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-full border transition-colors cursor-pointer whitespace-nowrap ${
                        isSelected
                          ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63] shadow-sm'
                          : 'bg-[#FFFDF9] text-[#155E63] border-[#DFD5C5] hover:bg-[#F5EFE6]'
                      }`}
                    >
                      {isSelected ? (
                        <>
                          <Check className="w-3.5 h-3.5" />
                          Selected
                        </>
                      ) : (
                        'Select Benchmark'
                      )}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function SelectedBenchmarksInline({ codes }: { codes: string[] }) {
  if (codes.length === 0) return null;
  return (
    <div className="bg-[#F5EFE6] border border-[#E5DDD0] rounded-xl p-3.5 text-xs space-y-1.5">
      <div className="font-semibold text-[#434D7B]">Selected Benchmarks:</div>
      <div className="space-y-1.5">
        {codes.map((c) => {
          const b = BENCHMARKS_BY_CODE[c];
          return (
            <div key={c} className="text-[#625D56] flex flex-wrap items-baseline gap-2">
              <span className={STANDARD_CODE_PILL}>{c}</span>
              <span>{b ? b.officialText : ''}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

