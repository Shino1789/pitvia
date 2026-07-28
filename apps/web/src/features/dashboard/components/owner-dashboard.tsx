import { Car, Wrench, Store } from "lucide-react";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { DashboardChart } from "@/features/dashboard/components/dashboard-chart";
import { RecentMaintenanceCard } from "@/features/dashboard/components/recent-maintenance-card";
// lib の型ではなく、features の本番型をインポート
import type { OwnerDashboardResponse } from "@/features/dashboard/types/dashboard";

interface OwnerDashboardProps {
  data: OwnerDashboardResponse; // ← ここを変更
}

export function OwnerDashboard({ data }: OwnerDashboardProps) {
  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <StatCard
          title="登録車両数"
          value={data.vehicleCount}
          subtitle="+1 今月追加"
          icon={Car}
        />
        <StatCard
          title="整備履歴総数"
          value={data.maintenanceCount}
          subtitle="+8 今月追加"
          icon={Wrench}
        />
        <StatCard
          title="連携ショップ数"
          value={data.linkedShopCount}
          subtitle="+1 今月追加"
          icon={Store}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          {/* costChart ではなく maintenanceCostChart 全体を渡すように変更 */}
          <DashboardChart
            title="整備費用推移"
            chart={data.maintenanceCostChart} // ← バックエンド型に統一
            valueType="currency"
            totalLabel="総額"
          />
        </div>
        <div className="lg:col-span-1">
          <RecentMaintenanceCard
            items={data.recentMaintenances}
            variant="owner"
          />
        </div>
      </div>
    </>
  );
}
