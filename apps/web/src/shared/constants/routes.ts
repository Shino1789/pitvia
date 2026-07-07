/**
 * アプリケーションのルート定義
 */
export const ROUTES = {
  LOGIN: "/login",
  REGISTER: "/register",
  HEALTH: "/health",
  DASHBOARD: "/dashboard",
  VEHICLES: "/vehicles",
  SHOPS: "/shops",
  CUSTOMERS: "/customers",
  SETTINGS: "/settings",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
