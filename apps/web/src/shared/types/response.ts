/**
 * 全レスポンス共通メタ情報
 */
export interface Meta {
  requestId: string;
  /** ISO-8601形式のタイムスタンプ文字列 */
  timestamp: string;
}

/**
 * 正常系レスポンス
 * @example
 * {
 * "meta": { "requestId": "...", "timestamp": "..." },
 * "data": { "id": 1, "name": "foo" }
 * }
 */
export interface ApiResponse<T> {
  meta: Meta;
  data: T;
}

/**
 * 異常系レスポンス
 * @example
 * {
 * "meta": { "requestId": "...", "timestamp": "..." },
 * "error": { "path": "/api/v1/...", "code": "BAD_REQUEST", "message": "..." }
 * }
 */
export interface ErrorResponse {
  meta: Meta;
  error: ErrorBody;
}

/**
 * エラー詳細
 */
export interface ErrorBody {
  path: string;
  code: string;
  message: string;
  validationErrors?: ValidationError[];
}

/**
 * バリデーションエラー情報
 */
export interface ValidationError {
  field: string;
  reason: string;
}

/**
 * ページング付き一覧レスポンス共通型
 * Spring: PageResponse<T>（`page`は1始まり）
 */
export interface PageResponse<T> {
  content: T[];
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
}
