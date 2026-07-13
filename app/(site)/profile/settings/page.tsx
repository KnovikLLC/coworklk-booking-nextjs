import { requireUser } from "@/lib/auth/require-user";
import { ProfileNav } from "@/components/member/ProfileNav";
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
    <main className="mx-auto max-w-3xl px-4 py-10">
      <ProfileNav />
      <h1 className="mb-4 text-xl font-bold text-brand-dark">Account Settings</h1>
      <ProfileSettingsForm
        email={user.email ?? ""}
        fullName={profile?.full_name ?? null}
        phone={profile?.phone ?? null}
      />
    </main>
  );
}
