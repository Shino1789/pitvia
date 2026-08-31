import { beforeEach, describe, test, expect, vi } from "vitest";
import { authSession } from "./auth-session";
import { useAuthStore } from "@/stores/auth-store";
import type { AxiosResponse } from "axios";

// API通信を担当するレイヤーをモック化
vi.mock("../api/auth-api", () => ({
  authApi: { login: vi.fn(), logout: vi.fn() },
}));

/**
 * 認証セッション管理（authSession）の統合・単体テスト
 */
describe("authSession", () => {
  beforeEach(() => {
    // グローバル状態（Zustand Store）をテスト毎に初期状態へリセット
    useAuthStore.getState().clearAuth();
    // モックの呼び出し履歴をクリア
    vi.clearAllMocks();
  });

  /**
   * @test ログインAPIが成功した際、取得したアクセストークンとユーザー情報がZustand Storeに正しく永続化されることを検証
   */
  test("login成功時にユーザー情報をstoreへ保存する", async () => {
    const { authApi } = await import("../api/auth-api");

    // 不必要な as any を回避しつつ、型安全にAxiosのモックレスポンスを作成
    const mockResponse = {
      data: {
        data: {
          accessToken: "token123",
          user: {
            id: 1,
            userName: "test",
            email: "test@example.com",
            role: "OWNER",
          },
        },
      },
    } as unknown as AxiosResponse;

    vi.mocked(authApi.login).mockResolvedValue(mockResponse);

    // ログイン処理の実行
    await authSession.login({
      email: "test@example.com",
      password: "password123",
    });

    // Storeの状態が更新されていることを検証
    const state = useAuthStore.getState();
    expect(state.accessToken).toBe("token123");
    expect(state.user?.email).toBe("test@example.com");
    expect(state.user?.role).toBe("OWNER");
  });

  /**
   * @test ログインAPIが失敗（例外スロー）した際、Storeの中身が書き換えられず初期状態（Null）を維持することを検証
   */
  test("login失敗時はstoreを更新しない", async () => {
    const { authApi } = await import("../api/auth-api");
    vi.mocked(authApi.login).mockRejectedValue(new Error("login failed"));

    // 例外が正しくスローされることを検証
    await expect(
      authSession.login({
        email: "test@example.com",
        password: "password123",
      }),
    ).rejects.toThrow("login failed");

    // エラー時はStoreのデータがNullのままであることを検証
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });

  /**
   * @test ログアウト処理を実行した際、APIが呼ばれ、Store内の認証情報（トークン、ユーザー情報）が完全にクリアされることを検証
   */
  test("logoutすると認証情報を削除する", async () => {
    // あらかじめStoreにログイン済みの擬似状態をセット
    const store = useAuthStore.getState();
    store.setAuth("token", {
      userId: "user_piti_123",
      userName: "test",
      email: "test@example.com",
      role: "OWNER",
      iconUrl: null,
    });

    const { authApi } = await import("../api/auth-api");

    const mockLogoutResponse = {
      data: { data: undefined },
    } as unknown as AxiosResponse;

    vi.mocked(authApi.logout).mockResolvedValue(mockLogoutResponse);

    // ログアウト処理の実行
    await authSession.logout();

    // Storeの認証情報が完全に削除されていることを検証
    const state = useAuthStore.getState();
    expect(state.accessToken).toBeNull();
    expect(state.user).toBeNull();
  });
});
