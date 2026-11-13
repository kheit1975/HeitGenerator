import { useState } from 'react';
import { ArrowRight, BookOpen, Loader2, Sparkles, Upload } from 'lucide-react';
import {
  BENCHMARKS_BY_CODE,
  PRACTICE_DISCLAIMER,
  formatGradeLabel,
} from '../data/floridaStandards.ts';
import { SelectedBenchmarksInline } from './StandardsExplorer.tsx';
import { TextComplexitySidebar, VocabularyToolPanel } from './VocabularyAndComplexityPanel.tsx';
import {
  OFFICIAL_COMPLEXITY_BANDS,
  analyzePassageComplexity,
  getTargetLexileProfile,
} from '../utils/textComplexity.ts';
import { STANDARD_CODE_PILL, inferSubjectBadge } from '../utils/themeTokens.ts';
import type {
  GradeLevel,
  PassageLengthOption,
  PassageTextType,
  ReadingPassage,
  VocabularyComplexityOption,
} from '../types/ela.ts';

interface PassageGeneratorProps {
  activePassage: ReadingPassage;
  allPassages: ReadingPassage[];
  selectedGrade: GradeLevel;
  selectedBenchmarkCodes: string[];
  onSelectGrade: (grade: GradeLevel) => void;
  onSelectActivePassage: (passage: ReadingPassage) => void;
  onPassageCreated: (passage: ReadingPassage) => void;
  onGoToItemGenerator: (passage: ReadingPassage) => void;
}

const TOPIC_SUGGESTIONS = [
  'Florida Manatees & Warm-Water Springs',
  'St. Augustine Coquina Fortresses',
  'Community Monarch Butterfly Waystations',
  'NASA Kennedy Space Center Weather Balloons',
  'Coral Reef Restoration in the Florida Keys',
];

export function PassageGenerator({
  activePassage,
  allPassages,
  selectedGrade,
  selectedBenchmarkCodes,
  onSelectGrade,
  onSelectActivePassage,
  onPassageCreated,
  onGoToItemGenerator,
}: PassageGeneratorProps) {
  const [mode, setMode] = useState<'generate' | 'custom'>('generate');
  const [textType, setTextType] = useState<PassageTextType>('informational');
  const [targetLength, setTargetLength] = useState<PassageLengthOption>('standard');
  const [vocabLevel, setVocabLevel] = useState<VocabularyComplexityOption>('on-grade');
  const [topic, setTopic] = useState('Florida Springs & Aquifer Stewardship');

  // Custom passage paste/edit fields
  const [customTitle, setCustomTitle] = useState('');
  const [customGenre, setCustomGenre] = useState<'literary' | 'informational'>('informational');
  const [customText, setCustomText] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const targetLexileProfile = getTargetLexileProfile(selectedGrade, vocabLevel);
  const officialBand = OFFICIAL_COMPLEXITY_BANDS[selectedGrade];

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setErrorMsg('Please enter a topic or subject area.');
      return;
    }
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/generate-passage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          grade: selectedGrade,
          textType,
          targetLength,
          vocabularyComplexity: vocabLevel,
          topic: topic.trim(),
          benchmarkCodes: selectedBenchmarkCodes,
        }),
      });
      const data = (await res.json()) as { passage?: ReadingPassage; error?: string };
      if (!res.ok || !data.passage) {
        throw new Error(data.error || 'Could not generate passage.');
      }
      onPassageCreated(data.passage);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Generation failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeCustom = async (e: React.FormEvent) => {
    e.preventDefault();
    const paragraphs = customText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    if (paragraphs.length === 0) {
      setErrorMsg('Paste at least one paragraph (separate paragraphs with a blank line).');
      return;
    }

    setIsLoading(true);
    setErrorMsg(null);

    const sections = [
      {
        id: `sec-custom-${Date.now()}`,
        label: customGenre === 'literary' ? 'Story' : 'Article',
        title: customTitle.trim() || 'Teacher Custom Passage',
        genre: customGenre,
        sourceNote: `Teacher-Provided Text · ${formatGradeLabel(selectedGrade)}`,
        paragraphs,
      },
    ];

    try {
      const res = await fetch('/api/analyze-passage', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections,
          grade: selectedGrade,
          textType: customGenre,
          extractVocabulary: true,
        }),
      });
      const data = (await res.json()) as {
        complexity?: ReadingPassage['complexity'];
        vocabularyGuide?: ReadingPassage['vocabularyGuide'];
        error?: string;
      };
      if (!res.ok || !data.complexity) {
        throw new Error(data.error || 'Analysis failed.');
      }

      const customPassage: ReadingPassage = {
        id: `passage-${Date.now()}`,
        title: customTitle.trim() || 'Teacher Custom Passage',
        grade: selectedGrade,
        textType: customGenre,
        topic: customTitle.trim() || 'Custom Instructional Text',
        targetLength: paragraphs.join(' ').split(/\s+/).length < 350 ? 'short' : 'standard',
        vocabularyComplexity: 'on-grade',
        alignedBenchmarks:
          selectedBenchmarkCodes.length > 0 ? selectedBenchmarkCodes : [`ELA.${selectedGrade}.R.2.2`],
        sections,
        glossary: [],
        vocabularyGuide: data.vocabularyGuide ?? [],
        complexity: data.complexity,
        practiceDisclaimer: PRACTICE_DISCLAIMER,
        createdAt: new Date().toISOString(),
        sourceMode: 'teacher-custom',
      };

      await fetch('/api/workspace/passages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ passage: customPassage }),
      });

      onPassageCreated(customPassage);
    } catch {
      const complexity = analyzePassageComplexity(sections, selectedGrade, customGenre);
      const localPassage: ReadingPassage = {
        id: `passage-${Date.now()}`,
        title: customTitle.trim() || 'Teacher Custom Passage',
        grade: selectedGrade,
        textType: customGenre,
        topic: 'Custom Text',
        targetLength: 'standard',
        vocabularyComplexity: 'on-grade',
        alignedBenchmarks:
          selectedBenchmarkCodes.length > 0 ? selectedBenchmarkCodes : [`ELA.${selectedGrade}.R.2.2`],
        sections,
        glossary: [],
        vocabularyGuide: [],
        complexity,
        practiceDisclaimer: PRACTICE_DISCLAIMER,
        createdAt: new Date().toISOString(),
        sourceMode: 'teacher-custom',
      };
      onPassageCreated(localPassage);
    } finally {
      setIsLoading(false);
    }
  };

  const lengthOptions: { value: PassageLengthOption; label: string; hint: string }[] = [
    {
      value: 'short',
      label: 'Short',
      hint:
        selectedGrade === 'K' || selectedGrade === '1'
          ? '100–160w'
          : selectedGrade === '2'
          ? '180–260w'
          : '260–350w',
    },
    {
      value: 'standard',
      label: 'Standard',
      hint:
        selectedGrade === 'K' || selectedGrade === '1'
          ? '160–220w'
          : selectedGrade === '2'
          ? '260–340w'
          : '450–620w',
    },
    {
      value: 'extended',
      label: 'Extended',
      hint:
        selectedGrade === 'K' || selectedGrade === '1'
          ? '220–300w'
          : selectedGrade === '2'
          ? '340–450w'
          : '700–880w',
    },
  ];

  const activeSubjectBadge = inferSubjectBadge(
    `${activePassage.title} ${activePassage.topic} ${activePassage.textType}`
  );

  let runningParagraphNumber = 0;

  return (
    <div className="space-y-6">
      {/* Studio Configuration Card */}
      <section className="studio-card p-6 space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#EAE1D2] pb-4">
          <div>
            <div className="text-xs font-mono text-[#434D7B] font-medium">
              Original Texts + Embedded Vocabulary Tool + Appendix B Complexity Analysis
            </div>
            <h1 className="text-2xl font-bold text-[#2D2A26] mt-1">
              Reading Passage Studio &amp; Complexity Analyzer
            </h1>
          </div>

          <div className="flex items-center gap-1 bg-[#F2ECE1] border border-[#E2D8C8] p-1 rounded-full self-start">
            <button
              type="button"
              onClick={() => setMode('generate')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'generate'
                  ? 'bg-[#155E63] text-[#FFFDF9] shadow-sm'
                  : 'text-[#625D56] hover:text-[#2D2A26]'
              }`}
            >
              Generate New Passage
            </button>
            <button
              type="button"
              onClick={() => setMode('custom')}
              className={`px-3.5 py-1.5 text-xs font-semibold rounded-full transition-colors cursor-pointer whitespace-nowrap ${
                mode === 'custom'
                  ? 'bg-[#155E63] text-[#FFFDF9] shadow-sm'
                  : 'text-[#625D56] hover:text-[#2D2A26]'
              }`}
            >
              Analyze Custom Text
            </button>
          </div>
        </div>

        {/* Active Passage Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#F5EFE6] border border-[#E5DDD0] rounded-xl p-3">
          <label htmlFor="active-passage-picker" className="text-xs font-semibold text-[#2D2A26] shrink-0">
            Currently Viewing Passage:
          </label>
          <select
            id="active-passage-picker"
            value={activePassage.id}
            onChange={(e) => {
              const found = allPassages.find((p) => p.id === e.target.value);
              if (found) onSelectActivePassage(found);
            }}
            className="flex-1 max-w-xl px-3 py-1.5 text-sm bg-[#FFFDF9] border border-[#DFD5C5] text-[#2D2A26] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155E63]/30"
          >
            {allPassages.map((p) => (
              <option key={p.id} value={p.id}>
                {formatGradeLabel(p.grade)} · {p.textType} · {p.title} ({p.complexity.estimatedLexileLabel})
              </option>
            ))}
          </select>
        </div>

        {mode === 'generate' ? (
          <form onSubmit={handleGenerate} className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Grade Level Pills */}
              <div className="bg-[#FAF6F0] border border-[#E5DDD0] rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-semibold text-[#2D2A26]">Grade Level</div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Grade Level">
                  {(['K', '1', '2', '3', '4', '5'] as GradeLevel[]).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => onSelectGrade(g)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                        selectedGrade === g
                          ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63] shadow-sm'
                          : 'bg-[#FFFDF9] text-[#625D56] border-[#DFD5C5] hover:bg-[#F5EFE6] hover:text-[#2D2A26]'
                      }`}
                    >
                      {g === 'K' ? 'Kindergarten' : `Grade ${g}`}
                    </button>
                  ))}
                </div>
              </div>

              {/* Genre / Format Pills */}
              <div className="bg-[#FAF6F0] border border-[#E5DDD0] rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-semibold text-[#2D2A26]">Passage Genre / Format</div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Passage Genre">
                  {[
                    { value: 'informational' as const, label: 'Informational Text' },
                    { value: 'literary' as const, label: 'Literary Text' },
                    { value: 'paired' as const, label: 'Paired Lit & Info' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTextType(opt.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                        textType === opt.value
                          ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63] shadow-sm'
                          : 'bg-[#FFFDF9] text-[#625D56] border-[#DFD5C5] hover:bg-[#F5EFE6] hover:text-[#2D2A26]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Target Length Pills */}
              <div className="bg-[#FAF6F0] border border-[#E5DDD0] rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-semibold text-[#2D2A26]">Target Length</div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Target Length">
                  {lengthOptions.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setTargetLength(opt.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                        targetLength === opt.value
                          ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63] shadow-sm'
                          : 'bg-[#FFFDF9] text-[#625D56] border-[#DFD5C5] hover:bg-[#F5EFE6] hover:text-[#2D2A26]'
                      }`}
                    >
                      {opt.label} <span className="opacity-80 font-mono text-[11px]">({opt.hint})</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Vocabulary Complexity Pills */}
              <div className="bg-[#FAF6F0] border border-[#E5DDD0] rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-semibold text-[#2D2A26]">Vocabulary Complexity</div>
                <div className="flex flex-wrap gap-1.5" role="group" aria-label="Vocabulary Complexity">
                  {[
                    { value: 'foundational' as const, label: 'Foundational (Accessible)' },
                    { value: 'on-grade' as const, label: 'On-Grade-Level' },
                    { value: 'stretch' as const, label: 'Stretch (Tier 2/3)' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setVocabLevel(opt.value)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                        vocabLevel === opt.value
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

            <div className="bg-[#EEF0F8] border border-[#D0D6EA] rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[#2D2A26]">
                <span>
                  <span className="font-semibold text-[#434D7B]">Target Lexile Range:</span>{' '}
                  <span className="font-mono font-semibold text-[#434D7B] tabular-nums">
                    {targetLexileProfile.targetDisplay}
                  </span>
                </span>
                <span className="text-[#9FA6C4]">·</span>
                <span>
                  <span className="font-semibold text-[#2D2A26]">Official {officialBand.label}:</span>{' '}
                  <span className="font-mono text-[#2D2A26] tabular-nums">
                    {officialBand.lexileDisplay}
                  </span>
                </span>
                <span className="text-[#9FA6C4]">·</span>
                <span>
                  <span className="font-semibold text-[#2D2A26]">Sentence Pacing:</span>{' '}
                  <span className="font-mono text-[#2D2A26]">
                    {targetLexileProfile.avgWordsPerSentenceRange}/sentence
                  </span>
                </span>
              </div>
              <span className="text-[11px] font-medium text-[#434D7B]">
                Auto-calibrated on generation to match target Lexile
              </span>
            </div>

            <div>
              <label htmlFor="pg-topic" className="block text-xs font-semibold text-[#2D2A26] mb-1">
                Topic or Subject Area
              </label>
              <input
                id="pg-topic"
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Florida Springs, Seminole History, Hydroponic School Gardens..."
                className="w-full px-3.5 py-2 text-sm bg-[#FFFDF9] border border-[#DFD5C5] text-[#2D2A26] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155E63]/30"
              />
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-xs text-[#625D56] mr-1">Topic Ideas:</span>
                {TOPIC_SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setTopic(s)}
                    className="px-2.5 py-0.5 text-[11px] font-medium rounded-full bg-[#F5EFE6] border border-[#E5DDD0] text-[#155E63] hover:bg-[#EAE1D2] cursor-pointer transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <SelectedBenchmarksInline codes={selectedBenchmarkCodes} />

            {errorMsg && (
              <div role="alert" className="bg-[#FDF1EE] border border-[#F5C6BD] text-[#9C382A] text-xs rounded-xl p-3">
                {errorMsg}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <div className="text-xs text-[#625D56]">
                Automatically generates numbered paragraphs, optional Glossary, 5–7 Vocabulary Cards, and Text Complexity metrics.
              </div>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E05A47] text-[#FFFDF9] text-sm font-semibold rounded-xl hover:bg-[#C84836] shadow-sm disabled:opacity-60 cursor-pointer whitespace-nowrap shrink-0 transition-colors"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Generating Original Passage...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Generate Original Passage
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleAnalyzeCustom} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="md:col-span-2">
                <label htmlFor="cp-title" className="block text-xs font-semibold text-[#2D2A26] mb-1">
                  Custom Passage Title
                </label>
                <input
                  id="cp-title"
                  type="text"
                  value={customTitle}
                  onChange={(e) => setCustomTitle(e.target.value)}
                  placeholder="Enter passage title..."
                  className="w-full px-3.5 py-2 text-sm bg-[#FFFDF9] border border-[#DFD5C5] text-[#2D2A26] rounded-xl"
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-[#2D2A26] mb-1.5">
                  Genre &amp; {formatGradeLabel(selectedGrade)}
                </div>
                <div className="flex gap-1.5">
                  {(['informational', 'literary'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setCustomGenre(g)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-full border capitalize cursor-pointer transition-colors ${
                        customGenre === g
                          ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63]'
                          : 'bg-[#F5EFE6] text-[#625D56] border-[#DFD5C5] hover:bg-[#EAE1D2]'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="cp-body" className="block text-xs font-semibold text-[#2D2A26] mb-1">
                Paste or Write Passage Text (separate paragraphs with a blank line)
              </label>
              <textarea
                id="cp-body"
                rows={6}
                value={customText}
                onChange={(e) => setCustomText(e.target.value)}
                placeholder="Paste your passage paragraphs here to estimate Lexile complexity and extract 5–7 key vocabulary words..."
                className="w-full px-3.5 py-2.5 text-sm bg-[#FFFDF9] border border-[#DFD5C5] text-[#2D2A26] rounded-xl leading-relaxed"
              />
            </div>

            {errorMsg && (
              <div role="alert" className="bg-[#FDF1EE] border border-[#F5C6BD] text-[#9C382A] text-xs rounded-xl p-3">
                {errorMsg}
              </div>
            )}

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#155E63] text-[#FFFDF9] text-sm font-semibold rounded-xl hover:bg-[#0F4C50] disabled:opacity-60 cursor-pointer whitespace-nowrap"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing Complexity &amp; Vocabulary...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Analyze Complexity &amp; Extract Vocabulary
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </section>

      {/* SIDE-BY-SIDE PASSAGE READER + TEXT COMPLEXITY ANALYSIS */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Tactile Paper Sheet Passage Reader */}
        <div className="lg:col-span-8 paper-desk p-4 sm:p-6">
          <article className="paper-sheet p-6 lg:p-8 space-y-6">
            <div className="border-b border-[#EAE1D2] pb-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2 text-xs text-[#625D56]">
                  <span className={activeSubjectBadge.className}>
                    {activeSubjectBadge.label}
                  </span>
                  <span className="font-mono">
                    {formatGradeLabel(activePassage.grade)} · {activePassage.textType}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => onGoToItemGenerator(activePassage)}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#E05A47] text-[#FFFDF9] text-xs font-semibold rounded-xl hover:bg-[#C84836] shadow-sm cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                >
                  Generate Items from Passage
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>

              <h2 className="font-student text-2xl font-semibold text-[#2D2A26] text-balance">
                {activePassage.title}
              </h2>

              <div className="flex flex-wrap gap-1.5">
                {activePassage.alignedBenchmarks.map((code) => (
                  <span key={code} className={STANDARD_CODE_PILL}>
                    {code}
                  </span>
                ))}
              </div>

              <div className="bg-[#FDF8EC] border border-[#E9D7AD] rounded-xl px-3.5 py-2 text-xs text-[#694A18]">
                {activePassage.practiceDisclaimer}
              </div>
            </div>

            <div className="font-student space-y-8">
              {activePassage.sections.map((section) => (
                <section key={section.id} className="space-y-4">
                  <div className="space-y-1">
                    <div className="text-xs font-mono text-[#434D7B] font-semibold">
                      {section.label}
                    </div>
                    <h3 className="text-lg font-semibold text-[#2D2A26]">{section.title}</h3>
                    {section.sourceNote && (
                      <p className="text-xs text-[#625D56] italic">{section.sourceNote}</p>
                    )}
                  </div>

                  <div className="space-y-4">
                    {section.paragraphs.map((para, pIdx) => {
                      runningParagraphNumber += 1;
                      const pNum = runningParagraphNumber;
                      return (
                        <div key={pIdx} className="flex items-start gap-3">
                          <span className="font-mono text-xs text-[#625D56] tabular-nums pt-1 w-6 shrink-0 select-none">
                            {pNum}
                          </span>
                          <p className="text-[15.5px] text-[#2D2A26] leading-[1.8]">
                            {para}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </section>
              ))}
            </div>

            {/* FAST-Style Glossary */}
            {activePassage.glossary.length > 0 && (
              <div className="paper-dashed-divider pt-4 space-y-2.5">
                <div className="text-xs font-semibold text-[#155E63] inline-flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Passage Glossary
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-student">
                  {activePassage.glossary.map((g, idx) => (
                    <div key={idx} className="bg-[#FAF6F0] border border-[#E5DDD0] rounded-xl p-2.5">
                      <dt className="font-semibold text-[#2D2A26] inline">{g.term}: </dt>
                      <dd className="text-[#625D56] inline">{g.definition}</dd>
                    </div>
                  ))}
                </dl>
              </div>
            )}

            {/* Aligned Benchmarks Reference */}
            <div className="paper-dashed-divider pt-4 text-xs text-[#625D56] space-y-2">
              <div className="font-semibold text-[#434D7B]">
                Aligned Official Florida B.E.S.T. Benchmarks
              </div>
              {activePassage.alignedBenchmarks.map((code) => {
                const b = BENCHMARKS_BY_CODE[code];
                return (
                  <div key={code} className="flex flex-wrap items-baseline gap-2">
                    <span className={STANDARD_CODE_PILL}>{code}</span>
                    <span>{b ? `“${b.officialText}”` : code}</span>
                  </div>
                );
              })}
            </div>
          </article>
        </div>

        {/* Right Side-by-Side: Text Complexity Analysis */}
        <div className="lg:col-span-4 lg:sticky lg:top-6">
          <TextComplexitySidebar passage={activePassage} />
        </div>
      </div>

      {/* Embedded Vocabulary Tool (5-7 words) */}
      <VocabularyToolPanel passage={activePassage} />
    </div>
  );
}

