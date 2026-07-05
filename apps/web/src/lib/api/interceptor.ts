import { AxiosError, InternalAxiosRequestConfig } from "axios";
import { apiClient } from "./axios";
import { authSession } from "@/features/auth/services/auth-session";
import { ENDPOINTS } from "./endpoints";

/**
 * リクエスト設定カスタムインターフェース
 */
interface CustomRequestConfig extends InternalAxiosRequestConfig {
  // すでにリフレッシュAPIをリクエスト済みであるかを判定するフラグ
  _retry?: boolean;
}

// 多重登録を防ぐための初期化済フラグ
let isInitialized = false;

// リフレッシュAPI通信が実行中かどうかを示すフラグ
let isRefreshing = false;

// トークンリフレッシュ中に発生した401エラーリクエストを一時的に溜めておく待機キュー
let failedQueue: {
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}[] = [];

/**
 * 待機キューに溜まったリクエストの一括処理
 *
 * @param error リフレッシュ失敗時のエラーオブジェクト
 * @param token リフレッシュ成功時に取得した新しいアクセストークン
 */
const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((promise) => {
    if (token) {
      // リフレッシュ成功：新しいトークンを渡して待機させていたリクエストを再開
      promise.resolve(token);
    } else {
      // リフレッシュ失敗：待機させていたリクエストをすべてエラーにする
      promise.reject(error);
    }
  });
  // キューを空にする
  failedQueue = [];
};

/**
 * APIレスポンスインターセプターのセットアップ実行関数
 */
export const setupResponseInterceptor = () => {
  // 二重登録を防止
  if (isInitialized) return;
  isInitialized = true;

  // APIレスポンスインターセプターの登録
  apiClient.interceptors.response.use(
    // 成功時（ステータスコード 2xx）はそのままレスポンスを返す
    (response) => response,

    // 失敗時（ステータスコード 2xx 以外）の共通エラーハンドリング
    async (error: AxiosError) => {
      const originalRequest = error.config as CustomRequestConfig | undefined;

      // リクエスト設定が存在しない、またはすでに再試行済みのリクエストの場合はエラーをそのまま返す（無限ループの防止）
      if (!originalRequest || originalRequest._retry) {
        return Promise.reject(error);
      }

      // エラーの発生元がトークンリフレッシュAPI自体である場合はエラーをそのまま返す
      // （リフレッシュ自体の失敗時に再度リフレッシュが走るのを防ぐ）
      const isAuthApi = originalRequest.url?.endsWith(ENDPOINTS.auth.refresh);
      if (isAuthApi) {
        return Promise.reject(error);
      }

      // 401 Unauthorized（認証エラー / アクセストークン切れ）の場合の処理
      if (error.response?.status === 401) {
        // すでにトークンリフレッシュを実行中の場合
        if (isRefreshing) {
          // 新しいトークンが手に入るまで、このリクエストの実行をPromiseで保留状態にする
          return new Promise((resolve, reject) => {
            failedQueue.push({
              // トークンが再発行されたら呼ばれるコールバック
              resolve: (token: string) => {
                if (originalRequest.headers) {
                  // 新しいアクセストークンをヘッダーにセットし直す
                  originalRequest.headers.Authorization = `Bearer ${token}`;
                }
                // apiClientでリクエストを再試行
                resolve(apiClient(originalRequest));
              },
              // トークン再発行が最終的に失敗したら呼ばれるコールバック
              reject: (err) => reject(err),
            });
          });
        }

        // この処理が最初のリクエストの場合
        originalRequest._retry = true; // 再試行フラグを立てる
        isRefreshing = true; // リフレッシュ実行中フラグをオン

        try {
          // バックエンドの /refresh エンドポイントを叩き、新しいアクセストークンを取得
          const newAccessToken = await authSession.refresh();

          if (originalRequest.headers) {
            // リクエストヘッダーに新しいトークンをセット
            originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          }

          // 取得した新トークンを、待機中の他のリクエスト群（キュー）に配って一斉再開
          processQueue(null, newAccessToken);

          // 自分自身の originalRequest も新しいトークンで再試行して返す
          return apiClient(originalRequest);
        } catch (refreshError) {
          // リフレッシュ自体が失敗（リフレッシュトークンも期限切れなど）した場合、待機中のリクエスト群もすべてエラーとして却下する
          processQueue(refreshError, null);
          return Promise.reject(refreshError);
        } finally {
          // 成功・失敗に関わらず、リフレッシュ処理が終了したためフラグを戻す
          isRefreshing = false;
        }
      }

      // 401以外のエラー（400, 403, 500など）は何もせずそのまま呼び出し元にエラーを返す
      return Promise.reject(error);
    },
  );
};
