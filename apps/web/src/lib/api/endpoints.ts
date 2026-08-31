/**
 * APIエンドポイント定数
 */
export const ENDPOINTS = {
  auth: {
    /** ログインAPI */
    login: "/auth/login",

    /** ユーザー登録API */
    register: "/auth/register",

    /** アクセストークン再発行API */
    refresh: "/auth/refresh",

    /** ログアウトAPI */
    logout: "/auth/logout",

    /** ユーザー情報取得API */
    me: "/auth/me",
  },

  dashboard: {
    /** ダッシュボード初期化API */
    root: "/dashboard",

    /** ダッシュボードグラフデータ取得API */
    chart: "/dashboard/chart",
  },

  vehicle: {
    /** 車両登録フォーム初期化API */
    formOptions: "/vehicles/form-options",

    /** 車両登録API */
    root: "/vehicles",

    /** 車両詳細取得・更新・削除API */
    byId: (vehicleId: string) => `/vehicles/${vehicleId}`,
  },

  maintenanceRecord: {
    /** 整備履歴一覧取得・登録API（GET: 一覧取得、POST: 登録） */
    list: "/maintenance-records",

    /** 整備履歴詳細取得・更新・削除API */
    byId: (maintenanceRecordId: string) =>
      `/maintenance-records/${maintenanceRecordId}`,
  },
} as const;
