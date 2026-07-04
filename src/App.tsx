import { useState } from 'react';
import { ProjectProvider, useProject } from './state/ProjectContext';
import { emptyQuest } from './types/quest';
import { QuestEditor } from './panels/QuestEditor';
import { ActionsPanel } from './panels/ActionsPanel';
import { ConditionsPanel } from './panels/ConditionsPanel';
import { NpcRegistryPanel } from './panels/NpcRegistryPanel';
import { ExportPanel } from './panels/ExportPanel';
import { Button, EmptyState } from './components/ui';
import type { SyncStatus } from './state/ProjectContext';

const STATUS_LABEL: Record<SyncStatus, { text: string; className: string }> = {
  loading: { text: '● Conectando…', className: 'text-ink-faint' },
  synced: { text: '● Sincronizado', className: 'text-emerald' },
  saving: { text: '● Guardando…', className: 'text-copper' },
  offline: { text: '● Local (sin Supabase)', className: 'text-ink-faint' },
  error: { text: '● Error de sync', className: 'text-redstone' },
};

function SyncBadge() {
  const { status } = useProject();
  const s = STATUS_LABEL[status];
  return <span className={`text-[10px] font-mono ${s.className}`}>{s.text}</span>;
}

type View = 'quests' | 'actions' | 'conditions' | 'npcs' | 'export';

const NAV: { key: View; label: string }[] = [
  { key: 'quests', label: 'Quests' },
  { key: 'actions', label: 'Actions' },
  { key: 'conditions', label: 'Conditions' },
  { key: 'npcs', label: 'NPCs' },
  { key: 'export', label: 'Exportar / Importar' },
];

function QuestsView() {
  const { project, setProject } = useProject();
  const [selectedId, setSelectedId] = useState<string | null>(project.quests[0]?.id ?? null);
  const selected = project.quests.find((q) => q.id === selectedId) ?? null;

  function addQuest() {
    let id = 'nueva-quest';
    let n = 1;
    while (project.quests.some((q) => q.id === id)) {
      id = `nueva-quest-${n++}`;
    }
    const q = emptyQuest(id);
    setProject((p) => ({ ...p, quests: [...p.quests, q] }));
    setSelectedId(q.id);
  }

  function duplicateQuest(id: string) {
    const q = project.quests.find((x) => x.id === id);
    if (!q) return;
    let newId = `${id}-copia`;
    let n = 1;
    while (project.quests.some((x) => x.id === newId)) {
      newId = `${id}-copia-${n++}`;
    }
    const clone = JSON.parse(JSON.stringify(q));
    clone.id = newId;
    setProject((p) => ({ ...p, quests: [...p.quests, clone] }));
    setSelectedId(newId);
  }

  function removeQuest(id: string) {
    setProject((p) => ({ ...p, quests: p.quests.filter((q) => q.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full">
      <div className="w-full md:w-64 md:shrink-0 space-y-2">
        <Button variant="primary" onClick={addQuest} className="w-full">
          + Nueva quest
        </Button>
        <div className="border border-line rounded-lg divide-y divide-line-soft overflow-hidden max-h-56 md:max-h-[calc(100vh-9rem)] overflow-y-auto">
          {project.quests.map((q) => (
            <div
              key={q.id}
              className={`group px-3 py-2 flex items-center justify-between cursor-pointer ${
                q.id === selectedId ? 'bg-copper/20' : 'hover:bg-panel-raised'
              }`}
              onClick={() => setSelectedId(q.id)}
            >
              <div className="min-w-0">
                <div className={`text-sm truncate ${q.id === selectedId ? 'text-copper' : 'text-ink'}`}>
                  {q.name || '(sin nombre)'}
                </div>
                <div className="text-[11px] text-ink-faint font-mono truncate">{q.id}</div>
              </div>
              <div className="flex md:hidden md:group-hover:flex gap-1 shrink-0 ml-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    duplicateQuest(q.id);
                  }}
                  title="Duplicar"
                  className="text-ink-faint hover:text-ink text-xs px-1"
                >
                  ⧉
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    removeQuest(q.id);
                  }}
                  title="Eliminar"
                  className="text-ink-faint hover:text-redstone text-xs px-1"
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="flex-1 min-w-0 md:overflow-y-auto md:max-h-[calc(100vh-6rem)] pr-0 md:pr-1">
        {selected ? (
          <QuestEditor key={selected.id} quest={selected} />
        ) : (
          <EmptyState message="Elegí una quest de la lista o creá una nueva para empezar." />
        )}
      </div>
    </div>
  );
}

function Shell() {
  const [view, setView] = useState<View>('quests');
  const [navOpen, setNavOpen] = useState(false);

  function selectView(v: View) {
    setView(v);
    setNavOpen(false);
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Top bar solo en mobile */}
      <div className="md:hidden flex items-center justify-between px-4 py-3 border-b border-line bg-panel/40">
        <div>
          <div className="font-display text-sm font-semibold text-ink tracking-tight">
            QUEST<span className="text-copper">FORGE</span>
          </div>
          <SyncBadge />
        </div>
        <button
          onClick={() => setNavOpen(!navOpen)}
          className="text-ink-dim border border-line rounded-md px-3 py-1.5 text-sm"
        >
          {NAV.find((n) => n.key === view)?.label} ▾
        </button>
      </div>
      {navOpen && (
        <nav className="md:hidden border-b border-line bg-panel/60">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => selectView(n.key)}
              className={`w-full text-left px-4 py-3 text-sm font-mono border-l-2 ${
                view === n.key
                  ? 'border-copper text-copper bg-copper/10'
                  : 'border-transparent text-ink-dim'
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>
      )}

      {/* Sidebar fija solo en desktop (md+) */}
      <aside className="hidden md:flex w-52 shrink-0 border-r border-line bg-panel/40 flex-col">
        <div className="px-4 py-5 border-b border-line-soft">
          <div className="font-display text-sm font-semibold text-ink tracking-tight">
            QUEST<span className="text-copper">FORGE</span>
          </div>
          <div className="text-[10px] text-ink-faint mt-0.5 font-mono">PikaMug Quests editor</div>
          <div className="mt-1.5">
            <SyncBadge />
          </div>
        </div>
        <nav className="flex-1 py-3">
          {NAV.map((n) => (
            <button
              key={n.key}
              onClick={() => setView(n.key)}
              className={`w-full text-left px-4 py-2 text-sm font-mono transition-colors border-l-2 ${
                view === n.key
                  ? 'border-copper text-copper bg-copper/10'
                  : 'border-transparent text-ink-dim hover:text-ink hover:bg-panel-raised/60'
              }`}
            >
              {n.label}
            </button>
          ))}
        </nav>
        <div className="px-4 py-3 border-t border-line-soft text-[10px] text-ink-faint font-mono">
          MineLatino · RazorLR
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 md:p-6 overflow-hidden">
        {view === 'quests' && <QuestsView />}
        {view === 'actions' && <ActionsPanel />}
        {view === 'conditions' && <ConditionsPanel />}
        {view === 'npcs' && <NpcRegistryPanel />}
        {view === 'export' && (
          <div className="max-w-4xl md:overflow-y-auto md:max-h-[calc(100vh-6rem)] pr-1">
            <ExportPanel />
          </div>
        )}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ProjectProvider>
      <Shell />
    </ProjectProvider>
  );
}
