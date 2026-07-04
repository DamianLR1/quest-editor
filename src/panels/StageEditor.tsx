import type {
  Stage,
  NpcRef,
  CustomObjective,
  MMOItemsDeliverObjective,
  MythicMobsKillObjective,
  MythicMobsDeliverObjective,
} from '../types/quest';
import { Section, Field, NumberInput, TextInput, TextArea, Button } from '../components/ui';
import { BlockListEditor, SimpleItemListEditor, NpcSelect } from '../components/entryEditors';

function uid() {
  return crypto.randomUUID();
}

const BLOCK_GROUPS: { key: keyof Stage; label: string; hint: string }[] = [
  { key: 'breakBlocks', label: 'Romper bloques', hint: 'break-block-*' },
  { key: 'damageBlocks', label: 'Dañar bloques', hint: 'damage-block-*' },
  { key: 'placeBlocks', label: 'Colocar bloques', hint: 'place-block-*' },
  { key: 'useBlocks', label: 'Usar bloques', hint: 'use-block-*' },
  { key: 'cutBlocks', label: 'Cortar bloques', hint: 'cut-block-*' },
];

const ITEM_GROUPS: { key: keyof Stage; label: string }[] = [
  { key: 'itemsToCraft', label: 'Craftear' },
  { key: 'itemsToSmelt', label: 'Fundir (smelt)' },
  { key: 'itemsToEnchant', label: 'Encantar' },
  { key: 'itemsToBrew', label: 'Preparar poción (brew)' },
  { key: 'itemsToConsume', label: 'Consumir' },
];

export function StageEditor({
  stage,
  onChange,
  npcs,
  actionNames,
  conditionNames,
}: {
  stage: Stage;
  onChange: (s: Stage) => void;
  npcs: NpcRef[];
  actionNames: string[];
  conditionNames: string[];
}) {
  function patch(p: Partial<Stage>) {
    onChange({ ...stage, ...p });
  }

  return (
    <div className="space-y-3">
      {BLOCK_GROUPS.map((g) => {
        const entries = stage[g.key] as Stage['breakBlocks'];
        return (
          <Section key={g.key as string} title={g.label} eyebrow={g.hint} count={entries.length} defaultOpen={entries.length > 0}>
            <BlockListEditor
              entries={entries}
              onChange={(v) => patch({ [g.key]: v } as Partial<Stage>)}
            />
          </Section>
        );
      })}

      {ITEM_GROUPS.map((g) => {
        const entries = stage[g.key] as Stage['itemsToCraft'];
        return (
          <Section key={g.key as string} title={g.label} count={entries.length} defaultOpen={entries.length > 0}>
            <SimpleItemListEditor
              entries={entries}
              onChange={(v) => patch({ [g.key]: v } as Partial<Stage>)}
            />
          </Section>
        );
      })}

      <Section title="Otros objectives simples" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Field label="Vacas a ordeñar">
            <NumberInput value={stage.cowsToMilk} onChange={(v) => patch({ cowsToMilk: v })} />
          </Field>
          <Field label="Peces a pescar">
            <NumberInput value={stage.fishToCatch} onChange={(v) => patch({ fishToCatch: v })} />
          </Field>
          <Field label="Jugadores a matar">
            <NumberInput value={stage.playersToKill} onChange={(v) => patch({ playersToKill: v })} />
          </Field>
        </div>
      </Section>

      <Section title="Hablar con NPCs" eyebrow="npc-uuids-to-talk-to" count={stage.npcsToTalkTo.length} defaultOpen={stage.npcsToTalkTo.length > 0}>
        <div className="space-y-2">
          {stage.npcsToTalkTo.map((uuid, i) => (
            <div key={i} className="flex flex-wrap gap-2">
              <div className="flex-1">
                <NpcSelect
                  value={uuid}
                  onChange={(v) => {
                    const arr = [...stage.npcsToTalkTo];
                    arr[i] = v;
                    patch({ npcsToTalkTo: arr });
                  }}
                  npcs={npcs}
                />
              </div>
              <button
                type="button"
                className="text-ink-faint hover:text-redstone px-1"
                onClick={() =>
                  patch({ npcsToTalkTo: stage.npcsToTalkTo.filter((_, idx) => idx !== i) })
                }
              >
                ×
              </button>
            </div>
          ))}
          <Button
            variant="default"
            type="button"
            onClick={() => patch({ npcsToTalkTo: [...stage.npcsToTalkTo, ''] })}
          >
            + NPC
          </Button>
        </div>
      </Section>

      <Section title="Entregar ítems a NPC" eyebrow="items-to-deliver" count={stage.deliveries.length} defaultOpen={stage.deliveries.length > 0}>
        <div className="space-y-3">
          {stage.deliveries.map((d) => (
            <div key={d.id} className="border border-line-soft rounded-md p-3 space-y-2">
              <div className="flex flex-wrap gap-2">
                <input
                  value={d.item.material}
                  onChange={(e) =>
                    patch({
                      deliveries: stage.deliveries.map((x) =>
                        x.id === d.id
                          ? { ...x, item: { ...x.item, material: e.target.value.toUpperCase() } }
                          : x,
                      ),
                    })
                  }
                  placeholder="MATERIAL_ID"
                  className="flex-1 font-mono text-xs"
                />
                <input
                  type="number"
                  value={d.item.amount}
                  onChange={(e) =>
                    patch({
                      deliveries: stage.deliveries.map((x) =>
                        x.id === d.id
                          ? { ...x, item: { ...x.item, amount: Number(e.target.value) } }
                          : x,
                      ),
                    })
                  }
                  className="w-20 text-xs"
                />
                <button
                  type="button"
                  className="text-ink-faint hover:text-redstone px-1"
                  onClick={() =>
                    patch({ deliveries: stage.deliveries.filter((x) => x.id !== d.id) })
                  }
                >
                  ×
                </button>
              </div>
              <NpcSelect
                value={d.npcUuid}
                onChange={(v) =>
                  patch({
                    deliveries: stage.deliveries.map((x) =>
                      x.id === d.id ? { ...x, npcUuid: v } : x,
                    ),
                  })
                }
                npcs={npcs}
              />
              <input
                value={d.message}
                onChange={(e) =>
                  patch({
                    deliveries: stage.deliveries.map((x) =>
                      x.id === d.id ? { ...x, message: e.target.value } : x,
                    ),
                  })
                }
                placeholder="Mensaje al entregar"
                className="w-full text-xs"
              />
            </div>
          ))}
          <Button
            variant="default"
            type="button"
            onClick={() =>
              patch({
                deliveries: [
                  ...stage.deliveries,
                  { id: uid(), item: { id: uid(), material: '', amount: 1 }, npcUuid: '', message: '' },
                ],
              })
            }
          >
            + Entrega
          </Button>
        </div>
      </Section>

      <Section title="Matar NPCs" eyebrow="npc-uuids-to-kill" count={stage.npcKills.length} defaultOpen={stage.npcKills.length > 0}>
        <div className="space-y-2">
          {stage.npcKills.map((k) => (
            <div key={k.id} className="flex flex-wrap gap-2">
              <div className="flex-1">
                <NpcSelect
                  value={k.npcUuid}
                  onChange={(v) =>
                    patch({
                      npcKills: stage.npcKills.map((x) => (x.id === k.id ? { ...x, npcUuid: v } : x)),
                    })
                  }
                  npcs={npcs}
                />
              </div>
              <input
                type="number"
                value={k.amount}
                onChange={(e) =>
                  patch({
                    npcKills: stage.npcKills.map((x) =>
                      x.id === k.id ? { ...x, amount: Number(e.target.value) } : x,
                    ),
                  })
                }
                className="w-20 text-xs"
              />
              <button
                type="button"
                className="text-ink-faint hover:text-redstone px-1"
                onClick={() => patch({ npcKills: stage.npcKills.filter((x) => x.id !== k.id) })}
              >
                ×
              </button>
            </div>
          ))}
          <Button
            variant="default"
            type="button"
            onClick={() =>
              patch({ npcKills: [...stage.npcKills, { id: uid(), npcUuid: '', amount: 1 }] })
            }
          >
            + NPC a matar
          </Button>
        </div>
      </Section>

      <Section title="Matar mobs (vanilla)" eyebrow="mobs-to-kill" count={stage.mobKills.length} defaultOpen={stage.mobKills.length > 0}>
        <div className="space-y-2">
          {stage.mobKills.map((m) => (
            <div key={m.id} className="flex flex-wrap gap-2">
              <input
                value={m.entityType}
                onChange={(e) =>
                  patch({
                    mobKills: stage.mobKills.map((x) =>
                      x.id === m.id ? { ...x, entityType: e.target.value.toUpperCase() } : x,
                    ),
                  })
                }
                placeholder="ZOMBIE"
                className="flex-1 font-mono text-xs"
              />
              <input
                type="number"
                value={m.amount}
                onChange={(e) =>
                  patch({
                    mobKills: stage.mobKills.map((x) =>
                      x.id === m.id ? { ...x, amount: Number(e.target.value) } : x,
                    ),
                  })
                }
                className="w-20 text-xs"
              />
              <button
                type="button"
                className="text-ink-faint hover:text-redstone px-1"
                onClick={() => patch({ mobKills: stage.mobKills.filter((x) => x.id !== m.id) })}
              >
                ×
              </button>
            </div>
          ))}
          <Button
            variant="default"
            type="button"
            onClick={() =>
              patch({ mobKills: [...stage.mobKills, { id: uid(), entityType: '', amount: 1 }] })
            }
          >
            + Mob a matar
          </Button>
        </div>
      </Section>

      <Section title="Llegar a un punto" eyebrow="locations-to-reach" count={stage.locationsToReach.length} defaultOpen={stage.locationsToReach.length > 0}>
        <div className="space-y-3">
          {stage.locationsToReach.map((l) => (
            <div key={l.id} className="border border-line-soft rounded-md p-3 space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                <input
                  value={l.world}
                  onChange={(e) =>
                    patch({
                      locationsToReach: stage.locationsToReach.map((x) =>
                        x.id === l.id ? { ...x, world: e.target.value } : x,
                      ),
                    })
                  }
                  placeholder="mundo"
                  className="text-xs"
                />
                {(['x', 'y', 'z'] as const).map((axis) => (
                  <input
                    key={axis}
                    type="number"
                    value={l[axis]}
                    onChange={(e) =>
                      patch({
                        locationsToReach: stage.locationsToReach.map((x) =>
                          x.id === l.id ? { ...x, [axis]: Number(e.target.value) } : x,
                        ),
                      })
                    }
                    placeholder={axis.toUpperCase()}
                    className="text-xs"
                  />
                ))}
                <input
                  type="number"
                  value={l.radius}
                  onChange={(e) =>
                    patch({
                      locationsToReach: stage.locationsToReach.map((x) =>
                        x.id === l.id ? { ...x, radius: Number(e.target.value) } : x,
                      ),
                    })
                  }
                  placeholder="radio"
                  title="reach-location-radii"
                  className="text-xs"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <input
                  value={l.displayName}
                  onChange={(e) =>
                    patch({
                      locationsToReach: stage.locationsToReach.map((x) =>
                        x.id === l.id ? { ...x, displayName: e.target.value } : x,
                      ),
                    })
                  }
                  placeholder="Nombre a mostrar (reach-location-names)"
                  className="flex-1 text-xs"
                />
                <button
                  type="button"
                  className="text-ink-faint hover:text-redstone px-1"
                  onClick={() =>
                    patch({ locationsToReach: stage.locationsToReach.filter((x) => x.id !== l.id) })
                  }
                >
                  ×
                </button>
              </div>
            </div>
          ))}
          <Button
            variant="default"
            type="button"
            onClick={() =>
              patch({
                locationsToReach: [
                  ...stage.locationsToReach,
                  { id: uid(), world: '', x: 0, y: 64, z: 0, radius: 3, displayName: '' },
                ],
              })
            }
          >
            + Punto a llegar
          </Button>
        </div>
      </Section>

      <CustomObjectivesSection stage={stage} onChange={onChange} npcs={npcs} />

      <Section title="Texto de progreso custom" eyebrow="objective-override" defaultOpen={stage.objectiveOverride.length > 0}>
        <Field label="Override de display" hint="usá <count> para la cantidad actual, ej. 'Derrota <count> Zombie Aldeano'">
          <TextInput
            value={stage.objectiveOverride[0] ?? ''}
            onChange={(e) => patch({ objectiveOverride: e.target.value ? [e.target.value] : [] })}
            placeholder="Derrota <count> Zombie Aldeano."
          />
        </Field>
      </Section>

      <Section title="Eventos y flujo del stage" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="start-event"><ActionSelect value={stage.startEvent} onChange={(v) => patch({ startEvent: v })} actionNames={actionNames} /></Field>
          <Field label="finish-event"><ActionSelect value={stage.finishEvent} onChange={(v) => patch({ finishEvent: v })} actionNames={actionNames} /></Field>
          <Field label="fail-event"><ActionSelect value={stage.failEvent} onChange={(v) => patch({ failEvent: v })} actionNames={actionNames} /></Field>
          <Field label="death-event"><ActionSelect value={stage.deathEvent} onChange={(v) => patch({ deathEvent: v })} actionNames={actionNames} /></Field>
          <Field label="disconnect-event"><ActionSelect value={stage.disconnectEvent} onChange={(v) => patch({ disconnectEvent: v })} actionNames={actionNames} /></Field>
          <Field label="condition">
            <select value={stage.condition} onChange={(e) => patch({ condition: e.target.value })} className="w-full">
              <option value="">— ninguna —</option>
              {conditionNames.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="delay (segundos)"><NumberInput value={stage.delay} onChange={(v) => patch({ delay: v })} /></Field>
          <Field label="delay-message"><TextInput value={stage.delayMessage} onChange={(e) => patch({ delayMessage: e.target.value })} /></Field>
          <Field label="start-message"><TextInput value={stage.startMessage} onChange={(e) => patch({ startMessage: e.target.value })} /></Field>
          <Field label="complete-message"><TextInput value={stage.completeMessage} onChange={(e) => patch({ completeMessage: e.target.value })} /></Field>
        </div>
      </Section>
    </div>
  );
}

function ActionSelect({
  value,
  onChange,
  actionNames,
}: {
  value: string;
  onChange: (v: string) => void;
  actionNames: string[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="w-full">
      <option value="">— ninguna —</option>
      {actionNames.map((a) => (
        <option key={a} value={a}>
          {a}
        </option>
      ))}
    </select>
  );
}

function CustomObjectivesSection({
  stage,
  onChange,
  npcs,
}: {
  stage: Stage;
  onChange: (s: Stage) => void;
  npcs: NpcRef[];
}) {
  function updateCustom(id: string, patch: Partial<CustomObjective>) {
    onChange({
      ...stage,
      customObjectives: stage.customObjectives.map((c) =>
        c.id === id ? ({ ...c, ...patch } as CustomObjective) : c,
      ),
    });
  }
  function removeCustom(id: string) {
    onChange({ ...stage, customObjectives: stage.customObjectives.filter((c) => c.id !== id) });
  }
  function addCustom(kind: CustomObjective['kind']) {
    let obj: CustomObjective;
    if (kind === 'mmoitems-deliver') {
      obj = {
        kind,
        id: uid(),
        name: '',
        count: 1,
        npcUuid: 'ANY',
        itemType: '',
        itemId: '',
        removeItem: true,
      } satisfies MMOItemsDeliverObjective;
    } else if (kind === 'mythicmobs-kill') {
      obj = {
        kind,
        id: uid(),
        count: 1,
        killObjLabel: 'Kill MythicMob',
        mobName: 'ANY',
        levelRange: '',
        levelPrefix: 'lvl',
      } satisfies MythicMobsKillObjective;
    } else {
      obj = {
        kind,
        id: uid(),
        name: '',
        count: 1,
        npcUuid: 'ANY',
        itemName: '',
        removeItem: true,
      } satisfies MythicMobsDeliverObjective;
    }
    onChange({ ...stage, customObjectives: [...stage.customObjectives, obj] });
  }

  return (
    <Section
      title="Objectives de módulos (MMOItems / MythicMobs)"
      count={stage.customObjectives.length}
      defaultOpen={stage.customObjectives.length > 0}
    >
      <div className="space-y-3">
        {stage.customObjectives.map((c) => (
          <div key={c.id} className="border border-copper/30 rounded-md p-3 space-y-2 bg-copper/5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-copper">
                {c.kind === 'mmoitems-deliver' && 'MMOItems Item Deliver Objective'}
                {c.kind === 'mythicmobs-kill' && 'MythicMobs Kill Objective'}
                {c.kind === 'mythicmobs-deliver' && 'MythicMobs Item Deliver Objective'}
              </span>
              <button
                type="button"
                className="text-ink-faint hover:text-redstone px-1"
                onClick={() => removeCustom(c.id)}
              >
                ×
              </button>
            </div>

            {c.kind === 'mmoitems-deliver' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="Nombre del objective"><TextInput value={c.name} onChange={(e) => updateCustom(c.id, { name: e.target.value })} /></Field>
                <Field label="Cantidad"><NumberInput value={c.count} onChange={(v) => updateCustom(c.id, { count: v ?? 1 })} /></Field>
                <Field label="NPC">
                  <NpcSelect value={c.npcUuid} onChange={(v) => updateCustom(c.id, { npcUuid: v as string })} npcs={npcs} allowAny />
                </Field>
                <Field label="MMO Item Type"><TextInput value={c.itemType} onChange={(e) => updateCustom(c.id, { itemType: e.target.value.toUpperCase() })} /></Field>
                <Field label="MMO Item ID"><TextInput value={c.itemId} onChange={(e) => updateCustom(c.id, { itemId: e.target.value })} /></Field>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs text-ink-dim">
                    <input type="checkbox" checked={c.removeItem} onChange={(e) => updateCustom(c.id, { removeItem: e.target.checked })} />
                    Remover del inventario al entregar
                  </label>
                </div>
              </div>
            )}

            {c.kind === 'mythicmobs-kill' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="Cantidad"><NumberInput value={c.count} onChange={(v) => updateCustom(c.id, { count: v ?? 1 })} /></Field>
                <Field label="Mythic Kill Obj" hint='prefijo de display, no tocar salvo necesidad'><TextInput value={c.killObjLabel} onChange={(e) => updateCustom(c.id, { killObjLabel: e.target.value })} /></Field>
                <Field label="Mythic Kill Name" hint='"ANY" = cualquiera'><TextInput value={c.mobName} onChange={(e) => updateCustom(c.id, { mobName: e.target.value })} /></Field>
                <Field label="Rango de nivel" hint="ej. 0-4"><TextInput value={c.levelRange} onChange={(e) => updateCustom(c.id, { levelRange: e.target.value })} /></Field>
                <Field label="Prefijo de nivel" hint="ej. lvl"><TextInput value={c.levelPrefix} onChange={(e) => updateCustom(c.id, { levelPrefix: e.target.value })} /></Field>
              </div>
            )}

            {c.kind === 'mythicmobs-deliver' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <Field label="Nombre del objective"><TextInput value={c.name} onChange={(e) => updateCustom(c.id, { name: e.target.value })} /></Field>
                <Field label="Cantidad"><NumberInput value={c.count} onChange={(v) => updateCustom(c.id, { count: v ?? 1 })} /></Field>
                <Field label="NPC">
                  <NpcSelect value={c.npcUuid} onChange={(v) => updateCustom(c.id, { npcUuid: v as string })} npcs={npcs} allowAny />
                </Field>
                <Field label="Mythic Item Name"><TextInput value={c.itemName} onChange={(e) => updateCustom(c.id, { itemName: e.target.value })} /></Field>
                <div className="flex items-end pb-2">
                  <label className="flex items-center gap-2 text-xs text-ink-dim">
                    <input type="checkbox" checked={c.removeItem} onChange={(e) => updateCustom(c.id, { removeItem: e.target.checked })} />
                    Remover del inventario al entregar
                  </label>
                </div>
              </div>
            )}
          </div>
        ))}
        <div className="flex gap-2 flex-wrap">
          <Button variant="default" type="button" onClick={() => addCustom('mmoitems-deliver')}>
            + MMOItems: entregar ítem
          </Button>
          <Button variant="default" type="button" onClick={() => addCustom('mythicmobs-kill')}>
            + MythicMobs: matar mob
          </Button>
          <Button variant="default" type="button" onClick={() => addCustom('mythicmobs-deliver')}>
            + MythicMobs: entregar ítem
          </Button>
        </div>
      </div>
    </Section>
  );
}

// silence unused import for TextArea (kept for future rich-text fields)
void TextArea;
