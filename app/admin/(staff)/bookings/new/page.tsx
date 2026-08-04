import { createClient } from "@/lib/supabase/server";
import { getActiveSpaces } from "@/lib/data/spaces";
import { getActiveAddons, getEveningFeeAmount } from "@/lib/data/addons";
import { CreateBookingForm } from "@/components/admin/CreateBookingForm";

export const metadata = { title: "New Booking | Cowork.lk Admin" };

export default async function AdminNewBookingPage() {
  const supabase = createClient();
  const [spaces, addons, eveningFeeAmount] = await Promise.all([
    getActiveSpaces(supabase),
    getActiveAddons(supabase),
    getEveningFeeAmount(supabase),
  ]);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-brand-dark">Create New Booking</h1>
      <CreateBookingForm spaces={spaces} addons={addons} eveningFeeAmount={eveningFeeAmount} />
    </div>
  );
}
