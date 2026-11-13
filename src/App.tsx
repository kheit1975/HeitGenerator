import { useEffect, useMemo, useState } from 'react';
import {
  Archive,
  BarChart3,
  BookMarked,
  BookOpen,
  Clock,
  FileText,
  LayoutDashboard,
  ListChecks,
  Menu,
  Search,
  Wrench,
  X,
} from 'lucide-react';
import { formatGradeLabel } from './data/floridaStandards.ts';
import { SEED_ASSESSMENTS, SEED_ATTEMPTS, SEED_ITEMS, SEED_PASSAGES } from './data/seedData.ts';
import { HomeDashboard, type StudioSection } from './components/HomeDashboard.tsx';
import { StandardsExplorer } from './components/StandardsExplorer.tsx';
import { PassageGenerator } from './components/PassageGenerator.tsx';
import { ItemGenerator } from './components/ItemGenerator.tsx';
import { BellringerGenerator } from './components/BellringerGenerator.tsx';
import { AssessmentBuilder } from './components/AssessmentBuilder.tsx';
import { AssessmentResults } from './components/AssessmentResults.tsx';
import { SavedBank } from './components/SavedBank.tsx';
import { OfficialResources } from './components/OfficialResources.tsx';
import type {
  AssessmentItem,
  GradeLevel,
  ReadingPassage,
  SavedAssessment,
  WorkspaceState,
} from './types/ela.ts';

interface NavItem {
  id: StudioSection;
  label: string;
  icon: typeof LayoutDashboard;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'standards', label: 'Standards Explorer', icon: Search },
  { id: 'passage', label: 'Passage Generator', icon: FileText },
  { id: 'items', label: 'Item Generator', icon: ListChecks },
  { id: 'bellringer', label: 'Bellringer Generator', icon: Clock },
  { id: 'builder', label: 'Assessment Builder', icon: Wrench },
  { id: 'results', label: 'Assessment Results', icon: BarChart3 },
  { id: 'bank', label: 'Saved Bank', icon: Archive },
  { id: 'resources', label: 'Official Resources', icon: BookOpen },
];

export default function App() {
  const [section, setSection] = useState<StudioSection>('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [workspace, setWorkspace] = useState<WorkspaceState>({
    passages: SEED_PASSAGES,
    items: SEED_ITEMS,
    assessments: SEED_ASSESSMENTS,
    attempts: SEED_ATTEMPTS,
  });

  const [selectedGrade, setSelectedGrade] = useState<GradeLevel>('4');
  const [standardsGradeFilter, setStandardsGradeFilter] = useState<GradeLevel | 'ALL'>('4');
  const [selectedBenchmarkCodes, setSelectedBenchmarkCodes] = useState<string[]>([
    'ELA.4.R.2.2',
    'ELA.4.R.3.3',
  ]);

  const [activePassageId, setActivePassageId] = useState<string>(SEED_PASSAGES[0].id);
  const [activeAssessmentId, setActiveAssessmentId] = useState<string>(SEED_ASSESSMENTS[0].id);
  const [draftAssessment, setDraftAssessment] = useState<SavedAssessment>(SEED_ASSESSMENTS[0]);
  const [generatedItemsBatch, setGeneratedItemsBatch] = useState<AssessmentItem[]>(
    SEED_ASSESSMENTS[0].items
  );

  // Load persisted workspace on startup
  useEffect(() => {
    let active = true;
    fetch('/api/workspace')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: WorkspaceState | null) => {
        if (!active || !data) return;
        setWorkspace(data);
        if (data.passages[0]) {
          setActivePassageId((prev) =>
            data.passages.some((p) => p.id === prev) ? prev : data.passages[0].id
          );
        }
        if (data.assessments[0]) {
          setActiveAssessmentId((prev) =>
            data.assessments.some((a) => a.id === prev) ? prev : data.assessments[0].id
          );
        }
      })
      .catch(() => {
        // Fallback to seed state if offline
      });
    return () => {
      active = false;
    };
  }, []);

  const activePassage = useMemo(
    () =>
      workspace.passages.find((p) => p.id === activePassageId) ??
      workspace.passages[0] ??
      SEED_PASSAGES[0],
    [workspace.passages, activePassageId]
  );

  const navigateTo = (target: StudioSection) => {
    setSection(target);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectGrade = (grade: GradeLevel) => {
    setSelectedGrade(grade);
    setStandardsGradeFilter(grade);
  };

  const handleToggleBenchmark = (code: string) => {
    setSelectedBenchmarkCodes((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  const handlePassageCreated = (passage: ReadingPassage) => {
    setWorkspace((prev) => ({
      ...prev,
      passages: [passage, ...prev.passages.filter((p) => p.id !== passage.id)],
    }));
    setActivePassageId(passage.id);
    setSelectedGrade(passage.grade);
  };

  const handleSelectActivePassage = (passage: ReadingPassage) => {
    setActivePassageId(passage.id);
    setSelectedGrade(passage.grade);
  };

  const handleGoToItemGenerator = (passage: ReadingPassage) => {
    setActivePassageId(passage.id);
    setSelectedBenchmarkCodes(passage.alignedBenchmarks);
    setGeneratedItemsBatch(workspace.items.filter((i) => i.passageId === passage.id));
    navigateTo('items');
  };

  const handleItemsGenerated = (newItems: AssessmentItem[]) => {
    setGeneratedItemsBatch(newItems);
    setWorkspace((prev) => {
      const existingIds = new Set(newItems.map((i) => i.id));
      return {
        ...prev,
        items: [...newItems, ...prev.items.filter((i) => !existingIds.has(i.id))],
      };
    });
  };

  const handleReplaceGeneratedItem = (oldId: string, updated: AssessmentItem) => {
    setGeneratedItemsBatch((prev) => prev.map((i) => (i.id === oldId ? updated : i)));
    setWorkspace((prev) => ({
      ...prev,
      items: prev.items.map((i) => (i.id === oldId ? updated : i)),
    }));
  };

  const handleAddItemsToBuilder = (itemsToAdd: AssessmentItem[]) => {
    const newId =
      draftAssessment.passage.id === activePassage.id
        ? draftAssessment.id
        : `assess-${Date.now()}`;
    const existingItemIds = new Set(
      draftAssessment.passage.id === activePassage.id
        ? draftAssessment.items.map((i) => i.id)
        : []
    );
    const mergedItems =
      draftAssessment.passage.id === activePassage.id
        ? [
            ...draftAssessment.items,
            ...itemsToAdd.filter((i) => !existingItemIds.has(i.id)),
          ]
        : itemsToAdd;

    const nextDraft: SavedAssessment = {
      id: newId,
      title:
        draftAssessment.passage.id === activePassage.id
          ? draftAssessment.title
          : `${activePassage.title} — Practice Assessment`,
      unitTag:
        draftAssessment.passage.id === activePassage.id
          ? draftAssessment.unitTag
          : `${formatGradeLabel(activePassage.grade)} Reading`,
      grade: activePassage.grade,
      passage: activePassage,
      items: mergedItems,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setDraftAssessment(nextDraft);
    navigateTo('builder');
  };

  const handleOpenAssessmentInBuilder = (id: string) => {
    const found = workspace.assessments.find((a) => a.id === id);
    if (!found) return;
    setActiveAssessmentId(found.id);
    setDraftAssessment(found);
    setActivePassageId(found.passage.id);
    navigateTo('builder');
  };

  const handleSaveAssessment = async (assessmentToSave: SavedAssessment) => {
    const res = await fetch('/api/workspace/assessments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ assessment: assessmentToSave }),
    });
    if (!res.ok) {
      throw new Error('Failed to save assessment to workspace.');
    }
    const data = (await res.json()) as {
      assessment: SavedAssessment;
      state: WorkspaceState;
    };
    setWorkspace(data.state);
    setDraftAssessment(data.assessment);
    setActiveAssessmentId(data.assessment.id);
  };

  const handleDeleteAssessment = async (id: string) => {
    const res = await fetch(`/api/workspace/assessments/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const state = (await res.json()) as WorkspaceState;
      setWorkspace(state);
      if (activeAssessmentId === id && state.assessments[0]) {
        setActiveAssessmentId(state.assessments[0].id);
      }
    }
  };

  const handleDeletePassage = async (id: string) => {
    const res = await fetch(`/api/workspace/passages/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const state = (await res.json()) as WorkspaceState;
      setWorkspace(state);
      if (activePassageId === id && state.passages[0]) {
        setActivePassageId(state.passages[0].id);
      }
    }
  };

  const handleDeleteItem = async (id: string) => {
    const res = await fetch(`/api/workspace/items/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      const state = (await res.json()) as WorkspaceState;
      setWorkspace(state);
    }
  };

  const currentNavLabel = NAV_ITEMS.find((n) => n.id === section)?.label ?? 'Dashboard';

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-[#2D2A26] flex flex-col lg:flex-row">
      {/* Desktop Left Studio Rail — Soft Warm Sand */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-[#F2ECE1] text-[#2D2A26] border-r border-[#E2D8C8] print:hidden">
        <div className="p-5 border-b border-[#E2D8C8]">
          <button
            type="button"
            onClick={() => navigateTo('dashboard')}
            className="text-left space-y-1.5 cursor-pointer w-full group"
          >
            <div className="flex items-center gap-2 text-xs font-mono font-medium text-[#434D7B]">
              <span className="w-7 h-7 rounded-lg bg-[#155E63] text-[#FFFDF9] inline-flex items-center justify-center shadow-xs">
                <BookMarked className="w-4 h-4 shrink-0" />
              </span>
              <span>FDOE B.E.S.T. Studio</span>
            </div>
            <div className="text-lg font-display font-bold leading-snug tracking-tight text-[#2D2A26] group-hover:text-[#155E63] transition-colors">
              Florida ELA Assessment Studio
            </div>
          </button>
        </div>

        <nav aria-label="Studio Sections" className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = section === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => navigateTo(item.id)}
                aria-current={active ? 'page' : undefined}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-display font-medium rounded-xl transition-all cursor-pointer text-left ${
                  active
                    ? 'bg-[#155E63] text-[#FFFDF9] font-semibold shadow-sm'
                    : 'text-[#4A453E] hover:bg-[#E8DFD0] hover:text-[#2D2A26]'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#FFFDF9]' : 'text-[#625D56]'}`} />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#E2D8C8] bg-[#ECE4D6]/60 text-xs text-[#625D56] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span>Active Grade</span>
            <span className="px-2 py-0.5 rounded-full bg-[#FFFDF9] border border-[#E2D8C8] font-mono font-semibold text-[#155E63]">
              {formatGradeLabel(selectedGrade)}
            </span>
          </div>
          <div className="flex items-center justify-between gap-2">
            <span>Coach Benchmarks</span>
            <span className="px-2 py-0.5 rounded-full bg-[#EEF0F8] border border-[#D0D6EA] font-mono font-semibold text-[#434D7B] tabular-nums">
              {selectedBenchmarkCodes.length}
            </span>
          </div>
        </div>
      </aside>

      {/* Mobile Top Header & Drawer */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#F2ECE1] text-[#2D2A26] border-b border-[#E2D8C8] px-4 py-3 flex items-center justify-between gap-3 print:hidden">
        <div className="min-w-0">
          <div className="text-[11px] font-mono font-medium text-[#434D7B] truncate">
            Florida ELA Assessment Studio
          </div>
          <div className="text-sm font-display font-bold truncate text-[#2D2A26]">
            {currentNavLabel}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen((prev) => !prev)}
          aria-label={mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'}
          aria-expanded={mobileMenuOpen}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-[#FFFDF9] border border-[#DFD5C5] text-[#155E63] hover:bg-[#FAF6F0] rounded-full cursor-pointer whitespace-nowrap shrink-0 shadow-xs"
        >
          {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Menu</span>
        </button>
      </header>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-40 flex print:hidden">
          <div
            className="fixed inset-0 bg-[#2D2A26]/35 backdrop-blur-[1px]"
            onClick={() => setMobileMenuOpen(false)}
          />
          <nav
            aria-label="Mobile Studio Navigation"
            className="relative z-50 w-72 max-w-[85vw] bg-[#F2ECE1] text-[#2D2A26] h-full overflow-y-auto p-4 space-y-1.5 shadow-xl border-r border-[#E2D8C8]"
          >
            <div className="flex items-center justify-between border-b border-[#E2D8C8] pb-3 mb-2">
              <div className="text-sm font-display font-bold text-[#155E63]">Studio Navigation</div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                aria-label="Close menu"
                className="p-1 text-[#625D56] hover:text-[#2D2A26] cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {NAV_ITEMS.map((item) => {
              const Icon = item.icon;
              const active = section === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navigateTo(item.id)}
                  aria-current={active ? 'page' : undefined}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 text-sm font-display font-medium rounded-xl cursor-pointer text-left ${
                    active
                      ? 'bg-[#155E63] text-[#FFFDF9] font-semibold shadow-sm'
                      : 'text-[#4A453E] hover:bg-[#E8DFD0]'
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* Main Content Workspace */}
      <main className="flex-1 lg:pl-64 min-w-0">
        {/* Slim Tactile Context Bar on Desktop */}
        <div className="hidden lg:flex items-center justify-between gap-4 bg-[#FFFDF9]/90 backdrop-blur-xs border-b border-[#E5DDD0] px-8 py-3 text-xs text-[#625D56] print:hidden">
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-display font-bold text-[#155E63] text-sm shrink-0">
              {currentNavLabel}
            </span>
            <span aria-hidden="true" className="text-[#C9BFA9]">·</span>
            <span className="truncate">
              Active Passage: <span className="font-medium text-[#2D2A26]">{activePassage.title}</span>
            </span>
          </div>
          <div
            className="flex items-center gap-1.5 shrink-0"
            role="group"
            aria-label="Active workspace grade level"
          >
            <span className="text-xs font-semibold text-[#625D56] mr-1">Grade:</span>
            {(['K', '1', '2', '3', '4', '5'] as GradeLevel[]).map((g) => {
              const active = selectedGrade === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => handleSelectGrade(g)}
                  aria-pressed={active}
                  className={`px-3 py-1 text-xs font-semibold rounded-full border transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#155E63] text-[#FFFDF9] border-[#155E63] shadow-xs'
                      : 'bg-[#FAF6F0] text-[#4A453E] border-[#DFD5C5] hover:bg-[#F2ECE1] hover:border-[#CFC3AE]'
                  }`}
                >
                  {g === 'K' ? 'K' : `Gr ${g}`}
                </button>
              );
            })}
          </div>
        </div>

        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {section === 'dashboard' && (
            <HomeDashboard
              assessments={workspace.assessments}
              attempts={workspace.attempts}
              selectedGrade={selectedGrade}
              onSelectGrade={handleSelectGrade}
              onNavigate={navigateTo}
              onOpenAssessmentInBuilder={handleOpenAssessmentInBuilder}
            />
          )}

          {section === 'standards' && (
            <StandardsExplorer
              selectedGrade={standardsGradeFilter}
              onChangeGrade={(g) => {
                setStandardsGradeFilter(g);
                if (g !== 'ALL') setSelectedGrade(g);
              }}
              selectedBenchmarkCodes={selectedBenchmarkCodes}
              onToggleBenchmark={handleToggleBenchmark}
              onClearBenchmarks={() => setSelectedBenchmarkCodes([])}
              onSendToPassageGenerator={() => navigateTo('passage')}
              onSendToItemGenerator={() => navigateTo('items')}
            />
          )}

          {section === 'passage' && (
            <PassageGenerator
              activePassage={activePassage}
              allPassages={workspace.passages}
              selectedGrade={selectedGrade}
              selectedBenchmarkCodes={selectedBenchmarkCodes}
              onSelectGrade={handleSelectGrade}
              onSelectActivePassage={handleSelectActivePassage}
              onPassageCreated={handlePassageCreated}
              onGoToItemGenerator={handleGoToItemGenerator}
            />
          )}

          {section === 'items' && (
            <ItemGenerator
              passages={workspace.passages}
              activePassage={activePassage}
              selectedBenchmarkCodes={selectedBenchmarkCodes}
              generatedItems={generatedItemsBatch}
              onSelectPassage={handleSelectActivePassage}
              onItemsGenerated={handleItemsGenerated}
              onReplaceItem={handleReplaceGeneratedItem}
              onAddItemsToBuilder={handleAddItemsToBuilder}
            />
          )}

          {section === 'bellringer' && <BellringerGenerator initialGrade={selectedGrade} />}

          {section === 'builder' && (
            <AssessmentBuilder
              assessment={draftAssessment}
              onUpdateAssessment={setDraftAssessment}
              onSaveAssessment={handleSaveAssessment}
            />
          )}

          {section === 'results' && (
            <AssessmentResults
              attempts={workspace.attempts}
              assessments={workspace.assessments}
            />
          )}

          {section === 'bank' && (
            <SavedBank
              assessments={workspace.assessments}
              passages={workspace.passages}
              items={workspace.items}
              onOpenAssessmentInBuilder={handleOpenAssessmentInBuilder}
              onOpenPassageInGenerator={(p) => {
                handleSelectActivePassage(p);
                navigateTo('passage');
              }}
              onDeleteAssessment={handleDeleteAssessment}
              onDeletePassage={handleDeletePassage}
              onDeleteItem={handleDeleteItem}
            />
          )}

          {section === 'resources' && <OfficialResources />}
        </div>
      </main>
    </div>
  );
}
