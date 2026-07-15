import type { Metadata } from "next";
import { AdminNav } from "@/components/admin/AdminNav";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
};

export default function AdminStaffLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <AdminNav />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-6">{children}</main>
      <footer className="border-t bg-white py-4 text-center text-xs text-muted-foreground mt-auto">
        <div className="mx-auto max-w-7xl px-4">
          &copy; {new Date().getFullYear()} Cowork Lanka (Pvt) Ltd. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
