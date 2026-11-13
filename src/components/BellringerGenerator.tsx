import { useMemo, useState } from 'react';
import {
  Check,
  Clock,
  Copy,
  Download,
  Edit3,
  Eye,
  FileCheck2,
  Printer,
  RefreshCw,
  Sparkles,
} from 'lucide-react';
import {
  BENCHMARKS_BY_CODE,
  formatGradeLabel,
  getPriorKnowledgePrerequisite,
} from '../data/floridaStandards.ts';
import {
  STANDARD_CODE_PILL,
  SUBJECT_BADGES,
  inferSubjectBadge,
} from '../utils/themeTokens.ts';
import type {
  BellringerActivity,
  BellringerPurpose,
  BellringerQuestion,
  BellringerQuestionType,
  GradeLevel,
} from '../types/ela.ts';
import {
  BELLRINGER_PURPOSE_OPTIONS,
  BELLRINGER_QUESTION_TYPE_OPTIONS,
  buildFallbackBellringer,
  countWords,
  estimateBellringerSeconds,
  formatBellringerStudentText,
  formatBellringerTeacherText,
  getBellringerEligibleBenchmarks,
} from '../utils/bellringerEngine.ts';
import {
  buildBellringerStudentDocHtml,
  buildBellringerTeacherDocHtml,
  downloadDocFile,
  slugifyFilename,
} from '../utils/docExport.ts';

interface BellringerGeneratorProps {
  initialGrade: GradeLevel;
}

type BellringerViewTab = 'student' | 'teacher';

export function BellringerGenerator({ initialGrade }: BellringerGeneratorProps) {
  const [grade, setGrade] = useState<GradeLevel>(initialGrade);
  const [benchmarkCode, setBenchmarkCode] = useState<string>(`ELA.${initialGrade}.V.1.3`);
  const [purpose, setPurpose] = useState<BellringerPurpose>('review');
  const [questionType, setQuestionType] = useState<BellringerQuestionType>('multiple_choice');

  const [bellringer, setBellringer] = useState<BellringerActivity>(() =>
    buildFallbackBellringer({
      grade: initialGrade,
      benchmarkCode: `ELA.${initialGrade}.V.1.3`,
      purpose: 'review',
      questionType: 'multiple_choice',
      variantIndex: 0,
    })
  );

  const [activeTab, setActiveTab] = useState<BellringerViewTab>('student');
  const [showGradeOnStudent, setShowGradeOnStudent] = useState<boolean>(true);
  const [showClarifications, setShowClarifications] = useState<boolean>(false);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [variantCounter, setVariantCounter] = useState<number>(1);
  const [seenTitles, setSeenTitles] = useState<string[]>([]);
  const [seenPrompts, setSeenPrompts] = useState<string[]>([]);

  const eligibleBenchmarks = useMemo(() => getBellringerEligibleBenchmarks(grade), [grade]);

  const groupedBenchmarks = useMemo(() => {
    const groups: Record<string, typeof eligibleBenchmarks> = {
      Foundations: [],
      Reading: [],
      Vocabulary: [],
      Communication: [],
      'ELA Expectations': [],
    };
    for (const bench of eligibleBenchmarks) {
      if (bench.strand === 'F') groups.Foundations.push(bench);
      else if (bench.strand === 'R') groups.Reading.push(bench);
      else if (bench.strand === 'V') groups.Vocabulary.push(bench);
      else if (bench.strand === 'C') groups.Communication.push(bench);
      else groups['ELA Expectations'].push(bench);
    }
    return groups;
  }, [eligibleBenchmarks]);

  const selectedBenchmark =
    BENCHMARKS_BY_CODE[benchmarkCode] ?? eligibleBenchmarks[0] ?? BENCHMARKS_BY_CODE['ELA.4.V.1.3'];

  const priorKnowledgeBenchmark = useMemo(
    () =>
      purpose === 'activate'
        ? getPriorKnowledgePrerequisite(selectedBenchmark.code, grade)
        : undefined,
    [purpose, selectedBenchmark.code, grade]
  );

  const handleGradeChange = (nextGrade: GradeLevel) => {
    setGrade(nextGrade);
    // Attempt to preserve same standard suffix across Grades K–5 (e.g., .R.1.1 -> ELA.K.R.1.1)
    const parts = benchmarkCode.split('.');
    const candidateCode =
      parts.length >= 4 &&
      (parts[1] === 'K' ||
        parts[1] === '1' ||
        parts[1] === '2' ||
        parts[1] === '3' ||
        parts[1] === '4' ||
        parts[1] === '5')
        ? `ELA.${nextGrade}.${parts.slice(2).join('.')}`
        : benchmarkCode;
    const nextEligible = getBellringerEligibleBenchmarks(nextGrade);
    if (nextEligible.some((b) => b.code === candidateCode)) {
      setBenchmarkCode(candidateCode);
    } else if (nextEligible[0]) {
      setBenchmarkCode(nextEligible[0].code);
    }
  };

  const requestBellringer = async (isRegenerate: boolean) => {
    setIsGenerating(true);
    setErrorMessage(null);
    setIsEditing(false);

    const nextVariant = isRegenerate ? variantCounter + 1 : 0;
    const nextExcludedTitles = isRegenerate
      ? Array.from(new Set([...seenTitles, bellringer.title])).slice(-8)
      : [];
    const nextExcludedPrompts = isRegenerate
      ? Array.from(
          new Set([...seenPrompts, ...bellringer.questions.map((q) => q.prompt)])
        ).slice(-8)
      : [];

    try {
      const response = await fetch('/api/generate-bellringer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade,
          benchmarkCode: selectedBenchmark.code,
          purpose,
          questionType,
          variantIndex: nextVariant,
          excludeTitles: nextExcludedTitles,
          excludePrompts: nextExcludedPrompts,
        }),
      });

      if (!response.ok) {
        const errData = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(errData.error || 'Could not generate bellringer.');
      }

      const data = (await response.json()) as { bellringer: BellringerActivity };
      setBellringer(data.bellringer);
      setVariantCounter(nextVariant);
      setSeenTitles(
        isRegenerate
          ? [...nextExcludedTitles, data.bellringer.title].slice(-8)
          : [data.bellringer.title]
      );
      setSeenPrompts(
        isRegenerate
          ? [...nextExcludedPrompts, ...data.bellringer.questions.map((q) => q.prompt)].slice(-8)
          : data.bellringer.questions.map((q) => q.prompt)
      );
    } catch (err) {
      setErrorMessage(
        err instanceof Error ? err.message : 'Unable to generate bellringer right now.'
      );
    } finally {
      setIsGenerating(false);
    }
  };

  const updateBellringerField = (patch: Partial<BellringerActivity>) => {
    setBellringer((prev) => {
      const next = { ...prev, ...patch };
      const passageWords = next.sourceText ? countWords(next.sourceText) : 0;
      const estimatedSeconds = estimateBellringerSeconds(next.sourceText, next.questions);
      return {
        ...next,
        timeAudit: {
          ...next.timeAudit,
          passageWordCount: passageWords,
          estimatedSeconds,
          estimatedMinutes: Math.max(2, Math.min(8, Math.round(estimatedSeconds / 60))),
        },
      };
    });
  };

  const updateQuestion = (questionId: string, updater: (q: BellringerQuestion) => BellringerQuestion) => {
    setBellringer((prev) => {
      const nextQuestions = prev.questions.map((q) => (q.id === questionId ? updater(q) : q));
      const estimatedSeconds = estimateBellringerSeconds(prev.sourceText, nextQuestions);
      return {
        ...prev,
        questions: nextQuestions,
        timeAudit: {
          ...prev.timeAudit,
          estimatedSeconds,
          estimatedMinutes: Math.max(2, Math.min(8, Math.round(estimatedSeconds / 60))),
        },
      };
    });
  };

  const handleCopyActiveView = async () => {
    const content =
      activeTab === 'student'
        ? formatBellringerStudentText(bellringer, showGradeOnStudent)
        : formatBellringerTeacherText(bellringer);

    try {
      await navigator.clipboard.writeText(content);
      setCopyStatus(activeTab === 'student' ? 'Copied Student Version' : 'Copied Teacher Key');
      setTimeout(() => setCopyStatus(null), 2500);
    } catch {
      setCopyStatus('Clipboard unavailable — download .doc');
      setTimeout(() => setCopyStatus(null), 3000);
    }
  };

  const handleDownloadDoc = (target: BellringerViewTab) => {
    const slug = slugifyFilename(bellringer.title, 'bellringer');
    const gradeSlug = bellringer.grade === 'K' ? 'kindergarten' : `grade-${bellringer.grade}`;
    if (target === 'student') {
      downloadDocFile(
        `${slug}-${gradeSlug}-student-version.doc`,
        buildBellringerStudentDocHtml(bellringer, showGradeOnStudent)
      );
    } else {
      downloadDocFile(
        `${slug}-${gradeSlug}-teacher-version.doc`,
        buildBellringerTeacherDocHtml(bellringer)
      );
    }
  };

  const showConventionsSuggestion =
    questionType === 'grammar_editing' && selectedBenchmark.strand !== 'C';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="print:hidden flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 border-b border-[#E5DDD0] pb-5">
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-[#625D56]">
            <span className={SUBJECT_BADGES.ela.className}>{SUBJECT_BADGES.ela.label}</span>
            <span>Grades K–5 · 5-Minute Independent Warm-Up</span>
          </div>
          <h1 className="text-2xl lg:text-3xl font-display font-bold text-[#2D2A26]">
            Bellringer Generator
          </h1>
          <p className="text-sm text-[#625D56] max-w-2xl">
            Generate focused, single-standard warm-up activities across Kindergarten–Grade 5 (including Foundational Skills, Reading, Vocabulary, Communication, and ELA Expectations), engineered for 5-minute completion with synchronized Student and Teacher paper sheets.
          </p>
        </div>
      </div>

      {/* Configuration Controls */}
      <section
        aria-label="Bellringer configuration"
        className="print:hidden studio-card p-5 lg:p-6 space-y-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Grade Level — Clickable Pill Toggle Chips */}
          <div className="lg:col-span-5 space-y-2.5">
            <div className="text-xs font-semibold tracking-wide text-[#625D56]">
              1. Grade Level
            </div>
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Bellringer grade level"
            >
              {(['K', '1', '2', '3', '4', '5'] as GradeLevel[]).map((g) => {
                const active = grade === g;
                return (
                  <button
                    key={g}
                    type="button"
                    onClick={() => handleGradeChange(g)}
                    aria-pressed={active}
                    className={`px-3.5 py-2 text-sm font-semibold rounded-full border transition-all whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63] shadow-xs'
                        : 'bg-[#FAF6F0] text-[#4A453E] border-[#DFD5C5] hover:bg-[#F2ECE1] hover:border-[#CFC3AE]'
                    }`}
                  >
                    {formatGradeLabel(g)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Single ELA Standard */}
          <div className="lg:col-span-7 space-y-2.5">
            <label
              htmlFor="bellringer-standard-select"
              className="block text-xs font-semibold tracking-wide text-[#625D56]"
            >
              2. ELA Standard (One Standard Per Bellringer)
            </label>
            <select
              id="bellringer-standard-select"
              value={selectedBenchmark.code}
              onChange={(e) => setBenchmarkCode(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm bg-[#FAF6F0] border border-[#DFD5C5] rounded-xl text-[#2D2A26] focus:outline-none focus:ring-2 focus:ring-[#155E63]/30 focus:border-[#155E63]"
            >
              {Object.entries(groupedBenchmarks).map(([groupName, list]) =>
                list.length > 0 ? (
                  <optgroup key={groupName} label={groupName}>
                    {list.map((b) => (
                      <option key={b.code} value={b.code}>
                        {b.code} — {b.benchmarkTitle}
                      </option>
                    ))}
                  </optgroup>
                ) : null
              )}
            </select>

            {/* Selected Standard Details */}
            <div className="bg-[#F5EFE6] border border-[#E5DDD0] rounded-xl p-3.5 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={STANDARD_CODE_PILL}>{selectedBenchmark.code}</span>
                  <span className="text-xs font-semibold text-[#2D2A26]">
                    {selectedBenchmark.benchmarkTitle}
                  </span>
                </div>
                {selectedBenchmark.clarifications.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowClarifications((v) => !v)}
                    className="text-xs font-semibold text-[#434D7B] hover:underline cursor-pointer"
                  >
                    {showClarifications ? 'Hide clarifications' : 'View clarifications'}
                  </button>
                )}
              </div>
              <p className="text-sm text-[#2D2A26] leading-relaxed">
                {selectedBenchmark.officialText}
              </p>
              {showClarifications && selectedBenchmark.clarifications.length > 0 && (
                <ul className="pt-2 space-y-1 text-xs text-[#625D56] border-t border-[#E2D8C8]">
                  {selectedBenchmark.clarifications.map((c, idx) => (
                    <li key={idx}>{c}</li>
                  ))}
                </ul>
              )}
              <div className="text-xs text-[#625D56]">
                Source: {selectedBenchmark.sourceTitle} (PDF p. {selectedBenchmark.pdfPage})
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4 border-t border-[#E5DDD0]">
          {/* Instructional Purpose */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold tracking-wide text-[#625D56]">
              3. Instructional Purpose
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5" role="radiogroup" aria-label="Instructional purpose">
              {BELLRINGER_PURPOSE_OPTIONS.map((opt) => {
                const active = purpose === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setPurpose(opt.id)}
                    className={`text-left p-3 rounded-xl border transition-all cursor-pointer ${
                      active
                        ? 'bg-[#155E63]/10 border-[#155E63] text-[#155E63] shadow-xs'
                        : 'bg-[#FAF6F0] border-[#DFD5C5] text-[#2D2A26] hover:bg-[#F2ECE1]'
                    }`}
                  >
                    <div className="text-sm font-semibold leading-snug">{opt.label}</div>
                    <div className="text-xs text-[#625D56] mt-0.5 leading-snug">
                      {opt.description}
                    </div>
                  </button>
                );
              })}
            </div>
            {purpose === 'activate' && priorKnowledgeBenchmark && (
              <div
                aria-label="Prior knowledge prerequisite standard"
                className="bg-[#EEF0F8] border border-[#D0D6EA] rounded-xl p-3.5 space-y-1.5"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-semibold text-[#434D7B]">
                    Prior Knowledge Bridge: {formatGradeLabel(priorKnowledgeBenchmark.grade)} →{' '}
                    {formatGradeLabel(grade)}
                  </span>
                  <span className={STANDARD_CODE_PILL}>{priorKnowledgeBenchmark.code}</span>
                </div>
                <div className="text-xs font-semibold text-[#2D2A26]">
                  {priorKnowledgeBenchmark.benchmarkTitle}
                </div>
                <p className="text-xs text-[#4A453E] leading-relaxed">
                  {priorKnowledgeBenchmark.officialText}
                </p>
              </div>
            )}
            {purpose === 'activate' && grade === 'K' && !priorKnowledgeBenchmark && (
              <div
                aria-label="Kindergarten oral and print readiness bridge"
                className="bg-[#EEF0F8] border border-[#D0D6EA] rounded-xl p-3.5 space-y-1"
              >
                <div className="text-xs font-mono font-semibold text-[#434D7B]">
                  Kindergarten Prior Knowledge Bridge · Oral Language &amp; Print Readiness
                </div>
                <p className="text-xs text-[#4A453E] leading-relaxed">
                  Begins with everyday spoken words, shared read-aloud picture clues, and familiar environmental print before introducing formal Grade K mastery.
                </p>
              </div>
            )}
          </div>

          {/* Question Type — Clickable Pill-Shaped Toggle Chips */}
          <div className="space-y-2.5">
            <div className="text-xs font-semibold tracking-wide text-[#625D56]">
              4. Question Type
            </div>
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Question type">
              {BELLRINGER_QUESTION_TYPE_OPTIONS.map((opt) => {
                const active = questionType === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setQuestionType(opt.id)}
                    title={opt.description}
                    className={`px-4 py-2 text-xs font-semibold rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                      active
                        ? 'bg-[#155E63] border-[#155E63] text-[#FFFDF9] shadow-xs'
                        : 'bg-[#FAF6F0] border-[#DFD5C5] text-[#4A453E] hover:bg-[#F2ECE1] hover:border-[#CFC3AE]'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
            <div className="text-xs text-[#625D56] bg-[#FAF6F0] border border-[#E5DDD0] rounded-xl px-3.5 py-2.5">
              <span className="font-semibold text-[#2D2A26]">
                {BELLRINGER_QUESTION_TYPE_OPTIONS.find((o) => o.id === questionType)?.label}:{' '}
              </span>
              {BELLRINGER_QUESTION_TYPE_OPTIONS.find((o) => o.id === questionType)?.description}
            </div>
            {showConventionsSuggestion && (
              <div className="flex flex-wrap items-center justify-between gap-2 bg-[#FDF1EE] border border-[#F5C6BD] rounded-xl px-3.5 py-2 text-xs text-[#7E2D22]">
                <span>
                  Tip: Standard conventions editing aligns directly to {formatGradeLabel(grade)} Conventions.
                </span>
                <button
                  type="button"
                  onClick={() => setBenchmarkCode(`ELA.${grade}.C.3.1`)}
                  className="font-semibold text-[#C84836] hover:underline whitespace-nowrap cursor-pointer"
                >
                  Select ELA.{grade}.C.3.1
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Primary Generate Action — Morning-Bell Coral */}
        <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-[#E5DDD0]">
          <div className="text-xs text-[#625D56]">
            5-minute pacing guardrail: short passages stay within 60–120 words in Grades 3–5 or 40–85 words in Grades K–2 (max 2 questions), or up to 3 discrete questions without a passage.
          </div>
          <button
            type="button"
            onClick={() => requestBellringer(false)}
            disabled={isGenerating}
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E05A47] text-[#FFFDF9] text-sm font-semibold rounded-xl hover:bg-[#C84836] disabled:opacity-60 transition-colors whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
          >
            <Sparkles className="w-4 h-4" />
            {isGenerating ? 'Generating Bellringer…' : 'Generate Bellringer'}
          </button>
        </div>

        {errorMessage && (
          <div
            role="alert"
            className="bg-[#FDF1EE] border border-[#F5C6BD] text-[#8F2D22] text-sm rounded-xl px-4 py-2.5"
          >
            {errorMessage}
          </div>
        )}
      </section>

      {/* Output Toolbar & View Switcher */}
      <section className="space-y-4">
        <div className="print:hidden studio-card p-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          {/* Student / Teacher Tabs */}
          <div className="flex flex-wrap items-center gap-3">
            <div
              role="tablist"
              aria-label="Bellringer version view"
              className="inline-flex rounded-full border border-[#DFD5C5] bg-[#F2ECE1] p-1"
            >
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'student'}
                onClick={() => setActiveTab('student')}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'student'
                    ? 'bg-[#155E63] text-[#FFFDF9] shadow-xs'
                    : 'text-[#4A453E] hover:text-[#2D2A26]'
                }`}
              >
                <Eye className="w-4 h-4" />
                Student Version
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === 'teacher'}
                onClick={() => setActiveTab('teacher')}
                className={`inline-flex items-center gap-1.5 px-4 py-1.5 text-sm font-semibold rounded-full transition-all whitespace-nowrap cursor-pointer ${
                  activeTab === 'teacher'
                    ? 'bg-[#155E63] text-[#FFFDF9] shadow-xs'
                    : 'text-[#4A453E] hover:text-[#2D2A26]'
                }`}
              >
                <FileCheck2 className="w-4 h-4" />
                Teacher Version
              </button>
            </div>

            {activeTab === 'student' && (
              <label className="inline-flex items-center gap-2 text-xs text-[#625D56] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={showGradeOnStudent}
                  onChange={(e) => setShowGradeOnStudent(e.target.checked)}
                  className="rounded border-[#CFC3AE] text-[#155E63] focus:ring-[#155E63]"
                />
                Show grade on student sheet
              </label>
            )}
          </div>

          {/* Teacher Actions */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => requestBellringer(true)}
              disabled={isGenerating}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#FDF1EE] border border-[#F5C6BD] text-[#C84836] rounded-full hover:bg-[#FAE3DE] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
              Regenerate Bellringer
            </button>

            <button
              type="button"
              onClick={() => setIsEditing((v) => !v)}
              aria-pressed={isEditing}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full border whitespace-nowrap shrink-0 cursor-pointer ${
                isEditing
                  ? 'bg-[#434D7B] text-[#FFFDF9] border-[#434D7B]'
                  : 'bg-[#FAF6F0] border-[#DFD5C5] text-[#4A453E] hover:bg-[#F2ECE1]'
              }`}
            >
              {isEditing ? <Check className="w-3.5 h-3.5" /> : <Edit3 className="w-3.5 h-3.5" />}
              {isEditing ? 'Done Editing' : 'Edit Bellringer'}
            </button>

            <button
              type="button"
              onClick={handleCopyActiveView}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#FAF6F0] border border-[#DFD5C5] text-[#4A453E] rounded-full hover:bg-[#F2ECE1] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              {copyStatus ?? (activeTab === 'student' ? 'Copy Student' : 'Copy Teacher')}
            </button>

            <button
              type="button"
              onClick={() => handleDownloadDoc('student')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#FAF6F0] border border-[#DFD5C5] text-[#2D2A26] rounded-full hover:bg-[#F2ECE1] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Student Version (.doc)
            </button>

            <button
              type="button"
              onClick={() => handleDownloadDoc('teacher')}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold bg-[#FAF6F0] border border-[#DFD5C5] text-[#2D2A26] rounded-full hover:bg-[#F2ECE1] whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Teacher Version (.doc)
            </button>

            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-[#155E63] text-[#FFFDF9] rounded-full hover:bg-[#0F4C50] whitespace-nowrap shrink-0 cursor-pointer shadow-xs"
            >
              <Printer className="w-3.5 h-3.5" />
              {activeTab === 'student' ? 'Print Student Version' : 'Print Teacher Version'}
            </button>
          </div>
        </div>

        {/* Inline Edit Drawer */}
        {isEditing && (
          <div
            aria-label="Edit bellringer fields"
            className="print:hidden bg-[#EEF0F8]/70 border border-[#D0D6EA] rounded-2xl p-5 space-y-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="text-base font-semibold text-[#434D7B]">
                  Edit Bellringer (Updates Student &amp; Teacher Versions Together)
                </h2>
                <p className="text-xs text-[#625D56]">
                  Changes apply immediately to both tabs and exported handouts.
                </p>
              </div>
              <div className="text-xs font-mono text-[#434D7B] font-semibold">
                Est. Time: ~{bellringer.timeAudit.estimatedMinutes} min
                {bellringer.sourceText ? ` · Passage: ${bellringer.timeAudit.passageWordCount} words` : ''}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label
                  htmlFor="edit-bellringer-title"
                  className="block text-xs font-semibold text-[#2D2A26]"
                >
                  Activity Title
                </label>
                <input
                  id="edit-bellringer-title"
                  type="text"
                  value={bellringer.title}
                  onChange={(e) => updateBellringerField({ title: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-[#FFFDF9] border border-[#DFD5C5] rounded-xl text-[#2D2A26]"
                />
              </div>

              <div className="space-y-1">
                <label
                  htmlFor="edit-bellringer-directions"
                  className="block text-xs font-semibold text-[#2D2A26]"
                >
                  Student Directions
                </label>
                <input
                  id="edit-bellringer-directions"
                  type="text"
                  value={bellringer.directions}
                  onChange={(e) => updateBellringerField({ directions: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-[#FFFDF9] border border-[#DFD5C5] rounded-xl text-[#2D2A26]"
                />
              </div>
            </div>

            {bellringer.sourceText !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label
                    htmlFor="edit-bellringer-source-text"
                    className="block text-xs font-semibold text-[#2D2A26]"
                  >
                    Source Text (Target 40–85 words for K–2 or 60–120 words for Grades 3–5)
                  </label>
                  <span className="text-xs font-mono text-[#434D7B] font-medium">
                    {countWords(bellringer.sourceText)} words
                  </span>
                </div>
                <textarea
                  id="edit-bellringer-source-text"
                  rows={4}
                  value={bellringer.sourceText}
                  onChange={(e) => updateBellringerField({ sourceText: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-[#FFFDF9] border border-[#DFD5C5] rounded-xl text-[#2D2A26] leading-relaxed"
                />
              </div>
            )}

            <div className="space-y-4">
              {bellringer.questions.map((q) => (
                <div
                  key={q.id}
                  className="bg-[#FFFDF9] border border-[#E5DDD0] rounded-2xl p-4 space-y-3"
                >
                  <div className="text-xs font-mono font-semibold text-[#155E63]">
                    Question {q.number} ({q.format.replace('_', ' ')})
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor={`edit-q-prompt-${q.id}`}
                      className="block text-xs font-semibold text-[#625D56]"
                    >
                      Question Prompt
                    </label>
                    <textarea
                      id={`edit-q-prompt-${q.id}`}
                      rows={2}
                      value={q.prompt}
                      onChange={(e) =>
                        updateQuestion(q.id, (prev) => ({ ...prev, prompt: e.target.value }))
                      }
                      className="w-full px-3 py-1.5 text-sm bg-[#FAF6F0] border border-[#DFD5C5] rounded-xl text-[#2D2A26]"
                    />
                  </div>

                  {q.targetSentence !== undefined && (
                    <div className="space-y-1">
                      <label
                        htmlFor={`edit-q-sentence-${q.id}`}
                        className="block text-xs font-semibold text-[#625D56]"
                      >
                        Sentence to Edit / Analyze
                      </label>
                      <input
                        id={`edit-q-sentence-${q.id}`}
                        type="text"
                        value={q.targetSentence}
                        onChange={(e) =>
                          updateQuestion(q.id, (prev) => ({
                            ...prev,
                            targetSentence: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-1.5 text-sm bg-[#FAF6F0] border border-[#DFD5C5] rounded-xl text-[#2D2A26]"
                      />
                    </div>
                  )}

                  {q.options && q.options.length > 0 && (
                    <div className="space-y-2">
                      <div className="text-xs font-semibold text-[#625D56]">
                        Answer Choices (select the correct option)
                      </div>
                      {q.options.map((opt) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <input
                            type="radio"
                            name={`correct-${q.id}`}
                            checked={opt.isCorrect}
                            onChange={() =>
                              updateQuestion(q.id, (prev) => {
                                const updatedOpts = (prev.options ?? []).map((o) => ({
                                  ...o,
                                  isCorrect: o.id === opt.id,
                                }));
                                return {
                                  ...prev,
                                  options: updatedOpts,
                                  correctAnswer: `${opt.label}. ${opt.text}`,
                                };
                              })
                            }
                            aria-label={`Mark option ${opt.label} as correct for question ${q.number}`}
                            className="accent-[#155E63]"
                          />
                          <span className="text-xs font-mono font-semibold w-5 text-[#434D7B]">
                            {opt.label}.
                          </span>
                          <input
                            type="text"
                            value={opt.text}
                            onChange={(e) =>
                              updateQuestion(q.id, (prev) => {
                                const updatedOpts = (prev.options ?? []).map((o) =>
                                  o.id === opt.id ? { ...o, text: e.target.value } : o
                                );
                                const chosen = updatedOpts.find((o) => o.isCorrect);
                                return {
                                  ...prev,
                                  options: updatedOpts,
                                  correctAnswer: chosen
                                    ? `${chosen.label}. ${chosen.text}`
                                    : prev.correctAnswer,
                                };
                              })
                            }
                            className="flex-1 px-2.5 py-1 text-sm bg-[#FAF6F0] border border-[#DFD5C5] rounded-xl text-[#2D2A26]"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <label
                        htmlFor={`edit-q-answer-${q.id}`}
                        className="block text-xs font-semibold text-[#625D56]"
                      >
                        Answer Key
                      </label>
                      <input
                        id={`edit-q-answer-${q.id}`}
                        type="text"
                        value={q.correctAnswer}
                        onChange={(e) =>
                          updateQuestion(q.id, (prev) => ({
                            ...prev,
                            correctAnswer: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-1.5 text-sm bg-[#FAF6F0] border border-[#DFD5C5] rounded-xl text-[#2D2A26]"
                      />
                    </div>

                    <div className="space-y-1">
                      <label
                        htmlFor={`edit-q-evidence-${q.id}`}
                        className="block text-xs font-semibold text-[#625D56]"
                      >
                        Supporting Evidence (Optional)
                      </label>
                      <input
                        id={`edit-q-evidence-${q.id}`}
                        type="text"
                        value={q.textualEvidence ?? ''}
                        onChange={(e) =>
                          updateQuestion(q.id, (prev) => ({
                            ...prev,
                            textualEvidence: e.target.value || undefined,
                          }))
                        }
                        className="w-full px-3 py-1.5 text-sm bg-[#FAF6F0] border border-[#DFD5C5] rounded-xl text-[#2D2A26]"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label
                      htmlFor={`edit-q-explanation-${q.id}`}
                      className="block text-xs font-semibold text-[#625D56]"
                    >
                      Teacher Explanation
                    </label>
                    <textarea
                      id={`edit-q-explanation-${q.id}`}
                      rows={2}
                      value={q.explanation}
                      onChange={(e) =>
                        updateQuestion(q.id, (prev) => ({
                          ...prev,
                          explanation: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-1.5 text-sm bg-[#FAF6F0] border border-[#DFD5C5] rounded-xl text-[#2D2A26]"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STUDENT VERSION VIEW — Tactile Physical Worksheet on Warm Desk (Lexend Early-Reader Font, NO answers) */}
        {activeTab === 'student' && (
          <div className="paper-desk p-4 sm:p-6 lg:p-8">
            <article
              aria-label="Student Version Bellringer"
              className="paper-sheet font-student max-w-4xl mx-auto p-6 sm:p-8 lg:p-10 space-y-6 text-[#2D2A26]"
            >
              <header className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[#625D56]">
                  <div className="flex items-center gap-2">
                    <span className={inferSubjectBadge(bellringer.title + ' ' + (bellringer.sourceText ?? '')).className}>
                      {inferSubjectBadge(bellringer.title + ' ' + (bellringer.sourceText ?? '')).label}
                    </span>
                    <span className="font-medium">
                      {showGradeOnStudent ? `${formatGradeLabel(bellringer.grade)} Morning Bellwork` : 'Morning Bellwork'}
                    </span>
                  </div>
                  <div className="inline-flex items-center gap-1.5 font-mono text-[#155E63] bg-[#FAF6F0] border border-[#E5DDD0] px-2.5 py-1 rounded-full">
                    <Clock className="w-3.5 h-3.5 text-[#E05A47]" />
                    <span>Estimated completion time: 5 minutes</span>
                  </div>
                </div>

                {/* Student Name & Date Worksheet Header Lines */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 pt-1 text-xs text-[#4A453E]">
                  <div className="sm:col-span-8 flex items-end gap-2">
                    <span className="font-semibold shrink-0">Name:</span>
                    <span className="flex-1 border-b border-[#8C8478] h-4" />
                  </div>
                  <div className="sm:col-span-4 flex items-end gap-2">
                    <span className="font-semibold shrink-0">Date:</span>
                    <span className="flex-1 border-b border-[#8C8478] h-4" />
                  </div>
                </div>

                <div className="paper-dashed-divider pt-4">
                  <h2 className="text-2xl font-bold text-[#2D2A26] tracking-tight">
                    {bellringer.title}
                  </h2>
                </div>
              </header>

              <div className="bg-[#FAF6F0] border border-[#E5DDD0] rounded-xl px-4 py-3 text-sm text-[#2D2A26] leading-relaxed">
                <span className="font-semibold text-[#155E63]">Directions: </span>
                {bellringer.directions}
              </div>

              {bellringer.sourceText && (
                <div className="space-y-2 print-avoid-break">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#625D56]">
                    {bellringer.sourceTextLabel ?? 'Read the Passage'}
                  </div>
                  <div className="bg-[#FFFDF9] border border-[#E2D8C8] rounded-xl p-5 text-[16px] leading-[1.85] text-[#2D2A26]">
                    {bellringer.sourceText}
                  </div>
                </div>
              )}

              <div className="paper-dashed-divider pt-5">
                <ol className="space-y-6">
                  {bellringer.questions.map((q) => (
                    <li key={q.id} className="space-y-3 print-avoid-break">
                      <div className="text-[15.5px] font-medium text-[#2D2A26] leading-relaxed">
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#155E63]/10 text-[#155E63] font-mono text-xs font-bold mr-2">
                          {q.number}
                        </span>
                        {q.prompt}
                      </div>

                      {q.targetSentence && (
                        <div className="bg-[#F5EFE6] border border-[#E2D8C8] rounded-xl px-4 py-3 text-[15.5px] text-[#2D2A26] font-medium leading-relaxed">
                          {q.targetSentence}
                        </div>
                      )}

                      {q.options && q.options.length > 0 ? (
                        <ul className="space-y-2 pl-2">
                          {q.options.map((opt) => (
                            <li
                              key={opt.id}
                              className="flex items-start gap-2.5 text-[15px] text-[#2D2A26]"
                            >
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full border border-[#CFC3AE] bg-[#FAF6F0] font-mono text-xs font-semibold text-[#4A453E] shrink-0 mt-0.5">
                                {opt.label}
                              </span>
                              <span className="pt-0.5 leading-relaxed">{opt.text}</span>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <div className="space-y-3 pt-1 pl-2">
                          <div className="text-xs text-[#625D56]">
                            {q.format === 'short_response'
                              ? 'Write 1–2 complete sentences on the lines below.'
                              : 'Write your revised sentence on the lines below.'}
                          </div>
                          <div className="border-b border-[#B9AE9C] h-7" />
                          <div className="border-b border-[#B9AE9C] h-7" />
                        </div>
                      )}
                    </li>
                  ))}
                </ol>
              </div>
            </article>
          </div>
        )}

        {/* TEACHER VERSION VIEW — Paper Sheet with Muted Indigo Coach Key & Rationale */}
        {activeTab === 'teacher' && (
          <div className="paper-desk p-4 sm:p-6 lg:p-8">
            <article
              aria-label="Teacher Version Bellringer Key"
              className="paper-sheet font-student max-w-4xl mx-auto p-6 sm:p-8 lg:p-10 space-y-6 text-[#2D2A26]"
            >
              <header className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-[#625D56]">
                  <span className="px-2.5 py-0.5 rounded-full bg-[#EEF0F8] text-[#434D7B] border border-[#D0D6EA] font-semibold">
                    TEACHER ANSWER KEY · {formatGradeLabel(bellringer.grade).toUpperCase()}
                  </span>
                  <span>
                    {bellringer.estimatedTimeLabel} (~{Math.round(bellringer.timeAudit.estimatedSeconds / 60)} min calculated)
                    {bellringer.timeAudit.passageWordCount > 0
                      ? ` · ${bellringer.timeAudit.passageWordCount} words`
                      : ' · Discrete Items'}
                  </span>
                </div>

                <h2 className="text-2xl font-bold text-[#2D2A26]">{bellringer.title}</h2>

                {/* Alignment & Instructional Purpose Block */}
                <div className="bg-[#EEF0F8]/70 border border-[#D0D6EA] rounded-xl p-4 space-y-2.5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-semibold text-[#434D7B] uppercase tracking-wide">
                        Instructional Purpose:{' '}
                      </span>
                      <span className="text-[#2D2A26] font-medium">{bellringer.purposeLabel}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#434D7B] uppercase tracking-wide">
                        Question Format:{' '}
                      </span>
                      <span className="text-[#2D2A26] font-medium">{bellringer.questionTypeLabel}</span>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-[#D0D6EA] space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={STANDARD_CODE_PILL}>{bellringer.benchmarkCode}</span>
                      <span className="text-xs font-semibold text-[#2D2A26]">
                        {bellringer.benchmarkTitle}
                      </span>
                    </div>
                    <p className="text-sm text-[#2D2A26]">{bellringer.officialBenchmarkText}</p>
                    <div className="text-xs text-[#625D56]">
                      Authoritative Source: {bellringer.sourceCitation}
                    </div>
                  </div>
                  {bellringer.priorKnowledgeBenchmarkCode && bellringer.priorKnowledgeBenchmarkText && (
                    <div className="pt-2 border-t border-[#D0D6EA] space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-semibold text-[#434D7B]">
                          Prior Knowledge Standard:
                        </span>
                        <span className={STANDARD_CODE_PILL}>
                          {bellringer.priorKnowledgeBenchmarkCode}
                        </span>
                        <span className="text-xs font-medium text-[#2D2A26]">
                          {bellringer.priorKnowledgeBenchmarkTitle}
                        </span>
                      </div>
                      <p className="text-xs text-[#4A453E]">
                        {bellringer.priorKnowledgeBenchmarkText}
                      </p>
                      {bellringer.priorKnowledgeBridgeNote && (
                        <div className="text-xs text-[#625D56]">
                          {bellringer.priorKnowledgeBridgeNote}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {bellringer.timeAudit.wasAutoTrimmed && bellringer.timeAudit.trimNotes.length > 0 && (
                  <div className="bg-[#FDF1EE] border border-[#F5C6BD] rounded-xl px-3.5 py-2 text-xs text-[#7E2D22]">
                    <span className="font-semibold">5-Minute Budget Adjustment: </span>
                    {bellringer.timeAudit.trimNotes.join(' ')}
                  </div>
                )}
              </header>

              <div className="text-sm text-[#4A453E]">
                <span className="font-semibold text-[#155E63]">Student Directions: </span>
                {bellringer.directions}
              </div>

              {bellringer.sourceText && (
                <div className="space-y-2 print-avoid-break">
                  <div className="text-xs font-semibold uppercase tracking-wide text-[#625D56]">
                    {bellringer.sourceTextLabel ?? 'Source Text'} ({bellringer.timeAudit.passageWordCount} words)
                  </div>
                  <div className="bg-[#FAF6F0] border border-[#E5DDD0] rounded-xl p-4 text-[15px] leading-[1.8] text-[#2D2A26]">
                    {bellringer.sourceText}
                  </div>
                </div>
              )}

              <div className="paper-dashed-divider pt-5 space-y-5">
                <h3 className="text-sm font-semibold uppercase tracking-wide text-[#434D7B]">
                  Questions, Answer Key &amp; Explanations
                </h3>
                {bellringer.questions.map((q) => (
                  <div
                    key={q.id}
                    className="border border-[#E5DDD0] bg-[#FAF6F0]/50 rounded-xl p-4 lg:p-5 space-y-3 print-avoid-break"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-mono font-semibold text-[#155E63]">
                        Question {q.number}
                      </span>
                      <span className="text-xs font-mono text-[#625D56]">
                        {q.format === 'multiple_choice'
                          ? 'Multiple Choice'
                          : q.format === 'grammar_editing'
                            ? 'Grammar / Editing'
                            : 'Short Constructed Response (1–2 sentences)'}
                      </span>
                    </div>

                    <p className="text-[15px] font-medium text-[#2D2A26]">{q.prompt}</p>

                    {q.targetSentence && (
                      <div className="bg-[#FFFDF9] border border-[#E2D8C8] rounded-lg px-3.5 py-2 text-sm text-[#2D2A26]">
                        {q.targetSentence}
                      </div>
                    )}

                    {q.options && q.options.length > 0 && (
                      <ul className="space-y-1.5">
                        {q.options.map((opt) => (
                          <li
                            key={opt.id}
                            className={`rounded-lg px-3 py-2 text-sm border ${
                              opt.isCorrect
                                ? 'bg-[#E9F3EC] border-[#C3DFCB] text-[#1D462C]'
                                : 'bg-[#FFFDF9] border-[#E5DDD0] text-[#4A453E]'
                            }`}
                          >
                            <div className="flex items-start gap-2">
                              <span className="font-mono font-semibold">{opt.label}.</span>
                              <div className="flex-1">
                                <span className={opt.isCorrect ? 'font-semibold' : ''}>
                                  {opt.text}
                                </span>
                                {opt.isCorrect && (
                                  <span className="ml-2 text-xs font-mono font-semibold text-[#245436]">
                                    [Correct]
                                  </span>
                                )}
                                {opt.rationale && (
                                  <div className="text-xs text-[#625D56] mt-0.5">{opt.rationale}</div>
                                )}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    )}

                    <div className="bg-[#E9F3EC]/70 border border-[#C3DFCB] rounded-xl p-3.5 space-y-1.5 text-sm">
                      <div>
                        <span className="font-semibold text-[#245436]">Correct Answer: </span>
                        <span className="text-[#1D462C]">{q.correctAnswer}</span>
                      </div>
                      <div>
                        <span className="font-semibold text-[#2D2A26]">Explanation: </span>
                        <span className="text-[#4A453E]">{q.explanation}</span>
                      </div>
                      {q.textualEvidence && (
                        <div>
                          <span className="font-semibold text-[#2D2A26]">Supporting Evidence: </span>
                          <span className="text-[#4A453E] italic">{q.textualEvidence}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <footer className="pt-3 border-t border-[#E5DDD0] text-xs text-[#625D56]">
                {bellringer.practiceDisclaimer}
              </footer>
            </article>
          </div>
        )}
      </section>
    </div>
  );
}
