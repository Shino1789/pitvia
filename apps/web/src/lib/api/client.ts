import { ApiResponse, ErrorResponse } from "@/shared/types/response";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL!;

/**
 * API共通呼び出し関数
 *
 * Spring BootのREST APIを呼び出すためのラッパー関数
 * 成功時はデータを返し、失敗時は例外を投げる
 *
 * @template T APIレスポンスのdata型
 *
 * @param path APIのエンドポイント（例: /users）
 * @param init fetchオプション(method、headers、bodyなど)
 *
 * @returns ApiResponse<T> 型の成功レスポンス
 *
 * @throws ErrorResponse HTTPエラー時(400/401/500など)
 */
export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<ApiResponse<T>> {
  const response = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
    ...init,
  });

  const body = await response.json();

  if (!response.ok) {
    throw body as ErrorResponse;
  }

  return body as ApiResponse<T>;
}
