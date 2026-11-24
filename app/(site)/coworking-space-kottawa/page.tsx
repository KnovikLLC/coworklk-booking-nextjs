import { LocationLanding, locationMetadata } from "@/components/seo/LocationLanding";
import { getLocationPage } from "@/lib/seo/locations";

const page = getLocationPage("coworking-space-kottawa");

export const metadata = locationMetadata(page);
// Prices come from the live pricing table; refresh hourly.
export const revalidate = 3600;

// Called as a function rather than <LocationLanding />: it's an async server
// component, and the @types/react version in pnpm-lock (used by Vercel)
// rejects Promise-returning components in JSX.
export default async function Page() {
  return LocationLanding({ page });
}
