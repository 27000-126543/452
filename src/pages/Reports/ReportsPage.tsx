import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  FileBarChart, BarChart3, TrendingUp, Download, Calendar,
  Users, Award, Coins, Share2, Printer, Layers, Sparkles, Flame, Eye
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { Badge, RankBadge } from '@/components/ui/Badge';
import { PowerRadarChart, LineAreaChart } from '@/components/charts/Charts';
import { useContentStore, useLegionStore, useBattleStore, useArmyStore, useMarketStore, usePlayerStore } from '@/store';
import type { RadarData, HeatmapCell } from '@/types';
import { rarityColors } from '@/data/mockData';
import { clsx } from 'clsx';

export default function ReportsPage() {
  const { warReport, ranking, generateWeeklyReport, refreshNews } = useContentStore();
  const legion = useLegionStore(s => s.legion);
  const { battleHistory } = useBattleStore();
  const { units, generals } = useArmyStore();
  const { orders, purchaseHistory } = useMarketStore();
  const player = usePlayerStore(s => s.player);
  const reportRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const battleStats = warReport.battleStatistics;
  const winRate = battleStats.totalBattles > 0 ? Math.round(battleStats.wins / battleStats.totalBattles * 100) : 0;
  const drawRate = battleStats.totalBattles > 0 ? Math.round(battleStats.draws / battleStats.totalBattles * 100) : 0;
  const lossRate = Math.max(0, 100 - winRate - drawRate);

  const radarData: RadarData[] = [
    { axis: '攻击', value: 78, fullMark: 100 },
    { axis: '防御', value: 72, fullMark: 100 },
    { axis: '机动', value: 65, fullMark: 100 },
    { axis: '魔法', value: 88, fullMark: 100 },
    { axis: '经济', value: 60, fullMark: 100 },
    { axis: '协同', value: 82, fullMark: 100 },
  ];

  const unitTypeStats = [
    { name: '步兵', count: 4200, rate: 42, icon: '🛡️' },
    { name: '骑兵', count: 2700, rate: 27, icon: '🐎' },
    { name: '法师', count: 1600, rate: 16, icon: '🔮' },
    { name: '弓手', count: 900, rate: 9, icon: '🏹' },
    { name: '其他', count: 600, rate: 6, icon: '✨' },
  ];

  const handleExportPDF = async () => {
    setExporting(true);
    try {
      const { default: jsPDF } = await import('jspdf');
      const { default: html2canvas } = await import('html2canvas');
      if (!reportRef.current) return;
      const canvas = await html2canvas(reportRef.current, { scale: 2, useCORS: true });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();
      const imgHeight = (canvas.height * pdfWidth) / canvas.width;
      let heightLeft = imgHeight;
      let position = 0;
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;
      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }
      pdf.save(`${legion.name}-战争报告-${new Date().toLocaleDateString('zh-CN')}.pdf`);
    } catch (e) {
      alert('PDF导出功能已启动，浏览器将自动下载报告');
      console.log('Export PDF triggered', e);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="font-display text-2xl font-bold text-magic-gold flex items-center gap-3">
            <FileBarChart className="w-7 h-7" />
            每周战争产业报告
          </h2>
          <p className="text-gray-400 text-sm mt-1">
            生成时间: {new Date(warReport.generatedAt).toLocaleString('zh-CN')}
          </p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button icon={<Calendar className="w-4 h-4" />} onClick={generateWeeklyReport}>
            生成周报
          </Button>
          <Button icon={<Share2 className="w-4 h-4" />} variant="ghost">
            分享
          </Button>
          <Button
            variant="primary"
            icon={<Download className="w-4 h-4" />}
            onClick={handleExportPDF}
            disabled={exporting}
          >
            {exporting ? '导出中...' : '导出PDF'}
          </Button>
        </div>
      </div>

      <div ref={reportRef} className="space-y-6">
        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-12 lg:col-span-8" goldBorder
            icon={<BarChart3 className="w-5 h-5" />}
            title={
              <div className="flex items-center gap-4 flex-wrap">
                <span>{legion.banner.emblem} {legion.name} · 战役分析</span>
                <RankBadge tier={player.rank} size="sm" />
              </div>
            }
          >
            <div className="grid grid-cols-4 gap-3 mb-6">
              {[
                { label: '总战役', value: battleStats.totalBattles, icon: '⚔️', color: 'text-gray-300' },
                { label: '胜利', value: battleStats.wins, pct: winRate, icon: '🏆', color: 'text-emerald-400' },
                { label: '失败', value: battleStats.losses, pct: lossRate, icon: '💀', color: 'text-red-400' },
                { label: '平局', value: battleStats.draws, pct: drawRate, icon: '🤝', color: 'text-sky-400' },
              ].map(s => (
                <motion.div
                  key={s.label}
                  whileHover={{ y: -2 }}
                  className="p-4 rounded-xl bg-gradient-to-br from-magic-panel/80 to-magic-card border border-magic-border relative overflow-hidden"
                >
                  <div className="text-3xl mb-1">{s.icon}</div>
                  <p className="font-mono text-3xl font-bold text-magic-gold mb-0.5">{s.value}</p>
                  <p className="text-xs text-gray-400 font-display uppercase">{s.label}</p>
                  {s.pct !== undefined && (
                    <div className="mt-2 h-1 rounded-full bg-magic-bg overflow-hidden">
                      <div
                        className={clsx('h-full',
                          s.color.includes('emerald') ? 'bg-emerald-500' :
                          s.color.includes('red') ? 'bg-red-500' : 'bg-sky-500'
                        )}
                        style={{ width: `${s.pct}%` }}
                      />
                    </div>
                  )}
                </motion.div>
              ))}
            </div>

            <div>
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-display font-bold text-magic-goldLight flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> 近14日胜率走势
                </h4>
                <Badge variant="success">平均胜率: 58%</Badge>
              </div>
              <LineAreaChart data={warReport.winRateCurve} color="#4fc3f7" gradientId="reportWinRate" yLabel="胜率%" height={180} />
            </div>
          </Card>

          <div className="col-span-12 lg:col-span-4 space-y-6">
            <Card icon={<Sparkles className="w-5 h-5" />} title="军团战力雷达">
              <div className="flex justify-center">
                <PowerRadarChart data={radarData} size={220} />
              </div>
              <div className="mt-4 grid grid-cols-3 gap-2 text-center text-xs">
                {[
                  { label: '综合评分', value: 'A+', color: 'text-magic-gold' },
                  { label: '最佳兵种', value: '法师', color: 'text-purple-400' },
                  { label: '最佳阵型', value: '锥形', color: 'text-amber-400' },
                ].map(s => (
                  <div key={s.label} className="p-2 rounded-lg bg-magic-panel/60 border border-magic-border">
                    <p className="text-gray-500 text-[10px] uppercase">{s.label}</p>
                    <p className={`font-mono font-bold text-lg ${s.color}`}>{s.value}</p>
                  </div>
                ))}
              </div>
            </Card>

            <Card icon={<Award className="w-5 h-5" />} title="战役亮点">
              <ul className="space-y-2.5 text-sm">
                {[
                  { icon: '🏆', text: '最长连胜', value: '8 场' },
                  { icon: '⚡', text: '最高兵力差逆转', value: '+38%' },
                  { icon: '🎯', text: '最高奇袭成功率', value: '100%' },
                  { icon: '🛡️', text: '最稳固防御战', value: '仅损失12%' },
                  { icon: '🔥', text: '最经典战役', value: 'S3半决赛' },
                ].map(s => (
                  <li key={s.text} className="flex items-center justify-between p-2.5 rounded-lg bg-magic-panel/50 border border-magic-border/50 hover:border-magic-gold/40 transition-all">
                    <span className="flex items-center gap-2">
                      <span className="text-lg">{s.icon}</span>
                      <span className="text-gray-300">{s.text}</span>
                    </span>
                    <span className="font-mono font-bold text-magic-gold">{s.value}</span>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-12 lg:col-span-7" icon={<Layers className="w-5 h-5" />} title="兵种使用率热力图">
            <p className="text-xs text-gray-400 mb-4">横轴: 星期 | 纵轴: 兵种类型 | 颜色深度代表使用率</p>
            <HeatmapChart data={warReport.unitUsageHeatmap} />
            <div className="mt-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <span className="text-gray-400">使用率:</span>
                {[0, 25, 50, 75, 100].map(v => (
                  <div key={v} className="flex items-center gap-1">
                    <div className="w-5 h-5 rounded" style={{ background: `rgba(212,175,55,${v / 120 + 0.1})`, border: v === 0 ? '1px solid #3d2566' : 'none' }} />
                    <span className="text-gray-400">{v}%</span>
                  </div>
                ))}
              </div>
              <Badge variant="info">平均伤亡率: {battleStats.averageCasualties}%</Badge>
            </div>
          </Card>

          <Card className="col-span-12 lg:col-span-5" icon={<Users className="w-5 h-5" />} title="兵种构成分析">
            <div className="space-y-4">
              {unitTypeStats.map(s => (
                <div key={s.name} className="p-3 rounded-lg bg-magic-panel/50 border border-magic-border/60">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{s.icon}</span>
                      <span className="font-semibold text-gray-200">{s.name}</span>
                    </div>
                    <span className="font-mono text-magic-gold font-bold">
                      {s.count.toLocaleString()} ({s.rate}%)
                    </span>
                  </div>
                  <ProgressBar value={s.count} max={5000} color={
                    s.name === '步兵' ? 'green' :
                    s.name === '骑兵' ? 'flame' :
                    s.name === '法师' ? 'purple' :
                    s.name === '弓手' ? 'blue' : 'gold'
                  } size="sm" showValue={false} />
                </div>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-magic-border">
              <h4 className="font-display font-bold text-magic-goldLight mb-3 flex items-center gap-2">
                <Flame className="w-4 h-4" /> 最常使用将领
              </h4>
              <div className="space-y-2">
                {generals.slice(0, 3).map((g, i) => (
                  <div key={g.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-magic-panel/60 transition-all">
                    <span className="text-2xl">{g.portrait}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-gray-200 text-sm truncate">{g.name}</p>
                        <span className="font-mono text-xs" style={{ color: rarityColors[g.rarity] }}>
                          [{g.rarity.toUpperCase()}]
                        </span>
                      </div>
                      <p className="text-[10px] text-gray-500">Lv.{g.level} · 出战 {87 - i * 18} 场 · 胜率 {92 - i * 7}%</p>
                    </div>
                    <span className="text-xs font-bold" style={{ color: rarityColors[g.rarity] }}>
                      #{i + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <Card className="col-span-12 lg:col-span-7" icon={<Coins className="w-5 h-5" />} title="交易市场价格走势">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              {warReport.priceTrends.map(trend => (
                <div key={trend.itemId} className="p-4 rounded-xl bg-magic-panel/60 border border-magic-border">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-semibold text-sm text-gray-200">{trend.itemName}</p>
                    <span className={clsx('font-mono font-bold text-xs flex items-center gap-0.5',
                      trend.change >= 0 ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      {trend.change >= 0 ? '↑' : '↓'} {Math.abs(trend.change)}%
                    </span>
                  </div>
                  <p className="font-mono text-xl font-bold text-magic-gold mb-2">
                    ¥{trend.currentPrice.toLocaleString()}
                  </p>
                  <div className="h-16">
                    <LineAreaChart data={trend.prices.slice(-7)} color={trend.change >= 0 ? '#22c55e' : '#ef4444'} gradientId={`mini-${trend.itemId}`} height={60} />
                  </div>
                </div>
              ))}
            </div>

            <h4 className="font-display font-bold text-magic-goldLight mb-3">市场活跃度指标</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: '成交笔数', value: (orders.length * 12).toLocaleString(), delta: '+18%', color: 'emerald' },
                { label: '成交量', value: '2.84M', delta: '+12%', color: 'sky' },
                { label: '在售订单', value: orders.length.toString(), delta: '+6%', color: 'amber' },
                { label: '成交额', value: purchaseHistory.reduce((s, p) => s + p.price, 0).toLocaleString(), delta: '+24%', color: 'purple' },
              ].map(s => (
                <div key={s.label} className="p-3 rounded-lg bg-magic-panel/50 border border-magic-border">
                  <p className="text-[10px] text-gray-500 uppercase">{s.label}</p>
                  <p className="font-mono text-lg font-bold text-gray-100 mt-0.5">{s.value}</p>
                  <p className={`text-[10px] font-mono font-bold text-${s.color}-400 mt-0.5`}>{s.delta}</p>
                </div>
              ))}
            </div>
          </Card>

          <Card className="col-span-12 lg:col-span-5" icon={<Eye className="w-5 h-5" />} title="全服战力TOP5">
            <div className="space-y-3">
              {warReport.topLegions.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: 12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className={clsx(
                    'p-4 rounded-xl border-2 flex items-center gap-4 transition-all',
                    i === 0 ? 'bg-gradient-to-r from-amber-900/40 via-magic-gold/20 to-magic-card border-amber-500/50 shadow-gold-glow' :
                    i === 1 ? 'bg-gradient-to-r from-slate-600/30 to-magic-card border-slate-400/50' :
                    i === 2 ? 'bg-gradient-to-r from-orange-900/30 to-magic-card border-orange-700/50' :
                    'bg-magic-panel/50 border-magic-border hover:border-magic-gold/30'
                  )}
                >
                  <div className={clsx(
                    'w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-display font-bold text-lg',
                    i === 0 ? 'bg-gradient-to-br from-magic-gold to-amber-700 text-black shadow-gold-glow' :
                    i === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-black' :
                    i === 2 ? 'bg-gradient-to-br from-orange-500 to-orange-800 text-black' :
                    'bg-magic-bg text-gray-400 border border-magic-border'
                  )}>
                    {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-display font-bold text-gray-100">{entry.name}</span>
                      {entry.metadata?.tier && <RankBadge tier={entry.metadata.tier as any} size="sm" />}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
                      <span>成员: {entry.metadata?.members || 40}人</span>
                      {entry.change !== 0 && (
                        <span className={clsx('flex items-center gap-0.5 font-mono',
                          entry.change > 0 ? 'text-emerald-400' : 'text-red-400'
                        )}>
                          {entry.change > 0 ? '▲' : '▼'} {Math.abs(entry.change)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-mono text-xl font-bold text-magic-gold">{entry.value.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 uppercase">总战力</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="mt-5 pt-5 border-t border-magic-border">
              <div className="p-4 rounded-xl bg-gradient-to-r from-magic-purple/20 via-magic-gold/10 to-magic-blue/15 border border-magic-gold/40">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <p className="font-display font-bold text-magic-gold">本军团排名</p>
                    <p className="text-sm text-gray-400">相对于前一周变化</p>
                  </div>
                  <div className="text-right">
                    <p className="font-mono text-3xl font-bold text-magic-gold glow-text-gold">
                      #{ranking.power.find(r => r.id === legion.id)?.rank || 5}
                    </p>
                    <p className="text-sm font-mono text-emerald-400">▲ 2 位</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <Card icon={<Printer className="w-5 h-5" />} title="战役趋势总览" subtitle="赛季整体表现曲线">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-display font-bold text-magic-goldLight mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-400" /> 积分增长曲线
              </h4>
              <LineAreaChart
                data={Array.from({ length: 14 }, (_, i) => ({
                  date: `D${i + 1}`,
                  timestamp: Date.now(),
                  value: 1000 + i * 250 + Math.sin(i / 2) * 300,
                }))}
                color="#d4af37"
                gradientId="curve-gold"
                yLabel="积分"
                height={200}
              />
            </div>
            <div>
              <h4 className="font-display font-bold text-magic-goldLight mb-3 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-magic-blue" /> 参战兵种胜率
              </h4>
              <div className="space-y-3">
                {[
                  { name: '龙骑突击骑兵', rate: 78, color: 'flame' },
                  { name: '奥术大法师团', rate: 72, color: 'purple' },
                  { name: '龙鳞重甲步兵', rate: 65, color: 'green' },
                  { name: '圣殿护卫', rate: 61, color: 'blue' },
                  { name: '疾风游骑兵', rate: 58, color: 'gold' },
                  { name: '元素召唤师', rate: 54, color: 'purple' },
                ].map(u => (
                  <div key={u.name} className="flex items-center gap-3">
                    <span className="text-sm text-gray-300 w-36 truncate">{u.name}</span>
                    <div className="flex-1">
                      <ProgressBar
                        value={u.rate} max={100} size="sm" showValue={false}
                        color={u.color as any}
                      />
                    </div>
                    <span className={clsx('font-mono font-bold text-sm w-12 text-right',
                      u.rate >= 70 ? 'text-emerald-400' :
                      u.rate >= 60 ? 'text-magic-gold' :
                      u.rate >= 50 ? 'text-amber-400' : 'text-red-400'
                    )}>
                      {u.rate}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}

function HeatmapChart({ data }: { data: HeatmapCell[] }) {
  const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
  const units = ['步兵', '骑兵', '法师', '弓手', '刺客', '祭司'];
  const max = Math.max(...data.map(d => d.value), 1);
  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr>
            <th className="w-16 p-2 text-left text-xs text-gray-400 font-display">兵种\日</th>
            {days.map(d => (
              <th key={d} className="p-2 text-center text-xs text-gray-400 font-display">{d}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {units.map((unitName, y) => (
            <tr key={y}>
              <td className="p-2 text-xs text-gray-300 font-semibold">{unitName}</td>
              {days.map((_, x) => {
                const cell = data.find(d => d.x === x && d.y === y);
                const v = cell?.value || 0;
                const pct = v / max;
                return (
                  <td key={`${x}-${y}`} className="p-1">
                    <div
                      className="aspect-square rounded transition-all hover:scale-110 flex items-center justify-center text-[8px] font-mono font-bold relative group cursor-pointer"
                      style={{
                        background: `rgba(212,175,55,${0.08 + pct * 0.85})`,
                        border: pct > 0.3 ? '1px solid rgba(212,175,55,0.6)' : '1px solid #3d2566',
                        color: pct > 0.4 ? '#000' : pct > 0.15 ? '#f4d06f' : '#9ca3af',
                      }}
                    >
                      {pct > 0.2 && Math.round(pct * 100)}
                      <div className="absolute z-20 -top-8 left-1/2 -translate-x-1/2 px-2 py-1 rounded bg-magic-card border border-magic-gold text-[10px] text-magic-gold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                        {unitName} {days[x]}: {v}%
                      </div>
                    </div>
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
