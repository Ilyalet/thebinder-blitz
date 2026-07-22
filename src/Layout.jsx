import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Home, FileText, CheckCircle, Bell, Settings, Menu, Tag, Loader2, Calendar, Bot, HelpCircle, BookOpen } from 'lucide-react';
import TodayActivity from '@/components/dashboard/TodayActivity';
import { Document, Task, User } from '@/entities/all';
import { format } from 'date-fns';
import GlobalSearchBar from '@/components/search/GlobalSearchBar';
import DocumentAgent from '@/components/documents/DocumentAgent';
import { cn } from '@/lib/utils';
import { InvokeLLM } from '@/integrations/Core';

// Global cache so multiple mounts of AppLayout don't refetch stats needlessly.
let globalStatsCache = null;
let lastGlobalStatsFetch = 0;
let pendingStatsRequest = null;
const STATS_CACHE_DURATION = 60 * 1000;

const NavItem = ({ href, icon: Icon, children, currentPath }) => {
  const isActive = currentPath === href;
  return (
    <Link
      to={href}
      className={cn(
        'flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors',
        isActive ? 'bg-blue-600 text-white' : 'text-gray-600 hover:bg-gray-100'
      )}
    >
      <Icon className="h-5 w-5 mr-3" />
      <span>{children}</span>
    </Link>
  );
};

const AppLayout = ({ children }) => {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [stats, setStats] = useState({ processedToday: 0, activeTasks: 0 });
  const [showAgentChat, setShowAgentChat] = useState(false);
  const [insight, setInsight] = useState('');

  const fetchStatsData = useCallback(async () => {
    const now = Date.now();

    if (globalStatsCache && now - lastGlobalStatsFetch < STATS_CACHE_DURATION) {
      setStats(globalStatsCache);
      return;
    }

    if (pendingStatsRequest) {
      setStats(await pendingStatsRequest);
      return;
    }

    pendingStatsRequest = (async () => {
      try {
        const [docs, tasks] = await Promise.all([Document.list(), Task.list()]);
        const today = format(new Date(), 'yyyy-MM-dd');
        const processedToday = docs.filter((d) => d.upload_date && format(new Date(d.upload_date), 'yyyy-MM-dd') === today).length;
        const activeTasks = tasks.filter((t) => t.status !== 'done').length;
        const statsData = { processedToday, activeTasks };
        globalStatsCache = statsData;
        lastGlobalStatsFetch = now;
        return statsData;
      } catch (error) {
        console.error('Failed to fetch stats data:', error);
        return globalStatsCache || { processedToday: 0, activeTasks: 0 };
      } finally {
        pendingStatsRequest = null;
      }
    })();

    setStats(await pendingStatsRequest);
  }, []);

  useEffect(() => {
    fetchStatsData();
    const statsInterval = setInterval(fetchStatsData, 180000);
    return () => clearInterval(statsInterval);
  }, [fetchStatsData]);

  // Daily insight for the floating assistant, cached in localStorage per day.
  // Guarded against StrictMode's double-invoked mount effect firing this twice.
  const hasFetchedInsight = useRef(false);
  useEffect(() => {
    if (hasFetchedInsight.current) return;
    hasFetchedInsight.current = true;
    const fetchInsight = async () => {
      try {
        const todayStr = new Date().toISOString().split('T')[0];
        const lastInsight = localStorage.getItem('dailyInsight');
        let insightData = null;
        if (lastInsight) {
          try {
            insightData = JSON.parse(lastInsight);
          } catch {
            // malformed JSON, ignore
          }
        }
        if (insightData && insightData.date === todayStr) {
          setInsight(insightData.text);
          return;
        }

        const docs = await Document.list();
        if (docs.length === 0) {
          setInsight('Start by uploading your first document to unlock powerful insights!');
          return;
        }

        const allText = docs.map((d) => d.extracted_text).filter(Boolean).join('\n\n---\n\n');
        if (allText.length <= 100) {
          setInsight('Upload more documents to get personalized insights!');
          return;
        }

        const result = await InvokeLLM({
          prompt: `Analyze the following combined text from a user's documents (receipts, warranties, bills, etc.). Your goal is to find one single, actionable, or interesting insight.
Examples of good insights:
- "You have two active auto insurance policies. You might want to check for duplicate coverage."
- "Your home appliance warranties for the 'Samsung TV' and 'LG Refrigerator' both expire next month."
- "Your spending on utilities seems to have increased by 20% compared to previous months."
If you can't find a specific, actionable insight, provide a general, encouraging tip about document management.
Keep the response concise (1-2 sentences). Do not use markdown or formatting. Just return the plain text insight.
Document Texts (first 8000 chars):
"""
${allText.substring(0, 8000)}
"""`,
          response_json_schema: { type: 'object', properties: { insight: { type: 'string' } } },
        });

        const newInsight = result.insight || 'Keep your documents organized to stay on top of your life!';
        setInsight(newInsight);
        localStorage.setItem('dailyInsight', JSON.stringify({ date: todayStr, text: newInsight }));
      } catch (error) {
        console.error('Failed to generate insight:', error);
        setInsight('Having trouble generating insights? Our team is on it! In the meantime, keep organizing your documents.');
      }
    };
    fetchInsight();
  }, []);

  const sidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <h1 className="flex items-center gap-2 text-xl font-bold text-gray-900">
          <BookOpen className="h-5 w-5 text-blue-600" />
          The Binder
        </h1>
      </div>
      <nav className="flex-1 space-y-1 p-4">
        <NavItem href={createPageUrl('Dashboard')} icon={Home} currentPath={currentPath}>
          Dashboard
        </NavItem>
        <NavItem href={createPageUrl('Documents')} icon={FileText} currentPath={currentPath}>
          Documents
        </NavItem>
        <NavItem href={createPageUrl('Tasks')} icon={CheckCircle} currentPath={currentPath}>
          Tasks
        </NavItem>
        <NavItem href={createPageUrl('Reminders')} icon={Bell} currentPath={currentPath}>
          Reminders
        </NavItem>
        <NavItem href={createPageUrl('Calendar')} icon={Calendar} currentPath={currentPath}>
          Calendar
        </NavItem>
        <NavItem href={createPageUrl('TagManager')} icon={Tag} currentPath={currentPath}>
          Tag Manager
        </NavItem>
        <NavItem href={createPageUrl('Settings')} icon={Settings} currentPath={currentPath}>
          Settings
        </NavItem>
      </nav>
      <div className="p-4 mt-auto">
        <TodayActivity stats={stats} />
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50 text-gray-900">
      <div className="hidden lg:flex lg:flex-col lg:fixed lg:inset-y-0 lg:left-0 lg:w-64">
        <div className="h-full bg-white border-r border-gray-200">{sidebarContent}</div>
      </div>
      <Sheet open={isSidebarOpen} onOpenChange={setSidebarOpen}>
        <SheetContent side="left" className="w-64 p-0 bg-white">
          {sidebarContent}
        </SheetContent>
      </Sheet>
      <div className="flex flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-10 flex h-16 flex-shrink-0 items-center justify-between border-b border-gray-200 bg-white/75 backdrop-blur-sm px-4 gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-500">
            <Menu className="h-6 w-6" />
          </Button>
          <GlobalSearchBar />
          <div className="flex-1" />
          <Link to={createPageUrl('Help')} title="Help Center">
            <Button variant="ghost" size="icon">
              <HelpCircle className="h-6 w-6 text-gray-600" />
            </Button>
          </Link>
        </header>
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>

      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={() => setShowAgentChat(true)} size="icon" className="rounded-full w-[78px] h-[78px] bg-blue-600 hover:bg-blue-700 shadow-lg">
          <Bot className="h-12! w-12! text-white" />
        </Button>
      </div>

      {showAgentChat && <DocumentAgent onClose={() => setShowAgentChat(false)} dailyInsight={insight} />}
    </div>
  );
};

export default function Layout({ children }) {
  const [loadingUser, setLoadingUser] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // Captured from useLocation() rather than the mutable window.location —
    // StrictMode double-invokes this effect, and reading window.location live
    // would pick up the first invocation's already-navigated URL on the second.
    const from = location.pathname + location.search;

    const fetchUserData = async () => {
      try {
        await User.me();
        setLoadingUser(false);
      } catch (error) {
        // Not authenticated. Base44's no-code platform used to gate this
        // before app code ever ran; as a standalone app, redirectToLogin()
        // sends users to an in-app /login route we own (not a Base44-hosted
        // page) — so route there directly with a from_url to return to.
        navigate(`/login?from_url=${encodeURIComponent(from)}`, { replace: true });
      }
    };
    fetchUserData();
  }, [navigate, location]);

  if (loadingUser) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return <AppLayout>{children}</AppLayout>;
}
