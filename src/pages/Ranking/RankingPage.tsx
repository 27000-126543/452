import { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Crown, Sword, TrendingUp, TrendingDown, Minus, Users,
  Award, Coins, ChevronUp, ChevronDown, Star, Target, Shield, Eye, Activity
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { Badge, RankBadge } from '@/components/ui/Badge';
import { useContentStore, useLegionStore } from '@/store';
import type { RankEntry } from '@/types';
import { clsx } from 'clsx';

type Tab = 'power' | 'points' | 'contribution';

const tabConfig: Record<Tab, { label: string; icon: typeof Trophy; unit: string; desc: string }> = {
  power: { label: '军团战力', icon: Shield, unit: '战力', desc: '全服军团总战斗力排名' },
  points: { label: '大赛积分', icon: Target, unit: '积分', desc: '本赛季累计获取积分排名' },
  contribution: { label: '公会贡献', icon: Award, unit: '贡献', desc: '军团整体贡献度排名' },
};

const medals = ['🥇', '🥈', '🥉'];

export default function RankingPage() {
  const { ranking } = useContentStore();
  const { legion } = useLegionStore();

  const [tab, setTab] = useState<Tab>('power');
  const [hovered, setHovered] = useState<string | null>(null);
  const myRankRef = useRef<HTMLDivElement>(null);

  const activeData = ranking[tab];
  const config = tabConfig[tab];

  const myRank = activeData.find(r => r.id === legion.id);
  const myIndex = activeData.findIndex(r => r.id === legion.id);
  const nextRank = myIndex > 0 ? activeData[myIndex - 1] : null;
  const gapToNext = nextRank ? nextRank.value - (myRank?.value || 0) : 0;
  const totalParticipants = 2500;

  const stableRankChangesRef = useRef<Record<Tab, { week: string; change: number }[]>>();
  if (!stableRankChangesRef.current) {
    const seeds: Record<Tab, number[]> = {
      power: [2, 1, -1],
      points: [3, 0, -2],
      contribution: [1, 2, 1],
    };
    const result: Record<Tab, { week: string; change: number }[]> = {} as any;
    (['power', 'points', 'contribution'] as Tab[]).forEach(t => {
      result[t] = [
        { week: '本周', change: 0 },
        { week: '上周', change: seeds[t][1] },
        { week: '两周前', change: seeds[t][2] },
      ];
    });
    stableRankChangesRef.current = result;
  }

  const recentRankChanges = useMemo(() => {
    const base = stableRankChangesRef.current![tab];
    const thisWeekChange = myRank?.change ?? base[0].change;
    return [
      { ...base[0], change: thisWeekChange },
      base[1],
      base[2],
    ];
  }, [tab, myRank?.change]);

  useEffect(() => {
    if (myRankRef.current) {
      setTimeout(() => {
        myRankRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 300);
    }
  }, [tab]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-8" goldBorder
          icon={<Trophy className="w-6 h-6" />}
          title={
            <div>
              <h3 className="font-display text-2xl font-bold glow-text-gold text-magic-gold">全服排行榜</h3>
              <p className="text-sm text-gray-400 mt-1">
                {config.desc} · 共 {totalParticipants.toLocaleString()} 个军团参与
              </p>
            </div>
          }
          actions={
            <Badge variant="warning">
              每周一 00:00 重置
            </Badge>
          }
        >
          <div className="flex gap-1 border-b border-magic-border mb-6 overflow-x-auto">
            {(Object.keys(tabConfig) as Tab[]).map(t => {
              const Icon = tabConfig[t].icon;
              return (
                <button
                  key={t}
                  onClick={() => setTab(t)}
                  className={clsx(
                    'tab-btn whitespace-nowrap flex items-center gap-2',
                    tab === t ? 'tab-btn-active' : ''
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tabConfig[t].label}
                </button>
              );
            })}
          </div>

          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-magic-panel/50 border border-magic-border flex items-center gap-4 text-xs font-display text-gray-400 uppercase tracking-wider">
              <span className="w-14 text-center shrink-0">排名</span>
              <span className="flex-1 min-w-0">军团</span>
              <span className="w-28 text-center">段位</span>
              <span className="w-20 text-center">成员</span>
              <span className="w-36 text-right">总{config.unit}</span>
              <span className="w-20 text-center">趋势</span>
            </div>

            {activeData.map((entry: RankEntry, idx: number) => {
              const isTop3 = idx < 3;
              const isMe = entry.id === legion.id;
              const changeArrow = entry.change > 0 ? <ChevronUp className="w-4 h-4 text-emerald-400" /> :
                entry.change < 0 ? <ChevronDown className="w-4 h-4 text-red-400" /> :
                <Minus className="w-4 h-4 text-gray-500" />;

              return (
                <AnimatePresence key={entry.id}>
                  <motion.div
                    ref={isMe ? myRankRef : undefined}
                    layout
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    whileHover={{ x: 4 }}
                    onMouseEnter={() => setHovered(entry.id)}
                    onMouseLeave={() => setHovered(null)}
                    className={clsx(
                      'p-4 rounded-xl border-2 flex items-center gap-4 transition-all cursor-pointer relative overflow-hidden',
                      isTop3 && 'animate-[pulseGold_3s_ease-in-out_infinite]',
                      idx === 0 && 'bg-gradient-to-r from-amber-900/50 via-magic-gold/20 to-magic-card border-amber-500/60 shadow-gold-glow scale-[1.01]',
                      idx === 1 && 'bg-gradient-to-r from-slate-600/30 to-magic-card border-slate-400/50',
                      idx === 2 && 'bg-gradient-to-r from-orange-900/40 to-magic-card border-orange-700/50',
                      !isTop3 && isMe && 'bg-gradient-to-r from-magic-purple/30 via-magic-gold/10 to-magic-card border-magic-purple/60 shadow-purple-glow',
                      !isTop3 && !isMe && 'bg-magic-card/70 border-magic-border hover:border-magic-gold/40',
                      hovered === entry.id && '!border-magic-gold/60'
                    )}
                  >
                    {isMe && (
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-magic-gold via-magic-purple to-magic-blue" />
                    )}

                    <div className={clsx(
                      'w-14 shrink-0 text-center relative',
                      isTop3 ? '' : 'pl-1'
                    )}>
                      {isTop3 ? (
                        <motion.div
                          animate={{ y: [0, -4, 0] }}
                          transition={{ repeat: Infinity, duration: 2 + idx, delay: idx * 0.3 }}
                          className="text-4xl drop-shadow-lg"
                        >
                          {medals[idx]}
                        </motion.div>
                      ) : (
                        <div className={clsx(
                          'w-10 h-10 mx-auto rounded-full flex items-center justify-center font-display font-bold',
                          entry.change >= 0 ? 'bg-magic-panel border border-magic-border text-gray-200' : 'bg-red-900/40 border border-red-800 text-red-300'
                        )}>
                          #{entry.rank}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className={clsx(
                        'w-12 h-12 shrink-0 rounded-xl flex items-center justify-center text-2xl border',
                        idx === 0 ? 'bg-gradient-to-br from-amber-500/30 to-magic-gold/20 border-magic-gold shadow-gold-glow' :
                        idx === 1 ? 'bg-gradient-to-br from-gray-400/20 to-slate-700/20 border-gray-400/50' :
                        idx === 2 ? 'bg-gradient-to-br from-orange-700/30 to-orange-900/20 border-orange-600/50' :
                        'bg-magic-panel/70 border-magic-border/60'
                      )}>
                        {entry.metadata?.emblem || ['🐉', '⭐', '💀', '⚡', '❄️', '🌿', '🔨', '🔮', '🦁', '🔥'][idx % 10]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className={clsx(
                            'font-display font-bold truncate',
                            idx === 0 ? 'text-xl text-magic-gold glow-text-gold' :
                            isTop3 ? 'text-lg text-gray-100' :
                            'text-base text-gray-200'
                          )}>
                            {entry.name}
                            {isMe && <span className="ml-2 px-2 py-0.5 rounded-full bg-magic-purple/40 text-magic-purpleLight text-xs font-display uppercase">我的军团</span>}
                          </p>
                        </div>
                        {hovered === entry.id && entry.metadata && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            className="mt-1 flex items-center gap-3 text-xs text-gray-400"
                          >
                            <span className="flex items-center gap-1">
                              <Users className="w-3 h-3" /> {entry.metadata.members}成员
                            </span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" /> 赛季最佳 #{entry.previousRank}
                            </span>
                          </motion.div>
                        )}
                      </div>
                    </div>

                    <div className="w-28 shrink-0 text-center">
                      {entry.metadata?.tier && <RankBadge tier={entry.metadata.tier as any} />}
                    </div>

                    <div className="w-20 shrink-0 text-center text-sm text-gray-400">
                      {entry.metadata?.members || 40}人
                    </div>

                    <div className="w-36 shrink-0 text-right">
                      <p className={clsx(
                        'font-mono font-bold',
                        idx === 0 ? 'text-2xl text-magic-gold glow-text-gold' :
                        isTop3 ? 'text-xl text-magic-gold' : 'text-lg text-gray-100'
                      )}>
                        {entry.value.toLocaleString()}
                      </p>
                      <p className="text-[10px] text-gray-500 font-display uppercase tracking-wider">{config.unit}</p>
                    </div>

                    <div className="w-20 shrink-0 flex items-center justify-center gap-1 text-sm font-mono font-bold">
                      {changeArrow}
                      <span className={clsx(
                        entry.change > 0 ? 'text-emerald-400' :
                        entry.change < 0 ? 'text-red-400' : 'text-gray-500'
                      )}>
                        {entry.change > 0 ? '+' : ''}{entry.change || 0}
                      </span>
                    </div>
                  </motion.div>
                </AnimatePresence>
              );
            })}
          </div>

          <div className="mt-8 pt-6 border-t border-magic-border">
            <h4 className="font-display font-bold text-magic-goldLight mb-3">前 10 军团战力对比</h4>
            <div className="space-y-2.5">
              {activeData.slice(0, 10).map((entry, i) => {
                const max = activeData[0]?.value || 1;
                const pct = (entry.value / max) * 100;
                return (
                  <div key={entry.id} className="flex items-center gap-3">
                    <span className="w-6 font-mono text-gray-500 text-sm">#{i + 1}</span>
                    <span className="w-32 truncate text-sm text-gray-300">{entry.name}</span>
                    <div className="flex-1">
                      <div className="h-6 relative rounded-md overflow-hidden bg-magic-bg border border-magic-border/60">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ duration: 1, delay: i * 0.05 }}
                          className={clsx(
                            'absolute inset-y-0 left-0 rounded-r',
                            i === 0 ? 'bg-gradient-to-r from-amber-700 via-magic-gold to-amber-400' :
                            i === 1 ? 'bg-gradient-to-r from-gray-500 to-gray-300' :
                            i === 2 ? 'bg-gradient-to-r from-orange-700 to-orange-500' :
                            'bg-gradient-to-r from-magic-purple via-magic-purpleLight to-magic-blue'
                          )}
                        />
                      </div>
                    </div>
                    <span className="w-24 font-mono text-right font-bold text-magic-gold text-sm">
                      {entry.value.toLocaleString()}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </Card>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card icon={<Crown className="w-5 h-5" />} title="我的军团排名">
            <div className="p-6 rounded-xl bg-gradient-to-br from-magic-gold/20 via-magic-purple/15 to-magic-blue/10 border border-magic-gold/50 text-center mb-4 shadow-gold-glow">
              <div className="text-6xl mb-2">{legion.banner.emblem}</div>
              <h4 className="font-display font-bold text-xl text-gray-100 mb-1">{legion.name}</h4>
              <p className="text-sm text-gray-400 italic mb-3">「{legion.slogan}」</p>
              <div className="text-center">
                <p className="text-xs text-gray-400 font-display uppercase tracking-wider">当前排名</p>
                <div className="flex items-baseline justify-center gap-2 mt-1">
                  <span className="text-6xl font-display font-bold text-magic-gold glow-text-gold">
                    #{myRank?.rank || 5}
                  </span>
                </div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  {(myRank?.change || 2) > 0 ? (
                    <span className="text-emerald-400 flex items-center font-mono text-sm font-bold">
                      <TrendingUp className="w-4 h-4" /> +{myRank?.change || 2} 位
                    </span>
                  ) : (
                    <span className="text-red-400 flex items-center font-mono text-sm">
                      <TrendingDown className="w-4 h-4" /> {myRank?.change || 0} 位
                    </span>
                  )}
                  <span className="text-gray-500 text-xs">较上周</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              {[
                { label: '战力排名', value: `#${ranking.power.find(r => r.id === legion.id)?.rank || '—'}`, color: 'text-magic-blue' },
                { label: '积分排名', value: `#${ranking.points.find(r => r.id === legion.id)?.rank || '—'}`, color: 'text-magic-gold' },
                { label: '贡献排名', value: `#${ranking.contribution.find(r => r.id === legion.id)?.rank || '—'}`, color: 'text-emerald-400' },
                { label: '超越用户', value: `${100 - Math.round((myRank?.rank || 5) / totalParticipants * 100)}%`, color: 'text-magic-purpleLight' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg bg-magic-panel/60 border border-magic-border/50">
                  <p className="text-gray-500 uppercase text-[10px] tracking-wider">{s.label}</p>
                  <p className={`font-mono font-bold text-lg mt-0.5 ${s.color}`}>{s.value}</p>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 rounded-xl bg-magic-panel/50 border border-magic-border">
              <p className="text-xs text-gray-400 mb-2 flex items-center gap-2">
                <Target className="w-3.5 h-3.5 text-magic-gold" />
                距离上一名
                {nextRank && <span className="ml-auto text-magic-goldLight font-mono">#{nextRank.rank} {nextRank.name}</span>}
              </p>
              {nextRank ? (
                <>
                  <ProgressBar
                    value={(myRank?.value || 0)}
                    max={nextRank.value}
                    color="gold"
                    label="差距"
                  />
                  <p className="text-xs mt-2 text-gray-400 text-right">
                    还需 <span className="font-mono font-bold text-magic-gold">{gapToNext.toLocaleString()}</span> {config.unit}
                  </p>
                </>
              ) : (
                <div className="text-center py-3">
                  <p className="font-display font-bold text-magic-gold text-lg">🏆 已登顶！</p>
                  <p className="text-xs text-gray-500 mt-1">保持领先优势</p>
                </div>
              )}
            </div>

            <div className="mt-3 p-4 rounded-xl bg-magic-panel/50 border border-magic-border">
              <p className="text-xs text-gray-400 mb-3 flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-magic-gold" />
                近3周排名变化
              </p>
              <div className="space-y-2">
                {recentRankChanges.map(rc => (
                  <div key={rc.week} className="flex items-center justify-between text-xs p-2 rounded-lg bg-magic-bg/60">
                    <span className="text-gray-400">{rc.week}</span>
                    <span className={clsx('font-mono font-bold flex items-center gap-1',
                      rc.change > 0 ? 'text-emerald-400' : rc.change < 0 ? 'text-red-400' : 'text-gray-500'
                    )}>
                      {rc.change > 0 ? <><ChevronUp className="w-3 h-3" /> +{rc.change}</> :
                       rc.change < 0 ? <><ChevronDown className="w-3 h-3" /> {rc.change}</> :
                       <><Minus className="w-3 h-3" /> 持平</>}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card icon={<Star className="w-5 h-5" />} title="段位说明">
            <div className="space-y-2">
              {[
                { name: '大师', icon: '👑', range: '前 1%', color: 'from-fuchsia-800 via-fuchsia-600 to-purple-500', textColor: 'text-fuchsia-300' },
                { name: '钻石', icon: '💎', range: '前 5%', color: 'from-sky-800 via-sky-600 to-cyan-400', textColor: 'text-sky-300' },
                { name: '铂金', icon: '💠', range: '前 15%', color: 'from-cyan-700 via-cyan-500 to-teal-400', textColor: 'text-cyan-200' },
                { name: '黄金', icon: '🥇', range: '前 35%', color: 'from-amber-700 via-amber-500 to-yellow-400', textColor: 'text-amber-300' },
                { name: '白银', icon: '🥈', range: '前 65%', color: 'from-slate-600 via-slate-400 to-gray-300', textColor: 'text-gray-200' },
                { name: '青铜', icon: '🥉', range: '其余', color: 'from-orange-900 via-orange-700 to-amber-600', textColor: 'text-orange-300' },
              ].map((tier, i) => (
                <div
                  key={tier.name}
                  className={clsx(
                    'p-3 rounded-xl border-2 transition-all flex items-center gap-3',
                    'bg-gradient-to-r', tier.color, 'border-white/10 bg-opacity-20',
                    'hover:scale-[1.02] hover:shadow-lg'
                  )}
                  style={{ background: `linear-gradient(to right, rgba(0,0,0,0.5), transparent)` }}
                >
                  <div className="text-3xl">{tier.icon}</div>
                  <div className="flex-1">
                    <p className={`font-display font-bold ${tier.textColor}`}>{tier.name}段位</p>
                    <p className="text-xs text-white/60">赛季排名 {tier.range}</p>
                  </div>
                  <Badge variant="info">{i === 0 ? '限定军旗' : i <= 2 ? '稀有图纸' : '参与奖励'}</Badge>
                </div>
              ))}
            </div>
          </Card>

          <Card icon={<Coins className="w-5 h-5" />} title="赛季奖励" subtitle="S3赛季限定奖励">
            <ul className="space-y-2.5 text-sm">
              {[
                { icon: '🏆', text: '限定军旗「凤凰之翼」', require: '大师段位' },
                { icon: '⚔️', text: '传奇兵种图纸 x3', require: '钻石以上' },
                { icon: '👑', text: '史诗将领合同 x2', require: '铂金以上' },
                { icon: '🎖️', text: '稀有兵种图纸 x5', require: '黄金以上' },
                { icon: '💰', text: '赛季金币 50,000', require: '白银以上' },
                { icon: '🎁', text: '参与礼包若干', require: '全体玩家' },
              ].map(reward => (
                <li key={reward.text} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-magic-panel/60 transition-all">
                  <span className="text-2xl">{reward.icon}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-200 truncate">{reward.text}</p>
                  </div>
                  <Badge variant="warning">{reward.require}</Badge>
                </li>
              ))}
            </ul>
            <div className="mt-4 p-4 rounded-xl bg-gradient-to-r from-magic-flame/20 via-magic-gold/10 to-magic-purple/20 border border-magic-gold/40 text-center">
              <Eye className="w-5 h-5 text-magic-gold mx-auto mb-2" />
              <p className="font-display font-bold text-magic-goldLight mb-1">距离赛季结算</p>
              <p className="font-mono text-2xl font-bold text-magic-flame glow-text-gold">14 天 06:42:18</p>
              <Button variant="primary" size="sm" className="mt-3 w-full">
                <Sword className="w-4 h-4" /> 参加大赛获得积分
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
