"use client";

import type { ShopDashboardResponse } from "../types/dashboard";
import { DashboardChart } from "./dashboard-chart/dashboard-chart";
import { RecentMaintenanceCard } from "./recent-maintenance-card";
import { StatCard } from "./stat-card";
import { Car, DollarSign, Users } from "lucide-react";
import { USER_ROLE } from "@/shared/constants/role";

/**
 * Props型定義
 */
interface ShopDashboardProps {
  /** ショップ用ダッシュボード初期化レスポンスデータ */
  data: ShopDashboardResponse;
}

/**
 * ショップロール用ダッシュボードコンポーネント
 *
 * @component
 */
export function ShopDashboard({ data }: ShopDashboardProps) {
  const { managedVehicles, monthlySales, linkedCustomerCount } = data;

  return (
    <div className="space-y-6">
      {/* 統計カードエリア */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* 管理車両数カード */}
        <StatCard
          title="管理車両数"
          value={`${managedVehicles.total}台`}
          subtitle={`自社: ${managedVehicles.own}台 / 顧客: ${managedVehicles.customer}台`}
          icon={Car}
        />
        {/* 今月売上カード */}
        <StatCard
          title="今月売上"
          value={`¥${monthlySales.toLocaleString()}`}
          subtitle="今月の整備売上合計"
          icon={DollarSign}
        />
        {/* 連携顧客数カード */}
        <StatCard
          title="連携顧客数"
          value={`${linkedCustomerCount}人`}
          subtitle="マイショップ登録顧客"
          icon={Users}
        />
      </div>

      {/* メインコンテンツエリア */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* 整備件数推移グラフコンポーネント */}
        <div className="lg:col-span-4">
          <DashboardChart
            title="整備件数推移"
            initialChart={data.maintenanceCountChart}
            valueType="count"
            totalLabel="整備件数"
          />
        </div>
        {/* 最近の整備履歴カードコンポーネント */}
        <div className="lg:col-span-3">
          <RecentMaintenanceCard
            maintenances={data.recentMaintenances}
            role={USER_ROLE.SHOP}
          />
        </div>
      </div>
    </div>
  );
}
