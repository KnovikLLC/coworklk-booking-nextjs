"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

const schema = z.object({ password: z.string().min(8, "Password must be at least 8 characters") });
type FormInput = z.infer<typeof schema>;

// Doc §8.5 mockup: shown after a guest checkout to prompt account creation.
export function ConvertGuestPrompt({ email, bookingId }: { email: string; bookingId: string }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormInput>({ resolver: zodResolver(schema) });

  async function onSubmit(values: FormInput) {
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/convert-guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password: values.password, bookingId }),
      });
      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error ?? "Could not create account");
        return;
      }

      toast.success(data.message ?? "Account created!");
      router.refresh();
      setDismissed(true);
    } finally {
      setSubmitting(false);
    }
  }

  if (dismissed) return null;

  return (
    <Card className="mt-6 border-brand/30 bg-brand/5">
      <CardHeader>
        <h2 className="font-semibold text-brand-dark">🎁 Create an account &amp; get 10% off your next booking</h2>
      </CardHeader>
      <CardContent>
        <ul className="mb-4 space-y-1 text-sm text-muted-foreground">
          <li>✓ 10% discount on your next booking (within 30 days)</li>
          <li>✓ View your booking history</li>
          <li>✓ Faster checkout with saved details</li>
        </ul>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
          <div>
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
          <div>
            <Label htmlFor="convertPassword">Password</Label>
            <Input id="convertPassword" type="password" {...register("password")} />
            {errors.password ? (
              <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button type="submit" disabled={submitting}>
              {submitting ? "Creating..." : "Create Account"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setDismissed(true)}>
              Maybe Later
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
