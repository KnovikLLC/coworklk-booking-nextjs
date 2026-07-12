"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

const profileSchema = z.object({
  fullName: z.string().min(2, "Enter your full name"),
  phone: z.string().min(9, "Enter a valid phone number").optional().or(z.literal("")),
});
type ProfileInput = z.infer<typeof profileSchema>;

const passwordSchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});
type PasswordInput = z.infer<typeof passwordSchema>;

export function ProfileSettingsForm({
  email,
  fullName,
  phone,
}: {
  email: string;
  fullName: string | null;
  phone: string | null;
}) {
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

  const profileForm = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues: { fullName: fullName ?? "", phone: phone ?? "" },
  });

  const passwordForm = useForm<PasswordInput>({ resolver: zodResolver(passwordSchema) });

  async function onSaveProfile(values: ProfileInput) {
    setSavingProfile(true);
    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from("users")
        .update({ full_name: values.fullName, phone: values.phone || null })
        .eq("id", user.id);

      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Profile updated");
    } finally {
      setSavingProfile(false);
    }
  }

  async function onChangePassword(values: PasswordInput) {
    setSavingPassword(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success("Password updated");
      passwordForm.reset();
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="mb-3 font-semibold text-brand-dark">Profile Information</h2>
        <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="max-w-sm space-y-3">
          <div>
            <Label>Email</Label>
            <Input value={email} disabled />
          </div>
          <div>
            <Label htmlFor="fullName">Full Name</Label>
            <Input id="fullName" {...profileForm.register("fullName")} />
            {profileForm.formState.errors.fullName ? (
              <p className="mt-1 text-xs text-destructive">
                {profileForm.formState.errors.fullName.message}
              </p>
            ) : null}
          </div>
          <div>
            <Label htmlFor="phone">Phone</Label>
            <Input id="phone" type="tel" {...profileForm.register("phone")} />
          </div>
          <Button type="submit" disabled={savingProfile}>
            {savingProfile ? "Saving..." : "Save Changes"}
          </Button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-semibold text-brand-dark">Change Password</h2>
        <form onSubmit={passwordForm.handleSubmit(onChangePassword)} className="max-w-sm space-y-3">
          <div>
            <Label htmlFor="newPassword">New Password</Label>
            <Input id="newPassword" type="password" {...passwordForm.register("password")} />
            {passwordForm.formState.errors.password ? (
              <p className="mt-1 text-xs text-destructive">
                {passwordForm.formState.errors.password.message}
              </p>
            ) : null}
          </div>
          <Button type="submit" disabled={savingPassword}>
            {savingPassword ? "Updating..." : "Update Password"}
          </Button>
        </form>
      </section>
    </div>
  );
}
