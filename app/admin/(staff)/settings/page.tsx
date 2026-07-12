import { ZohoSyncPanel } from "@/components/admin/ZohoSyncPanel";

export const metadata = { title: "Admin Settings | Cowork.lk" };

export default function AdminSettingsPage() {
  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold text-brand-dark">Settings</h1>
      <ZohoSyncPanel />
    </div>
  );
}
