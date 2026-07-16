import { ProfileNav } from "@/components/member/ProfileNav";

export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-4xl px-4 py-10 md:py-14">
      <ProfileNav />
      {children}
    </main>
  );
}
