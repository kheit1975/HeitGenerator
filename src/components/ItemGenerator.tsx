import { useEffect, useMemo, useState } from 'react';
import { AlertTriangle, Check, Loader2, Plus, RefreshCw, Sparkles } from 'lucide-react';
import {
  BENCHMARKS_BY_CODE,
  FAST_ITEM_TYPE_INFO,
  formatGradeLabel,
  getBenchmarksForGrade,
} from '../data/floridaStandards.ts';
import { validateItemFormatForGradeAndBenchmark } from '../utils/assessmentEngine.ts';
import { STANDARD_CODE_PILL } from '../utils/themeTokens.ts';
import type {
  AssessmentItem,
  CognitiveRigor,
  FastItemType,
  ReadingPassage,
} from '../types/ela.ts';

interface ItemGeneratorProps {
  passages: ReadingPassage[];
  activePassage: ReadingPassage;
  selectedBenchmarkCodes: string[];
  generatedItems: AssessmentItem[];
  onSelectPassage: (passage: ReadingPassage) => void;
  onItemsGenerated: (items: AssessmentItem[]) => void;
  onReplaceItem: (oldId: string, updated: AssessmentItem) => void;
  onAddItemsToBuilder: (items: AssessmentItem[]) => void;
}

const ALL_ITEM_TYPES: FastItemType[] = [
  'multiple_choice',
  'multiselect',
  'ebsr',
  'hot_text',
  'table_match',
];

export function ItemGenerator({
  passages,
  activePassage,
  selectedBenchmarkCodes,
  generatedItems,
  onSelectPassage,
  onItemsGenerated,
  onReplaceItem,
  onAddItemsToBuilder,
}: ItemGeneratorProps) {
  const gradeBenchmarks = useMemo(
    () =>
      getBenchmarksForGrade(activePassage.grade).filter(
        (b) => b.strand === 'F' || b.strand === 'R' || b.strand === 'V' || b.strand === 'EE'
      ),
    [activePassage.grade]
  );

  const [chosenBenchmarks, setChosenBenchmarks] = useState<string[]>(() => {
    if (selectedBenchmarkCodes.length > 0) return selectedBenchmarkCodes;
    return activePassage.alignedBenchmarks;
  });

  useEffect(() => {
    const validCodes = new Set(gradeBenchmarks.map((b) => b.code));
    setChosenBenchmarks((prev) => {
      const stillValid = prev.filter((c) => validCodes.has(c));
      if (stillValid.length > 0) return stillValid;
      const fromSelected = selectedBenchmarkCodes.filter((c) => validCodes.has(c));
      return fromSelected.length > 0 ? fromSelected : activePassage.alignedBenchmarks;
    });
  }, [activePassage.id, activePassage.alignedBenchmarks, gradeBenchmarks, selectedBenchmarkCodes]);

  const [itemTypes, setItemTypes] = useState<FastItemType[]>([
    'multiple_choice',
    'ebsr',
    'multiselect',
  ]);
  const [count, setCount] = useState(4);
  const [rigor, setRigor] = useState<CognitiveRigor>('On-Grade-Level');
  const [isGenerating, setIsGenerating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [addedFeedback, setAddedFeedback] = useState(false);

  const toggleBenchmark = (code: string) => {
    setChosenBenchmarks((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const toggleItemType = (type: FastItemType) => {
    setItemTypes((prev) => {
      if (prev.includes(type)) {
        return prev.length > 1 ? prev.filter((t) => t !== type) : prev;
      }
      return [...prev, type];
    });
  };

  const compatibilityNotices = useMemo(() => {
    const notices: string[] = [];
    const checkedPairs = new Set<string>();
    const targetBench = chosenBenchmarks[0] ?? activePassage.alignedBenchmarks[0];
    if (!targetBench) return notices;
    for (const t of itemTypes) {
      const check = validateItemFormatForGradeAndBenchmark(activePassage.grade, targetBench, t);
      for (const issue of check.issues) {
        if (!checkedPairs.has(issue.message)) {
          checkedPairs.add(issue.message);
          notices.push(issue.message);
        }
      }
    }
    return notices;
  }, [activePassage.grade, activePassage.alignedBenchmarks, chosenBenchmarks, itemTypes]);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (chosenBenchmarks.length === 0) {
      setErrorMsg('Select at least one Florida B.E.S.T. benchmark before generating items.');
      return;
    }
    setIsGenerating(true);
    setErrorMsg(null);
    setAddedFeedback(false);
    try {
      const res = await fetch('/api/generate-items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage: activePassage,
          benchmarkCodes: chosenBenchmarks,
          itemTypes,
          count,
          rigor,
        }),
      });
      const data = (await res.json()) as { items?: AssessmentItem[]; error?: string };
      if (!res.ok || !data.items) {
        throw new Error(data.error || 'Failed to generate items.');
      }
      onItemsGenerated(data.items);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Item generation failed.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRegenerateSingle = async (item: AssessmentItem) => {
    setRegeneratingId(item.id);
    setErrorMsg(null);
    try {
      const res = await fetch('/api/regenerate-item', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          passage: activePassage,
          benchmarkCode: item.benchmarkCode,
          itemType: item.itemType,
          rigor: item.cognitiveRigor,
          previousPrompt: item.prompt,
        }),
      });
      const data = (await res.json()) as { item?: AssessmentItem; error?: string };
      if (!res.ok || !data.item) {
        throw new Error(data.error || 'Could not regenerate item.');
      }
      onReplaceItem(item.id, data.item);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Regeneration failed.');
    } finally {
      setRegeneratingId(null);
    }
  };

  const passageItems = generatedItems.filter((i) => i.passageId === activePassage.id);

  return (
    <div className="space-y-6">
      <section className="studio-card p-6 space-y-5">
        <div className="border-b border-[#EAE1D2] pb-4">
          <div className="text-xs font-mono text-[#434D7B] font-medium">
            Florida B.E.S.T. Item Specifications · Grades K–5 (FAST 3–5 &amp; Star K–2)
          </div>
          <h1 className="text-2xl font-bold text-[#2D2A26] mt-1">
            Standards-Aligned Assessment Item Generator
          </h1>
          <p className="text-sm text-[#625D56] mt-1">
            Generate original assessment items measuring exact B.E.S.T. cognitive demands, complete with distractor rationales and paragraph-cited textual evidence.
          </p>
        </div>

        <form onSubmit={handleGenerate} className="space-y-5">
          {/* Target Passage */}
          <div>
            <label htmlFor="ig-passage" className="block text-xs font-semibold text-[#2D2A26] mb-1.5">
              Target Reading Passage
            </label>
            <select
              id="ig-passage"
              value={activePassage.id}
              onChange={(e) => {
                const found = passages.find((p) => p.id === e.target.value);
                if (found) {
                  onSelectPassage(found);
                  setChosenBenchmarks(found.alignedBenchmarks);
                }
              }}
              className="w-full px-3.5 py-2 text-sm bg-[#FFFDF9] border border-[#DFD5C5] text-[#2D2A26] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#155E63]/30"
            >
              {passages.map((p) => (
                <option key={p.id} value={p.id}>
                  {formatGradeLabel(p.grade)} · {p.title} ({p.textType})
                </option>
              ))}
            </select>
          </div>

          {/* Count & Rigor Pill Toggle Chips */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <div className="bg-[#FAF6F0] border border-[#E5DDD0] rounded-xl p-3.5 space-y-2">
              <div className="text-xs font-semibold text-[#2D2A26]">Number of Items (1–8)</div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Number of Items">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setCount(n)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                      count === n
                        ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63] shadow-sm'
                        : 'bg-[#FFFDF9] text-[#625D56] border-[#DFD5C5] hover:bg-[#F5EFE6] hover:text-[#2D2A26]'
                    }`}
                  >
                    {n} {n === 1 ? 'Item' : 'Items'}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-[#FAF6F0] border border-[#E5DDD0] rounded-xl p-3.5 space-y-2">
              <div className="text-xs font-semibold text-[#2D2A26]">Cognitive Rigor (DOK)</div>
              <div className="flex flex-wrap gap-1.5" role="group" aria-label="Cognitive Rigor">
                {[
                  { value: 'Foundational' as const, label: 'Foundational (DOK 1–2)' },
                  { value: 'On-Grade-Level' as const, label: 'On-Grade-Level (DOK 2–3)' },
                  { value: 'Advanced' as const, label: 'Advanced / Multi-Step (DOK 3)' },
                ].map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => setRigor(opt.value)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors cursor-pointer ${
                      rigor === opt.value
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

          {/* FAST Item Types */}
          <div>
            <div className="text-xs font-semibold text-[#2D2A26] mb-2">
              FAST ELA Reading Item Formats
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {ALL_ITEM_TYPES.map((type) => {
                const active = itemTypes.includes(type);
                const info = FAST_ITEM_TYPE_INFO[type];
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => toggleItemType(type)}
                    aria-pressed={active}
                    className={`text-left p-3 rounded-2xl border transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63] shadow-sm'
                        : 'bg-[#FAF6F0] text-[#2D2A26] border-[#DFD5C5] hover:bg-[#F5EFE6]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-semibold">{info.shortLabel}</span>
                      {active && <Check className="w-3.5 h-3.5 shrink-0" />}
                    </div>
                    <div
                      className={`text-[11px] mt-1 leading-snug ${
                        active ? 'text-[#DCECED]' : 'text-[#625D56]'
                      }`}
                    >
                      {info.label}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Benchmarks Multi-Select for Grade */}
          <div>
            <div className="flex items-center justify-between gap-2 mb-2">
              <span className="text-xs font-semibold text-[#2D2A26]">
                Target {formatGradeLabel(activePassage.grade)} Florida B.E.S.T. Benchmarks ({chosenBenchmarks.length} selected)
              </span>
              <button
                type="button"
                onClick={() => setChosenBenchmarks(activePassage.alignedBenchmarks)}
                className="text-xs font-semibold text-[#155E63] hover:underline cursor-pointer"
              >
                Use Passage Aligned Benchmarks
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2.5 max-h-56 overflow-y-auto p-1">
              {gradeBenchmarks.map((b) => {
                const checked = chosenBenchmarks.includes(b.code);
                return (
                  <label
                    key={b.code}
                    className={`flex items-start gap-2.5 p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                      checked
                        ? 'bg-[#EEF6F6] border-[#155E63]'
                        : 'bg-[#FFFDF9] border-[#E5DDD0] hover:bg-[#FAF6F0]'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleBenchmark(b.code)}
                      className="mt-0.5 rounded border-[#DFD5C5] text-[#155E63]"
                    />
                    <div className="min-w-0 space-y-1">
                      <span className={STANDARD_CODE_PILL}>{b.code}</span>
                      <div className="text-[#2D2A26] font-semibold">{b.benchmarkTitle}</div>
                      <div className="text-[11px] text-[#625D56] line-clamp-2">
                        {b.officialText}
                      </div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {compatibilityNotices.length > 0 && (
            <div className="bg-[#FDF8EC] border border-[#E9D7AD] rounded-xl p-3 text-xs text-[#694A18] space-y-1">
              <div className="font-semibold flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-[#B45309]" />
                Assessment Alignment Advisory
              </div>
              {compatibilityNotices.map((n, i) => (
                <p key={i}>{n}</p>
              ))}
            </div>
          )}

          {errorMsg && (
            <div role="alert" className="bg-[#FDF1EE] border border-[#F5C6BD] text-[#9C382A] text-xs rounded-xl p-3">
              {errorMsg}
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
            <div className="text-xs text-[#625D56]">
              All items include official verbatim benchmark citation, DOK tag, and distractor rationales.
            </div>
            <button
              type="submit"
              disabled={isGenerating}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#E05A47] text-[#FFFDF9] text-sm font-semibold rounded-xl hover:bg-[#C84836] shadow-sm disabled:opacity-60 cursor-pointer whitespace-nowrap transition-colors"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Generating FAST Items...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate {count} Assessment Items
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      {/* Generated / Active Passage Items Preview */}
      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-semibold text-[#2D2A26]">
              Items for &ldquo;{activePassage.title}&rdquo; ({passageItems.length})
            </h2>
            <p className="text-xs text-[#625D56]">
              Review stems, distractors, and evidence before adding to Assessment Builder.
            </p>
          </div>
          {passageItems.length > 0 && (
            <button
              type="button"
              onClick={() => {
                onAddItemsToBuilder(passageItems);
                setAddedFeedback(true);
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#155E63] text-[#FFFDF9] text-xs font-semibold rounded-xl hover:bg-[#0F4C50] shadow-sm cursor-pointer whitespace-nowrap transition-colors"
            >
              {addedFeedback ? <Check className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
              {addedFeedback ? 'Added to Builder' : 'Load Passage & Items into Builder'}
            </button>
          )}
        </div>

        {passageItems.length === 0 ? (
          <div className="studio-card p-8 text-center text-sm text-[#625D56]">
            No items linked to this passage yet. Configure your benchmarks above and click Generate Assessment Items.
          </div>
        ) : (
          <div className="space-y-4">
            {passageItems.map((item, idx) => {
              const bench = BENCHMARKS_BY_CODE[item.benchmarkCode];
              return (
                <article
                  key={item.id}
                  className="studio-card p-5 space-y-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#EAE1D2] pb-3">
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-[#625D56]">
                        <span className="font-mono font-semibold text-[#2D2A26]">
                          Item {idx + 1}
                        </span>
                        <span aria-hidden="true">·</span>
                        <span>{FAST_ITEM_TYPE_INFO[item.itemType].label}</span>
                        <span className={STANDARD_CODE_PILL}>{item.benchmarkCode}</span>
                        <span className="font-mono">
                          DOK {item.dok} · {item.cognitiveRigor}
                        </span>
                      </div>
                      <div className="text-xs text-[#625D56]">
                        Skill: <span className="font-semibold text-[#2D2A26]">{item.cognitiveSkill}</span>
                        {bench ? ` — "${bench.officialText}"` : ''}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={regeneratingId === item.id}
                      onClick={() => handleRegenerateSingle(item)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#FDF1EE] border border-[#F5C6BD] text-[#C84836] rounded-full hover:bg-[#FAE2DC] cursor-pointer whitespace-nowrap shrink-0 transition-colors"
                    >
                      <RefreshCw
                        className={`w-3.5 h-3.5 ${regeneratingId === item.id ? 'animate-spin' : ''}`}
                      />
                      Regenerate Item
                    </button>
                  </div>

                  <p className="font-student text-[15px] font-medium text-[#2D2A26]">{item.prompt}</p>

                  {/* Options / TEI rendering */}
                  {item.options && (
                    <ul className="space-y-2 text-xs">
                      {item.options.map((opt) => (
                        <li
                          key={opt.id}
                          className={`p-3 rounded-xl border ${
                            opt.isCorrect
                              ? 'bg-[#E9F3EC] border-[#C3DFCB]'
                              : 'bg-[#FAF6F0] border-[#E5DDD0]'
                          }`}
                        >
                          <div className="font-medium text-[#2D2A26]">
                            <span className="font-mono font-semibold mr-2">{opt.label}.</span>
                            {opt.text}{' '}
                            {opt.isCorrect && (
                              <span className="font-mono text-[#245436] font-semibold ml-1">
                                [Correct]
                              </span>
                            )}
                          </div>
                          <div className="text-[#625D56] mt-1">{opt.rationale}</div>
                        </li>
                      ))}
                    </ul>
                  )}

                  {item.itemType === 'ebsr' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      <div className="space-y-2">
                        <div className="font-semibold text-[#2D2A26]">{item.partAPrompt}</div>
                        {(item.partAOptions ?? []).map((opt) => (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-xl border ${
                              opt.isCorrect
                                ? 'bg-[#E9F3EC] border-[#C3DFCB]'
                                : 'bg-[#FAF6F0] border-[#E5DDD0]'
                            }`}
                          >
                            <span className="font-mono font-semibold mr-1.5">{opt.label}.</span>
                            {opt.text}
                            <div className="text-[#625D56] mt-1">{opt.rationale}</div>
                          </div>
                        ))}
                      </div>
                      <div className="space-y-2">
                        <div className="font-semibold text-[#2D2A26]">{item.partBPrompt}</div>
                        {(item.partBOptions ?? []).map((opt) => (
                          <div
                            key={opt.id}
                            className={`p-2.5 rounded-xl border ${
                              opt.isCorrect
                                ? 'bg-[#E9F3EC] border-[#C3DFCB]'
                                : 'bg-[#FAF6F0] border-[#E5DDD0]'
                            }`}
                          >
                            <span className="font-mono font-semibold mr-1.5">{opt.label}.</span>
                            {opt.text}
                            <div className="text-[#625D56] mt-1">{opt.rationale}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {item.hotTextSegments && (
                    <div className="space-y-2 text-xs">
                      {item.hotTextSegments.map((seg) => (
                        <div
                          key={seg.id}
                          className={`p-2.5 rounded-xl border ${
                            seg.isCorrect
                              ? 'bg-[#E9F3EC] border-[#C3DFCB]'
                              : 'bg-[#FAF6F0] border-[#E5DDD0]'
                          }`}
                        >
                          <div className="font-medium text-[#2D2A26]">
                            <span className="font-mono text-[#625D56] mr-2">[P{seg.paragraphRef}]</span>
                            &ldquo;{seg.text}&rdquo;
                            {seg.isCorrect && (
                              <span className="font-mono text-[#245436] font-semibold ml-2">
                                [Target Evidence]
                              </span>
                            )}
                          </div>
                          <div className="text-[#625D56] mt-1">{seg.rationale}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {item.tableMatch && (
                    <div className="overflow-x-auto text-xs">
                      <table className="w-full border-collapse border border-[#DFD5C5]">
                        <thead>
                          <tr className="bg-[#F5EFE6]">
                            <th className="p-2 text-left border border-[#DFD5C5] text-[#2D2A26]">Statement</th>
                            {item.tableMatch.columns.map((c) => (
                              <th key={c.id} className="p-2 text-center border border-[#DFD5C5] text-[#2D2A26]">
                                {c.label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {item.tableMatch.rows.map((r) => (
                            <tr key={r.id}>
                              <td className="p-2 border border-[#DFD5C5]">
                                <div className="font-medium text-[#2D2A26]">{r.statement}</div>
                                <div className="text-[#625D56] mt-0.5">{r.rationale}</div>
                              </td>
                              {item.tableMatch!.columns.map((c) => (
                                <td
                                  key={c.id}
                                  className="p-2 text-center border border-[#DFD5C5] font-mono text-[#155E63]"
                                >
                                  {r.correctColumnIds.includes(c.id) ? '✓' : '—'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Evidence & Citation Footer (Coach Indigo) */}
                  <div className="bg-[#EEF0F8] border border-[#D0D6EA] rounded-xl p-3.5 text-xs space-y-1.5">
                    <div>
                      <span className="font-semibold text-[#434D7B]">Correct Rationale: </span>
                      <span className="text-[#2D2A26]">{item.correctRationale}</span>
                    </div>
                    <div>
                      <span className="font-semibold text-[#434D7B]">
                        Textual Evidence (Paragraph {item.evidenceParagraphRef}):{' '}
                      </span>
                      <span className="text-[#2D2A26] italic">
                        &ldquo;{item.textualEvidenceQuote}&rdquo;
                      </span>
                    </div>
                    <div className="text-[11px] text-[#625D56]">{item.sourceCitation}</div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

