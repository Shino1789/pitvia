"use client";

import type { OwnerDashboardResponse } from "../types/dashboard";
import { DashboardChart } from "./dashboard-chart/dashboard-chart";
import { RecentMaintenanceCard } from "./recent-maintenance-card";
import { StatCard } from "./stat-card";
import { Car, Wrench, Store } from "lucide-react";
import { USER_ROLE } from "@/shared/constants/role";

/**
 * Props型定義
 */
interface OwnerDashboardProps {
  /** オーナー用ダッシュボード初期化レスポンスデータ */
  data: OwnerDashboardResponse;
}

/**
 * オーナーロール用ダッシュボードコンポーネント
 *
 * @component
 */
export function OwnerDashboard({ data }: OwnerDashboardProps) {
  return (
    <div className="space-y-6">
      {/* 統計カードエリア */}
      <div className="grid gap-4 md:grid-cols-3">
        {/* 登録車両数カード */}
        <StatCard
          title="登録車両"
          value={`${data.vehicleCount}台`}
          subtitle="マイカー・所有車両"
          icon={Car}
        />
        {/* 整備履歴数カード */}
        <StatCard
          title="整備履歴"
          value={`${data.maintenanceCount}件`}
          subtitle="これまでの累計整備数"
          icon={Wrench}
        />
        {/* 連携ショップ数カード */}
        <StatCard
          title="連携ショップ"
          value={`${data.linkedShopCount}店舗`}
          subtitle="マイショップ登録済み"
          icon={Store}
        />
      </div>

      {/* メインコンテンツエリア */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* 整備費用推移グラフコンポーネント */}
        <div className="lg:col-span-4">
          <DashboardChart
            title="整備費用推移"
            initialChart={data.maintenanceCostChart}
            valueType="currency"
            totalLabel="合計費用"
          />
        </div>
        {/* 最近の整備履歴カードコンポーネント */}
        <div className="lg:col-span-3">
          <RecentMaintenanceCard
            maintenances={data.recentMaintenances}
            role={USER_ROLE.OWNER}
          />
        </div>
      </div>
    </div>
  );
}
