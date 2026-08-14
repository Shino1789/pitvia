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
  MAINTENANCE_NEW: "/maintenances/new",
  SETTINGS: "/settings",
  FORBIDDEN: "/forbidden",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];

/**
 * 車両一覧画面のパスを生成する
 *
 * `ownerId`を指定すると、SHOPが特定顧客（オーナー）の共有車両一覧を見るためのパスになる。
 * 省略時はログインユーザー自身の車両一覧を指す。
 *
 * @param ownerId 対象オーナーID（任意）
 * @returns 車両一覧画面のパス
 */
export function vehicleListRoute(ownerId?: string): string {
  return ownerId ? `${ROUTES.VEHICLES}?ownerId=${ownerId}` : ROUTES.VEHICLES;
}

/**
 * 車両詳細・更新画面のパスを生成する
 *
 * @param vehicleId 車両ID
 * @param ownerId   遷移元の対象オーナーID（顧客の車両一覧からの遷移時のみ指定）
 * @returns 車両詳細画面のパス
 */
export function vehicleDetailRoute(
  vehicleId: string,
  ownerId?: string,
): string {
  const path = `${ROUTES.VEHICLES}/${vehicleId}`;
  return ownerId ? `${path}?ownerId=${ownerId}` : path;
}
