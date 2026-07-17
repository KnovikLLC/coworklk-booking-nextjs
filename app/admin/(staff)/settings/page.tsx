import { ZohoSyncPanel } from "@/components/admin/ZohoSyncPanel";
import { HolidaysPanel } from "@/components/admin/HolidaysPanel";

export const metadata = { title: "Admin Settings | Cowork.lk" };

export default function AdminSettingsPage() {
  return (
    <div className="space-y-4">
      <h1 className="mb-4 text-2xl font-bold text-brand-dark">Settings</h1>
      <ZohoSyncPanel />
      <HolidaysPanel />
    </div>
  );
}
