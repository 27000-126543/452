import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Castle, Coins, Gem, Users, ArrowUp, Award, TrendingUp, Crown,
  Shield, Eye, Zap, Plus, Gift, Star, Target, Rocket, Sparkles, Lock
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { Badge, RarityBadge } from '@/components/ui/Badge';
import { useLegionStore, usePlayerStore } from '@/store';
import type { LegionRole } from '@/types';
import { clsx } from 'clsx';

const materialIcons: Record<string, string> = {
  iron: '⚙️',
  wood: '🪵',
  crystal: '💎',
  mana: '🔮',
};

export default function HeadquartersPage() {
  const { legion, contributeToHeadquarters, addMemberContribution } = useLegionStore();
  const { player, updateGold, updateMaterials } = usePlayerStore();

  const [goldAmount, setGoldAmount] = useState(1000);
  const [materials, setMaterials] = useState<Record<string, number>>({ iron: 100, wood: 50, crystal: 10, mana: 20 });
  const [activeTab, setActiveTab] = useState<'upgrade' | 'effects' | 'contributions'>('upgrade');

  const hq = legion.headquarters;
  const progressPct = Math.round((hq.upgradeProgress.current / hq.upgradeProgress.required) * 100);
  const isLeadership = player.legionRole === 'commander' || player.legionRole === 'quartermaster' || player.legionRole === 'vice_commander';

  const handleDonate = () => {
    if (player.gold < goldAmount) return;
    const totalMats = Object.values(materials).reduce((s, v) => s + v, 0);
    if (totalMats <= 0 && goldAmount <= 0) return;
    const playerMaterials: Record<string, number> = {};
    Object.keys(materials).forEach(k => { playerMaterials[k] = -materials[k]; });
    updateGold(-goldAmount);
    updateMaterials(playerMaterials);
    contributeToHeadquarters(player.id, goldAmount, materials);
  };

  const canUpgrade = hq.upgradeProgress.current >= hq.upgradeProgress.required && hq.level < hq.maxLevel;

  const effectsList = [
    { level: 1, name: '基础指挥部', desc: '战力上限+2,500', effect: 'power_cap', icon: Shield },
    { level: 2, name: '通讯中心', desc: '战场视野+1格', effect: 'vision', icon: Eye },
    { level: 3, name: '联合作战室', desc: '大赛积分+10%', effect: 'points', icon: TrophyIcon },
    { level: 4, name: '资源仓库', desc: '补给上限+20%', effect: 'supplies', icon: Gift },
    { level: 5, name: '精英学院', desc: '战力上限+12,500', effect: 'power_cap', icon: Shield },
    { level: 6, name: '战术模拟室', desc: '战场视野+2格', effect: 'vision', icon: Target },
    { level: 7, name: '荣耀殿堂', desc: '大赛积分+20%', effect: 'points', icon: Award },
    { level: 8, name: '巨龙巢穴', desc: '招募速度+30%', effect: 'recruit', icon: Rocket },
    { level: 9, name: '魔法要塞', desc: '战力上限+20,000', effect: 'power_cap', icon: Sparkles },
    { level: 10, name: '永恒王座', desc: '全属性加成MAX', effect: 'ultimate', icon: Crown },
  ];

  const sortedMembers = [...legion.members].sort((a, b) => b.contribution - a.contribution);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 xl:col-span-8" goldBorder
          icon={<Castle className="w-6 h-6" />}
          title={
            <div>
              <div className="flex items-center gap-4 flex-wrap">
                <h3 className="font-display text-2xl font-bold glow-text-gold text-magic-gold">
                  🏰 {legion.name} · 联合军部
                </h3>
                <Badge variant="warning">Lv.{hq.level}/{hq.maxLevel}</Badge>
                {canUpgrade && (
                  <span className="px-3 py-1 rounded-full bg-gradient-to-r from-magic-flame to-magic-gold text-black text-xs font-bold font-display uppercase animate-pulse">
                    ✨ 可升级!
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-400 mt-1">全员贡献升级材料与金币，解锁强力加成</p>
            </div>
          }
        >
          <div className="relative p-6 rounded-xl bg-gradient-to-br from-magic-purple/20 via-magic-gold/10 to-magic-blue/10 border border-magic-gold/40 mb-6 overflow-hidden">
            <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-magic-gold/10 blur-3xl" />
            <div className="absolute -bottom-10 -left-10 w-48 h-48 rounded-full bg-magic-purple/20 blur-3xl" />
            <div className="relative grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
              <div className="text-center">
                <motion.div
                  animate={{ rotate: [0, 3, -3, 0] }}
                  transition={{ repeat: Infinity, duration: 6 }}
                  className="text-8xl mb-2 filter drop-shadow-gold-glow inline-block"
                >
                  🏰
                </motion.div>
                <p className="font-display text-xl font-bold text-magic-gold">联合军部</p>
                <p className="font-mono text-3xl font-bold text-gray-100 mt-1">Lv.{hq.level}</p>
              </div>
              <div className="md:col-span-2 space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-display text-gray-300 flex items-center gap-2">
                      <ArrowUp className="w-4 h-4 text-magic-gold" />
                      升级进度 → Lv.{hq.level + 1}
                    </span>
                    <span className="font-mono font-bold text-magic-gold text-lg">
                      {progressPct}%
                    </span>
                  </div>
                  <ProgressBar
                    value={hq.upgradeProgress.current}
                    max={hq.upgradeProgress.required}
                    color="gold"
                    size="lg"
                    showValue={false}
                  />
                  <div className="flex justify-between text-xs font-mono text-gray-400 mt-1.5">
                    <span>{Math.floor(hq.upgradeProgress.current).toLocaleString()} 贡献值</span>
                    <span>{hq.upgradeProgress.required.toLocaleString()} 所需</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-3 rounded-lg bg-magic-bg/60 border border-magic-border/50">
                    <Coins className="w-5 h-5 text-magic-gold mx-auto mb-1" />
                    <p className="text-gray-500 uppercase text-[10px]">已捐金币</p>
                    <p className="font-mono font-bold text-magic-gold">{hq.upgradeProgress.goldContributed.toLocaleString()}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-magic-bg/60 border border-magic-border/50">
                    <Users className="w-5 h-5 text-magic-blue mx-auto mb-1" />
                    <p className="text-gray-500 uppercase text-[10px]">成员参与</p>
                    <p className="font-mono font-bold text-magic-blue">{legion.members.length}人</p>
                  </div>
                  <div className="p-3 rounded-lg bg-magic-bg/60 border border-magic-border/50">
                    <TrendingUp className="w-5 h-5 text-emerald-400 mx-auto mb-1" />
                    <p className="text-gray-500 uppercase text-[10px]">当前加成</p>
                    <p className="font-mono font-bold text-emerald-400">+{hq.powerCapBonus.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 border-b border-magic-border mb-5 overflow-x-auto">
            {([
              { k: 'upgrade', label: '贡献升级', icon: Coins },
              { k: 'effects', label: '解锁效果', icon: Zap },
              { k: 'contributions', label: '贡献排行', icon: Award },
            ] as const).map(t => (
              <button
                key={t.k}
                onClick={() => setActiveTab(t.k)}
                className={`tab-btn whitespace-nowrap flex items-center gap-2 ${activeTab === t.k ? 'tab-btn-active' : ''}`}
              >
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          {activeTab === 'upgrade' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-5 rounded-xl bg-magic-panel/60 border border-magic-border">
                <h4 className="font-display font-bold text-magic-goldLight flex items-center gap-2 mb-4">
                  <Gift className="w-4 h-4" /> 捐献物资
                </h4>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs text-gray-400 mb-1.5 flex items-center gap-1">
                      <Coins className="w-3 h-3 text-magic-gold" /> 金币捐献
                      <span className="ml-auto font-mono text-magic-goldLight">
                        余额: {player.gold.toLocaleString()}
                      </span>
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        value={goldAmount}
                        onChange={e => setGoldAmount(Math.max(0, parseInt(e.target.value) || 0))}
                        className="magic-input flex-1 font-mono"
                      />
                      {[1000, 5000, 10000, 50000].map(v => (
                        <Button key={v} size="sm" variant="ghost" onClick={() => setGoldAmount(v)}>
                          {(v / 1000)}K
                        </Button>
                      ))}
                    </div>
                    <p className="text-[11px] text-gray-500 mt-1">
                      每 10 金币 = 1 贡献值
                    </p>
                  </div>

                  <div className="rune-divider !my-2" />

                  <p className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                    <Gem className="w-3 h-3 text-purple-400" /> 材料捐献
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(materialIcons).map(([k, icon]) => {
                      const available = player.materials[k] || 0;
                      return (
                        <div key={k} className="p-3 rounded-lg bg-magic-bg/60 border border-magic-border/50">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xl">{icon}</span>
                            <span className="font-semibold text-sm text-gray-200 capitalize">{k}</span>
                            <span className="ml-auto text-xs text-gray-500 font-mono">{available}</span>
                          </div>
                          <input
                            type="number"
                            value={materials[k] || 0}
                            min={0}
                            max={available}
                            onChange={e => setMaterials(prev => ({
                              ...prev,
                              [k]: Math.max(0, Math.min(available, parseInt(e.target.value) || 0)),
                            }))}
                            className="magic-input !py-1 text-sm font-mono text-center"
                          />
                          <p className="text-[10px] text-gray-500 mt-1">每单位 = 2 贡献值</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <Button
                  fullWidth
                  variant="primary"
                  className="mt-5"
                  size="lg"
                  icon={<ArrowUp className="w-5 h-5" />}
                  disabled={goldAmount <= 0 && Object.values(materials).every(v => v <= 0)}
                  onClick={handleDonate}
                >
                  确认捐献
                </Button>
              </div>

              <div className="space-y-4">
                <div className="p-5 rounded-xl bg-gradient-to-br from-magic-gold/10 via-magic-purple/10 to-magic-blue/10 border border-magic-gold/40">
                  <h4 className="font-display font-bold text-magic-gold mb-3 flex items-center gap-2">
                    <Target className="w-4 h-4" /> 升级 Lv.{hq.level + 1} 预览
                  </h4>
                  {hq.level >= hq.maxLevel ? (
                    <p className="text-center py-8 text-magic-gold font-display font-bold">
                      🎉 已达到最高等级！
                    </p>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-center gap-2 p-2 rounded bg-magic-bg/40">
                        <Shield className="w-4 h-4 text-magic-blue" />
                        <span className="text-gray-300">全体战力上限</span>
                        <span className="ml-auto font-mono font-bold text-magic-blue">
                          +{2500 * (hq.level + 1) - hq.powerCapBonus}
                        </span>
                      </li>
                      <li className="flex items-center gap-2 p-2 rounded bg-magic-bg/40">
                        <Eye className="w-4 h-4 text-emerald-400" />
                        <span className="text-gray-300">战场视野</span>
                        <span className="ml-auto font-mono font-bold text-emerald-400">
                          +{Math.floor((hq.level + 1) / 2) - hq.visionBonus} 格
                        </span>
                      </li>
                      <li className="flex items-center gap-2 p-2 rounded bg-magic-bg/40">
                        <Zap className="w-4 h-4 text-magic-flame" />
                        <span className="text-gray-300">大赛积分加成</span>
                        <span className="ml-auto font-mono font-bold text-magic-flame">
                          +5%
                        </span>
                      </li>
                      <li className="flex items-center gap-2 p-2 rounded bg-magic-bg/40">
                        <Rocket className="w-4 h-4 text-magic-purpleLight" />
                        <span className="text-gray-300">解锁效果</span>
                        <span className="ml-auto font-display font-bold text-magic-purpleLight">
                          {effectsList[hq.level]?.name}
                        </span>
                      </li>
                    </ul>
                  )}
                </div>

                <div className="p-5 rounded-xl bg-magic-panel/60 border border-magic-border">
                  <h4 className="font-display font-bold text-magic-goldLight mb-3">
                    <Lock className="w-4 h-4 inline mr-2" />
                    军需官提示
                  </h4>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    联合军部是军团的核心建筑，等级越高全体成员获得的加成越强。
                    {!isLeadership && (
                      <span className="block mt-2 text-amber-400">
                        ⚠️ 您是普通成员，仅可进行捐献操作。升级功能需军团长或后勤官执行。
                      </span>
                    )}
                  </p>
                  {isLeadership && (
                    <Button
                      fullWidth
                      className="mt-4"
                      variant={canUpgrade ? 'primary' : 'default'}
                      disabled={!canUpgrade}
                      icon={<Rocket className="w-4 h-4" />}
                      onClick={() => {
                        addMemberContribution(player.id, 500);
                        contributeToHeadquarters(player.id, 0, {});
                      }}
                    >
                      {canUpgrade ? '🚀 执行升级' : '升级条件不足'}
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'effects' && (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {effectsList.map(e => {
                const unlocked = hq.level >= e.level;
                const isCurrent = hq.level === e.level;
                return (
                  <motion.div
                    key={e.level}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: e.level * 0.03 }}
                    className={clsx(
                      'p-4 rounded-xl border-2 text-center relative overflow-hidden transition-all',
                      unlocked
                        ? isCurrent
                          ? 'bg-gradient-to-br from-magic-gold/30 via-magic-purple/20 to-magic-card border-magic-gold shadow-gold-glow scale-[1.02]'
                          : 'bg-gradient-to-br from-emerald-900/20 via-magic-card to-magic-panel/80 border-emerald-600/50'
                        : 'bg-magic-panel/30 border-magic-border/60 opacity-60 grayscale'
                    )}
                  >
                    {isCurrent && (
                      <span className="absolute top-2 right-2 text-[10px] px-2 py-0.5 rounded-full bg-magic-gold text-black font-bold uppercase">
                        当前
                      </span>
                    )}
                    <div className={clsx(
                      'w-14 h-14 mx-auto mb-2 rounded-xl flex items-center justify-center',
                      unlocked
                        ? 'bg-gradient-to-br from-magic-gold/30 to-magic-purple/30 border border-magic-gold/40'
                        : 'bg-magic-bg border border-magic-border'
                    )}>
                      {unlocked ? (
                        <e.icon className="w-7 h-7 text-magic-gold" />
                      ) : (
                        <Lock className="w-6 h-6 text-gray-500" />
                      )}
                    </div>
                    <p className="text-xs font-mono text-gray-400 mb-0.5">Lv.{e.level}</p>
                    <p className="font-display font-bold text-sm mb-1" style={{ color: unlocked ? '#f4d06f' : '#6b7280' }}>
                      {e.name}
                    </p>
                    <p className="text-[11px] text-gray-500 leading-tight">{e.desc}</p>
                  </motion.div>
                );
              })}
            </div>
          )}

          {activeTab === 'contributions' && (
            <div className="space-y-2">
              <div className="p-3 rounded-lg bg-magic-panel/60 border border-magic-border flex items-center justify-between text-xs font-display text-gray-400 uppercase tracking-wider">
                <span className="w-8 text-center">#</span>
                <span className="flex-1">成员</span>
                <span className="w-24 text-center">职务</span>
                <span className="w-40 text-center">贡献值</span>
                <span className="w-40 text-center">部队战力</span>
              </div>
              {sortedMembers.map((m, i) => {
                const roleNames: Record<LegionRole, string> = {
                  commander: '军团长', vice_commander: '副军团长', quartermaster: '后勤官', member: '成员',
                };
                const pct = (m.contribution / (sortedMembers[0]?.contribution || 1)) * 100;
                return (
                  <motion.div
                    key={m.playerId}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.02 }}
                    className="p-3 rounded-lg bg-magic-card border border-magic-border hover:border-magic-gold/40 transition-all flex items-center gap-4"
                  >
                    <div className={clsx(
                      'w-8 text-center font-mono font-bold text-lg',
                      i === 0 ? 'text-magic-gold glow-text-gold' :
                      i === 1 ? 'text-gray-300' :
                      i === 2 ? 'text-amber-600' : 'text-gray-500'
                    )}>
                      {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                    </div>
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-magic-purple/60 to-magic-gold/40 flex items-center justify-center text-xl shrink-0">
                        {m.avatar}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-gray-100 truncate">{m.playerName}</p>
                        <div className="h-1.5 w-32 mt-1 rounded-full bg-magic-bg overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-magic-purple to-magic-gold transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="w-24 text-center shrink-0">
                      <RarityBadge rarity={i === 0 ? 'legendary' : i <= 2 ? 'epic' : i <= 5 ? 'rare' : 'common'}>
                        {roleNames[m.role]}
                      </RarityBadge>
                    </div>
                    <div className="w-40 text-right shrink-0">
                      <p className="font-mono font-bold text-magic-gold text-lg">{m.contribution.toLocaleString()}</p>
                    </div>
                    <div className="w-40 text-right shrink-0">
                      <p className="font-mono font-bold text-magic-blue text-lg">{m.armyPower.toLocaleString()}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="col-span-12 xl:col-span-4 space-y-6">
          <Card icon={<Star className="w-5 h-5" />} title="军部加成概览">
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-gradient-to-r from-magic-blue/15 to-transparent border border-magic-blue/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-magic-blue" /> 战力上限加成
                  </span>
                  <span className="font-mono font-bold text-magic-blue text-xl">+{hq.powerCapBonus.toLocaleString()}</span>
                </div>
                <ProgressBar value={hq.level} max={hq.maxLevel} color="blue" size="sm" showValue={false} />
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-600/15 to-transparent border border-emerald-600/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-400" /> 战场视野加成
                  </span>
                  <span className="font-mono font-bold text-emerald-400 text-xl">+{hq.visionBonus} 格</span>
                </div>
                <ProgressBar value={hq.visionBonus} max={5} color="green" size="sm" showValue={false} />
              </div>
              <div className="p-4 rounded-xl bg-gradient-to-r from-magic-gold/15 to-transparent border border-magic-gold/40">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-200 flex items-center gap-2">
                    <TrophyIcon className="w-4 h-4 text-magic-gold" /> 大赛积分加成
                  </span>
                  <span className="font-mono font-bold text-magic-gold text-xl">+{hq.level * 2 + 3}%</span>
                </div>
                <ProgressBar value={hq.level * 2 + 3} max={25} color="gold" size="sm" showValue={false} />
              </div>
            </div>
          </Card>

          <Card icon={<Users className="w-5 h-5" />} title="军部成员">
            <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
              {legion.members.slice(0, 8).map(m => (
                <div key={m.playerId} className="flex items-center gap-3 p-2 rounded-lg hover:bg-magic-panel/60 transition-all">
                  <span className="text-2xl">{m.avatar}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-gray-200 truncate">{m.playerName}</p>
                    <p className="text-[10px] text-gray-500 font-mono">贡献: {m.contribution.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card icon={<Sparkles className="w-5 h-5" />} title="军团荣耀">
            <div className="space-y-3">
              {[
                { label: '成立天数', value: Math.floor((Date.now() - legion.createdAt) / 86400000), icon: '📅' },
                { label: '累计贡献', value: legion.contribution.toLocaleString(), icon: '⭐' },
                { label: '总战力', value: legion.totalPower.toLocaleString(), icon: '⚔️' },
                { label: '军部等级', value: `Lv.${hq.level}`, icon: '🏰' },
              ].map(s => (
                <div key={s.label} className="flex items-center justify-between p-3 rounded-lg bg-magic-panel/50 border border-magic-border">
                  <span className="flex items-center gap-2">
                    <span className="text-xl">{s.icon}</span>
                    <span className="text-sm text-gray-300">{s.label}</span>
                  </span>
                  <span className="font-mono font-bold text-magic-gold text-lg">{s.value}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function TrophyIcon(props: any) { return <Award {...props} />; }
