import { ROUTES } from "./routes";
import type { AppRoute } from "./routes";
import type { UserRole } from "./role";
import {
  Home,
  Car,
  Store,
  Users,
  Settings,
  type LucideIcon,
} from "lucide-react";

/**
 * サイドバーやナビゲーションで利用するメニュー項目の型定義
 */
export type MenuItem = {
  /** UIで表示する画面名 */
  label: string;
  /** パス */
  path: AppRoute;
  /** アクセスを許可するユーザーロールの配列 */
  roles: UserRole[];
  /** 画面アイコン（詳細画面などサイドバー非表示の画面では省略可） */
  icon?: LucideIcon;
  /** サイドバーメニューに表示するかどうか（デフォルト: true） */
  sidebar?: boolean;
};

/**
 * アプリケーション共通のナビゲーションメニュー定義
 */
export const MENU_ITEMS: MenuItem[] = [
  {
    label: "ホーム",
    path: ROUTES.DASHBOARD,
    roles: ["OWNER", "SHOP"],
    icon: Home,
    sidebar: true,
  },
  {
    label: "車両一覧",
    path: ROUTES.VEHICLES,
    roles: ["OWNER", "SHOP"],
    icon: Car,
    sidebar: true,
  },
  {
    label: "ショップ管理",
    path: ROUTES.SHOPS,
    roles: ["OWNER"],
    icon: Store,
    sidebar: true,
  },
  {
    label: "顧客管理",
    path: ROUTES.CUSTOMERS,
    roles: ["SHOP"],
    icon: Users,
    sidebar: true,
  },
  {
    label: "アカウント設定",
    path: ROUTES.SETTINGS,
    roles: ["OWNER", "SHOP"],
    icon: Settings,
    sidebar: true,
  },
];

/**
 * パスをキーとしたメニューマップ
 */
export const MENU_MAP = Object.fromEntries(
  MENU_ITEMS.map((item) => [item.path, item]),
) as Record<AppRoute, MenuItem>;

/**
 * パスからメニュー定義を取得
 *
 * @param path ルートパス
 * @returns 該当するメニュー項目（未定義の場合は undefined）
 */
export function getMenu(path: AppRoute): MenuItem | undefined {
  return MENU_MAP[path];
}

/**
 * パスから画面名（ラベル）を取得
 *
 * @param path ルートパス
 * @returns 画面名文字列（未定義の場合は空文字）
 */
export function getMenuLabel(path: AppRoute): string {
  return MENU_MAP[path]?.label ?? "";
}
