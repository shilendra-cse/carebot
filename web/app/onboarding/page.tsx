'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/use-auth';
import { healthApi } from '@/lib/api';
import { updateStoredUser } from '@/lib/auth-client';
import { getErrorMessage } from '@/lib/error';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import {
  Bot,
  ArrowRight,
  ArrowLeft,
  Plus,
  X,
  Loader2,
  Heart,
  Pill,
  ShieldAlert,
  User,
  Check,
} from 'lucide-react';

const STEPS = [
  { id: 'profile', label: 'Health Profile', icon: User },
  { id: 'conditions', label: 'Conditions', icon: Heart },
  { id: 'medications', label: 'Medications', icon: Pill },
  { id: 'allergies', label: 'Allergies', icon: ShieldAlert },
] as const;

const GENDER_OPTIONS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];
const BLOOD_TYPE_OPTIONS = [
  'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'Unknown',
];
const SEVERITY_OPTIONS = ['Mild', 'Moderate', 'Severe'];

interface ConditionEntry {
  condition: string;
  treatment: string;
}

interface MedicationEntry {
  name: string;
  dosage: string;
  frequency: string;
}

interface AllergyEntry {
  allergen: string;
  severity: string;
}

function ProgressBar({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className="flex flex-1 items-center gap-2">
          <div
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-semibold transition-colors ${
              i < current
                ? 'bg-primary text-primary-foreground'
                : i === current
                  ? 'bg-primary text-primary-foreground ring-2 ring-primary/30 ring-offset-2 ring-offset-background'
                  : 'bg-muted text-muted-foreground'
            }`}
          >
            {i < current ? <Check className="h-4 w-4" /> : i + 1}
          </div>
          {i < total - 1 && (
            <div
              className={`hidden h-0.5 flex-1 rounded-full sm:block ${
                i < current ? 'bg-primary' : 'bg-muted'
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OnboardingPage() {
  const { refreshUser, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Step 1: Profile
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [gender, setGender] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [bloodType, setBloodType] = useState('');

  // Step 2: Conditions
  const [conditions, setConditions] = useState<ConditionEntry[]>([]);

  // Step 3: Medications
  const [medications, setMedications] = useState<MedicationEntry[]>([]);

  // Step 4: Allergies
  const [allergies, setAllergies] = useState<AllergyEntry[]>([]);

  const profileValid = dateOfBirth || gender;

  function addCondition() {
    setConditions((prev) => [...prev, { condition: '', treatment: '' }]);
  }
  function removeCondition(idx: number) {
    setConditions((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateCondition(
    idx: number,
    field: keyof ConditionEntry,
    value: string
  ) {
    setConditions((prev) =>
      prev.map((c, i) => (i === idx ? { ...c, [field]: value } : c))
    );
  }

  function addMedication() {
    setMedications((prev) => [
      ...prev,
      { name: '', dosage: '', frequency: '' },
    ]);
  }
  function removeMedication(idx: number) {
    setMedications((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateMedication(
    idx: number,
    field: keyof MedicationEntry,
    value: string
  ) {
    setMedications((prev) =>
      prev.map((m, i) => (i === idx ? { ...m, [field]: value } : m))
    );
  }

  function addAllergy() {
    setAllergies((prev) => [...prev, { allergen: '', severity: '' }]);
  }
  function removeAllergy(idx: number) {
    setAllergies((prev) => prev.filter((_, i) => i !== idx));
  }
  function updateAllergy(
    idx: number,
    field: keyof AllergyEntry,
    value: string
  ) {
    setAllergies((prev) =>
      prev.map((a, i) => (i === idx ? { ...a, [field]: value } : a))
    );
  }

  function nextStep() {
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }
  function prevStep() {
    setStep((s) => Math.max(s - 1, 0));
  }

  async function handleComplete() {
    setSubmitting(true);
    try {
      const payload = {
        profile: {
          dateOfBirth: dateOfBirth || undefined,
          gender: gender || undefined,
          height: height.trim() || undefined,
          weight: weight.trim() || undefined,
          bloodType: bloodType || undefined,
        },
        conditions: conditions.filter((c) => c.condition.trim()),
        meds: medications.filter(
          (m) => m.name.trim() && m.dosage.trim() && m.frequency.trim()
        ),
        userAllergies: allergies.filter((a) => a.allergen.trim()),
      };

      await healthApi.completeOnboarding(payload);
      updateStoredUser({ onboardingCompleted: true });
      refreshUser();
      toast.success('Welcome to CareBot!');
      router.replace('/dashboard');
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, 'Failed to complete onboarding'));
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col px-4 py-8 sm:px-6">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary">
            <Bot className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            Welcome to CareBot
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Let&apos;s set up your health profile so we can better assist you.
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <ProgressBar current={step} total={STEPS.length} />
          <div className="mt-3 flex items-center justify-center gap-2">
            {(() => {
              const StepIcon = STEPS[step].icon;
              return <StepIcon className="h-4 w-4 text-primary" />;
            })()}
            <span className="text-sm font-medium">{STEPS[step].label}</span>
            <span className="text-xs text-muted-foreground">
              ({step + 1} of {STEPS.length})
            </span>
          </div>
        </div>

        {/* Step content */}
        <Card className="flex-1">
          <CardContent className="p-6">
            {step === 0 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold">Health Profile</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    This helps the AI give you personalized health advice.
                    Please fill in at least your date of birth or gender.
                  </p>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="dob"
                    className="text-sm font-medium"
                  >
                    Date of Birth
                  </label>
                  <Input
                    id="dob"
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Gender</label>
                  <div className="flex flex-wrap gap-2">
                    {GENDER_OPTIONS.map((g) => (
                      <button
                        key={g}
                        type="button"
                        onClick={() => setGender(gender === g ? '' : g)}
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                          gender === g
                            ? 'border-primary bg-primary/10 font-medium text-primary'
                            : 'border-border bg-card text-foreground hover:bg-muted'
                        }`}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <label htmlFor="height" className="text-sm font-medium">
                      Height
                    </label>
                    <Input
                      id="height"
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g. 178 cm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="weight" className="text-sm font-medium">
                      Weight
                    </label>
                    <Input
                      id="weight"
                      value={weight}
                      onChange={(e) => setWeight(e.target.value)}
                      placeholder="e.g. 75 kg"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Blood Type</label>
                  <div className="flex flex-wrap gap-2">
                    {BLOOD_TYPE_OPTIONS.map((bt) => (
                      <button
                        key={bt}
                        type="button"
                        onClick={() =>
                          setBloodType(bloodType === bt ? '' : bt)
                        }
                        className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                          bloodType === bt
                            ? 'border-primary bg-primary/10 font-medium text-primary'
                            : 'border-border bg-card text-foreground hover:bg-muted'
                        }`}
                      >
                        {bt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold">
                    Existing Conditions
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add any diagnosed conditions or past medical history. You
                    can skip this step if you have none.
                  </p>
                </div>

                {conditions.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <Heart className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-40" />
                    <p className="mb-3 text-sm text-muted-foreground">
                      No conditions added yet.
                    </p>
                    <Button variant="outline" size="sm" onClick={addCondition}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add condition
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {conditions.map((c, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg border p-3"
                      >
                        <div className="grid flex-1 gap-2 sm:grid-cols-2">
                          <Input
                            placeholder="Condition name"
                            value={c.condition}
                            onChange={(e) =>
                              updateCondition(i, 'condition', e.target.value)
                            }
                            autoFocus={i === conditions.length - 1}
                          />
                          <Input
                            placeholder="Treatment (optional)"
                            value={c.treatment}
                            onChange={(e) =>
                              updateCondition(i, 'treatment', e.target.value)
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeCondition(i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addCondition}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add another
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold">
                    Current Medications
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    List the medications you&apos;re currently taking. You can
                    skip this step and add them later.
                  </p>
                </div>

                {medications.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <Pill className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-40" />
                    <p className="mb-3 text-sm text-muted-foreground">
                      No medications added yet.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addMedication}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add medication
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {medications.map((m, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg border p-3"
                      >
                        <div className="grid flex-1 gap-2 sm:grid-cols-3">
                          <Input
                            placeholder="Medication name"
                            value={m.name}
                            onChange={(e) =>
                              updateMedication(i, 'name', e.target.value)
                            }
                            autoFocus={i === medications.length - 1}
                          />
                          <Input
                            placeholder="Dosage (e.g. 10mg)"
                            value={m.dosage}
                            onChange={(e) =>
                              updateMedication(i, 'dosage', e.target.value)
                            }
                          />
                          <Input
                            placeholder="Frequency"
                            value={m.frequency}
                            onChange={(e) =>
                              updateMedication(i, 'frequency', e.target.value)
                            }
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeMedication(i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addMedication}
                    >
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add another
                    </Button>
                  </div>
                )}
              </div>
            )}

            {step === 3 && (
              <div className="space-y-5">
                <div>
                  <h2 className="text-lg font-semibold">Known Allergies</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Add any allergies so CareBot can account for them. You can
                    skip this step and add them later.
                  </p>
                </div>

                {allergies.length === 0 ? (
                  <div className="rounded-lg border border-dashed p-6 text-center">
                    <ShieldAlert className="mx-auto mb-2 h-8 w-8 text-muted-foreground opacity-40" />
                    <p className="mb-3 text-sm text-muted-foreground">
                      No allergies added yet.
                    </p>
                    <Button variant="outline" size="sm" onClick={addAllergy}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add allergy
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {allergies.map((a, i) => (
                      <div
                        key={i}
                        className="flex items-start gap-2 rounded-lg border p-3"
                      >
                        <div className="grid flex-1 gap-2 sm:grid-cols-2">
                          <Input
                            placeholder="Allergen (e.g. Penicillin)"
                            value={a.allergen}
                            onChange={(e) =>
                              updateAllergy(i, 'allergen', e.target.value)
                            }
                            autoFocus={i === allergies.length - 1}
                          />
                          <select
                            value={a.severity}
                            onChange={(e) =>
                              updateAllergy(i, 'severity', e.target.value)
                            }
                            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                          >
                            <option value="">Severity (optional)</option>
                            {SEVERITY_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                          onClick={() => removeAllergy(i)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <Button variant="outline" size="sm" onClick={addAllergy}>
                      <Plus className="mr-1.5 h-3.5 w-3.5" />
                      Add another
                    </Button>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation buttons */}
        <div className="mt-6 flex items-center justify-between">
          <div>
            {step > 0 && (
              <Button variant="ghost" onClick={prevStep} disabled={submitting}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            )}
          </div>

          <div className="flex gap-2">
            {step > 0 && step < STEPS.length - 1 && (
              <Button variant="outline" onClick={nextStep}>
                Skip
              </Button>
            )}

            {step === 0 && (
              <Button onClick={nextStep} disabled={!profileValid}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step > 0 && step < STEPS.length - 1 && (
              <Button onClick={nextStep}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}

            {step === STEPS.length - 1 && (
              <>
                <Button
                  variant="outline"
                  onClick={handleComplete}
                  disabled={submitting}
                >
                  Skip &amp; Finish
                </Button>
                <Button onClick={handleComplete} disabled={submitting}>
                  {submitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      Complete
                      <Check className="ml-2 h-4 w-4" />
                    </>
                  )}
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
