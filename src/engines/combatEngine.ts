import type {
  Unit,
  ArmyComposition,
  General,
  Formation,
  BattleUnit,
  BattleSide,
  BattleState,
  BattleLogEntry,
  TerrainType,
  WeatherType,
  UnitType,
} from '@/types';
import { terrains, weathers } from '@/data/mockData';

export const calculateUnitPower = (unit: Unit, generalBonus = 0, formationBonus = 0): number => {
  const stats = unit.baseStats;
  const rarityMultiplier: Record<string, number> = {
    common: 1, uncommon: 1.3, rare: 1.7, epic: 2.3, legendary: 3.2,
  };
  const rarity = rarityMultiplier[unit.rarity] || 1;
  const levelBonus = 1 + (unit.level - 1) * 0.08;
  const basePower = (stats.attack + stats.defense + stats.hp * 0.5 + stats.magicPower * 1.5 + stats.speed * 0.8) * rarity * levelBonus;
  const countMultiplier = Math.pow(unit.count, 0.75) / 100;
  const totalBonus = 1 + (generalBonus + formationBonus) / 100;
  return Math.floor(basePower * countMultiplier * totalBonus);
};

export const applyTerrainModifier = (basePower: number, unitType: UnitType, terrain: TerrainType): number => {
  const info = terrains.find(t => t.type === terrain);
  if (!info) return basePower;
  let modifier = 1;
  switch (unitType) {
    case 'infantry':
      modifier = terrain === 'forest' || terrain === 'mountain' ? info.defenseModifier : 1;
      break;
    case 'cavalry':
      modifier = terrain === 'plain' || terrain === 'desert' ? info.speedModifier * 1.1 : info.speedModifier;
      break;
    case 'mages':
      modifier = terrain === 'mountain' ? 0.85 : 1;
      break;
  }
  return Math.floor(basePower * modifier);
};

export const applyWeatherModifier = (basePower: number, unitType: UnitType, weather: WeatherType): number => {
  const info = weathers.find(w => w.type === weather);
  if (!info) return basePower;
  let modifier = 1;
  if (unitType === 'mages') {
    modifier = info.magicModifier;
  } else if (unitType === 'cavalry') {
    modifier = 1 - (1 - info.visibilityModifier) * 0.5;
  }
  return Math.floor(basePower * modifier);
};

export const calculateMatchupBonus = (attackerType: UnitType, defenderType: UnitType): number => {
  const advantages: Record<UnitType, UnitType> = {
    infantry: 'cavalry',
    cavalry: 'mages',
    mages: 'infantry',
  };
  if (advantages[attackerType] === defenderType) return 1.25;
  if (advantages[defenderType] === attackerType) return 0.8;
  return 1;
};

export const calculateArmyPower = (
  composition: ArmyComposition,
  units: Unit[],
  general: General | null,
  formation: Formation | null,
  terrain: TerrainType = 'plain',
  weather: WeatherType = 'sunny',
): { totalPower: number; breakdown: Record<UnitType | 'general', number> } => {
  const breakdown: Record<UnitType | 'general', number> = {
    infantry: 0, cavalry: 0, mages: 0, general: 0,
  };
  const generalBonus = general ? general.attackBonus + general.defenseBonus : 0;
  const formationBonus = formation ? (formation.bonuses.attackBonus + formation.bonuses.defenseBonus) / 2 : 0;

  const typeMap: Array<[UnitType, string | null]> = [
    ['infantry', composition.infantry.unitId],
    ['cavalry', composition.cavalry.unitId],
    ['mages', composition.mages.unitId],
  ];

  typeMap.forEach(([type, unitId]) => {
    if (!unitId) return;
    const unit = units.find(u => u.id === unitId);
    if (!unit) return;
    let power = calculateUnitPower(unit, generalBonus, formationBonus);
    power = applyTerrainModifier(power, type, terrain);
    power = applyWeatherModifier(power, type, weather);
    breakdown[type] = power;
  });

  if (general) {
    breakdown.general = Math.floor((general.commandCap + general.moraleBoost * 100) * (general.rarity === 'legendary' ? 3 : general.rarity === 'epic' ? 2.2 : general.rarity === 'rare' ? 1.6 : 1.2));
  }

  const totalPower = Object.values(breakdown).reduce((sum, v) => sum + v, 0);
  return { totalPower, breakdown };
};

export const calculateCasualties = (
  attackPower: number,
  defenseValue: number,
  unitCount: number,
  isMatchup: boolean,
): number => {
  const effectiveDamage = attackPower / Math.max(defenseValue, 50);
  const matchupMultiplier = isMatchup ? 1.2 : 1;
  const randomFactor = 0.85 + Math.random() * 0.3;
  const casualtiesPercent = Math.min(effectiveDamage * matchupMultiplier * randomFactor * 0.06, 0.4);
  return Math.max(1, Math.floor(unitCount * casualtiesPercent));
};

export const updateMorale = (currentMorale: number, casualties: number, totalCount: number, wonEngagement: boolean): number => {
  const lossRatio = casualties / totalCount;
  const moraleChange = wonEngagement
    ? Math.max(0, 5 - lossRatio * 20)
    : -5 - lossRatio * 40;
  return Math.max(0, Math.min(100, currentMorale + moraleChange));
};

export const consumeSupplies = (totalUnits: number, turn: number): number => {
  return Math.floor(totalUnits * 0.02 * (1 + turn * 0.05));
};

export const evaluateFormation = (formation: Formation, damagedSlots: Set<string>): number => {
  const totalSlots = formation.slots.filter(s => s.enabled).length;
  const intactSlots = totalSlots - damagedSlots.size;
  return Math.floor((intactSlots / totalSlots) * 100);
};

export const createBattleUnit = (unit: Unit, position: { q: number; r: number }): BattleUnit => {
  const multiplier = { common: 1, uncommon: 1.2, rare: 1.5, epic: 2, legendary: 3 }[unit.rarity] || 1;
  return {
    unitId: unit.id,
    name: unit.name,
    type: unit.type,
    initialCount: unit.count,
    currentCount: unit.count,
    casualties: 0,
    attack: Math.floor(unit.baseStats.attack * multiplier * (1 + unit.level * 0.05)),
    defense: Math.floor(unit.baseStats.defense * multiplier * (1 + unit.level * 0.05)),
    hp: Math.floor(unit.baseStats.hp * multiplier * (1 + unit.level * 0.06)),
    maxHp: Math.floor(unit.baseStats.hp * multiplier * (1 + unit.level * 0.06)),
    morale: 90 + Math.floor(Math.random() * 10),
    position,
    statusEffects: [],
    icon: unit.icon,
  };
};

export const simulateBattleRound = (battle: BattleState): { state: BattleState; newLogs: BattleLogEntry[] } => {
  const newLogs: BattleLogEntry[] = [];
  const now = Date.now();
  const turn = battle.currentTurn + 1;

  const playerUnits = [...battle.playerArmy.units];
  const enemyUnits = [...battle.enemyArmy.units];

  playerUnits.forEach(pUnit => {
    if (pUnit.currentCount <= 0) return;
    const targets = enemyUnits.filter(e => e.currentCount > 0);
    if (targets.length === 0) return;
    const target = targets[Math.floor(Math.random() * targets.length)];
    const matchupMult = calculateMatchupBonus(pUnit.type, target.type);
    const totalAttack = pUnit.attack * pUnit.currentCount * matchupMult * (pUnit.morale / 100);
    const totalDefense = target.defense * target.currentCount;
    const casualties = calculateCasualties(totalAttack, totalDefense, target.currentCount, matchupMult > 1);
    target.currentCount = Math.max(0, target.currentCount - casualties);
    target.casualties += casualties;
    target.morale = updateMorale(target.morale, casualties, target.initialCount, false);
    pUnit.morale = updateMorale(pUnit.morale, 0, pUnit.initialCount, true);

    newLogs.push({
      turn,
      timestamp: now,
      type: 'casualty',
      side: 'player',
      message: `${pUnit.icon} ${pUnit.name} 向 ${target.icon} ${target.name} 发动攻击，造成 ${casualties} 人伤亡！`,
      data: { attacker: pUnit.unitId, target: target.unitId, casualties },
    });
  });

  enemyUnits.forEach(eUnit => {
    if (eUnit.currentCount <= 0) return;
    const targets = playerUnits.filter(p => p.currentCount > 0);
    if (targets.length === 0) return;
    const target = targets[Math.floor(Math.random() * targets.length)];
    const matchupMult = calculateMatchupBonus(eUnit.type, target.type);
    const totalAttack = eUnit.attack * eUnit.currentCount * matchupMult * (eUnit.morale / 100);
    const totalDefense = target.defense * target.currentCount;
    const casualties = calculateCasualties(totalAttack, totalDefense, target.currentCount, matchupMult > 1);
    target.currentCount = Math.max(0, target.currentCount - casualties);
    target.casualties += casualties;
    target.morale = updateMorale(target.morale, casualties, target.initialCount, false);
    eUnit.morale = updateMorale(eUnit.morale, 0, eUnit.initialCount, true);

    newLogs.push({
      turn,
      timestamp: now,
      type: 'casualty',
      side: 'enemy',
      message: `${eUnit.icon} ${eUnit.name} 反击 ${target.icon} ${target.name}，造成 ${casualties} 人伤亡！`,
      data: { attacker: eUnit.unitId, target: target.unitId, casualties },
    });
  });

  const calcSidePower = (units: BattleUnit[]) =>
    units.reduce((sum, u) => sum + u.currentCount * (u.attack + u.defense) * (u.morale / 100), 0);
  const playerPower = calcSidePower(playerUnits);
  const enemyPower = calcSidePower(enemyUnits);

  const damagedSlotsP = new Set<string>();
  const damagedSlotsE = new Set<string>();
  const playerIntegrity = 100 - Math.floor((1 - playerPower / (playerPower + enemyPower + 1)) * 50);
  const enemyIntegrity = 100 - Math.floor((1 - enemyPower / (playerPower + enemyPower + 1)) * 50);

  const newState: BattleState = {
    ...battle,
    currentTurn: turn,
    playerArmy: { ...battle.playerArmy, units: playerUnits, formationIntegrity: Math.max(20, playerIntegrity) },
    enemyArmy: { ...battle.enemyArmy, units: enemyUnits, formationIntegrity: Math.max(20, enemyIntegrity) },
    log: [...battle.log, ...newLogs],
    lastUpdate: now,
  };

  if (playerUnits.every(u => u.currentCount <= 0) || enemyUnits.every(u => u.currentCount <= 0) || turn >= 30) {
    newState.phase = 'ended';
    newState.winner = playerPower > enemyPower ? 'player' : enemyPower > playerPower ? 'enemy' : 'draw';
    const basePoints = 100;
    const points = newState.winner === 'player' ? basePoints + Math.floor(Math.random() * 100) :
                   newState.winner === 'draw' ? 40 : 15;
    newState.rewards = {
      points,
      gold: newState.winner === 'player' ? 5000 + Math.floor(Math.random() * 8000) : 1500,
      blueprints: newState.winner === 'player' && Math.random() > 0.6 ? ['bp-random-' + Math.floor(Math.random() * 100)] : [],
      exp: newState.winner === 'player' ? 500 : 150,
    };
    newLogs.push({
      turn,
      timestamp: now,
      type: 'system',
      side: 'neutral',
      message: newState.winner === 'player' ? '🎉 战斗胜利！获得丰厚奖励！' :
               newState.winner === 'enemy' ? '💀 战斗失败，整顿旗鼓再战！' :
               '🤝 双方势均力敌，握手言和！',
    });
  }

  // Avoid unused variable warning
  void evaluateFormation;
  void damagedSlotsP;
  void damagedSlotsE;

  return { state: newState, newLogs };
};

export const calculatePowerRating = (armyPower: number, rank: string, winRate: number): number => {
  const rankBonus: Record<string, number> = { bronze: 0, silver: 200, gold: 500, platinum: 1000, diamond: 1800, master: 3000 };
  return Math.floor(armyPower * 0.6 + (rankBonus[rank] || 0) + winRate * 2000);
};
