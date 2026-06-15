import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Trophy, Users, Zap, Shield, Target, Clock, Swords, Crown, Star, Gift,
  Heart, AlertTriangle, Award, SkipForward, Crosshair, RefreshCw, TrendingUp,
  Activity, ChevronLeft, ChevronRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { Badge, RankBadge, RarityBadge } from '@/components/ui/Badge';
import { LineAreaChart } from '@/components/charts/Charts';
import { useBattleStore, useArmyStore, usePlayerStore, useContentStore, useLegionStore, useGlobalStore } from '@/store';
import { createBattle, simulateBattleRound, estimateWaitTime } from '@/engines/matchmaker';
import { generateId, terrains, weathers, rarityColors } from '@/data/mockData';
import type { RankTier, MatchmakingTicket, BattleState } from '@/types';
import { clsx } from 'clsx';

export default function ArenaPage() {
  const navigate = useNavigate();
  const { matchmakingTicket, setMatchmakingTicket, setCurrentBattle, currentBattle,
    updateBattle, activateSurpriseAttack, useSkill, changeFormation, addBattleToHistory, battleHistory } = useBattleStore();
  const { composition, generals, units, formations } = useArmyStore();
  const player = usePlayerStore(s => s.player);
  const updatePoints = usePlayerStore(s => s.updateSeasonPoints);
  const updateGold = usePlayerStore(s => s.updateGold);
  const addMemberContribution = useLegionStore(s => s.addMemberContribution);
  const addNews = useContentStore(s => s.addNews);
  const { setMobilization } = useGlobalStore();

  const [mode, setMode] = useState<'lobby' | 'matchmaking' | 'battle' | 'result' | 'replay'>(currentBattle ? 'battle' : 'lobby');
  const [waitTime, setWaitTime] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  const general = generals.find(g => g.id === composition.generalId);
  const activeFormation = formations[0];

  useEffect(() => {
    if (mode !== 'matchmaking') return;
    const t = setInterval(() => {
      setWaitTime(prev => {
        const n = prev + 1;
        if (n >= 5 + Math.floor(Math.random() * 4)) {
          startBattle();
        }
        return n;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [mode]); // eslint-disable-line

  useEffect(() => {
    if (mode !== 'battle' || !autoPlay || !currentBattle || currentBattle.phase === 'ended') return;
    const t = setTimeout(() => {
      const result = simulateBattleRound(currentBattle);
      const nextState = decrementCooldowns(result.state);
      updateBattle(nextState);
      if (nextState.phase === 'ended') {
        handleBattleEnd(nextState);
      }
    }, 3000);
    return () => clearTimeout(t);
  }, [mode, autoPlay, currentBattle]); // eslint-disable-line

  const decrementCooldowns = (state: any): any => {
    const dec = (obj: Record<string, number>) => {
      const next: Record<string, number> = {};
      Object.keys(obj).forEach(k => { next[k] = Math.max(0, obj[k] - 1); });
      return next;
    };
    return {
      ...state,
      playerArmy: {
        ...state.playerArmy,
        skillCooldowns: dec(state.playerArmy.skillCooldowns || {}),
        tacticalCooldowns: dec(state.playerArmy.tacticalCooldowns || {}),
        surpriseTroops: Math.min(500, (state.playerArmy.surpriseTroops || 0) + 25),
        units: (state.playerArmy.units || []).map((u: any) => ({
          ...u,
          statusEffects: (u.statusEffects || []).map((e: any) => ({ ...e, duration: Math.max(0, e.duration - 1) })).filter((e: any) => e.duration > 0 || e.type !== 'buff'),
        })),
      },
      enemyArmy: {
        ...state.enemyArmy,
        skillCooldowns: dec(state.enemyArmy.skillCooldowns || {}),
        tacticalCooldowns: dec(state.enemyArmy.tacticalCooldowns || {}),
        surpriseTroops: Math.min(500, (state.enemyArmy.surpriseTroops || 0) + 25),
        units: (state.enemyArmy.units || []).map((u: any) => ({
          ...u,
          statusEffects: (u.statusEffects || []).map((e: any) => ({ ...e, duration: Math.max(0, e.duration - 1) })).filter((e: any) => e.duration > 0 || e.type !== 'buff'),
        })),
      },
    };
  };

  const enterMatchmaking = () => {
    const ticket: MatchmakingTicket = {
      id: generateId(),
      playerId: player.id,
      playerName: player.name,
      powerRating: composition.totalPower,
      tier: player.rank,
      joinedAt: Date.now(),
      estimatedWait: estimateWaitTime(player.rank, 150),
      status: 'queued',
    };
    setMatchmakingTicket(ticket);
    setMode('matchmaking');
    setWaitTime(0);
  };

  const cancelMatchmaking = () => {
    setMatchmakingTicket(null);
    setMode('lobby');
    setWaitTime(0);
  };

  const startBattle = () => {
    const playerSide = {
      legionName: useLegionStore.getState().legion.name,
      legionBanner: useLegionStore.getState().legion.banner,
      general,
      units: [],
      formationIntegrity: 100,
      totalPower: composition.totalPower,
      skillCooldowns: {},
      tacticalCooldowns: {},
      surpriseTroops: 350,
    };
    const battle = createBattle(playerSide as any);
    battle.phase = 'active';
    setCurrentBattle(battle);
    setMatchmakingTicket(null);
    setMode('battle');
  };

  const handleBattleEnd = (state: any) => {
    addBattleToHistory(state);
    if (state.rewards) {
      updatePoints(state.rewards.points);
      updateGold(state.rewards.gold);
      addMemberContribution(player.id, Math.floor(state.rewards.points / 2));
      if (state.winner === 'player' && state.rewards.blueprints?.length > 0) {
        addNews({
          id: generateId(), type: 'battle',
          title: '🔥 史诗大捷',
          content: `「${useLegionStore.getState().legion.name}」斩获${state.rewards.points}积分！`,
          timestamp: Date.now(),
        });
      }
    }
    setTimeout(() => {
      setMode('result');
    }, 800);
  };

  const nextTurn = () => {
    if (!currentBattle || currentBattle.phase === 'ended') return;
    const result = simulateBattleRound(currentBattle);
    const nextState = decrementCooldowns(result.state);
    updateBattle(nextState);
    if (nextState.phase === 'ended') handleBattleEnd(nextState);
  };

  const returnToLobby = () => {
    setCurrentBattle(null);
    setMode('lobby');
  };

  const recentBattles = battleHistory.slice(0, 5);
  const winCount = battleHistory.filter(b => b.winner === 'player').length;
  const winRate = battleHistory.length > 0 ? Math.round(winCount / battleHistory.length * 100) : 0;

  const winRateData = useMemo(() => {
    const days = ['一', '二', '三', '四', '五', '六', '日'];
    return days.map((d, i) => ({
      date: `周${d}`,
      timestamp: Date.now(),
      value: 40 + Math.floor(Math.random() * 40) + (i === 6 ? 15 : 0),
    }));
  }, []);

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {mode === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-6"
          >
            <div className="grid grid-cols-12 gap-6">
              <Card className="col-span-12 lg:col-span-8" goldBorder
                icon={<Trophy className="w-6 h-6" />}
                title={
                  <div>
                    <h3 className="font-display text-2xl font-bold glow-text-gold text-magic-gold">每日战争大赛</h3>
                    <p className="text-sm text-gray-400 mt-1">按军力评分自动匹配对手，赢取积分与稀有图纸</p>
                  </div>
                }
                actions={
                  <div className="flex items-center gap-4">
                    <RankBadge tier={player.rank} size="md" />
                    <div className="text-right">
                      <p className="text-xs text-gray-500 uppercase tracking-wider font-display">赛季积分</p>
                      <p className="font-mono text-2xl font-bold text-magic-gold">{player.seasonPoints.toLocaleString()}</p>
                    </div>
                  </div>
                }
              >
                <div className="grid grid-cols-3 gap-4 mb-6">
                  {[
                    { label: '军力评分', value: composition.totalPower.toLocaleString(), icon: Shield, color: 'text-magic-blue' },
                    { label: '赛季胜率', value: `${winRate}%`, icon: Target, color: 'text-emerald-400' },
                    { label: '累计场次', value: battleHistory.length, icon: Swords, color: 'text-magic-flame' },
                  ].map((s, i) => (
                    <motion.div
                      key={s.label}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.1 }}
                      className="p-5 rounded-xl bg-magic-panel/60 border border-magic-border relative overflow-hidden"
                    >
                      <div className={`absolute -right-4 -top-4 w-24 h-24 rounded-full opacity-10 ${s.color}`}>
                        <s.icon className="w-full h-full p-4" />
                      </div>
                      <p className="text-xs text-gray-400 uppercase tracking-wider font-display">{s.label}</p>
                      <p className="font-mono text-3xl font-bold text-magic-gold mt-2">{s.value}</p>
                    </motion.div>
                  ))}
                </div>

                <div className="p-6 rounded-xl bg-gradient-to-r from-magic-purple/30 via-magic-gold/10 to-magic-flame/20 border border-magic-gold/40">
                  <div className="flex items-center justify-between flex-wrap gap-4">
                    <div className="flex items-center gap-5">
                      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-magic-gold to-magic-flame flex items-center justify-center animate-pulse-gold shadow-gold-glow">
                        <Swords className="w-10 h-10 text-black" />
                      </div>
                      <div>
                        <h4 className="font-display text-2xl font-bold text-magic-gold">匹配对战</h4>
                        <p className="text-sm text-gray-300 mt-1">系统将为您匹配军力评分相近的对手</p>
                        <div className="flex items-center gap-3 mt-2">
                          <Badge variant="info">预计等待: {estimateWaitTime(player.rank, 200)}秒</Badge>
                          <Badge variant="success">当前匹配池: 184人</Badge>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="primary" size="lg" icon={<Zap className="w-5 h-5" />} onClick={enterMatchmaking}>
                        快速匹配
                      </Button>
                      <Button size="lg" onClick={() => navigate('/sandbox')}>
                        沙盘练习
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-magic-panel/50 border border-magic-border">
                  <div className="flex items-center justify-between mb-3">
                    <h5 className="font-display font-bold text-magic-goldLight flex items-center gap-2">
                      <TrendingUpIcon className="w-4 h-4" /> 近7日胜率走势
                    </h5>
                    <span className="font-mono font-bold text-magic-gold">平均: 58%</span>
                  </div>
                  <LineAreaChart data={winRateData} color="#d4af37" gradientId="arenaWinRate" height={160} />
                </div>
              </Card>

              <div className="col-span-12 lg:col-span-4 space-y-6">
                <Card icon={<Award className="w-5 h-5" />} title="段位进度">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 rounded-lg bg-magic-panel/60 border border-magic-border">
                      <RankBadge tier="platinum" size="md" />
                      <div className="text-right">
                        <p className="text-xs text-gray-400">距离下一阶</p>
                        <p className="font-mono font-bold text-magic-gold">1,153 分</p>
                      </div>
                    </div>
                    <ProgressBar value={player.seasonPoints % 5000} max={5000} color="gold" label="赛季进度" />
                    <div className="grid grid-cols-3 gap-2 text-center text-xs">
                      {(['bronze', 'silver', 'gold', 'platinum', 'diamond', 'master'] as RankTier[]).map((t, i) => (
                        <div key={t} className={clsx(
                          'p-2 rounded-lg border',
                          ['platinum', 'diamond', 'master'].includes(t) ? '' : 'hidden md:block',
                          t === player.rank
                            ? 'bg-magic-gold/20 border-magic-gold shadow-gold-glow'
                            : 'bg-magic-bg/60 border-magic-border opacity-60'
                        )}>
                          <RankBadge tier={t} size="sm" />
                        </div>
                      ))}
                    </div>
                  </div>
                </Card>

                <Card icon={<Clock className="w-5 h-5" />} title="赛季日程">
                  <div className="space-y-2 text-sm">
                    {[
                      { phase: 'S3 赛季中', status: '进行中', days: 14, color: 'warning' as const },
                      { phase: '赛季结算', status: '未开始', days: 15, color: 'info' as const },
                      { phase: '限定军旗发放', status: '待解锁', days: 15, color: 'success' as const },
                    ].map(s => (
                      <div key={s.phase} className="flex items-center justify-between p-3 rounded-lg bg-magic-panel/50 border border-magic-border">
                        <div>
                          <p className="font-semibold text-gray-200">{s.phase}</p>
                          <p className="text-xs text-gray-500">{s.days}天后</p>
                        </div>
                        <Badge variant={s.color}>{s.status}</Badge>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>

            <Card icon={<RefreshCw className="w-5 h-5" />} title="最近战绩" subtitle={`共${battleHistory.length}场，胜率${winRate}%`}>
              {recentBattles.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <Swords className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-display">暂无对战记录，开始你的第一场战斗吧！</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
                  {recentBattles.map((b, i) => (
                    <motion.div
                      key={b.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      className={clsx(
                        'p-4 rounded-xl border-2 relative overflow-hidden',
                        b.winner === 'player'
                          ? 'bg-gradient-to-br from-emerald-900/40 to-magic-card border-emerald-500/50'
                          : b.winner === 'draw'
                          ? 'bg-gradient-to-br from-sky-900/40 to-magic-card border-sky-500/50'
                          : 'bg-gradient-to-br from-red-900/30 to-magic-card border-red-500/40'
                      )}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Badge variant={b.winner === 'player' ? 'success' : b.winner === 'draw' ? 'info' : 'danger'}>
                          {b.winner === 'player' ? '胜利' : b.winner === 'draw' ? '平局' : '失败'}
                        </Badge>
                        <span className="text-xs text-gray-500 font-mono">T{b.currentTurn}</span>
                      </div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-2xl">{b.playerArmy.legionBanner.emblem}</div>
                        <span className="font-display font-bold text-gray-400">VS</span>
                        <div className="text-2xl">{b.enemyArmy.legionBanner.emblem}</div>
                      </div>
                      <div className="text-xs space-y-0.5 mb-3">
                        <p className="text-magic-gold font-mono">积分 +{b.rewards?.points || 0}</p>
                        <p className="text-amber-400 font-mono">金币 +{b.rewards?.gold || 0}</p>
                      </div>
                      <Button size="sm" variant="ghost" fullWidth icon={<Activity className="w-3.5 h-3.5" />}
                        onClick={() => { setCurrentBattle(b); setMode('replay'); }}>
                        复盘
                      </Button>
                    </motion.div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        )}

        {mode === 'matchmaking' && (
          <motion.div
            key="matchmaking"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.02 }}
          >
            <Card className="max-w-2xl mx-auto text-center py-12">
              <div className="relative w-32 h-32 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-magic-purple border-t-magic-gold animate-spin" />
                <div className="absolute inset-4 rounded-full border-2 border-dashed border-magic-gold/60 animate-rune-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Users className="w-12 h-12 text-magic-gold animate-pulse" />
                </div>
              </div>
              <h3 className="font-display text-3xl font-bold text-magic-gold glow-text-gold mb-2">正在匹配对手...</h3>
              <p className="text-gray-400 mb-6">请稍候，系统正在寻找军力相近的对手</p>

              <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto mb-8">
                <div className="p-4 rounded-lg bg-magic-panel/60 border border-magic-border">
                  <p className="text-xs text-gray-500 uppercase">军力</p>
                  <p className="font-mono text-xl font-bold text-magic-blue">{composition.totalPower.toLocaleString()}</p>
                </div>
                <div className="p-4 rounded-lg bg-magic-panel/60 border border-magic-border">
                  <p className="text-xs text-gray-500 uppercase">已等待</p>
                  <p className="font-mono text-xl font-bold text-magic-flame">{waitTime}s</p>
                </div>
                <div className="p-4 rounded-lg bg-magic-panel/60 border border-magic-border">
                  <p className="text-xs text-gray-500 uppercase">池中人数</p>
                  <p className="font-mono text-xl font-bold text-emerald-400">{150 + Math.floor(Math.random() * 50)}</p>
                </div>
              </div>

              <Button variant="danger" icon={<AlertTriangle className="w-4 h-4" />} onClick={cancelMatchmaking}>
                取消匹配
              </Button>
            </Card>
          </motion.div>
        )}

        {mode === 'battle' && currentBattle && (
          <BattleArena
            battle={currentBattle}
            autoPlay={autoPlay}
            onToggleAuto={() => setAutoPlay(!autoPlay)}
            onNextTurn={nextTurn}
            onSurprise={activateSurpriseAttack}
            onSkill={useSkill}
            onChangeFormation={changeFormation}
          />
        )}

        {mode === 'result' && currentBattle?.rewards && (
          <motion.div
            key="result"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
          >
            <Card className={clsx(
              'max-w-3xl mx-auto text-center py-10',
              currentBattle.winner === 'player' ? 'gold-border shadow-gold-glow' : ''
            )}>
              <motion.div
                initial={{ scale: 0.5, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 120 }}
                className="mb-6"
              >
                <div className={clsx(
                  'w-32 h-32 mx-auto rounded-full flex items-center justify-center',
                  currentBattle.winner === 'player'
                    ? 'bg-gradient-to-br from-magic-gold via-amber-500 to-magic-flame animate-pulse-gold shadow-gold-glow'
                    : currentBattle.winner === 'draw'
                    ? 'bg-gradient-to-br from-sky-500 to-blue-700 shadow-blue-glow'
                    : 'bg-gradient-to-br from-gray-600 to-gray-800'
                )}>
                  {currentBattle.winner === 'player' ? (
                    <Trophy className="w-16 h-16 text-black" />
                  ) : currentBattle.winner === 'draw' ? (
                    <Users className="w-16 h-16 text-white" />
                  ) : (
                    <Heart className="w-16 h-16 text-red-300" />
                  )}
                </div>
              </motion.div>
              <h2 className={clsx(
                'font-display text-5xl font-bold mb-3 glow-text-gold',
                currentBattle.winner === 'player' ? 'text-magic-gold' :
                currentBattle.winner === 'draw' ? 'text-sky-300' : 'text-gray-400'
              )}>
                {currentBattle.winner === 'player' ? '🏆 胜利！' : currentBattle.winner === 'draw' ? '🤝 平局' : '💀 失败'}
              </h2>
              <p className="text-gray-400 text-lg mb-8">
                {currentBattle.winner === 'player'
                  ? '你的军团在沙场上展现了强大的实力！'
                  : currentBattle.winner === 'draw'
                  ? '双方势均力敌，难分高下！'
                  : '胜败乃兵家常事，整顿旗鼓再战！'}
              </p>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto mb-8">
                {[
                  { label: '赛季积分', value: `+${currentBattle.rewards.points}`, icon: Star, color: 'text-magic-gold' },
                  { label: '金币奖励', value: `+${currentBattle.rewards.gold.toLocaleString()}`, icon: Crown, color: 'text-amber-400' },
                  { label: '经验值', value: `+${currentBattle.rewards.exp}`, icon: TrendingUpIcon, color: 'text-magic-blue' },
                  { label: '稀有图纸', value: `${currentBattle.rewards.blueprints?.length || 0}张`, icon: Gift, color: 'text-purple-400' },
                ].map((r, i) => (
                  <motion.div
                    key={r.label}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 + i * 0.08 }}
                    className="p-5 rounded-xl bg-magic-panel/70 border border-magic-border hover:border-magic-gold/50 transition-all"
                  >
                    <r.icon className={`w-7 h-7 mx-auto mb-2 ${r.color}`} />
                    <p className="text-xs text-gray-400 font-display uppercase">{r.label}</p>
                    <p className={`font-mono text-2xl font-bold mt-1 ${r.color}`}>{r.value}</p>
                  </motion.div>
                ))}
              </div>

              <div className="flex gap-3 justify-center">
                <Button variant="primary" size="lg" icon={<Zap className="w-5 h-5" />} onClick={() => { returnToLobby(); setTimeout(enterMatchmaking, 200); }}>
                  再战一局
                </Button>
                <Button size="lg" icon={<Activity className="w-5 h-5" />} onClick={() => setMode('replay')}>
                  查看复盘
                </Button>
                <Button size="lg" onClick={returnToLobby}>
                  返回大厅
                </Button>
              </div>
            </Card>
          </motion.div>
        )}

        {mode === 'replay' && currentBattle && (
          <motion.div
            key="replay"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-2xl font-bold glow-text-gold text-magic-gold flex items-center gap-2">
                <Activity className="w-6 h-6" /> 战斗复盘
              </h3>
              <Button icon={<ChevronLeft className="w-4 h-4" />} onClick={() => setMode(currentBattle.phase === 'ended' ? 'result' : 'lobby')}>
                返回
              </Button>
            </div>
            <BattleReplayPanel battle={currentBattle} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function BattleArena({ battle, autoPlay, onToggleAuto, onNextTurn, onSurprise, onSkill, onChangeFormation }: any) {
  const winner = battle.winner;
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-12 gap-4 items-stretch">
        <SidePanel side="player" battle={battle} />

        <div className="col-span-12 lg:col-span-5">
          <Card goldBorder className="h-full"
            icon={<Swords className="w-5 h-5" />}
            title={
              <div className="flex items-center justify-between gap-4 w-full pr-4">
                <span className="flex items-center gap-2">
                  实时战场
                  <Badge variant="warning">回合 {battle.currentTurn}/30</Badge>
                  <Badge variant="info">{terrains.find(t => t.type === battle.terrain)?.name}</Badge>
                  <Badge variant="default">{weathers.find(w => w.type === battle.weather)?.name}</Badge>
                </span>
              </div>
            }
          >
            <div className="space-y-4">
              <BattleUnitsRow side="enemy" units={battle.enemyArmy.units} />
              <div className="relative py-2">
                <div className="absolute inset-x-0 top-1/2 h-0.5 bg-gradient-to-r from-transparent via-magic-gold to-transparent" />
                <div className="relative flex justify-center">
                  <div className="px-4 py-1 rounded-full bg-magic-panel border border-magic-gold/50 font-display text-xs text-magic-gold uppercase tracking-wider shadow-gold-glow">
                    ⚔️ 激战区 ⚔️
                  </div>
                </div>
              </div>
              <BattleUnitsRow side="player" units={battle.playerArmy.units} />
            </div>

            <div className="mt-5 p-3 rounded-lg bg-magic-bg/60 border border-magic-border max-h-36 overflow-y-auto">
              {battle.log.slice(-8).reverse().map((entry: any, i: number) => (
                <div key={i} className="text-xs py-1.5 border-b border-magic-border/30 last:border-0">
                  <span className="text-gray-500 font-mono mr-2">[T{entry.turn}]</span>
                  <span className={entry.side === 'player' ? 'text-emerald-400' : entry.side === 'enemy' ? 'text-red-400' : 'text-sky-300'}>
                    {entry.message}
                  </span>
                </div>
              ))}
            </div>
          </Card>
        </div>

        <SidePanel side="enemy" battle={battle} />
      </div>

      <Card icon={<Crosshair className="w-5 h-5" />} title="战术操作">
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <Button variant="primary" icon={<SkipForward className="w-4 h-4" />} onClick={onNextTurn} disabled={winner !== null}>
              下一回合
            </Button>
            <Button
              variant={autoPlay ? 'primary' : 'default'}
              onClick={onToggleAuto}
              icon={<Zap className="w-4 h-4" />}
              disabled={winner !== null}
            >
              {autoPlay ? '暂停自动' : '自动推演'}
            </Button>
            <Button
              variant="danger"
              icon={<AlertTriangle className="w-4 h-4" />}
              onClick={onSurprise}
              disabled={winner !== null || battle.playerArmy.surpriseTroops < 50 || (battle.playerArmy.tacticalCooldowns?.['surprise'] || 0) > 0}
            >
              🎯 派遣奇袭 ({battle.playerArmy.surpriseTroops}人)
              {(battle.playerArmy.tacticalCooldowns?.['surprise'] || 0) > 0 && ` 冷却(${battle.playerArmy.tacticalCooldowns['surprise']})`}
            </Button>
            <Button
              icon={<Shield className="w-4 h-4" />}
              onClick={() => onChangeFormation('defensive')}
              disabled={winner !== null || (battle.playerArmy.tacticalCooldowns?.['formation'] || 0) > 0}
            >
              切换防御阵
              {(battle.playerArmy.tacticalCooldowns?.['formation'] || 0) > 0 && `(${battle.playerArmy.tacticalCooldowns['formation']})`}
            </Button>
            <Button
              variant="ghost"
              icon={<Swords className="w-4 h-4" />}
              onClick={() => onChangeFormation('offensive')}
              disabled={winner !== null || (battle.playerArmy.tacticalCooldowns?.['formation'] || 0) > 0}
            >
              切换进攻阵
              {(battle.playerArmy.tacticalCooldowns?.['formation'] || 0) > 0 && `(${battle.playerArmy.tacticalCooldowns['formation']})`}
            </Button>
            <Button
              variant="ghost"
              icon={<Star className="w-4 h-4" />}
              onClick={() => onSkill('warcry')}
              disabled={winner !== null || (battle.playerArmy.skillCooldowns['warcry'] || 0) > 0}
            >
              战吼技能 {battle.playerArmy.skillCooldowns['warcry'] > 0 && `(${battle.playerArmy.skillCooldowns['warcry']})`}
            </Button>
          </div>
          <div className="text-xs text-gray-400">
            <span className="mr-4">提示：合理切换阵型可扭转战局</span>
          </div>
        </div>
      </Card>
    </div>
  );
}

function SidePanel({ side, battle }: { side: 'player' | 'enemy'; battle: any }) {
  const army = side === 'player' ? battle.playerArmy : battle.enemyArmy;
  const isPlayer = side === 'player';
  return (
    <div className="col-span-12 lg:col-span-3 flex flex-col">
      <Card className={clsx(
        'flex-1',
        isPlayer ? 'border-l-4 border-l-magic-gold' : 'border-r-4 border-r-magic-blood'
      )}>
        <div className={clsx(
          'p-4 -mx-5 -mt-5 mb-4 rounded-t-xl',
          isPlayer
            ? 'bg-gradient-to-r from-magic-gold/20 via-magic-purple/20 to-transparent border-b border-magic-gold/30'
            : 'bg-gradient-to-l from-red-900/40 via-red-950/20 to-transparent border-b border-red-800/40'
        )}>
          <div className="flex items-center gap-3">
            <div className="text-4xl">{army.legionBanner.emblem}</div>
            <div className="flex-1 min-w-0">
              <p className={clsx('font-display font-bold text-lg truncate', isPlayer ? 'text-magic-gold' : 'text-red-300')}>
                {army.legionName}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {army.general && (
                  <>
                    <span className="text-xl">{army.general.portrait}</span>
                    <span className="text-xs text-gray-400 truncate">{army.general.name}</span>
                    <RarityBadge rarity={army.general.rarity} />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-gray-400 font-display uppercase">阵型完整度</span>
              <span className={clsx('font-mono font-bold', army.formationIntegrity > 60 ? 'text-emerald-400' : army.formationIntegrity > 30 ? 'text-amber-400' : 'text-red-400')}>
                {army.formationIntegrity}%
              </span>
            </div>
            <ProgressBar value={army.formationIntegrity} max={100} size="sm" showValue={false}
              color={army.formationIntegrity > 60 ? 'green' : army.formationIntegrity > 30 ? 'gold' : 'red'} />
          </div>

          <div className="grid grid-cols-2 gap-2 text-center text-xs">
            <div className="p-2 rounded bg-magic-bg/60">
              <p className="text-gray-500 uppercase text-[10px]">总兵力</p>
              <p className="font-mono font-bold text-magic-gold text-sm">
                {army.units.reduce((s: number, u: any) => s + u.currentCount, 0).toLocaleString()}
              </p>
            </div>
            <div className="p-2 rounded bg-magic-bg/60">
              <p className="text-gray-500 uppercase text-[10px]">伤亡</p>
              <p className="font-mono font-bold text-red-400 text-sm">
                {army.units.reduce((s: number, u: any) => s + u.casualties, 0).toLocaleString()}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-magic-border space-y-2">
            {army.units?.map((u: any) => {
              const hp = Math.round((u.currentCount / Math.max(1, u.initialCount)) * 100);
              const typeColor = rarityColors[u.rarity] || '#9ca3af';
              return (
                <div key={u.unitId} className="p-2 rounded bg-magic-panel/50 border border-magic-border/50">
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xl">{u.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-gray-200 truncate">{u.name}</p>
                      <div className="flex gap-2 mt-0.5">
                        <span className="font-mono text-[10px] font-bold" style={{ color: typeColor }}>
                          {u.currentCount.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-red-400 font-mono">
                          -{u.casualties.toLocaleString()}
                        </span>
                        <span className="text-[10px] text-sky-400 font-mono ml-auto">
                          ⚡{Math.round(u.morale)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <ProgressBar value={u.currentCount} max={u.initialCount} size="sm" showValue={false}
                    color={hp > 60 ? 'green' : hp > 30 ? 'gold' : 'red'} />
                </div>
              );
            })}
          </div>
        </div>
      </Card>
    </div>
  );
}

function BattleUnitsRow({ side, units }: { side: 'player' | 'enemy'; units: any[] }) {
  return (
    <div className={clsx(
      'grid grid-cols-3 gap-3',
      side === 'enemy' ? 'flex-row-reverse' : ''
    )}>
      {units?.map((u: any, i: number) => {
        const hp = Math.round((u.currentCount / Math.max(1, u.initialCount)) * 100);
        const isDead = u.currentCount <= 0;
        return (
          <motion.div
            key={u.unitId}
            initial={false}
            animate={{ scale: isDead ? 0.8 : 1, opacity: isDead ? 0.4 : 1 }}
            className={clsx(
              'p-4 rounded-xl border-2 relative overflow-hidden transition-all',
              side === 'player'
                ? 'bg-gradient-to-br from-magic-purple/20 to-magic-gold/10 border-magic-gold/40'
                : 'bg-gradient-to-br from-red-900/30 to-red-950/10 border-red-500/40',
              isDead && 'grayscale'
            )}
          >
            <motion.div
              key={u.currentCount}
              initial={{ scale: 1.2 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className="text-center"
            >
              <div className="text-5xl mb-2">{u.icon}</div>
              <p className="text-xs font-semibold text-gray-200 truncate mb-1">{u.name}</p>
              <div className="flex justify-center gap-1 text-[10px] mb-2">
                <span className="text-red-400">⚔{u.attack}</span>
                <span className="text-sky-400">🛡{u.defense}</span>
                <span className="text-amber-400">⚡{Math.round(u.morale)}</span>
              </div>
              <p className="font-mono font-bold text-lg" style={{ color: rarityColors[u.rarity] }}>
                {u.currentCount.toLocaleString()}
                <span className="text-[10px] text-gray-500 ml-1">/ {u.initialCount.toLocaleString()}</span>
              </p>
            </motion.div>
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-magic-bg">
              <motion.div
                className={clsx('h-full',
                  hp > 60 ? 'bg-emerald-500' : hp > 30 ? 'bg-amber-500' : 'bg-red-500'
                )}
                initial={false}
                animate={{ width: `${hp}%` }}
                transition={{ duration: 0.6 }}
              />
            </div>
            {isDead && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                <span className="text-2xl font-display font-bold text-red-500">全灭</span>
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function TrendingUpIcon(props: any) { return <TrendingUp {...props} />; }

function BattleReplayPanel({ battle }: { battle: BattleState }) {
  const [selectedTurn, setSelectedTurn] = useState(1);
  const totalTurns = battle.currentTurn;

  const turnLogEntries = useMemo(() =>
    battle.log.filter(e => e.turn === selectedTurn), [battle.log, selectedTurn]);

  const skillEvents = turnLogEntries.filter(e => e.type === 'skill');
  const formationEvents = turnLogEntries.filter(e => e.type === 'formation');
  const surpriseEvents = turnLogEntries.filter(e => e.type === 'surprise');

  const keyTurningPoints = useMemo(() => {
    const turns: number[] = [];
    let maxCasualtyTurn = 1;
    let maxCasualty = 0;
    for (let t = 1; t <= totalTurns; t++) {
      const entries = battle.log.filter(e => e.turn === t);
      const hasFirstSkill = entries.some(e => e.type === 'skill') &&
        !battle.log.filter(e => e.type === 'skill' && e.turn < t).length;
      const hasFirstSurprise = entries.some(e => e.type === 'surprise') &&
        !battle.log.filter(e => e.type === 'surprise' && e.turn < t).length;
      const casualtyEntries = entries.filter(e => e.type === 'casualty');
      const totalCasualty = casualtyEntries.reduce((s, e) => s + (typeof (e.data as any)?.amount === 'number' ? (e.data as any).amount : 0), 0);
      if (totalCasualty > maxCasualty) {
        maxCasualty = totalCasualty;
        maxCasualtyTurn = t;
      }
      if (hasFirstSkill || hasFirstSurprise) {
        turns.push(t);
      }
    }
    if (!turns.includes(maxCasualtyTurn)) {
      turns.push(maxCasualtyTurn);
    }
    return turns;
  }, [battle.log, totalTurns]);

  const isKeyTurn = keyTurningPoints.includes(selectedTurn);

  return (
    <div className="grid grid-cols-12 gap-6">
      <div className="col-span-12 lg:col-span-4">
        <Card icon={<Activity className="w-5 h-5" />} title="回合时间轴">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400 font-display">回合</span>
              <span className="font-mono text-2xl font-bold text-magic-gold">
                {selectedTurn} <span className="text-sm text-gray-500">/ {totalTurns}</span>
              </span>
            </div>

            <input
              type="range"
              min={1}
              max={totalTurns}
              value={selectedTurn}
              onChange={e => setSelectedTurn(Number(e.target.value))}
              className="w-full accent-magic-gold"
            />

            <div className="flex items-center justify-between">
              <Button size="sm" icon={<ChevronLeft className="w-4 h-4" />}
                onClick={() => setSelectedTurn(Math.max(1, selectedTurn - 1))}
                disabled={selectedTurn <= 1}>
                上一回合
              </Button>
              <Button size="sm" icon={<ChevronRight className="w-4 h-4" />}
                onClick={() => setSelectedTurn(Math.min(totalTurns, selectedTurn + 1))}
                disabled={selectedTurn >= totalTurns}>
                下一回合
              </Button>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto">
              {Array.from({ length: totalTurns }, (_, i) => i + 1).map(t => (
                <button
                  key={t}
                  onClick={() => setSelectedTurn(t)}
                  className={clsx(
                    'w-9 h-9 rounded-lg text-xs font-mono font-bold border transition-all',
                    t === selectedTurn
                      ? 'bg-magic-gold/30 border-magic-gold text-magic-gold shadow-gold-glow'
                      : keyTurningPoints.includes(t)
                        ? 'bg-magic-gold/10 border-magic-gold/40 text-magic-goldLight hover:bg-magic-gold/20'
                        : 'bg-magic-panel/60 border-magic-border text-gray-400 hover:bg-magic-panel hover:border-magic-gold/30'
                  )}
                >
                  {keyTurningPoints.includes(t) && <span className="mr-0.5">⚡</span>}
                  {t}
                </button>
              ))}
            </div>
          </div>
        </Card>
      </div>

      <div className="col-span-12 lg:col-span-8 space-y-4">
        <Card className={clsx(isKeyTurn && 'border-2 border-magic-gold/60 shadow-gold-glow')}
          icon={<Swords className="w-5 h-5" />}
          title={
            <span className="flex items-center gap-2">
              回合 {selectedTurn} 战况
              {isKeyTurn && (
                <Badge variant="warning"><Zap className="w-3 h-3 mr-1" />关键转折</Badge>
              )}
            </span>
          }
        >
          <div className="space-y-4">
            <div>
              <h6 className="text-xs text-gray-400 font-display uppercase tracking-wider mb-2">伤亡统计</h6>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-magic-border">
                      <th className="text-left py-2 px-3 text-gray-500 font-display">阵营</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-display">初始兵力</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-display">当前兵力</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-display">伤亡</th>
                      <th className="text-right py-2 px-3 text-gray-500 font-display">伤亡率</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: '我方', units: battle.playerArmy.units, color: 'text-emerald-400' },
                      { label: '敌方', units: battle.enemyArmy.units, color: 'text-red-400' },
                    ].map(side => {
                      const initial = side.units.reduce((s, u) => s + u.initialCount, 0);
                      const current = side.units.reduce((s, u) => s + u.currentCount, 0);
                      const cas = initial - current;
                      const rate = initial > 0 ? Math.round((cas / initial) * 100) : 0;
                      return (
                        <tr key={side.label} className="border-b border-magic-border/30">
                          <td className={clsx('py-2 px-3 font-semibold', side.color)}>{side.label}</td>
                          <td className="py-2 px-3 text-right font-mono text-gray-300">{initial.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono text-gray-300">{current.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right font-mono text-red-400">{cas.toLocaleString()}</td>
                          <td className="py-2 px-3 text-right">
                            <span className={clsx('font-mono font-bold', rate > 50 ? 'text-red-400' : rate > 25 ? 'text-amber-400' : 'text-emerald-400')}>
                              {rate}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-3">
                {[
                  { label: '我方', units: battle.playerArmy.units },
                  { label: '敌方', units: battle.enemyArmy.units },
                ].map(side => (
                  <div key={side.label} className="space-y-1.5">
                    <p className="text-xs text-gray-500 font-display">{side.label}兵种明细</p>
                    {side.units.map(u => {
                      const cas = u.initialCount - u.currentCount;
                      const rate = u.initialCount > 0 ? Math.round((cas / u.initialCount) * 100) : 0;
                      return (
                        <div key={u.unitId} className="flex items-center gap-2 text-xs">
                          <span className="text-base">{u.icon}</span>
                          <span className="text-gray-300 truncate flex-1">{u.name}</span>
                          <span className="font-mono text-red-400">-{cas}</span>
                          <span className={clsx('font-mono font-bold w-10 text-right', rate > 50 ? 'text-red-400' : rate > 25 ? 'text-amber-400' : 'text-emerald-400')}>
                            {rate}%
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>

            <div>
              <h6 className="text-xs text-gray-400 font-display uppercase tracking-wider mb-2">战斗事件</h6>
              {skillEvents.length === 0 && formationEvents.length === 0 && surpriseEvents.length === 0 ? (
                <p className="text-sm text-gray-600 italic">该回合无特殊事件</p>
              ) : (
                <div className="space-y-2">
                  {skillEvents.length > 0 && (
                    <div className="p-3 rounded-lg bg-magic-purple/10 border border-magic-purple/30">
                      <p className="text-xs text-magic-purple font-display font-bold mb-1 flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5" /> 技能使用
                      </p>
                      {skillEvents.map((e, i) => (
                        <p key={i} className={clsx('text-sm', e.side === 'player' ? 'text-emerald-400' : 'text-red-400')}>
                          {e.message}
                        </p>
                      ))}
                    </div>
                  )}
                  {formationEvents.length > 0 && (
                    <div className="p-3 rounded-lg bg-magic-blue/10 border border-magic-blue/30">
                      <p className="text-xs text-magic-blue font-display font-bold mb-1 flex items-center gap-1.5">
                        <Shield className="w-3.5 h-3.5" /> 阵型变化
                      </p>
                      {formationEvents.map((e, i) => (
                        <p key={i} className={clsx('text-sm', e.side === 'player' ? 'text-emerald-400' : 'text-red-400')}>
                          {e.message}
                        </p>
                      ))}
                    </div>
                  )}
                  {surpriseEvents.length > 0 && (
                    <div className="p-3 rounded-lg bg-magic-flame/10 border border-magic-flame/30">
                      <p className="text-xs text-magic-flame font-display font-bold mb-1 flex items-center gap-1.5">
                        <Zap className="w-3.5 h-3.5" /> 奇袭效果
                      </p>
                      {surpriseEvents.map((e, i) => (
                        <p key={i} className={clsx('text-sm', e.side === 'player' ? 'text-emerald-400' : 'text-red-400')}>
                          {e.message}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <h6 className="text-xs text-gray-400 font-display uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-magic-gold" /> 关键转折回合
              </h6>
              <div className="flex flex-wrap gap-2">
                {keyTurningPoints.map(t => (
                  <button
                    key={t}
                    onClick={() => setSelectedTurn(t)}
                    className={clsx(
                      'px-3 py-1.5 rounded-lg text-sm font-display font-bold border-2 transition-all',
                      t === selectedTurn
                        ? 'bg-magic-gold/20 border-magic-gold text-magic-gold shadow-gold-glow'
                        : 'bg-magic-gold/5 border-magic-gold/30 text-magic-goldLight hover:bg-magic-gold/10'
                    )}
                  >
                    ⚡ 回合 {t}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

// Avoid unused warning
export { };
