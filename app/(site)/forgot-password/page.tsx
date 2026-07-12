import Link from "next/link";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";

export const metadata = { title: "Reset Password | Cowork.lk" };

export default function ForgotPasswordPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-2xl font-bold text-brand-dark">Reset Password</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email and we&apos;ll send you a link to reset your password.
      </p>
      <div className="mt-6">
        <ForgotPasswordForm />
      </div>
      <div className="mt-6 text-sm">
        <Link href="/login" className="text-brand hover:underline">
          Back to sign in
        </Link>
      </div>
    </main>
  );
}
