import axios from "axios";
import { ERROR_MESSAGES } from "@/shared/messages/error";
import { ErrorResponse } from "@/shared/types/response";

/**
 * 発生したエラーから画面表示用のメッセージを取得するユーティリティ
 *
 * @param error 捕獲したエラーオブジェクト
 * @returns 表示用エラーメッセージ
 */
export function getErrorMessage(error: unknown): string {
  // Axiosのエラー（API通信時のエラー）かどうかを判定
  if (axios.isAxiosError<ErrorResponse>(error)) {
    // バックエンドから返却されたレスポンスデータ内のエラーメッセージを取得
    const message = error.response?.data?.error?.message;
    // メッセージが存在する場合はその文字列を返却
    if (message) {
      return message;
    }
  }

  // JavaScriptの標準的な Error オブジェクトかどうかを判定
  if (error instanceof Error) {
    // Errorオブジェクトが保持しているメッセージを返却
    return error.message;
  }

  // 予期せぬエラーやネットワーク障害などの場合は、共通のネットワークエラーメッセージを返却
  return ERROR_MESSAGES.NETWORK;
}
