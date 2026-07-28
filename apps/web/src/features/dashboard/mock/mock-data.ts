import { MAINTENANCE_TYPE } from "@/shared/constants/maintenance-type";
import { PERIOD_TYPE } from "@/shared/constants/period";
import { USER_ROLE, type UserRole } from "@/shared/constants/role";
import { DASHBOARD_CHART_TYPE } from "@/features/dashboard/constants/dashboard-chart";
import type {
  ChartPoint,
  DashboardChartResponse,
  OwnerDashboardResponse,
  ShopDashboardResponse,
} from "@/features/dashboard/types/dashboard";

/**
 * モックデータ層。
 * 実装ではここが API レスポンス (OwnerDashboardResponse / ShopDashboardResponse) に置き換わる。
 */

// ---- ロール判定（モック） -------------------------------------------------

/** ログイン用のデモアカウントとロールのマッピング */
export const DEMO_ACCOUNTS: Record<string, UserRole> = {
  "owner@example.com": USER_ROLE.OWNER,
  "shop@example.com": USER_ROLE.SHOP,
};

/** メールアドレスからロールを判定（未知の場合は OWNER にフォールバック） */
export function resolveRoleByEmail(email: string): UserRole {
  return DEMO_ACCOUNTS[email.trim().toLowerCase()] ?? USER_ROLE.OWNER;
}

/** 文字列を UserRole に正規化（cookie 値の検証用） */
export function normalizeRole(value: string | undefined | null): UserRole {
  return value === USER_ROLE.SHOP ? USER_ROLE.SHOP : USER_ROLE.OWNER;
}

// ---- オーナー用ダッシュボード ---------------------------------------------

/** 月次：整備費用データ（12か月分） */
const ownerCostMonthly: ChartPoint[] = [
  {
    period: "2025-07",
    totalValue: 22000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 10000 },
      { category: MAINTENANCE_TYPE.INSPECTION, value: 2000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 5000 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 5000 },
    ],
  },
  {
    period: "2025-08",
    totalValue: 18000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 8000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 5000 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 5000 },
    ],
  },
  {
    period: "2025-09",
    totalValue: 85000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 5000 },
      { category: MAINTENANCE_TYPE.VEHICLE_INSPECTION, value: 70000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 5000 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 5000 },
    ],
  },
  {
    period: "2025-10",
    totalValue: 30000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 12000 },
      { category: MAINTENANCE_TYPE.INSPECTION, value: 3000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 10000 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 5000 },
    ],
  },
  {
    period: "2025-11",
    totalValue: 16000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 8000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 3000 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 5000 },
    ],
  },
  {
    period: "2025-12",
    totalValue: 45000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 10000 },
      { category: MAINTENANCE_TYPE.INSPECTION, value: 5000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 10000 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 20000 },
    ],
  },
  {
    period: "2026-01",
    totalValue: 15000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 8000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 5000 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 2000 },
    ],
  },
  {
    period: "2026-02",
    totalValue: 12000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 7000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 3000 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 2000 },
    ],
  },
  {
    period: "2026-03",
    totalValue: 25000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 10000 },
      { category: MAINTENANCE_TYPE.INSPECTION, value: 5000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 5000 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 5000 },
    ],
  },
  {
    period: "2026-04",
    totalValue: 38000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 8000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 10000 },
      { category: MAINTENANCE_TYPE.TUNING, value: 20000 },
    ],
  },
  {
    period: "2026-05",
    totalValue: 28000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 12000 },
      { category: MAINTENANCE_TYPE.INSPECTION, value: 6000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 5000 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 5000 },
    ],
  },
  {
    period: "2026-06",
    totalValue: 18000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 8000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 5000 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 5000 },
    ],
  },
];

/** 年次：整備費用データ（5年分） */
const ownerCostYearly: ChartPoint[] = [
  {
    period: "2022",
    totalValue: 180000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 80000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 60000 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 40000 },
    ],
  },
  {
    period: "2023",
    totalValue: 320000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 100000 },
      { category: MAINTENANCE_TYPE.VEHICLE_INSPECTION, value: 140000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 80000 },
    ],
  },
  {
    period: "2024",
    totalValue: 240000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 90000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 50000 },
      { category: MAINTENANCE_TYPE.TUNING, value: 100000 },
    ],
  },
  {
    period: "2025",
    totalValue: 352000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 110000 },
      { category: MAINTENANCE_TYPE.VEHICLE_INSPECTION, value: 120000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 72000 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 50000 },
    ],
  },
  {
    period: "2026",
    totalValue: 136000,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 53000 },
      { category: MAINTENANCE_TYPE.INSPECTION, value: 22000 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 31000 },
      { category: MAINTENANCE_TYPE.TUNING, value: 30000 },
    ],
  },
];

export const ownerDashboardMockMonthlyChart: DashboardChartResponse = {
  chartType: DASHBOARD_CHART_TYPE.MAINTENANCE_COST_TREND,
  periodType: PERIOD_TYPE.MONTH,
  startPeriod: "2025-07",
  endPeriod: "2026-06",
  canMoveForward: false,
  canMoveBackward: true,
  items: ownerCostMonthly,
};

export const ownerDashboardMockYearlyChart: DashboardChartResponse = {
  chartType: DASHBOARD_CHART_TYPE.MAINTENANCE_COST_TREND,
  periodType: PERIOD_TYPE.YEAR,
  startPeriod: "2022",
  endPeriod: "2026",
  canMoveForward: false,
  canMoveBackward: false,
  items: ownerCostYearly,
};

export const ownerDashboardMock: OwnerDashboardResponse = {
  vehicleCount: 3,
  maintenanceCount: 47,
  linkedShopCount: 2,
  maintenanceCostChart: ownerDashboardMockMonthlyChart,
  recentMaintenances: [
    {
      maintenanceId: "1",
      vehicleName: "R32 GT-R",
      ownerName: "田中 圭太",
      maintenanceType: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE,
      title: "オイル交換",
      workDateFrom: "2026-05-12",
      workDateTo: "2026-05-15",
      totalCost: 8500,
      shopName: "Tokyo Tuning Shop",
    },
    {
      maintenanceId: "2",
      vehicleName: "S13 シルビア",
      ownerName: "田中 圭太",
      maintenanceType: MAINTENANCE_TYPE.REPAIR,
      title: "ブレーキパッド交換",
      workDateFrom: "2026-05-10",
      workDateTo: null,
      totalCost: 35000,
      shopName: "Drift Works",
    },
    {
      maintenanceId: "6",
      vehicleName: "R32 GT-R",
      ownerName: "田中 圭太",
      maintenanceType: MAINTENANCE_TYPE.SETTING,
      title: "ECUセッティング",
      workDateFrom: "2026-04-13",
      workDateTo: "2026-04-15",
      totalCost: 80000,
      shopName: "Tokyo Tuning Shop",
    },
  ],
};

// ---- ショップ用ダッシュボード ---------------------------------------------

/** 月次：整備件数データ（12か月分） */
const shopCountMonthly: ChartPoint[] = [
  {
    period: "2025-07",
    totalValue: 15,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 8 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 4 },
      { category: MAINTENANCE_TYPE.TUNING, value: 3 },
    ],
  },
  {
    period: "2025-08",
    totalValue: 13,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 7 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 4 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 2 },
    ],
  },
  {
    period: "2025-09",
    totalValue: 24,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 9 },
      { category: MAINTENANCE_TYPE.VEHICLE_INSPECTION, value: 6 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 5 },
      { category: MAINTENANCE_TYPE.TUNING, value: 4 },
    ],
  },
  {
    period: "2025-10",
    totalValue: 20,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 10 },
      { category: MAINTENANCE_TYPE.INSPECTION, value: 4 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 6 },
    ],
  },
  {
    period: "2025-11",
    totalValue: 22,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 11 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 6 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 5 },
    ],
  },
  {
    period: "2025-12",
    totalValue: 28,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 12 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 8 },
      { category: MAINTENANCE_TYPE.TUNING, value: 8 },
    ],
  },
  {
    period: "2026-01",
    totalValue: 18,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 10 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 5 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 3 },
    ],
  },
  {
    period: "2026-02",
    totalValue: 16,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 9 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 4 },
      { category: MAINTENANCE_TYPE.SETTING, value: 3 },
    ],
  },
  {
    period: "2026-03",
    totalValue: 30,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 13 },
      { category: MAINTENANCE_TYPE.INSPECTION, value: 5 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 7 },
      { category: MAINTENANCE_TYPE.SETTING, value: 5 },
    ],
  },
  {
    period: "2026-04",
    totalValue: 38,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 15 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 10 },
      { category: MAINTENANCE_TYPE.TUNING, value: 13 },
    ],
  },
  {
    period: "2026-05",
    totalValue: 27,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 13 },
      { category: MAINTENANCE_TYPE.INSPECTION, value: 6 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 5 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 3 },
    ],
  },
  {
    period: "2026-06",
    totalValue: 21,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 11 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 6 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 4 },
    ],
  },
];

/** 年次：整備件数データ（5年分） */
const shopCountYearly: ChartPoint[] = [
  {
    period: "2022",
    totalValue: 180,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 90 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 60 },
      { category: MAINTENANCE_TYPE.TUNING, value: 30 },
    ],
  },
  {
    period: "2023",
    totalValue: 220,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 110 },
      { category: MAINTENANCE_TYPE.VEHICLE_INSPECTION, value: 50 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 60 },
    ],
  },
  {
    period: "2024",
    totalValue: 260,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 120 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 80 },
      { category: MAINTENANCE_TYPE.TUNING, value: 60 },
    ],
  },
  {
    period: "2025",
    totalValue: 282,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 135 },
      { category: MAINTENANCE_TYPE.VEHICLE_INSPECTION, value: 45 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 62 },
      { category: MAINTENANCE_TYPE.CUSTOM, value: 40 },
    ],
  },
  {
    period: "2026",
    totalValue: 150,
    breakdown: [
      { category: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE, value: 71 },
      { category: MAINTENANCE_TYPE.INSPECTION, value: 22 },
      { category: MAINTENANCE_TYPE.REPAIR, value: 37 },
      { category: MAINTENANCE_TYPE.TUNING, value: 20 },
    ],
  },
];

export const shopDashboardMockMonthlyChart: DashboardChartResponse = {
  chartType: DASHBOARD_CHART_TYPE.MAINTENANCE_COUNT_TREND,
  periodType: PERIOD_TYPE.MONTH,
  startPeriod: "2025-07",
  endPeriod: "2026-06",
  canMoveForward: false,
  canMoveBackward: true,
  items: shopCountMonthly,
};

export const shopDashboardMockYearlyChart: DashboardChartResponse = {
  chartType: DASHBOARD_CHART_TYPE.MAINTENANCE_COUNT_TREND,
  periodType: PERIOD_TYPE.YEAR,
  startPeriod: "2022",
  endPeriod: "2026",
  canMoveForward: false,
  canMoveBackward: false,
  items: shopCountYearly,
};

export const shopDashboardMock: ShopDashboardResponse = {
  managedVehicles: { total: 30, own: 2, customer: 28 },
  monthlySales: 428000,
  linkedCustomerCount: 24,
  maintenanceCountChart: shopDashboardMockMonthlyChart,
  recentMaintenances: [
    {
      maintenanceId: "s1",
      vehicleName: "R32 GT-R",
      ownerName: "田中 圭太",
      maintenanceType: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE,
      title: "オイル交換",
      workDateFrom: "2026-03-15",
      workDateTo: null,
      totalCost: 12800,
      shopName: null,
    },
    {
      maintenanceId: "s2",
      vehicleName: "RX7 FD3S",
      ownerName: "佐藤 隆",
      maintenanceType: MAINTENANCE_TYPE.SETTING,
      title: "ECUチューニング",
      workDateFrom: "2026-03-12",
      workDateTo: "2026-03-14",
      totalCost: 240000,
      shopName: null,
    },
    {
      maintenanceId: "s3",
      vehicleName: "シルビア S14",
      ownerName: "篠崎 響",
      maintenanceType: MAINTENANCE_TYPE.PERIODIC_MAINTENANCE,
      title: "オイル交換",
      workDateFrom: "2026-03-08",
      workDateTo: null,
      totalCost: 12800,
      shopName: null,
    },
  ],
};
