"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  Plus,
  Trash2,
  Pencil,
  MapPin,
  Clock,
  Stethoscope,
  FileText,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/header";
import { healthApi } from "@/lib/api";
import { getErrorMessage } from "@/lib/error";
import { useAuth } from "@/hooks/use-auth";
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
import { cn } from "@/lib/utils";

interface Appointment {
  id: string;
  doctorName: string;
  specialty: string | null;
  date: string;
  time: string | null;
  location: string | null;
  reason: string | null;
  notes: string | null;
  status: string | null;
  createdAt: string;
}

type FormState = {
  doctorName: string;
  specialty: string;
  date: string;
  time: string;
  location: string;
  reason: string;
  notes: string;
  status: string;
};

const emptyForm: FormState = {
  doctorName: "",
  specialty: "",
  date: "",
  time: "",
  location: "",
  reason: "",
  notes: "",
  status: "scheduled",
};

const STATUS_OPTIONS = ["scheduled", "completed", "cancelled"] as const;

function toDateInputValue(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function toTimeInputValue(value: string | null | undefined) {
  if (!value) return "";
  return value.slice(0, 5);
}

function formatAppointmentDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function formatAppointmentTime(value: string | null | undefined) {
  if (!value) return "—";
  const [hStr, mStr] = value.split(":");
  const h = Number(hStr);
  const m = Number(mStr);
  if (Number.isNaN(h) || Number.isNaN(m)) return value;
  const d = new Date();
  d.setHours(h, m, 0, 0);
  return d.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCreatedAt(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function statusBadgeClass(status: string | null | undefined) {
  const s = status ?? "scheduled";
  if (s === "scheduled")
    return "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30";
  if (s === "completed")
    return "bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-500/30";
  if (s === "cancelled")
    return "bg-red-500/15 text-red-600 dark:text-red-400 border-red-500/30";
  return "bg-muted text-muted-foreground border-border";
}

function appointmentToForm(appt: Appointment): FormState {
  const st = appt.status ?? "scheduled";
  const statusOk = STATUS_OPTIONS.includes(st as (typeof STATUS_OPTIONS)[number]);
  return {
    doctorName: appt.doctorName,
    specialty: appt.specialty ?? "",
    date: toDateInputValue(appt.date),
    time: toTimeInputValue(appt.time),
    location: appt.location ?? "",
    reason: appt.reason ?? "",
    notes: appt.notes ?? "",
    status: statusOk ? st : "scheduled",
  };
}

export default function AppointmentsPage() {
  const { isLoading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAppointments = useCallback(async () => {
    const res = await healthApi.getAppointments();
    const list = res.data?.data;
    setAppointments(Array.isArray(list) ? list : []);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      setLoadError("");
      try {
        await loadAppointments();
      } catch (err: unknown) {
        if (!cancelled) {
          const msg = getErrorMessage(err, "Failed to load appointments");
          setLoadError(msg);
          toast.error(msg);
        }
      } finally {
        if (!cancelled) setListLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [authLoading, loadAppointments]);

  function resetDialog() {
    setEditingId(null);
    setForm(emptyForm);
  }

  function handleDialogOpenChange(open: boolean) {
    setDialogOpen(open);
    if (!open) resetDialog();
  }

  function openCreate() {
    resetDialog();
    setDialogOpen(true);
  }

  function openEdit(appt: Appointment) {
    setEditingId(appt.id);
    setForm(appointmentToForm(appt));
    setDialogOpen(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    const payload = {
      doctorName: form.doctorName.trim(),
      specialty: form.specialty.trim() || undefined,
      date: form.date,
      time: form.time.trim() || undefined,
      location: form.location.trim() || undefined,
      reason: form.reason.trim() || undefined,
      notes: form.notes.trim() || undefined,
    };
    try {
      if (editingId) {
        await healthApi.updateAppointment(editingId, {
          ...payload,
          status: form.status,
        });
        toast.success("Appointment updated");
      } else {
        await healthApi.createAppointment({ ...payload, status: form.status });
        toast.success("Appointment scheduled");
      }
      handleDialogOpenChange(false);
      await loadAppointments();
    } catch (err: unknown) {
      toast.error(
        getErrorMessage(
          err,
          editingId ? "Could not update appointment" : "Could not schedule appointment"
        )
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      await healthApi.deleteAppointment(id);
      toast.success("Appointment removed");
      await loadAppointments();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Could not delete appointment"));
    } finally {
      setDeletingId(null);
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen min-h-0 flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  if (loadError && !listLoading) {
    return (
      <div className="flex h-screen min-h-0 flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center p-6">
          <div className="bg-card max-w-md rounded-xl border p-8 text-center">
            <p className="text-destructive mb-4">{loadError}</p>
            <Button
              onClick={() => {
                setListLoading(true);
                setLoadError("");
                loadAppointments()
                  .then(() => setListLoading(false))
                  .catch((err: unknown) => {
                    const msg = getErrorMessage(err, "Failed to load appointments");
                    setLoadError(msg);
                    toast.error(msg);
                    setListLoading(false);
                  });
              }}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (listLoading) {
    return (
      <div className="flex h-screen min-h-0 flex-col">
        <Header />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="text-muted-foreground h-8 w-8 animate-spin" />
        </div>
      </div>
    );
  }

  const isEdit = Boolean(editingId);

  return (
    <div className="flex h-screen min-h-0 flex-col bg-background">
      <Header />
      <div className="min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground">
                Appointments
              </h1>
              <p className="text-muted-foreground mt-1">
                Schedule and manage your visits
              </p>
            </div>
            <Button onClick={openCreate} className="shrink-0 gap-2">
              <Plus className="h-4 w-4" />
              Schedule appointment
            </Button>
          </div>

          {appointments.length === 0 ? (
            <div className="bg-card rounded-xl border p-10 text-center transition-shadow hover:shadow-lg">
              <Calendar className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <p className="text-foreground font-medium">No appointments yet</p>
              <p className="text-muted-foreground mt-1 text-sm">
                Add your first visit to keep everything in one place.
              </p>
              <Button onClick={openCreate} className="mt-6 gap-2">
                <Plus className="h-4 w-4" />
                Schedule appointment
              </Button>
            </div>
          ) : (
            <ul className="grid gap-4 sm:grid-cols-1 lg:grid-cols-2">
              {appointments.map((appt) => {
                const status = (appt.status ?? "scheduled") as string;
                return (
                  <li key={appt.id}>
                    <div className="bg-card flex flex-col gap-4 rounded-xl border p-6 transition-shadow hover:shadow-lg">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <p className="text-foreground truncate text-lg font-semibold">
                            {appt.doctorName}
                          </p>
                          {appt.specialty ? (
                            <p className="text-muted-foreground mt-0.5 flex items-center gap-1.5 text-sm">
                              <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                              {appt.specialty}
                            </p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span
                            className={cn(
                              "rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize",
                              statusBadgeClass(status)
                            )}
                          >
                            {status}
                          </span>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            onClick={() => openEdit(appt)}
                            aria-label="Edit appointment"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon-sm"
                            className="text-destructive hover:text-destructive"
                            disabled={deletingId === appt.id}
                            onClick={() => handleDelete(appt.id)}
                            aria-label="Delete appointment"
                          >
                            {deletingId === appt.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </div>

                      <div className="text-muted-foreground grid gap-2 text-sm">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 shrink-0 text-foreground/70" />
                          <span className="text-foreground font-medium">
                            {formatAppointmentDate(appt.date)}
                          </span>
                          <span className="text-muted-foreground">·</span>
                          <Clock className="h-4 w-4 shrink-0 text-foreground/70" />
                          <span className="text-foreground font-medium">
                            {formatAppointmentTime(appt.time)}
                          </span>
                        </div>
                        {appt.location ? (
                          <div className="flex items-start gap-2">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
                            <span>{appt.location}</span>
                          </div>
                        ) : null}
                        {appt.reason ? (
                          <div className="flex items-start gap-2">
                            <FileText className="mt-0.5 h-4 w-4 shrink-0 text-foreground/70" />
                            <span>{appt.reason}</span>
                          </div>
                        ) : null}
                        {appt.notes ? (
                          <p className="border-border bg-muted/40 mt-1 rounded-lg border px-3 py-2 text-foreground/90">
                            {appt.notes}
                          </p>
                        ) : null}
                      </div>

                      <p className="text-muted-foreground border-border border-t pt-3 text-xs">
                        Added {formatCreatedAt(appt.createdAt)}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="max-h-[min(90vh,720px)] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{isEdit ? "Edit appointment" : "New appointment"}</DialogTitle>
            <DialogDescription>
              {isEdit
                ? "Update the details below and save your changes."
                : "Add a visit to keep your care organized."}
            </DialogDescription>
          </DialogHeader>

          <form id="appointment-form" onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="doctorName" className="text-foreground text-sm font-medium">
                Doctor name <span className="text-destructive">*</span>
              </label>
              <Input
                id="doctorName"
                value={form.doctorName}
                onChange={(e) => setForm((f) => ({ ...f, doctorName: e.target.value }))}
                required
                placeholder="Dr. Jane Smith"
                autoComplete="off"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="specialty" className="text-foreground text-sm font-medium">
                Specialty
              </label>
              <Input
                id="specialty"
                value={form.specialty}
                onChange={(e) => setForm((f) => ({ ...f, specialty: e.target.value }))}
                placeholder="Cardiology"
              />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label htmlFor="date" className="text-foreground text-sm font-medium">
                  Date <span className="text-destructive">*</span>
                </label>
                <Input
                  id="date"
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-2">
                <label htmlFor="time" className="text-foreground text-sm font-medium">
                  Time
                </label>
                <Input
                  id="time"
                  type="time"
                  value={form.time}
                  onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label htmlFor="location" className="text-foreground text-sm font-medium">
                Location
              </label>
              <Input
                id="location"
                value={form.location}
                onChange={(e) => setForm((f) => ({ ...f, location: e.target.value }))}
                placeholder="Clinic address or name"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="reason" className="text-foreground text-sm font-medium">
                Reason
              </label>
              <Input
                id="reason"
                value={form.reason}
                onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                placeholder="Follow-up, annual exam…"
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="notes" className="text-foreground text-sm font-medium">
                Notes
              </label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Anything else to remember"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <label htmlFor="status" className="text-foreground text-sm font-medium">
                Status
              </label>
              <select
                id="status"
                value={form.status}
                onChange={(e) => setForm((f) => ({ ...f, status: e.target.value }))}
                className={cn(
                  "border-input bg-background ring-offset-background focus-visible:ring-ring flex h-9 w-full rounded-md border px-3 py-1 text-sm shadow-xs transition-[color,box-shadow] outline-none focus-visible:ring-[3px] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                )}
              >
                {STATUS_OPTIONS.map((s) => (
                  <option key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </option>
                ))}
              </select>
            </div>
          </form>

          <DialogFooter className="gap-2 sm:justify-stretch">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              disabled={submitting}
              onClick={() => handleDialogOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="appointment-form"
              className="flex-1"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving…
                </>
              ) : isEdit ? (
                "Save changes"
              ) : (
                "Schedule"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
