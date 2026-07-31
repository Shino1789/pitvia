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
  MAINTENANCES: "/maintenances",
  SETTINGS: "/settings",
  FORBIDDEN: "/forbidden",
} as const;

export type AppRoute = (typeof ROUTES)[keyof typeof ROUTES];
