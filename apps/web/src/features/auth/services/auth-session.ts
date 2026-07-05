import axios from "axios";
import { authApi } from "../api/auth-api";
import { useAuthStore } from "@/stores/auth-store";
import type { LoginRequest, RegisterRequest } from "../types/auth";

/**
 * 認証セッションサービス
 */
export const authSession = {
  /**
   * アプリ起動（画面リロード）時の認証セッション復元処理
   *
   * @returns {Promise<void>}
   */
  restoreSession: async (): Promise<void> => {
    // Zustandのストアインスタンスを取得
    const store = useAuthStore.getState();
    try {
      // リフレッシュAPIリクエスト実行
      const response = await authApi.refresh();
      const data = response.data?.data;

      // トークンとユーザー情報の両方が正しく取得できた場合
      if (data?.accessToken && data.user) {
        // グローバルストアに認証情報をセットして、ログイン状態にする
        store.setAuth(data.accessToken, data.user);
      } else {
        // データが不完全な場合は、未ログイン状態にする
        store.clearAuth();
      }
    } catch (error) {
      // 400または401エラーが返ってきた場合
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 || error.response?.status === 400)
      ) {
        store.clearAuth();
      }
    }
  },

  /**
   * ログイン認証処理
   *
   * @param credentials ログインリクエストデータ（メールアドレス、パスワード）
   * @returns {Promise<void>}
   */
  login: async (credentials: LoginRequest): Promise<void> => {
    // Zustandのストアインスタンスを取得
    const store = useAuthStore.getState();
    // ログインAPIリクエスト実行
    const response = await authApi.login(credentials);
    // レスポンスからトークンとユーザー情報を取得
    const data = response.data.data;

    // 取得した最新のAccessTokenとUser情報をグローバルストアに反映し、認証済み状態に更新
    store.setAuth(data.accessToken, data.user);
  },

  /**
   * 新規アカウント登録処理
   *
   * @param data 新規アカウント登録リクエストデータ
   * @returns {Promise<void>}
   */
  register: async (data: RegisterRequest): Promise<void> => {
    // 新規アカウント登録APIリクエスト実行
    await authApi.register(data);
  },

  /**
   * ログアウト処理
   *
   * @returns {Promise<void>}
   */
  logout: async (): Promise<void> => {
    // Zustandのストアインスタンスを取得
    const store = useAuthStore.getState();
    try {
      // ログアウトAPIリクエスト実行
      await authApi.logout();
    } finally {
      // API通信が成功したか失敗したかに関わらず、認証ストアの情報をクリアして未ログイン状態にする
      store.clearAuth();
    }
  },

  /**
   * サイレントリフレッシュ処理
   *
   * @returns {Promise<string>} 再発行された新しいアクセストークン
   * @throws {Error} レスポンスデータが不正な場合
   * @throws {AxiosError} リフレッシュAPI通信でエラーが発生した場合
   */
  refresh: async (): Promise<string> => {
    // Zustandのストアインスタンスを取得
    const store = useAuthStore.getState();
    try {
      // リフレッシュAPIリクエスト
      const response = await authApi.refresh();
      const data = response.data?.data;

      // 取得したデータの中にアクセストークン、またはユーザー情報が欠落している場合
      if (!data?.accessToken || !data.user) {
        // 不正なデータとして明示的にエラーをスローし、catchブロックへ飛ばす
        throw new Error("Refresh response is invalid.");
      }

      // 新しいトークンとユーザー情報をストアに再セット
      store.setAuth(data.accessToken, data.user);
      // インターセプター側が再試行リクエストで使えるように、新トークンを呼び出し元に返す
      return data.accessToken;
    } catch (error) {
      // 400または401エラーが返ってきた場合
      if (
        axios.isAxiosError(error) &&
        (error.response?.status === 401 || error.response?.status === 400)
      ) {
        // ストア情報をクリアして未ログイン状態にする
        store.clearAuth();
      }
      throw error;
    }
  },
};
