// Modelo interno de QuestForge — fiel al schema real de PikaMug Quests
// (ver quests-yaml-schema-reference.md para el mapeo completo a YAML)

export type UUID = string;

/** Ítem simple vanilla (Bukkit ItemStack serializado sin NBT extra) */
export interface SimpleItem {
  id: string; // id interno de QuestForge (no va al YAML)
  material: string; // ej. IRON_ORE
  amount: number;
}

/** Bloque con durability opcional (break/damage/place/use/cut) */
export interface BlockEntry {
  id: string;
  material: string;
  amount: number;
  durability: number; // 0 = sin variante, -1 = "legacy"/no aplica
}

export interface NpcRef {
  id: string; // id interno
  uuid: UUID;
  name: string; // solo para mostrar en el editor, no se exporta
}

// ---------- Objectives ----------

export interface DeliverEntry {
  id: string;
  item: SimpleItem;
  npcUuid: UUID | ''; // '' se exporta como falta (no debería pasar)
  message: string;
}

export interface NpcKillEntry {
  id: string;
  npcUuid: UUID;
  amount: number;
}

export interface MobKillEntry {
  id: string;
  entityType: string; // vanilla EntityType, ej. ZOMBIE, PIG
  amount: number;
}

export interface LocationReachEntry {
  id: string;
  world: string;
  x: number;
  y: number;
  z: number;
  radius: number;
  displayName: string;
}

// Custom objectives (módulos) ---------------------------------

export interface MMOItemsDeliverObjective {
  kind: 'mmoitems-deliver';
  id: string;
  name: string; // "MMO Deliver Name"
  count: number;
  npcUuid: UUID | 'ANY';
  itemType: string; // "MMO Item Type"
  itemId: string; // "MMO Item ID"
  removeItem: boolean;
}

export interface MythicMobsKillObjective {
  kind: 'mythicmobs-kill';
  id: string;
  count: number;
  killObjLabel: string; // "Mythic Kill Obj", por defecto "Kill MythicMob"
  mobName: string; // "Mythic Kill Name", o "ANY"
  levelRange: string; // "Mythic Kill Level" ej. "0-4"
  levelPrefix: string; // "Mythic Kill Level Prefix" ej. "lvl"
}

export interface MythicMobsDeliverObjective {
  kind: 'mythicmobs-deliver';
  id: string;
  name: string; // "Mythic Deliver Name"
  count: number;
  npcUuid: UUID | 'ANY';
  itemName: string; // "Mythic Item Name"
  removeItem: boolean;
}

export type CustomObjective =
  | MMOItemsDeliverObjective
  | MythicMobsKillObjective
  | MythicMobsDeliverObjective;

export interface Stage {
  id: string;
  order: number; // 1-indexed, corresponde a stages.ordered.<n>

  breakBlocks: BlockEntry[];
  damageBlocks: BlockEntry[];
  placeBlocks: BlockEntry[];
  useBlocks: BlockEntry[];
  cutBlocks: BlockEntry[];

  itemsToCraft: SimpleItem[];
  itemsToSmelt: SimpleItem[];
  itemsToEnchant: SimpleItem[];
  itemsToBrew: SimpleItem[];
  itemsToConsume: SimpleItem[];

  cowsToMilk: number | null;
  fishToCatch: number | null;
  playersToKill: number | null;

  npcsToTalkTo: UUID[];
  deliveries: DeliverEntry[];
  npcKills: NpcKillEntry[];
  mobKills: MobKillEntry[];
  locationsToReach: LocationReachEntry[];

  customObjectives: CustomObjective[];

  startEvent: string;
  finishEvent: string;
  failEvent: string;
  deathEvent: string;
  disconnectEvent: string;

  condition: string;
  delay: number | null;
  delayMessage: string;
  startMessage: string;
  completeMessage: string;
  objectiveOverride: string[]; // texto custom de progreso, soporta <count>
}

// ---------- Requirements / Rewards ----------

export interface CustomDataEntry {
  id: string;
  name: string; // nombre exacto del módulo, ej. "MMOItems Item Requirement"
  data: Record<string, string>;
}

export interface Requirements {
  items: SimpleItem[];
  removeItems: boolean;
  money: number | null;
  questPoints: number | null;
  exp: number | null;
  quests: string[]; // quest IDs requeridas completadas
  permissions: string[];
  customRequirements: CustomDataEntry[];
  failRequirementMessage: string;
  detailsOverride: string[];
}

export interface Rewards {
  items: SimpleItem[];
  money: number | null;
  questPoints: number | null;
  exp: number | null;
  commands: string[];
  commandsOverrideDisplay: string[];
  permissions: string[];
  permissionWorlds: string[];
  customRewards: CustomDataEntry[];
  detailsOverride: string[];
}

export interface Planner {
  start: string; // "D:M:YYYY:H:m:s:TimeZone"
  end: string;
  repeat: number | null; // segundos
  cooldown: number | null; // segundos
  override: boolean;
}

export interface QuestOptions {
  allowCommands: boolean;
  allowQuitting: boolean;
  ignoreSilkTouch: boolean;
  externalPartyPlugin: string;
  usePartiesPlugin: boolean;
  shareProgressLevel: number;
  sameQuestOnly: boolean;
  shareDistance: number;
  handleOfflinePlayers: boolean;
  ignoreBlockReplace: boolean;
  giveAtLogin: boolean;
  allowStackingGlobal: boolean;
  informOnStart: boolean;
  overrideMaxQuests: boolean;
}

export interface Quest {
  id: string; // key bajo quests.<id>
  name: string;
  askMessage: string;
  finishMessage: string;
  region: string;
  redoDelay: number | null;
  requirements: Requirements;
  planner: Planner;
  options: QuestOptions;
  stages: Stage[];
  rewards: Rewards;
}

// ---------- actions.yml / conditions.yml ----------

export interface MobSpawnEntry {
  id: string;
  key: string; // clave arbitraria dentro de la action
  name: string;
  spawnLocation: string;
  mobType: string;
  spawnAmount: number;
  heldItemDropChance: number;
  bootsDropChance: number;
  leggingsDropChance: number;
  chestplateDropChance: number;
  helmetDropChance: number;
}

export interface QuestAction {
  id: string;
  name: string; // key bajo actions.<name>
  message: string;
  openBook: string;
  clearInventory: boolean;
  failQuest: boolean;
  explosions: string[];
  effects: string[];
  effectLocations: string[];
  stormWorld: string;
  stormDuration: number | null;
  thunderWorld: string;
  thunderDuration: number | null;
  lightningStrikes: string[];
  commands: string[];
  potionEffectTypes: string[];
  potionEffectDurations: number[];
  potionEffectAmplifiers: number[];
  hunger: number | null;
  saturation: number | null;
  health: number | null;
  teleportLocation: string;
  timer: number | null;
  cancelTimer: boolean;
  mobSpawns: MobSpawnEntry[];
}

export interface QuestCondition {
  id: string;
  name: string; // key bajo conditions.<name>
  failQuest: boolean;
  rideEntity: string[];
  rideNpcUuid: UUID[];
  permission: string[];
  stayWithinWorld: string[];
  stayWithinTicksStart: number | null;
  stayWithinTicksEnd: number | null;
  stayWithinBiome: string[];
  stayWithinRegion: string[];
}

// ---------- Proyecto completo ----------

export interface QuestForgeProject {
  quests: Quest[];
  actions: QuestAction[];
  conditions: QuestCondition[];
  npcs: NpcRef[]; // registro local de NPCs para elegir por nombre en la UI
}

export const EMPTY_REQUIREMENTS: Requirements = {
  items: [],
  removeItems: false,
  money: null,
  questPoints: null,
  exp: null,
  quests: [],
  permissions: [],
  customRequirements: [],
  failRequirementMessage: '',
  detailsOverride: [],
};

export const EMPTY_PLANNER: Planner = {
  start: '',
  end: '',
  repeat: null,
  cooldown: null,
  override: false,
};

export const EMPTY_OPTIONS: QuestOptions = {
  allowCommands: true,
  allowQuitting: true,
  ignoreSilkTouch: false,
  externalPartyPlugin: '',
  usePartiesPlugin: false,
  shareProgressLevel: 0,
  sameQuestOnly: false,
  shareDistance: 0,
  handleOfflinePlayers: true,
  ignoreBlockReplace: true,
  giveAtLogin: false,
  allowStackingGlobal: false,
  informOnStart: true,
  overrideMaxQuests: false,
};

export const EMPTY_REWARDS: Rewards = {
  items: [],
  money: null,
  questPoints: null,
  exp: null,
  commands: [],
  commandsOverrideDisplay: [],
  permissions: [],
  permissionWorlds: [],
  customRewards: [],
  detailsOverride: [],
};

export function emptyStage(order: number): Stage {
  return {
    id: crypto.randomUUID(),
    order,
    breakBlocks: [],
    damageBlocks: [],
    placeBlocks: [],
    useBlocks: [],
    cutBlocks: [],
    itemsToCraft: [],
    itemsToSmelt: [],
    itemsToEnchant: [],
    itemsToBrew: [],
    itemsToConsume: [],
    cowsToMilk: null,
    fishToCatch: null,
    playersToKill: null,
    npcsToTalkTo: [],
    deliveries: [],
    npcKills: [],
    mobKills: [],
    locationsToReach: [],
    customObjectives: [],
    startEvent: '',
    finishEvent: '',
    failEvent: '',
    deathEvent: '',
    disconnectEvent: '',
    condition: '',
    delay: null,
    delayMessage: '',
    startMessage: '',
    completeMessage: '',
    objectiveOverride: [],
  };
}

export function emptyQuest(id = ''): Quest {
  return {
    id,
    name: '',
    askMessage: '',
    finishMessage: '',
    region: '',
    redoDelay: null,
    requirements: { ...EMPTY_REQUIREMENTS },
    planner: { ...EMPTY_PLANNER },
    options: { ...EMPTY_OPTIONS },
    stages: [emptyStage(1)],
    rewards: { ...EMPTY_REWARDS },
  };
}

export function emptyAction(name = ''): QuestAction {
  return {
    id: crypto.randomUUID(),
    name,
    message: '',
    openBook: '',
    clearInventory: false,
    failQuest: false,
    explosions: [],
    effects: [],
    effectLocations: [],
    stormWorld: '',
    stormDuration: null,
    thunderWorld: '',
    thunderDuration: null,
    lightningStrikes: [],
    commands: [],
    potionEffectTypes: [],
    potionEffectDurations: [],
    potionEffectAmplifiers: [],
    hunger: null,
    saturation: null,
    health: null,
    teleportLocation: '',
    timer: null,
    cancelTimer: false,
    mobSpawns: [],
  };
}

export function emptyCondition(name = ''): QuestCondition {
  return {
    id: crypto.randomUUID(),
    name,
    failQuest: false,
    rideEntity: [],
    rideNpcUuid: [],
    permission: [],
    stayWithinWorld: [],
    stayWithinTicksStart: null,
    stayWithinTicksEnd: null,
    stayWithinBiome: [],
    stayWithinRegion: [],
  };
}
