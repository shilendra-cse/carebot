'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type FormEvent,
} from 'react';
import { toast } from 'sonner';
import Header from '@/components/header';
import { healthApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Heart,
  Plus,
  Trash2,
  Pencil,
  TrendingUp,
  Loader2,
  Brain,
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

interface MoodLog {
  id: string;
  moodScore: number;
  anxietyLevel: number | null;
  journalEntry: string | null;
  triggers: string[] | null;
  createdAt: string;
}

interface TrendDay {
  date: string;
  avgMood: string | null;
  avgAnxiety: string | null;
  count: string;
}

const QUICK_MOODS = [
  { score: 1, emoji: '😩', label: 'Awful' },
  { score: 3, emoji: '😢', label: 'Bad' },
  { score: 5, emoji: '😐', label: 'Okay' },
  { score: 7, emoji: '🙂', label: 'Good' },
  { score: 9, emoji: '😄', label: 'Great' },
  { score: 10, emoji: '🤩', label: 'Amazing' },
];

const PERIOD_OPTIONS = [
  { value: 7, label: '7d' },
  { value: 14, label: '14d' },
  { value: 30, label: '30d' },
];

function moodColor(score: number | null) {
  if (score == null) return 'bg-muted';
  if (score <= 3) return 'bg-red-500';
  if (score <= 6) return 'bg-amber-500';
  return 'bg-emerald-500';
}

function moodBorder(score: number | null) {
  if (score == null) return 'border-l-muted-foreground/30';
  if (score <= 3) return 'border-l-red-500';
  if (score <= 6) return 'border-l-amber-500';
  return 'border-l-emerald-500';
}

function moodLabel(score: number | null) {
  if (score == null) return 'Not rated';
  if (score <= 2) return 'Very Low';
  if (score <= 4) return 'Low';
  if (score <= 6) return 'Neutral';
  if (score <= 8) return 'Good';
  return 'Excellent';
}

function moodEmoji(score: number | null) {
  if (score == null) return '😶';
  if (score <= 2) return '😩';
  if (score <= 4) return '😢';
  if (score <= 6) return '😐';
  if (score <= 8) return '🙂';
  return '😄';
}

function anxietyLabel(level: number | null) {
  if (level == null) return 'Not rated';
  if (level <= 3) return 'Calm';
  if (level <= 6) return 'Moderate';
  return 'High';
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

function MoodSlider({
  value,
  onChange,
  label,
  id,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  id: string;
}) {
  const isMood = id === 'mood-score';
  const color = isMood
    ? value <= 3
      ? 'accent-red-500'
      : value <= 6
        ? 'accent-amber-500'
        : 'accent-emerald-500'
    : value <= 3
      ? 'accent-emerald-500'
      : value <= 6
        ? 'accent-amber-500'
        : 'accent-red-500';

  const textColor = isMood
    ? value <= 3
      ? 'text-red-600 dark:text-red-400'
      : value <= 6
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-emerald-600 dark:text-emerald-400'
    : value <= 3
      ? 'text-emerald-600 dark:text-emerald-400'
      : value <= 6
        ? 'text-amber-600 dark:text-amber-400'
        : 'text-red-600 dark:text-red-400';

  const displayLabel = isMood ? moodLabel(value) : anxietyLabel(value);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium" htmlFor={id}>
          {label}
        </label>
        <span className={`text-sm font-semibold tabular-nums ${textColor}`}>
          {value}/10 &middot; {displayLabel}
        </span>
      </div>
      <input
        id={id}
        type="range"
        min={1}
        max={10}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`h-2 w-full cursor-pointer rounded-lg ${color}`}
      />
      {isMood ? (
        <div className="flex justify-between px-0.5 text-[10px] text-muted-foreground">
          <span>Low</span>
          <span>Neutral</span>
          <span>Great</span>
        </div>
      ) : (
        <div className="flex justify-between px-0.5 text-[10px] text-muted-foreground">
          <span>Calm</span>
          <span>Moderate</span>
          <span>High</span>
        </div>
      )}
    </div>
  );
}

function MoodBar({ score }: { score: number | null }) {
  if (score == null) return null;
  const pct = (score / 10) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
        <div
          className={`h-full rounded-full transition-all ${moodColor(score)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="w-8 text-right text-xs font-medium tabular-nums">
        {score}/10
      </span>
    </div>
  );
}

export default function MoodPage() {
  const { isLoading: authLoading } = useAuth();
  const [logs, setLogs] = useState<MoodLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [quickLogging, setQuickLogging] = useState<number | null>(null);

  const [moodScore, setMoodScore] = useState(5);
  const [anxietyLevel, setAnxietyLevel] = useState(5);
  const [journalEntry, setJournalEntry] = useState('');
  const [triggersRaw, setTriggersRaw] = useState('');

  const [trends, setTrends] = useState<TrendDay[]>([]);
  const [trendPeriod, setTrendPeriod] = useState(7);
  const [trendsLoading, setTrendsLoading] = useState(true);

  const loadLogs = useCallback(async () => {
    setError('');
    try {
      const res = await healthApi.getMoodLogs();
      const list = res.data?.data;
      setLogs(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Could not load mood logs'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTrends = useCallback(async (days: number) => {
    setTrendsLoading(true);
    try {
      const res = await healthApi.getMoodTrends(days);
      const data = res.data?.data;
      setTrends(Array.isArray(data?.dailyTrends) ? data.dailyTrends : []);
    } catch {
      // trends are supplementary
    } finally {
      setTrendsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    loadLogs();
    loadTrends(trendPeriod);
  }, [authLoading, loadLogs, loadTrends, trendPeriod]);

  const avgMoodWeek = useMemo(() => {
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const recent = logs.filter(
      (l) => new Date(l.createdAt).getTime() >= cutoff
    );
    if (!recent.length) return null;
    const sum = recent.reduce((a, l) => a + (l.moodScore ?? 0), 0);
    return Math.round((sum / recent.length) * 10) / 10;
  }, [logs]);

  const chartData = useMemo(() => {
    return trends.map((t) => ({
      date: new Date(t.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric',
      }),
      mood: t.avgMood ? parseFloat(parseFloat(t.avgMood).toFixed(1)) : null,
      anxiety: t.avgAnxiety
        ? parseFloat(parseFloat(t.avgAnxiety).toFixed(1))
        : null,
    }));
  }, [trends]);

  function resetFormFields() {
    setMoodScore(5);
    setAnxietyLevel(5);
    setJournalEntry('');
    setTriggersRaw('');
    setFormError('');
    setEditingId(null);
  }

  function closeDialog() {
    if (submitting) return;
    setDialogOpen(false);
    resetFormFields();
  }

  function openCreate() {
    resetFormFields();
    setDialogOpen(true);
  }

  function openEdit(log: MoodLog) {
    setEditingId(log.id);
    setMoodScore(log.moodScore);
    setAnxietyLevel(log.anxietyLevel ?? 5);
    setJournalEntry(log.journalEntry ?? '');
    setTriggersRaw((log.triggers ?? []).join(', '));
    setFormError('');
    setDialogOpen(true);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (moodScore < 1 || moodScore > 10) {
      setFormError('Mood score must be between 1 and 10.');
      return;
    }
    setFormError('');
    setSubmitting(true);
    const triggers = triggersRaw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
    const data = {
      moodScore,
      anxietyLevel,
      journalEntry: journalEntry.trim() || undefined,
      triggers,
    };
    try {
      if (editingId) {
        await healthApi.updateMoodLog(editingId, data);
        toast.success('Mood log updated');
      } else {
        await healthApi.createMoodLog(data);
        toast.success('Mood log saved');
      }
      setDialogOpen(false);
      resetFormFields();
      await Promise.all([loadLogs(), loadTrends(trendPeriod)]);
    } catch (err: unknown) {
      setFormError(getErrorMessage(err, 'Could not save mood log'));
      toast.error(getErrorMessage(err, 'Could not save mood log'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await healthApi.deleteMoodLog(id);
      setLogs((prev) => prev.filter((l) => l.id !== id));
      toast.success('Mood log deleted');
      loadTrends(trendPeriod);
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Could not delete that entry.');
      setError(msg);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleQuickLog(score: number) {
    setQuickLogging(score);
    try {
      await healthApi.createMoodLog({ moodScore: score });
      toast.success(`Mood logged: ${score}/10`);
      await Promise.all([loadLogs(), loadTrends(trendPeriod)]);
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not log mood'));
    } finally {
      setQuickLogging(null);
    }
  }

  if (authLoading || loading) {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950">
                  <Heart className="h-5 w-5 text-rose-600 dark:text-rose-400" />
                </div>
                Mood Journal
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track how you feel and what might influence it.
              </p>
            </div>
            <Button onClick={openCreate} className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Log mood
            </Button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
              <Button
                variant="outline"
                size="sm"
                className="ml-3"
                onClick={() => {
                  setLoading(true);
                  loadLogs();
                }}
              >
                Retry
              </Button>
            </div>
          )}

          {/* Quick mood log */}
          <Card className="mb-6 gap-0 py-4">
            <CardContent className="px-5">
              <p className="mb-3 text-sm font-medium text-muted-foreground">
                How are you feeling right now?
              </p>
              <div className="flex flex-wrap gap-2">
                {QUICK_MOODS.map((qm) => (
                  <button
                    key={qm.score}
                    onClick={() => handleQuickLog(qm.score)}
                    disabled={quickLogging !== null}
                    className="flex flex-col items-center gap-1 rounded-xl border bg-card px-3 py-2.5 transition-all hover:scale-105 hover:shadow-md disabled:opacity-50"
                  >
                    {quickLogging === qm.score ? (
                      <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
                    ) : (
                      <span className="text-2xl leading-none">{qm.emoji}</span>
                    )}
                    <span className="text-[10px] font-medium text-muted-foreground">
                      {qm.label}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Stats row */}
          <div className="mb-6 grid gap-4 sm:grid-cols-2">
            {/* Weekly average */}
            <Card className="gap-0 py-4">
              <CardContent className="flex items-center gap-3 px-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <TrendingUp className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Avg mood (7 days)
                  </p>
                  <p className="text-xl font-semibold">
                    {avgMoodWeek != null ? (
                      <>
                        {avgMoodWeek}/10{' '}
                        <span className="text-sm font-normal">
                          {moodEmoji(Math.round(avgMoodWeek))}
                        </span>
                      </>
                    ) : (
                      <span className="text-sm font-normal text-muted-foreground">
                        No data yet
                      </span>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Entry count */}
            <Card className="gap-0 py-4">
              <CardContent className="flex items-center gap-3 px-5">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-100 dark:bg-violet-950">
                  <Brain className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    Total entries
                  </p>
                  <p className="text-xl font-semibold">
                    {logs.length}
                    <span className="ml-1.5 text-sm font-normal text-muted-foreground">
                      mood logs
                    </span>
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Trend chart */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Mood &amp; Anxiety Trends
                <div className="ml-auto flex gap-1">
                  {PERIOD_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      onClick={() => setTrendPeriod(p.value)}
                      className={`rounded-md px-2 py-0.5 text-xs font-medium transition-colors ${
                        trendPeriod === p.value
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted'
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {trendsLoading ? (
                <div className="flex h-[200px] items-center justify-center">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient
                        id="moodGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--chart-1))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--chart-1))"
                          stopOpacity={0}
                        />
                      </linearGradient>
                      <linearGradient
                        id="anxietyGrad"
                        x1="0"
                        y1="0"
                        x2="0"
                        y2="1"
                      >
                        <stop
                          offset="5%"
                          stopColor="hsl(var(--chart-2))"
                          stopOpacity={0.3}
                        />
                        <stop
                          offset="95%"
                          stopColor="hsl(var(--chart-2))"
                          stopOpacity={0}
                        />
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
                      fill="url(#moodGrad)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: 'hsl(var(--chart-1))' }}
                      name="Mood"
                    />
                    <Area
                      type="monotone"
                      dataKey="anxiety"
                      stroke="hsl(var(--chart-2))"
                      fill="url(#anxietyGrad)"
                      strokeWidth={2}
                      dot={{ r: 3, fill: 'hsl(var(--chart-2))' }}
                      name="Anxiety"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex h-[200px] flex-col items-center justify-center text-muted-foreground">
                  <Heart className="mb-2 h-8 w-8 opacity-40" />
                  <p className="text-sm">No trend data for this period</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Mood log entries */}
          {logs.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent>
                <Heart className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-40" />
                <p className="mb-1 font-medium">No mood logs yet</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Log your first entry or use the quick buttons above.
                </p>
                <Button variant="outline" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Log mood
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {logs.map((log) => {
                const triggers = Array.isArray(log.triggers)
                  ? log.triggers
                  : [];
                return (
                  <Card
                    key={log.id}
                    className={`gap-0 border-l-4 py-4 ${moodBorder(log.moodScore)}`}
                  >
                    <CardContent className="px-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <span className="text-2xl leading-none">
                              {moodEmoji(log.moodScore)}
                            </span>
                            <h2 className="text-base font-semibold">
                              Mood {log.moodScore}/10
                            </h2>
                            <span
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                                log.moodScore <= 3
                                  ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                                  : log.moodScore <= 6
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              }`}
                            >
                              {moodLabel(log.moodScore)}
                            </span>
                          </div>

                          <MoodBar score={log.moodScore} />

                          {log.anxietyLevel != null && (
                            <p className="mt-1.5 text-xs text-muted-foreground">
                              Anxiety:{' '}
                              <span className="font-medium text-foreground">
                                {log.anxietyLevel}/10
                              </span>
                              <span className="ml-1">
                                &middot; {anxietyLabel(log.anxietyLevel)}
                              </span>
                            </p>
                          )}

                          <p className="mt-1.5 text-xs text-muted-foreground">
                            {relativeTime(log.createdAt)}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(log)}
                            aria-label="Edit mood log"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            disabled={deletingId === log.id}
                            onClick={() => handleDelete(log.id)}
                            aria-label="Delete mood log"
                          >
                            {deletingId === log.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {log.journalEntry && (
                        <p className="mt-3 line-clamp-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
                          {log.journalEntry}
                        </p>
                      )}

                      {triggers.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {triggers.map((t) => (
                            <span
                              key={t}
                              className="rounded-full border bg-muted/50 px-2.5 py-0.5 text-xs font-medium text-muted-foreground"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <Dialog
        open={dialogOpen}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit mood log' : 'New mood log'}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update your entry and save changes.'
                : 'Log how you feel and note anything that stood out.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-5">
            {formError && (
              <p className="text-sm font-medium text-destructive">
                {formError}
              </p>
            )}

            <MoodSlider
              id="mood-score"
              label="Mood score"
              value={moodScore}
              onChange={setMoodScore}
            />

            <MoodSlider
              id="anxiety"
              label="Anxiety level"
              value={anxietyLevel}
              onChange={setAnxietyLevel}
            />

            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="journal">
                Journal
              </label>
              <Textarea
                id="journal"
                value={journalEntry}
                onChange={(e) => setJournalEntry(e.target.value)}
                placeholder="How was your day?"
                rows={4}
                className="min-h-[100px] resize-y"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium" htmlFor="triggers">
                Triggers
              </label>
              <Input
                id="triggers"
                value={triggersRaw}
                onChange={(e) => setTriggersRaw(e.target.value)}
                placeholder="work, sleep, weather"
              />
              <p className="text-xs text-muted-foreground">
                Comma-separated list
              </p>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => closeDialog()}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : editingId ? (
                  'Save changes'
                ) : (
                  'Save'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
