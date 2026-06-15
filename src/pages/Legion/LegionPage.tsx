import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Crown, Shield, Check, X, UserPlus, ArrowUp, Settings, Star,
  TrendingUp, Award, FileText, ChevronDown, ChevronUp, Coins, Gem
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { Badge, RankBadge } from '@/components/ui/Badge';
import { useLegionStore, usePlayerStore } from '@/store';
import type { LegionRole, RecruitRequest } from '@/types';

const roleInfo: Record<LegionRole, { label: string; icon: typeof Crown; color: string; description: string }> = {
  commander: { label: '军团长', icon: Crown, color: 'from-yellow-600 via-amber-500 to-yellow-400', description: '最高权限，负责军团一切事务' },
  vice_commander: { label: '副军团长', icon: Shield, color: 'from-purple-700 via-purple-500 to-purple-400', description: '协助管理，拥有审批和指挥权' },
  quartermaster: { label: '后勤官', icon: Coins, color: 'from-sky-700 via-sky-500 to-cyan-400', description: '管理物资交易，维护补给线' },
  member: { label: '成员', icon: Users, color: 'from-slate-700 via-slate-500 to-gray-400', description: '普通成员，参与战争与贡献' },
};

type Tab = 'members' | 'recruits' | 'promotions' | 'research' | 'permissions';

export default function LegionPage() {
  const [tab, setTab] = useState<Tab>('members');
  const [expanded, setExpanded] = useState<string | null>(null);
  const legion = useLegionStore(s => s.legion);
  const player = usePlayerStore(s => s.player);
  const approveRecruit = useLegionStore(s => s.approveRecruit);
  const approvePromotion = useLegionStore(s => s.approvePromotion);
  const assignRole = useLegionStore(s => s.assignRole);
  const approveResearch = useLegionStore(s => s.approveResearch);

  const isCommander = player.legionRole === 'commander';
  const isLeadership = player.legionRole === 'commander' || player.legionRole === 'vice_commander';

  const tabCounts = {
    members: legion.members.length,
    recruits: legion.recruitRequests.filter(r => r.status === 'pending').length,
    promotions: legion.promotionRequests.filter(r => r.status === 'pending').length,
    research: legion.researchProjects.length,
    permissions: 4,
  };

  const sortedMembers = [...legion.members].sort((a, b) => {
    const order: LegionRole[] = ['commander', 'vice_commander', 'quartermaster', 'member'];
    return order.indexOf(a.role) - order.indexOf(b.role);
  });

  const handleApproveRecruit = (id: string, approve: boolean) => {
    approveRecruit(id, approve);
  };

  const handleApprovePromotion = (id: string, approve: boolean) => {
    approvePromotion(id, approve);
  };

  return (
    <div className="space-y-6">
      <Card
        goldBorder
        icon={<Crown className="w-6 h-6" />}
        title={
          <div className="flex items-center gap-4">
            <div className="text-5xl">{legion.banner.emblem}</div>
            <div>
              <h3 className="font-display text-3xl font-bold glow-text-gold text-magic-gold">{legion.name}</h3>
              <p className="text-lg text-gray-400 italic mt-1">「{legion.slogan}」</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge variant="warning">
                  <Users className="w-3 h-3 mr-1" /> {legion.members.length}/60 成员
                </Badge>
                <Badge variant="success">
                  <TrendingUp className="w-3 h-3 mr-1" /> 总战力 {legion.totalPower.toLocaleString()}
                </Badge>
                <Badge variant="info">
                  <Award className="w-3 h-3 mr-1" /> 贡献 {legion.contribution.toLocaleString()}
                </Badge>
              </div>
            </div>
          </div>
        }
      >
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
          {Object.entries(roleInfo).map(([role, info]) => {
            const count = legion.members.filter(m => m.role === role).length;
            return (
              <div key={role} className="p-4 rounded-lg bg-magic-panel/60 border border-magic-border">
                <div className="flex items-center gap-3 mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${info.color} flex items-center justify-center text-white`}>
                    <info.icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-display font-bold text-sm text-gray-200">{info.label}</p>
                    <p className="font-mono text-xl font-bold text-magic-gold">{count}</p>
                  </div>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{info.description}</p>
              </div>
            );
          })}
        </div>
      </Card>

      <div className="flex gap-2 border-b border-magic-border overflow-x-auto">
        {([
          { k: 'members' as const, label: '成员管理', icon: Users },
          { k: 'recruits' as const, label: '新兵审批', icon: UserPlus, badge: tabCounts.recruits },
          { k: 'promotions' as const, label: '晋升申请', icon: ArrowUp, badge: tabCounts.promotions },
          { k: 'research' as const, label: '研发立项', icon: FileText },
          { k: 'permissions' as const, label: '权限分配', icon: Settings, requires: 'commander' as const },
        ]).map((t: any) => {
          if (t.requires === 'commander' && !isCommander) return null;
          const Icon = t.icon;
          return (
            <button
              key={t.k}
              onClick={() => setTab(t.k as Tab)}
              className={`tab-btn whitespace-nowrap flex items-center gap-2 ${tab === t.k ? 'tab-btn-active' : ''}`}
            >
              <Icon className="w-4 h-4" /> {t.label}
              {typeof t.badge === 'number' && t.badge > 0 && (
                <span className="ml-1 w-5 h-5 rounded-full bg-magic-flame text-white text-xs flex items-center justify-center font-bold">
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {tab === 'members' && (
        <Card icon={<Users className="w-5 h-5" />} title="军团成员" subtitle={`按军衔排序，共 ${legion.members.length} 人`}>
          <div className="space-y-2">
            {sortedMembers.map((member, idx) => {
              const info = roleInfo[member.role];
              const isExpanded = expanded === member.playerId;
              return (
                <motion.div
                  key={member.playerId}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.02 }}
                  className="rounded-xl border border-magic-border bg-magic-panel/50 overflow-hidden hover:border-magic-gold/40 transition-all"
                >
                  <div
                    className="p-4 flex items-center gap-4 cursor-pointer"
                    onClick={() => setExpanded(isExpanded ? null : member.playerId)}
                  >
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-magic-purple to-magic-gold flex items-center justify-center text-2xl">
                      {member.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3">
                        <p className="font-display font-bold text-lg text-gray-100">{member.playerName}</p>
                        <span className={`px-2 py-0.5 rounded text-xs font-semibold text-white bg-gradient-to-r ${info.color}`}>
                          {info.label}
                        </span>
                        <RankBadge tier={member.rank} size="sm" />
                      </div>
                      <div className="flex items-center gap-6 mt-1 text-sm">
                        <span className="text-gray-400">
                          <Shield className="w-3.5 h-3.5 inline mr-1 text-magic-blue" />
                          战力 <span className="font-mono font-bold text-magic-blue">{member.armyPower.toLocaleString()}</span>
                        </span>
                        <span className="text-gray-400">
                          <Star className="w-3.5 h-3.5 inline mr-1 text-magic-gold" />
                          贡献 <span className="font-mono font-bold text-magic-gold">{member.contribution.toLocaleString()}</span>
                        </span>
                        <span className="text-gray-500 text-xs">
                          加入于 {new Date(member.joinedAt).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                    </div>
                    <ChevronDown className={`w-5 h-5 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                  </div>

                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="border-t border-magic-border p-4 bg-magic-bg/40"
                    >
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                        <ProgressBar value={member.contribution} max={50000} label="本赛季贡献" color="gold" />
                        <ProgressBar value={member.armyPower} max={100000} label="部队战力" color="purple" />
                        <ProgressBar value={80 + idx * 3} max={100} label="活跃度" color="blue" />
                      </div>
                      {isLeadership && member.playerId !== player.id && (
                        <div className="flex gap-2 flex-wrap">
                          {(['vice_commander', 'quartermaster', 'member'] as LegionRole[]).map(r => (
                            <Button
                              key={r}
                              size="sm"
                              variant={member.role === r ? 'primary' : 'default'}
                              disabled={member.role === r}
                              onClick={(e) => { e.stopPropagation(); assignRole(member.playerId, r); }}
                            >
                              设为{roleInfo[r].label}
                            </Button>
                          ))}
                        </div>
                      )}
                    </motion.div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </Card>
      )}

      {tab === 'recruits' && (
        <Card
          icon={<UserPlus className="w-5 h-5" />}
          title="新兵申请审批"
          subtitle={`待处理 ${tabCounts.recruits} 份申请`}
        >
          {legion.recruitRequests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-display">暂无新的入伍申请</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {legion.recruitRequests.filter(r => r.status === 'pending').map((req: RecruitRequest, idx) => (
                <motion.div
                  key={req.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: idx * 0.05 }}
                  className="p-5 rounded-xl border border-magic-border bg-gradient-to-br from-magic-card to-magic-panel/60"
                >
                  <div className="flex items-start gap-4">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-magic-purple/60 to-magic-blue/40 flex items-center justify-center text-3xl shrink-0">
                      {req.avatar}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-display font-bold text-xl text-magic-goldLight">{req.playerName}</p>
                        <span className="text-xs text-gray-500">
                          {Math.floor((Date.now() - req.submittedAt) / 3600000)} 小时前
                        </span>
                      </div>
                      <div className="p-3 rounded-lg bg-magic-bg/60 border border-magic-border/50 mt-2 mb-4">
                        <p className="text-sm text-gray-300 italic">「{req.message}」</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="primary"
                          size="sm"
                          icon={<Check className="w-4 h-4" />}
                          onClick={() => handleApproveRecruit(req.id, true)}
                        >
                          批准入伍
                        </Button>
                        <Button
                          variant="danger"
                          size="sm"
                          icon={<X className="w-4 h-4" />}
                          onClick={() => handleApproveRecruit(req.id, false)}
                        >
                          拒绝
                        </Button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'promotions' && (
        <Card icon={<ArrowUp className="w-5 h-5" />} title="晋升申请" subtitle="审核成员晋升请求">
          {legion.promotionRequests.filter(r => r.status === 'pending').length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <ArrowUp className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="font-display">暂无待处理的晋升申请</p>
            </div>
          ) : (
            <div className="space-y-4">
              {legion.promotionRequests.filter(r => r.status === 'pending').map(req => (
                <div key={req.id} className="p-5 rounded-xl border border-magic-border bg-magic-panel/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <p className="font-display font-bold text-lg text-gray-100">{req.playerName}</p>
                      <Badge variant="warning">{roleInfo[req.currentRole].label}</Badge>
                      <span className="text-gray-500">→</span>
                      <Badge variant="success">{roleInfo[req.requestedRole].label}</Badge>
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-4 p-3 bg-magic-bg/40 rounded-lg">理由：{req.reason}</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="primary" icon={<Check className="w-4 h-4" />} onClick={() => handleApprovePromotion(req.id, true)}>批准晋升</Button>
                    <Button size="sm" variant="danger" icon={<X className="w-4 h-4" />} onClick={() => handleApprovePromotion(req.id, false)}>驳回</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      )}

      {tab === 'research' && (
        <Card icon={<Gem className="w-5 h-5" />} title="兵种研发立项" subtitle="全军团参与研发，解锁高级兵种加成">
          <div className="grid gap-4 md:grid-cols-2">
            {legion.researchProjects.map((proj, idx) => (
              <motion.div
                key={proj.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.08 }}
                className="p-5 rounded-xl border border-magic-border bg-gradient-to-br from-magic-card to-magic-purple/10"
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="font-display font-bold text-lg text-magic-goldLight">{proj.name}</h4>
                    <p className="text-sm text-gray-400 mt-0.5">{proj.description}</p>
                  </div>
                  <Badge
                    variant={
                      proj.status === 'completed' ? 'success' :
                      proj.status === 'in_progress' ? 'info' :
                      proj.status === 'approved' ? 'warning' : 'default'
                    }
                  >
                    {proj.status === 'completed' ? '已完成' :
                     proj.status === 'in_progress' ? '研发中' :
                     proj.status === 'approved' ? '已批准' : '待审批'}
                  </Badge>
                </div>
                <ProgressBar value={proj.progress} max={proj.target} label="研发进度" color="purple" />
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-500">发起者: {proj.proposedBy}</span>
                  {proj.status === 'pending' && isLeadership && (
                    <div className="flex gap-2">
                      <Button size="sm" variant="primary" onClick={() => approveResearch(proj.id, true)}>通过</Button>
                      <Button size="sm" variant="ghost" onClick={() => approveResearch(proj.id, false)}>搁置</Button>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>
      )}

      {tab === 'permissions' && isCommander && (
        <Card icon={<Settings className="w-5 h-5" />} title="三级权限矩阵" subtitle="定义各职位的系统操作权限">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-magic-border">
                  <th className="p-3 text-left font-display text-magic-gold">权限项</th>
                  {(['commander', 'vice_commander', 'quartermaster', 'member'] as LegionRole[]).map(r => (
                    <th key={r} className="p-3 text-center font-display text-gray-300">{roleInfo[r].label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[
                  { name: '审批新兵入伍', roles: ['commander', 'vice_commander'] },
                  { name: '审批晋升申请', roles: ['commander', 'vice_commander'] },
                  { name: '任免职务', roles: ['commander'] },
                  { name: '发起研发立项', roles: ['commander', 'vice_commander', 'quartermaster'] },
                  { name: '审批研发项目', roles: ['commander', 'vice_commander'] },
                  { name: '管理物资交易', roles: ['commander', 'vice_commander', 'quartermaster'] },
                  { name: '升级联合军部', roles: ['commander', 'quartermaster'] },
                  { name: '使用军团资金', roles: ['commander', 'quartermaster'] },
                  { name: '参加战争大赛', roles: ['commander', 'vice_commander', 'quartermaster', 'member'] },
                  { name: '捐献贡献', roles: ['commander', 'vice_commander', 'quartermaster', 'member'] },
                ].map((perm, i) => (
                  <tr key={perm.name} className={i % 2 ? 'bg-magic-panel/30' : ''}>
                    <td className="p-3 text-gray-300">{perm.name}</td>
                    {(['commander', 'vice_commander', 'quartermaster', 'member'] as LegionRole[]).map(r => (
                      <td key={r} className="p-3 text-center">
                        {perm.roles.includes(r) ? (
                          <div className="inline-flex w-6 h-6 rounded-full bg-emerald-900/60 text-emerald-400 items-center justify-center">
                            <Check className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="inline-flex w-6 h-6 rounded-full bg-red-900/30 text-red-400/50 items-center justify-center">
                            <X className="w-4 h-4" />
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
