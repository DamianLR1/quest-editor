import { useState } from 'react';
import { useProject } from '../state/ProjectContext';
import { emptyCondition, type QuestCondition } from '../types/quest';
import { Button, EmptyState, Field, NumberInput, TextInput, Toggle, TagListEditor } from '../components/ui';

export function ConditionsPanel() {
  const { project, setProject } = useProject();
  const [selectedId, setSelectedId] = useState<string | null>(project.conditions[0]?.id ?? null);
  const selected = project.conditions.find((c) => c.id === selectedId) ?? null;

  function addCondition() {
    const c = emptyCondition('nueva-condicion');
    setProject((p) => ({ ...p, conditions: [...p.conditions, c] }));
    setSelectedId(c.id);
  }

  function updateSelected(patch: Partial<QuestCondition>) {
    if (!selected) return;
    setProject((p) => ({
      ...p,
      conditions: p.conditions.map((c) => (c.id === selected.id ? { ...c, ...patch } : c)),
    }));
  }

  function remove(id: string) {
    setProject((p) => ({ ...p, conditions: p.conditions.filter((c) => c.id !== id) }));
    if (selectedId === id) setSelectedId(null);
  }

  return (
    <div className="flex flex-col md:flex-row gap-4 h-full">
      <div className="w-full md:w-56 md:shrink-0 space-y-2">
        <Button variant="primary" onClick={addCondition} className="w-full">
          + Nueva condition
        </Button>
        <div className="border border-line rounded-lg divide-y divide-line-soft overflow-y-auto max-h-40 md:max-h-none">
          {project.conditions.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={`w-full text-left px-3 py-2 text-sm font-mono truncate ${
                c.id === selectedId ? 'bg-copper/20 text-copper' : 'text-ink-dim hover:bg-panel-raised'
              }`}
            >
              {c.name || '(sin nombre)'}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 min-w-0">
        {!selected ? (
          <EmptyState message="Elegí una condition de la lista o creá una nueva." />
        ) : (
          <div className="space-y-3 max-w-2xl">
            <Field label="Nombre (key en conditions.yml)">
              <TextInput value={selected.name} onChange={(e) => updateSelected({ name: e.target.value })} className="font-mono" />
            </Field>
            <Toggle checked={selected.failQuest} onChange={(v) => updateSelected({ failQuest: v })} label="fail-quest" />
            <Field label="ride-entity" hint="EntityType vanilla"><TagListEditor values={selected.rideEntity} onChange={(v) => updateSelected({ rideEntity: v })} /></Field>
            <Field label="ride-npc-uuid"><TagListEditor values={selected.rideNpcUuid} onChange={(v) => updateSelected({ rideNpcUuid: v })} /></Field>
            <Field label="permission"><TagListEditor values={selected.permission} onChange={(v) => updateSelected({ permission: v })} /></Field>
            <Field label="stay-within-world"><TagListEditor values={selected.stayWithinWorld} onChange={(v) => updateSelected({ stayWithinWorld: v })} /></Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="stay-within-ticks.start"><NumberInput value={selected.stayWithinTicksStart} onChange={(v) => updateSelected({ stayWithinTicksStart: v })} /></Field>
              <Field label="stay-within-ticks.end"><NumberInput value={selected.stayWithinTicksEnd} onChange={(v) => updateSelected({ stayWithinTicksEnd: v })} /></Field>
            </div>
            <Field label="stay-within-biome"><TagListEditor values={selected.stayWithinBiome} onChange={(v) => updateSelected({ stayWithinBiome: v })} /></Field>
            <Field label="stay-within-region" hint="WorldGuard"><TagListEditor values={selected.stayWithinRegion} onChange={(v) => updateSelected({ stayWithinRegion: v })} /></Field>
            <div className="pt-2">
              <Button variant="danger" onClick={() => remove(selected.id)}>
                Eliminar condition
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
