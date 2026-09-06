import { requireApprovedAuth } from "@/lib/auth-guard";

export default async function DashboardPage() {
  const user = await requireApprovedAuth();
  return <main className="min-h-screen bg-[#f5e3cd] px-6 py-16 text-black"><div className="mx-auto max-w-4xl"><p className="text-sm font-bold uppercase tracking-[0.25em]">Approved access</p><h1 className="mt-4 font-outfit text-6xl font-black uppercase leading-none">Welcome, {user.name ?? user.email}</h1><div className="mt-10 rounded-3xl border-4 border-black bg-[#e5a00d] p-8 shadow-[8px_8px_0_#000]"><p className="text-xl font-bold">Your email and identity documents have been approved.</p><p className="mt-2">The application is now available to your account.</p></div></div></main>;
}
