import { requireUser } from "@/lib/auth/require-user";
import { getUserBookings } from "@/lib/data/bookings";
import { checkMemberDiscount } from "@/lib/pricing/discount";
import { MemberDashboard } from "@/components/member/MemberDashboard";

export const metadata = { title: "My Account | Cowork.lk", robots: { index: false, follow: false } };

export default async function ProfilePage() {
  const { user, supabase } = await requireUser();

  const [{ data: profile }, bookings] = await Promise.all([
    supabase
      .from("users")
      .select("full_name, member_since, total_bookings, total_spent")
      .eq("id", user.id)
      .single(),
    getUserBookings(supabase, user.id),
  ]);

  const discount = await checkMemberDiscount(supabase, user.id, null, 0);

  return (
    <MemberDashboard
      email={user.email ?? ""}
      fullName={profile?.full_name ?? null}
      memberSince={profile?.member_since ?? null}
      totalBookings={profile?.total_bookings ?? 0}
      totalSpent={Number(profile?.total_spent ?? 0)}
      discount={discount}
      bookings={bookings}
    />
  );
}
