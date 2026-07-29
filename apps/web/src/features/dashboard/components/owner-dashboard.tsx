"use client";

import type { OwnerDashboardResponse } from "../types/dashboard";
import { DashboardChart } from "./dashboard-chart/dashboard-chart";
import { RecentMaintenanceCard } from "./recent-maintenance-card";
import { StatCard } from "./stat-card";
import { Car, Wrench, Store } from "lucide-react";

interface OwnerDashboardProps {
  /** オーナー用ダッシュボード初期データ */
  data: OwnerDashboardResponse;
}

/**
 * オーナー（個人ユーザー）用ダッシュボードコンポーネント
 *
 * @component
 */
export function OwnerDashboard({ data }: OwnerDashboardProps) {
  return (
    <div className="space-y-6">
      {/* 統計カードグループ */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="登録車両"
          value={`${data.vehicleCount}台`}
          subtitle="マイカー・所有車両"
          icon={Car}
        />
        <StatCard
          title="整備履歴"
          value={`${data.maintenanceCount}件`}
          subtitle="これまでの累計整備数"
          icon={Wrench}
        />
        <StatCard
          title="連携ショップ"
          value={`${data.linkedShopCount}店舗`}
          subtitle="マイショップ登録済み"
          icon={Store}
        />
      </div>

      {/* メインコンテンツ（グラフ & 最近の整備） */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <DashboardChart
            title="整備費用推移"
            initialChart={data.maintenanceCostChart}
            valueType="currency"
            totalLabel="合計費用"
          />
        </div>
        <div className="lg:col-span-3">
          <RecentMaintenanceCard
            maintenances={data.recentMaintenances}
            variant="owner"
          />
        </div>
      </div>
    </div>
  );
}
