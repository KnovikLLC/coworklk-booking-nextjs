import { requireUser } from "@/lib/auth/require-user";
import { ProfileSettingsForm } from "@/components/member/ProfileSettingsForm";

export const metadata = { title: "Account Settings | Cowork.lk", robots: { index: false, follow: false } };

export default async function ProfileSettingsPage() {
  const { user, supabase } = await requireUser();
  const { data: profile } = await supabase
    .from("users")
    .select("full_name, phone")
    .eq("id", user.id)
    .single();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-brand-dark">Account Settings</h1>
      <p className="mb-6 text-sm text-brand-dark/50">Manage your profile information and password.</p>
      <ProfileSettingsForm
        email={user.email ?? ""}
        fullName={profile?.full_name ?? null}
        phone={profile?.phone ?? null}
      />
    </div>
  );
}
