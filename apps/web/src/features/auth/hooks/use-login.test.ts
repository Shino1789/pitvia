import { renderHook, act } from "@testing-library/react";
import { describe, test, expect, vi } from "vitest";
import { useLogin } from "./use-login";

// ルーター移動を検証するためのモック関数
const mockReplace = vi.fn();

// Next.js のナビゲーション関連フックをモック化
vi.mock("next/navigation", () => ({
  useRouter: () => ({
    replace: mockReplace,
  }),
  useSearchParams: () => ({
    get: () => null, // ログイン後の遷移先リダイレクトパラメータ（callbackUrl等）がないケースを想定
  }),
}));

// API通信や認証状態を管理するサービス層をモック化
vi.mock("../services/auth-session", () => ({
  authSession: { login: vi.fn() },
}));

/**
 * useLogin カスタムフックの単体テスト
 */
describe("useLogin", () => {
  /**
   * @test 正しい資格情報でログインが成功した際、セッションが確立されダッシュボードへ遷移することを確認
   */
  test("ログイン成功時にdashboardへ移動する", async () => {
    // モック化したサービス層のインスタンスを取得し、ログイン成功の挙動を定義
    const { authSession } = await import("../services/auth-session");
    vi.mocked(authSession.login).mockResolvedValue(undefined);

    // カスタムフックをテスト環境用にレンダリング
    const { result } = renderHook(() => useLogin());

    // フック内の状態更新を伴う非同期アクションを実行
    await act(async () => {
      await result.current.login({
        email: "test@example.com",
        password: "password123",
      });
    });

    // 認証サービスが正しいパラメータで呼び出されたかを検証
    expect(authSession.login).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });

    // ログイン成功後に指定の画面へリダイレクトされたかを検証
    expect(mockReplace).toHaveBeenCalled();
  });
});
