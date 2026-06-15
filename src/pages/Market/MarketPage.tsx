import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Store, Scroll, FileSignature, Package, Coins, TrendingUp, TrendingDown,
  Clock, Search, Filter, ChevronDown, ChevronUp, Gavel, ShoppingCart,
  AlertTriangle, Megaphone, Check, Star, History, Tag, RefreshCw
} from 'lucide-react';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import ProgressBar from '@/components/ui/ProgressBar';
import { Badge, RarityBadge } from '@/components/ui/Badge';
import { LineAreaChart } from '@/components/charts/Charts';
import { useMarketStore, usePlayerStore, useContentStore, useGlobalStore } from '@/store';
import { calculatePriceRange, detectMarketTrend, formatGold } from '@/engines/pricingService';
import { generateId, rarityColors } from '@/data/mockData';
import type { TradeOrder, Rarity } from '@/types';
import { clsx } from 'clsx';

type Tab = 'blueprints' | 'contracts' | 'materials' | 'my-listings' | 'history';

export default function MarketPage() {
  const [tab, setTab] = useState<Tab>('blueprints');
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'rarity' | 'ending'>('ending');
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [bidInput, setBidInput] = useState<Record<string, string>>({});
  const [listingMode, setListingMode] = useState(false);

  const { orders, myListings, purchaseHistory, purchaseOrder, placeBid, addOrder, refreshOrders } = useMarketStore();
  const player = usePlayerStore(s => s.player);
  const updateGold = usePlayerStore(s => s.updateGold);
  const addNews = useContentStore(s => s.addNews);
  const setMobilization = useGlobalStore(s => s.setMobilization);

  const itemTypeMap = {
    blueprints: 'blueprint' as const,
    contracts: 'contract' as const,
    materials: 'material' as const,
  };

  const activeOrders = useMemo(() => {
    let list = [...orders].filter(o => o.status === 'active');
    if (['blueprints', 'contracts', 'materials'].includes(tab)) {
      list = list.filter(o => o.itemType === itemTypeMap[tab as keyof typeof itemTypeMap]);
    }
    if (tab === 'my-listings') {
      list = myListings;
    }
    if (rarityFilter !== 'all') {
      list = list.filter(o => o.itemData.rarity === rarityFilter);
    }
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(o => o.itemData.name.toLowerCase().includes(s) || o.sellerName.toLowerCase().includes(s));
    }
    switch (sortBy) {
      case 'price-low': list.sort((a, b) => a.price - b.price); break;
      case 'price-high': list.sort((a, b) => b.price - a.price); break;
      case 'rarity': {
        const order: Rarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
        list.sort((a, b) => order.indexOf(a.itemData.rarity) - order.indexOf(b.itemData.rarity));
        break;
      }
      case 'ending': list.sort((a, b) => a.expiresAt - b.expiresAt); break;
    }
    return list;
  }, [orders, myListings, tab, sortBy, rarityFilter, search]);

  const marketTrends = useMemo(() => {
    const rarityNames: Rarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
    return rarityNames.map(r => ({
      rarity: r,
      trend: detectMarketTrend(r),
      range: calculatePriceRange('blueprint', r),
    }));
  }, []);

  const handleBuy = (order: TradeOrder) => {
    if (player.gold < order.price) return;
    updateGold(-order.price);
    purchaseOrder(order.id, player.id);
    addNews({
      id: generateId(),
      type: 'trade',
      title: '💰 交易达成',
      content: `「${order.itemData.name}」以${order.price.toLocaleString()}金币成交！`,
      timestamp: Date.now(),
    });
    if (order.itemData.rarity === 'epic' || order.itemData.rarity === 'legendary') {
      setMobilization(true, order.itemData.rarity === 'legendary' ? 30 : 15, 86400000);
      addNews({
        id: generateId(),
        type: 'mobilization',
        title: '⚡ 战争动员',
        content: `稀有道具成交！全服招募效率提升${order.itemData.rarity === 'legendary' ? 30 : 15}%，持续24小时！`,
        timestamp: Date.now(),
      });
    }
  };

  const handleBid = (order: TradeOrder) => {
    const amt = parseInt(bidInput[order.id]) || 0;
    if (amt <= 0 || player.gold < amt) return;
    const ok = placeBid(order.id, player.id, player.name, amt);
    if (ok) {
      setBidInput(prev => ({ ...prev, [order.id]: '' }));
    }
  };

  const hoursLeft = (t: number) => Math.max(0, Math.ceil((t - Date.now()) / 3600000));

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-8" icon={<Store className="w-5 h-5" />}
          title="交易市场" subtitle="兵种图纸、将领合同、稀有材料自由交易"
          actions={
            <div className="flex gap-2">
              <Button variant="primary" size="sm" icon={<Package className="w-4 h-4" />} onClick={() => setListingMode(!listingMode)}>
                {listingMode ? '返回市场' : '上架出售'}
              </Button>
              <Button size="sm" icon={<RefreshIcon className="w-4 h-4" />} onClick={refreshOrders}>
                刷新
              </Button>
            </div>
          }
        >
          <div className="flex gap-1 border-b border-magic-border mb-5 overflow-x-auto">
            {([
              { k: 'blueprints', label: '兵种图纸', icon: Scroll },
              { k: 'contracts', label: '将领合同', icon: FileSignature },
              { k: 'materials', label: '战争材料', icon: Package },
              { k: 'my-listings', label: '我的出售', icon: Tag },
              { k: 'history', label: '购买记录', icon: History },
            ] as const).map(t => (
              <button
                key={t.k}
                onClick={() => setTab(t.k)}
                className={`tab-btn whitespace-nowrap flex items-center gap-2 ${tab === t.k ? 'tab-btn-active' : ''}`}
              >
                <t.icon className="w-4 h-4" /> {t.label}
              </button>
            ))}
          </div>

          {tab !== 'history' && tab !== 'my-listings' && (
            <div className="flex flex-wrap items-center gap-3 mb-5 pb-5 border-b border-magic-border">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                <input
                  type="text"
                  placeholder="搜索道具名称或卖家..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="magic-input !pl-9"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={rarityFilter}
                  onChange={e => setRarityFilter(e.target.value as any)}
                  className="magic-input !w-auto py-2"
                >
                  <option value="all">所有稀有度</option>
                  <option value="legendary">传奇</option>
                  <option value="epic">史诗</option>
                  <option value="rare">稀有</option>
                  <option value="uncommon">优秀</option>
                  <option value="common">普通</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">排序:</span>
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="magic-input !w-auto py-2 !text-sm"
                >
                  <option value="ending">即将结束</option>
                  <option value="price-low">价格低→高</option>
                  <option value="price-high">价格高→低</option>
                  <option value="rarity">稀有度</option>
                </select>
              </div>
            </div>
          )}

          {tab === 'history' ? (
            <div className="space-y-2">
              {purchaseHistory.length === 0 ? (
                <p className="text-center py-12 text-gray-500 font-display">暂无购买记录</p>
              ) : (
                purchaseHistory.map(p => (
                  <div key={p.orderId} className="flex items-center justify-between p-3 rounded-lg bg-magic-panel/50 border border-magic-border">
                    <div>
                      <p className="font-semibold text-gray-200">{p.itemName}</p>
                      <p className="text-xs text-gray-500 font-mono">{new Date(p.timestamp).toLocaleString('zh-CN')}</p>
                    </div>
                    <span className="font-mono font-bold text-magic-gold">{p.price.toLocaleString()} 金币</span>
                  </div>
                ))
              )}
            </div>
          ) : activeOrders.length === 0 ? (
            <div className="text-center py-16 text-gray-500">
              <Store className="w-16 h-16 mx-auto mb-4 opacity-30" />
              <p className="font-display text-lg">当前分类暂无商品</p>
              <p className="text-sm mt-1">试试更换筛选条件或上架您的物品</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {activeOrders.map((order, idx) => {
                const isExpanded = expandedOrder === order.id;
                const trend = detectMarketTrend(order.itemData.rarity);
                const isMine = order.sellerId === player.id || myListings.some(m => m.id === order.id);
                const canAfford = player.gold >= order.price;
                const hLeft = hoursLeft(order.expiresAt);
                const topBid = order.bidHistory.length > 0 ? Math.max(...order.bidHistory.map(b => b.amount)) : 0;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.03 }}
                    className={clsx(
                      'rounded-xl border-2 overflow-hidden bg-gradient-to-br transition-all',
                      `from-magic-card to-magic-panel/60 border-magic-border`,
                      order.itemData.rarity === 'legendary' && 'border-amber-500/40 shadow-gold-glow',
                      order.itemData.rarity === 'epic' && 'border-purple-500/30 shadow-purple-glow/50',
                    )}
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-magic-panel/40 transition-all"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={clsx(
                          'w-16 h-16 shrink-0 rounded-xl flex items-center justify-center text-4xl border-2',
                          `rarity-${order.itemData.rarity}`
                        )} style={{ borderColor: rarityColors[order.itemData.rarity] }}>
                          {order.itemData.icon}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-display font-bold text-base text-gray-100 truncate">{order.itemData.name}</p>
                            <RarityBadge rarity={order.itemData.rarity} />
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {order.isAuction ? <Gavel className="w-3 h-3 inline mr-1 text-magic-gold" /> : <ShoppingCart className="w-3 h-3 inline mr-1 text-sky-400" />}
                            卖家: {order.sellerName}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">当前价格</p>
                          <p className="font-mono text-2xl font-bold glow-text-gold text-magic-gold">
                            {formatGold(order.price)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] text-gray-500 uppercase flex items-center gap-1 justify-end">
                            <Clock className="w-3 h-3" /> 剩余
                          </p>
                          <p className={clsx('font-mono font-bold text-sm',
                            hLeft < 6 ? 'text-red-400' : hLeft < 24 ? 'text-amber-400' : 'text-gray-300'
                          )}>
                            {hLeft < 24 ? `${hLeft}h` : `${Math.floor(hLeft / 24)}天${hLeft % 24}h`}
                          </p>
                        </div>
                      </div>

                      <div className="p-2 rounded-lg bg-magic-bg/60 border border-magic-border/50 text-xs mb-2">
                        <div className="flex items-center justify-between text-gray-400">
                          <span className="flex items-center gap-1">
                            <TrendingIcon up={trend >= 0} className="w-3.5 h-3.5" />
                            近7日走势
                          </span>
                          <span className={clsx('font-mono font-bold', trend >= 0 ? 'text-emerald-400' : 'text-red-400')}>
                            {trend >= 0 ? '+' : ''}{trend}%
                          </span>
                        </div>
                        <div className="mt-1.5 relative h-1.5 rounded-full bg-magic-border overflow-hidden">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full"
                            style={{
                              left: `${30 + Math.random() * 30}%`,
                              width: `${40 + Math.random() * 30}%`,
                              background: trend >= 0
                                ? 'linear-gradient(90deg, #2e7d32, #4ade80)'
                                : 'linear-gradient(90deg, #dc2626, #f87171)',
                            }}
                          />
                          <div className="absolute inset-y-0 w-px bg-magic-gold/50" style={{ left: '50%' }} />
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1 flex justify-between">
                          <span>建议区间:</span>
                          <span className="font-mono text-magic-goldLight">
                            {formatGold(order.suggestedPriceRange[0])} ~ {formatGold(order.suggestedPriceRange[1])}
                          </span>
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        {isExpanded ? <ChevronUp className="w-4 h-4 text-magic-gold" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
                        {order.bidHistory.length > 0 && (
                          <Badge variant="info">{order.bidHistory.length} 次竞价</Badge>
                        )}
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden border-t border-magic-border"
                        >
                          <div className="p-4 bg-magic-bg/40 space-y-3">
                            <p className="text-sm text-gray-300 leading-relaxed">{order.itemData.description}</p>
                            {order.itemData.stats && (
                              <div className="grid grid-cols-3 gap-2 text-xs">
                                {Object.entries(order.itemData.stats).map(([k, v]) => (
                                  <div key={k} className="p-2 rounded bg-magic-panel/50 text-center">
                                    <p className="text-gray-500 uppercase text-[10px]">{k}</p>
                                    <p className="font-mono font-bold text-magic-gold">{v}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            {order.bidHistory.length > 0 && (
                              <div className="pt-2 border-t border-magic-border space-y-1.5">
                                <p className="text-xs text-gray-400 font-semibold">竞价历史</p>
                                {order.bidHistory.slice(-3).reverse().map((bid, i) => (
                                  <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-magic-panel/40">
                                    <span className="text-gray-300">{bid.bidderName}</span>
                                    <span className="font-mono text-magic-gold font-bold">{formatGold(bid.amount)}</span>
                                  </div>
                                ))}
                              </div>
                            )}
                            {!isMine && (
                              order.isAuction ? (
                                <div className="flex gap-2 pt-2 border-t border-magic-border">
                                  <input
                                    type="number"
                                    placeholder={`最低 ${formatGold(topBid + 1000)}`}
                                    value={bidInput[order.id] || ''}
                                    onChange={e => setBidInput(p => ({ ...p, [order.id]: e.target.value }))}
                                    className="magic-input !py-2 flex-1"
                                  />
                                  <Button variant="primary" size="sm" icon={<Gavel className="w-4 h-4" />} onClick={() => handleBid(order)}>
                                    出价
                                  </Button>
                                </div>
                              ) : (
                                <Button
                                  fullWidth
                                  variant={canAfford ? 'primary' : 'danger'}
                                  icon={<ShoppingCart className="w-4 h-4" />}
                                  disabled={!canAfford}
                                  onClick={() => handleBuy(order)}
                                >
                                  {canAfford ? '立即购买' : <span className="flex items-center gap-1"><AlertTriangle className="w-4 h-4" />金币不足</span>}
                                </Button>
                              )
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </Card>

        <div className="col-span-12 lg:col-span-4 space-y-6">
          <Card icon={<TrendingUp className="w-5 h-5" />} title="市场走势" subtitle="近7日各稀有度价格趋势">
            <div className="space-y-3">
              {marketTrends.map(t => {
                const up = t.trend >= 0;
                return (
                  <div key={t.rarity} className="p-3 rounded-lg bg-magic-panel/50 border border-magic-border">
                    <div className="flex items-center justify-between mb-2">
                      <RarityBadge rarity={t.rarity} />
                      <span className={clsx('flex items-center gap-1 font-mono font-bold text-sm',
                        up ? 'text-emerald-400' : 'text-red-400'
                      )}>
                        <TrendingIcon up={up} className="w-4 h-4" />
                        {up ? '+' : ''}{t.trend}%
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 font-mono">
                      均价区间: <span className="text-magic-goldLight">{formatGold(t.range[0])} ~ {formatGold(t.range[1])}</span>
                    </p>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card icon={<Megaphone className="w-5 h-5" />} title="交易须知">
            <ul className="space-y-2 text-xs text-gray-400">
              {[
                { icon: <Check className="w-3 h-3 text-emerald-400" />, text: '系统按近7天均价自动提供价格建议区间' },
                { icon: <Check className="w-3 h-3 text-emerald-400" />, text: '史诗及以上道具成交将触发全服公告' },
                { icon: <Check className="w-3 h-3 text-emerald-400" />, text: '高稀有度成交将触发「战争动员」事件' },
                { icon: <Check className="w-3 h-3 text-emerald-400" />, text: '系统收取 5% 交易手续费' },
                { icon: <Star className="w-3 h-3 text-magic-gold" />, text: '战争动员期间全服招募效率大幅提升！' },
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-2 p-2 rounded hover:bg-magic-panel/40">
                  <span className="mt-0.5 shrink-0">{item.icon}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </Card>

          <Card icon={<Coins className="w-5 h-5" />} title="我的钱包">
            <div className="text-center p-6 rounded-xl bg-gradient-to-br from-magic-gold/10 via-magic-purple/10 to-transparent border border-magic-gold/30 mb-4">
              <p className="text-xs text-gray-400 font-display uppercase tracking-wider mb-1">金币余额</p>
              <p className="font-mono text-4xl font-bold glow-text-gold text-magic-gold">
                {player.gold.toLocaleString()}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-3 rounded-lg bg-magic-panel/50 border border-magic-border">
                <p className="text-gray-500 uppercase text-[10px]">交易次数</p>
                <p className="font-mono font-bold text-magic-blue text-lg">{purchaseHistory.length + myListings.length}</p>
              </div>
              <div className="p-3 rounded-lg bg-magic-panel/50 border border-magic-border">
                <p className="text-gray-500 uppercase text-[10px]">累计消费</p>
                <p className="font-mono font-bold text-magic-flame text-lg">
                  {formatGold(purchaseHistory.reduce((s, p) => s + p.price, 0))}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <Card icon={<TrendingUp className="w-5 h-5" />} title="热门道具价格走势" subtitle="三种主流道具30天价格曲线">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { name: '传奇骑兵图纸', color: '#f59e0b', id: 'g1' },
            { name: '史诗法师合同', color: '#a855f7', id: 'g2' },
            { name: '魔力水晶', color: '#4fc3f7', id: 'g3' },
          ].map(chart => {
            const data = Array.from({ length: 14 }, (_, i) => ({
              date: `D${i + 1}`,
              timestamp: Date.now(),
              value: 60 + Math.sin(i / 2) * 15 + Math.random() * 20,
            }));
            return (
              <div key={chart.id} className="p-4 rounded-xl bg-magic-panel/50 border border-magic-border">
                <h4 className="font-display font-bold text-sm mb-2" style={{ color: chart.color }}>{chart.name}</h4>
                <LineAreaChart data={data} color={chart.color} gradientId={`trend-${chart.id}`} height={120} />
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

function RefreshIcon(props: any) { return <RefreshCw {...props} />; }
function TrendingIcon({ up, className }: { up: boolean; className?: string }) {
  return up ? <TrendingUp className={className} /> : <TrendingDown className={className} />;
}
import { AnimatePresence } from 'framer-motion';
