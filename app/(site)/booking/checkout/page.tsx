import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getActiveSpaceById } from "@/lib/data/spaces";
import { getActiveAddons } from "@/lib/data/addons";
import { CheckoutForm } from "@/components/booking/CheckoutForm";

export const metadata = { title: "Checkout | Cowork.lk" };

export default async function CheckoutPage({
  searchParams,
}: {
  searchParams: { space_id?: string; pricing_id?: string; date?: string; slot?: string };
}) {
  const { space_id, pricing_id, date, slot } = searchParams;
  if (!space_id || !pricing_id || !date || !slot) {
    redirect("/booking");
  }

  const supabase = createClient();
  const [space, addons] = await Promise.all([
    getActiveSpaceById(supabase, space_id),
    getActiveAddons(supabase),
  ]);

  const pricing = space?.pricing.find((p) => p.id === pricing_id);
  if (!space || !pricing) {
    redirect("/booking");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-2xl font-bold text-brand-dark">Checkout</h1>
      <CheckoutForm
        space={space}
        pricing={pricing}
        date={date}
        slot={slot}
        addons={addons}
        userEmail={user?.email ?? null}
      />
    </main>
  );
}
