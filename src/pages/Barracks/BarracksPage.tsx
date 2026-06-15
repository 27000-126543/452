import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Sword, Shield, Wand2, Users, Crown, Plus, Minus, Zap, Star,
  TrendingUp, Eye, Target, Calculator, ChevronRight, RefreshCw, Coins
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { Badge, RarityBadge, RankBadge } from '@/components/ui/Badge';
import { PowerRadarChart } from '@/components/charts/Charts';
import { useArmyStore, usePlayerStore, useGlobalStore } from '@/store';
import { calculateArmyPower } from '@/engines/combatEngine';
import { terrains, weathers } from '@/data/mockData';
import type { General, Unit, UnitType, Formation, TerrainType, WeatherType, RadarData } from '@/types';
import { clsx } from 'clsx';

const unitTypeInfo: Record<UnitType, { label: string; icon: typeof Sword; color: string }> = {
  infantry: { label: '步兵', icon: Shield, color: 'text-emerald-400' },
  cavalry: { label: '骑兵', icon: Sword, color: 'text-amber-400' },
  mages: { label: '法师', icon: Wand2, color: 'text-purple-400' },
};

export default function BarracksPage() {
  const { generals, units, composition, formations, activeFormationId,
    setActiveFormation, updateGeneral, updateCompositionSlot, recruitUnit,
    levelUpGeneral, levelUpUnit } = useArmyStore();
  const player = usePlayerStore(s => s.player);
  const updateGold = usePlayerStore(s => s.updateGold);
  const { mobilizationActive, mobilizationBonus } = useGlobalStore();

  const [selectedTerrain, setSelectedTerrain] = useState<TerrainType>('plain');
  const [selectedWeather, setSelectedWeather] = useState<WeatherType>('sunny');
  const [selectedTab, setSelectedTab] = useState<'generals' | 'units'>('generals');
  const [selectedGeneral, setSelectedGeneral] = useState<string | null>(composition.generalId);
  const [recruitCounts, setRecruitCounts] = useState<Record<string, number>>({});

  const activeGeneral = generals.find(g => g.id === selectedGeneral);
  const activeFormation = formations.find(f => f.id === activeFormationId);

  const powerResult = useMemo(() => {
    return calculateArmyPower(composition, units, activeGeneral || null, activeFormation || null, selectedTerrain, selectedWeather);
  }, [composition, units, activeGeneral, activeFormation, selectedTerrain, selectedWeather]);

  const radarData: RadarData[] = useMemo(() => {
    const t = powerResult.totalPower || 1;
    return [
      { axis: '攻击', value: Math.min(100, 40 + powerResult.breakdown.infantry / t * 80), fullMark: 100 },
      { axis: '防御', value: Math.min(100, 50 + powerResult.breakdown.infantry / t * 80), fullMark: 100 },
      { axis: '机动', value: Math.min(100, powerResult.breakdown.cavalry / t * 200), fullMark: 100 },
      { axis: '魔法', value: Math.min(100, powerResult.breakdown.mages / t * 200), fullMark: 100 },
      { axis: '统帅', value: Math.min(100, powerResult.breakdown.general / t * 150), fullMark: 100 },
      { axis: '持久', value: Math.min(100, (composition.supplies / composition.maxSupplies) * 100), fullMark: 100 },
    ];
  }, [powerResult, composition]);

  const getUnitsByType = (type: UnitType) => units.filter(u => u.type === type);

  const handleAssignGeneral = (id: string | null) => {
    setSelectedGeneral(id);
    updateGeneral(id);
  };

  const handleUnitSelect = (type: UnitType, unitId: string | null, count?: number) => {
    if (unitId) {
      const u = units.find(x => x.id === unitId);
      updateCompositionSlot(type, unitId, count ?? u?.count ?? 0);
    } else {
      updateCompositionSlot(type, null, 0);
    }
  };

  const handleRecruit = (unitId: string, baseCost: number) => {
    const count = recruitCounts[unitId] || 100;
    const efficiencyBonus = mobilizationActive ? 1 + mobilizationBonus / 100 : 1;
    const actualCost = Math.ceil(count * baseCost / efficiencyBonus);
    if (player.gold < actualCost) return;
    updateGold(-actualCost);
    recruitUnit(unitId, count, Math.floor(count * 0.5));
    setRecruitCounts(prev => ({ ...prev, [unitId]: 0 }));
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-4" goldBorder icon={<Calculator className="w-5 h-5" />} title="战力计算器" subtitle="实时计算军团综合战斗力">
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-br from-magic-gold/10 via-magic-purple/10 to-transparent border border-magic-gold/30">
              <div>
                <p className="text-sm text-gray-400 font-display uppercase tracking-wider">综合战力</p>
                <p className="font-mono text-4xl font-bold glow-text-gold text-magic-gold mt-1">
                  {powerResult.totalPower.toLocaleString()}
                </p>
              </div>
              <div className="w-28 h-28 -my-2">
                <PowerRadarChart data={radarData} size={120} />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {(['infantry', 'cavalry', 'mages'] as UnitType[]).map(type => {
                const info = unitTypeInfo[type];
                const val = powerResult.breakdown[type];
                const pct = (val / (powerResult.totalPower || 1)) * 100;
                return (
                  <div key={type} className="p-3 rounded-lg bg-magic-panel/60 border border-magic-border">
                    <div className={`flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider ${info.color}`}>
                      <info.icon className="w-3.5 h-3.5" /> {info.label}
                    </div>
                    <p className="font-mono text-lg font-bold text-gray-100 mt-1">{val.toLocaleString()}</p>
                    <div className="mt-1 h-1 rounded-full bg-magic-bg overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-magic-purple to-magic-gold" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <Target className="w-4 h-4" /> 地形选择
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {terrains.map(t => (
                    <button
                      key={t.type}
                      onClick={() => setSelectedTerrain(t.type)}
                      className={clsx(
                        'p-2 rounded-lg text-xs font-display border transition-all',
                        selectedTerrain === t.type
                          ? 'bg-magic-purple/40 border-magic-gold text-magic-gold shadow-gold-glow'
                          : 'bg-magic-panel/50 border-magic-border text-gray-400 hover:border-magic-gold/40'
                      )}
                    >
                      {t.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {terrains.find(x => x.type === selectedTerrain)?.description}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-400 mb-2 flex items-center gap-2">
                  <Eye className="w-4 h-4" /> 天气选择
                </p>
                <div className="grid grid-cols-5 gap-1.5">
                  {weathers.map(w => (
                    <button
                      key={w.type}
                      onClick={() => setSelectedWeather(w.type)}
                      className={clsx(
                        'p-2 rounded-lg text-xs font-display border transition-all',
                        selectedWeather === w.type
                          ? 'bg-magic-blue/20 border-magic-blue text-magic-blue shadow-blue-glow'
                          : 'bg-magic-panel/50 border-magic-border text-gray-400 hover:border-magic-blue/40'
                      )}
                    >
                      {w.name}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1.5">
                  {weathers.find(x => x.type === selectedWeather)?.description}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="col-span-12 xl:col-span-8" icon={<Crown className="w-5 h-5" />} title="军团编制" subtitle="配置将领与三军兵力">
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display font-bold text-magic-goldLight flex items-center gap-2">
                  <Crown className="w-4 h-4" /> 统帅任命
                </h4>
                <span className="text-xs text-gray-500">点击将领卡片任命</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <GeneralCard
                  general={null}
                  selected={selectedGeneral === null}
                  onClick={() => handleAssignGeneral(null)}
                />
                {generals.map(g => (
                  <GeneralCard
                    key={g.id}
                    general={g}
                    selected={selectedGeneral === g.id}
                    onClick={() => handleAssignGeneral(g.id)}
                    onLevelUp={() => levelUpGeneral(g.id)}
                  />
                ))}
              </div>
            </div>

            <div className="rune-divider" />

            {(['infantry', 'cavalry', 'mages'] as UnitType[]).map(type => {
              const info = unitTypeInfo[type];
              const slot = composition[type];
              const selectedUnit = units.find(u => u.id === slot.unitId);
              const typeUnits = getUnitsByType(type);
              return (
                <div key={type}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-display font-bold flex items-center gap-2 ${info.color}`}>
                      <info.icon className="w-4 h-4" /> {info.label}编制
                    </h4>
                    <span className="text-xs font-mono text-gray-400">
                      {selectedUnit ? `${slot.count.toLocaleString()} / ${slot.maxCount.toLocaleString()}` : '未配置'}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <UnitCard
                      unit={null}
                      type={type}
                      selected={!slot.unitId}
                      onClick={() => handleUnitSelect(type, null)}
                    />
                    {typeUnits.map(u => (
                      <UnitCard
                        key={u.id}
                        unit={u}
                        type={type}
                        selected={slot.unitId === u.id}
                        onClick={() => handleUnitSelect(type, u.id)}
                        showRecruit={slot.unitId === u.id}
                        recruitCount={recruitCounts[u.id] || 0}
                        onRecruitCountChange={(n) => setRecruitCounts(prev => ({ ...prev, [u.id]: n }))}
                        onRecruit={() => handleRecruit(u.id, 8)}
                        onLevelUp={() => levelUpUnit(u.id)}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      </div>

      <Card icon={<RefreshCw className="w-5 h-5" />} title="阵型配置" subtitle="选择或切换预设作战阵型">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {formations.map(form => (
            <FormationCard
              key={form.id}
              formation={form}
              selected={activeFormationId === form.id}
              onSelect={() => setActiveFormation(form.id)}
            />
          ))}
        </div>
      </Card>
    </div>
  );
}

function GeneralCard({
  general, selected, onClick, onLevelUp,
}: {
  general: General | null;
  selected: boolean;
  onClick: () => void;
  onLevelUp?: () => void;
}) {
  return (
    <motion.button
      whileHover={{ scale: selected ? 1 : 1.02 }}
      onClick={onClick}
      className={clsx(
        'relative p-4 rounded-xl border-2 text-left transition-all',
        selected
          ? 'bg-gradient-to-br from-magic-gold/20 to-magic-purple/20 border-magic-gold shadow-gold-glow'
          : 'bg-magic-panel/60 border-magic-border hover:border-magic-gold/40'
      )}
    >
      {selected && (
        <div className="absolute -top-2 -right-2 px-2 py-0.5 rounded-full bg-magic-gold text-black text-[10px] font-bold font-display uppercase">
          已任命
        </div>
      )}
      {general === null ? (
        <div className="text-center py-2">
          <div className="w-14 h-14 mx-auto rounded-xl bg-magic-bg border-2 border-dashed border-magic-border flex items-center justify-center text-gray-500 text-2xl">
            ?
          </div>
          <p className="mt-2 text-sm text-gray-400 font-display">不设统帅</p>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3 mb-3">
            <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-magic-purple/60 to-magic-gold/30 border border-magic-gold/40 flex items-center justify-center text-3xl shrink-0">
              {general.portrait}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <p className="font-display font-bold text-gray-100 truncate">{general.name}</p>
              </div>
              <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                <RarityBadge rarity={general.rarity} />
                <span className="text-xs text-gray-500 font-mono">Lv.{general.level}</span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-1 text-xs text-center">
            <StatMini label="统御" value={general.commandCap} />
            <StatMini label="攻" value={`+${general.attackBonus}%`} />
            <StatMini label="防" value={`+${general.defenseBonus}%`} />
          </div>
          <ProgressBar value={general.exp} max={100000} size="sm" showValue={false} rarity={general.rarity} className="mt-2" />
          {onLevelUp && general.available && (
            <Button size="sm" fullWidth className="mt-2" variant="ghost"
              onClick={(e) => { e.stopPropagation(); onLevelUp(); }}>
              <TrendingUp className="w-3 h-3" /> 升级
            </Button>
          )}
        </>
      )}
    </motion.button>
  );
}

function UnitCard({
  unit, type, selected, onClick, showRecruit, recruitCount, onRecruitCountChange, onRecruit, onLevelUp,
}: {
  unit: Unit | null;
  type: UnitType;
  selected: boolean;
  onClick: () => void;
  showRecruit?: boolean;
  recruitCount?: number;
  onRecruitCountChange?: (n: number) => void;
  onRecruit?: () => void;
  onLevelUp?: () => void;
}) {
  const info = unitTypeInfo[type];
  return (
    <motion.button
      whileHover={{ scale: selected ? 1 : 1.01 }}
      onClick={onClick}
      className={clsx(
        'relative p-4 rounded-xl border text-left transition-all',
        selected
          ? `bg-gradient-to-br from-${type === 'mages' ? 'purple' : type === 'cavalry' ? 'amber' : 'emerald'}-500/15 to-magic-card border-2 ${
              type === 'mages' ? 'border-purple-400 shadow-purple-glow'
              : type === 'cavalry' ? 'border-amber-400'
              : 'border-emerald-400'
            }`
          : 'bg-magic-panel/60 border-magic-border hover:border-magic-gold/40'
      )}
    >
      {unit === null ? (
        <div className="text-center py-4">
          <div className={`w-12 h-12 mx-auto rounded-lg bg-magic-bg border-2 border-dashed border-magic-border flex items-center justify-center text-2xl opacity-50`}>
            <info.icon className={`w-6 h-6 ${info.color} opacity-50`} />
          </div>
          <p className="mt-2 text-sm text-gray-500 font-display">暂不配置</p>
        </div>
      ) : (
        <>
          <div className="flex items-start gap-3 mb-2">
            <div className="text-4xl shrink-0">{unit.icon}</div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-display font-bold text-gray-100 text-sm">{unit.name}</p>
                <RarityBadge rarity={unit.rarity} />
              </div>
              <p className="text-xs font-mono text-gray-400 mt-0.5">Lv.{unit.level} · {unit.count.toLocaleString()}人</p>
            </div>
          </div>
          <div className="grid grid-cols-4 gap-1 text-[10px] text-center mb-2">
            <StatMini label="攻" value={unit.baseStats.attack} />
            <StatMini label="防" value={unit.baseStats.defense} />
            <StatMini label="HP" value={unit.baseStats.hp} />
            <StatMini label="魔" value={unit.baseStats.magicPower} />
          </div>

          {showRecruit && (
            <div onClick={e => e.stopPropagation()} className="mt-3 pt-3 border-t border-magic-border space-y-2">
              <div className="flex items-center gap-2">
                <Button size="sm" variant="ghost" className="!px-2" onClick={() => onRecruitCountChange?.(Math.max(0, (recruitCount || 0) - 100))}>
                  <Minus className="w-3 h-3" />
                </Button>
                <input
                  type="number"
                  value={recruitCount || 0}
                  onChange={e => onRecruitCountChange?.(Math.max(0, parseInt(e.target.value) || 0))}
                  className="magic-input !py-1 text-center !text-sm font-mono"
                />
                <Button size="sm" variant="ghost" className="!px-2" onClick={() => onRecruitCountChange?.((recruitCount || 0) + 100)}>
                  <Plus className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="primary" onClick={onRecruit}>
                  <Users className="w-3 h-3" /> 招募
                </Button>
              </div>
              <div className="flex items-center justify-between text-[11px]">
                <span className="text-gray-500">
                  <Coins className="w-3 h-3 inline mr-0.5" />
                  费用: {((recruitCount || 0) * 8).toLocaleString()}
                </span>
                <Button size="sm" variant="ghost" onClick={onLevelUp}>
                  <Star className="w-3 h-3" /> 强化
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </motion.button>
  );
}

function FormationCard({ formation, selected, onSelect }: { formation: Formation; selected: boolean; onSelect: () => void }) {
  const formationColors = {
    offensive: { border: 'border-magic-flame', bg: 'from-magic-flame/20', label: '进攻', icon: Zap },
    defensive: { border: 'border-magic-blue', bg: 'from-magic-blue/20', label: '防御', icon: Shield },
    balanced: { border: 'border-magic-gold', bg: 'from-magic-gold/20', label: '均衡', icon: Target },
    custom: { border: 'border-magic-purpleLight', bg: 'from-magic-purple/20', label: '自定义', icon: Star },
  };
  const info = formationColors[formation.type];
  const Icon = info.icon;
  return (
    <motion.button
      whileHover={{ y: -3 }}
      onClick={onSelect}
      className={clsx(
        'relative p-5 rounded-xl text-left transition-all border-2',
        selected
          ? `bg-gradient-to-br ${info.bg} to-magic-card ${info.border} shadow-lg`
          : 'bg-magic-panel/60 border-magic-border hover:border-magic-gold/40'
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Icon className={clsx('w-5 h-5',
            formation.type === 'offensive' && 'text-magic-flame',
            formation.type === 'defensive' && 'text-magic-blue',
            formation.type === 'balanced' && 'text-magic-gold',
            formation.type === 'custom' && 'text-magic-purpleLight'
          )} />
          <p className="font-display font-bold text-gray-100">{formation.name}</p>
        </div>
        <Badge variant={formation.type === 'offensive' ? 'danger' : formation.type === 'defensive' ? 'info' : 'warning'}>
          {info.label}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-3 text-xs">
        <BonusItem label="攻击" value={formation.bonuses.attackBonus} positive={formation.bonuses.attackBonus >= 0} />
        <BonusItem label="防御" value={formation.bonuses.defenseBonus} positive={formation.bonuses.defenseBonus >= 0} />
        <BonusItem label="机动" value={formation.bonuses.speedBonus} positive={formation.bonuses.speedBonus >= 0} />
        <BonusItem label="魔法" value={formation.bonuses.magicBonus} positive={formation.bonuses.magicBonus >= 0} />
      </div>

      <div className="mt-4 pt-3 border-t border-magic-border flex items-center justify-between">
        <span className="text-xs text-gray-500">{formation.slots.filter(s => s.enabled).length}个部署位</span>
        <ChevronRight className={clsx('w-4 h-4 transition-all', selected ? 'text-magic-gold translate-x-1' : 'text-gray-500')} />
      </div>
    </motion.button>
  );
}

function StatMini({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="p-1 rounded bg-magic-bg/60">
      <p className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</p>
      <p className="font-mono font-bold text-gray-200 text-xs">{value}</p>
    </div>
  );
}

function BonusItem({ label, value, positive }: { label: string; value: number; positive: boolean }) {
  return (
    <div className="flex items-center justify-between p-1.5 rounded bg-magic-bg/50">
      <span className="text-gray-400 uppercase tracking-wider">{label}</span>
      <span className={clsx('font-mono font-bold', value === 0 ? 'text-gray-500' : positive ? 'text-emerald-400' : 'text-red-400')}>
        {value > 0 ? '+' : ''}{value}%
      </span>
    </div>
  );
}
