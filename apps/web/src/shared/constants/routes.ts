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
  SHOPS: "/shops",
  CUSTOMERS: "/customers",
  SETTINGS: "/settings",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
