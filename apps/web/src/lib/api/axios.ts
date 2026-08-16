import axios, { InternalAxiosRequestConfig } from "axios";
import { useAuthStore } from "@/stores/auth-store";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!BASE_URL) {
  throw new Error("環境変数 NEXT_PUBLIC_API_URL が設定されていません。");
}

/**
 * API共通クライアント設定済みのAxiosインスタンス
 */
export const apiClient = axios.create({
  // バックエンドAPIのベースURL
  baseURL: BASE_URL,
  // タイムアウト時間を10秒に設定
  timeout: 10000,
  // クッキー（HttpOnlyのrefresh_token等）をクロスドメイン間でも常に送信・保持する
  withCredentials: true,
  // 配列パラメータを key[]=a&key[]=b ではなく key=a&key=b の形式で送信する
  // （Backendの@ModelAttribute受け取り側はkey[]形式のパラメータ名を認識できないため）
  paramsSerializer: { indexes: null },
});

// APIリクエストインターセプター登録
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig): InternalAxiosRequestConfig => {
    // Zustandのストアから最新のアクセストークンを取得
    const accessToken = useAuthStore.getState().accessToken;

    // トークンが存在する場合、リクエストヘッダーにセット
    if (accessToken && config.headers) {
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  (error: unknown) => {
    // リクエスト設定時にエラーが発生した場合はそのまま却下
    return Promise.reject(error);
  },
);
