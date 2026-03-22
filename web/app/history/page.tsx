"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { healthApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertTriangle,
  FileText,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface HistoryEntry {
  id: string;
  condition: string;
  diagnosisDate: string | null;
  treatment: string | null;
  doctor: string | null;
  notes: string | null;
  createdAt: string;
}

interface Allergy {
  id: string;
  allergen: string;
  reaction: string | null;
  severity: string | null;
  createdAt: string;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

function toDateInputValue(value: string | null | undefined) {
  if (!value) return "";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 10);
}

const SEVERITY_SELECT_CLASS =
  "border-input flex h-9 w-full rounded-md border bg-transparent px-3 py-1 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 dark:bg-input/30";

export default function HistoryPage() {
  const { isLoading: authLoading } = useAuth();
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [allergyDialogOpen, setAllergyDialogOpen] = useState(false);
  const [editingHistoryId, setEditingHistoryId] = useState<string | null>(
    null
  );
  const [historyFormError, setHistoryFormError] = useState("");
  const [allergyFormError, setAllergyFormError] = useState("");
  const [historySubmitting, setHistorySubmitting] = useState(false);
  const [allergySubmitting, setAllergySubmitting] = useState(false);

  const [historyForm, setHistoryForm] = useState({
    condition: "",
    diagnosisDate: "",
    treatment: "",
    doctor: "",
    notes: "",
  });

  const [allergyForm, setAllergyForm] = useState({
    allergen: "",
    reaction: "",
    severity: "mild" as "mild" | "moderate" | "severe",
  });

  const loadAll = useCallback(async () => {
    const [hRes, aRes] = await Promise.all([
      healthApi.getHistory(),
      healthApi.getAllergies(),
    ]);
    setHistory(Array.isArray(hRes.data.data) ? hRes.data.data : []);
    setAllergies(Array.isArray(aRes.data.data) ? aRes.data.data : []);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      try {
        setError("");
        setLoading(true);
        await loadAll();
      } catch (err: unknown) {
        if (!cancelled)
          setError(getErrorMessage(err, "Failed to load history"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loadAll, authLoading]);

  const openHistoryCreate = () => {
    setEditingHistoryId(null);
    setHistoryFormError("");
    setHistoryForm({
      condition: "",
      diagnosisDate: "",
      treatment: "",
      doctor: "",
      notes: "",
    });
    setHistoryDialogOpen(true);
  };

  const openHistoryEdit = (entry: HistoryEntry) => {
    setEditingHistoryId(entry.id);
    setHistoryFormError("");
    setHistoryForm({
      condition: entry.condition,
      diagnosisDate: toDateInputValue(entry.diagnosisDate),
      treatment: entry.treatment ?? "",
      doctor: entry.doctor ?? "",
      notes: entry.notes ?? "",
    });
    setHistoryDialogOpen(true);
  };

  const onHistoryDialogOpenChange = (open: boolean) => {
    setHistoryDialogOpen(open);
    if (!open) {
      setEditingHistoryId(null);
      setHistoryFormError("");
    }
  };

  const openAllergyModal = () => {
    setAllergyFormError("");
    setAllergyForm({ allergen: "", reaction: "", severity: "mild" });
    setAllergyDialogOpen(true);
  };

  const submitHistory = async (e: React.FormEvent) => {
    e.preventDefault();
    const condition = historyForm.condition.trim();
    if (!condition) {
      setHistoryFormError("Condition is required.");
      return;
    }
    setHistoryFormError("");
    setHistorySubmitting(true);
    const payload = {
      condition,
      diagnosisDate: historyForm.diagnosisDate || undefined,
      treatment: historyForm.treatment.trim() || undefined,
      doctor: historyForm.doctor.trim() || undefined,
      notes: historyForm.notes.trim() || undefined,
    };
    try {
      if (editingHistoryId) {
        await healthApi.updateHistory(editingHistoryId, payload);
        toast.success("Entry updated");
      } else {
        await healthApi.createHistory(payload);
        toast.success("Entry added");
      }
      onHistoryDialogOpenChange(false);
      await loadAll();
    } catch (err: unknown) {
      setHistoryFormError(
        getErrorMessage(err, editingHistoryId ? "Could not update entry." : "Could not save entry.")
      );
    } finally {
      setHistorySubmitting(false);
    }
  };

  const submitAllergy = async (e: React.FormEvent) => {
    e.preventDefault();
    const allergen = allergyForm.allergen.trim();
    if (!allergen) {
      setAllergyFormError("Allergen is required.");
      return;
    }
    setAllergyFormError("");
    setAllergySubmitting(true);
    try {
      await healthApi.createAllergy({
        allergen,
        reaction: allergyForm.reaction.trim() || undefined,
        severity: allergyForm.severity,
      });
      setAllergyDialogOpen(false);
      toast.success("Allergy added");
      await loadAll();
    } catch (err: unknown) {
      setAllergyFormError(getErrorMessage(err, "Could not save allergy."));
    } finally {
      setAllergySubmitting(false);
    }
  };

  const removeHistory = async (id: string) => {
    try {
      await healthApi.deleteHistory(id);
      await loadAll();
      toast.success("Entry removed");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete entry"));
    }
  };

  const removeAllergy = async (id: string) => {
    try {
      await healthApi.deleteAllergy(id);
      await loadAll();
      toast.success("Allergy removed");
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Failed to delete allergy"));
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (error && !history.length && !allergies.length) {
    return (
      <div className="flex h-screen flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="bg-card max-w-md rounded-xl border p-6 text-center">
            <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-destructive" />
            <p className="text-foreground mb-4">{error}</p>
            <Button
              onClick={() => {
                setLoading(true);
                setError("");
                loadAll()
                  .catch((err) =>
                    setError(getErrorMessage(err, "Failed to load history"))
                  )
                  .finally(() => setLoading(false));
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col">
      <Header />
      <div className="flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl space-y-8">
          {error ? (
            <div
              className="flex items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-foreground"
              role="alert"
            >
              <AlertTriangle className="h-5 w-5 shrink-0 text-destructive" />
              <span className="flex-1">{error}</span>
              <button
                type="button"
                onClick={() => setError("")}
                className="rounded-md p-1 text-muted-foreground hover:bg-background/50 hover:text-foreground"
                aria-label="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : null}

          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Medical record
            </h1>
            <p className="mt-1 text-muted-foreground">
              Conditions you&apos;ve had and allergies care providers should
              know about.
            </p>
          </div>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold text-foreground">
                  Medical history
                </h2>
              </div>
              <Button type="button" onClick={openHistoryCreate} size="sm">
                <Plus className="h-4 w-4" />
                Add entry
              </Button>
            </div>

            {history.length === 0 ? (
              <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground transition-shadow hover:shadow-lg">
                <p>No conditions recorded yet.</p>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {history.map((entry) => (
                  <li
                    key={entry.id}
                    className="bg-card rounded-xl border p-6 transition-shadow hover:shadow-lg"
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {entry.condition}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Diagnosed {formatDate(entry.diagnosisDate)} · Added{" "}
                          {formatDate(entry.createdAt)}
                        </p>
                      </div>
                      <div className="flex shrink-0 gap-0.5">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-foreground"
                          onClick={() => openHistoryEdit(entry)}
                          aria-label="Edit entry"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon-sm"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => removeHistory(entry.id)}
                          aria-label="Delete entry"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <dl className="space-y-2 text-sm">
                      {entry.doctor ? (
                        <div>
                          <dt className="text-muted-foreground">Doctor</dt>
                          <dd className="text-foreground">{entry.doctor}</dd>
                        </div>
                      ) : null}
                      {entry.treatment ? (
                        <div>
                          <dt className="text-muted-foreground">Treatment</dt>
                          <dd className="text-foreground">{entry.treatment}</dd>
                        </div>
                      ) : null}
                      {entry.notes ? (
                        <div>
                          <dt className="text-muted-foreground">Notes</dt>
                          <dd className="whitespace-pre-wrap text-foreground">
                            {entry.notes}
                          </dd>
                        </div>
                      ) : null}
                    </dl>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-amber-500" />
                <h2 className="text-xl font-semibold text-foreground">
                  Allergies
                </h2>
              </div>
              <Button type="button" onClick={openAllergyModal} size="sm">
                <Plus className="h-4 w-4" />
                Add allergy
              </Button>
            </div>

            {allergies.length === 0 ? (
              <div className="bg-card rounded-xl border p-8 text-center text-muted-foreground transition-shadow hover:shadow-lg">
                <p>No allergies on file.</p>
              </div>
            ) : (
              <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
                {allergies.map((a) => (
                  <li
                    key={a.id}
                    className="bg-card rounded-xl border p-6 transition-shadow hover:shadow-lg"
                  >
                    <div className="mb-2 flex items-start justify-between gap-2">
                      <div>
                        <p className="font-semibold text-foreground">
                          {a.allergen}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Recorded {formatDate(a.createdAt)}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-sm"
                        className="shrink-0 text-muted-foreground hover:text-destructive"
                        onClick={() => removeAllergy(a.id)}
                        aria-label="Delete allergy"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    {a.severity ? (
                      <span
                        className={cn(
                          "mb-2 inline-block rounded-md border px-2 py-0.5 text-xs font-medium capitalize",
                          a.severity === "severe" &&
                            "border-destructive/50 bg-destructive/15 text-destructive",
                          a.severity === "moderate" &&
                            "border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400",
                          a.severity === "mild" &&
                            "border-border bg-muted/50 text-muted-foreground"
                        )}
                      >
                        {a.severity}
                      </span>
                    ) : null}
                    {a.reaction ? (
                      <p className="text-sm text-foreground">
                        <span className="text-muted-foreground">Reaction: </span>
                        {a.reaction}
                      </p>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No reaction noted
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>

      <Dialog open={historyDialogOpen} onOpenChange={onHistoryDialogOpenChange}>
        <DialogContent className="max-h-[min(90vh,640px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {editingHistoryId ? "Edit history entry" : "Add history entry"}
            </DialogTitle>
            <DialogDescription>
              {editingHistoryId
                ? "Update this condition and related details."
                : "Record a condition, diagnosis date, and optional care details."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitHistory} className="space-y-4">
            {historyFormError ? (
              <p className="text-sm text-destructive">{historyFormError}</p>
            ) : null}
            <div className="space-y-2">
              <label
                htmlFor="hist-condition"
                className="text-sm font-medium text-foreground"
              >
                Condition <span className="text-destructive">*</span>
              </label>
              <Input
                id="hist-condition"
                value={historyForm.condition}
                onChange={(e) =>
                  setHistoryForm((s) => ({ ...s, condition: e.target.value }))
                }
                required
                placeholder="e.g. Type 2 diabetes"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="hist-date"
                className="text-sm font-medium text-foreground"
              >
                Diagnosis date
              </label>
              <Input
                id="hist-date"
                type="date"
                value={historyForm.diagnosisDate}
                onChange={(e) =>
                  setHistoryForm((s) => ({
                    ...s,
                    diagnosisDate: e.target.value,
                  }))
                }
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="hist-treatment"
                className="text-sm font-medium text-foreground"
              >
                Treatment
              </label>
              <Input
                id="hist-treatment"
                value={historyForm.treatment}
                onChange={(e) =>
                  setHistoryForm((s) => ({
                    ...s,
                    treatment: e.target.value,
                  }))
                }
                placeholder="Medication, therapy, etc."
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="hist-doctor"
                className="text-sm font-medium text-foreground"
              >
                Doctor
              </label>
              <Input
                id="hist-doctor"
                value={historyForm.doctor}
                onChange={(e) =>
                  setHistoryForm((s) => ({ ...s, doctor: e.target.value }))
                }
                placeholder="Name or clinic"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="hist-notes"
                className="text-sm font-medium text-foreground"
              >
                Notes
              </label>
              <Textarea
                id="hist-notes"
                value={historyForm.notes}
                onChange={(e) =>
                  setHistoryForm((s) => ({ ...s, notes: e.target.value }))
                }
                placeholder="Additional context"
                rows={4}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onHistoryDialogOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={historySubmitting}>
                {historySubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : editingHistoryId ? (
                  "Update"
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={allergyDialogOpen} onOpenChange={setAllergyDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add allergy</DialogTitle>
            <DialogDescription>
              Record an allergen, reaction, and severity for your care team.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={submitAllergy} className="space-y-4">
            {allergyFormError ? (
              <p className="text-sm text-destructive">{allergyFormError}</p>
            ) : null}
            <div className="space-y-2">
              <label
                htmlFor="allergy-name"
                className="text-sm font-medium text-foreground"
              >
                Allergen <span className="text-destructive">*</span>
              </label>
              <Input
                id="allergy-name"
                value={allergyForm.allergen}
                onChange={(e) =>
                  setAllergyForm((s) => ({ ...s, allergen: e.target.value }))
                }
                required
                placeholder="e.g. Penicillin"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="allergy-reaction"
                className="text-sm font-medium text-foreground"
              >
                Reaction
              </label>
              <Input
                id="allergy-reaction"
                value={allergyForm.reaction}
                onChange={(e) =>
                  setAllergyForm((s) => ({ ...s, reaction: e.target.value }))
                }
                placeholder="What happens when exposed?"
              />
            </div>
            <div className="space-y-2">
              <label
                htmlFor="allergy-severity"
                className="text-sm font-medium text-foreground"
              >
                Severity
              </label>
              <select
                id="allergy-severity"
                value={allergyForm.severity}
                onChange={(e) =>
                  setAllergyForm((s) => ({
                    ...s,
                    severity: e.target.value as
                      | "mild"
                      | "moderate"
                      | "severe",
                  }))
                }
                className={SEVERITY_SELECT_CLASS}
              >
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setAllergyDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={allergySubmitting}>
                {allergySubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Saving…
                  </>
                ) : (
                  "Save"
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
