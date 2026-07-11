// =========================================================================
// Vitestテスト設定
// =========================================================================
import { defineConfig } from "vitest/config";
import path from "path";

/**
 * Vitestの設定定義を行う
 */
export default defineConfig({
  test: {
    // DOM操作（Reactコンポーネントのテスト）を可能にする環境を指定
    environment: "jsdom",
    // expect や describe などのAPIを明示的なimportなしで利用可能にする
    globals: true,
    // 各テスト実行前に読み込む共通セットアップファイル
    setupFiles: ["./vitest.setup.ts"],
  },
  resolve: {
    alias: {
      // ソースコード内の「@/」を「src/」ディレクトリにマッピング
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
