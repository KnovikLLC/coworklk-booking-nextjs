import { LocationLanding, locationMetadata } from "@/components/seo/LocationLanding";
import { getLocationPage } from "@/lib/seo/locations";

const page = getLocationPage("coworking-space-pannipitiya");

export const metadata = locationMetadata(page);
// Prices come from the live pricing table; refresh hourly.
export const revalidate = 3600;

export default function Page() {
  return <LocationLanding page={page} />;
}
