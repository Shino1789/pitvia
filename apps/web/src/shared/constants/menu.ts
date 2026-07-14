import { ROUTES } from "./routes";
import type { AppRoute } from "./routes";
import type { UserRole } from "./role";

/**
 * サイドバーやナビゲーションで利用するメニュー項目の型定義
 */
export type MenuItem = {
  /** 画面に表示するテキスト */
  label: string;
  /** パス */
  path: AppRoute;
  /** アクセスを許可するユーザーロールの配列 */
  roles: UserRole[];
};

/**
 * アプリケーション共通のナビゲーションメニュー定義
 */
export const MENU_ITEMS: MenuItem[] = [
  {
    label: "ホーム",
    path: ROUTES.DASHBOARD,
    roles: ["OWNER", "SHOP"],
  },
  {
    label: "車両一覧",
    path: ROUTES.VEHICLES,
    roles: ["OWNER", "SHOP"],
  },
  {
    label: "ショップ管理",
    path: ROUTES.SHOPS,
    roles: ["OWNER"],
  },
  {
    label: "顧客管理",
    path: ROUTES.CUSTOMERS,
    roles: ["SHOP"],
  },
  {
    label: "アカウント設定",
    path: ROUTES.SETTINGS,
    roles: ["OWNER", "SHOP"],
  },
];
