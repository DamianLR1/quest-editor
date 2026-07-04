import { useState } from 'react';
import type { Quest } from '../types/quest';
import { emptyStage } from '../types/quest';
import { useProject } from '../state/ProjectContext';
import {
  Section,
  Field,
  TextInput,
  NumberInput,
  Toggle,
  Button,
  TagListEditor,
} from '../components/ui';
import { SimpleItemListEditor } from '../components/entryEditors';
import { StageEditor } from './StageEditor';

export function QuestEditor({ quest }: { quest: Quest }) {
  const { project, setProject } = useProject();
  const [activeStageIdx, setActiveStageIdx] = useState(0);

  function updateQuest(patch: Partial<Quest>) {
    setProject((p) => ({
      ...p,
      quests: p.quests.map((q) => (q.id === quest.id ? { ...q, ...patch } : q)),
    }));
  }

  function updateStages(stages: Quest['stages']) {
    updateQuest({ stages });
  }

  function addStage() {
    const nextOrder = quest.stages.length + 1;
    updateStages([...quest.stages, emptyStage(nextOrder)]);
    setActiveStageIdx(quest.stages.length);
  }

  function removeStage(idx: number) {
    const remaining = quest.stages.filter((_, i) => i !== idx).map((s, i) => ({ ...s, order: i + 1 }));
    updateStages(remaining.length > 0 ? remaining : [emptyStage(1)]);
    setActiveStageIdx(Math.max(0, idx - 1));
  }

  const actionNames = project.actions.map((a) => a.name).filter(Boolean);
  const conditionNames = project.conditions.map((c) => c.name).filter(Boolean);
  const otherQuestIds = project.quests.map((q) => q.id).filter((id) => id !== quest.id);

  const activeStage = quest.stages[activeStageIdx] ?? quest.stages[0];

  return (
    <div className="space-y-4 max-w-4xl">
      <Section title="General" defaultOpen>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="ID de la quest" hint="key bajo quests.<id>, sin espacios">
            <TextInput
              value={quest.id}
              onChange={(e) => updateQuest({ id: e.target.value.replace(/\s+/g, '') })}
              className="font-mono"
            />
          </Field>
          <Field label="name">
            <TextInput value={quest.name} onChange={(e) => updateQuest({ name: e.target.value })} />
          </Field>
        </div>
        <Field label="ask-message"><TextInput value={quest.askMessage} onChange={(e) => updateQuest({ askMessage: e.target.value })} /></Field>
        <Field label="finish-message"><TextInput value={quest.finishMessage} onChange={(e) => updateQuest({ finishMessage: e.target.value })} /></Field>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="region" hint="WorldGuard, opcional"><TextInput value={quest.region} onChange={(e) => updateQuest({ region: e.target.value })} /></Field>
          <Field label="redo-delay (segundos)"><NumberInput value={quest.redoDelay} onChange={(v) => updateQuest({ redoDelay: v })} /></Field>
        </div>
      </Section>

      <Section title="Requisitos" eyebrow="requirements" defaultOpen={false}>
        <Field label="Ítems requeridos">
          <SimpleItemListEditor
            entries={quest.requirements.items}
            onChange={(items) => updateQuest({ requirements: { ...quest.requirements, items } })}
          />
        </Field>
        <Toggle
          checked={quest.requirements.removeItems}
          onChange={(v) => updateQuest({ requirements: { ...quest.requirements, removeItems: v } })}
          label="remove-items (quitar del inventario al aceptar)"
        />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          <Field label="money"><NumberInput value={quest.requirements.money} onChange={(v) => updateQuest({ requirements: { ...quest.requirements, money: v } })} /></Field>
          <Field label="quest-points"><NumberInput value={quest.requirements.questPoints} onChange={(v) => updateQuest({ requirements: { ...quest.requirements, questPoints: v } })} /></Field>
          <Field label="exp"><NumberInput value={quest.requirements.exp} onChange={(v) => updateQuest({ requirements: { ...quest.requirements, exp: v } })} /></Field>
        </div>
        <Field label="Quests requeridas (completadas antes)">
          <TagListEditor
            values={quest.requirements.quests}
            onChange={(v) => updateQuest({ requirements: { ...quest.requirements, quests: v } })}
            placeholder={otherQuestIds[0] ?? 'id-de-quest'}
          />
        </Field>
        <Field label="permissions">
          <TagListEditor
            values={quest.requirements.permissions}
            onChange={(v) => updateQuest({ requirements: { ...quest.requirements, permissions: v } })}
          />
        </Field>
        <Field label="fail-requirement-message">
          <TextInput
            value={quest.requirements.failRequirementMessage}
            onChange={(e) => updateQuest({ requirements: { ...quest.requirements, failRequirementMessage: e.target.value } })}
          />
        </Field>
      </Section>

      <Section title="Planificación" eyebrow="planner" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="start" hint="D:M:YYYY:H:m:s:TimeZone">
            <TextInput value={quest.planner.start} onChange={(e) => updateQuest({ planner: { ...quest.planner, start: e.target.value } })} className="font-mono text-xs" />
          </Field>
          <Field label="end" hint="D:M:YYYY:H:m:s:TimeZone">
            <TextInput value={quest.planner.end} onChange={(e) => updateQuest({ planner: { ...quest.planner, end: e.target.value } })} className="font-mono text-xs" />
          </Field>
          <Field label="repeat (segundos)">
            <NumberInput value={quest.planner.repeat} onChange={(v) => updateQuest({ planner: { ...quest.planner, repeat: v } })} />
          </Field>
          <Field label="cooldown (segundos)">
            <NumberInput value={quest.planner.cooldown} onChange={(v) => updateQuest({ planner: { ...quest.planner, cooldown: v } })} />
          </Field>
        </div>
        <Toggle checked={quest.planner.override} onChange={(v) => updateQuest({ planner: { ...quest.planner, override: v } })} label="override" />
      </Section>

      <Section title="Opciones" eyebrow="options" defaultOpen={false}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <Toggle checked={quest.options.allowCommands} onChange={(v) => updateQuest({ options: { ...quest.options, allowCommands: v } })} label="allow-commands" />
          <Toggle checked={quest.options.allowQuitting} onChange={(v) => updateQuest({ options: { ...quest.options, allowQuitting: v } })} label="allow-quitting" />
          <Toggle checked={quest.options.ignoreSilkTouch} onChange={(v) => updateQuest({ options: { ...quest.options, ignoreSilkTouch: v } })} label="ignore-silk-touch" />
          <Toggle checked={quest.options.usePartiesPlugin} onChange={(v) => updateQuest({ options: { ...quest.options, usePartiesPlugin: v } })} label="use-parties-plugin" />
          <Toggle checked={quest.options.sameQuestOnly} onChange={(v) => updateQuest({ options: { ...quest.options, sameQuestOnly: v } })} label="same-quest-only" />
          <Toggle checked={quest.options.handleOfflinePlayers} onChange={(v) => updateQuest({ options: { ...quest.options, handleOfflinePlayers: v } })} label="handle-offline-players" />
          <Toggle checked={quest.options.ignoreBlockReplace} onChange={(v) => updateQuest({ options: { ...quest.options, ignoreBlockReplace: v } })} label="ignore-block-replace" />
          <Toggle checked={quest.options.giveAtLogin} onChange={(v) => updateQuest({ options: { ...quest.options, giveAtLogin: v } })} label="give-at-login" />
          <Toggle checked={quest.options.allowStackingGlobal} onChange={(v) => updateQuest({ options: { ...quest.options, allowStackingGlobal: v } })} label="allow-stacking-global" />
          <Toggle checked={quest.options.informOnStart} onChange={(v) => updateQuest({ options: { ...quest.options, informOnStart: v } })} label="inform-on-start" />
          <Toggle checked={quest.options.overrideMaxQuests} onChange={(v) => updateQuest({ options: { ...quest.options, overrideMaxQuests: v } })} label="override-max-quests" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2">
          <Field label="share-progress-level"><NumberInput value={quest.options.shareProgressLevel} onChange={(v) => updateQuest({ options: { ...quest.options, shareProgressLevel: v ?? 0 } })} /></Field>
          <Field label="share-distance"><NumberInput value={quest.options.shareDistance} onChange={(v) => updateQuest({ options: { ...quest.options, shareDistance: v ?? 0 } })} /></Field>
        </div>
      </Section>

      <div>
        <div className="text-xs uppercase tracking-wider text-copper font-mono mb-2">Stages</div>
        {/* Rail de progreso de stages */}
        <div className="flex items-center overflow-x-auto pb-2 qf-scrollbar-none">
          {quest.stages.map((s, i) => (
            <div key={s.id} className="flex items-center shrink-0">
              {i > 0 && <div className="w-6 h-px bg-line" />}
              <button
                onClick={() => setActiveStageIdx(i)}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono font-semibold border-2 transition-colors ${
                  i === activeStageIdx
                    ? 'border-copper bg-copper/20 text-copper'
                    : 'border-line text-ink-faint hover:border-ink-faint'
                }`}
              >
                {s.order}
              </button>
            </div>
          ))}
          <div className="w-6 h-px bg-line" />
          <button
            onClick={addStage}
            className="w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 border-dashed border-line text-ink-faint hover:border-emerald hover:text-emerald shrink-0"
          >
            +
          </button>
        </div>

        <div className="mt-3">
          {activeStage && (
            <>
              <div className="flex justify-end mb-2">
                {quest.stages.length > 1 && (
                  <Button variant="danger" onClick={() => removeStage(activeStageIdx)}>
                    Eliminar stage {activeStage.order}
                  </Button>
                )}
              </div>
              <StageEditor
                stage={activeStage}
                onChange={(s) =>
                  updateStages(quest.stages.map((st, i) => (i === activeStageIdx ? s : st)))
                }
                npcs={project.npcs}
                actionNames={actionNames}
                conditionNames={conditionNames}
              />
            </>
          )}
        </div>
      </div>

      <Section title="Recompensas" eyebrow="rewards" defaultOpen={false}>
        <Field label="Ítems">
          <SimpleItemListEditor
            entries={quest.rewards.items}
            onChange={(items) => updateQuest({ rewards: { ...quest.rewards, items } })}
          />
        </Field>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
          <Field label="money"><NumberInput value={quest.rewards.money} onChange={(v) => updateQuest({ rewards: { ...quest.rewards, money: v } })} /></Field>
          <Field label="quest-points"><NumberInput value={quest.rewards.questPoints} onChange={(v) => updateQuest({ rewards: { ...quest.rewards, questPoints: v } })} /></Field>
          <Field label="exp"><NumberInput value={quest.rewards.exp} onChange={(v) => updateQuest({ rewards: { ...quest.rewards, exp: v } })} /></Field>
        </div>
        <Field label="commands" hint="soporta <player>">
          <TagListEditor values={quest.rewards.commands} onChange={(v) => updateQuest({ rewards: { ...quest.rewards, commands: v } })} />
        </Field>
        <Field label="permissions">
          <TagListEditor values={quest.rewards.permissions} onChange={(v) => updateQuest({ rewards: { ...quest.rewards, permissions: v } })} />
        </Field>
      </Section>
    </div>
  );
}
