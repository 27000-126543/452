import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Map, Mountain, CloudSun, Trees, Waves, Wind, Play, RotateCcw, Crosshair,
  Shield, Sword, Wand2, Crown, Move, Layers, Target, Eye, Zap, TrendingUp
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { Badge, RarityBadge } from '@/components/ui/Badge';
import { useArmyStore, useBattleStore } from '@/store';
import { terrains, weathers, generateId } from '@/data/mockData';
import { simulateBattleRound, createBattleUnit } from '@/engines/combatEngine';
import type { TerrainType, WeatherType, HexCoord, UnitType } from '@/types';
import { clsx } from 'clsx';

interface HexCellData {
  coord: HexCoord;
  terrain: TerrainType;
  unit?: { icon: string; name: string; type: UnitType; count: number; side: 'player' | 'enemy' };
}

const terrainIcons: Record<TerrainType, string> = {
  plain: '🌾', forest: '🌲', mountain: '⛰️', desert: '🏜️', swamp: '🌿',
};
const weatherIcons: Record<WeatherType, string> = {
  sunny: '☀️', rain: '🌧️', fog: '🌫️', snow: '❄️', storm: '⛈️',
};

function generateHexGrid(): HexCellData[] {
  const cells: HexCellData[] = [];
  const terrainTypes: TerrainType[] = ['plain', 'forest', 'mountain', 'desert', 'swamp'];
  for (let r = 0; r < 6; r++) {
    for (let q = 0; q < 7; q++) {
      cells.push({
        coord: { q, r },
        terrain: terrainTypes[Math.floor(Math.random() * terrainTypes.length)],
      });
    }
  }
  cells.filter(c => c.coord.r === 0).forEach(c => c.terrain = 'plain');
  cells.filter(c => c.coord.r === 5).forEach(c => c.terrain = 'plain');
  return cells;
}

export default function SandboxPage() {
  const { units, composition, generals } = useArmyStore();
  const { currentBattle, setCurrentBattle } = useBattleStore();
  const [grid] = useState<HexCellData[]>(() => generateHexGrid());
  const [terrain, setTerrain] = useState<TerrainType>('plain');
  const [weather, setWeather] = useState<WeatherType>('sunny');
  const [battlePhase, setBattlePhase] = useState<'setup' | 'active' | 'ended'>('setup');
  const [simulation, setSimulation] = useState<any>(null);
  const [logs, setLogs] = useState<string[]>([]);

  const general = generals.find(g => g.id === composition.generalId);
  const playerUnits = units.filter(u =>
    (composition.infantry.unitId === u.id && composition.infantry.count > 0) ||
    (composition.cavalry.unitId === u.id && composition.cavalry.count > 0) ||
    (composition.mages.unitId === u.id && composition.mages.count > 0)
  );

  const gridWithUnits = useMemo(() => {
    if (!simulation) return grid;
    return grid.map(cell => {
      const pu = simulation?.playerArmy?.units?.find(
        (u: any) => u.position?.q === cell.coord.q && u.position?.r === cell.coord.r && u.currentCount > 0
      );
      const eu = simulation?.enemyArmy?.units?.find(
        (u: any) => u.position?.q === cell.coord.q && u.position?.r === (5 - cell.coord.r) && u.currentCount > 0
      );
      if (pu) return { ...cell, unit: { ...pu, side: 'player' as const } };
      if (eu) return { ...cell, unit: { ...eu, side: 'enemy' as const } };
      return cell;
    });
  }, [grid, simulation]);

  const startSimulation = () => {
    const playerArmy: any = {
      legionName: '我方军团',
      legionBanner: { primary: '#7c3aed', secondary: '#d4af37', emblem: '🐉' },
      general,
      units: playerUnits.map((u, i) => createBattleUnit(u, { q: i % 3, r: 4 + Math.floor(i / 3) })),
      formationIntegrity: 100,
      totalPower: composition.totalPower,
      skillCooldowns: {},
      surpriseTroops: 300,
    };
    const battle = {
      id: generateId(),
      playerArmy,
      enemyArmy: {
        legionName: '敌方军团',
        legionBanner: { primary: '#c62828', secondary: '#ff6b35', emblem: '💀' },
        general: generals[Math.floor(Math.random() * generals.length)],
        units: units.slice(0, 3).map((u, i) =>
          createBattleUnit({ ...u, count: 1000 + Math.floor(Math.random() * 2000) }, { q: i, r: 0 })
        ),
        formationIntegrity: 100,
        totalPower: composition.totalPower * (0.9 + Math.random() * 0.2),
        skillCooldowns: {},
        surpriseTroops: 0,
      },
      currentTurn: 0,
      phase: 'preparation' as const,
      terrain,
      weather,
      activeSkills: [],
      log: [],
      winner: null,
      startTime: Date.now(),
      lastUpdate: Date.now(),
      rewards: null,
    };
    setSimulation(battle);
    setBattlePhase('active');
    setLogs(['⚔️ 推演开始！']);
    setCurrentBattle(battle);
  };

  useEffect(() => {
    if (battlePhase !== 'active' || !simulation) return;
    const timer = setInterval(() => {
      setSimulation(prev => {
        if (!prev) return prev;
        const result = simulateBattleRound(prev);
        setLogs(l => [...l, ...result.newLogs.slice(-3).map(x => x.message)]);
        if (result.state.phase === 'ended') {
          setBattlePhase('ended');
        }
        return result.state;
      });
    }, 2500);
    return () => clearInterval(timer);
  }, [battlePhase, simulation?.id]); // eslint-disable-line

  const reset = () => {
    setBattlePhase('setup');
    setSimulation(null);
    setLogs([]);
    setCurrentBattle(null);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-8" icon={<Map className="w-5 h-5" />} title="战术沙盘" subtitle="六边形网格部署与推演">
          <div className="mb-4 flex flex-wrap gap-3 items-center justify-between">
            <div className="flex items-center gap-4 flex-wrap">
              <div>
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <Mountain className="w-3 h-3" /> 地形设置
                </p>
                <div className="flex gap-1">
                  {terrains.map(t => (
                    <button
                      key={t.type}
                      onClick={() => setTerrain(t.type)}
                      className={clsx(
                        'w-10 h-10 rounded-lg text-lg flex items-center justify-center border transition-all',
                        terrain === t.type
                          ? 'bg-magic-purple/40 border-magic-gold shadow-gold-glow scale-110'
                          : 'bg-magic-panel/60 border-magic-border hover:border-magic-gold/40'
                      )}
                      title={t.name}
                    >
                      {terrainIcons[t.type]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1">
                  <CloudSun className="w-3 h-3" /> 天气设置
                </p>
                <div className="flex gap-1">
                  {weathers.map(w => (
                    <button
                      key={w.type}
                      onClick={() => setWeather(w.type)}
                      className={clsx(
                        'w-10 h-10 rounded-lg text-lg flex items-center justify-center border transition-all',
                        weather === w.type
                          ? 'bg-magic-blue/20 border-magic-blue shadow-blue-glow scale-110'
                          : 'bg-magic-panel/60 border-magic-border hover:border-magic-blue/40'
                      )}
                      title={w.name}
                    >
                      {weatherIcons[w.type]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              {battlePhase === 'setup' && (
                <Button variant="primary" icon={<Play className="w-4 h-4" />} onClick={startSimulation}>
                  开始推演
                </Button>
              )}
              {battlePhase !== 'setup' && (
                <Button variant="danger" icon={<RotateCcw className="w-4 h-4" />} onClick={reset}>
                  重置沙盘
                </Button>
              )}
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-br from-magic-bg/80 via-magic-panel/40 to-magic-bg/80 border border-magic-border overflow-auto">
            <div className="inline-flex flex-col gap-1 mx-auto" style={{ transform: 'translateX(28px)' }}>
              {[0, 1, 2, 3, 4, 5].map(rowIdx => (
                <div
                  key={rowIdx}
                  className="flex gap-1"
                  style={{ marginLeft: rowIdx % 2 === 1 ? 30 : 0 }}
                >
                  {[0, 1, 2, 3, 4, 5, 6].filter(q => true).map(q => {
                    const cell = gridWithUnits.find(c => c.coord.r === rowIdx && c.coord.q === q);
                    if (!cell) return null;
                    const terrainInfo = terrains.find(t => t.type === cell.terrain)!;
                    const isPlayerSide = cell.coord.r >= 3;
                    return (
                      <motion.div
                        key={`${q}-${rowIdx}`}
                        whileHover={{ scale: 1.1, zIndex: 10 }}
                        className={clsx(
                          'hex-cell border-2 text-xs font-display',
                          cell.unit?.side === 'player' && 'border-magic-gold shadow-gold-glow ring-2 ring-magic-gold/40 z-10',
                          cell.unit?.side === 'enemy' && 'border-magic-blood shadow-flame-glow ring-2 ring-magic-blood/40 z-10',
                          !cell.unit && 'border-magic-border/60 hover:border-magic-gold/50'
                        )}
                        style={{
                          background: `linear-gradient(135deg, ${terrainInfo.color}33, ${terrainInfo.color}55)`,
                        }}
                      >
                        {cell.unit ? (
                          <div className="text-center">
                            <div className="text-xl leading-none">{cell.unit.icon}</div>
                            {cell.unit.side === 'player' ? (
                              <div className="text-[9px] font-mono text-magic-gold mt-0.5 font-bold">{cell.unit.count}</div>
                            ) : (
                              <div className="text-[9px] font-mono text-red-300 mt-0.5 font-bold">{cell.unit.count}</div>
                            )}
                          </div>
                        ) : (
                          <div className="text-lg opacity-60">{terrainIcons[cell.terrain]}</div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="mt-4 flex justify-between text-xs text-gray-400 font-display px-8">
              <span className="text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3" /> 敌方阵地
              </span>
              <span className="text-emerald-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <Crown className="w-3 h-3" /> 我方阵地
              </span>
            </div>
          </div>

          {simulation && (
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border border-magic-gold/40 bg-gradient-to-r from-magic-gold/10 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-display font-bold text-magic-gold flex items-center gap-2">
                    <Crown className="w-4 h-4" /> 我方军团
                  </p>
                  <span className="font-mono font-bold text-magic-gold">
                    阵型: {simulation.playerArmy.formationIntegrity}%
                  </span>
                </div>
                <ProgressBar value={simulation.playerArmy.formationIntegrity} max={100} color="gold" size="sm" showValue={false} />
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  {simulation.playerArmy.units?.map((u: any) => (
                    <div key={u.unitId} className="p-1.5 rounded bg-magic-bg/60 text-center">
                      <div className="text-lg">{u.icon}</div>
                      <p className="font-mono font-bold text-magic-gold text-sm">
                        {u.currentCount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        -{u.casualties.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 rounded-xl border border-magic-blood/40 bg-gradient-to-l from-magic-blood/10 to-transparent">
                <div className="flex items-center justify-between mb-2">
                  <p className="font-display font-bold text-red-400 flex items-center gap-2">
                    <Target className="w-4 h-4" /> 敌方军团
                  </p>
                  <span className="font-mono font-bold text-red-400">
                    阵型: {simulation.enemyArmy.formationIntegrity}%
                  </span>
                </div>
                <ProgressBar value={simulation.enemyArmy.formationIntegrity} max={100} color="red" size="sm" showValue={false} />
                <div className="grid grid-cols-3 gap-2 mt-3 text-xs">
                  {simulation.enemyArmy.units?.map((u: any) => (
                    <div key={u.unitId} className="p-1.5 rounded bg-magic-bg/60 text-center">
                      <div className="text-lg">{u.icon}</div>
                      <p className="font-mono font-bold text-red-300 text-sm">
                        {u.currentCount.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-500">
                        -{u.casualties.toLocaleString()}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>

        <div className="col-span-12 xl:col-span-4 space-y-6">
          <Card icon={<Layers className="w-5 h-5" />} title="部队部署" subtitle="当前配置的编制">
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-magic-panel/60 border border-magic-border">
                <div className="text-3xl">{general?.portrait || '👑'}</div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-gray-100 text-sm truncate">{general?.name || '未任命'}</p>
                  {general && <RarityBadge rarity={general.rarity} />}
                </div>
              </div>

              {([
                { key: 'infantry', slot: composition.infantry, icon: Shield, label: '步兵' },
                { key: 'cavalry', slot: composition.cavalry, icon: Sword, label: '骑兵' },
                { key: 'mage', slot: composition.mages, icon: Wand2, label: '法师' },
              ] as const).map(s => {
                const u = units.find(x => x.id === s.slot.unitId);
                return (
                  <div key={s.key} className="p-3 rounded-lg bg-magic-panel/60 border border-magic-border">
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{u?.icon || '❓'}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <s.icon className="w-3.5 h-3.5 text-gray-400" />
                          <p className="font-semibold text-sm text-gray-200 truncate">
                            {u?.name || `${s.label}未配置`}
                          </p>
                        </div>
                        <p className="text-xs font-mono text-magic-gold mt-0.5">
                          {u ? `${s.slot.count.toLocaleString()} 人` : '—'}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card icon={<Eye className="w-5 h-5" />} title="推演日志" subtitle={`回合: ${simulation?.currentTurn || 0}`}>
            <div className="max-h-[280px] overflow-y-auto space-y-1.5 pr-2">
              {logs.length === 0 ? (
                <p className="text-center text-gray-500 py-8 text-sm">开始推演后显示战斗日志...</p>
              ) : (
                logs.slice().reverse().map((log, i) => (
                  <AnimatePresence key={i}>
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="news-item text-xs py-2 !mb-1"
                    >
                      <span className="text-gray-400">[{logs.length - i}]</span> {log}
                    </motion.div>
                  </AnimatePresence>
                ))
              )}
            </div>
          </Card>

          <Card icon={<Zap className="w-5 h-5" />} title="操作提示">
            <ul className="space-y-2 text-xs text-gray-400">
              {[
                { icon: <Move className="w-3 h-3" />, text: '选择地形与天气，影响双方战力' },
                { icon: <Crosshair className="w-3 h-3" />, text: '点击开始推演，自动进行战斗模拟' },
                { icon: <TrendingUp className="w-3 h-3" />, text: '实时观察兵力折损和阵型完整度' },
                { icon: <RotateCcw className="w-3 h-3" />, text: '随时重置沙盘尝试不同配置' },
              ].map((t, i) => (
                <li key={i} className="flex items-start gap-2 p-1.5 rounded hover:bg-magic-panel/50">
                  <span className="text-magic-gold shrink-0 mt-0.5">{t.icon}</span>
                  {t.text}
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="col-span-1">
          <Card className="h-full">
            <Trees className="w-5 h-5 text-emerald-400 inline mr-2" />
            <span className="font-display font-bold text-magic-goldLight">地形加成说明</span>
            <ul className="mt-3 space-y-1.5 text-xs text-gray-400">
              {terrains.map(t => (
                <li key={t.type} className="flex items-center gap-2 p-1.5 rounded bg-magic-panel/40">
                  <span className="text-lg">{terrainIcons[t.type]}</span>
                  <div>
                    <p className="text-gray-200 font-semibold">{t.name}</p>
                    <p className="text-[10px]">{t.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="col-span-1">
          <Card className="h-full">
            <Wind className="w-5 h-5 text-sky-400 inline mr-2" />
            <span className="font-display font-bold text-magic-goldLight">天气效果说明</span>
            <ul className="mt-3 space-y-1.5 text-xs text-gray-400">
              {weathers.map(w => (
                <li key={w.type} className="flex items-center gap-2 p-1.5 rounded bg-magic-panel/40">
                  <span className="text-lg">{weatherIcons[w.type]}</span>
                  <div>
                    <p className="text-gray-200 font-semibold">{w.name}</p>
                    <p className="text-[10px]">{w.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
        <div className="col-span-1">
          <Card className="h-full">
            <Sword className="w-5 h-5 text-amber-400 inline mr-2" />
            <span className="font-display font-bold text-magic-goldLight">兵种克制关系</span>
            <div className="mt-4 flex justify-center items-center">
              <div className="relative w-48 h-48">
                {[
                  { icon: Shield, label: '步兵', pos: 'top-2 left-1/2 -translate-x-1/2', color: 'text-emerald-400' },
                  { icon: Sword, label: '骑兵', pos: 'bottom-8 right-0', color: 'text-amber-400' },
                  { icon: Wand2, label: '法师', pos: 'bottom-8 left-0', color: 'text-purple-400' },
                ].map((t, i, arr) => {
                  const next = arr[(i + 1) % arr.length];
                  return (
                    <div key={i} className={`absolute ${t.pos} text-center`}>
                      <div className={`w-14 h-14 rounded-full bg-magic-panel border-2 border-current ${t.color} flex items-center justify-center shadow-lg`}>
                        <t.icon className="w-6 h-6" />
                      </div>
                      <p className="font-display font-bold text-xs mt-1 text-gray-200">{t.label}</p>
                      <p className="text-[10px] text-magic-gold">克制 {next.label}</p>
                    </div>
                  );
                })}
                <Badge variant="info" className="absolute bottom-0 left-1/2 -translate-x-1/2">克制 +25% 伤害</Badge>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
