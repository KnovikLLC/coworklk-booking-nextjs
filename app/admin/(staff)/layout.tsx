import { AdminNav } from "@/components/admin/AdminNav";

export default function AdminStaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30">
      <AdminNav />
      <div className="mx-auto max-w-7xl px-4 py-6">{children}</div>
    </div>
  );
}
