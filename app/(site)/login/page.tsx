import Link from "next/link";
import { Suspense } from "react";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = { title: "Sign In | Cowork.lk" };

export default function LoginPage() {
  return (
    <main className="mx-auto flex max-w-md flex-col px-4 py-16">
      <h1 className="text-2xl font-bold text-brand-dark">Sign In</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Sign in to view your bookings and get your member discount.
      </p>
      <div className="mt-6">
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
      <div className="mt-6 flex justify-between text-sm">
        <Link href="/signup" className="text-brand hover:underline">
          Create an account
        </Link>
        <Link href="/forgot-password" className="text-muted-foreground hover:underline">
          Forgot password?
        </Link>
      </div>
    </main>
  );
}
