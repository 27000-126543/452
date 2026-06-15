import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { lazy, Suspense } from 'react';
import AppLayout from "@/components/layout/AppLayout";

const DashboardPage = lazy(() => import('@/pages/Dashboard/DashboardPage'));
const LegionPage = lazy(() => import('@/pages/Legion/LegionPage'));
const BarracksPage = lazy(() => import('@/pages/Barracks/BarracksPage'));
const SandboxPage = lazy(() => import('@/pages/Sandbox/SandboxPage'));
const ArenaPage = lazy(() => import('@/pages/Arena/ArenaPage'));
const MarketPage = lazy(() => import('@/pages/Market/MarketPage'));
const HeadquartersPage = lazy(() => import('@/pages/Headquarters/HeadquartersPage'));
const ReportsPage = lazy(() => import('@/pages/Reports/ReportsPage'));
const RankingPage = lazy(() => import('@/pages/Ranking/RankingPage'));

const LoadingScreen = () => (
  <div className="min-h-screen bg-magic-bg flex items-center justify-center">
    <div className="text-center">
      <div className="w-20 h-20 border-4 border-magic-gold border-t-transparent rounded-full animate-spin mx-auto mb-4 shadow-gold-glow" />
      <p className="font-display text-xl text-magic-gold animate-[runeSpin_3s_linear_infinite]">
        ✦ 魔法阵载入中 ✦
      </p>
    </div>
  </div>
);

const AnimatedRoutes = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <AppLayout>
            <DashboardPage />
          </AppLayout>
        } />
        <Route path="/legion" element={
          <AppLayout>
            <LegionPage />
          </AppLayout>
        } />
        <Route path="/barracks" element={
          <AppLayout>
            <BarracksPage />
          </AppLayout>
        } />
        <Route path="/sandbox" element={
          <AppLayout>
            <SandboxPage />
          </AppLayout>
        } />
        <Route path="/arena" element={
          <AppLayout>
            <ArenaPage />
          </AppLayout>
        } />
        <Route path="/market" element={
          <AppLayout>
            <MarketPage />
          </AppLayout>
        } />
        <Route path="/headquarters" element={
          <AppLayout>
            <HeadquartersPage />
          </AppLayout>
        } />
        <Route path="/reports" element={
          <AppLayout>
            <ReportsPage />
          </AppLayout>
        } />
        <Route path="/ranking" element={
          <AppLayout>
            <RankingPage />
          </AppLayout>
        } />
      </Routes>
    </AnimatePresence>
  );
};

export default function App() {
  return (
    <Router>
      <Suspense fallback={<LoadingScreen />}>
        <AnimatedRoutes />
      </Suspense>
    </Router>
  );
}
