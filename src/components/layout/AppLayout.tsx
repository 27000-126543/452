import type { ReactNode } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  LayoutDashboard, Users, Sword, Map, Trophy, Store, Castle, FileBarChart, Trophy as TrophyIcon,
  Coins, Crown, Bell, Settings, Sparkles
} from 'lucide-react';
import { usePlayerStore, useGlobalStore } from '@/store';
import { rarityColors } from '@/data/mockData';

const navItems = [
  { path: '/', label: '仪表盘', icon: LayoutDashboard, short: '首页' },
  { path: '/legion', label: '军团管理', icon: Users, short: '军团' },
  { path: '/barracks', label: '兵种配置', icon: Sword, short: '兵营' },
  { path: '/sandbox', label: '沙盘推演', icon: Map, short: '沙盘' },
  { path: '/arena', label: '战争大赛', icon: Trophy, short: '大赛' },
  { path: '/market', label: '交易市场', icon: Store, short: '市场' },
  { path: '/headquarters', label: '联合军部', icon: Castle, short: '军部' },
  { path: '/reports', label: '战争报告', icon: FileBarChart, short: '报告' },
  { path: '/ranking', label: '排行榜', icon: TrophyIcon, short: '排行' },
];

const rankNames: Record<string, string> = {
  bronze: '青铜', silver: '白银', gold: '黄金',
  platinum: '铂金', diamond: '钻石', master: '大师',
};

export default function AppLayout({ children }: { children: ReactNode }) {
  const location = useLocation();
  const player = usePlayerStore((s) => s.player);
  const { mobilizationActive, mobilizationBonus } = useGlobalStore();

  const currentPage = navItems.find(n => n.path === location.pathname)?.label || '魔法战争沙盘';

  return (
    <div className="min-h-screen flex bg-magic-bg text-gray-100">
      <aside className="w-64 lg:w-60 shrink-0 h-screen sticky top-0 border-r border-magic-border bg-magic-panel/80 backdrop-blur-sm">
        <div className="p-5 border-b border-magic-border">
          <div className="flex items-center gap-3">
            <div className="relative w-12 h-12 flex items-center justify-center">
              <div className="absolute inset-0 bg-gradient-to-br from-magic-gold to-magic-purple rounded-full animate-rune-spin opacity-30"></div>
              <Sparkles className="w-7 h-7 text-magic-gold relative z-10" />
            </div>
            <div>
              <h1 className="font-display text-lg font-bold text-magic-gold leading-tight">魔法战争</h1>
              <p className="text-xs text-gray-400 font-display">沙盘推演系统</p>
            </div>
          </div>
        </div>

        <nav className="p-3 space-y-1">
          {navItems.map((item, idx) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-4 py-3 rounded-lg font-display text-sm uppercase tracking-wider transition-all duration-300 ${
                  isActive
                    ? 'bg-gradient-to-r from-magic-purple/40 to-transparent text-magic-gold border-l-2 border-magic-gold shadow-inner-magic'
                    : 'text-gray-400 hover:text-gray-100 hover:bg-magic-card/60 border-l-2 border-transparent'
                }`
              }
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <item.icon className={`w-5 h-5 transition-transform duration-300 ${
                location.pathname === item.path ? 'text-magic-gold' : 'group-hover:scale-110'
              }`} />
              <span className="lg:inline">{item.label}</span>
              {item.path === '/arena' && (
                <span className="ml-auto w-2 h-2 rounded-full bg-magic-flame animate-pulse" />
              )}
            </NavLink>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-magic-border bg-magic-panel/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-magic-purple to-magic-gold flex items-center justify-center text-xl">
              {player.avatar}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-display font-semibold text-sm truncate text-magic-goldLight">{player.name}</p>
              <p className="text-xs truncate" style={{ color: rarityColors[player.rank] }}>
                {rankNames[player.rank]} · {player.title}
              </p>
            </div>
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="h-16 border-b border-magic-border bg-magic-panel/60 backdrop-blur-sm sticky top-0 z-30 flex items-center px-6 gap-4">
          <div className="flex items-center gap-3">
            <Crown className="w-5 h-5 text-magic-gold" />
            <h2 className="font-display text-xl font-bold text-gray-100">{currentPage}</h2>
            {mobilizationActive && (
              <span className="px-3 py-1 bg-gradient-to-r from-magic-flame to-magic-gold rounded-full text-xs font-display font-bold text-black animate-pulse-gold">
                ⚡ 战争动员 +{mobilizationBonus}%
              </span>
            )}
          </div>

          <div className="ml-auto flex items-center gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-magic-card border border-magic-border">
              <Coins className="w-4 h-4 text-magic-gold" />
              <span className="font-mono font-bold text-magic-goldLight text-sm">
                {player.gold.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-magic-card border border-magic-border">
              <TrophyIcon className="w-4 h-4 text-magic-blue" />
              <span className="font-mono font-bold text-magic-blue text-sm">
                {player.seasonPoints.toLocaleString()}
              </span>
            </div>
            <button className="relative p-2 rounded-lg hover:bg-magic-card border border-transparent hover:border-magic-border transition-all">
              <Bell className="w-5 h-5 text-gray-400 hover:text-magic-gold" />
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-magic-flame" />
            </button>
            <button className="p-2 rounded-lg hover:bg-magic-card border border-transparent hover:border-magic-border transition-all">
              <Settings className="w-5 h-5 text-gray-400 hover:text-magic-gold" />
            </button>
          </div>
        </header>

        <div className="flex-1 p-6">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
