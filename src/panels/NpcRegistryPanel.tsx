import { useProject } from '../state/ProjectContext';
import { Button, EmptyState, Field, TextInput } from '../components/ui';
import { useState } from 'react';

export function NpcRegistryPanel() {
  const { project, setProject } = useProject();
  const [name, setName] = useState('');
  const [uuid, setUuid] = useState('');

  function add() {
    if (!name.trim() || !uuid.trim()) return;
    setProject((p) => ({
      ...p,
      npcs: [...p.npcs, { id: crypto.randomUUID(), name: name.trim(), uuid: uuid.trim() }],
    }));
    setName('');
    setUuid('');
  }

  function remove(id: string) {
    setProject((p) => ({ ...p, npcs: p.npcs.filter((n) => n.id !== id) }));
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <p className="text-sm text-ink-dim">
        Registrá acá los NPCs de Citizens que usás en tus quests (nombre + UUID). Este registro es
        solo local al editor — no se exporta a ningún YML, se usa para elegir NPCs por nombre en
        vez de tipear UUIDs a mano. Sacá el UUID con <code className="font-mono text-copper">/npc id</code> en tu server.
      </p>
      <div className="flex gap-2">
        <div className="flex-1">
          <Field label="Nombre">
            <TextInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Norvina" />
          </Field>
        </div>
        <div className="flex-1">
          <Field label="UUID">
            <TextInput
              value={uuid}
              onChange={(e) => setUuid(e.target.value)}
              placeholder="17f3d76a-b107-4674-95bb-33520537befd"
              className="font-mono text-xs"
            />
          </Field>
        </div>
        <div className="pt-6">
          <Button variant="primary" onClick={add}>
            + Agregar NPC
          </Button>
        </div>
      </div>

      {project.npcs.length === 0 ? (
        <EmptyState message="Todavía no registraste ningún NPC." />
      ) : (
        <div className="border border-line rounded-lg divide-y divide-line-soft overflow-hidden">
          {project.npcs.map((n) => (
            <div key={n.id} className="flex items-center justify-between px-4 py-2.5 bg-panel/60">
              <div>
                <div className="text-sm text-ink">{n.name}</div>
                <div className="text-xs text-ink-faint font-mono">{n.uuid}</div>
              </div>
              <button
                onClick={() => remove(n.id)}
                className="text-ink-faint hover:text-redstone text-sm px-2"
              >
                Eliminar
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
