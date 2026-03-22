'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { healthApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { useAuth } from '@/hooks/use-auth';
import Header from '@/components/header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Activity,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Sparkles,
  ChevronDown,
  ChevronUp,
  RotateCw,
  MapPin,
  Clock,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Symptom {
  id: string;
  name: string;
  severity: number | null;
  duration: string | null;
  bodyPart: string | null;
  notes: string | null;
  analyzed: boolean | null;
  analysisResult: string | null;
  createdAt: string;
}

function severityColor(sev: number | null | undefined) {
  if (sev == null) return 'bg-muted';
  if (sev <= 3) return 'bg-emerald-500';
  if (sev <= 6) return 'bg-amber-500';
  return 'bg-red-500';
}

function severityBorder(sev: number | null | undefined) {
  if (sev == null) return 'border-l-muted-foreground/30';
  if (sev <= 3) return 'border-l-emerald-500';
  if (sev <= 6) return 'border-l-amber-500';
  return 'border-l-red-500';
}

function severityLabel(sev: number | null | undefined) {
  if (sev == null) return 'Not rated';
  if (sev <= 3) return 'Mild';
  if (sev <= 6) return 'Moderate';
  return 'Severe';
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

function SeveritySlider({
  value,
  onChange,
}: {
  value: number;
  onChange: (v: number) => void;
}) {
  const color =
    value <= 3
      ? 'accent-emerald-500'
      : value <= 6
        ? 'accent-amber-500'
        : 'accent-red-500';

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          Severity
        </label>
        <span
          className={`text-sm font-semibold tabular-nums ${
            value <= 3
              ? 'text-emerald-600 dark:text-emerald-400'
              : value <= 6
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-red-600 dark:text-red-400'
          }`}
        >
          {value}/10 &middot; {severityLabel(value)}
        </span>
      </div>
      <input
        type="range"
        min={1}
        max={10}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className={`w-full h-2 rounded-lg cursor-pointer ${color}`}
      />
      <div className="flex justify-between text-[10px] text-muted-foreground px-0.5">
        <span>Mild</span>
        <span>Moderate</span>
        <span>Severe</span>
      </div>
    </div>
  );
}

function SeverityBar({ severity }: { severity: number | null }) {
  if (severity == null) return null;
  const pct = (severity / 10) * 100;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${severityColor(severity)}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-xs font-medium tabular-nums w-8 text-right">{severity}/10</span>
    </div>
  );
}

function AnalysisSection({
  symptom,
  onAnalyze,
}: {
  symptom: Symptom;
  onAnalyze: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    await onAnalyze(symptom.id);
    setAnalyzing(false);
    setExpanded(true);
  };

  if (!symptom.analyzed || !symptom.analysisResult) {
    return (
      <Button
        variant="outline"
        size="sm"
        className="w-full mt-3 text-xs"
        onClick={handleAnalyze}
        disabled={analyzing}
      >
        {analyzing ? (
          <>
            <Loader2 className="h-3 w-3 mr-1.5 animate-spin" />
            Analyzing...
          </>
        ) : (
          <>
            <Sparkles className="h-3 w-3 mr-1.5" />
            AI Analysis
          </>
        )}
      </Button>
    );
  }

  return (
    <div className="mt-3 space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs font-medium text-primary hover:underline w-full"
      >
        <Sparkles className="h-3 w-3" />
        AI Analysis
        {expanded ? <ChevronUp className="h-3 w-3 ml-auto" /> : <ChevronDown className="h-3 w-3 ml-auto" />}
      </button>

      {expanded && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-sm">
          <ReactMarkdown
            remarkPlugins={[remarkGfm]}
            components={{
              h3: ({ children }) => (
                <h3 className="text-xs font-semibold mt-3 first:mt-0 mb-1">{children}</h3>
              ),
              p: ({ children }) => <p className="text-xs mb-1.5 leading-relaxed">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc list-inside text-xs space-y-0.5 mb-1.5">{children}</ul>
              ),
              ol: ({ children }) => (
                <ol className="list-decimal list-inside text-xs space-y-0.5 mb-1.5">{children}</ol>
              ),
              li: ({ children }) => <li className="text-xs">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
            }}
          >
            {symptom.analysisResult}
          </ReactMarkdown>
          <div className="pt-2 border-t border-primary/10 mt-2">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 text-[10px] px-2"
              onClick={handleAnalyze}
              disabled={analyzing}
            >
              {analyzing ? (
                <Loader2 className="h-2.5 w-2.5 mr-1 animate-spin" />
              ) : (
                <RotateCw className="h-2.5 w-2.5 mr-1" />
              )}
              Re-analyze
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SymptomsPage() {
  const { isLoading: authLoading } = useAuth();
  const [items, setItems] = useState<Symptom[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [severity, setSeverity] = useState(5);
  const [duration, setDuration] = useState('');
  const [bodyPart, setBodyPart] = useState('');
  const [notes, setNotes] = useState('');

  const loadSymptoms = useCallback(async () => {
    setError('');
    try {
      const res = await healthApi.getSymptoms();
      const list = res.data?.data;
      setItems(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load symptoms'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    loadSymptoms();
  }, [authLoading, loadSymptoms]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setSeverity(5);
    setDuration('');
    setBodyPart('');
    setNotes('');
    setFormError('');
  }

  function openCreate() {
    resetForm();
    setOpen(true);
  }

  function openEdit(s: Symptom) {
    setEditingId(s.id);
    setName(s.name);
    setSeverity(s.severity ?? 5);
    setDuration(s.duration ?? '');
    setBodyPart(s.bodyPart ?? '');
    setNotes(s.notes ?? '');
    setFormError('');
    setOpen(true);
  }

  function handleOpenChange(next: boolean) {
    if (!next && submitting) return;
    setOpen(next);
    if (!next) resetForm();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Name is required');
      return;
    }

    const payload = {
      name: trimmed,
      severity,
      duration: duration.trim() || undefined,
      bodyPart: bodyPart.trim() || undefined,
      notes: notes.trim() || undefined,
    };

    setFormError('');
    setSubmitting(true);
    try {
      if (editingId) {
        await healthApi.updateSymptom(editingId, payload);
        toast.success('Symptom updated');
      } else {
        await healthApi.createSymptom(payload);
        toast.success('Symptom logged');
      }
      setOpen(false);
      resetForm();
      await loadSymptoms();
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Could not save symptom');
      setFormError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await healthApi.deleteSymptom(id);
      setItems((prev) => prev.filter((s) => s.id !== id));
      toast.success('Symptom deleted');
    } catch (err: unknown) {
      const msg = getErrorMessage(err, 'Could not delete');
      setError(msg);
      toast.error(msg);
    } finally {
      setDeletingId(null);
    }
  }

  async function handleAnalyze(id: string) {
    try {
      const res = await healthApi.analyzeSymptom(id);
      const updated = res.data?.data;
      if (updated) {
        setItems((prev) => prev.map((s) => (s.id === id ? { ...s, ...updated } : s)));
      }
      toast.success('Analysis complete');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Analysis failed'));
    }
  }

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

  if (error && items.length === 0) {
    return (
      <div className="flex flex-col h-screen">
        <Header />
        <div className="flex-1 flex items-center justify-center p-6">
          <Card className="max-w-md w-full text-center">
            <CardContent className="pt-6">
              <p className="text-destructive mb-4">{error}</p>
              <Button
                onClick={() => {
                  setLoading(true);
                  loadSymptoms();
                }}
              >
                Retry
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <Header />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-2">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-950">
                  <Activity className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </div>
                Symptoms
              </h1>
              <p className="text-muted-foreground text-sm mt-1">
                Log and review what you&apos;re experiencing
              </p>
            </div>
            <Button onClick={openCreate} className="shrink-0">
              <Plus className="h-4 w-4 mr-2" />
              Log symptom
            </Button>
          </div>

          {error ? (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          {items.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <Activity className="h-10 w-10 mx-auto mb-3 opacity-40 text-muted-foreground" />
                <p className="font-medium mb-1">No symptoms logged yet</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Add your first entry to start tracking.
                </p>
                <Button variant="outline" onClick={openCreate}>
                  <Plus className="h-4 w-4 mr-2" />
                  Log symptom
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {items.map((s) => (
                <Card
                  key={s.id}
                  className={`border-l-4 ${severityBorder(s.severity)} py-4 gap-0`}
                >
                  <CardContent className="px-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <h2 className="font-semibold text-base truncate">{s.name}</h2>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${
                              s.severity == null
                                ? 'bg-muted text-muted-foreground'
                                : s.severity <= 3
                                  ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : s.severity <= 6
                                    ? 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                                    : 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
                            }`}
                          >
                            {severityLabel(s.severity)}
                          </span>
                        </div>

                        <SeverityBar severity={s.severity} />

                        <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {s.bodyPart && (
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {s.bodyPart}
                            </span>
                          )}
                          {s.duration && (
                            <span className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {s.duration}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            {relativeTime(s.createdAt)}
                          </span>
                        </div>

                        {s.notes && (
                          <p className="mt-2 text-sm text-foreground/80 line-clamp-2">{s.notes}</p>
                        )}
                      </div>

                      <div className="flex shrink-0 gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          onClick={() => openEdit(s)}
                          aria-label={`Edit ${s.name}`}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          disabled={deletingId === s.id}
                          onClick={() => handleDelete(s.id)}
                          aria-label={`Delete ${s.name}`}
                        >
                          {deletingId === s.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </Button>
                      </div>
                    </div>

                    <AnalysisSection symptom={s} onAnalyze={handleAnalyze} />
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit symptom' : 'Log symptom'}</DialogTitle>
            <DialogDescription>
              {editingId
                ? 'Update the details of this symptom entry.'
                : 'Record what you are experiencing to track it over time.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {formError ? <p className="text-sm text-destructive">{formError}</p> : null}
            <div className="space-y-2">
              <label htmlFor="symptom-name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="symptom-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Headache, Sore throat, Nausea"
                required
                autoFocus
              />
            </div>

            <SeveritySlider value={severity} onChange={setSeverity} />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="symptom-duration" className="text-sm font-medium">
                  Duration
                </label>
                <Input
                  id="symptom-duration"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="e.g. 2 hours"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="symptom-body" className="text-sm font-medium">
                  Body part
                </label>
                <Input
                  id="symptom-body"
                  value={bodyPart}
                  onChange={(e) => setBodyPart(e.target.value)}
                  placeholder="e.g. Lower back"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="symptom-notes" className="text-sm font-medium">
                Notes
              </label>
              <Textarea
                id="symptom-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Additional details about what you're experiencing"
                rows={3}
                className="resize-y min-h-[80px]"
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleOpenChange(false)}
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
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
