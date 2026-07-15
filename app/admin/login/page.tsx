import { Suspense } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Admin Sign In | Cowork.lk", robots: { index: false, follow: false } };

export default function AdminLoginPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Home
      </Link>
      <h1 className="text-3xl font-bold text-brand-dark">
        Cowork<span className="text-brand">.lk</span> Admin
      </h1>
      <p className="mt-1 text-base text-muted-foreground">Sign in to the staff dashboard.</p>
      <div className="mt-6">
        <Suspense>
          <LoginForm defaultRedirect="/admin/dashboard" />
        </Suspense>
      </div>
    </main>
  );
}
