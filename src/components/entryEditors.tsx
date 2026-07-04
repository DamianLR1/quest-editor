import type { BlockEntry, SimpleItem, NpcRef } from '../types/quest';
import { Button } from './ui';

function uid() {
  return crypto.randomUUID();
}

export function BlockListEditor({
  entries,
  onChange,
}: {
  entries: BlockEntry[];
  onChange: (v: BlockEntry[]) => void;
}) {
  function update(id: string, patch: Partial<BlockEntry>) {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function remove(id: string) {
    onChange(entries.filter((e) => e.id !== id));
  }
  function add() {
    onChange([...entries, { id: uid(), material: '', amount: 1, durability: 0 }]);
  }
  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div key={e.id} className="flex flex-wrap gap-2 items-center">
          <input
            value={e.material}
            onChange={(ev) => update(e.id, { material: ev.target.value.toUpperCase() })}
            placeholder="MATERIAL_ID"
            className="flex-1 min-w-[110px] font-mono text-xs"
          />
          <input
            type="number"
            value={e.amount}
            onChange={(ev) => update(e.id, { amount: Number(ev.target.value) })}
            placeholder="cant."
            className="w-20 text-xs"
          />
          <input
            type="number"
            value={e.durability}
            onChange={(ev) => update(e.id, { durability: Number(ev.target.value) })}
            placeholder="dur."
            title="Durability / metadata (0 = default)"
            className="w-20 text-xs"
          />
          <button
            onClick={() => remove(e.id)}
            className="text-ink-faint hover:text-redstone px-1"
            type="button"
          >
            ×
          </button>
        </div>
      ))}
      <Button variant="default" type="button" onClick={add}>
        + Bloque
      </Button>
    </div>
  );
}

export function SimpleItemListEditor({
  entries,
  onChange,
}: {
  entries: SimpleItem[];
  onChange: (v: SimpleItem[]) => void;
}) {
  function update(id: string, patch: Partial<SimpleItem>) {
    onChange(entries.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function remove(id: string) {
    onChange(entries.filter((e) => e.id !== id));
  }
  function add() {
    onChange([...entries, { id: uid(), material: '', amount: 1 }]);
  }
  return (
    <div className="space-y-2">
      {entries.map((e) => (
        <div key={e.id} className="flex flex-wrap gap-2 items-center">
          <input
            value={e.material}
            onChange={(ev) => update(e.id, { material: ev.target.value.toUpperCase() })}
            placeholder="MATERIAL_ID"
            className="flex-1 min-w-[110px] font-mono text-xs"
          />
          <input
            type="number"
            value={e.amount}
            onChange={(ev) => update(e.id, { amount: Number(ev.target.value) })}
            placeholder="cant."
            className="w-24 text-xs"
          />
          <button
            onClick={() => remove(e.id)}
            className="text-ink-faint hover:text-redstone px-1"
            type="button"
          >
            ×
          </button>
        </div>
      ))}
      <Button variant="default" type="button" onClick={add}>
        + Ítem
      </Button>
    </div>
  );
}

export function NpcSelect({
  value,
  onChange,
  npcs,
  allowAny,
}: {
  value: string;
  onChange: (v: string) => void;
  npcs: NpcRef[];
  allowAny?: boolean;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full">
      <option value="">— elegir NPC —</option>
      {allowAny && <option value="ANY">ANY (cualquier NPC)</option>}
      {npcs.map((n) => (
        <option key={n.id} value={n.uuid}>
          {n.name} — {n.uuid.slice(0, 8)}…
        </option>
      ))}
    </select>
  );
}
