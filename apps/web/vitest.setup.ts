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
