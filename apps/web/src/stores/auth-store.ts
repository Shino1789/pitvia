import { create } from "zustand";
import type { User } from "@/shared/types/user";

/**
 * 認証状態およびログインユーザー情報を管理するZustandストアのインターフェース
 */
interface AuthState {
  /** アクセストークン */
  accessToken: string | null;

  /** ログイン中のユーザー情報オブジェクト */
  user: User | null;

  /**
   * 認証情報をストアに保存する
   *
   * @param accessToken アクセストークン
   * @param user ログインユーザー情報オブジェクト
   */
  setAuth: (accessToken: string, user: User) => void;

  /**
   * アクセストークンのみを更新する
   *
   * @param accessToken アクセストークン
   */
  setAccessToken: (accessToken: string) => void;

  /**
   * ユーザー情報のみを更新する
   *
   * @param user ログインユーザー情報オブジェクト
   */
  setUser: (user: User) => void;

  /**
   * 認証情報をクリアし、未ログイン状態に戻す
   */
  clearAuth: () => void;
}

/**
 * 認証グローバルステート管理ストア
 */
export const useAuthStore = create<AuthState>()((set) => ({
  // 初期状態
  accessToken: null,
  user: null,

  // 認証情報の設定
  setAuth: (accessToken, user) =>
    set({
      accessToken,
      user,
    }),

  // アクセストークンのみの更新
  setAccessToken: (accessToken) =>
    set({
      accessToken,
    }),

  // ユーザー情報のみの更新
  setUser: (user) =>
    set({
      user,
    }),

  // 認証情報の破棄
  clearAuth: () =>
    set({
      accessToken: null,
      user: null,
    }),
}));
