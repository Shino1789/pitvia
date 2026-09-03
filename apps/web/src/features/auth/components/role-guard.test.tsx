import { render, screen, waitFor } from "@testing-library/react";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { RoleGuard } from "./role-guard";
import { useAuthStore } from "@/stores/auth-store";
import { ROUTES } from "@/shared/constants/routes";
import { USER_ROLE } from "@/shared/constants/role";
import type { User } from "@/shared/types/user";

// ルーター移動を検証するためのモック関数
const mockReplace = vi.fn();

// useRouter()が返すオブジェクトは再レンダー間で同一参照を保つ必要がある
// （毎回新しいオブジェクトを返すと、依存する副作用が意図せず再実行される場合があるため）
const mockRouter = { replace: mockReplace };

// Next.js のナビゲーション関連フックをモック化
vi.mock("next/navigation", () => ({
  useRouter: () => mockRouter,
}));

/**
 * テスト用ユーザーオブジェクトを生成する
 *
 * @param role ユーザーロール
 */
const createUser = (role: User["role"]): User => ({
  userId: "u1",
  userName: "test",
  email: "test@example.com",
  role,
  iconUrl: null,
});

describe("RoleGuard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 各テスト開始前に認証ストアを未ログイン状態へリセット
    useAuthStore.getState().clearAuth();
  });

  /**
   * @test 未ログイン（user === null）の場合、ログイン画面へ遷移しchildrenを描画しない
   */
  test("未ログインの場合はログイン画面へ遷移しchildrenを表示しない", async () => {
    render(
      <RoleGuard allow={[USER_ROLE.OWNER, USER_ROLE.SHOP]}>
        <div data-testid="protected">Protected</div>
      </RoleGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(ROUTES.LOGIN);
    });
    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
  });

  /**
   * @test ログイン済みだが許可されていないロールの場合、403画面へ遷移しchildrenを描画しない
   */
  test("ログイン済みだがRole不許可の場合は403画面へ遷移しchildrenを表示しない", async () => {
    useAuthStore.getState().setAuth("token", createUser("SHOP"));

    render(
      <RoleGuard allow={[USER_ROLE.OWNER]}>
        <div data-testid="protected">Protected</div>
      </RoleGuard>,
    );

    await waitFor(() => {
      expect(mockReplace).toHaveBeenCalledWith(ROUTES.FORBIDDEN);
    });
    expect(screen.queryByTestId("protected")).not.toBeInTheDocument();
  });

  /**
   * @test ログイン済みで許可されたロールの場合、childrenを表示しリダイレクトしない
   */
  test("ログイン済みでRole許可済みの場合はchildrenを表示する", async () => {
    useAuthStore.getState().setAuth("token", createUser("OWNER"));

    render(
      <RoleGuard allow={[USER_ROLE.OWNER, USER_ROLE.SHOP]}>
        <div data-testid="protected">Protected</div>
      </RoleGuard>,
    );

    await waitFor(() => {
      expect(screen.getByTestId("protected")).toBeInTheDocument();
    });
    expect(mockReplace).not.toHaveBeenCalled();
  });
});
