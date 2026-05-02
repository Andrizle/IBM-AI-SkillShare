import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Heart, Pill, CalendarCheck, Sparkles, Bell, Plus, Trash2,
  Pencil, Check, X, Clock, ChevronRight, AlertCircle, Loader2,
  LogOut,
} from "lucide-react";
import { Link } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import {
  getMedications, createMedication, updateMedication, deleteMedication,
  logDose, getAnalyses, triggerAnalysis, getVapidPublicKey, subscribePush,
  unsubscribePush, sendTestPush, todayISO, nowHHMM,
  type Medication, type AiAnalysis,
} from "@/lib/api";

// ── helpers ───────────────────────────────────────────────────────────────

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function fmtTime(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  return `${((h % 12) || 12)}:${String(m).padStart(2, "0")} ${ampm}`;
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString(undefined, {
    month: "short", day: "numeric", hour: "numeric", minute: "2-digit",
  });
}

// ── MedicationForm ─────────────────────────────────────────────────────────

interface MedFormState {
  name: string;
  dosage: string;
  times: string[];
  notes: string;
}

const EMPTY_FORM: MedFormState = { name: "", dosage: "", times: ["08:00"], notes: "" };

function MedicationForm({
  initial = EMPTY_FORM,
  onSubmit,
  onCancel,
  loading,
}: {
  initial?: MedFormState;
  onSubmit: (v: MedFormState) => void;
  onCancel: () => void;
  loading: boolean;
}) {
  const [form, setForm] = useState<MedFormState>(initial);

  const setField = <K extends keyof MedFormState>(k: K, v: MedFormState[K]) =>
    setForm((f) => ({ ...f, [k]: v }));

  const addTime = () => setForm((f) => ({ ...f, times: [...f.times, "12:00"] }));
  const removeTime = (i: number) =>
    setForm((f) => ({ ...f, times: f.times.filter((_, idx) => idx !== i) }));
  const setTime = (i: number, v: string) =>
    setForm((f) => ({ ...f, times: f.times.map((t, idx) => (idx === i ? v : t)) }));

  const valid = form.name.trim() && form.dosage.trim() && form.times.length > 0;

  return (
    <div className="space-y-4">
      <div className="grid gap-1.5">
        <Label htmlFor="med-name">Medication name *</Label>
        <Input
          id="med-name"
          value={form.name}
          onChange={(e) => setField("name", e.target.value)}
          placeholder="e.g. Metformin"
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="med-dosage">Dosage *</Label>
        <Input
          id="med-dosage"
          value={form.dosage}
          onChange={(e) => setField("dosage", e.target.value)}
          placeholder="e.g. 500 mg"
        />
      </div>

      <div className="grid gap-1.5">
        <Label>Scheduled times *</Label>
        <div className="space-y-2">
          {form.times.map((t, i) => (
            <div key={i} className="flex gap-2 items-center">
              <Input
                type="time"
                value={t}
                onChange={(e) => setTime(i, e.target.value)}
                className="w-36"
              />
              {form.times.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeTime(i)}
                  className="h-8 w-8 text-destructive"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={addTime} className="gap-1">
            <Plus className="w-3.5 h-3.5" /> Add time
          </Button>
        </div>
      </div>

      <div className="grid gap-1.5">
        <Label htmlFor="med-notes">Notes</Label>
        <Textarea
          id="med-notes"
          value={form.notes}
          onChange={(e) => setField("notes", e.target.value)}
          placeholder="Take with food, etc."
          rows={2}
        />
      </div>

      <DialogFooter className="pt-2">
        <Button variant="outline" onClick={onCancel} disabled={loading}>
          Cancel
        </Button>
        <Button onClick={() => onSubmit(form)} disabled={!valid || loading}>
          {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
          Save
        </Button>
      </DialogFooter>
    </div>
  );
}

// ── MedicationsTab ──────────────────────────────────────────────────────────

function MedicationsTab() {
  const qc = useQueryClient();
  const { data: meds = [], isLoading } = useQuery({
    queryKey: ["medications"],
    queryFn: getMedications,
  });

  const [addOpen, setAddOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Medication | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Medication | null>(null);

  const createMut = useMutation({
    mutationFn: createMedication,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications"] });
      setAddOpen(false);
      toast.success("Medication added");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const updateMut = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Parameters<typeof updateMedication>[1] }) =>
      updateMedication(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications"] });
      setEditTarget(null);
      toast.success("Medication updated");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteMut = useMutation({
    mutationFn: deleteMedication,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications"] });
      setDeleteTarget(null);
      toast.success("Medication removed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const logMut = useMutation({
    mutationFn: ({ id, time }: { id: string; time: string }) =>
      logDose(id, {
        scheduled_time: time,
        status: "taken",
        date: todayISO(),
        taken_at: new Date().toISOString(),
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["medications"] });
      toast.success("Dose marked as taken");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading medications…
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{meds.length} active medication{meds.length !== 1 ? "s" : ""}</p>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1">
          <Plus className="w-4 h-4" /> Add medication
        </Button>
      </div>

      {meds.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Pill className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No medications yet. Add your first one above.</p>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {meds.map((med) => (
          <Card key={med.id} className="shadow-soft">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <CardTitle className="text-base">{med.name}</CardTitle>
                  <CardDescription>{med.dosage}</CardDescription>
                </div>
                <div className="flex gap-1 shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setEditTarget(med)}
                    title="Edit"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-destructive hover:text-destructive"
                    onClick={() => setDeleteTarget(med)}
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="pt-0 space-y-3">
              <div className="flex flex-wrap gap-1.5">
                {med.times.map((t) => (
                  <Badge key={t} variant="secondary" className="gap-1 text-xs">
                    <Clock className="w-3 h-3" /> {fmtTime(t)}
                  </Badge>
                ))}
              </div>
              {med.notes && (
                <p className="text-xs text-muted-foreground italic">{med.notes}</p>
              )}
              <div className="flex flex-wrap gap-1.5 pt-1">
                {med.times.map((t) => (
                  <Button
                    key={t}
                    size="sm"
                    variant="outline"
                    className="gap-1 text-xs h-7"
                    onClick={() => logMut.mutate({ id: med.id, time: t })}
                    disabled={logMut.isPending}
                  >
                    <Check className="w-3 h-3 text-primary" /> Taken at {fmtTime(t)}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Add medication</DialogTitle>
          </DialogHeader>
          <MedicationForm
            onSubmit={(v) => createMut.mutate(v)}
            onCancel={() => setAddOpen(false)}
            loading={createMut.isPending}
          />
        </DialogContent>
      </Dialog>

      {/* Edit dialog */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit medication</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <MedicationForm
              initial={{
                name: editTarget.name,
                dosage: editTarget.dosage,
                times: editTarget.times,
                notes: editTarget.notes ?? "",
              }}
              onSubmit={(v) =>
                updateMut.mutate({ id: editTarget.id, data: v })
              }
              onCancel={() => setEditTarget(null)}
              loading={updateMut.isPending}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {deleteTarget?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will deactivate the medication and stop future reminders.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
              onClick={() => deleteTarget && deleteMut.mutate(deleteTarget.id)}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ── TodayTab ────────────────────────────────────────────────────────────────

function TodayTab() {
  const qc = useQueryClient();
  const { data: meds = [], isLoading } = useQuery({
    queryKey: ["medications"],
    queryFn: getMedications,
  });

  const [logged, setLogged] = useState<Record<string, "taken" | "missed">>({});

  const logMut = useMutation({
    mutationFn: ({ id, time, status }: { id: string; time: string; status: "taken" | "missed" }) =>
      logDose(id, {
        scheduled_time: time,
        status,
        date: todayISO(),
        taken_at: status === "taken" ? new Date().toISOString() : undefined,
      }),
    onSuccess: (_, v) => {
      setLogged((prev) => ({ ...prev, [`${v.id}-${v.time}`]: v.status }));
      qc.invalidateQueries({ queryKey: ["medications"] });
      toast.success(v.status === "taken" ? "Marked as taken ✓" : "Marked as missed");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
        <Loader2 className="w-5 h-5 animate-spin" /> Loading…
      </div>
    );
  }

  const allDoses = meds.flatMap((m) => m.times.map((t) => ({ med: m, time: t, key: `${m.id}-${t}` })));

  const pending = allDoses.filter((d) => !logged[d.key]).sort((a, b) => a.time.localeCompare(b.time));
  const done    = allDoses.filter((d) =>  logged[d.key]).sort((a, b) => a.time.localeCompare(b.time));
  const doses   = [...pending, ...done];

  if (doses.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
          <CalendarCheck className="w-10 h-10 text-muted-foreground/40" />
          <p className="text-muted-foreground">No doses scheduled — add medications first.</p>
        </CardContent>
      </Card>
    );
  }

  const today = new Date().toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">{today}</p>
      {doses.map(({ med, time, key }) => {
        const status = logged[key];
        const isLogged = !!status;
        const isTaken = status === "taken";
        const isMissed = status === "missed";

        return (
          <Card
            key={key}
            className={`shadow-soft transition-all duration-300 ${isLogged ? "opacity-50 bg-muted/60" : ""}`}
          >
            <CardContent className="flex items-center gap-4 py-4">
              <div className={`w-10 h-10 rounded-xl grid place-items-center shrink-0 ${
                isTaken  ? "bg-primary/20" :
                isMissed ? "bg-destructive/15" :
                "bg-primary/10"
              }`}>
                {isTaken  ? <Check className="w-5 h-5 text-primary" /> :
                 isMissed ? <X     className="w-5 h-5 text-destructive" /> :
                            <Pill  className="w-5 h-5 text-primary" />}
              </div>

              <div className="flex-1 min-w-0">
                <p className={`font-medium truncate ${isLogged ? "text-muted-foreground" : ""}`}>{med.name}</p>
                <p className="text-xs text-muted-foreground">{med.dosage} · {fmtTime(time)}</p>
                {isLogged && (
                  <p className={`text-xs font-medium mt-0.5 ${isTaken ? "text-primary" : "text-destructive"}`}>
                    {isTaken ? "Taken" : "Missed"} — tap to correct
                  </p>
                )}
              </div>

              <div className="flex gap-2 shrink-0">
                <Button
                  size="sm"
                  className={`gap-1 transition-opacity ${isTaken ? "opacity-30 cursor-default" : "bg-primary hover:bg-primary/90"}`}
                  onClick={() => !isTaken && logMut.mutate({ id: med.id, time, status: "taken" })}
                  disabled={logMut.isPending}
                >
                  <Check className="w-3.5 h-3.5" /> Taken
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className={`gap-1 transition-opacity ${isMissed ? "opacity-30 cursor-default" : "text-destructive border-destructive/30 hover:bg-destructive/5"}`}
                  onClick={() => !isMissed && logMut.mutate({ id: med.id, time, status: "missed" })}
                  disabled={logMut.isPending}
                >
                  <X className="w-3.5 h-3.5" /> Missed
                </Button>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

// ── AiTab ──────────────────────────────────────────────────────────────────

function AiTab() {
  const qc = useQueryClient();
  const { data: analyses = [], isLoading } = useQuery({
    queryKey: ["ai-analyses"],
    queryFn: getAnalyses,
  });

  const triggerMut = useMutation({
    mutationFn: triggerAnalysis,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["ai-analyses"] });
      toast.success("Analysis complete");
    },
    onError: (e: Error) => toast.error(`Analysis failed: ${e.message}`),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Powered by IBM watsonx · {analyses.length} analysis record{analyses.length !== 1 ? "s" : ""}
        </p>
        <Button
          size="sm"
          onClick={() => triggerMut.mutate()}
          disabled={triggerMut.isPending}
          className="gap-1"
        >
          {triggerMut.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          Run analysis
        </Button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-20 text-muted-foreground gap-2">
          <Loader2 className="w-5 h-5 animate-spin" /> Loading analyses…
        </div>
      )}

      {!isLoading && analyses.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center gap-3 py-14 text-center">
            <Sparkles className="w-10 h-10 text-muted-foreground/40" />
            <p className="text-muted-foreground">No analyses yet. Run your first one above.</p>
          </CardContent>
        </Card>
      )}

      {analyses.map((a: AiAnalysis) => (
        <Card key={a.id} className="shadow-soft">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {fmtDate(a.ran_at)}
              </CardTitle>
              <Badge variant="secondary" className="gap-1">
                <Sparkles className="w-3 h-3" /> watsonx
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm leading-relaxed">{a.summary}</p>
            {a.recommendations.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Recommendations
                </p>
                {a.recommendations.map((r, i) => (
                  <div key={i} className="flex gap-3 rounded-lg bg-secondary/60 p-3">
                    <ChevronRight className="w-4 h-4 mt-0.5 text-primary shrink-0" />
                    <div className="text-sm">
                      <span className="font-medium">{r.medication}: </span>
                      {r.suggestion}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ── NotificationsTab ────────────────────────────────────────────────────────

function NotificationsTab() {
  const [subscription, setSubscription] = useState<PushSubscription | null>(null);
  const [checking, setChecking] = useState(false);

  const supported =
    typeof window !== "undefined" &&
    "serviceWorker" in navigator &&
    "PushManager" in window;

  const subscribeMut = useMutation({
    mutationFn: async () => {
      const { publicKey } = await getVapidPublicKey();
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });
      await subscribePush(sub.toJSON() as PushSubscriptionJSON);
      return sub;
    },
    onSuccess: (sub) => {
      setSubscription(sub);
      toast.success("Push notifications enabled");
    },
    onError: (e: Error) => toast.error(`Subscribe failed: ${e.message}`),
  });

  const unsubMut = useMutation({
    mutationFn: async () => {
      if (!subscription) return;
      await unsubscribePush(subscription.endpoint);
      await subscription.unsubscribe();
    },
    onSuccess: () => {
      setSubscription(null);
      toast.success("Push notifications disabled");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const testMut = useMutation({
    mutationFn: sendTestPush,
    onSuccess: (d) => toast.success(`Test sent to ${d.sent} subscriber(s)`),
    onError: (e: Error) => toast.error(e.message),
  });

  const checkExisting = async () => {
    setChecking(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      setSubscription(sub);
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="space-y-4 max-w-lg">
      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Bell className="w-4 h-4 text-primary" /> Push notifications
          </CardTitle>
          <CardDescription>
            Receive medication reminders directly in your browser, even when the tab is closed.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!supported && (
            <div className="flex gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              Push notifications are not supported in this browser.
            </div>
          )}

          {supported && (
            <>
              <div className="flex items-center gap-3">
                <div className={`w-2.5 h-2.5 rounded-full ${subscription ? "bg-primary animate-pulse-soft" : "bg-muted-foreground/30"}`} />
                <span className="text-sm">
                  {subscription ? "Subscribed — reminders will appear as notifications" : "Not subscribed"}
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {!subscription ? (
                  <>
                    <Button
                      onClick={() => subscribeMut.mutate()}
                      disabled={subscribeMut.isPending || checking}
                      className="gap-1"
                    >
                      {subscribeMut.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Bell className="w-4 h-4" />
                      )}
                      Enable notifications
                    </Button>
                    <Button variant="outline" onClick={checkExisting} disabled={checking}>
                      {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : "Check existing subscription"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      variant="outline"
                      onClick={() => testMut.mutate()}
                      disabled={testMut.isPending}
                      className="gap-1"
                    >
                      {testMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
                      Send test
                    </Button>
                    <Button
                      variant="ghost"
                      className="gap-1 text-destructive hover:text-destructive"
                      onClick={() => unsubMut.mutate()}
                      disabled={unsubMut.isPending}
                    >
                      <X className="w-4 h-4" /> Disable
                    </Button>
                  </>
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft bg-secondary/40 border-dashed">
        <CardContent className="py-4 text-sm text-muted-foreground space-y-1">
          <p className="font-medium text-foreground">How reminders work</p>
          <p>The backend checks every minute for scheduled doses. When a dose is due, a push notification is sent to all subscribed browsers.</p>
          <p>The AI agent (watsonx) analyses your adherence weekly every Sunday at 2 AM and stores personalised recommendations.</p>
        </CardContent>
      </Card>
    </div>
  );
}

// ── Dashboard (root) ────────────────────────────────────────────────────────

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-background/70 border-b border-border/60">
        <nav className="container flex items-center justify-between h-16">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-semibold">
            <span className="w-8 h-8 rounded-full bg-gradient-sage grid place-items-center shadow-soft">
              <Heart className="w-4 h-4 text-primary-foreground" fill="currentColor" />
            </span>
            Hearthside
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
              <LogOut className="w-4 h-4" /> Back to home
            </Button>
          </Link>
        </nav>
      </header>

      {/* Main */}
      <main className="container py-8 max-w-3xl">
        <div className="mb-8">
          <h1 className="font-display text-3xl font-semibold">My medications</h1>
          <p className="text-muted-foreground mt-1">Manage your schedule, log doses, and review AI insights.</p>
        </div>

        <Tabs defaultValue="medications" className="space-y-6">
          <TabsList className="grid grid-cols-4 w-full">
            <TabsTrigger value="medications" className="gap-1.5">
              <Pill className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Medications</span>
            </TabsTrigger>
            <TabsTrigger value="today" className="gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Today</span>
            </TabsTrigger>
            <TabsTrigger value="ai" className="gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">AI Insights</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-1.5">
              <Bell className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Alerts</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="medications">
            <MedicationsTab />
          </TabsContent>
          <TabsContent value="today">
            <TodayTab />
          </TabsContent>
          <TabsContent value="ai">
            <AiTab />
          </TabsContent>
          <TabsContent value="notifications">
            <NotificationsTab />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
