import { render, screen, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { AuthProvider } from "./auth-provider";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/shared/constants/routes";
import { AUTH_FAILURE_REASON } from "@/shared/constants/auth-failure";
import { ERROR_CODE } from "@/shared/constants/error-code";

// ルーター移動を検証するためのモック関数
const mockReplace = vi.fn();

// useRouter()が返すオブジェクトは、実際のNext.jsと同様に再レンダー間で同一参照を保つ必要がある。
// 毎回新しいオブジェクトを返すと、AuthProvider内のuseEffectの依存配列（[router, accessToken]）が
// 参照比較で変化したと判定され、意図せずeffectが再実行されてしまうため、モジュールスコープの
// 固定オブジェクトを返すようにする
const mockRouter = { replace: mockReplace };

// Next.js のナビゲーション関連フックをモック化
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

// レスポンスインターセプターのセットアップは本テストの対象外のためモック化
vi.mock("@/lib/api/interceptor", () => ({
  setupResponseInterceptor: vi.fn(),
}));

// セッション復元処理をモック化し、成功・失敗パターンを制御する
vi.mock("@/features/auth/services/auth-session", () => ({
  authSession: { restoreSession: vi.fn() },
}));

/**
 * axios.isAxiosError() が true と判定する最小限のエラーオブジェクトを生成する
 *
 * @param code 業務エラーコード（未指定の場合はエラーコードを含まないAPIエラーを表す）
 */
const createAxiosError = (code?: string) => ({
  isAxiosError: true,
  response: code ? { data: { error: { code } } } : undefined,
});

describe("AuthProvider", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 各テスト開始前に認証ストアを未ログイン状態へリセット
    useAuthStore.getState().clearAuth();
  });

  /**
   * @test メモリ上にアクセストークンが既に存在する場合、セッション復元を行わず即座に子要素を表示する
   */
  test("認証済みの場合は復元処理を行わずchildrenを表示する", async () => {
    const { authSession } = await import("@/features/auth/services/auth-session");
    useAuthStore.getState().setAuth("token", {
      userId: "u1",
      userName: "test",
      email: "test@example.com",
      role: "OWNER",
      iconUrl: null,
    });

    render(
      <AuthProvider>
        <div data-testid="protected">Protected</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("protected")).toBeInTheDocument();
    });
    expect(authSession.restoreSession).not.toHaveBeenCalled();
    expect(mockReplace).not.toHaveBeenCalled();
  });

  /**
   * @test セッション復元に成功した場合、LoadingScreenが解除されchildrenを表示する
   */
  test("復元成功時はLoadingScreenが消えchildrenを表示する", async () => {
    const { authSession } = await import("@/features/auth/services/auth-session");
    vi.mocked(authSession.restoreSession).mockResolvedValue(undefined);

    render(
      <AuthProvider>
        <div data-testid="protected">Protected</div>
      </AuthProvider>,
    );

    // 初期状態ではLoadingScreenが表示されている
    expect(screen.getByText("読み込み中...")).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByTestId("protected")).toBeInTheDocument();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });

  /**
   * @test リフレッシュトークンが存在しない場合、LoadingScreenが解除されログイン画面へ遷移する
   */
  test("NO_REFRESH_TOKENの場合はLoadingScreenを解除しログイン画面へ遷移する", async () => {
    const { authSession } = await import("@/features/auth/services/auth-session");
    vi.mocked(authSession.restoreSession).mockRejectedValue(
      createAxiosError(ERROR_CODE.NO_REFRESH_TOKEN),
    );

    render(
      <AuthProvider>
        <div data-testid="protected">Protected</div>
      </AuthProvider>,
    );

    // LoadingScreenが無限に表示され続けず、必ず解除されることを検証
    await waitFor(() => {
      expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
    });
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith(ROUTES.LOGIN);
  });

  /**
   * @test リフレッシュトークンが無効・期限切れの場合、LoadingScreenが解除されログイン画面へ遷移する
   */
  test("INVALID_REFRESH_TOKENの場合はLoadingScreenを解除しログイン画面へ遷移する", async () => {
    const { authSession } = await import("@/features/auth/services/auth-session");
    vi.mocked(authSession.restoreSession).mockRejectedValue(
      createAxiosError(ERROR_CODE.INVALID_REFRESH_TOKEN),
    );

    render(
      <AuthProvider>
        <div data-testid="protected">Protected</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
    });
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith(
      `${ROUTES.LOGIN}?reason=${AUTH_FAILURE_REASON.SESSION_EXPIRED}`,
    );
  });

  /**
   * @test Refresh APIが業務エラーコードを伴わない予期せぬ失敗をした場合でも、
   * LoadingScreenが無限に表示され続けず、ネットワークエラー理由でログイン画面へ遷移する
   */
  test("予期せぬエラーの場合もLoadingScreenを解除しログイン画面へ遷移する", async () => {
    const { authSession } = await import("@/features/auth/services/auth-session");
    vi.mocked(authSession.restoreSession).mockRejectedValue(
      new Error("network down"),
    );

    render(
      <AuthProvider>
        <div data-testid="protected">Protected</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(screen.queryByText("読み込み中...")).not.toBeInTheDocument();
    });
    expect(mockReplace).toHaveBeenCalledTimes(1);
    expect(mockReplace).toHaveBeenCalledWith(
      `${ROUTES.LOGIN}?reason=${AUTH_FAILURE_REASON.NETWORK}`,
    );
  });

  /**
   * @test 復元失敗時にリダイレクト処理が1回のみ実行され、再レンダリングによる
   * 二重遷移（リダイレクトループの一因）が起きないことを確認
   */
  test("復元失敗後に再レンダリングされてもリダイレクトが再実行されない", async () => {
    const { authSession } = await import("@/features/auth/services/auth-session");
    vi.mocked(authSession.restoreSession).mockRejectedValue(
      createAxiosError(ERROR_CODE.INVALID_REFRESH_TOKEN),
    );

    const { rerender } = render(
      <AuthProvider>
        <div data-testid="protected">Protected</div>
      </AuthProvider>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledTimes(1);
    });

    // accessToken・routerに変化がない再レンダリングではeffectが再実行されない（依存配列は不変）
    rerender(
      <AuthProvider>
        <div data-testid="protected">Protected</div>
      </AuthProvider>,
    );

    expect(mockReplace).toHaveBeenCalledTimes(1);
  });
});
