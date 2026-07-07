"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Home, Loader2, ShieldAlert, Users } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";

const VULNERABILITY_OPTIONS = [
  "Elderly resident (65+)",
  "CPAP / medical device",
  "Young children",
  "Mobility limitations",
  "Well water / electric pump",
];

const CONCERN_OPTIONS = ["Power outages", "Wildfire", "Extreme heat", "Flooding"];

const steps = [
  { icon: Home, title: "Where is your home?", blurb: "We build the risk graph for your exact address." },
  { icon: Users, title: "Who lives here?", blurb: "Vulnerabilities change which risks matter most." },
  { icon: ShieldAlert, title: "What worries you?", blurb: "We'll check your worries against the data — and surface what you might be missing." },
];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState("");
  const [vulnerabilities, setVulnerabilities] = useState<string[]>([]);
  const [concerns, setConcerns] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canNext = step === 0 ? address.trim().length > 5 : true;
  const StepIcon = steps[step].icon;

  async function finish() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/households", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ address, concerns, vulnerabilities }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Could not save your home");
      router.push("/dashboard");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save your home");
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex flex-1 items-center justify-center px-4 py-16">
        <div className="w-full max-w-lg">
          <Progress value={((step + 1) / steps.length) * 100} className="mb-8 h-1.5" />
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 32 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -32 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="border-border/60">
                <CardContent className="p-8">
                  <span className="mb-5 flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400 ring-1 ring-emerald-400/30">
                    <StepIcon className="h-5 w-5" />
                  </span>
                  <h1 className="text-2xl font-bold tracking-tight">{steps[step].title}</h1>
                  <p className="mt-1.5 text-sm text-muted-foreground">{steps[step].blurb}</p>

                  <div className="mt-7">
                    {step === 0 && (
                      <div className="space-y-2">
                        <Label htmlFor="address">Street address</Label>
                        <Input
                          id="address"
                          autoFocus
                          placeholder="2847 38th Ave, Oakland, CA"
                          value={address}
                          onChange={(e) => setAddress(e.target.value)}
                          onKeyDown={(e) => e.key === "Enter" && canNext && setStep(1)}
                        />
                      </div>
                    )}
                    {step === 1 && (
                      <CheckboxGroup
                        options={VULNERABILITY_OPTIONS}
                        value={vulnerabilities}
                        onChange={setVulnerabilities}
                      />
                    )}
                    {step === 2 && (
                      <CheckboxGroup
                        options={CONCERN_OPTIONS}
                        value={concerns}
                        onChange={setConcerns}
                      />
                    )}
                  </div>

                  {error && <p className="mt-4 text-sm text-red-400">{error}</p>}

                  <div className="mt-8 flex items-center justify-between">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setStep((s) => Math.max(0, s - 1))}
                      className={step === 0 ? "invisible" : ""}
                    >
                      <ArrowLeft className="mr-1 h-4 w-4" /> Back
                    </Button>
                    {step < steps.length - 1 ? (
                      <Button
                        size="sm"
                        disabled={!canNext}
                        onClick={() => setStep((s) => s + 1)}
                        className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                      >
                        Continue <ArrowRight className="ml-1 h-4 w-4" />
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        disabled={submitting}
                        onClick={finish}
                        className="bg-emerald-500 text-emerald-950 hover:bg-emerald-400"
                      >
                        {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Build my risk graph
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function CheckboxGroup({
  options,
  value,
  onChange,
}: {
  options: string[];
  value: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <div className="space-y-3">
      {options.map((opt) => {
        const checked = value.includes(opt);
        return (
          <label
            key={opt}
            className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3.5 text-sm transition-colors ${
              checked
                ? "border-emerald-400/50 bg-emerald-500/10"
                : "border-border/60 hover:border-border"
            }`}
          >
            <Checkbox
              checked={checked}
              onCheckedChange={(c) =>
                onChange(c ? [...value, opt] : value.filter((v) => v !== opt))
              }
            />
            {opt}
          </label>
        );
      })}
    </div>
  );
}
