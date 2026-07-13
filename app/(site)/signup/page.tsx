import Link from "next/link";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata = { title: "Create Account | Cowork.lk", robots: { index: false, follow: false } };

export default function SignupPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-2xl font-bold text-brand-dark">Create Account</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Get a 10% discount on bookings made within 30 days of your last one.
      </p>
      <div className="mt-6">
        <SignupForm />
      </div>
      <div className="mt-6 text-sm">
        Already have an account?{" "}
        <Link href="/login" className="text-brand hover:underline">
          Sign in
        </Link>
      </div>
    </main>
  );
}
