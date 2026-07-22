import { DashboardChartType } from "../constants/dashboard-chart";
import { MaintenanceType } from "@/shared/constants/maintenance-type";
import { PeriodType } from "@/shared/constants/period";

/**
 * グラフデータ取得リクエストパラメータ
 * Spring: DashboardChartParam
 */
export interface DashboardChartParam {
  /** 集計単位（月か年） */
  period: PeriodType;
  /** 集計の終了基準期間 (例: "2026-06") */
  endPeriod?: string;
  /** endPeriodを基準に、過去方向へ取得する期間数 */
  size?: number;
}

/**
 * グラフの項目別内訳データ
 * Spring: ChartValue
 */
export interface ChartValue {
  /** 整備種別 */
  category: MaintenanceType;
  /** 集計値 */
  value: number;
}

/**
 * 棒グラフ1本分の期間・総集計値・内訳データ
 * Spring: ChartPoint
 */
export interface ChartPoint {
  /** 集計期間 */
  period: string;
  /** 総集計値 */
  totalValue: number;
  /** 期間内のカテゴリ別集計値（内訳） */
  breakdown: ChartValue[];
}

/**
 * ダッシュボードグラフレスポンス
 * Spring: DashboardChartResponse
 */
export interface DashboardChartResponse {
  /** グラフタイトル種別 */
  chartType: DashboardChartType;
  /** 集計単位 */
  periodType: PeriodType;
  /** 集計開始期間 */
  startPeriod: string;
  /** 集計終了期間 */
  endPeriod: string;
  /** 次の期間への移動可否フラグ */
  canMoveForward: boolean;
  /** 前の期間への移動可否フラグ */
  canMoveBackward: boolean;
  /** グラフデータリスト */
  items: ChartPoint[];
}

/**
 * 最近の整備履歴明細データ
 * Spring: RecentMaintenance
 */
export interface RecentMaintenance {
  /** 整備記録ID (UUID) */
  maintenanceId: string;
  /** 車両名 */
  vehicleName: string;
  /** 車両保有者のユーザー名 */
  ownerName: string;
  /** 整備種別 */
  maintenanceType: MaintenanceType;
  /** 整備タイトル */
  title: string;
  /** 整備開始日 (YYYY-MM-DD) */
  workDateFrom: string;
  /** 整備終了日 (単日作業の場合はnull) */
  workDateTo: string | null;
  /** 整備にかかった総費用 */
  totalCost: number;
  /** 整備を担当したショップ名 (DIYの場合はnull) */
  shopName: string | null;
}

/**
 * 管理車両数内訳データ (ショップ用)
 * Spring: ManagedVehicle
 */
export interface ManagedVehicle {
  /** 管理車両総数 */
  total: number;
  /** マイカー車両数 */
  own: number;
  /** 顧客車両数 */
  customer: number;
}

/**
 * オーナーロール用ダッシュボードレスポンス
 * Spring: OwnerDashboardResponse
 */
export interface OwnerDashboardResponse {
  /** 登録車両数 */
  vehicleCount: number;
  /** 整備履歴数 */
  maintenanceCount: number;
  /** 連携ショップ数 */
  linkedShopCount: number;
  /** 整備費用推移グラフ */
  maintenanceCostChart: DashboardChartResponse;
  /** 最近の整備履歴 */
  recentMaintenances: RecentMaintenance[];
}

/**
 * ショップロール用ダッシュボードレスポンス
 * Spring: ShopDashboardResponse
 */
export interface ShopDashboardResponse {
  /** 管理車両数 */
  managedVehicles: ManagedVehicle;
  /** 今月売上 */
  monthlySales: number;
  /** 連携顧客数 */
  linkedCustomerCount: number;
  /** 整備件数推移グラフ */
  maintenanceCountChart: DashboardChartResponse;
  /** 最近の整備履歴 */
  recentMaintenances: RecentMaintenance[];
}

/**
 * ダッシュボード共通レスポンス型
 * Spring: DashboardResponse
 */
export type DashboardResponse = OwnerDashboardResponse | ShopDashboardResponse;
