import { Car, Wallet, Users } from "lucide-react";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { DashboardChart } from "@/features/dashboard/components/dashboard-chart";
import { RecentMaintenanceCard } from "@/features/dashboard/components/recent-maintenance-card";
import type { ShopDashboardResponse } from "@/features/dashboard/types/dashboard";

interface ShopDashboardProps {
  data: ShopDashboardResponse;
}

export function ShopDashboard({ data }: ShopDashboardProps) {
  const { managedVehicles } = data;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="管理車両数"
          value={managedVehicles.total}
          subtitle={
            <span className="text-muted-foreground">
              自分{" "}
              <span className="font-medium text-foreground">
                {managedVehicles.own}
              </span>
              <span className="mx-1.5 text-border">・</span>
              顧客{" "}
              <span className="font-medium text-foreground">
                {managedVehicles.customer}
              </span>
            </span>
          }
          icon={Car}
        />
        <StatCard
          title="今月売上"
          value={`¥${data.monthlySales.toLocaleString()}`}
          subtitle="+¥46,000（先月比 +12%）"
          icon={Wallet}
        />
        <StatCard
          title="連携顧客数"
          value={data.linkedCustomerCount}
          subtitle="先月比 -1名"
          subtitleColor="destructive"
          icon={Users}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <DashboardChart
            title="整備件数推移"
            chart={data.maintenanceCountChart}
            valueType="count"
            totalLabel="総件数"
          />
        </div>
        <div className="lg:col-span-1">
          <RecentMaintenanceCard
            items={data.recentMaintenances}
            variant="shop"
          />
        </div>
      </div>
    </>
  );
}
