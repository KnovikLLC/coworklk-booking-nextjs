"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { loginSchema, type LoginInput } from "@/lib/validation/auth.schema";

export function LoginForm({ defaultRedirect = "/profile" }: { defaultRedirect?: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginInput>({ resolver: zodResolver(loginSchema) });

  async function onSubmit(values: LoginInput) {
    setSubmitting(true);
    const supabase = createClient();
    const { error, data } = await supabase.auth.signInWithPassword(values);

    if (error) {
      setSubmitting(false);
      toast.error(error.message);
      return;
    }

    // Staff accounts (admin/frontdesk) don't have a customer profile —
    // send them to the admin dashboard regardless of where they signed in.
    let redirectTo = searchParams.get("redirect") ?? defaultRedirect;
    if (data.user) {
      const { data: profile } = await supabase.from("users").select("role").eq("id", data.user.id).single();
      if (profile && ["admin", "frontdesk"].includes(profile.role ?? "") && !redirectTo.startsWith("/admin")) {
        redirectTo = "/admin/login";
      }
    }

    setSubmitting(false);
    toast.success("Welcome back!");
    router.push(redirectTo);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" autoComplete="email" {...register("email")} />
        {errors.email ? <p className="mt-1 text-xs text-destructive">{errors.email.message}</p> : null}
      </div>
      <div>
        <Label htmlFor="password">Password</Label>
        <Input id="password" type="password" autoComplete="current-password" {...register("password")} />
        {errors.password ? (
          <p className="mt-1 text-xs text-destructive">{errors.password.message}</p>
        ) : null}
      </div>
      <Button type="submit" disabled={submitting} className="w-full">
        {submitting ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
