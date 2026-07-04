import * as yaml from 'js-yaml';
import {
  type Quest,
  type Stage,
  type QuestAction,
  type QuestCondition,
  type BlockEntry,
  type SimpleItem,
  type CustomObjective,
  type CustomDataEntry,
  emptyQuest,
  emptyStage,
  emptyAction,
  emptyCondition,
  EMPTY_REQUIREMENTS,
  EMPTY_PLANNER,
  EMPTY_OPTIONS,
  EMPTY_REWARDS,
} from '../types/quest';

function asArray<T = unknown>(v: unknown): T[] {
  return Array.isArray(v) ? (v as T[]) : [];
}
function str(v: unknown, fallback = ''): string {
  return v == null ? fallback : String(v);
}
function num(v: unknown): number | null {
  return v == null ? null : Number(v);
}
function bool(v: unknown, fallback = false): boolean {
  return v == null ? fallback : Boolean(v);
}

function itemStackToSimple(raw: unknown): SimpleItem {
  const o = (raw ?? {}) as Record<string, unknown>;
  return {
    id: crypto.randomUUID(),
    material: str(o.type, 'STONE'),
    amount: o.amount != null ? Number(o.amount) : 1,
  };
}

function parseBlocks(
  namesKey: string[],
  amountsKey: number[],
  durKey: number[],
): BlockEntry[] {
  const names = namesKey;
  const amounts = amountsKey;
  const dur = durKey;
  return names.map((name, i) => ({
    id: crypto.randomUUID(),
    material: name,
    amount: amounts[i] ?? 1,
    durability: dur[i] ?? 0,
  }));
}

function parseCustomObjective(name: string, count: number, data: Record<string, string>): CustomObjective | null {
  if (name === 'MMOItems Item Deliver Objective') {
    return {
      kind: 'mmoitems-deliver',
      id: crypto.randomUUID(),
      name: data['MMO Deliver Name'] ?? '',
      count,
      npcUuid: (data['MMO NPC UUID'] as string) ?? 'ANY',
      itemType: data['MMO Item Type'] ?? '',
      itemId: data['MMO Item ID'] ?? '',
      removeItem: (data['MMO Item Removal'] ?? 'false').toLowerCase() === 'true',
    };
  }
  if (name === 'MythicMobs Kill Objective') {
    return {
      kind: 'mythicmobs-kill',
      id: crypto.randomUUID(),
      count,
      killObjLabel: data['Mythic Kill Obj'] ?? 'Kill MythicMob',
      mobName: data['Mythic Kill Name'] ?? 'ANY',
      levelRange: data['Mythic Kill Level'] ?? '',
      levelPrefix: data['Mythic Kill Level Prefix'] ?? '',
    };
  }
  if (name === 'MythicMobs Item Deliver Objective') {
    return {
      kind: 'mythicmobs-deliver',
      id: crypto.randomUUID(),
      name: data['Mythic Deliver Name'] ?? '',
      count,
      npcUuid: (data['Mythic NPC UUID'] as string) ?? 'ANY',
      itemName: data['Mythic Item Name'] ?? '',
      removeItem: (data['Mythic Item Removal'] ?? 'false').toLowerCase() === 'true',
    };
  }
  return null; // módulo desconocido: se ignora (o se podría guardar "raw" a futuro)
}

function parseStage(order: number, raw: Record<string, unknown>): Stage {
  const s = emptyStage(order);

  s.breakBlocks = parseBlocks(
    asArray<string>(raw['break-block-names']),
    asArray<number>(raw['break-block-amounts']),
    asArray<number>(raw['break-block-durability']),
  );
  s.damageBlocks = parseBlocks(
    asArray<string>(raw['damage-block-names']),
    asArray<number>(raw['damage-block-amounts']),
    asArray<number>(raw['damage-block-durability']),
  );
  s.placeBlocks = parseBlocks(
    asArray<string>(raw['place-block-names']),
    asArray<number>(raw['place-block-amounts']),
    asArray<number>(raw['place-block-durability']),
  );
  s.useBlocks = parseBlocks(
    asArray<string>(raw['use-block-names']),
    asArray<number>(raw['use-block-amounts']),
    asArray<number>(raw['use-block-durability']),
  );
  s.cutBlocks = parseBlocks(
    asArray<string>(raw['cut-block-names']),
    asArray<number>(raw['cut-block-amounts']),
    asArray<number>(raw['cut-block-durability']),
  );

  s.itemsToCraft = asArray(raw['items-to-craft']).map(itemStackToSimple);
  s.itemsToSmelt = asArray(raw['items-to-smelt']).map(itemStackToSimple);
  s.itemsToEnchant = asArray(raw['items-to-enchant']).map(itemStackToSimple);
  s.itemsToBrew = asArray(raw['items-to-brew']).map(itemStackToSimple);
  s.itemsToConsume = asArray(raw['items-to-consume']).map(itemStackToSimple);

  s.cowsToMilk = num(raw['cows-to-milk']);
  s.fishToCatch = num(raw['fish-to-catch']);
  s.playersToKill = num(raw['players-to-kill']);

  s.npcsToTalkTo = asArray<string>(raw['npc-uuids-to-talk-to']);

  const deliverItems = asArray(raw['items-to-deliver']).map(itemStackToSimple);
  const deliverUuids = asArray<string>(raw['npc-delivery-uuids']);
  const deliverMsgs = asArray<string>(raw['delivery-messages']);
  s.deliveries = deliverItems.map((item, i) => ({
    id: crypto.randomUUID(),
    item,
    npcUuid: deliverUuids[i] ?? '',
    message: deliverMsgs[i] ?? deliverMsgs[deliverMsgs.length - 1] ?? '',
  }));

  const npcKillUuids = asArray<string>(raw['npc-uuids-to-kill']);
  const npcKillAmounts = asArray<number>(raw['npc-kill-amounts']);
  s.npcKills = npcKillUuids.map((uuid, i) => ({
    id: crypto.randomUUID(),
    npcUuid: uuid,
    amount: npcKillAmounts[i] ?? 1,
  }));

  const mobNames = asArray<string>(raw['mobs-to-kill']);
  const mobAmounts = asArray<number>(raw['mob-amounts']);
  s.mobKills = mobNames.map((entityType, i) => ({
    id: crypto.randomUUID(),
    entityType,
    amount: mobAmounts[i] ?? 1,
  }));

  const reachRaw = asArray<string>(raw['locations-to-reach']);
  const reachRadii = asArray<number>(raw['reach-location-radii']);
  const reachNames = asArray<string>(raw['reach-location-names']);
  s.locationsToReach = reachRaw.map((loc, i) => {
    const parts = loc.trim().split(/\s+/);
    return {
      id: crypto.randomUUID(),
      world: parts[0] ?? '',
      x: Number(parts[1] ?? 0),
      y: Number(parts[2] ?? 0),
      z: Number(parts[3] ?? 0),
      radius: reachRadii[i] ?? 3,
      displayName: reachNames[i] ?? '',
    };
  });

  const customSec = raw['custom-objectives'] as Record<string, unknown> | undefined;
  if (customSec) {
    s.customObjectives = Object.values(customSec)
      .map((entry) => {
        const e = entry as Record<string, unknown>;
        const parsed = parseCustomObjective(
          str(e.name),
          Number(e.count ?? 0),
          (e.data as Record<string, string>) ?? {},
        );
        return parsed;
      })
      .filter((x): x is CustomObjective => x !== null);
  }

  s.startEvent = str(raw['start-event']);
  s.finishEvent = str(raw['finish-event']);
  s.failEvent = str(raw['fail-event']);
  s.deathEvent = str(raw['death-event']);
  s.disconnectEvent = str(raw['disconnect-event']);
  s.condition = str(raw['condition']);
  s.delay = num(raw['delay']);
  s.delayMessage = str(raw['delay-message']);
  s.startMessage = str(raw['start-message']);
  s.completeMessage = str(raw['complete-message']);
  s.objectiveOverride = asArray<string>(raw['objective-override']);

  return s;
}

function parseCustomDataSection(
  sec: Record<string, unknown> | undefined,
): CustomDataEntry[] {
  if (!sec) return [];
  return Object.values(sec).map((entry) => {
    const e = entry as Record<string, unknown>;
    return {
      id: crypto.randomUUID(),
      name: str(e.name),
      data: (e.data as Record<string, string>) ?? {},
    };
  });
}

function parseQuest(id: string, raw: Record<string, unknown>): Quest {
  const q = emptyQuest(id);
  q.name = str(raw.name);
  q.askMessage = str(raw['ask-message']);
  q.finishMessage = str(raw['finish-message']);
  q.region = str(raw.region);
  q.redoDelay = num(raw['redo-delay']);

  const req = (raw.requirements as Record<string, unknown>) ?? {};
  q.requirements = {
    ...EMPTY_REQUIREMENTS,
    items: asArray(req.items).map(itemStackToSimple),
    removeItems: bool(asArray<boolean>(req['remove-items'])[0]),
    money: num(req.money),
    questPoints: num(req['quest-points']),
    exp: num(req.exp),
    quests: asArray<string>(req.quests),
    permissions: asArray<string>(req.permissions),
    customRequirements: parseCustomDataSection(
      req['custom-requirements'] as Record<string, unknown>,
    ),
    failRequirementMessage: str(req['fail-requirement-message']),
    detailsOverride: asArray<string>(req['details-override']),
  };

  const pln = (raw.planner as Record<string, unknown>) ?? {};
  q.planner = {
    ...EMPTY_PLANNER,
    start: str(pln.start),
    end: str(pln.end),
    repeat: num(pln.repeat),
    cooldown: num(pln.cooldown),
    override: bool(pln.override),
  };

  const opt = (raw.options as Record<string, unknown>) ?? {};
  q.options = {
    ...EMPTY_OPTIONS,
    allowCommands: bool(opt['allow-commands'], EMPTY_OPTIONS.allowCommands),
    allowQuitting: bool(opt['allow-quitting'], EMPTY_OPTIONS.allowQuitting),
    ignoreSilkTouch: bool(opt['ignore-silk-touch']),
    externalPartyPlugin: str(opt['external-party-plugin']),
    usePartiesPlugin: bool(opt['use-parties-plugin']),
    shareProgressLevel: Number(opt['share-progress-level'] ?? 0),
    sameQuestOnly: bool(opt['same-quest-only']),
    shareDistance: Number(opt['share-distance'] ?? 0),
    handleOfflinePlayers: bool(opt['handle-offline-players'], true),
    ignoreBlockReplace: bool(opt['ignore-block-replace'], true),
    giveAtLogin: bool(opt['give-at-login']),
    allowStackingGlobal: bool(opt['allow-stacking-global']),
    informOnStart: bool(opt['inform-on-start'], true),
    overrideMaxQuests: bool(opt['override-max-quests']),
  };

  const stagesSec =
    ((raw.stages as Record<string, unknown>)?.ordered as Record<string, unknown>) ?? {};
  q.stages = Object.entries(stagesSec)
    .map(([order, s]) => parseStage(Number(order), s as Record<string, unknown>))
    .sort((a, b) => a.order - b.order);
  if (q.stages.length === 0) q.stages = [emptyStage(1)];

  const rew = (raw.rewards as Record<string, unknown>) ?? {};
  q.rewards = {
    ...EMPTY_REWARDS,
    items: asArray(rew.items).map(itemStackToSimple),
    money: num(rew.money),
    questPoints: num(rew['quest-points']),
    exp: num(rew.exp),
    commands: asArray<string>(rew.commands),
    commandsOverrideDisplay: asArray<string>(rew['commands-override-display']),
    permissions: asArray<string>(rew.permissions),
    permissionWorlds: asArray<string>(rew['permission-worlds']),
    customRewards: parseCustomDataSection(rew['custom-rewards'] as Record<string, unknown>),
    detailsOverride: asArray<string>(rew['details-override']),
  };

  return q;
}

export function yamlToQuests(text: string): Quest[] {
  const doc = yaml.load(text) as Record<string, unknown>;
  if (!doc || typeof doc !== 'object') return [];
  // Acepta tanto el archivo completo (con "quests:" en la raíz) como un
  // fragmento pegado directo donde la raíz ya es el mapa de <id>: {...}.
  const questsSec = ((doc.quests as Record<string, unknown>) ?? doc) as Record<string, unknown>;
  return Object.entries(questsSec)
    .filter(([, raw]) => raw && typeof raw === 'object' && !Array.isArray(raw))
    .map(([id, raw]) => parseQuest(id, raw as Record<string, unknown>));
}

export function yamlToActions(text: string): QuestAction[] {
  const doc = yaml.load(text) as Record<string, unknown>;
  if (!doc || typeof doc !== 'object') return [];
  const sec = ((doc.actions as Record<string, unknown>) ?? doc) as Record<string, unknown>;
  return Object.entries(sec)
    .filter(([, raw]) => raw && typeof raw === 'object' && !Array.isArray(raw))
    .map(([name, raw]) => {
    const r = raw as Record<string, unknown>;
    const a = emptyAction(name);
    a.message = str(r.message);
    a.openBook = str(r['open-book']);
    a.clearInventory = bool(r['clear-inventory']);
    a.failQuest = bool(r['fail-quest']);
    a.explosions = asArray<string>(r.explosions);
    a.effects = asArray<string>(r.effects);
    a.effectLocations = asArray<string>(r['effect-locations']);
    a.stormWorld = str(r['storm-world']);
    a.stormDuration = num(r['storm-duration']);
    a.thunderWorld = str(r['thunder-world']);
    a.thunderDuration = num(r['thunder-duration']);
    a.lightningStrikes = asArray<string>(r['lightning-strikes']);
    a.commands = asArray<string>(r.commands);
    a.potionEffectTypes = asArray<string>(r['potion-effect-types']);
    a.potionEffectDurations = asArray<number>(r['potion-effect-durations']);
    a.potionEffectAmplifiers = asArray<number>(r['potion-effect-amplifiers']);
    a.hunger = num(r.hunger);
    a.saturation = num(r.saturation);
    a.health = num(r.health);
    a.teleportLocation = str(r['teleport-location']);
    a.timer = num(r.timer);
    a.cancelTimer = bool(r['cancel-timer']);
    return a;
  });
}

export function yamlToConditions(text: string): QuestCondition[] {
  const doc = yaml.load(text) as Record<string, unknown>;
  if (!doc || typeof doc !== 'object') return [];
  const sec = ((doc.conditions as Record<string, unknown>) ?? doc) as Record<string, unknown>;
  return Object.entries(sec)
    .filter(([, raw]) => raw && typeof raw === 'object' && !Array.isArray(raw))
    .map(([name, raw]) => {
    const r = raw as Record<string, unknown>;
    const c = emptyCondition(name);
    c.failQuest = bool(r['fail-quest']);
    c.rideEntity = asArray<string>(r['ride-entity']);
    c.rideNpcUuid = asArray<string>(r['ride-npc-uuid']);
    c.permission = asArray<string>(r.permission);
    c.stayWithinWorld = asArray<string>(r['stay-within-world']);
    const ticks = (r['stay-within-ticks'] as Record<string, unknown>) ?? {};
    c.stayWithinTicksStart = num(ticks.start);
    c.stayWithinTicksEnd = num(ticks.end);
    c.stayWithinBiome = asArray<string>(r['stay-within-biome']);
    c.stayWithinRegion = asArray<string>(r['stay-within-region']);
    return c;
  });
}
