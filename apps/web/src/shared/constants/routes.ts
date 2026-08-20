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

/**
 * 現在のURL（パス＋クエリ）を、`returnTo`クエリパラメータへ渡す値として組み立てる
 *
 * 一覧画面が持つ絞り込み・並び替え・ページング条件を丸ごと詳細/登録画面へ引き継ぎ、
 * キャンセル・登録完了時に同じ状態へ戻れるようにするために使用する。
 *
 * @param pathname     現在のパス
 * @param searchParams 現在のクエリパラメータ
 * @returns `returnTo`用の値（クエリが無い場合はパスのみ）
 */
export function buildReturnTo(
  pathname: string,
  searchParams: URLSearchParams,
): string {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}

/**
 * 整備履歴一覧画面のパスを生成する
 *
 * @param vehicleId 対象車両ID（指定した車両の整備履歴に絞り込む場合）
 * @param ownerId   遷移元の対象オーナーID（顧客の車両一覧からの遷移時のみ指定）
 * @returns 整備履歴一覧画面のパス
 */
export function maintenanceRecordListRoute(
  vehicleId?: string,
  ownerId?: string,
): string {
  const params = new URLSearchParams();
  if (vehicleId) params.set("vehicleId", vehicleId);
  if (ownerId) params.set("ownerId", ownerId);
  const query = params.toString();
  return query ? `${ROUTES.MAINTENANCES}?${query}` : ROUTES.MAINTENANCES;
}

/**
 * 整備履歴詳細・更新画面のパスを生成する
 *
 * @param maintenanceRecordId 整備履歴ID
 * @param returnTo            キャンセル時に戻る一覧画面のパス（{@link buildReturnTo}で組み立てた値）
 * @returns 整備履歴詳細画面のパス
 */
export function maintenanceRecordDetailRoute(
  maintenanceRecordId: string,
  returnTo?: string,
): string {
  const path = `${ROUTES.MAINTENANCES}/${maintenanceRecordId}`;
  if (!returnTo) return path;
  return `${path}?${new URLSearchParams({ returnTo }).toString()}`;
}

/**
 * 整備履歴登録画面のパスを生成する
 *
 * @param options.vehicleId 対象車両IDの初期選択値（車両ごとの一覧から遷移する場合）
 * @param options.ownerId   対象車両一覧の取得元オーナーID（連携済み顧客の車両から遷移する場合）
 * @param options.returnTo  キャンセル・登録完了時に戻る一覧画面のパス（{@link buildReturnTo}で組み立てた値）
 * @returns 整備履歴登録画面のパス
 */
export function maintenanceRecordNewRoute(options?: {
  vehicleId?: string;
  ownerId?: string;
  returnTo?: string;
}): string {
  const params = new URLSearchParams();
  if (options?.vehicleId) params.set("vehicleId", options.vehicleId);
  if (options?.ownerId) params.set("ownerId", options.ownerId);
  if (options?.returnTo) params.set("returnTo", options.returnTo);
  const query = params.toString();
  return query ? `${ROUTES.MAINTENANCE_NEW}?${query}` : ROUTES.MAINTENANCE_NEW;
}
