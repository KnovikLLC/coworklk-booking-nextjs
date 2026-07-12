import { createClient } from "@/lib/supabase/server";
import { getActiveSpaces } from "@/lib/data/spaces";
import { SpaceCard } from "@/components/booking/SpaceCard";

export const metadata = {
  title: "Book a Space | Cowork.lk",
};

export default async function BookingPage() {
  const supabase = createClient();
  const spaces = await getActiveSpaces(supabase);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-brand-dark">Book a Space</h1>
        <p className="mt-2 text-muted-foreground">
          Choose a space, pick a date and time, and book instantly.
        </p>
      </div>

      {spaces.length === 0 ? (
        <p className="text-muted-foreground">No spaces available right now.</p>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {spaces.map((space) => (
            <SpaceCard key={space.id} space={space} />
          ))}
        </div>
      )}
    </main>
  );
}
