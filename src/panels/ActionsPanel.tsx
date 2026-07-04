import { useState } from 'react';
import { useProject } from '../state/ProjectContext';
import { emptyAction, type QuestAction } from '../types/quest';
import { Button, EmptyState, Field, NumberInput, TextInput, Toggle } from '../components/ui';
import { TagListEditor } from '../components/ui';

export function ActionsPanel() {
  const { project, setProject } = useProject();
  const [selectedId, setSelectedId] = useState<string | null>(project.actions[0]?.id ?? null);
  const selected = project.actions.find((a) => a.id === selectedId) ?? null;

  function addAction() {
    const a = emptyAction('nueva-accion');
    setProject((p) => ({ ...p, actions: [...p.actions, a] }));
    setSelectedId(a.id);
  }

  function updateSelected(patch: Partial<QuestAction>) {
    if (!selected) return;
    setProject((p) => ({
      ...p,
      actions: p.actions.map((a) => (a.id === selected.id ? { ...a, ...patch } : a)),
    }));
  }

  function remove(id: string) {
    setProject((p) => ({ ...p, actions: p.actions.filter((a) => a.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full">
      <div className="w-full md:w-56 md:shrink-0 space-y-2">
        <Button variant="primary" onClick={addAction} className="w-full">
          + Nueva action
        </Button>
        <div className="border border-line rounded-lg divide-y divide-line-soft overflow-y-auto max-h-40 md:max-h-none">
          {project.actions.map((a) => (
            <button
              key={a.id}
              onClick={() => setSelectedId(a.id)}
              className={`w-full text-left px-3 py-2 text-sm font-mono truncate ${
                a.id === selectedId ? 'bg-copper/20 text-copper' : 'text-ink-dim hover:bg-panel-raised'
              }`}
            >
              {a.name || '(sin nombre)'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {!selected ? (
          <EmptyState message="Elegí una action de la lista o creá una nueva." />
        ) : (
          <div className="space-y-3 max-w-2xl">
            <Field label="Nombre (key en actions.yml)">
              <TextInput value={selected.name} onChange={(e) => updateSelected({ name: e.target.value })} className="font-mono" />
            </Field>
            <Field label="message"><TextInput value={selected.message} onChange={(e) => updateSelected({ message: e.target.value })} /></Field>
            <Field label="open-book"><TextInput value={selected.openBook} onChange={(e) => updateSelected({ openBook: e.target.value })} /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Toggle checked={selected.clearInventory} onChange={(v) => updateSelected({ clearInventory: v })} label="clear-inventory" />
              <Toggle checked={selected.failQuest} onChange={(v) => updateSelected({ failQuest: v })} label="fail-quest" />
              <Toggle checked={selected.cancelTimer} onChange={(v) => updateSelected({ cancelTimer: v })} label="cancel-timer" />
            </div>
            <Field label="commands"><TagListEditor values={selected.commands} onChange={(v) => updateSelected({ commands: v })} placeholder="tell <player> 42" /></Field>
            <Field label="teleport-location" hint='"world,x,y,z"'><TextInput value={selected.teleportLocation} onChange={(e) => updateSelected({ teleportLocation: e.target.value })} /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field label="hunger"><NumberInput value={selected.hunger} onChange={(v) => updateSelected({ hunger: v })} /></Field>
              <Field label="saturation"><NumberInput value={selected.saturation} onChange={(v) => updateSelected({ saturation: v })} /></Field>
              <Field label="health"><NumberInput value={selected.health} onChange={(v) => updateSelected({ health: v })} /></Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="timer (segundos)"><NumberInput value={selected.timer} onChange={(v) => updateSelected({ timer: v })} /></Field>
              <Field label="storm-duration"><NumberInput value={selected.stormDuration} onChange={(v) => updateSelected({ stormDuration: v })} /></Field>
            </div>
            <Field label="explosions" hint='"world,x,y,z"'><TagListEditor values={selected.explosions} onChange={(v) => updateSelected({ explosions: v })} /></Field>
            <Field label="lightning-strikes"><TagListEditor values={selected.lightningStrikes} onChange={(v) => updateSelected({ lightningStrikes: v })} /></Field>
            <div className="pt-2">
              <Button variant="danger" onClick={() => remove(selected.id)}>
                Eliminar action
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
