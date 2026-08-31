// =========================================================================
// Vitestテストセットアップ
// =========================================================================
import "@testing-library/jest-dom/vitest";

/**
 * jsdom環境に存在しない ResizeObserver を擬似的に再現（モック化）
 * Radix UI などのUIライブラリが内部でサイズ検知を行う際のReferenceErrorを回避します
 */
global.ResizeObserver = class ResizeObserver {
  observe(): void {}
  unobserve(): void {}
  disconnect(): void {}
};

/**
 * jsdomに実装が存在しないPointer Capture関連APIを擬似的に再現（モック化）
 * Radix UI の Select 等が内部でポインタ操作時に呼び出すため、未実装のままだと
 * TypeErrorになってしまうのを回避
 */
Element.prototype.hasPointerCapture ??= () => false;
Element.prototype.setPointerCapture ??= () => {};
Element.prototype.releasePointerCapture ??= () => {};

/**
 * jsdomに実装が存在しない scrollIntoView を擬似的に再現（モック化）
 * Radix UI の Select がオープン時に選択中の項目までスクロールしようとするため、
 * 未実装のままだとTypeErrorになってしまうのを回避
 */
Element.prototype.scrollIntoView ??= () => {};

/**
 * `src/lib/api/axios.ts` は未設定の場合に例外を投げる仕様のため、
 * axiosクライアントをモック化していないテスト（例: apiClientへ依存するモジュールを
 * 間接的にimportするだけのテスト）でも読み込みエラーにならないよう、ダミー値を設定する
 */
process.env.NEXT_PUBLIC_API_URL ??= "http://localhost:8080/api/v1";
