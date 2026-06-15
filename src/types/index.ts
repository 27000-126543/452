export type LegionRole = 'commander' | 'vice_commander' | 'quartermaster' | 'member';
export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
export type UnitType = 'infantry' | 'cavalry' | 'mages';
export type TerrainType = 'plain' | 'forest' | 'mountain' | 'desert' | 'swamp';
export type WeatherType = 'sunny' | 'rain' | 'fog' | 'snow' | 'storm';
export type RankTier = 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond' | 'master';
export type FormationType = 'offensive' | 'defensive' | 'balanced' | 'custom';

export interface Player {
  id: string;
  name: string;
  avatar: string;
  title: string;
  rank: RankTier;
  seasonPoints: number;
  gold: number;
  materials: Record<string, number>;
  legionId: string | null;
  legionRole: LegionRole | null;
}

export interface BannerConfig {
  primary: string;
  secondary: string;
  emblem: string;
  name?: string;
}

export interface LegionMember {
  playerId: string;
  playerName: string;
  avatar: string;
  role: LegionRole;
  joinedAt: number;
  contribution: number;
  armyPower: number;
  rank: RankTier;
}

export interface UpgradeProgress {
  current: number;
  required: number;
  goldContributed: number;
  materialsContributed: Record<string, number>;
}

export interface HeadquartersEffect {
  id: string;
  name: string;
  description: string;
  multiplier: number;
}

export interface Headquarters {
  level: number;
  maxLevel: number;
  upgradeProgress: UpgradeProgress;
  powerCapBonus: number;
  visionBonus: number;
  effects: HeadquartersEffect[];
}

export interface ResearchProject {
  id: string;
  name: string;
  description: string;
  progress: number;
  target: number;
  status: 'pending' | 'approved' | 'in_progress' | 'completed';
  proposedBy: string;
  bonuses: string[];
}

export interface Legion {
  id: string;
  name: string;
  slogan: string;
  banner: BannerConfig;
  commanderId: string;
  viceCommanderIds: string[];
  quartermasterIds: string[];
  members: LegionMember[];
  headquarters: Headquarters;
  researchProjects: ResearchProject[];
  totalPower: number;
  contribution: number;
  createdAt: number;
  recruitRequests: RecruitRequest[];
  promotionRequests: PromotionRequest[];
}

export interface RecruitRequest {
  id: string;
  playerId: string;
  playerName: string;
  avatar: string;
  message: string;
  submittedAt: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface PromotionRequest {
  id: string;
  playerId: string;
  playerName: string;
  currentRole: LegionRole;
  requestedRole: LegionRole;
  reason: string;
  submittedAt: number;
  status: 'pending' | 'approved' | 'rejected';
}

export interface UnitStats {
  attack: number;
  defense: number;
  hp: number;
  speed: number;
  range: number;
  magicPower: number;
  supplyCost: number;
}

export interface Equipment {
  id: string;
  name: string;
  rarity: Rarity;
  stats: Partial<UnitStats>;
}

export interface GeneralSkill {
  id: string;
  name: string;
  description: string;
  cooldown: number;
  effect: string;
  power: number;
}

export interface Trait {
  id: string;
  name: string;
  description: string;
  effect: string;
}

export interface General {
  id: string;
  name: string;
  portrait: string;
  rarity: Rarity;
  level: number;
  exp: number;
  skills: GeneralSkill[];
  traits: Trait[];
  specialty: UnitType;
  commandCap: number;
  moraleBoost: number;
  attackBonus: number;
  defenseBonus: number;
  available: boolean;
}

export interface Unit {
  id: string;
  name: string;
  type: UnitType;
  rarity: Rarity;
  level: number;
  count: number;
  baseStats: UnitStats;
  equipment: Equipment[];
  blueprintId: string | null;
  icon: string;
}

export interface UnitSlot {
  unitId: string | null;
  count: number;
  maxCount: number;
}

export interface ArmyComposition {
  infantry: UnitSlot;
  cavalry: UnitSlot;
  mages: UnitSlot;
  generalId: string | null;
  totalPower: number;
  morale: number;
  supplies: number;
  maxSupplies: number;
}

export interface FormationSlot {
  id: string;
  position: { x: number; y: number };
  unitType: UnitType | 'general';
  enabled: boolean;
}

export interface FormationBonus {
  attackBonus: number;
  defenseBonus: number;
  speedBonus: number;
  magicBonus: number;
}

export interface Formation {
  id: string;
  name: string;
  type: FormationType;
  slots: FormationSlot[];
  bonuses: FormationBonus;
}

export interface HexCoord {
  q: number;
  r: number;
}

export interface StatusEffect {
  id: string;
  name: string;
  type: 'buff' | 'debuff';
  duration: number;
  effect: string;
  value: number;
}

export interface ActiveSkill {
  skillId: string;
  skillName: string;
  caster: string;
  target: string;
  activatedAt: number;
  remainingDuration: number;
}

export interface BattleUnit {
  unitId: string;
  name: string;
  type: UnitType;
  initialCount: number;
  currentCount: number;
  casualties: number;
  attack: number;
  defense: number;
  hp: number;
  maxHp: number;
  morale: number;
  position: HexCoord;
  statusEffects: StatusEffect[];
  icon: string;
}

export interface BattleSide {
  legionName: string;
  legionBanner: BannerConfig;
  general: General | null;
  units: BattleUnit[];
  formationIntegrity: number;
  totalPower: number;
  skillCooldowns: Record<string, number>;
  tacticalCooldowns: Record<string, number>;
  surpriseTroops: number;
}

export interface BattleLogEntry {
  turn: number;
  timestamp: number;
  type: 'attack' | 'skill' | 'moral_change' | 'casualty' | 'formation' | 'surprise' | 'system';
  side: 'player' | 'enemy' | 'neutral';
  message: string;
  data?: Record<string, unknown>;
}

export interface BattleState {
  id: string;
  playerArmy: BattleSide;
  enemyArmy: BattleSide;
  currentTurn: number;
  phase: 'preparation' | 'active' | 'ended';
  terrain: TerrainType;
  weather: WeatherType;
  activeSkills: ActiveSkill[];
  log: BattleLogEntry[];
  winner: 'player' | 'enemy' | 'draw' | null;
  startTime: number;
  lastUpdate: number;
  rewards: BattleRewards | null;
  favorited?: boolean;
  notes?: string;
}

export interface BattleRewards {
  points: number;
  gold: number;
  blueprints: string[];
  exp: number;
}

export interface TradeItem {
  id: string;
  name: string;
  rarity: Rarity;
  icon: string;
  description: string;
  stats?: Partial<UnitStats>;
  specialty?: UnitType;
}

export interface BidEntry {
  bidderId: string;
  bidderName: string;
  amount: number;
  timestamp: number;
}

export interface ListingEvent {
  type: 'listed' | 'repriced' | 'delisted' | 'sold' | 'expired';
  timestamp: number;
  detail?: string;
}

export interface TradeOrder {
  id: string;
  sellerId: string;
  sellerName: string;
  itemType: 'blueprint' | 'contract' | 'material';
  itemData: TradeItem;
  price: number;
  originalPrice?: number;
  listingFee?: number;
  suggestedPriceRange: [number, number];
  listedAt: number;
  expiresAt: number;
  status: 'active' | 'sold' | 'expired' | 'delisted';
  bidHistory: BidEntry[];
  isAuction: boolean;
  views: number;
  viewSources?: { detail: number; category: number };
  listingHistory: ListingEvent[];
}

export interface MatchmakingTicket {
  id: string;
  playerId: string;
  playerName: string;
  powerRating: number;
  tier: RankTier;
  joinedAt: number;
  estimatedWait: number;
  status: 'queued' | 'matched' | 'cancelled';
  opponentPreview?: {
    name: string;
    power: number;
    tier: RankTier;
  };
}

export interface HeatmapCell {
  x: number;
  y: number;
  value: number;
  label: string;
}

export interface TimeSeriesPoint {
  date: string;
  timestamp: number;
  value: number;
  label?: string;
}

export interface PriceTrend {
  itemId: string;
  itemName: string;
  prices: TimeSeriesPoint[];
  currentPrice: number;
  change: number;
}

export interface RankEntry {
  rank: number;
  id: string;
  name: string;
  value: number;
  previousRank: number;
  change: number;
  metadata?: {
    tier?: RankTier;
    members?: number;
    emblem?: string;
    tag?: string;
    [k: string]: unknown;
  };
}

export interface BattleStats {
  totalBattles: number;
  wins: number;
  losses: number;
  draws: number;
  averageCasualties: number;
  mostUsedUnit: string;
  mostEffectiveFormation: string;
}

export interface WarReport {
  periodStart: number;
  periodEnd: number;
  unitUsageHeatmap: HeatmapCell[];
  winRateCurve: TimeSeriesPoint[];
  priceTrends: PriceTrend[];
  topLegions: RankEntry[];
  battleStatistics: BattleStats;
  generatedAt: number;
}

export interface RadarData {
  axis: string;
  value: number;
  fullMark: number;
}

export interface NewsItem {
  id: string;
  type: 'battle' | 'trade' | 'mobilization' | 'system';
  title: string;
  content: string;
  timestamp: number;
  data?: Record<string, unknown>;
}

export interface TerrainInfo {
  type: TerrainType;
  name: string;
  description: string;
  attackModifier: number;
  defenseModifier: number;
  speedModifier: number;
  color: string;
}

export interface WeatherInfo {
  type: WeatherType;
  name: string;
  description: string;
  magicModifier: number;
  rangedModifier: number;
  visibilityModifier: number;
  color: string;
}

export interface ContributionDonation {
  playerId: string;
  playerName: string;
  gold?: number;
  materials?: Record<string, number>;
  timestamp: number;
}
