import { requireApprovedAuth } from "@/lib/auth-guard";
import { CustomerDashboardView } from "@/components/dashboard/CustomerDashboardView";

export default async function DashboardPage() {
  const user = await requireApprovedAuth();
  return (
    <main className="py-2 sm:py-4">
      <CustomerDashboardView />
    </main>
  );
}
