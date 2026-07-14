import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { useRegister } from "./use-register";

// ルーター移動を検証するためのモック関数
const mockReplace = vi.fn();

// Next.js のナビゲーション関連フックをモック化
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
}));

// API通信や認証状態を管理するサービス層をモック化
vi.mock("../services/auth-session", () => ({
  authSession: { register: vi.fn() },
}));

/**
 * useRegister カスタムフックの単体テスト
 */
describe("useRegister", () => {
  beforeEach(() => {
    // 各テスト実行前にモックの呼び出し履歴をクリア
    vi.clearAllMocks();
  });

  /**
   * @test アカウント登録が成功した際、登録APIが呼ばれ、クエリパラメータ付きでログイン画面へリダイレクトされることを確認
   */
  test("登録成功時にログイン画面へ遷移する", async () => {
    // モック化したサービス層のインスタンスを取得し、登録成功の挙動を定義
    const { authSession } = await import("../services/auth-session");
    vi.mocked(authSession.register).mockResolvedValue(undefined);

    // カスタムフックをテスト環境用にレンダリング
    const { result } = renderHook(() => useRegister());

    // フック内の状態更新を伴う非同期アクションを実行
    await act(async () => {
      await result.current.register({
        role: "OWNER",
        userName: "山田 太郎",
        email: "test@example.com",
        password: "password123",
        confirmPassword: "password123",
      });
    });

    // 認証サービスがフォームから入力された正しいパラメータで呼び出されたかを検証
    expect(authSession.register).toHaveBeenCalledWith({
      role: "OWNER",
      userName: "山田 太郎",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    });

    // ログイン画面へ、登録完了トーストを表示するためのクエリ（?registered=true）付きで遷移したかを検証
    expect(mockReplace).toHaveBeenCalledWith("/login?registered=true");
  });
});
