/**
 * アプリケーションのルート定義
 */
export const ROUTES = {
  HEALTH: "/health",
  LOGIN: "/login",
  REGISTER: "/register",
  TERMS: "/terms",
  PRIVACY: "/privacy",
  DASHBOARD: "/dashboard",
  VEHICLES: "/vehicles",
  VEHICLE_NEW: "/vehicles/new",
  SHOPS: "/shops",
  CUSTOMERS: "/customers",
  MAINTENANCES: "/maintenances",
  SETTINGS: "/settings",
  FORBIDDEN: "/forbidden",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * 車両詳細・変更画面のパスを生成する
 *
 * 車両IDによって変化する動的ルートのため、ROUTESの固定文字列ではなく関数として定義する。
 *
 * @param vehicleId 車両ID
 * @returns 車両詳細画面のパス
 */
export function vehicleDetailRoute(vehicleId: string): string {
  return `${ROUTES.VEHICLES}/${vehicleId}`;
}
