import type { TradeItem, Rarity } from '@/types';

const historicalPriceData: Record<string, number[]> = {
  legendary: [160000, 172000, 185000, 168000, 195000, 180000, 210000],
  epic: [70000, 78000, 82000, 75000, 90000, 88000, 95000],
  rare: [28000, 32000, 30000, 35000, 33000, 38000, 42000],
  uncommon: [8000, 9500, 8800, 10200, 9800, 11000, 12000],
  common: [2000, 2200, 2500, 2300, 2800, 2600, 3000],
};

const itemTypeMultiplier: Record<string, number> = {
  blueprint: 1.2,
  contract: 1.0,
  material: 0.15,
};

export const getHistoricalPrices = (rarity: Rarity): number[] => {
  return historicalPriceData[rarity] || historicalPriceData.common;
};

export const calculatePriceRange = (
  itemType: 'blueprint' | 'contract' | 'material',
  rarity: Rarity,
  recentTrend: number = 0,
): [number, number] => {
  const prices = getHistoricalPrices(rarity);
  const avg = prices.reduce((s, p) => s + p, 0) / prices.length;
  const variance = prices.reduce((s, p) => s + Math.pow(p - avg, 2), 0) / prices.length;
  const stdDev = Math.sqrt(variance);
  const typeMult = itemTypeMultiplier[itemType] || 1;
  const trendMult = 1 + recentTrend / 100;
  const basePrice = avg * typeMult * trendMult;
  const lowerBound = Math.floor((basePrice - stdDev * 0.8) / 100) * 100;
  const upperBound = Math.ceil((basePrice + stdDev * 0.8) / 100) * 100;
  return [Math.max(100, lowerBound), Math.max(lowerBound + 1000, upperBound)];
};

export const detectMarketTrend = (rarity: Rarity): number => {
  const prices = getHistoricalPrices(rarity);
  if (prices.length < 2) return 0;
  const recentAvg = prices.slice(-3).reduce((s, p) => s + p, 0) / 3;
  const earlierAvg = prices.slice(0, 4).reduce((s, p) => s + p, 0) / 4;
  return Math.round(((recentAvg - earlierAvg) / earlierAvg) * 1000) / 10;
};

export const validateListingPrice = (
  price: number,
  itemType: 'blueprint' | 'contract' | 'material',
  rarity: Rarity,
): { valid: boolean; reason?: string; suggestedRange: [number, number] } => {
  const suggestedRange = calculatePriceRange(itemType, rarity);
  const [min, max] = suggestedRange;
  if (price < min * 0.3) {
    return { valid: false, reason: '价格过低，可能被系统判定为异常交易', suggestedRange };
  }
  if (price > max * 3) {
    return { valid: false, reason: '价格过高，远超市场合理区间', suggestedRange };
  }
  return { valid: true, suggestedRange };
};

export const formatGold = (amount: number): string => {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(2)}M`;
  if (amount >= 1000) return `${(amount / 1000).toFixed(1)}K`;
  return amount.toString();
};
