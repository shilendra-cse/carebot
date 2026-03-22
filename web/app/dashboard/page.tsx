'use client';

import { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { healthApi } from '@/lib/api';
import Header from '@/components/header';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Activity,
  Pill,
  Calendar,
  Heart,
  MessageCircle,
  Plus,
  ArrowRight,
  FileText,
  ShieldAlert,
  Clock,
  TrendingUp,
  Loader2,
  Bot,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface DashboardData {
  symptoms: { count: number; recent: any[] };
  medications: { count: number; active: number; list: any[] };
  appointments: { upcoming: any[] };
  mood: { latest: any | null };
  moodTrends: { dailyTrends: any[]; overall: any };
  history: { count: number };
  allergies: { count: number };
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatDate(): string {
  return new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function moodEmoji(score: number): string {
  if (score <= 2) return '😢';
  if (score <= 4) return '🙁';
  if (score <= 6) return '😐';
  if (score <= 8) return '🙂';
  return '😊';
}

function relativeTime(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diff = now - then;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

function EngagementRing({ score }: { score: number }) {
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;
  const color =
    score >= 75 ? 'text-green-500' : score >= 50 ? 'text-yellow-500' : 'text-orange-500';

  return (
    <div className="relative flex items-center justify-center h-20 w-20">
      <svg className="h-20 w-20 -rotate-90" viewBox="0 0 64 64">
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="4"
          className="stroke-muted"
        />
        <circle
          cx="32"
          cy="32"
          r={radius}
          fill="none"
          strokeWidth="4"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={`${color} stroke-current transition-all duration-700`}
        />
      </svg>
      <span className="absolute text-lg font-bold tabular-nums">{score}</span>
    </div>
  );
}

const STAT_CARDS = [
  {
    key: 'symptoms',
    href: '/symptoms',
    label: 'Symptoms',
    icon: Activity,
    iconBg: 'bg-orange-100 dark:bg-orange-950',
    iconColor: 'text-orange-600 dark:text-orange-400',
    border: 'border-l-orange-500',
  },
  {
    key: 'medications',
    href: '/medications',
    label: 'Medications',
    icon: Pill,
    iconBg: 'bg-blue-100 dark:bg-blue-950',
    iconColor: 'text-blue-600 dark:text-blue-400',
    border: 'border-l-blue-500',
  },
  {
    key: 'appointments',
    href: '/appointments',
    label: 'Appointments',
    icon: Calendar,
    iconBg: 'bg-green-100 dark:bg-green-950',
    iconColor: 'text-green-600 dark:text-green-400',
    border: 'border-l-green-500',
  },
  {
    key: 'mood',
    href: '/mood',
    label: 'Mood',
    icon: Heart,
    iconBg: 'bg-pink-100 dark:bg-pink-950',
    iconColor: 'text-pink-600 dark:text-pink-400',
    border: 'border-l-pink-500',
  },
  {
    key: 'history',
    href: '/history',
    label: 'History',
    icon: FileText,
    iconBg: 'bg-violet-100 dark:bg-violet-950',
    iconColor: 'text-violet-600 dark:text-violet-400',
    border: 'border-l-violet-500',
  },
] as const;

interface ActivityItem {
  id: string;
  type: 'symptom' | 'medication' | 'mood' | 'appointment' | 'history';
  label: string;
  detail: string;
  createdAt: string;
}

function buildActivityFeed(data: DashboardData): ActivityItem[] {
  const items: ActivityItem[] = [];

  data.symptoms.recent.forEach((s: any) =>
    items.push({
      id: `s-${s.id}`,
      type: 'symptom',
      label: 'Logged symptom',
      detail: s.name || 'Unknown',
      createdAt: s.createdAt,
    })
  );

  data.medications.list
    .slice(0, 5)
    .forEach((m: any) =>
      items.push({
        id: `m-${m.id}`,
        type: 'medication',
        label: m.active ? 'Active medication' : 'Added medication',
        detail: `${m.name} ${m.dosage}`,
        createdAt: m.createdAt,
      })
    );

  if (data.mood.latest) {
    items.push({
      id: `mood-${data.mood.latest.id}`,
      type: 'mood',
      label: 'Logged mood',
      detail: data.mood.latest.moodScore
        ? `${data.mood.latest.moodScore}/10 ${moodEmoji(data.mood.latest.moodScore)}`
        : 'entry',
      createdAt: data.mood.latest.createdAt,
    });
  }

  data.appointments.upcoming.forEach((a: any) =>
    items.push({
      id: `a-${a.id}`,
      type: 'appointment',
      label: 'Appointment',
      detail: `${a.doctorName} - ${a.specialty || 'General'}`,
      createdAt: a.createdAt,
    })
  );

  items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  return items.slice(0, 8);
}

const ACTIVITY_ICONS: Record<string, { icon: typeof Activity; color: string }> = {
  symptom: { icon: Activity, color: 'text-orange-500' },
  medication: { icon: Pill, color: 'text-blue-500' },
  mood: { icon: Heart, color: 'text-pink-500' },
  appointment: { icon: Calendar, color: 'text-green-500' },
  history: { icon: FileText, color: 'text-violet-500' },
};

export default function DashboardPage() {
  const { user, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchData() {
      try {
        const [symptomsRes, medsRes, apptsRes, moodRes, trendsRes, historyRes, allergiesRes] =
          await Promise.all([
            healthApi.getSymptoms(),
            healthApi.getMedications(),
            healthApi.getUpcomingAppointments(),
            healthApi.getLatestMood(),
            healthApi.getMoodTrends(7),
            healthApi.getHistory(),
            healthApi.getAllergies(),
          ]);

        const symptomsList = symptomsRes.data.data ?? [];
        const medsList = medsRes.data.data ?? [];
        const historyList = historyRes.data.data ?? [];
        const allergiesList = allergiesRes.data.data ?? [];

        setData({
          symptoms: {
            count: symptomsList.length,
            recent: symptomsList.slice(0, 5),
          },
          medications: {
            count: medsList.length,
            active: medsList.filter((m: any) => m.active).length,
            list: medsList,
          },
          appointments: {
            upcoming: apptsRes.data.data?.slice(0, 5) || [],
          },
          mood: {
            latest: moodRes.data.data ?? null,
          },
          moodTrends: trendsRes.data.data ?? { dailyTrends: [], overall: {} },
          history: { count: historyList.length },
          allergies: { count: allergiesList.length },
        });
      } catch (err: any) {
        console.error('Dashboard fetch error:', err);
        setError(err.message || 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const engagementScore = useMemo(() => {
    if (!data) return 0;
    let score = 0;
    if (data.mood.latest) score += 25;
    if (data.medications.active > 0) score += 25;
    if (data.symptoms.count > 0) score += 25;
    if (data.allergies.count > 0) score += 25;
    return score;
  }, [data]);

  const activityFeed = useMemo(() => (data ? buildActivityFeed(data) : []), [data]);

  const chartData = useMemo(() => {
    if (!data?.moodTrends?.dailyTrends?.length) return [];
    return data.moodTrends.dailyTrends.map((t: any) => ({
      date: new Date(t.date).toLocaleDateString('en-US', { weekday: 'short' }),
      mood: Number(Number(t.avgMood).toFixed(1)),
      anxiety: t.avgAnxiety ? Number(Number(t.avgAnxiety).toFixed(1)) : undefined,
    }));
  }, [data]);

  if (authLoading || loading) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={() => window.location.reload()}>Retry</Button>
          </div>
        </div>
      </div>
    );
  }

  const latestScore = data?.mood.latest?.moodScore;
  const hasMoodScore = latestScore != null && !Number.isNaN(Number(latestScore));
  const recentSymptomName = data?.symptoms.recent[0]?.name;

  function getStatValue(key: string) {
    switch (key) {
      case 'symptoms':
        return data?.symptoms.count || 0;
      case 'medications':
        return data?.medications.active || 0;
      case 'appointments':
        return data?.appointments.upcoming.length || 0;
      case 'mood':
        return hasMoodScore ? latestScore : '—';
      case 'history':
        return data?.history.count || 0;
      default:
        return 0;
    }
  }

  function getStatSubtext(key: string) {
    switch (key) {
      case 'symptoms':
        return recentSymptomName ? `Last: ${recentSymptomName}` : 'tracked';
      case 'medications':
        return `${data?.medications.count || 0} total`;
      case 'appointments':
        return 'upcoming';
      case 'mood':
        return hasMoodScore ? `${moodEmoji(Number(latestScore))} latest` : 'no entries';
      case 'history':
        return `${data?.allergies.count || 0} allergies`;
      default:
        return '';
    }
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
          {/* Greeting Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
                {getGreeting()}, {user?.name?.split(' ')[0] || 'there'}
              </h1>
              <p className="text-muted-foreground text-sm mt-1">{formatDate()}</p>
            </div>
            <div className="flex items-center gap-3">
              <EngagementRing score={engagementScore} />
              <div className="text-right">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                  Engagement
                </p>
                <p className="text-sm font-semibold">
                  {engagementScore >= 75
                    ? 'Great'
                    : engagementScore >= 50
                      ? 'Good'
                      : 'Getting started'}
                </p>
              </div>
            </div>
          </div>

          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {STAT_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Link key={card.key} href={card.href}>
                  <Card
                    className={`border-l-4 ${card.border} hover:shadow-md transition-shadow cursor-pointer py-4 gap-3`}
                  >
                    <CardContent className="px-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 items-center justify-center rounded-full ${card.iconBg} flex-shrink-0`}
                        >
                          <Icon className={`h-4 w-4 ${card.iconColor}`} />
                        </div>
                        <div className="min-w-0">
                          <p className="text-2xl font-bold tabular-nums leading-none">
                            {getStatValue(card.key)}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {card.label}
                          </p>
                        </div>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-2 truncate">
                        {getStatSubtext(card.key)}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* Charts + Quick Actions Row */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
            {/* Mood Trends Chart */}
            <Card className="lg:col-span-3">
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Mood Trends
                  <span className="text-xs font-normal text-muted-foreground ml-auto">
                    Last 7 days
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="moodGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--chart-1))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="stroke-border"
                        vertical={false}
                      />
                      <XAxis
                        dataKey="date"
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        domain={[0, 10]}
                        tick={{ fontSize: 11 }}
                        className="fill-muted-foreground"
                        tickLine={false}
                        axisLine={false}
                        width={24}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px',
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="mood"
                        stroke="hsl(var(--chart-1))"
                        fill="url(#moodGradient)"
                        strokeWidth={2}
                        dot={{ r: 3, fill: 'hsl(var(--chart-1))' }}
                        name="Mood"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
                    <Heart className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No mood data yet</p>
                    <Link href="/mood">
                      <Button variant="link" size="sm" className="mt-1">
                        Log your first mood
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions + CareBot */}
            <div className="lg:col-span-2 flex flex-col gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 gap-2">
                  <Link href="/symptoms">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Log Symptom
                    </Button>
                  </Link>
                  <Link href="/medications">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Add Medication
                    </Button>
                  </Link>
                  <Link href="/appointments">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Schedule Visit
                    </Button>
                  </Link>
                  <Link href="/mood">
                    <Button variant="outline" size="sm" className="w-full justify-start text-xs">
                      <Plus className="h-3.5 w-3.5 mr-1.5" />
                      Log Mood
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardContent className="flex flex-col items-center justify-center text-center h-full gap-3 py-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                    <Bot className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Chat with CareBot</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ask about symptoms, get advice, or log health data through conversation
                    </p>
                  </div>
                  <Link href="/chat" className="w-full">
                    <Button className="w-full" size="sm">
                      Start Chatting
                      <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Activity Feed + Upcoming Appointments */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Recent Activity */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activityFeed.length > 0 ? (
                  <div className="space-y-1">
                    {activityFeed.map((item) => {
                      const meta = ACTIVITY_ICONS[item.type] || ACTIVITY_ICONS.history;
                      const Icon = meta.icon;
                      return (
                        <div
                          key={item.id}
                          className="flex items-center gap-3 py-2 border-b last:border-0"
                        >
                          <div
                            className={`flex h-7 w-7 items-center justify-center rounded-full bg-muted flex-shrink-0`}
                          >
                            <Icon className={`h-3.5 w-3.5 ${meta.color}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm truncate">
                              <span className="text-muted-foreground">{item.label}:</span>{' '}
                              <span className="font-medium">{item.detail}</span>
                            </p>
                          </div>
                          <span className="text-[11px] text-muted-foreground flex-shrink-0">
                            {relativeTime(item.createdAt)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Clock className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No recent activity</p>
                    <p className="text-xs mt-1">Start by logging a symptom or mood</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Upcoming Appointments */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  Upcoming Appointments
                </CardTitle>
              </CardHeader>
              <CardContent>
                {data?.appointments.upcoming.length ? (
                  <div className="space-y-3">
                    {data.appointments.upcoming.map((appt: any) => {
                      const d = new Date(appt.date);
                      return (
                        <div
                          key={appt.id}
                          className="flex items-center gap-3 p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex flex-col items-center justify-center h-12 w-12 rounded-lg bg-green-100 dark:bg-green-950 flex-shrink-0">
                            <span className="text-lg font-bold leading-none text-green-700 dark:text-green-300">
                              {d.getDate()}
                            </span>
                            <span className="text-[10px] uppercase text-green-600 dark:text-green-400">
                              {d.toLocaleDateString('en-US', { month: 'short' })}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">{appt.doctorName}</p>
                            <p className="text-xs text-muted-foreground truncate">
                              {appt.specialty || 'General'}
                              {appt.reason ? ` — ${appt.reason}` : ''}
                            </p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <span
                              className={`inline-block text-[10px] font-medium px-2 py-0.5 rounded-full ${
                                appt.status === 'completed'
                                  ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                                  : appt.status === 'cancelled'
                                    ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                    : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              }`}
                            >
                              {appt.status || 'scheduled'}
                            </span>
                            {appt.time && (
                              <p className="text-[11px] text-muted-foreground mt-1">{appt.time}</p>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <Calendar className="h-8 w-8 mb-2 opacity-40" />
                    <p className="text-sm">No upcoming appointments</p>
                    <Link href="/appointments">
                      <Button variant="link" size="sm" className="mt-1">
                        Schedule one
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
