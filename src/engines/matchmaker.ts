import type { MatchmakingTicket, RankTier, BattleState, BattleSide, BattleUnit, UnitType } from '@/types';
import { mockGenerals, mockUnits, terrains, weathers, generateId } from '@/data/mockData';
import { calculatePowerRating, createBattleUnit, simulateBattleRound } from './combatEngine';

export { calculatePowerRating, simulateBattleRound };

const tierBaseRatings: Record<RankTier, number> = {
  bronze: 0,
  silver: 5000,
  gold: 15000,
  platinum: 35000,
  diamond: 65000,
  master: 100000,
};

const tierSearchRanges: Record<RankTier, number> = {
  bronze: 3000,
  silver: 5000,
  gold: 8000,
  platinum: 12000,
  diamond: 18000,
  master: 25000,
};

export const findMatch = (ticket: MatchmakingTicket, pool: MatchmakingTicket[]): MatchmakingTicket | null => {
  const searchRange = tierSearchRanges[ticket.tier] || 5000;
  const candidates = pool.filter(p =>
    p.id !== ticket.id &&
    p.status === 'queued' &&
    Math.abs(p.powerRating - ticket.powerRating) <= searchRange
  );
  if (candidates.length === 0) return null;
  candidates.sort((a, b) => Math.abs(a.powerRating - ticket.powerRating) - Math.abs(b.powerRating - ticket.powerRating));
  return candidates[0];
};

export const estimateWaitTime = (tier: RankTier, poolSize: number): number => {
  const base = tierBaseRatings[tier] ? 15 : 30;
  const poolFactor = Math.max(0.5, 1 - poolSize / 200);
  return Math.ceil(base * poolFactor + Math.random() * 10);
};

const enemyNames = [
  '深渊领主', '星陨军团', '雷霆之锤', '北方守望者',
  '翡翠林地', '铁血兄弟会', '紫焰法师塔', '寒霜帝国',
];

const enemyLegionEmblems = ['💀', '⭐', '⚡', '❄️', '🌿', '🔨', '🔮', '🐺'];

const generateEnemySide = (playerPower: number): BattleSide => {
  const powerRatio = 0.85 + Math.random() * 0.3;
  const targetPower = playerPower * powerRatio;
  const idx = Math.floor(Math.random() * enemyNames.length);
  const general = mockGenerals[Math.floor(Math.random() * mockGenerals.length)];

  const typePower = targetPower / 3;
  const createSideUnits = (): BattleUnit[] => {
    const units: BattleUnit[] = [];
    const types: UnitType[] = ['infantry', 'cavalry', 'mages'];
    types.forEach((type, i) => {
      const availableUnits = mockUnits.filter(u => u.type === type);
      const unit = availableUnits[Math.floor(Math.random() * availableUnits.length)] || mockUnits[i];
      const scaledCount = Math.floor(1000 + Math.random() * 2000);
      units.push(createBattleUnit({ ...unit, count: scaledCount }, { q: i, r: 0 }));
    });
    return units;
  };

  return {
    legionName: enemyNames[idx],
    legionBanner: { primary: '#1a1a2e', secondary: '#e94560', emblem: enemyLegionEmblems[idx] },
    general,
    units: createSideUnits(),
    formationIntegrity: 100,
    totalPower: Math.floor(targetPower),
    skillCooldowns: {},
    tacticalCooldowns: {},
    surpriseTroops: Math.floor(Math.random() * 500),
  };
};

export const createBattle = (playerSide: BattleSide): BattleState => {
  const terrainIdx = Math.floor(Math.random() * terrains.length);
  const weatherIdx = Math.floor(Math.random() * weathers.length);
  const enemy = generateEnemySide(playerSide.totalPower);

  const playerUnits: BattleUnit[] = mockUnits.map((u, i) =>
    createBattleUnit(u, { q: i % 3, r: Math.floor(i / 3) + 3 })
  );

  return {
    id: generateId(),
    playerArmy: {
      ...playerSide,
      units: playerUnits,
      formationIntegrity: 100,
    },
    enemyArmy: enemy,
    currentTurn: 0,
    phase: 'preparation',
    terrain: terrains[terrainIdx].type,
    weather: weathers[weatherIdx].type,
    activeSkills: [],
    log: [
      {
        turn: 0,
        timestamp: Date.now(),
        type: 'system',
        side: 'neutral',
        message: `⚔️ 战斗开始！地形：${terrains[terrainIdx].name}，天气：${weathers[weatherIdx].name}`,
      },
    ],
    winner: null,
    startTime: Date.now(),
    lastUpdate: Date.now(),
    rewards: null,
  };
};

export const updateMatchmakingPool = (pool: MatchmakingTicket[], ticket: MatchmakingTicket, action: 'add' | 'remove' | 'update'): MatchmakingTicket[] => {
  switch (action) {
    case 'add':
      return [...pool, ticket];
    case 'remove':
      return pool.filter(p => p.id !== ticket.id);
    case 'update':
      return pool.map(p => p.id === ticket.id ? ticket : p);
    default:
      return pool;
  }
};
