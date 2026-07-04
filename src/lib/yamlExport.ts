import * as yaml from 'js-yaml';
import type {
  Quest,
  Stage,
  QuestAction,
  QuestCondition,
  BlockEntry,
  SimpleItem,
  CustomObjective,
} from '../types/quest';

// js-yaml no tiene un tipo nativo para el `==: org.bukkit.inventory.ItemStack`
// de Bukkit, así que lo armamos como objeto plano — el orden de keys
// (==, type, amount) se preserva porque js-yaml respeta el orden de inserción.
function bukkitItemStack(item: SimpleItem): Record<string, unknown> {
  const obj: Record<string, unknown> = {
    '==': 'org.bukkit.inventory.ItemStack',
    type: item.material,
  };
  if (item.amount && item.amount !== 1) {
    obj.amount = item.amount;
  }
  return obj;
}

function stripEmpty<T extends Record<string, unknown>>(obj: T): Partial<T> {
  const out: Partial<T> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v === null || v === undefined || v === '') continue;
    if (Array.isArray(v) && v.length === 0) continue;
    (out as Record<string, unknown>)[k] = v;
  }
  return out;
}

function blocksToParallelLists(blocks: BlockEntry[]) {
  if (blocks.length === 0) return null;
  return {
    names: blocks.map((b) => b.material),
    amounts: blocks.map((b) => b.amount),
    durability: blocks.map((b) => b.durability),
  };
}

function customObjectiveToYaml(co: CustomObjective): Record<string, unknown> {
  switch (co.kind) {
    case 'mmoitems-deliver':
      return {
        name: 'MMOItems Item Deliver Objective',
        count: co.count,
        data: stripEmpty({
          'MMO Deliver Name': co.name,
          'MMO NPC UUID': co.npcUuid,
          'MMO Item Type': co.itemType,
          'MMO Item ID': co.itemId,
          'MMO Item Removal': co.removeItem ? 'true' : 'false',
        }),
      };
    case 'mythicmobs-kill':
      return {
        name: 'MythicMobs Kill Objective',
        count: co.count,
        data: stripEmpty({
          'Mythic Kill Obj': co.killObjLabel,
          'Mythic Kill Name': co.mobName,
          'Mythic Kill Level': co.levelRange,
          'Mythic Kill Level Prefix': co.levelPrefix,
        }),
      };
    case 'mythicmobs-deliver':
      return {
        name: 'MythicMobs Item Deliver Objective',
        count: co.count,
        data: stripEmpty({
          'Mythic Deliver Name': co.name,
          'Mythic NPC UUID': co.npcUuid,
          'Mythic Item Name': co.itemName,
          'Mythic Item Removal': co.removeItem ? 'true' : 'false',
        }),
      };
  }
}

function stageToYaml(stage: Stage): Record<string, unknown> {
  const out: Record<string, unknown> = {};

  const blockGroups: [string, BlockEntry[]][] = [
    ['break-block', stage.breakBlocks],
    ['damage-block', stage.damageBlocks],
    ['place-block', stage.placeBlocks],
    ['use-block', stage.useBlocks],
    ['cut-block', stage.cutBlocks],
  ];
  for (const [prefix, blocks] of blockGroups) {
    const lists = blocksToParallelLists(blocks);
    if (lists) {
      out[`${prefix}-names`] = lists.names;
      out[`${prefix}-amounts`] = lists.amounts;
      out[`${prefix}-durability`] = lists.durability;
    }
  }

  const itemGroups: [string, SimpleItem[]][] = [
    ['items-to-craft', stage.itemsToCraft],
    ['items-to-smelt', stage.itemsToSmelt],
    ['items-to-enchant', stage.itemsToEnchant],
    ['items-to-brew', stage.itemsToBrew],
    ['items-to-consume', stage.itemsToConsume],
  ];
  for (const [key, items] of itemGroups) {
    if (items.length > 0) out[key] = items.map(bukkitItemStack);
  }

  if (stage.cowsToMilk != null) out['cows-to-milk'] = stage.cowsToMilk;
  if (stage.fishToCatch != null) out['fish-to-catch'] = stage.fishToCatch;
  if (stage.playersToKill != null) out['players-to-kill'] = stage.playersToKill;

  if (stage.npcsToTalkTo.length > 0) out['npc-uuids-to-talk-to'] = stage.npcsToTalkTo;

  if (stage.deliveries.length > 0) {
    out['items-to-deliver'] = stage.deliveries.map((d) => bukkitItemStack(d.item));
    out['npc-delivery-uuids'] = stage.deliveries.map((d) => d.npcUuid);
    out['delivery-messages'] = stage.deliveries.map((d) => d.message);
  }

  if (stage.npcKills.length > 0) {
    out['npc-uuids-to-kill'] = stage.npcKills.map((k) => k.npcUuid);
    out['npc-kill-amounts'] = stage.npcKills.map((k) => k.amount);
  }

  if (stage.mobKills.length > 0) {
    out['mobs-to-kill'] = stage.mobKills.map((m) => m.entityType);
    out['mob-amounts'] = stage.mobKills.map((m) => m.amount);
  }

  if (stage.locationsToReach.length > 0) {
    out['locations-to-reach'] = stage.locationsToReach.map(
      (l) => `${l.world} ${l.x.toFixed(1)} ${l.y.toFixed(1)} ${l.z.toFixed(1)}`,
    );
    out['reach-location-radii'] = stage.locationsToReach.map((l) => l.radius);
    out['reach-location-names'] = stage.locationsToReach.map((l) => l.displayName);
  }

  if (stage.customObjectives.length > 0) {
    const sec: Record<string, unknown> = {};
    stage.customObjectives.forEach((co, i) => {
      sec[`custom${i + 1}`] = customObjectiveToYaml(co);
    });
    out['custom-objectives'] = sec;
  }

  if (stage.startEvent) out['start-event'] = stage.startEvent;
  if (stage.finishEvent) out['finish-event'] = stage.finishEvent;
  if (stage.failEvent) out['fail-event'] = stage.failEvent;
  if (stage.deathEvent) out['death-event'] = stage.deathEvent;
  if (stage.disconnectEvent) out['disconnect-event'] = stage.disconnectEvent;
  if (stage.condition) out['condition'] = stage.condition;
  if (stage.delay != null) out['delay'] = stage.delay;
  if (stage.delayMessage) out['delay-message'] = stage.delayMessage;
  if (stage.startMessage) out['start-message'] = stage.startMessage;
  if (stage.completeMessage) out['complete-message'] = stage.completeMessage;
  if (stage.objectiveOverride.length > 0) out['objective-override'] = stage.objectiveOverride;

  return out;
}

export function questToYamlObject(quest: Quest): Record<string, unknown> {
  const out: Record<string, unknown> = {
    name: quest.name,
  };
  if (quest.askMessage) out['ask-message'] = quest.askMessage;
  if (quest.finishMessage) out['finish-message'] = quest.finishMessage;
  if (quest.region) out['region'] = quest.region;
  if (quest.redoDelay != null) out['redo-delay'] = quest.redoDelay;

  const req = quest.requirements;
  const reqOut: Record<string, unknown> = {};
  if (req.items.length > 0) reqOut['items'] = req.items.map(bukkitItemStack);
  if (req.items.length > 0) reqOut['remove-items'] = [req.removeItems];
  if (req.money != null) reqOut['money'] = req.money;
  if (req.questPoints != null) reqOut['quest-points'] = req.questPoints;
  if (req.exp != null) reqOut['exp'] = req.exp;
  if (req.quests.length > 0) reqOut['quests'] = req.quests;
  if (req.permissions.length > 0) reqOut['permissions'] = req.permissions;
  if (req.customRequirements.length > 0) {
    const sec: Record<string, unknown> = {};
    req.customRequirements.forEach((c, i) => {
      sec[`req${i + 1}`] = { name: c.name, data: c.data };
    });
    reqOut['custom-requirements'] = sec;
  }
  if (req.failRequirementMessage) reqOut['fail-requirement-message'] = req.failRequirementMessage;
  if (req.detailsOverride.length > 0) reqOut['details-override'] = req.detailsOverride;
  if (Object.keys(reqOut).length > 0) out['requirements'] = reqOut;

  const pln = quest.planner;
  const plnOut: Record<string, unknown> = {};
  if (pln.start) plnOut['start'] = pln.start;
  if (pln.end) plnOut['end'] = pln.end;
  if (pln.repeat != null) plnOut['repeat'] = pln.repeat;
  if (pln.cooldown != null) plnOut['cooldown'] = pln.cooldown;
  if (pln.override) plnOut['override'] = pln.override;
  if (Object.keys(plnOut).length > 0) out['planner'] = plnOut;

  out['options'] = {
    'allow-commands': quest.options.allowCommands,
    'allow-quitting': quest.options.allowQuitting,
    'ignore-silk-touch': quest.options.ignoreSilkTouch,
    ...(quest.options.externalPartyPlugin
      ? { 'external-party-plugin': quest.options.externalPartyPlugin }
      : {}),
    'use-parties-plugin': quest.options.usePartiesPlugin,
    'share-progress-level': quest.options.shareProgressLevel,
    'same-quest-only': quest.options.sameQuestOnly,
    'share-distance': quest.options.shareDistance,
    'handle-offline-players': quest.options.handleOfflinePlayers,
    'ignore-block-replace': quest.options.ignoreBlockReplace,
    'give-at-login': quest.options.giveAtLogin,
    'allow-stacking-global': quest.options.allowStackingGlobal,
    'inform-on-start': quest.options.informOnStart,
    'override-max-quests': quest.options.overrideMaxQuests,
  };

  const orderedStages: Record<string, unknown> = {};
  [...quest.stages]
    .sort((a, b) => a.order - b.order)
    .forEach((s) => {
      orderedStages[String(s.order)] = stageToYaml(s);
    });
  out['stages'] = { ordered: orderedStages };

  const rew = quest.rewards;
  const rewOut: Record<string, unknown> = {};
  if (rew.items.length > 0) rewOut['items'] = rew.items.map(bukkitItemStack);
  if (rew.money != null) rewOut['money'] = rew.money;
  if (rew.questPoints != null) rewOut['quest-points'] = rew.questPoints;
  if (rew.exp != null) rewOut['exp'] = rew.exp;
  if (rew.commands.length > 0) rewOut['commands'] = rew.commands;
  if (rew.commandsOverrideDisplay.length > 0)
    rewOut['commands-override-display'] = rew.commandsOverrideDisplay;
  if (rew.permissions.length > 0) rewOut['permissions'] = rew.permissions;
  if (rew.permissionWorlds.length > 0) rewOut['permission-worlds'] = rew.permissionWorlds;
  if (rew.customRewards.length > 0) {
    const sec: Record<string, unknown> = {};
    rew.customRewards.forEach((c, i) => {
      sec[`req${i + 1}`] = { name: c.name, data: c.data };
    });
    rewOut['custom-rewards'] = sec;
  }
  if (rew.detailsOverride.length > 0) rewOut['details-override'] = rew.detailsOverride;
  if (Object.keys(rewOut).length > 0) out['rewards'] = rewOut;

  return out;
}

export function questsToYaml(quests: Quest[]): string {
  const root: Record<string, unknown> = { quests: {} };
  const questsSec = root.quests as Record<string, unknown>;
  for (const q of quests) {
    questsSec[q.id] = questToYamlObject(q);
  }
  return (
    '# For non-English characters, this file MUST stay encoded in UTF-8\n' +
    yaml.dump(root, { lineWidth: -1, noRefs: true})
  );
}

function actionToYaml(a: QuestAction): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (a.message) out['message'] = a.message;
  if (a.openBook) out['open-book'] = a.openBook;
  if (a.clearInventory) out['clear-inventory'] = a.clearInventory;
  if (a.failQuest) out['fail-quest'] = a.failQuest;
  if (a.explosions.length > 0) out['explosions'] = a.explosions;
  if (a.effects.length > 0) out['effects'] = a.effects;
  if (a.effectLocations.length > 0) out['effect-locations'] = a.effectLocations;
  if (a.stormWorld) out['storm-world'] = a.stormWorld;
  if (a.stormDuration != null) out['storm-duration'] = a.stormDuration;
  if (a.thunderWorld) out['thunder-world'] = a.thunderWorld;
  if (a.thunderDuration != null) out['thunder-duration'] = a.thunderDuration;
  if (a.lightningStrikes.length > 0) out['lightning-strikes'] = a.lightningStrikes;
  if (a.commands.length > 0) out['commands'] = a.commands;
  if (a.potionEffectTypes.length > 0) {
    out['potion-effect-types'] = a.potionEffectTypes;
    out['potion-effect-durations'] = a.potionEffectDurations;
    out['potion-effect-amplifiers'] = a.potionEffectAmplifiers;
  }
  if (a.hunger != null) out['hunger'] = a.hunger;
  if (a.saturation != null) out['saturation'] = a.saturation;
  if (a.health != null) out['health'] = a.health;
  if (a.teleportLocation) out['teleport-location'] = a.teleportLocation;
  if (a.timer != null) out['timer'] = a.timer;
  if (a.cancelTimer) out['cancel-timer'] = a.cancelTimer;
  for (const spawn of a.mobSpawns) {
    out[spawn.key] = stripEmpty({
      name: spawn.name,
      'spawn-location': spawn.spawnLocation,
      'mob-type': spawn.mobType,
      'spawn-amounts': spawn.spawnAmount,
      'held-item-drop-chance': spawn.heldItemDropChance,
      'boots-drop-chance': spawn.bootsDropChance,
      'leggings-drop-chance': spawn.leggingsDropChance,
      'chest-plate-drop-chance': spawn.chestplateDropChance,
      'helmet-drop-chance': spawn.helmetDropChance,
    });
  }
  return out;
}

export function actionsToYaml(actions: QuestAction[]): string {
  const root: Record<string, unknown> = { actions: {} };
  const sec = root.actions as Record<string, unknown>;
  for (const a of actions) sec[a.name] = actionToYaml(a);
  return yaml.dump(root, { lineWidth: -1, noRefs: true});
}

function conditionToYaml(c: QuestCondition): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (c.failQuest) out['fail-quest'] = c.failQuest;
  if (c.rideEntity.length > 0) out['ride-entity'] = c.rideEntity;
  if (c.rideNpcUuid.length > 0) out['ride-npc-uuid'] = c.rideNpcUuid;
  if (c.permission.length > 0) out['permission'] = c.permission;
  if (c.stayWithinWorld.length > 0) out['stay-within-world'] = c.stayWithinWorld;
  if (c.stayWithinTicksStart != null || c.stayWithinTicksEnd != null) {
    out['stay-within-ticks'] = stripEmpty({
      start: c.stayWithinTicksStart,
      end: c.stayWithinTicksEnd,
    });
  }
  if (c.stayWithinBiome.length > 0) out['stay-within-biome'] = c.stayWithinBiome;
  if (c.stayWithinRegion.length > 0) out['stay-within-region'] = c.stayWithinRegion;
  return out;
}

export function conditionsToYaml(conditions: QuestCondition[]): string {
  const root: Record<string, unknown> = { conditions: {} };
  const sec = root.conditions as Record<string, unknown>;
  for (const c of conditions) sec[c.name] = conditionToYaml(c);
  return yaml.dump(root, { lineWidth: -1, noRefs: true});
}
