"use client";

import type { ShopDashboardResponse } from "../types/dashboard";
import { DashboardChart } from "./dashboard-chart/dashboard-chart";
import { RecentMaintenanceCard } from "./recent-maintenance-card";
import { StatCard } from "./stat-card";
import { Car, DollarSign, Users } from "lucide-react";

interface ShopDashboardProps {
  /** ショップ用ダッシュボード初期データ */
  data: ShopDashboardResponse;
}

/**
 * ショップ（整備工場）用ダッシュボードコンポーネント
 *
 * @component
 */
export function ShopDashboard({ data }: ShopDashboardProps) {
  const { managedVehicles, monthlySales, linkedCustomerCount } = data;

  return (
    <div className="space-y-6">
      {/* 統計カードグループ */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCard
          title="管理車両数"
          value={`${managedVehicles.total}台`}
          subtitle={`自社: ${managedVehicles.own}台 / 顧客: ${managedVehicles.customer}台`}
          icon={Car}
        />
        <StatCard
          title="今月売上"
          value={`¥${monthlySales.toLocaleString()}`}
          subtitle="今月の整備売上合計"
          icon={DollarSign}
        />
        <StatCard
          title="連携顧客数"
          value={`${linkedCustomerCount}人`}
          subtitle="マイショップ登録顧客"
          icon={Users}
        />
      </div>

      {/* メインコンテンツ（グラフ & 最近の整備） */}
      <div className="grid gap-6 lg:grid-cols-7">
        <div className="lg:col-span-4">
          <DashboardChart
            title="整備件数推移"
            initialChart={data.maintenanceCountChart}
            valueType="count"
            totalLabel="整備件数"
          />
        </div>
        <div className="lg:col-span-3">
          <RecentMaintenanceCard
            maintenances={data.recentMaintenances}
            variant="shop"
          />
        </div>
      </div>
    </div>
  );
}
