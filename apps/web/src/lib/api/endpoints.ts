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
} as const;
