import type {
  Player,
  Legion,
  General,
  Unit,
  ArmyComposition,
  Formation,
  TradeOrder,
  NewsItem,
  WarReport,
  RankEntry,
  TerrainInfo,
  WeatherInfo,
  RankTier,
  Rarity,
  UnitType,
  TerrainType,
  WeatherType,
} from '@/types';

const rarityColors: Record<Rarity, string> = {
  common: '#9CA3AF',
  uncommon: '#22C55E',
  rare: '#3B82F6',
  epic: '#A855F7',
  legendary: '#F59E0B',
};

export const terrains: TerrainInfo[] = [
  { type: 'plain', name: '平原', description: '开阔地形，无特殊加成', attackModifier: 1.0, defenseModifier: 1.0, speedModifier: 1.0, color: '#86EFAC' },
  { type: 'forest', name: '森林', description: '森林地形，步兵防御提升', attackModifier: 0.9, defenseModifier: 1.25, speedModifier: 0.85, color: '#166534' },
  { type: 'mountain', name: '山地', description: '山地地形，防御大幅提升但机动性下降', attackModifier: 0.8, defenseModifier: 1.4, speedModifier: 0.7, color: '#78716C' },
  { type: 'desert', name: '沙漠', description: '沙漠地形，骑兵速度提升，法师削弱', attackModifier: 1.1, defenseModifier: 0.9, speedModifier: 1.15, color: '#FCD34D' },
  { type: 'swamp', name: '沼泽', description: '沼泽地形，双方均受削弱', attackModifier: 0.85, defenseModifier: 0.9, speedModifier: 0.6, color: '#65A30D' },
];

export const weathers: WeatherInfo[] = [
  { type: 'sunny', name: '晴朗', description: '无特殊影响', magicModifier: 1.0, rangedModifier: 1.0, visibilityModifier: 1.0, color: '#FDE047' },
  { type: 'rain', name: '暴雨', description: '法师削弱，远程命中率下降', magicModifier: 0.8, rangedModifier: 0.7, visibilityModifier: 0.85, color: '#60A5FA' },
  { type: 'fog', name: '浓雾', description: '视野大幅降低，奇袭成功率提升', magicModifier: 1.0, rangedModifier: 0.5, visibilityModifier: 0.5, color: '#D1D5DB' },
  { type: 'snow', name: '暴雪', description: '移动速度降低，冰系法师增强', magicModifier: 1.2, rangedModifier: 0.6, visibilityModifier: 0.7, color: '#E0F2FE' },
  { type: 'storm', name: '风暴', description: '雷电法师大幅增强，其他兵种受损', magicModifier: 1.5, rangedModifier: 0.4, visibilityModifier: 0.6, color: '#7C3AED' },
];

const generateId = () => Math.random().toString(36).slice(2, 11);

export const mockPlayer: Player = {
  id: 'player-001',
  name: '暗影领主',
  avatar: '⚔️',
  title: '魔法战争大师',
  rank: 'platinum',
  seasonPoints: 3847,
  gold: 128756,
  materials: {
    iron: 5280,
    wood: 3420,
    crystal: 890,
    mana: 2150,
  },
  legionId: 'legion-001',
  legionRole: 'commander',
};

export const mockLegion: Legion = {
  id: 'legion-001',
  name: '暗影龙骑士团',
  slogan: '龙之怒火，燃尽苍穹',
  banner: { primary: '#7C3AED', secondary: '#F59E0B', emblem: '🐉' },
  commanderId: 'player-001',
  viceCommanderIds: ['player-002', 'player-003'],
  quartermasterIds: ['player-004'],
  totalPower: 284650,
  contribution: 98560,
  createdAt: Date.now() - 86400000 * 120,
  members: [
    { playerId: 'player-001', playerName: '暗影领主', avatar: '⚔️', role: 'commander', joinedAt: Date.now() - 86400000 * 120, contribution: 45200, armyPower: 68400, rank: 'platinum' },
    { playerId: 'player-002', playerName: '星光法师', avatar: '🌟', role: 'vice_commander', joinedAt: Date.now() - 86400000 * 95, contribution: 21800, armyPower: 42300, rank: 'gold' },
    { playerId: 'player-003', playerName: '铁血将军', avatar: '🛡️', role: 'vice_commander', joinedAt: Date.now() - 86400000 * 88, contribution: 18900, armyPower: 38700, rank: 'gold' },
    { playerId: 'player-004', playerName: '银狐后勤', avatar: '🦊', role: 'quartermaster', joinedAt: Date.now() - 86400000 * 72, contribution: 12600, armyPower: 18200, rank: 'silver' },
    { playerId: 'player-005', playerName: '暴风骑士', avatar: '🌪️', role: 'member', joinedAt: Date.now() - 86400000 * 45, contribution: 8500, armyPower: 25600, rank: 'silver' },
    { playerId: 'player-006', playerName: '寒冰射手', avatar: '❄️', role: 'member', joinedAt: Date.now() - 86400000 * 30, contribution: 5200, armyPower: 21500, rank: 'silver' },
    { playerId: 'player-007', playerName: '烈焰术士', avatar: '🔥', role: 'member', joinedAt: Date.now() - 86400000 * 18, contribution: 3800, armyPower: 18900, rank: 'bronze' },
    { playerId: 'player-008', playerName: '丛林守护者', avatar: '🌿', role: 'member', joinedAt: Date.now() - 86400000 * 12, contribution: 2560, armyPower: 15200, rank: 'bronze' },
  ],
  headquarters: {
    level: 5,
    maxLevel: 10,
    upgradeProgress: {
      current: 18650,
      required: 35000,
      goldContributed: 128500,
      materialsContributed: { iron: 15600, wood: 12400, crystal: 2800, mana: 5600 },
    },
    powerCapBonus: 12500,
    visionBonus: 2,
    effects: [
      { id: 'e1', name: '联合指挥', description: '全成员战力上限+10000', multiplier: 1.0 },
      { id: 'e2', name: '共享视野', description: '战场视野+2格', multiplier: 1.0 },
      { id: 'e3', name: '集体荣耀', description: '大赛积分获取+15%', multiplier: 1.15 },
    ],
  },
  researchProjects: [
    { id: 'r1', name: '精锐步兵训练', description: '全体步兵攻击+10%', progress: 85, target: 100, status: 'in_progress', proposedBy: 'player-002', bonuses: ['infantry_attack_10'] },
    { id: 'r2', name: '魔法结界研究', description: '全体部队魔法抗性+15%', progress: 45, target: 100, status: 'approved', proposedBy: 'player-001', bonuses: ['magic_resist_15'] },
  ],
  recruitRequests: [
    { id: 'rr1', playerId: 'p-new-1', playerName: '暗夜刺客', avatar: '🗡️', message: '渴望加入龙骑士团，为荣耀而战！', submittedAt: Date.now() - 3600000 * 2, status: 'pending' },
    { id: 'rr2', playerId: 'p-new-2', playerName: '雷霆战锤', avatar: '🔨', message: '老兵求入，擅长骑兵指挥。', submittedAt: Date.now() - 3600000 * 5, status: 'pending' },
  ],
  promotionRequests: [
    { id: 'pr1', playerId: 'player-005', playerName: '暴风骑士', currentRole: 'member', requestedRole: 'quartermaster', reason: '长期活跃，愿承担后勤管理职责', submittedAt: Date.now() - 86400000 * 2, status: 'pending' },
  ],
};

export const mockGenerals: General[] = [
  {
    id: 'gen-001',
    name: '凯撒·龙魂',
    portrait: '👑',
    rarity: 'legendary',
    level: 45,
    exp: 87500,
    skills: [
      { id: 's1', name: '龙之怒吼', description: '全体攻击+30%，持续3回合', cooldown: 5, effect: 'attack_buff', power: 30 },
      { id: 's2', name: '铁血冲锋', description: '骑兵部队发动冲锋，造成双倍伤害', cooldown: 4, effect: 'cavalry_charge', power: 100 },
    ],
    traits: [
      { id: 't1', name: '天生统帅', description: '士气上限+20%', effect: 'morale_max_20' },
      { id: 't2', name: '骑兵大师', description: '骑兵全属性+15%', effect: 'cavalry_all_15' },
    ],
    specialty: 'cavalry',
    commandCap: 8000,
    moraleBoost: 20,
    attackBonus: 15,
    defenseBonus: 10,
    available: true,
  },
  {
    id: 'gen-002',
    name: '梅林·星语',
    portrait: '🧙',
    rarity: 'epic',
    level: 38,
    exp: 62300,
    skills: [
      { id: 's3', name: '奥术风暴', description: '对敌方全体造成魔法伤害', cooldown: 4, effect: 'aoe_magic', power: 45 },
      { id: 's4', name: '魔力屏障', description: '部队获得护盾，吸收下一次伤害', cooldown: 6, effect: 'shield', power: 100 },
    ],
    traits: [{ id: 't3', name: '奥术亲和', description: '法师全属性+20%', effect: 'mages_all_20' }],
    specialty: 'mages',
    commandCap: 6500,
    moraleBoost: 12,
    attackBonus: 8,
    defenseBonus: 5,
    available: true,
  },
  {
    id: 'gen-003',
    name: '斯巴达·铁壁',
    portrait: '🛡️',
    rarity: 'epic',
    level: 42,
    exp: 74800,
    skills: [
      { id: 's5', name: '铜墙铁壁', description: '全体防御+40%，持续2回合', cooldown: 5, effect: 'defense_buff', power: 40 },
      { id: 's6', name: '方阵集结', description: '步兵组成方阵，反击所有近战攻击', cooldown: 5, effect: 'phalanx', power: 25 },
    ],
    traits: [{ id: 't4', name: '盾墙大师', description: '步兵防御+25%', effect: 'infantry_defense_25' }],
    specialty: 'infantry',
    commandCap: 7200,
    moraleBoost: 18,
    attackBonus: 5,
    defenseBonus: 20,
    available: true,
  },
  {
    id: 'gen-004',
    name: '阿喀琉斯·追风',
    portrait: '🏹',
    rarity: 'rare',
    level: 28,
    exp: 34200,
    skills: [
      { id: 's7', name: '疾风突袭', description: '全兵种速度+25%', cooldown: 4, effect: 'speed_buff', power: 25 },
    ],
    traits: [],
    specialty: 'cavalry',
    commandCap: 4500,
    moraleBoost: 8,
    attackBonus: 6,
    defenseBonus: 3,
    available: false,
  },
];

export const mockUnits: Unit[] = [
  {
    id: 'u-inf-001',
    name: '龙鳞重甲步兵',
    type: 'infantry',
    rarity: 'epic',
    level: 12,
    count: 2400,
    icon: '⚔️',
    baseStats: { attack: 85, defense: 140, hp: 320, speed: 18, range: 1, magicPower: 5, supplyCost: 3 },
    equipment: [],
    blueprintId: null,
  },
  {
    id: 'u-inf-002',
    name: '圣殿护卫',
    type: 'infantry',
    rarity: 'rare',
    level: 8,
    count: 1800,
    icon: '🛡️',
    baseStats: { attack: 65, defense: 120, hp: 280, speed: 15, range: 1, magicPower: 15, supplyCost: 2.5 },
    equipment: [],
    blueprintId: null,
  },
  {
    id: 'u-cav-001',
    name: '龙骑突击骑兵',
    type: 'cavalry',
    rarity: 'legendary',
    level: 15,
    count: 1500,
    icon: '🐎',
    baseStats: { attack: 140, defense: 75, hp: 260, speed: 65, range: 1, magicPower: 20, supplyCost: 6 },
    equipment: [],
    blueprintId: null,
  },
  {
    id: 'u-cav-002',
    name: '疾风游骑兵',
    type: 'cavalry',
    rarity: 'rare',
    level: 10,
    count: 1200,
    icon: '🏇',
    baseStats: { attack: 95, defense: 50, hp: 200, speed: 75, range: 2, magicPower: 0, supplyCost: 4 },
    equipment: [],
    blueprintId: null,
  },
  {
    id: 'u-mag-001',
    name: '奥术大法师团',
    type: 'mages',
    rarity: 'epic',
    level: 14,
    count: 900,
    icon: '🔮',
    baseStats: { attack: 45, defense: 35, hp: 150, speed: 12, range: 6, magicPower: 220, supplyCost: 8 },
    equipment: [],
    blueprintId: null,
  },
  {
    id: 'u-mag-002',
    name: '元素召唤师',
    type: 'mages',
    rarity: 'rare',
    level: 9,
    count: 700,
    icon: '✨',
    baseStats: { attack: 35, defense: 28, hp: 130, speed: 10, range: 5, magicPower: 165, supplyCost: 6 },
    equipment: [],
    blueprintId: null,
  },
];

export const mockArmyComposition: ArmyComposition = {
  infantry: { unitId: 'u-inf-001', count: 2400, maxCount: 3000 },
  cavalry: { unitId: 'u-cav-001', count: 1500, maxCount: 2500 },
  mages: { unitId: 'u-mag-001', count: 900, maxCount: 1500 },
  generalId: 'gen-001',
  totalPower: 68420,
  morale: 92,
  supplies: 8500,
  maxSupplies: 12000,
};

export const mockFormations: Formation[] = [
  {
    id: 'form-001',
    name: '锥形冲锋阵',
    type: 'offensive',
    bonuses: { attackBonus: 25, defenseBonus: -5, speedBonus: 15, magicBonus: 0 },
    slots: [
      { id: 'sl1', position: { x: 2, y: 0 }, unitType: 'general', enabled: true },
      { id: 'sl2', position: { x: 1, y: 1 }, unitType: 'cavalry', enabled: true },
      { id: 'sl3', position: { x: 3, y: 1 }, unitType: 'cavalry', enabled: true },
      { id: 'sl4', position: { x: 0, y: 2 }, unitType: 'infantry', enabled: true },
      { id: 'sl5', position: { x: 2, y: 2 }, unitType: 'infantry', enabled: true },
      { id: 'sl6', position: { x: 4, y: 2 }, unitType: 'infantry', enabled: true },
      { id: 'sl7', position: { x: 1, y: 3 }, unitType: 'mages', enabled: true },
      { id: 'sl8', position: { x: 3, y: 3 }, unitType: 'mages', enabled: true },
    ],
  },
  {
    id: 'form-002',
    name: '盾墙防御阵',
    type: 'defensive',
    bonuses: { attackBonus: -5, defenseBonus: 30, speedBonus: -10, magicBonus: 10 },
    slots: [
      { id: 'sl1', position: { x: 0, y: 0 }, unitType: 'infantry', enabled: true },
      { id: 'sl2', position: { x: 1, y: 0 }, unitType: 'infantry', enabled: true },
      { id: 'sl3', position: { x: 2, y: 0 }, unitType: 'general', enabled: true },
      { id: 'sl4', position: { x: 3, y: 0 }, unitType: 'infantry', enabled: true },
      { id: 'sl5', position: { x: 4, y: 0 }, unitType: 'infantry', enabled: true },
      { id: 'sl6', position: { x: 1, y: 1 }, unitType: 'cavalry', enabled: true },
      { id: 'sl7', position: { x: 3, y: 1 }, unitType: 'cavalry', enabled: true },
      { id: 'sl8', position: { x: 2, y: 2 }, unitType: 'mages', enabled: true },
    ],
  },
  {
    id: 'form-003',
    name: '均衡作战阵',
    type: 'balanced',
    bonuses: { attackBonus: 8, defenseBonus: 8, speedBonus: 5, magicBonus: 10 },
    slots: [
      { id: 'sl1', position: { x: 0, y: 0 }, unitType: 'infantry', enabled: true },
      { id: 'sl2', position: { x: 2, y: 0 }, unitType: 'infantry', enabled: true },
      { id: 'sl3', position: { x: 4, y: 0 }, unitType: 'infantry', enabled: true },
      { id: 'sl4', position: { x: 1, y: 1 }, unitType: 'general', enabled: true },
      { id: 'sl5', position: { x: 3, y: 1 }, unitType: 'cavalry', enabled: true },
      { id: 'sl6', position: { x: 0, y: 2 }, unitType: 'mages', enabled: true },
      { id: 'sl7', position: { x: 2, y: 2 }, unitType: 'mages', enabled: true },
      { id: 'sl8', position: { x: 4, y: 2 }, unitType: 'cavalry', enabled: true },
    ],
  },
];

export const mockTradeOrders: TradeOrder[] = [
  {
    id: 'to-001',
    sellerId: 's1',
    sellerName: '皇家铸造厂',
    itemType: 'blueprint',
    itemData: { id: 'bp-001', name: '巨龙骑兵图纸', rarity: 'legendary', icon: '🐉', description: '可解锁传奇级巨龙骑兵单位', specialty: 'cavalry', stats: { attack: 180, defense: 95, hp: 380, speed: 70 } },
    price: 185000,
    suggestedPriceRange: [160000, 210000],
    listedAt: Date.now() - 3600000 * 4,
    expiresAt: Date.now() + 86400000 * 2,
    status: 'active',
    bidHistory: [{ bidderId: 'b1', bidderName: '烈焰军团', amount: 185000, timestamp: Date.now() - 3600000 * 2 }],
    isAuction: true,
  },
  {
    id: 'to-002',
    sellerId: 's2',
    sellerName: '法师塔议会',
    itemType: 'contract',
    itemData: { id: 'ct-001', name: '大法师·银月合同', rarity: 'epic', icon: '🌙', description: '史诗级法师将领合同，专精奥术' },
    price: 92000,
    suggestedPriceRange: [80000, 110000],
    listedAt: Date.now() - 3600000 * 12,
    expiresAt: Date.now() + 86400000 * 1,
    status: 'active',
    bidHistory: [],
    isAuction: false,
  },
  {
    id: 'to-003',
    sellerId: 's3',
    sellerName: '铁血工坊',
    itemType: 'blueprint',
    itemData: { id: 'bp-002', name: '魔晶重步图纸', rarity: 'epic', icon: '💎', description: '携带魔晶护盾的精锐步兵', specialty: 'infantry', stats: { attack: 95, defense: 180, hp: 450 } },
    price: 78000,
    suggestedPriceRange: [65000, 90000],
    listedAt: Date.now() - 3600000 * 8,
    expiresAt: Date.now() + 86400000 * 3,
    status: 'active',
    bidHistory: [
      { bidderId: 'b2', bidderName: '暗影会', amount: 76000, timestamp: Date.now() - 3600000 * 6 },
      { bidderId: 'b3', bidderName: '黄金之手', amount: 78000, timestamp: Date.now() - 3600000 * 3 },
    ],
    isAuction: true,
  },
  {
    id: 'to-004',
    sellerId: 's4',
    sellerName: '疾风骑士',
    itemType: 'contract',
    itemData: { id: 'ct-002', name: '骑将·疾风合同', rarity: 'rare', icon: '💨', description: '稀有级骑兵将领合同，速度专精' },
    price: 34500,
    suggestedPriceRange: [28000, 42000],
    listedAt: Date.now() - 3600000 * 6,
    expiresAt: Date.now() + 86400000 * 2,
    status: 'active',
    bidHistory: [],
    isAuction: false,
  },
  {
    id: 'to-005',
    sellerId: 's5',
    sellerName: '星辰商会',
    itemType: 'material',
    itemData: { id: 'mt-001', name: '魔力水晶 x100', rarity: 'uncommon', icon: '🔷', description: '高级魔法研究必需品' },
    price: 18500,
    suggestedPriceRange: [15000, 22000],
    listedAt: Date.now() - 3600000 * 2,
    expiresAt: Date.now() + 86400000 * 5,
    status: 'active',
    bidHistory: [],
    isAuction: false,
  },
];

export const mockNews: NewsItem[] = [
  { id: 'n1', type: 'mobilization', title: '⚡ 全服战争动员！', content: '巨龙骑兵图纸高价成交，当日招募效率+25%！', timestamp: Date.now() - 120000, data: { bonus: 25 } },
  { id: 'n2', type: 'battle', title: '🔥 史诗大捷', content: '「暗影龙骑士团」击败「深渊领主」，斩获3847积分！', timestamp: Date.now() - 300000, data: { winner: '暗影龙骑士团', points: 3847 } },
  { id: 'n3', type: 'trade', title: '💰 天价交易', content: '传奇「巨龙骑兵图纸」以185,000金币成交！', timestamp: Date.now() - 900000, data: { item: '巨龙骑兵图纸', price: 185000 } },
  { id: 'n4', type: 'battle', title: '⚔️ 白金对决', content: '「星陨军团」与「雷霆之锤」激战至第12回合，难分胜负！', timestamp: Date.now() - 1800000 },
  { id: 'n5', type: 'system', title: '📢 赛季公告', content: 'S3赛季还剩14天结束，限定军旗「凤凰之翼」等你领取！', timestamp: Date.now() - 3600000 },
  { id: 'n6', type: 'trade', title: '✨ 稀有出售', content: '史诗「大法师·银月合同」上架，仅需92,000金币！', timestamp: Date.now() - 5400000 },
];

export const mockRanking: { power: RankEntry[]; points: RankEntry[]; contribution: RankEntry[] } = {
  power: [
    { rank: 1, id: 'l1', name: '龙炎帝国', value: 584200, previousRank: 1, change: 0, metadata: { members: 48, tier: 'master' as RankTier } },
    { rank: 2, id: 'l2', name: '星辰圣殿', value: 512800, previousRank: 3, change: 1, metadata: { members: 52, tier: 'master' as RankTier } },
    { rank: 3, id: 'l3', name: '深渊军团', value: 489600, previousRank: 2, change: -1, metadata: { members: 45, tier: 'master' as RankTier } },
    { rank: 4, id: 'l4', name: '雷霆之锤', value: 425300, previousRank: 4, change: 0, metadata: { members: 38, tier: 'diamond' as RankTier } },
    { rank: 5, id: 'l5', name: '暗影龙骑士团', value: 284650, previousRank: 7, change: 2, metadata: { members: 8, tier: 'platinum' as RankTier } },
    { rank: 6, id: 'l6', name: '北方守望者', value: 268900, previousRank: 5, change: -1, metadata: { members: 32, tier: 'platinum' as RankTier } },
    { rank: 7, id: 'l7', name: '翡翠林地', value: 245100, previousRank: 6, change: -1, metadata: { members: 28, tier: 'platinum' as RankTier } },
    { rank: 8, id: 'l8', name: '黄金之手', value: 212800, previousRank: 10, change: 2, metadata: { members: 25, tier: 'gold' as RankTier } },
    { rank: 9, id: 'l9', name: '铁血兄弟会', value: 198500, previousRank: 8, change: -1, metadata: { members: 20, tier: 'gold' as RankTier } },
    { rank: 10, id: 'l10', name: '紫焰法师塔', value: 187200, previousRank: 9, change: -1, metadata: { members: 15, tier: 'gold' as RankTier } },
  ],
  points: [
    { rank: 1, id: 'p1', name: '龙炎帝国', value: 28450, previousRank: 1, change: 0, metadata: { wins: 87, tier: 'master' as RankTier } },
    { rank: 2, id: 'p2', name: '暗影龙骑士团', value: 24890, previousRank: 4, change: 2, metadata: { wins: 72, tier: 'platinum' as RankTier } },
    { rank: 3, id: 'p3', name: '星辰圣殿', value: 23640, previousRank: 2, change: -1, metadata: { wins: 68, tier: 'master' as RankTier } },
    { rank: 4, id: 'p4', name: '深渊军团', value: 21250, previousRank: 3, change: -1, metadata: { wins: 65, tier: 'master' as RankTier } },
    { rank: 5, id: 'p5', name: '雷霆之锤', value: 18720, previousRank: 5, change: 0, metadata: { wins: 58, tier: 'diamond' as RankTier } },
  ],
  contribution: [
    { rank: 1, id: 'c1', name: '星辰圣殿', value: 156800, previousRank: 2, change: 1, metadata: { research: 12 } },
    { rank: 2, id: 'c2', name: '龙炎帝国', value: 148200, previousRank: 1, change: -1, metadata: { research: 15 } },
    { rank: 3, id: 'c3', name: '暗影龙骑士团', value: 98560, previousRank: 3, change: 0, metadata: { research: 5 } },
    { rank: 4, id: 'c4', name: '深渊军团', value: 87300, previousRank: 4, change: 0, metadata: { research: 8 } },
    { rank: 5, id: 'c5', name: '黄金之手', value: 76450, previousRank: 6, change: 1, metadata: { research: 6 } },
  ],
};

const generateHeatmapData = () => {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const units = ['步兵', '骑兵', '法师', '弓手', '刺客', '祭司'];
  const data: { x: number; y: number; value: number; label: string }[] = [];
  for (let y = 0; y < units.length; y++) {
    for (let x = 0; x < days.length; x++) {
      data.push({ x, y, value: Math.floor(Math.random() * 100), label: units[y] });
    }
  }
  return data;
};

const generateWinRateCurve = () => {
  const points: { date: string; timestamp: number; value: number; label?: string }[] = [];
  const now = Date.now();
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now - i * 86400000);
    points.push({
      date: `${d.getMonth() + 1}/${d.getDate()}`,
      timestamp: d.getTime(),
      value: 45 + Math.floor(Math.random() * 25),
    });
  }
  return points;
};

export const mockWarReport: WarReport = {
  periodStart: Date.now() - 86400000 * 14,
  periodEnd: Date.now(),
  unitUsageHeatmap: generateHeatmapData(),
  winRateCurve: generateWinRateCurve(),
  priceTrends: [
    { itemId: 'bp-001', itemName: '传奇骑兵图纸', currentPrice: 185000, change: 8.5, prices: generateWinRateCurve().map(p => ({ ...p, value: 150000 + p.value * 500 })) },
    { itemId: 'bp-002', itemName: '史诗步兵图纸', currentPrice: 78000, change: -3.2, prices: generateWinRateCurve().map(p => ({ ...p, value: 75000 + p.value * 200 })) },
    { itemId: 'ct-001', itemName: '史诗法师合同', currentPrice: 92000, change: 12.4, prices: generateWinRateCurve().map(p => ({ ...p, value: 80000 + p.value * 300 })) },
  ],
  topLegions: mockRanking.power.slice(0, 5),
  battleStatistics: {
    totalBattles: 1247,
    wins: 782,
    losses: 412,
    draws: 53,
    averageCasualties: 18.5,
    mostUsedUnit: '龙骑突击骑兵',
    mostEffectiveFormation: '锥形冲锋阵',
  },
  generatedAt: Date.now(),
};

export { generateId, rarityColors };
