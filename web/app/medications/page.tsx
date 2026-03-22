'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import Header from '@/components/header';
import { healthApi } from '@/lib/api';
import { getErrorMessage } from '@/lib/error';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Pill,
  Plus,
  Trash2,
  Pencil,
  Check,
  Clock,
  CalendarDays,
  Loader2,
  Power,
  X,
  CheckCircle2,
  SkipForward,
} from 'lucide-react';

interface Medication {
  id: string;
  name: string;
  dosage: string;
  frequency: string;
  times: string[] | null;
  startDate: string | Date | null;
  endDate: string | Date | null;
  active: boolean;
  notes: string | null;
  createdAt: string | Date;
}

interface TodayData {
  takenCount: number;
  skippedCount: number;
}

function relativeTime(dateStr: string | Date): string {
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

function formatDate(value: string | Date | null | undefined) {
  if (value == null) return null;
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function toDateInputValue(value: string | Date | null | undefined): string {
  if (value == null) return '';
  const d = typeof value === 'string' ? new Date(value) : value;
  if (Number.isNaN(d.getTime())) return '';
  return d.toISOString().split('T')[0];
}

function formatTimeDisplay(time24: string): string {
  const parts = time24.split(':');
  if (parts.length < 2) return time24;
  const h = parseInt(parts[0], 10);
  if (Number.isNaN(h)) return time24;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12}:${parts[1]} ${ampm}`;
}

export default function MedicationsPage() {
  const { isLoading: authLoading } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [todayMap, setTodayMap] = useState<Record<string, TodayData>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [frequency, setFrequency] = useState('');
  const [notes, setNotes] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [times, setTimes] = useState<string[]>([]);
  const [formActive, setFormActive] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [loggingDose, setLoggingDose] = useState<string | null>(null);

  const loadMedications = useCallback(async () => {
    setError('');
    try {
      const res = await healthApi.getMedications();
      const list = res.data?.data;
      setMedications(Array.isArray(list) ? list : []);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to load medications'));
    } finally {
      setLoading(false);
    }
  }, []);

  const loadTodayData = useCallback(async () => {
    try {
      const res = await healthApi.getTodayMedications();
      const list = res.data?.data;
      if (Array.isArray(list)) {
        const map: Record<string, TodayData> = {};
        for (const item of list) {
          map[item.id] = {
            takenCount: item.takenCount ?? 0,
            skippedCount: item.skippedCount ?? 0,
          };
        }
        setTodayMap(map);
      }
    } catch {
      // dose tracking is supplementary — don't block the page
    }
  }, []);

  useEffect(() => {
    if (authLoading) return;
    loadMedications();
    loadTodayData();
  }, [authLoading, loadMedications, loadTodayData]);

  function resetForm() {
    setEditingId(null);
    setName('');
    setDosage('');
    setFrequency('');
    setNotes('');
    setStartDate('');
    setEndDate('');
    setTimes([]);
    setFormActive(true);
    setSubmitError('');
  }

  function openCreate() {
    resetForm();
    setDialogOpen(true);
  }

  function openEdit(med: Medication) {
    setEditingId(med.id);
    setName(med.name);
    setDosage(med.dosage);
    setFrequency(med.frequency);
    setNotes(med.notes ?? '');
    setStartDate(toDateInputValue(med.startDate));
    setEndDate(toDateInputValue(med.endDate));
    setTimes(Array.isArray(med.times) ? [...med.times] : []);
    setFormActive(med.active);
    setSubmitError('');
    setDialogOpen(true);
  }

  function handleDialogOpenChange(open: boolean) {
    if (!open) {
      if (submitting) return;
      setDialogOpen(false);
      resetForm();
    } else {
      setDialogOpen(true);
    }
  }

  function addTime() {
    setTimes((prev) => [...prev, '08:00']);
  }

  function removeTime(idx: number) {
    setTimes((prev) => prev.filter((_, i) => i !== idx));
  }

  function updateTime(idx: number, value: string) {
    setTimes((prev) => prev.map((t, i) => (i === idx ? value : t)));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitError('');
    if (!name.trim() || !dosage.trim() || !frequency.trim()) {
      setSubmitError('Name, dosage, and frequency are required.');
      return;
    }
    setSubmitting(true);
    const payload: Record<string, unknown> = {
      name: name.trim(),
      dosage: dosage.trim(),
      frequency: frequency.trim(),
      notes: notes.trim() || undefined,
      times: times.length > 0 ? times : [],
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    };
    if (editingId) {
      payload.active = formActive;
    }
    try {
      if (editingId) {
        await healthApi.updateMedication(editingId, payload);
        toast.success('Medication updated');
      } else {
        await healthApi.createMedication(payload);
        toast.success('Medication added');
      }
      setDialogOpen(false);
      resetForm();
      await Promise.all([loadMedications(), loadTodayData()]);
    } catch (err: unknown) {
      const msg = getErrorMessage(
        err,
        editingId ? 'Could not update medication' : 'Could not add medication'
      );
      setSubmitError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await healthApi.deleteMedication(id);
      setMedications((prev) => prev.filter((m) => m.id !== id));
      toast.success('Medication removed');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not delete medication'));
      await loadMedications();
    } finally {
      setDeletingId(null);
    }
  }

  async function handleToggleActive(med: Medication) {
    setTogglingId(med.id);
    try {
      await healthApi.updateMedication(med.id, { active: !med.active });
      setMedications((prev) =>
        prev.map((m) => (m.id === med.id ? { ...m, active: !m.active } : m))
      );
      toast.success(
        med.active ? 'Medication deactivated' : 'Medication activated'
      );
      if (!med.active) loadTodayData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not update status'));
    } finally {
      setTogglingId(null);
    }
  }

  async function handleLogDose(medId: string, taken: boolean) {
    const key = `${medId}-${taken ? 'take' : 'skip'}`;
    setLoggingDose(key);
    try {
      await healthApi.logDose(medId, {
        taken: taken || undefined,
        skipped: !taken || undefined,
      });
      toast.success(taken ? 'Dose taken!' : 'Dose skipped');
      await loadTodayData();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Could not log dose'));
    } finally {
      setLoggingDose(null);
    }
  }

  const sorted = [...medications].sort((a, b) => {
    if (a.active === b.active) return 0;
    return a.active ? -1 : 1;
  });

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

  if (error && medications.length === 0) {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center p-6">
          <Card className="w-full max-w-md text-center">
            <CardContent className="pt-6">
              <p className="text-destructive mb-4">{error}</p>
              <Button
                onClick={() => {
                  setLoading(true);
                  loadMedications();
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
    <div className="flex h-screen flex-col">
      <Header />

      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight sm:text-3xl">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950">
                  <Pill className="h-5 w-5 text-violet-600 dark:text-violet-400" />
                </div>
                Medications
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Track doses, schedules, and notes in one place.
              </p>
            </div>
            <Button onClick={openCreate} className="shrink-0">
              <Plus className="mr-2 h-4 w-4" />
              Add medication
            </Button>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {medications.length === 0 ? (
            <Card className="py-12 text-center">
              <CardContent>
                <Pill className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-40" />
                <p className="mb-1 font-medium">No medications yet</p>
                <p className="mb-4 text-sm text-muted-foreground">
                  Add your first medication to start tracking.
                </p>
                <Button variant="outline" onClick={openCreate}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add medication
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {sorted.map((med) => {
                const medTimes = Array.isArray(med.times) ? med.times : [];
                const start = formatDate(med.startDate);
                const end = formatDate(med.endDate);
                const today = todayMap[med.id];
                const totalLogged = today
                  ? today.takenCount + today.skippedCount
                  : 0;

                return (
                  <Card
                    key={med.id}
                    className={`gap-0 border-l-4 py-4 ${
                      med.active
                        ? 'border-l-emerald-500'
                        : 'border-l-muted-foreground/30'
                    }`}
                  >
                    <CardContent className="px-5">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <div className="mb-1 flex flex-wrap items-center gap-2">
                            <h2 className="truncate text-base font-semibold">
                              {med.name}
                            </h2>
                            <span
                              className={
                                med.active
                                  ? 'inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                                  : 'inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground'
                              }
                            >
                              {med.active && <Check className="h-2.5 w-2.5" />}
                              {med.active ? 'Active' : 'Inactive'}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {med.dosage}
                            <span className="mx-1.5 text-border">&middot;</span>
                            {med.frequency}
                          </p>
                        </div>

                        <div className="flex shrink-0 gap-0.5">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className={`h-8 w-8 ${
                              med.active
                                ? 'text-emerald-500 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950'
                                : 'text-muted-foreground hover:text-foreground'
                            }`}
                            onClick={() => handleToggleActive(med)}
                            disabled={togglingId === med.id}
                            aria-label={
                              med.active ? 'Deactivate' : 'Activate'
                            }
                            title={med.active ? 'Deactivate' : 'Activate'}
                          >
                            {togglingId === med.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Power className="h-3.5 w-3.5" />
                            )}
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                            onClick={() => openEdit(med)}
                            aria-label={`Edit ${med.name}`}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            disabled={deletingId === med.id}
                            onClick={() => handleDelete(med.id)}
                            aria-label={`Delete ${med.name}`}
                          >
                            {deletingId === med.id ? (
                              <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                              <Trash2 className="h-3.5 w-3.5" />
                            )}
                          </Button>
                        </div>
                      </div>

                      {medTimes.length > 0 && (
                        <div className="mt-2 flex flex-wrap items-center gap-1.5">
                          <Clock className="h-3 w-3 shrink-0 text-muted-foreground" />
                          {medTimes.map((t, i) => (
                            <span
                              key={i}
                              className="rounded-md bg-muted px-2 py-0.5 text-xs text-foreground"
                            >
                              {formatTimeDisplay(t)}
                            </span>
                          ))}
                        </div>
                      )}

                      {(start || end) && (
                        <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                          <CalendarDays className="h-3 w-3 shrink-0" />
                          {start && <span>{start}</span>}
                          {start && end && (
                            <span className="text-border">&rarr;</span>
                          )}
                          {end && <span>{end}</span>}
                        </div>
                      )}

                      {med.notes && (
                        <p className="mt-2 line-clamp-2 text-sm text-foreground/80">
                          {med.notes}
                        </p>
                      )}

                      <p className="mt-2 text-xs text-muted-foreground">
                        Added {relativeTime(med.createdAt as string)}
                      </p>

                      {med.active && (
                        <div className="mt-3 border-t border-border pt-3">
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-xs font-medium text-muted-foreground">
                              Today&apos;s Doses
                            </span>
                            {today && totalLogged > 0 && (
                              <span className="text-xs font-medium tabular-nums">
                                {today.takenCount} taken
                                {today.skippedCount > 0 && (
                                  <span className="text-muted-foreground">
                                    {' '}
                                    &middot; {today.skippedCount} skipped
                                  </span>
                                )}
                              </span>
                            )}
                          </div>

                          {today && totalLogged > 0 && (
                            <div className="mb-2 h-1.5 overflow-hidden rounded-full bg-muted">
                              <div
                                className="h-full rounded-full bg-emerald-500 transition-all"
                                style={{
                                  width: `${Math.min(
                                    (today.takenCount /
                                      Math.max(totalLogged, 1)) *
                                      100,
                                    100
                                  )}%`,
                                }}
                              />
                            </div>
                          )}

                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 flex-1 border-emerald-500/30 text-xs text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700 dark:text-emerald-400 dark:hover:bg-emerald-950 dark:hover:text-emerald-300"
                              disabled={loggingDose === `${med.id}-take`}
                              onClick={() => handleLogDose(med.id, true)}
                            >
                              {loggingDose === `${med.id}-take` ? (
                                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                              ) : (
                                <CheckCircle2 className="mr-1.5 h-3 w-3" />
                              )}
                              Take
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-8 flex-1 text-xs"
                              disabled={loggingDose === `${med.id}-skip`}
                              onClick={() => handleLogDose(med.id, false)}
                            >
                              {loggingDose === `${med.id}-skip` ? (
                                <Loader2 className="mr-1.5 h-3 w-3 animate-spin" />
                              ) : (
                                <SkipForward className="mr-1.5 h-3 w-3" />
                              )}
                              Skip
                            </Button>
                          </div>
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

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent
          className="max-h-[90vh] overflow-y-auto sm:max-w-lg"
          showCloseButton={!submitting}
        >
          <DialogHeader>
            <DialogTitle>
              {editingId ? 'Edit medication' : 'New medication'}
            </DialogTitle>
            <DialogDescription>
              Name, dosage, and frequency are required.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="med-name" className="text-sm font-medium">
                Name <span className="text-destructive">*</span>
              </label>
              <Input
                id="med-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Lisinopril"
                required
                autoComplete="off"
                autoFocus
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="med-dosage" className="text-sm font-medium">
                  Dosage <span className="text-destructive">*</span>
                </label>
                <Input
                  id="med-dosage"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 10 mg"
                  required
                  autoComplete="off"
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="med-frequency" className="text-sm font-medium">
                  Frequency <span className="text-destructive">*</span>
                </label>
                <Input
                  id="med-frequency"
                  value={frequency}
                  onChange={(e) => setFrequency(e.target.value)}
                  placeholder="e.g. Once daily"
                  required
                  autoComplete="off"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label htmlFor="med-start" className="text-sm font-medium">
                  Start date
                </label>
                <Input
                  id="med-start"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="med-end" className="text-sm font-medium">
                  End date
                </label>
                <Input
                  id="med-end"
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Scheduled times</label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={addTime}
                >
                  <Plus className="mr-1 h-3 w-3" />
                  Add time
                </Button>
              </div>
              {times.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  No scheduled times. Click &quot;Add time&quot; to set when you
                  take this medication.
                </p>
              ) : (
                <div className="space-y-2">
                  {times.map((t, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={t}
                        onChange={(e) => updateTime(i, e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeTime(i)}
                      >
                        <X className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label htmlFor="med-notes" className="text-sm font-medium">
                Notes
              </label>
              <Textarea
                id="med-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional instructions or side effects to remember"
                rows={3}
                className="min-h-[80px] resize-y"
              />
            </div>

            {editingId && (
              <label className="flex cursor-pointer select-none items-center gap-3 rounded-lg border px-4 py-3">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={(e) => setFormActive(e.target.checked)}
                  className="h-4 w-4 rounded border-border accent-emerald-600"
                />
                <div>
                  <span className="text-sm font-medium">Active</span>
                  <p className="text-xs text-muted-foreground">
                    Inactive medications won&apos;t appear in daily dose
                    tracking.
                  </p>
                </div>
              </label>
            )}

            {submitError && (
              <p className="text-sm text-destructive">{submitError}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleDialogOpenChange(false)}
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
