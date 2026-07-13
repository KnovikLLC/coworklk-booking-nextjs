import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Admin Sign In | Cowork.lk", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <h1 className="text-2xl font-bold text-brand-dark">
        Cowork<span className="text-brand">.lk</span> Admin
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">Sign in to the staff dashboard.</p>
      <div className="mt-6">
        <Suspense>
          <LoginForm defaultRedirect="/admin/dashboard" />
        </Suspense>
      </div>
    </main>
  );
}
