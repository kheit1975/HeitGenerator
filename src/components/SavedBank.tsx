import { useMemo, useState } from 'react';
import { BookOpen, Download, FileText, Search, Trash2, Wrench } from 'lucide-react';
import { FAST_ITEM_TYPE_INFO, formatGradeLabel } from '../data/floridaStandards.ts';
import {
  buildAssessmentStudentDocHtml,
  buildAssessmentTeacherDocHtml,
  downloadDocFile,
  slugifyFilename,
} from '../utils/docExport.ts';
import { STANDARD_CODE_PILL, inferSubjectBadge } from '../utils/themeTokens.ts';
import type { AssessmentItem, GradeLevel, ReadingPassage, SavedAssessment } from '../types/ela.ts';

interface SavedBankProps {
  assessments: SavedAssessment[];
  passages: ReadingPassage[];
  items: AssessmentItem[];
  onOpenAssessmentInBuilder: (id: string) => void;
  onOpenPassageInGenerator: (passage: ReadingPassage) => void;
  onDeleteAssessment: (id: string) => Promise<void>;
  onDeletePassage: (id: string) => Promise<void>;
  onDeleteItem: (id: string) => Promise<void>;
}

type BankTab = 'assessments' | 'passages' | 'items';

const GRADE_FILTERS: { value: GradeLevel | 'ALL'; label: string }[] = [
  { value: 'ALL', label: 'All Grades' },
  { value: 'K', label: 'K' },
  { value: '1', label: 'Gr 1' },
  { value: '2', label: 'Gr 2' },
  { value: '3', label: 'Gr 3' },
  { value: '4', label: 'Gr 4' },
  { value: '5', label: 'Gr 5' },
];

export function SavedBank({
  assessments,
  passages,
  items,
  onOpenAssessmentInBuilder,
  onOpenPassageInGenerator,
  onDeleteAssessment,
  onDeletePassage,
  onDeleteItem,
}: SavedBankProps) {
  const [activeTab, setActiveTab] = useState<BankTab>('assessments');
  const [gradeFilter, setGradeFilter] = useState<GradeLevel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const normalizedQuery = searchQuery.trim().toLowerCase();

  const filteredAssessments = useMemo(() => {
    return assessments.filter((a) => {
      if (gradeFilter !== 'ALL' && a.grade !== gradeFilter) return false;
      if (!normalizedQuery) return true;
      const hay = [
        a.title,
        a.unitTag,
        a.passage.title,
        a.passage.topic,
        ...a.passage.alignedBenchmarks,
      ]
        .join(' ')
        .toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [assessments, gradeFilter, normalizedQuery]);

  const filteredPassages = useMemo(() => {
    return passages.filter((p) => {
      if (gradeFilter !== 'ALL' && p.grade !== gradeFilter) return false;
      if (!normalizedQuery) return true;
      const hay = [p.title, p.topic, p.textType, ...p.alignedBenchmarks].join(' ').toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [passages, gradeFilter, normalizedQuery]);

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      if (gradeFilter !== 'ALL' && item.grade !== gradeFilter) return false;
      if (!normalizedQuery) return true;
      const hay = [item.benchmarkCode, item.prompt, item.cognitiveSkill, item.itemType]
        .join(' ')
        .toLowerCase();
      return hay.includes(normalizedQuery);
    });
  }, [items, gradeFilter, normalizedQuery]);

  const handleDelete = async (id: string, fn: (targetId: string) => Promise<void>) => {
    setBusyId(id);
    try {
      await fn(id);
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <section className="studio-card p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-4">
          <div>
            <div className="text-xs font-mono text-[#434D7B] font-medium">
              Persistent Teacher &amp; Coach Repository
            </div>
            <h2 className="text-2xl font-bold text-[#2D2A26] mt-1">
              Saved Assessment, Passage &amp; Item Bank
            </h2>
            <p className="text-sm text-[#625D56] mt-1">
              Organize starter and custom-generated assessments by grade, instructional unit, or B.E.S.T. benchmark code.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-1 bg-[#F2ECE1] border border-[#E2D8C8] p-1 rounded-full self-start lg:self-auto">
            {(
              [
                { id: 'assessments', label: `Assessments (${assessments.length})` },
                { id: 'passages', label: `Passages (${passages.length})` },
                { id: 'items', label: `Individual Items (${items.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'bg-[#155E63] text-[#FFFDF9] shadow-sm'
                    : 'text-[#625D56] hover:text-[#2D2A26]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pt-3 border-t border-[#EAE1D2]">
          <div className="flex-1">
            <label htmlFor="bank-search" className="sr-only">
              Search saved materials
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-[#625D56] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="bank-search"
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by title, unit tag, topic, or benchmark code (e.g., ELA.4.R.2.2)..."
                className="w-full pl-10 pr-3.5 py-2 text-sm bg-[#FFFDF9] border border-[#DFD5C5] text-[#2D2A26] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155E63]/30"
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filter bank by grade">
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
      </section>

      {/* Assessments Tab */}
      {activeTab === 'assessments' && (
        <section className="space-y-4">
          {filteredAssessments.length === 0 ? (
            <div className="studio-card p-8 text-center text-sm text-[#625D56]">
              No saved assessments match the current filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredAssessments.map((assessment) => {
                const subjectBadge = inferSubjectBadge(
                  `${assessment.title} ${assessment.passage.topic} ${assessment.passage.textType}`
                );
                return (
                  <article
                    key={assessment.id}
                    className="studio-card p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#625D56]">
                        <span className={subjectBadge.className}>{subjectBadge.label}</span>
                        <span className="font-mono">
                          {formatGradeLabel(assessment.grade)} · {assessment.unitTag || 'Practice Set'} ·{' '}
                          {assessment.passage.complexity.estimatedLexileLabel} ·{' '}
                          {assessment.items.length} items
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-[#2D2A26]">
                        {assessment.title}
                      </h3>
                      <div className="text-xs text-[#625D56]">
                        Passage: <span className="font-semibold text-[#2D2A26]">{assessment.passage.title}</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 pt-0.5">
                        {assessment.passage.alignedBenchmarks.map((code) => (
                          <span key={code} className={STANDARD_CODE_PILL}>
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[#EAE1D2] pt-3">
                      <div className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenAssessmentInBuilder(assessment.id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2D2A26] bg-[#FFFDF9] border border-[#DFD5C5] rounded-xl hover:bg-[#F5EFE6] cursor-pointer whitespace-nowrap"
                        >
                          <Wrench className="w-3.5 h-3.5 text-[#434D7B]" />
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#FFFDF9] bg-[#155E63] rounded-xl hover:bg-[#0F4C50] cursor-pointer whitespace-nowrap"
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
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#2D2A26] bg-[#F5EFE6] border border-[#DFD5C5] rounded-xl hover:bg-[#EAE1D2] cursor-pointer whitespace-nowrap"
                        >
                          <Download className="w-3.5 h-3.5 text-[#434D7B]" />
                          Teacher .doc
                        </button>
                      </div>
                      <button
                        type="button"
                        disabled={busyId === assessment.id}
                        onClick={() => handleDelete(assessment.id, onDeleteAssessment)}
                        aria-label={`Delete assessment ${assessment.title}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#C84836] hover:bg-[#FDF1EE] rounded-xl cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Passages Tab */}
      {activeTab === 'passages' && (
        <section className="space-y-4">
          {filteredPassages.length === 0 ? (
            <div className="studio-card p-8 text-center text-sm text-[#625D56]">
              No saved passages match the current filter.
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {filteredPassages.map((passage) => {
                const subjectBadge = inferSubjectBadge(
                  `${passage.title} ${passage.topic} ${passage.textType}`
                );
                return (
                  <article
                    key={passage.id}
                    className="studio-card p-5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#625D56]">
                        <span className={subjectBadge.className}>{subjectBadge.label}</span>
                        <span className="font-mono">
                          {formatGradeLabel(passage.grade)} · {passage.textType} ·{' '}
                          {passage.complexity.wordCount} words ·{' '}
                          {passage.complexity.estimatedLexileLabel}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-[#2D2A26] flex items-center gap-2">
                        <FileText className="w-4 h-4 text-[#E05A47] shrink-0" />
                        <span>{passage.title}</span>
                      </h3>
                      <p className="text-xs text-[#625D56] line-clamp-3 leading-relaxed">
                        {passage.sections[0]?.paragraphs[0] ?? ''}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 text-xs text-[#625D56]">
                        <span>Vocab: {passage.vocabularyGuide.length} words</span>
                        {passage.alignedBenchmarks.map((code) => (
                          <span key={code} className={STANDARD_CODE_PILL}>
                            {code}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 border-t border-[#EAE1D2] pt-3">
                      <button
                        type="button"
                        onClick={() => onOpenPassageInGenerator(passage)}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#FFFDF9] bg-[#155E63] rounded-xl hover:bg-[#0F4C50] cursor-pointer whitespace-nowrap"
                      >
                        <BookOpen className="w-3.5 h-3.5" />
                        Inspect Complexity &amp; Vocab
                      </button>
                      <button
                        type="button"
                        disabled={busyId === passage.id}
                        onClick={() => handleDelete(passage.id, onDeletePassage)}
                        aria-label={`Delete passage ${passage.title}`}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-[#C84836] hover:bg-[#FDF1EE] rounded-xl cursor-pointer disabled:opacity-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Delete
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Individual Items Tab */}
      {activeTab === 'items' && (
        <section className="space-y-3">
          {filteredItems.length === 0 ? (
            <div className="studio-card p-8 text-center text-sm text-[#625D56]">
              No saved items match the current filter.
            </div>
          ) : (
            filteredItems.map((item) => (
              <article
                key={item.id}
                className="studio-card p-5 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#625D56]">
                    <span>{formatGradeLabel(item.grade)}</span>
                    <span className={STANDARD_CODE_PILL}>{item.benchmarkCode}</span>
                    <span>
                      {FAST_ITEM_TYPE_INFO[item.itemType].label} · DOK {item.dok} · {item.cognitiveRigor}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={busyId === item.id}
                    onClick={() => handleDelete(item.id, onDeleteItem)}
                    aria-label={`Delete item ${item.benchmarkCode}`}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-[#C84836] hover:bg-[#FDF1EE] rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
                <p className="font-student text-sm font-medium text-[#2D2A26]">{item.prompt}</p>
                <div className="text-xs text-[#625D56]">
                  <span className="font-semibold text-[#155E63]">Key: </span>
                  {item.correctAnswerSummary}
                </div>
                <div className="text-xs text-[#625D56]">{item.sourceCitation}</div>
              </article>
            ))
          )}
        </section>
      )}
    </div>
  );
}

