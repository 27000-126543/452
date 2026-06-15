import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Store, Scroll, FileSignature, Package, Coins, TrendingUp, TrendingDown,
  Clock, Search, Filter, ChevronDown, ChevronUp, Gavel, ShoppingCart,
  AlertTriangle, Megaphone, Check, Star, History, Tag, RefreshCw,
  X, Info, Sparkles, Edit3, Eye, ArrowDownCircle, DollarSign, BarChart3, Activity
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

const listingIcons: Record<string, string[]> = {
  blueprint: ['📜', '📘', '📗', '🔮', '✨', '🪄', '📖'],
  contract: ['📝', '🤝', '👑', '⚔️', '🛡️', '🏹', '🧙'],
  material: ['💎', '🔩', '🧪', '📦', '⚗️', '🪨', '🔥'],
};

const rarityLabels: Record<Rarity, string> = {
  common: '普通', uncommon: '优秀', rare: '稀有', epic: '史诗', legendary: '传奇',
};

export default function MarketPage() {
  const [tab, setTab] = useState<Tab>('blueprints');
  const [sortBy, setSortBy] = useState<'price-low' | 'price-high' | 'rarity' | 'ending'>('ending');
  const [rarityFilter, setRarityFilter] = useState<Rarity | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [bidInput, setBidInput] = useState<Record<string, string>>({});
  const [showListingModal, setShowListingModal] = useState(false);

  const { orders, myListings, purchaseHistory, purchaseOrder, placeBid, addOrder, repriceOrder, delistOrder, incrementViews, refreshOrders } = useMarketStore();
  const player = usePlayerStore(s => s.player);
  const updateGold = usePlayerStore(s => s.updateGold);
  const addNews = useContentStore(s => s.addNews);
  const setMobilization = useGlobalStore(s => s.setMobilization);

  const viewedDetailRef = useRef<Set<string>>(new Set());
  const viewedCategoryRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!expandedOrder) return;
    if (viewedDetailRef.current.has(expandedOrder)) return;
    viewedDetailRef.current.add(expandedOrder);
    incrementViews(expandedOrder, 'detail');
  }, [expandedOrder, incrementViews]);

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
    if (tab !== 'my-listings' && rarityFilter !== 'all') {
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

  useEffect(() => {
    if (!['blueprints', 'contracts', 'materials'].includes(tab)) return;
    activeOrders.forEach(order => {
      if (viewedCategoryRef.current.has(order.id)) return;
      viewedCategoryRef.current.add(order.id);
      incrementViews(order.id, 'category');
    });
  }, [tab, activeOrders, incrementViews, viewedCategoryRef]);

  const marketTrends = useMemo(() => {
    const rarityNames: Rarity[] = ['legendary', 'epic', 'rare', 'uncommon', 'common'];
    return rarityNames.map(r => ({
      rarity: r,
      trend: detectMarketTrend(r),
      range: calculatePriceRange('blueprint', r),
    }));
  }, []);

  const handleBuy = (order: TradeOrder) => {
    if (order.status !== 'active') return;
    if (player.gold < order.price) return;
    updateGold(-order.price);
    purchaseOrder(order.id, player.id);
    const now = Date.now();
    addNews({
      id: generateId(),
      type: 'trade',
      title: '💰 交易达成',
      content: `${player.name} 购买了「${order.itemData.name}」，花费${formatGold(order.price)}金币！卖家: ${order.sellerName}`,
      timestamp: now,
    });
    if (order.itemData.rarity === 'epic' || order.itemData.rarity === 'legendary') {
      const bonus = order.itemData.rarity === 'legendary' ? 30 : 15;
      setMobilization(true, bonus, 86400000);
      addNews({
        id: generateId(),
        type: 'mobilization',
        title: '⚡ 战争动员！',
        content: `高阶道具「${order.itemData.name}」交易成功！全服招募效率提升${bonus}%，持续24小时！`,
        timestamp: now + 1,
      });
    }
    setExpandedOrder(null);
  };

  const handleBid = (order: TradeOrder) => {
    const amt = parseInt(bidInput[order.id]) || 0;
    if (amt <= 0 || player.gold < amt) return;
    const ok = placeBid(order.id, player.id, player.name, amt);
    if (ok) {
      setBidInput(prev => ({ ...prev, [order.id]: '' }));
    }
  };

  const handleCreateListing = (data: {
    itemType: 'blueprint' | 'contract' | 'material';
    itemName: string;
    rarity: Rarity;
    icon: string;
    description: string;
    price: number;
    isAuction: boolean;
    durationHours: number;
    stats?: Record<string, number>;
  }) => {
    const range = calculatePriceRange(data.itemType, data.rarity);
    const now = Date.now();
    const listingFee = Math.ceil(data.price * 0.01);
    if (player.gold < listingFee) return;
    updateGold(-listingFee);
    const order: TradeOrder = {
      id: generateId(),
      sellerId: player.id,
      sellerName: player.name,
      itemType: data.itemType,
      itemData: {
        id: generateId(),
        name: data.itemName,
        rarity: data.rarity,
        icon: data.icon,
        description: data.description,
        stats: data.stats,
      },
      price: data.price,
      originalPrice: data.price,
      listingFee,
      suggestedPriceRange: range,
      listedAt: now,
      expiresAt: now + data.durationHours * 3600 * 1000,
      status: 'active',
      bidHistory: [],
      isAuction: data.isAuction,
      views: 0,
      viewSources: { detail: 0, category: 0 },
      listingHistory: [{ type: 'listed', timestamp: now, detail: `${formatGold(data.price)} 手续费${formatGold(listingFee)}` }],
    };
    addOrder(order);
    addNews({
      id: generateId(),
      type: 'trade',
      title: '📦 新商品上架',
      content: `${player.name} 上架了「${data.itemName}」(${rarityLabels[data.rarity]})，售价 ${formatGold(data.price)}！`,
      timestamp: now,
    });
    setShowListingModal(false);
    setTab('my-listings');
  };

  const hoursLeft = (t: number) => Math.max(0, Math.ceil((t - Date.now()) / 3600000));

  return (
    <div className="space-y-6">
      <AnimatePresence>
        {showListingModal && (
          <ListingModal
            playerGold={player.gold}
            currentTab={tab}
            onClose={() => setShowListingModal(false)}
            onConfirm={handleCreateListing}
          />
        )}
      </AnimatePresence>

      <div className="grid grid-cols-12 gap-6">
        <Card className="col-span-12 lg:col-span-8" icon={<Store className="w-5 h-5" />}
          title="交易市场" subtitle="兵种图纸、将领合同、稀有材料自由交易"
          actions={
            <div className="flex gap-2">
              <Button variant="primary" size="sm" icon={<Package className="w-4 h-4" />} onClick={() => setShowListingModal(true)}>
                上架出售
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
                {t.k === 'my-listings' && myListings.length > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-magic-purple text-white text-xs flex items-center justify-center font-bold">
                    {myListings.length}
                  </span>
                )}
                {t.k === 'history' && purchaseHistory.length > 0 && (
                  <span className="ml-1 w-5 h-5 rounded-full bg-sky-700 text-white text-xs flex items-center justify-center font-bold">
                    {purchaseHistory.length}
                  </span>
                )}
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
                <p className="text-center py-12 text-gray-500 font-display">暂无购买记录，快去市场选购吧！</p>
              ) : (
                purchaseHistory.map(p => (
                  <div key={p.orderId} className="flex items-center justify-between p-3 rounded-lg bg-magic-panel/50 border border-magic-border">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-magic-bg flex items-center justify-center text-xl">
                        <Check className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-200">{p.itemName}</p>
                        <p className="text-xs text-gray-500 font-mono">{new Date(p.timestamp).toLocaleString('zh-CN')}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-magic-gold">{formatGold(p.price)} 金币</span>
                  </div>
                ))
              )}
            </div>
          ) : tab === 'my-listings' ? (
            <MyStallPanel
              myListings={myListings}
              playerGold={player.gold}
              onReprice={(id, price, range) => repriceOrder(id, price, range)}
              onDelist={(id) => delistOrder(id)}
              onListNew={() => setShowListingModal(true)}
            />
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
                const isSold = order.status === 'sold' || order.status === 'expired';
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
                      isSold && 'opacity-60 grayscale'
                    )}
                  >
                    <div
                      className="p-4 cursor-pointer hover:bg-magic-panel/40 transition-all"
                      onClick={() => setExpandedOrder(isExpanded ? null : order.id)}
                    >
                      <div className="flex items-start gap-3 mb-3">
                        <div className={clsx(
                          'w-16 h-16 shrink-0 rounded-xl flex items-center justify-center text-4xl border-2 relative',
                          `rarity-${order.itemData.rarity}`
                        )} style={{ borderColor: rarityColors[order.itemData.rarity] }}>
                          {order.itemData.icon}
                          {isSold && (
                            <div className="absolute inset-0 rounded-xl bg-black/60 flex items-center justify-center">
                              <span className="text-xs font-bold text-red-400 rotate-[-15deg] border-2 border-red-400 px-2 py-0.5">
                                {order.status === 'sold' ? '已售' : '过期'}
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-display font-bold text-base text-gray-100 truncate">{order.itemData.name}</p>
                            <RarityBadge rarity={order.itemData.rarity} />
                          </div>
                          <p className="text-xs text-gray-400 mt-0.5">
                            {order.isAuction ? <Gavel className="w-3 h-3 inline mr-1 text-magic-gold" /> : <ShoppingCart className="w-3 h-3 inline mr-1 text-sky-400" />}
                            卖家: {isMine ? <span className="text-magic-purpleLight font-semibold">我</span> : order.sellerName}
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
                        <p className="text-[10px] text-gray-500 mt-1.5 flex justify-between">
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
                        {isMine && <Badge variant="warning">我的商品</Badge>}
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
                              <div>
                                <p className="text-xs text-gray-400 mb-2">竞价历史:</p>
                                <div className="max-h-20 overflow-y-auto space-y-1">
                                  {[...order.bidHistory].reverse().slice(0, 5).map((b, i) => (
                                    <div key={i} className="flex justify-between text-xs p-1.5 rounded bg-magic-panel/40">
                                      <span className="text-gray-400">{b.bidderName}</span>
                                      <span className="font-mono text-magic-gold font-bold">{formatGold(b.amount)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {!isSold && (
                              <div className="pt-2 border-t border-magic-border/70 space-y-2">
                                {isMine ? (
                                  <Button variant="danger" className="w-full" size="sm" disabled>
                                    <AlertTriangle className="w-4 h-4" /> 您的商品，不可购买
                                  </Button>
                                ) : order.isAuction ? (
                                  <>
                                    <div className="flex gap-2">
                                      <input
                                        type="number"
                                        placeholder={`最低 ${formatGold(Math.max(order.price, topBid + 1))}`}
                                        value={bidInput[order.id] || ''}
                                        onChange={e => setBidInput(p => ({ ...p, [order.id]: e.target.value }))}
                                        className="magic-input flex-1 !py-2"
                                      />
                                      <Button variant="primary" onClick={() => handleBid(order)}>
                                        <Gavel className="w-4 h-4" /> 出价
                                      </Button>
                                    </div>
                                    <p className="text-[10px] text-gray-500">当前最高: {topBid > 0 ? formatGold(topBid) : '暂无出价'}</p>
                                  </>
                                ) : (
                                  <Button
                                    variant="primary"
                                    className="w-full"
                                    size="sm"
                                    disabled={!canAfford}
                                    onClick={() => handleBuy(order)}
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                    {canAfford ? `立即购买 · ${formatGold(order.price)}` : '金币不足'}
                                  </Button>
                                )}
                              </div>
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
          <Card icon={<Coins className="w-5 h-5" />} title="我的钱包">
            <div className="p-5 rounded-xl bg-gradient-to-br from-magic-gold/15 via-magic-card to-magic-purple/15 border border-magic-gold/40 shadow-gold-glow/30">
              <p className="text-xs text-gray-400 font-display uppercase tracking-wider mb-1">账户余额</p>
              <p className="font-mono text-4xl font-bold text-magic-gold glow-text-gold mb-4">
                {formatGold(player.gold)}
              </p>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="p-2 rounded-lg bg-magic-bg/60">
                  <p className="text-gray-500 text-[10px] uppercase">花费</p>
                  <p className="font-mono font-bold text-red-400 mt-0.5">
                    {formatGold(purchaseHistory.reduce((s, p) => s + p.price, 0))}
                  </p>
                </div>
                <div className="p-2 rounded-lg bg-magic-bg/60">
                  <p className="text-gray-500 text-[10px] uppercase">在售</p>
                  <p className="font-mono font-bold text-sky-400 mt-0.5">{myListings.filter(m => m.status === 'active').length}</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">预计{formatGold(myListings.filter(m => m.status === 'active').reduce((s, o) => s + o.price - (o.listingFee || 0), 0))}</p>
                </div>
                <div className="p-2 rounded-lg bg-magic-bg/60">
                  <p className="text-gray-500 text-[10px] uppercase">已购</p>
                  <p className="font-mono font-bold text-emerald-400 mt-0.5">{purchaseHistory.length}</p>
                </div>
              </div>
            </div>
          </Card>

          <Card icon={<Sparkles className="w-5 h-5" />} title="稀有度市场走势">
            <div className="space-y-3">
              {marketTrends.map(t => (
                <div key={t.rarity} className="p-3 rounded-xl bg-magic-panel/50 border border-magic-border/60 hover:border-magic-gold/30 transition-all">
                  <div className="flex items-center justify-between mb-2">
                    <RarityBadge rarity={t.rarity} />
                    <span className={clsx('text-xs font-mono font-bold flex items-center gap-0.5',
                      t.trend >= 0 ? 'text-emerald-400' : 'text-red-400'
                    )}>
                      <TrendingIcon up={t.trend >= 0} className="w-3.5 h-3.5" />
                      {t.trend >= 0 ? '+' : ''}{t.trend}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono">
                    <span className="text-gray-500">建议:</span>
                    <span className="text-magic-goldLight">
                      {formatGold(t.range[0])} ~ {formatGold(t.range[1])}
                    </span>
                  </div>
                  <ProgressBar
                    value={(t.range[0] + t.range[1]) / 2}
                    max={t.range[1] * 1.5}
                    color={t.rarity === 'legendary' ? 'gold' : t.rarity === 'epic' ? 'purple' : t.rarity === 'rare' ? 'blue' : t.rarity === 'uncommon' ? 'green' : 'flame'}
                    size="sm"
                    showValue={false}
                  />
                </div>
              ))}
            </div>
          </Card>

          <Card icon={<Megaphone className="w-5 h-5" />} title="交易小贴士">
            <ul className="space-y-2.5 text-xs text-gray-300">
              {[
                { icon: '💡', text: '史诗以上交易将触发「战争动员」，全服招募效率UP！' },
                { icon: '📊', text: '参考7日建议价格区间，避免定价过高或过低' },
                { icon: '⏰', text: '商品48小时未成交将自动过期' },
                { icon: '🔒', text: '所有交易由系统担保，100%安全可靠' },
                { icon: '🎁', text: '每日首次交易可获得额外奖励' },
              ].map(tip => (
                <li key={tip.text} className="flex items-start gap-2 p-2 rounded-lg bg-magic-panel/40 hover:bg-magic-panel/60 transition-all">
                  <span className="text-lg shrink-0">{tip.icon}</span>
                  <span>{tip.text}</span>
                </li>
              ))}
            </ul>
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

function MyStallPanel({ myListings, playerGold, onReprice, onDelist, onListNew }: {
  myListings: TradeOrder[];
  playerGold: number;
  onReprice: (id: string, price: number, range: [number, number]) => void;
  onDelist: (id: string) => void;
  onListNew: () => void;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editPrice, setEditPrice] = useState('');
  const [historyId, setHistoryId] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'time-desc' | 'views-desc' | 'bids-desc' | 'time-left'>('time-desc');

  const sortedListings = useMemo(() => {
    return [...myListings].sort((a, b) => {
      switch (sortBy) {
        case 'views-desc': return (b.views || 0) - (a.views || 0);
        case 'bids-desc': return b.bidHistory.length - a.bidHistory.length;
        case 'time-left': return (b.expiresAt - b.listedAt) - (a.expiresAt - a.listedAt);
        case 'time-desc':
        default: return b.listedAt - a.listedAt;
      }
    });
  }, [myListings, sortBy]);

  const activeListings = myListings.filter(o => o.status === 'active');
  const closedListings = myListings.filter(o => o.status !== 'active');
  const totalExpectedRevenue = activeListings.reduce((s, o) => s + (o.price - (o.listingFee || 0)), 0);
  const totalFees = myListings.reduce((s, o) => s + (o.listingFee || 0), 0);

  const handleReprice = (order: TradeOrder) => {
    const newPrice = parseInt(editPrice) || 0;
    if (newPrice <= 0) return;
    const range = calculatePriceRange(order.itemType, order.itemData.rarity);
    onReprice(order.id, newPrice, range);
    setEditingId(null);
    setEditPrice('');
  };

  if (myListings.length === 0) {
    return (
      <div className="text-center py-16 text-gray-500">
        <Tag className="w-16 h-16 mx-auto mb-4 opacity-30" />
        <p className="font-display text-lg">暂无出售中的商品</p>
        <p className="text-sm mt-1">点击右上角「上架出售」开始发布商品</p>
        <Button variant="primary" className="mt-4" onClick={onListNew}>
          <Package className="w-4 h-4" /> 立即上架
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-4 gap-3">
        <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-900/40 to-magic-panel border border-emerald-500/30">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">在售商品</p>
          <p className="font-mono text-2xl font-bold text-emerald-400 mt-1">{activeListings.length}</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-magic-gold/15 to-magic-panel border border-magic-gold/30">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">预计收益</p>
          <p className="font-mono text-2xl font-bold text-magic-gold mt-1">{formatGold(totalExpectedRevenue)}</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-red-900/30 to-magic-panel border border-red-500/20">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">累计手续费</p>
          <p className="font-mono text-2xl font-bold text-red-300 mt-1">{formatGold(totalFees)}</p>
        </div>
        <div className="p-3 rounded-xl bg-gradient-to-br from-sky-900/30 to-magic-panel border border-sky-500/20">
          <p className="text-[10px] text-gray-400 uppercase tracking-wider">已结束</p>
          <p className="font-mono text-2xl font-bold text-sky-300 mt-1">{closedListings.length}</p>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-1.5 border border-magic-border rounded-lg p-1 bg-magic-panel/40">
          {[
            { k: 'time-desc', label: '最新上架' },
            { k: 'views-desc', label: '浏览最多' },
            { k: 'bids-desc', label: '出价最多' },
            { k: 'time-left', label: '剩余时间' },
          ].map(s => (
            <button key={s.k}
              onClick={() => setSortBy(s.k as any)}
              className={clsx(
                'px-3 py-1 rounded text-xs font-display font-bold transition-all',
                sortBy === s.k ? 'bg-magic-gold/20 text-magic-gold' : 'text-gray-400 hover:text-gray-200'
              )}>
              {s.label}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500">共 {myListings.length} 件商品</p>
      </div>

      <div className="space-y-3">
        {sortedListings.map(order => {
          const isActive = order.status === 'active';
          const isEditing = editingId === order.id;
          const showHistory = historyId === order.id;
          const priceRange = calculatePriceRange(order.itemType, order.itemData.rarity);
          const topBid = order.bidHistory.length > 0 ? Math.max(...order.bidHistory.map(b => b.amount)) : 0;
          const netRevenue = order.price - (order.listingFee || 0);
          const viewSrc = order.viewSources || { detail: 0, category: 0 };
          const totalSrc = Math.max(1, viewSrc.detail + viewSrc.category);
          const detailPct = (viewSrc.detail / totalSrc) * 100;

          return (
            <div key={order.id} className={clsx(
              'rounded-xl border-2 overflow-hidden transition-all',
              isActive
                ? 'bg-gradient-to-r from-magic-card to-magic-panel/60 border-magic-border hover:border-magic-gold/40'
                : 'bg-magic-panel/30 border-magic-border/40 opacity-70'
            )}>
              <div className="p-4 flex items-center gap-4">
                <div className={clsx(
                  'w-14 h-14 shrink-0 rounded-xl flex items-center justify-center text-3xl border-2',
                  `rarity-${order.itemData.rarity}`
                )} style={{ borderColor: rarityColors[order.itemData.rarity] }}>
                  {order.itemData.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-display font-bold text-gray-100 truncate">{order.itemData.name}</p>
                    <RarityBadge rarity={order.itemData.rarity} />
                    {order.status === 'sold' && <Badge variant="success">已售出</Badge>}
                    {order.status === 'delisted' && <Badge variant="danger">已下架</Badge>}
                    {order.status === 'expired' && <Badge variant="warning">已过期</Badge>}
                    {isActive && <Badge variant="info">在售</Badge>}
                  </div>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                    <span className="flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      <span className="font-mono text-gray-200">{order.views || 0}</span>
                      <span className="text-gray-600">次浏览</span>
                    </span>
                    {(viewSrc.detail > 0 || viewSrc.category > 0) && (
                      <div className="flex items-center gap-1.5">
                        <div className="relative w-20 h-2 rounded-full overflow-hidden bg-gray-700">
                          <div className="absolute top-0 bottom-0 left-0 bg-sky-500/80" style={{ width: `${detailPct}%` }} />
                        </div>
                        <span className="text-sky-400 font-mono text-[10px]">详情{viewSrc.detail}</span>
                        <span className="text-emerald-400 font-mono text-[10px]">分类{viewSrc.category}</span>
                      </div>
                    )}
                    {order.bidHistory.length > 0 && <span className="flex items-center gap-1"><Gavel className="w-3 h-3 text-magic-gold" /> {order.bidHistory.length}次出价 最高{formatGold(topBid)}</span>}
                    <span>预计净收 <span className="font-mono text-emerald-400 font-bold">{formatGold(netRevenue)}</span></span>
                    {order.listingFee && order.listingFee > 0 && <span>手续费 <span className="font-mono text-red-300">{formatGold(order.listingFee)}</span></span>}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {isEditing ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={editPrice}
                        onChange={e => setEditPrice(e.target.value.replace(/[^0-9]/g, ''))}
                        className="magic-input !w-28 !py-1.5 text-center font-mono font-bold"
                        placeholder={String(order.price)}
                      />
                      <Button size="sm" variant="primary" onClick={() => handleReprice(order)}>
                        <Check className="w-3.5 h-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => { setEditingId(null); setEditPrice(''); }}>
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ) : (
                    <p className="font-mono text-2xl font-bold text-magic-gold">{formatGold(order.price)}</p>
                  )}
                  {order.originalPrice && order.originalPrice !== order.price && (
                    <p className="text-[10px] text-gray-500 line-through font-mono">原价 {formatGold(order.originalPrice)}</p>
                  )}
                </div>
              </div>

              {isEditing && (
                <div className="px-4 pb-3">
                  <div className="p-2.5 rounded-lg bg-magic-bg/70 border border-magic-border/50">
                    <div className="flex items-center justify-between text-xs mb-1">
                      <span className="text-gray-400 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3 text-magic-gold" /> 改价参考区间
                      </span>
                      <span className="font-mono text-magic-goldLight">{formatGold(priceRange[0])} ~ {formatGold(priceRange[1])}</span>
                    </div>
                    <div className="relative h-4 rounded-full overflow-hidden bg-gradient-to-r from-red-800/30 via-emerald-700/40 to-red-800/30">
                      <div className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-700" style={{ left: '20%', width: '60%' }} />
                      <div className="absolute top-0 bottom-0 w-2 bg-magic-gold rounded-full shadow-gold-glow transform -translate-x-1/2 transition-all"
                        style={{ left: `${Math.min(95, Math.max(5, ((parseInt(editPrice) || order.price) / (priceRange[1] * 2)) * 100))}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {isActive && !isEditing && (
                <div className="px-4 pb-3 flex gap-2">
                  <Button size="sm" variant="default" icon={<Edit3 className="w-3.5 h-3.5" />} onClick={() => { setEditingId(order.id); setEditPrice(String(order.price)); }}>
                    改价
                  </Button>
                  <Button size="sm" variant="danger" icon={<ArrowDownCircle className="w-3.5 h-3.5" />} onClick={() => onDelist(order.id)}>
                    下架
                  </Button>
                  <Button size="sm" variant="ghost" icon={<History className="w-3.5 h-3.5" />} onClick={() => setHistoryId(showHistory ? null : order.id)}>
                    {showHistory ? '收起' : '记录'}
                  </Button>
                </div>
              )}

              {!isActive && (
                <div className="px-4 pb-3">
                  <Button size="sm" variant="ghost" icon={<History className="w-3.5 h-3.5" />} onClick={() => setHistoryId(showHistory ? null : order.id)}>
                    {showHistory ? '收起记录' : '查看记录'}
                  </Button>
                </div>
              )}

              {showHistory && (
                <div className="px-4 pb-3 space-y-2">
                  {order.listingHistory && order.listingHistory.length > 0 && (
                    <div className="p-3 rounded-lg bg-magic-bg/50 border border-magic-border/50 space-y-1.5">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-display mb-1">操作历史</p>
                      {[...order.listingHistory].reverse().map((evt, i) => (
                        <div key={i} className="flex items-center gap-2 text-xs">
                          <span className={clsx(
                            'w-2 h-2 rounded-full shrink-0',
                            evt.type === 'listed' && 'bg-emerald-400',
                            evt.type === 'repriced' && 'bg-magic-gold',
                            evt.type === 'delisted' && 'bg-red-400',
                            evt.type === 'sold' && 'bg-sky-400',
                            evt.type === 'expired' && 'bg-gray-400',
                          )} />
                          <span className="text-gray-400 font-mono">{new Date(evt.timestamp).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}</span>
                          <span className={clsx(
                            'font-semibold',
                            evt.type === 'listed' && 'text-emerald-300',
                            evt.type === 'repriced' && 'text-magic-gold',
                            evt.type === 'delisted' && 'text-red-300',
                            evt.type === 'sold' && 'text-sky-300',
                            evt.type === 'expired' && 'text-gray-400',
                          )}>
                            {evt.type === 'listed' ? '上架' : evt.type === 'repriced' ? '改价' : evt.type === 'delisted' ? '下架' : evt.type === 'sold' ? '售出' : '过期'}
                          </span>
                          {evt.detail && <span className="text-gray-500">— {evt.detail}</span>}
                        </div>
                      ))}
                    </div>
                  )}

                  {(viewSrc.detail > 0 || viewSrc.category > 0 || (order.views || 0) > 0) && (
                    <div className="p-3 rounded-lg bg-magic-bg/50 border border-magic-border/50">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-display mb-2">经营统计</p>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="p-2 rounded-lg bg-magic-panel/60 text-center">
                          <p className="text-gray-500">总浏览</p>
                          <p className="font-mono font-bold text-sky-400 text-lg">{order.views || 0}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-magic-panel/60 text-center">
                          <p className="text-gray-500">详情来源</p>
                          <p className="font-mono font-bold text-magic-blue text-lg">{viewSrc.detail}</p>
                        </div>
                        <div className="p-2 rounded-lg bg-magic-panel/60 text-center">
                          <p className="text-gray-500">分类来源</p>
                          <p className="font-mono font-bold text-emerald-400 text-lg">{viewSrc.category}</p>
                        </div>
                      </div>
                      {order.bidHistory.length > 0 && (
                        <div className="mt-2 pt-2 border-t border-magic-border/50">
                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">出价次数 / 最高价</span>
                            <span>
                              <span className="font-mono text-magic-gold font-bold mr-2">{order.bidHistory.length}次</span>
                              <span className="font-mono text-emerald-400 font-bold">{formatGold(topBid)}</span>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {order.bidHistory && order.bidHistory.length > 0 && (
                    <div className="p-3 rounded-lg bg-magic-bg/50 border border-magic-border/50 space-y-1">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-display mb-1">出价记录</p>
                      {[...order.bidHistory].reverse().slice(0, 8).map((b, i) => (
                        <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-magic-panel/40">
                          <span className="text-gray-400">{b.bidderName}</span>
                          <span className="font-mono text-magic-gold font-bold">{formatGold(b.amount)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

interface ListingFormData {
  itemType: 'blueprint' | 'contract' | 'material';
  itemName: string;
  rarity: Rarity;
  icon: string;
  description: string;
  price: number;
  isAuction: boolean;
  durationHours: number;
  stats?: Record<string, number>;
}

function ListingModal({
  playerGold,
  currentTab,
  onClose,
  onConfirm,
}: {
  playerGold: number;
  currentTab: Tab;
  onClose: () => void;
  onConfirm: (data: ListingFormData) => void;
}) {
  const defaultType: 'blueprint' | 'contract' | 'material' =
    currentTab === 'contracts' ? 'contract' :
    currentTab === 'materials' ? 'material' : 'blueprint';

  const [itemType, setItemType] = useState<'blueprint' | 'contract' | 'material'>(defaultType);
  const [itemName, setItemName] = useState('');
  const [rarity, setRarity] = useState<Rarity>('rare');
  const [icon, setIcon] = useState(listingIcons[defaultType][0]);
  const [description, setDescription] = useState('');
  const [priceStr, setPriceStr] = useState('10000');
  const [isAuction, setIsAuction] = useState(false);
  const [durationHours, setDurationHours] = useState(48);

  const price = parseInt(priceStr) || 0;
  const priceRange = calculatePriceRange(itemType, rarity);
  const inRange = price >= priceRange[0] * 0.5 && price <= priceRange[1] * 2;
  const listingFee = Math.ceil(price * 0.01);
  const canAffordFee = playerGold >= listingFee;
  const valid = itemName.trim().length >= 2 && price > 0 && canAffordFee;

  useEffect(() => {
    setIcon(listingIcons[itemType][0]);
  }, [itemType]);

  const typeLabels: Record<string, string> = { blueprint: '兵种图纸', contract: '将领合同', material: '战争材料' };

  const generateDefaultStats = (): Record<string, number> | undefined => {
    if (itemType === 'blueprint') {
      const seed = rarity === 'legendary' ? 25 : rarity === 'epic' ? 18 : rarity === 'rare' ? 12 : rarity === 'uncommon' ? 8 : 5;
      return { 攻击: seed + Math.floor(Math.random() * 5), 防御: seed - 2, 生命: seed * 10 };
    }
    if (itemType === 'contract') {
      const seed = rarity === 'legendary' ? 40 : rarity === 'epic' ? 30 : rarity === 'rare' ? 22 : rarity === 'uncommon' ? 15 : 8;
      return { 统帅: seed, 攻击: seed - 5, 士气: seed - 10 };
    }
    return undefined;
  };

  const handleSubmit = () => {
    if (!valid) return;
    onConfirm({
      itemType,
      itemName: itemName.trim(),
      rarity,
      icon,
      description: description.trim() || `${rarityLabels[rarity]}品质的${typeLabels[itemType]}，来自珍藏收藏。`,
      price,
      isAuction,
      durationHours,
      stats: generateDefaultStats(),
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        transition={{ type: 'spring', damping: 25, stiffness: 300 }}
        className="w-full max-w-xl max-h-[90vh] overflow-y-auto bg-magic-card rounded-2xl border-2 border-magic-gold/50 shadow-gold-glow"
        onClick={e => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-magic-card/95 backdrop-blur-sm border-b border-magic-border p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-magic-gold to-magic-purple flex items-center justify-center shadow-gold-glow">
              <Package className="w-6 h-6 text-black" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold glow-text-gold text-magic-gold">上架出售</h3>
              <p className="text-xs text-gray-400">发布您的物品到交易市场</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-magic-panel/60 text-gray-400 hover:text-gray-200 transition-all">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
              <Tag className="w-4 h-4 text-magic-purpleLight" /> 出售类型
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['blueprint', 'contract', 'material'] as const).map(t => (
                <button
                  key={t}
                  onClick={() => setItemType(t)}
                  className={clsx(
                    'p-3 rounded-xl border-2 text-sm font-semibold transition-all',
                    itemType === t
                      ? 'bg-magic-gold/15 border-magic-gold text-magic-gold shadow-gold-glow/40'
                      : 'bg-magic-panel/50 border-magic-border text-gray-300 hover:border-magic-gold/30'
                  )}
                >
                  <div className="text-2xl mb-1">{listingIcons[t][0]}</div>
                  {t === 'blueprint' ? '兵种图纸' : t === 'contract' ? '将领合同' : '战争材料'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
              <Star className="w-4 h-4 text-magic-gold" /> 物品名称
            </label>
            <input
              type="text"
              placeholder={`例如：${itemType === 'blueprint' ? '龙骑突击阵图纸' : itemType === 'contract' ? '凯撒·龙魂将领合同' : '星辰魔力水晶'}`}
              value={itemName}
              onChange={e => setItemName(e.target.value)}
              maxLength={30}
              className="magic-input"
            />
            <p className="text-[11px] text-gray-500 mt-1">{itemName.length}/30 字</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-magic-purpleLight" /> 稀有度
              </label>
              <select
                value={rarity}
                onChange={e => setRarity(e.target.value as Rarity)}
                className="magic-input"
              >
                {(Object.keys(rarityLabels) as Rarity[]).map(r => (
                  <option key={r} value={r}>{rarityLabels[r]}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4 text-sky-400" /> 展示图标
              </label>
              <div className="flex gap-1.5 flex-wrap p-2 rounded-xl bg-magic-panel/50 border border-magic-border">
                {listingIcons[itemType].map(ic => (
                  <button
                    key={ic}
                    onClick={() => setIcon(ic)}
                    className={clsx(
                      'w-9 h-9 rounded-lg text-xl flex items-center justify-center transition-all border-2',
                      icon === ic
                        ? 'border-magic-gold bg-magic-gold/10 shadow-gold-glow/30 scale-110'
                        : 'border-transparent hover:bg-magic-bg'
                    )}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">物品描述 <span className="text-gray-500 font-normal text-xs">(可选)</span></label>
            <textarea
              rows={3}
              placeholder="描述物品的特点、历史或用途..."
              value={description}
              onChange={e => setDescription(e.target.value)}
              maxLength={140}
              className="magic-input resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
              <Coins className="w-4 h-4 text-magic-gold" /> 出售价格（金币）
            </label>
            <input
              type="number"
              placeholder="请输入价格"
              value={priceStr}
              onChange={e => setPriceStr(e.target.value.replace(/[^0-9]/g, ''))}
              className={clsx('magic-input font-mono text-xl font-bold',
                !inRange && price > 0 && '!border-amber-500/70 !shadow-[0_0_12px_rgba(245,158,11,0.15)]'
              )}
            />
            <div className="mt-2 p-3 rounded-xl bg-magic-bg/70 border border-magic-border/50">
              <div className="flex items-center justify-between mb-1.5 text-xs">
                <span className="text-gray-400 flex items-center gap-1">
                  <TrendingUp className="w-3.5 h-3.5 text-magic-gold" />
                  近7日建议价格区间
                </span>
                <span className={clsx('font-mono font-bold',
                  inRange || price === 0 ? 'text-emerald-400' : 'text-amber-400'
                )}>
                  {price === 0 ? '' : inRange ? '✓ 定价合理' : '⚠ 偏离建议'}
                </span>
              </div>
              <div className="relative h-6 rounded-full overflow-hidden bg-gradient-to-r from-red-800/30 via-emerald-700/40 to-red-800/30">
                <div
                  className="absolute top-0 bottom-0 bg-gradient-to-r from-emerald-700 via-emerald-500 to-emerald-700"
                  style={{
                    left: `20%`,
                    width: `60%`,
                  }}
                />
                <div
                  className="absolute top-0 bottom-0 w-3 bg-magic-gold rounded-full shadow-gold-glow transform -translate-x-1/2 transition-all"
                  style={{
                    left: `${Math.min(95, Math.max(5, (price / (priceRange[1] * 2)) * 100))}%`,
                  }}
                />
                <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] font-mono pointer-events-none">
                  <span className="text-gray-300 drop-shadow">{formatGold(priceRange[0])}</span>
                  <span className="text-magic-gold drop-shadow">{formatGold(Math.floor((priceRange[0] + priceRange[1]) / 2))}</span>
                  <span className="text-gray-300 drop-shadow">{formatGold(priceRange[1])}</span>
                </div>
              </div>
            </div>
            <div className="mt-2 flex items-center justify-between text-xs">
              <span className="text-gray-400">上架手续费 (1%):</span>
              <span className={clsx('font-mono font-bold', canAffordFee ? 'text-magic-gold' : 'text-red-400')}>
                {formatGold(listingFee)}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
                <Gavel className="w-4 h-4 text-magic-gold" /> 售卖方式
              </label>
              <div className="space-y-1.5">
                <label className={clsx(
                  'flex items-center gap-2 p-2.5 rounded-lg cursor-pointer border-2 transition-all',
                  !isAuction ? 'bg-magic-gold/10 border-magic-gold/50' : 'bg-magic-panel/40 border-magic-border/60 hover:border-magic-gold/30'
                )}>
                  <input type="radio" checked={!isAuction} onChange={() => setIsAuction(false)} className="accent-magic-gold" />
                  <div>
                    <p className="text-sm font-semibold text-gray-200">一口价</p>
                    <p className="text-[10px] text-gray-500">买家付款立即成交</p>
                  </div>
                </label>
                <label className={clsx(
                  'flex items-center gap-2 p-2.5 rounded-lg cursor-pointer border-2 transition-all',
                  isAuction ? 'bg-magic-gold/10 border-magic-gold/50' : 'bg-magic-panel/40 border-magic-border/60 hover:border-magic-gold/30'
                )}>
                  <input type="radio" checked={isAuction} onChange={() => setIsAuction(true)} className="accent-magic-gold" />
                  <div>
                    <p className="text-sm font-semibold text-gray-200">拍卖</p>
                    <p className="text-[10px] text-gray-500">买家竞价，价高者得</p>
                  </div>
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center gap-2">
                <Clock className="w-4 h-4 text-sky-400" /> 上架时长
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {[
                  { h: 12, l: '12时' },
                  { h: 24, l: '1天' },
                  { h: 48, l: '2天' },
                  { h: 72, l: '3天' },
                  { h: 120, l: '5天' },
                  { h: 168, l: '7天' },
                ].map(d => (
                  <button
                    key={d.h}
                    onClick={() => setDurationHours(d.h)}
                    className={clsx(
                      'py-2 rounded-lg text-xs font-semibold border-2 transition-all',
                      durationHours === d.h
                        ? 'bg-magic-gold/10 border-magic-gold/50 text-magic-gold'
                        : 'bg-magic-panel/40 border-magic-border/60 text-gray-300 hover:border-magic-gold/30'
                    )}
                  >
                    {d.l}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-gradient-to-r from-magic-gold/10 via-magic-purple/10 to-magic-blue/10 border border-magic-gold/30">
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div>
                <p className="text-gray-400 uppercase text-[10px] tracking-wider">物品预览</p>
                <div className="mt-1 flex items-center justify-center gap-2">
                  <span className="text-2xl">{icon}</span>
                  <RarityBadge rarity={rarity} />
                </div>
              </div>
              <div>
                <p className="text-gray-400 uppercase text-[10px] tracking-wider">总收益预估</p>
                <p className="font-mono text-lg font-bold text-emerald-400 mt-1">{formatGold(price - listingFee)}</p>
              </div>
              <div>
                <p className="text-gray-400 uppercase text-[10px] tracking-wider">成交后扣点</p>
                <p className="font-mono text-lg font-bold text-magic-flame mt-1">1%</p>
              </div>
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-magic-card/95 backdrop-blur-sm border-t border-magic-border p-5 flex gap-3">
          <Button variant="ghost" className="flex-1" onClick={onClose}>
            取消
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            icon={<Check className="w-4 h-4" />}
            disabled={!valid}
            onClick={handleSubmit}
          >
            {!canAffordFee ? '手续费不足' : itemName.trim().length < 2 ? '请填写名称' : price <= 0 ? '请设置价格' : `确认上架 · ${formatGold(listingFee)}`}
          </Button>
        </div>
      </motion.div>
    </motion.div>
  );
}
