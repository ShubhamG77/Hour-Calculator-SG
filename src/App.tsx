import React, { Suspense, lazy, useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Menu, 
  Sun, 
  Moon, 
  RefreshCw,
  Sparkles,
  Check
} from 'lucide-react';
import { useHoursTracker } from './hooks/useHoursTracker';
import { Sidebar } from './components/Sidebar';
import { BottomNav } from './components/BottomNav';

// Pages
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((module) => ({ default: module.DashboardPage })));
const CalendarPage = lazy(() => import('./pages/CalendarPage').then((module) => ({ default: module.CalendarPage })));
const HistoryPage = lazy(() => import('./pages/HistoryPage').then((module) => ({ default: module.HistoryPage })));
const AnalyticsPage = lazy(() => import('./pages/AnalyticsPage').then((module) => ({ default: module.AnalyticsPage })));
const PlannerPage = lazy(() => import('./pages/PlannerPage').then((module) => ({ default: module.PlannerPage })));
const SimulatorPage = lazy(() => import('./pages/SimulatorPage').then((module) => ({ default: module.SimulatorPage })));
const SettingsPage = lazy(() => import('./pages/SettingsPage').then((module) => ({ default: module.SettingsPage })));

const PageLoader = () => (
  <div className="flex min-h-[220px] items-center justify-center rounded-2xl border border-white/10 bg-white/5 p-6 text-sm font-medium text-slate-400">
    Loading page...
  </div>
);

export default function App() {
  const {
    activeTab,
    setActiveTab,
    selectedDate,
    setSelectedDate,
    logs,
    settings,
    simulatedLeaves,
    setSimulatedLeaves,
    updateLog,
    deleteLog,
    clearAllData,
    loadMockData,
    applyPastedHours,
    updateSettings,
    stats,
  } = useHoursTracker();

  // Pull-to-refresh Mobile Handler
  const [pullProgress, setPullProgress] = useState(0); // 0 to 100
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshCompleted, setRefreshCompleted] = useState(false);
  const touchStartRef = useRef<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (containerRef.current && containerRef.current.scrollTop === 0 && !isRefreshing) {
      touchStartRef.current = e.touches[0].clientY;
      setRefreshCompleted(false);
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartRef.current === null || isRefreshing) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartRef.current;

    if (deltaY > 0) {
      // Pull down
      const progress = Math.min((deltaY / 120) * 100, 100);
      setPullProgress(progress);
      
      // Prevent browser default bounce/scroll
      if (progress > 5 && e.cancelable) {
        e.preventDefault();
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchStartRef.current === null || isRefreshing) return;
    
    if (pullProgress >= 85) {
      // Trigger refresh
      setIsRefreshing(true);
      setPullProgress(100);
      
      // Simulate refreshing data
      setTimeout(() => {
        setIsRefreshing(false);
        setPullProgress(0);
        setRefreshCompleted(true);
        // Toast style check
        setTimeout(() => setRefreshCompleted(false), 2000);
      }, 1200);
    } else {
      // Cancel
      setPullProgress(0);
    }
    touchStartRef.current = null;
  };

  const renderActivePage = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <Suspense fallback={<PageLoader />}>
            <div className="space-y-8">
              <DashboardPage
                stats={stats}
                settings={settings}
                setActiveTab={setActiveTab}
                applyPastedHours={applyPastedHours}
              />

              <section className="space-y-3">
                <div className="px-1">
                  <h3 className="text-base md:text-lg font-extrabold text-white tracking-tight">
                    Recovery Planner
                  </h3>
                  <p className="text-xs text-slate-400 font-medium">
                    Plan recovery options without leaving Dashboard.
                  </p>
                </div>
                <PlannerPage stats={stats} />
              </section>
            </div>
          </Suspense>
        );
      case 'calendar':
        return (
          <Suspense fallback={<PageLoader />}>
            <CalendarPage 
              logs={logs} 
              selectedDate={selectedDate} 
              setSelectedDate={setSelectedDate}
              updateLog={updateLog}
              deleteLog={deleteLog}
            />
          </Suspense>
        );
      case 'history':
        return (
          <Suspense fallback={<PageLoader />}>
            <HistoryPage 
              logs={logs} 
              updateLog={updateLog} 
              deleteLog={deleteLog}
              selectedDate={selectedDate}
            />
          </Suspense>
        );
      case 'analytics':
        return (
          <Suspense fallback={<PageLoader />}>
            <AnalyticsPage logs={logs} stats={stats} selectedDate={selectedDate} />
          </Suspense>
        );
      case 'planner':
        return (
          <Suspense fallback={<PageLoader />}>
            <PlannerPage stats={stats} />
          </Suspense>
        );
      case 'simulator':
        return (
          <Suspense fallback={<PageLoader />}>
            <SimulatorPage stats={stats} setSimulatedLeaves={setSimulatedLeaves} />
          </Suspense>
        );
      case 'settings':
        return (
          <Suspense fallback={<PageLoader />}>
            <SettingsPage 
              settings={settings} 
              updateSettings={updateSettings} 
              clearAllData={clearAllData}
              loadMockData={loadMockData}
            />
          </Suspense>
        );
      default:
        return (
          <Suspense fallback={<PageLoader />}>
            <DashboardPage stats={stats} settings={settings} setActiveTab={setActiveTab} applyPastedHours={applyPastedHours} />
          </Suspense>
        );
    }
  };

  const getPageTitle = () => {
    const titleMap: Record<string, string> = {
      dashboard: 'Dashboard',
      calendar: 'Calendar Logs',
      history: 'Attendance History',
      analytics: 'Analytics Trends',
      planner: 'Recovery Planner',
      simulator: 'Leave Simulator',
      settings: 'App Settings'
    };
    return titleMap[activeTab] || 'Hours Tracker';
  };

  const toggleTheme = () => {
    updateSettings({ theme: settings.theme === 'dark' ? 'light' : 'dark' });
  };

  const displayName = settings.userName || 'buddy';
  const profileInitial = displayName.charAt(0).toUpperCase();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans flex transition-colors duration-300 dark:bg-slate-950 light:bg-slate-50 light:text-slate-800">
      
      {/* Background Gradients for Glassmorphism Context */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full bg-emerald-500/10 blur-[120px] dark:bg-emerald-500/5 light:bg-emerald-500/10" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full bg-teal-500/10 blur-[130px] dark:bg-teal-500/5 light:bg-teal-500/10" />
        <div className="absolute top-[30%] right-[10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[110px] dark:bg-blue-500/5 light:bg-blue-500/5" />
      </div>

      {/* Desktop Sidebar Navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        settings={settings} 
        updateSettings={updateSettings} 
      />

      {/* Main Panel container */}
      <div 
        ref={containerRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className="flex-1 md:ml-72 flex flex-col min-h-screen overflow-y-auto"
      >
        {/* Mobile Header Bar */}
        <header className="md:hidden flex items-center justify-between px-6 py-4 bg-slate-900/60 dark:bg-slate-950/60 backdrop-blur-md border-b border-white/10 dark:border-white/5 sticky top-0 z-30">
          <div>
            <h1 className="text-lg font-black bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
              {displayName} Work
            </h1>
            <p className="text-[9px] uppercase tracking-wider text-slate-400 font-bold -mt-0.5">
              Hours Tracker
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl bg-white/5 border border-white/10 dark:border-white/5 text-slate-300 hover:bg-white/10 transition-colors"
            >
              {settings.theme === 'dark' ? (
                <Moon className="w-4.5 h-4.5 text-indigo-400" />
              ) : (
                <Sun className="w-4.5 h-4.5 text-amber-400" />
              )}
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-bold text-white shadow shadow-emerald-500/20 text-sm">
              {profileInitial}
            </div>
          </div>
        </header>

        {/* Pull to refresh Indicator */}
        <div 
          className="overflow-hidden transition-all duration-200 flex justify-center items-center"
          style={{ height: isRefreshing ? '50px' : pullProgress > 0 ? `${pullProgress / 2}px` : '0px' }}
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400">
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} style={{ transform: `rotate(${pullProgress * 3.6}deg)` }} />
            <span>{isRefreshing ? 'Syncing attendance...' : pullProgress >= 85 ? 'Release to refresh' : 'Pull to refresh'}</span>
          </div>
        </div>

        {/* Refresh Completed Toast */}
        <AnimatePresence>
          {refreshCompleted && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-16 md:top-6 left-1/2 transform -translate-x-1/2 z-50 bg-emerald-500 text-slate-950 font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2 text-xs"
            >
              <Check className="w-4 h-4 stroke-[3]" />
              <span>Attendance Synced Successfully!</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Page Main Content Area */}
        <main className="flex-1 px-4 py-6 md:p-8 max-w-5xl w-full mx-auto pb-24 md:pb-8">
          {/* Section Breadcrumb on Desktop */}
          <div className="hidden md:flex justify-between items-center mb-6">
            <div>
              <h2 className="text-xl font-extrabold text-white tracking-tight">
                {getPageTitle()}
              </h2>
              <p className="text-xs text-slate-400 font-medium">
                Workspace / {getPageTitle()}
              </p>
            </div>
            
            {/* Show Seed Button on Dashboard if empty */}
            {activeTab === 'dashboard' && Object.keys(logs).length === 0 && (
              <motion.button
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={loadMockData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-400 text-slate-950 text-xs font-bold shadow hover:brightness-110 transition-all border border-emerald-300/30"
              >
                <Sparkles className="w-3.5 h-3.5" /> Seed Sample Logs
              </motion.button>
            )}
          </div>

          <AnimatePresence initial={false} mode="sync">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="w-full"
            >
              {renderActivePage()}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Sticky Mobile Bottom Navigation */}
        <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
}
