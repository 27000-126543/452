import { useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Swords, Users, Crown, Zap, Clock, TrendingUp, Shield, Flame,
  Target, Wallet, Gift, ChevronRight, Skull, Flag, MapPin, CloudSun
} from 'lucide-react';
import { motion } from 'framer-motion';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { Badge, RankBadge, RarityBadge } from '@/components/ui/Badge';
import { PowerRadarChart, LineAreaChart } from '@/components/charts/Charts';
import { useLegionStore, useArmyStore, useContentStore, usePlayerStore, useGlobalStore } from '@/store';
import { calculateArmyPower } from '@/engines/combatEngine';
import type { RadarData } from '@/types';

const iconClass = 'w-5 h-5';

const quickActions = [
  { path: '/barracks', label: '招募新兵', icon: Swords, color: 'text-magic-flame' },
  { path: '/arena', label: '参加大赛', icon: Target, color: 'text-magic-blue' },
  { path: '/market', label: '前往市场', icon: Wallet, color: 'text-emerald-400' },
  { path: '/sandbox', label: '沙盘推演', icon: Flag, color: 'text-magic-purpleLight' },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const legion = useLegionStore(s => s.legion);
  const { generals, units, composition, formations, activeFormationId } = useArmyStore();
  const { news, warReport, ranking } = useContentStore();
  const player = usePlayerStore(s => s.player);
  const { refreshNews } = useContentStore();
  const updateTime = useGlobalStore(s => s.updateTime);

  useEffect(() => {
    const t = setInterval(() => { updateTime(); }, 30000);
    return () => clearInterval(t);
  }, [updateTime]);

  const activeGeneral = generals.find(g => g.id === composition.generalId);
  const activeFormation = formations.find(f => f.id === activeFormationId);

  const powerBreakdown = useMemo(() => {
    const result = calculateArmyPower(composition, units, activeGeneral || null, activeFormation || null);
    return result;
  }, [composition, units, activeGeneral, activeFormation]);

  const radarData: RadarData[] = useMemo(() => {
    const total = powerBreakdown.totalPower || 1;
    return [
      { axis: '步兵', value: Math.min(100, (powerBreakdown.breakdown.infantry / total) * 250), fullMark: 100 },
      { axis: '骑兵', value: Math.min(100, (powerBreakdown.breakdown.cavalry / total) * 250), fullMark: 100 },
      { axis: '法师', value: Math.min(100, (powerBreakdown.breakdown.mages / total) * 250), fullMark: 100 },
      { axis: '统帅', value: Math.min(100, (powerBreakdown.breakdown.general / total) * 250), fullMark: 100 },
      { axis: '士气', value: composition.morale, fullMark: 100 },
      { axis: '补给', value: (composition.supplies / composition.maxSupplies) * 100, fullMark: 100 },
    ];
  }, [powerBreakdown, composition]);

  const powerRank = ranking.power.find(r => r.id === legion.id);
  const powerRankIdx = ranking.power.findIndex(r => r.id === legion.id);
  const nextPowerRank = powerRankIdx > 0 ? ranking.power[powerRankIdx - 1] : null;
  const gapToNext = nextPowerRank ? nextPowerRank.value - (powerRank?.value || 0) : 0;
  const contestHours = 6;
  const contestMinutes = 42;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <Card
          className="col-span-12 xl:col-span-8"
          glow
          icon={<Crown className={iconClass} />}
          title={
            <div>
              <div className="flex items-center gap-3">
                <h3 className="font-display text-2xl font-bold glow-text-gold text-magic-gold">
                  {legion.banner.emblem} {legion.name}
                </h3>
                <RankBadge tier={player.rank} size="sm" />
              </div>
              <p className="text-sm text-gray-400 mt-1 italic">「{legion.slogan}」</p>
            </div>
          }
          actions={
            <div className="flex items-center gap-4 text-sm">
              <div className="text-right">
                <p className="text-gray-400">全服排名</p>
                <p className="font-display text-xl font-bold text-magic-gold">
                  #{powerRank?.rank ?? '—'}
                  {powerRank && powerRank.change > 0 && (
                    <span className="text-xs text-emerald-400 ml-1">▲{powerRank.change}</span>
                  )}
                  {powerRank && powerRank.change < 0 && (
                    <span className="text-xs text-red-400 ml-1">▼{Math.abs(powerRank.change)}</span>
                  )}
                </p>
                {nextPowerRank && (
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    距#{nextPowerRank.rank}差 <span className="text-magic-gold font-mono font-bold">{gapToNext.toLocaleString()}</span>
                  </p>
                )}
              </div>
            </div>
          }
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: '军团战力', value: legion.totalPower.toLocaleString(), icon: Shield, color: 'text-magic-blue' },
              { label: '成员人数', value: `${legion.members.length}/60`, icon: Users, color: 'text-emerald-400' },
              { label: '军部等级', value: `Lv.${legion.headquarters.level}`, icon: Crown, color: 'text-magic-gold' },
              { label: '赛季积分', value: player.seasonPoints.toLocaleString(), icon: TrendingUp, color: 'text-magic-flame' },
            ].map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * i }}
                className="p-4 rounded-lg bg-magic-panel/60 border border-magic-border hover:border-magic-gold/30 transition-all"
              >
                <div className="flex items-center justify-between mb-2">
                  <stat.icon className={`w-5 h-5 ${stat.color}`} />
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-display">{stat.label}</span>
                </div>
                <p className="font-mono text-2xl font-bold stat-value">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-1 flex items-center justify-center p-2 bg-magic-panel/40 rounded-xl border border-magic-border">
              <PowerRadarChart data={radarData} size={240} />
            </div>

            <div className="md:col-span-2 space-y-3">
              <div className="p-4 rounded-lg bg-magic-panel/50 border border-magic-border">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-3xl">{activeGeneral?.portrait || '⚔️'}</span>
                    <div>
                      <p className="font-display font-bold text-magic-goldLight">{activeGeneral?.name || '未任命统帅'}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        {activeGeneral && <RarityBadge rarity={activeGeneral.rarity} />}
                        <span className="text-xs text-gray-400">Lv.{activeGeneral?.level || 0}</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" variant="ghost" onClick={() => navigate('/barracks')}>
                    更换 <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
                <ProgressBar value={activeGeneral?.exp || 0} max={100000} label="经验值" color="purple" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-magic-panel/50 border border-magic-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-magic-gold" />
                    <span className="text-sm font-display text-gray-300">军团士气</span>
                  </div>
                  <ProgressBar value={composition.morale} max={100} color="flame" showValue={false} />
                  <p className="mt-1 font-mono text-lg font-bold text-magic-flame">{composition.morale}%</p>
                </div>
                <div className="p-3 rounded-lg bg-magic-panel/50 border border-magic-border">
                  <div className="flex items-center gap-2 mb-2">
                    <Gift className="w-4 h-4 text-magic-blue" />
                    <span className="text-sm font-display text-gray-300">补给库存</span>
                  </div>
                  <ProgressBar value={composition.supplies} max={composition.maxSupplies} color="blue" showValue={false} />
                  <p className="mt-1 font-mono text-lg font-bold text-magic-blue">
                    {composition.supplies.toLocaleString()}
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-gradient-to-r from-magic-panel/60 via-magic-purple/10 to-magic-panel/60 border border-magic-gold/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-magic-flame to-magic-gold flex items-center justify-center animate-pulse-gold">
                      <Clock className="w-6 h-6 text-black" />
                    </div>
                    <div>
                      <p className="font-display font-bold text-magic-gold">每日战争大赛</p>
                      <p className="text-xs text-gray-400">自动匹配相近评分对手</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-400 font-display uppercase tracking-wider">距下一场</p>
                    <p className="font-mono text-2xl font-bold text-magic-flame glow-text-gold">
                      {String(contestHours).padStart(2, '0')}:{String(contestMinutes).padStart(2, '0')}:00
                    </p>
                  </div>
                  <Button variant="primary" onClick={() => navigate('/arena')}>
                    <Target className="w-4 h-4" /> 立即匹配
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </Card>

        <Card
          className="col-span-12 xl:col-span-4"
          icon={<Flame className={`${iconClass} text-magic-flame`} />}
          title="战争动态"
          subtitle="全服实时战报与公告"
          actions={
            <Button variant="ghost" size="sm" onClick={refreshNews}>
              刷新
            </Button>
          }
        >
          <div className="space-y-2 max-h-[460px] overflow-y-auto pr-2">
            {news.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.04 }}
                className="news-item"
              >
                <div className="flex items-start gap-3">
                  <div className={clsx(
                    'w-9 h-9 rounded-lg shrink-0 flex items-center justify-center',
                    item.type === 'battle' && 'bg-red-900/50 border border-red-700',
                    item.type === 'trade' && 'bg-amber-900/50 border border-amber-700',
                    item.type === 'mobilization' && 'bg-purple-900/50 border border-purple-500 animate-pulse',
                    item.type === 'system' && 'bg-sky-900/50 border border-sky-700',
                  )}>
                    {item.type === 'battle' && <Skull className="w-4 h-4 text-red-400" />}
                    {item.type === 'trade' && <Wallet className="w-4 h-4 text-amber-400" />}
                    {item.type === 'mobilization' && <Zap className="w-4 h-4 text-purple-400" />}
                    {item.type === 'system' && <CloudSun className="w-4 h-4 text-sky-400" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-display font-semibold text-sm text-magic-goldLight">{item.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{item.content}</p>
                    <p className="text-[10px] text-gray-500 mt-1 font-mono">
                      {new Date(item.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-8" icon={<Swords className={iconClass} />} title="战力分析" subtitle="近14天胜率走势与战力分布">
          <div>
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-3">
                <Badge variant="success">胜率: {warReport.battleStatistics.wins / warReport.battleStatistics.totalBattles * 100 | 0}%</Badge>
                <Badge variant="info">总战役: {warReport.battleStatistics.totalBattles}</Badge>
                <Badge variant="warning">最佳阵型: {warReport.battleStatistics.mostEffectiveFormation}</Badge>
              </div>
              <Button size="sm" variant="ghost" onClick={() => navigate('/reports')}>
                查看详情 <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <LineAreaChart data={warReport.winRateCurve} color="#d4af37" gradientId="winRateGrad" yLabel="胜率%" height={200} />
          </div>
        </Card>

        <Card className="col-span-12 lg:col-span-4" icon={<MapPin className={iconClass} />} title="快捷行动">
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, idx) => (
              <motion.button
                key={action.path}
                whileHover={{ scale: 1.03, y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(action.path)}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.06 }}
                className="group p-4 rounded-xl bg-magic-panel/70 border border-magic-border hover:border-magic-gold/50 hover:bg-magic-card transition-all text-left"
              >
                <div className={`w-11 h-11 rounded-lg bg-gradient-to-br from-magic-purple/40 to-magic-gold/20 border border-magic-gold/30 flex items-center justify-center mb-3 group-hover:shadow-gold-glow transition-all`}>
                  <action.icon className={`w-6 h-6 ${action.color}`} />
                </div>
                <p className="font-display font-bold text-sm text-gray-100 group-hover:text-magic-gold transition-colors">{action.label}</p>
                <p className="text-xs text-gray-500 mt-1">点击进入 →</p>
              </motion.button>
            ))}
          </div>

          <div className="mt-5 pt-5 border-t border-magic-border">
            <h4 className="font-display text-sm font-bold text-magic-gold mb-3 uppercase tracking-wider">部队概览</h4>
            <div className="space-y-2.5">
              {units.slice(0, 3).map((unit) => (
                <div key={unit.id} className="flex items-center gap-3 p-2 rounded-lg bg-magic-panel/50 border border-magic-border/50 hover:border-magic-gold/30 transition-all">
                  <span className="text-2xl">{unit.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-sm text-gray-200 truncate">{unit.name}</p>
                      <RarityBadge rarity={unit.rarity} />
                    </div>
                    <ProgressBar value={unit.count} max={3000} color="flame" size="sm" showValue={false} />
                  </div>
                  <span className="font-mono text-sm font-bold text-magic-gold shrink-0">{unit.count.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

import { clsx } from 'clsx';
