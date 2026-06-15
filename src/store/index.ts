import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Player,
  Legion,
  General,
  Unit,
  ArmyComposition,
  Formation,
  BattleState,
  TradeOrder,
  NewsItem,
  WarReport,
  MatchmakingTicket,
  RankEntry,
  LegionRole,
  RecruitRequest,
  PromotionRequest,
} from '@/types';
import {
  mockPlayer,
  mockLegion,
  mockGenerals,
  mockUnits,
  mockArmyComposition,
  mockFormations,
  mockTradeOrders,
  mockNews,
  mockWarReport,
  mockRanking,
  generateId,
} from '@/data/mockData';

interface GlobalState {
  mobilizationActive: boolean;
  mobilizationBonus: number;
  mobilizationEndsAt: number | null;
  currentTime: number;
  setMobilization: (active: boolean, bonus: number, duration: number) => void;
  updateTime: () => void;
}

export const useGlobalStore = create<GlobalState>()(
  persist(
    (set) => ({
      mobilizationActive: false,
      mobilizationBonus: 0,
      mobilizationEndsAt: null,
      currentTime: Date.now(),
      setMobilization: (active, bonus, duration) =>
        set({
          mobilizationActive: active,
          mobilizationBonus: bonus,
          mobilizationEndsAt: active ? Date.now() + duration : null,
        }),
      updateTime: () => set((s) => {
        const now = Date.now();
        const stillActive = s.mobilizationEndsAt ? now < s.mobilizationEndsAt : false;
        return {
          currentTime: now,
          mobilizationActive: stillActive,
          mobilizationEndsAt: stillActive ? s.mobilizationEndsAt : null,
          mobilizationBonus: stillActive ? s.mobilizationBonus : 0,
        };
      }),
    }),
    { name: 'war-global-store' }
  )
);

interface PlayerState {
  player: Player;
  setPlayer: (player: Player) => void;
  updateGold: (delta: number) => void;
  updateSeasonPoints: (delta: number) => void;
  updateMaterials: (materials: Record<string, number>) => void;
}

export const usePlayerStore = create<PlayerState>()(
  persist(
    (set) => ({
      player: mockPlayer,
      setPlayer: (player) => set({ player }),
      updateGold: (delta) =>
        set((s) => ({ player: { ...s.player, gold: Math.max(0, s.player.gold + delta) } })),
      updateSeasonPoints: (delta) =>
        set((s) => ({ player: { ...s.player, seasonPoints: s.player.seasonPoints + delta } })),
      updateMaterials: (mats) =>
        set((s) => {
          const newMats = { ...s.player.materials };
          Object.keys(mats).forEach((k) => {
            newMats[k] = Math.max(0, (newMats[k] || 0) + mats[k]);
          });
          return { player: { ...s.player, materials: newMats } };
        }),
    }),
    { name: 'war-player-store' }
  )
);

interface LegionState {
  legion: Legion;
  setLegion: (legion: Legion) => void;
  approveRecruit: (requestId: string, approve: boolean) => void;
  approvePromotion: (requestId: string, approve: boolean) => void;
  assignRole: (playerId: string, role: LegionRole) => void;
  contributeToHeadquarters: (playerId: string, gold?: number, materials?: Record<string, number>) => void;
  addMemberContribution: (playerId: string, amount: number) => void;
  approveResearch: (projectId: string, approve: boolean) => void;
}

export const useLegionStore = create<LegionState>()(
  persist(
    (set) => ({
      legion: mockLegion,
      setLegion: (legion) => set({ legion }),
      approveRecruit: (requestId, approve) =>
        set((s) => {
          const req = s.legion.recruitRequests.find(r => r.id === requestId);
          let newMembers = s.legion.members;
          if (approve && req) {
            newMembers = [...s.legion.members, {
              playerId: req.playerId,
              playerName: req.playerName,
              avatar: req.avatar,
              role: 'member' as LegionRole,
              joinedAt: Date.now(),
              contribution: 0,
              armyPower: 8000 + Math.floor(Math.random() * 15000),
              rank: 'bronze',
            }];
          }
          return {
            legion: {
              ...s.legion,
              members: newMembers,
              recruitRequests: s.legion.recruitRequests.map(r =>
                r.id === requestId ? { ...r, status: approve ? 'approved' : 'rejected' as const } : r
              ),
            },
          };
        }),
      approvePromotion: (requestId, approve) =>
        set((s) => {
          const req = s.legion.promotionRequests.find(r => r.id === requestId);
          let newMembers = s.legion.members;
          if (approve && req) {
            newMembers = s.legion.members.map(m =>
              m.playerId === req.playerId ? { ...m, role: req.requestedRole } : m
            );
          }
          return {
            legion: {
              ...s.legion,
              members: newMembers,
              promotionRequests: s.legion.promotionRequests.map(r =>
                r.id === requestId ? { ...r, status: approve ? 'approved' : 'rejected' as const } : r
              ),
            },
          };
        }),
      assignRole: (playerId, role) =>
        set((s) => ({
          legion: {
            ...s.legion,
            members: s.legion.members.map(m =>
              m.playerId === playerId ? { ...m, role } : m
            ),
          },
        })),
      contributeToHeadquarters: (playerId, gold, materials) =>
        set((s) => {
          const goldAmount = gold || 0;
          const matContrib = materials || {};
          const newProgress = { ...s.legion.headquarters.upgradeProgress };
          newProgress.goldContributed += goldAmount;
          newProgress.current += goldAmount / 10;
          Object.keys(matContrib).forEach(k => {
            newProgress.materialsContributed[k] = (newProgress.materialsContributed[k] || 0) + matContrib[k];
            newProgress.current += matContrib[k] * 2;
          });
          let newLevel = s.legion.headquarters.level;
          if (newProgress.current >= newProgress.required && newLevel < s.legion.headquarters.maxLevel) {
            newLevel += 1;
            newProgress.current = 0;
            newProgress.required = Math.floor(newProgress.required * 1.6);
          }
          const updatedMembers = s.legion.members.map(m =>
            m.playerId === playerId
              ? { ...m, contribution: m.contribution + goldAmount / 10 + Object.values(matContrib).reduce((a, b) => a + b, 0) }
              : m
          );
          return {
            legion: {
              ...s.legion,
              members: updatedMembers,
              headquarters: {
                ...s.legion.headquarters,
                level: newLevel,
                upgradeProgress: newProgress,
                powerCapBonus: 2500 * newLevel,
                visionBonus: Math.floor(newLevel / 2),
              },
              totalPower: s.legion.totalPower + (newLevel > s.legion.headquarters.level ? 5000 : 0),
            },
          };
        }),
      addMemberContribution: (playerId, amount) =>
        set((s) => ({
          legion: {
            ...s.legion,
            members: s.legion.members.map(m =>
              m.playerId === playerId ? { ...m, contribution: m.contribution + amount } : m
            ),
            contribution: s.legion.contribution + amount,
          },
        })),
      approveResearch: (projectId, approve) =>
        set((s) => ({
          legion: {
            ...s.legion,
            researchProjects: s.legion.researchProjects.map(p =>
              p.id === projectId ? { ...p, status: approve ? 'in_progress' as const : 'pending' as const } : p
            ),
          },
        })),
    }),
    { name: 'war-legion-store' }
  )
);

interface ArmyState {
  generals: General[];
  units: Unit[];
  composition: ArmyComposition;
  formations: Formation[];
  activeFormationId: string | null;
  setGenerals: (generals: General[]) => void;
  setUnits: (units: Unit[]) => void;
  setComposition: (composition: ArmyComposition) => void;
  updateUnitCount: (unitId: string, delta: number) => void;
  setActiveFormation: (formationId: string) => void;
  saveFormation: (formation: Formation) => void;
  updateCompositionSlot: (type: 'infantry' | 'cavalry' | 'mages', unitId: string | null, count: number) => void;
  updateGeneral: (generalId: string | null) => void;
  levelUpGeneral: (generalId: string) => void;
  levelUpUnit: (unitId: string) => void;
  recruitUnit: (unitId: string, count: number, cost: number) => void;
}

export const useArmyStore = create<ArmyState>()(
  persist(
    (set) => ({
      generals: mockGenerals,
      units: mockUnits,
      composition: mockArmyComposition,
      formations: mockFormations,
      activeFormationId: mockFormations[0].id,
      setGenerals: (generals) => set({ generals }),
      setUnits: (units) => set({ units }),
      setComposition: (composition) => set({ composition }),
      updateUnitCount: (unitId, delta) =>
        set((s) => ({
          units: s.units.map(u =>
            u.id === unitId ? { ...u, count: Math.max(0, u.count + delta) } : u
          ),
        })),
      setActiveFormation: (formationId) => set({ activeFormationId: formationId }),
      saveFormation: (formation) =>
        set((s) => {
          const exists = s.formations.some(f => f.id === formation.id);
          return {
            formations: exists
              ? s.formations.map(f => f.id === formation.id ? formation : f)
              : [...s.formations, formation],
          };
        }),
      updateCompositionSlot: (type, unitId, count) =>
        set((s) => ({
          composition: {
            ...s.composition,
            [type]: { ...s.composition[type], unitId, count },
          },
        })),
      updateGeneral: (generalId) =>
        set((s) => ({ composition: { ...s.composition, generalId } })),
      levelUpGeneral: (generalId) =>
        set((s) => ({
          generals: s.generals.map(g =>
            g.id === generalId ? {
              ...g,
              level: g.level + 1,
              exp: Math.floor(g.exp * 0.2),
              commandCap: g.commandCap + 200,
              attackBonus: g.attackBonus + 1,
              defenseBonus: g.defenseBonus + 1,
              moraleBoost: g.moraleBoost + 0.5,
            } : g
          ),
        })),
      levelUpUnit: (unitId) =>
        set((s) => ({
          units: s.units.map(u =>
            u.id === unitId ? {
              ...u,
              level: u.level + 1,
              baseStats: {
                ...u.baseStats,
                attack: Math.floor(u.baseStats.attack * 1.08),
                defense: Math.floor(u.baseStats.defense * 1.08),
                hp: Math.floor(u.baseStats.hp * 1.1),
                magicPower: Math.floor(u.baseStats.magicPower * 1.08),
              },
            } : u
          ),
        })),
      recruitUnit: (unitId, count, cost) =>
        set((s) => ({
          units: s.units.map(u =>
            u.id === unitId ? { ...u, count: u.count + count } : u
          ),
          composition: {
            ...s.composition,
            supplies: Math.max(0, s.composition.supplies - cost),
          },
        })),
    }),
    { name: 'war-army-store' }
  )
);

interface BattleStateStore {
  currentBattle: BattleState | null;
  matchmakingTicket: MatchmakingTicket | null;
  battleHistory: BattleState[];
  setCurrentBattle: (battle: BattleState | null) => void;
  updateBattle: (battle: BattleState) => void;
  setMatchmakingTicket: (ticket: MatchmakingTicket | null) => void;
  addBattleToHistory: (battle: BattleState) => void;
  activateSurpriseAttack: () => void;
  useSkill: (skillId: string) => void;
  changeFormation: (formationType: 'offensive' | 'defensive' | 'balanced') => void;
}

export const useBattleStore = create<BattleStateStore>()(
  persist(
    (set) => ({
      currentBattle: null,
      matchmakingTicket: null,
      battleHistory: [],
      setCurrentBattle: (battle) => set({ currentBattle: battle }),
      updateBattle: (battle) => set({ currentBattle: battle }),
      setMatchmakingTicket: (ticket) => set({ matchmakingTicket: ticket }),
      addBattleToHistory: (battle) =>
        set((s) => ({
          battleHistory: [battle, ...s.battleHistory].slice(0, 50),
        })),
      activateSurpriseAttack: () =>
        set((s) => {
          if (!s.currentBattle || s.currentBattle.playerArmy.surpriseTroops < 50) return s;
          if ((s.currentBattle.playerArmy.tacticalCooldowns?.['surprise'] || 0) > 0) return s;
          const deployed = Math.min(200, Math.max(100, Math.floor(s.currentBattle.playerArmy.surpriseTroops / 2)));
          const damage = deployed * 15;
          const updatedEnemyUnits = s.currentBattle.enemyArmy.units.map(u => {
            const casualties = Math.min(u.currentCount, Math.floor(damage / s.currentBattle.enemyArmy.units.length / 10));
            return {
              ...u,
              currentCount: Math.max(0, u.currentCount - casualties),
              casualties: u.casualties + casualties,
              morale: Math.max(40, u.morale - 8),
            };
          });
          return {
            currentBattle: {
              ...s.currentBattle,
              playerArmy: {
                ...s.currentBattle.playerArmy,
                surpriseTroops: Math.max(0, s.currentBattle.playerArmy.surpriseTroops - deployed),
                tacticalCooldowns: { ...(s.currentBattle.playerArmy.tacticalCooldowns || {}), surprise: 3 },
              },
              enemyArmy: { ...s.currentBattle.enemyArmy, units: updatedEnemyUnits },
              log: [...s.currentBattle.log, {
                turn: s.currentBattle.currentTurn,
                timestamp: Date.now(),
                type: 'surprise',
                side: 'player',
                message: `🎯 奇袭部队出击！派遣${deployed}人造成敌方混乱，大量伤亡！`,
              }],
            },
          };
        }),
      useSkill: (skillId) =>
        set((s) => {
          if (!s.currentBattle) return s;
          const cd = s.currentBattle.playerArmy.skillCooldowns[skillId] || 0;
          if (cd > 0) return s;
          return {
            currentBattle: {
              ...s.currentBattle,
              playerArmy: {
                ...s.currentBattle.playerArmy,
                skillCooldowns: { ...s.currentBattle.playerArmy.skillCooldowns, [skillId]: 3 },
                units: s.currentBattle.playerArmy.units.map(u => ({
                  ...u,
                  attack: Math.floor(u.attack * 1.25),
                  statusEffects: [...u.statusEffects, {
                    id: generateId(),
                    name: '战吼',
                    type: 'buff' as const,
                    duration: 3,
                    effect: 'attack_buff',
                    value: 25,
                  }],
                })),
              },
              log: [...s.currentBattle.log, {
                turn: s.currentBattle.currentTurn,
                timestamp: Date.now(),
                type: 'skill',
                side: 'player',
                message: '✨ 发动战术技能！全军团攻击提升25%！',
              }],
            },
          };
        }),
      changeFormation: (formationType) =>
        set((s) => {
          if (!s.currentBattle) return s;
          if ((s.currentBattle.playerArmy.tacticalCooldowns?.['formation'] || 0) > 0) return s;
          const bonuses = {
            offensive: { atk: 1.2, def: 0.9 },
            defensive: { atk: 0.9, def: 1.2 },
            balanced: { atk: 1.05, def: 1.05 },
          }[formationType];
          const formationNames = { offensive: '进攻阵型', defensive: '防御阵型', balanced: '均衡阵型' };
          return {
            currentBattle: {
              ...s.currentBattle,
              playerArmy: {
                ...s.currentBattle.playerArmy,
                tacticalCooldowns: { ...(s.currentBattle.playerArmy.tacticalCooldowns || {}), formation: 2 },
                units: s.currentBattle.playerArmy.units.map(u => ({
                  ...u,
                  attack: Math.floor(u.attack * bonuses.atk),
                  defense: Math.floor(u.defense * bonuses.def),
                })),
              },
              log: [...s.currentBattle.log, {
                turn: s.currentBattle.currentTurn,
                timestamp: Date.now(),
                type: 'formation',
                side: 'player',
                message: `🔄 切换为${formationNames[formationType]}！`,
              }],
            },
          };
        }),
    }),
    { name: 'war-battle-store' }
  )
);

interface MarketState {
  orders: TradeOrder[];
  myListings: TradeOrder[];
  purchaseHistory: { orderId: string; itemName: string; price: number; timestamp: number; type: string }[];
  addOrder: (order: TradeOrder) => void;
  removeOrder: (orderId: string) => void;
  purchaseOrder: (orderId: string, buyerId: string) => TradeOrder | null;
  placeBid: (orderId: string, bidderId: string, bidderName: string, amount: number) => boolean;
  repriceOrder: (orderId: string, newPrice: number, newRange: [number, number]) => void;
  delistOrder: (orderId: string) => void;
  incrementViews: (orderId: string) => void;
  refreshOrders: () => void;
}

export const useMarketStore = create<MarketState>()(
  persist(
    (set, get) => ({
      orders: mockTradeOrders,
      myListings: [],
      purchaseHistory: [],
      addOrder: (order) =>
        set((s) => ({
          orders: [...s.orders, order],
          myListings: [...s.myListings, order],
        })),
      removeOrder: (orderId) =>
        set((s) => ({
          orders: s.orders.filter(o => o.id !== orderId),
          myListings: s.myListings.filter(o => o.id !== orderId),
        })),
      purchaseOrder: (orderId) => {
        const order = get().orders.find(o => o.id === orderId && o.status === 'active');
        if (!order || order.isAuction) return null;
        set((s) => ({
          orders: s.orders.map(o =>
            o.id === orderId ? { ...o, status: 'sold' as const, listingHistory: [...(o.listingHistory || []), { type: 'sold' as const, timestamp: Date.now(), detail: `${order.price}金币` }] } : o
          ),
          myListings: s.myListings.map(o =>
            o.id === orderId ? { ...o, status: 'sold' as const, listingHistory: [...(o.listingHistory || []), { type: 'sold' as const, timestamp: Date.now(), detail: `${order.price}金币` }] } : o
          ),
          purchaseHistory: [...s.purchaseHistory, {
            orderId,
            itemName: order.itemData.name,
            price: order.price,
            timestamp: Date.now(),
            type: order.itemType,
          }],
        }));
        return order;
      },
      placeBid: (orderId, bidderId, bidderName, amount) => {
        const order = get().orders.find(o => o.id === orderId);
        if (!order || !order.isAuction) return false;
        const highestBid = order.bidHistory.length > 0
          ? Math.max(...order.bidHistory.map(b => b.amount))
          : 0;
        if (amount <= highestBid || amount < order.price) return false;
        set((s) => ({
          orders: s.orders.map(o =>
            o.id === orderId
              ? {
                  ...o,
                  bidHistory: [...o.bidHistory, { bidderId, bidderName, amount, timestamp: Date.now() }],
                  price: amount,
                }
              : o
          ),
        }));
        return true;
      },
      repriceOrder: (orderId, newPrice, newRange) =>
        set((s) => ({
          orders: s.orders.map(o =>
            o.id === orderId
              ? {
                  ...o,
                  price: newPrice,
                  suggestedPriceRange: newRange,
                  listingHistory: [...(o.listingHistory || []), { type: 'repriced' as const, timestamp: Date.now(), detail: `${o.price}→${newPrice}` }],
                }
              : o
          ),
          myListings: s.myListings.map(o =>
            o.id === orderId
              ? {
                  ...o,
                  price: newPrice,
                  suggestedPriceRange: newRange,
                  listingHistory: [...(o.listingHistory || []), { type: 'repriced' as const, timestamp: Date.now(), detail: `${o.price}→${newPrice}` }],
                }
              : o
          ),
        })),
      delistOrder: (orderId) =>
        set((s) => ({
          orders: s.orders.map(o =>
            o.id === orderId
              ? { ...o, status: 'delisted' as const, listingHistory: [...(o.listingHistory || []), { type: 'delisted' as const, timestamp: Date.now() }] }
              : o
          ),
          myListings: s.myListings.map(o =>
            o.id === orderId
              ? { ...o, status: 'delisted' as const, listingHistory: [...(o.listingHistory || []), { type: 'delisted' as const, timestamp: Date.now() }] }
              : o
          ),
        })),
      incrementViews: (orderId) =>
        set((s) => ({
          orders: s.orders.map(o => o.id === orderId ? { ...o, views: (o.views || 0) + 1 } : o),
          myListings: s.myListings.map(o => o.id === orderId ? { ...o, views: (o.views || 0) + 1 } : o),
        })),
      refreshOrders: () => {
        const extraOrders: TradeOrder[] = [
          {
            id: generateId(),
            sellerId: 'rand-' + Math.random(),
            sellerName: ['神秘商人', '流浪骑士', '古代宝库'][Math.floor(Math.random() * 3)],
            itemType: Math.random() > 0.5 ? 'blueprint' : 'contract',
            itemData: {
              id: 'rand-' + generateId(),
              name: ['神秘骑兵图纸', '古代法师契约', '精锐步兵蓝图'][Math.floor(Math.random() * 3)],
              rarity: (['rare', 'epic'] as const)[Math.floor(Math.random() * 2)],
              icon: ['📜', '📋', '🗺️'][Math.floor(Math.random() * 3)],
              description: '来自远方的珍稀物品',
            },
            price: 30000 + Math.floor(Math.random() * 80000),
            suggestedPriceRange: [25000, 90000],
            listedAt: Date.now() - Math.floor(Math.random() * 3600000 * 12),
            expiresAt: Date.now() + 86400000 * (1 + Math.floor(Math.random() * 3)),
            status: 'active',
            bidHistory: [],
            isAuction: Math.random() > 0.5,
            views: Math.floor(Math.random() * 20),
            listingHistory: [{ type: 'listed' as const, timestamp: Date.now() - Math.floor(Math.random() * 3600000 * 12), detail: `${30000 + Math.floor(Math.random() * 80000)}金币` }],
          },
        ];
        set((s) => ({ orders: [...s.orders, ...extraOrders].slice(0, 30) }));
      },
    }),
    { name: 'war-market-store' }
  )
);

interface ContentState {
  news: NewsItem[];
  warReport: WarReport;
  ranking: { power: RankEntry[]; points: RankEntry[]; contribution: RankEntry[] };
  addNews: (item: NewsItem) => void;
  refreshNews: () => void;
  generateWeeklyReport: () => void;
}

export const useContentStore = create<ContentState>()(
  (set) => ({
    news: mockNews,
    warReport: mockWarReport,
    ranking: mockRanking,
    addNews: (item) =>
      set((s) => ({ news: [item, ...s.news].slice(0, 50) })),
    refreshNews: () => {
      const templates = [
        { type: 'battle' as const, title: '⚔️ 新战报', msg: '「{a}」战胜「{b}」！' },
        { type: 'trade' as const, title: '💰 新交易', msg: '「{x}」以{y}金币成交' },
        { type: 'mobilization' as const, title: '⚡ 战争动员', msg: '全服招募效率提升20%！' },
      ];
      const t = templates[Math.floor(Math.random() * templates.length)];
      const names = ['火焰军团', '冰霜联盟', '龙族后裔', '圣光骑士'];
      const newItem: NewsItem = {
        id: generateId(),
        type: t.type,
        title: t.title,
        content: t.msg
          .replace('{a}', names[Math.floor(Math.random() * names.length)])
          .replace('{b}', names[Math.floor(Math.random() * names.length)])
          .replace('{x}', ['稀有图纸', '传奇合同', '魔法材料'][Math.floor(Math.random() * 3)])
          .replace('{y}', (10000 + Math.floor(Math.random() * 100000)).toLocaleString()),
        timestamp: Date.now(),
      };
      set((s) => ({ news: [newItem, ...s.news].slice(0, 50) }));
    },
    generateWeeklyReport: () => set({ warReport: { ...mockWarReport, generatedAt: Date.now() } }),
  })
);

// Avoid unused variable warnings
export type { RecruitRequest, PromotionRequest };
