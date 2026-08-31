import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, test, expect, vi } from "vitest";
import { LoginForm } from "./login-form";
import { VALIDATION_MESSAGES } from "@/shared/messages/validation";

// login 関数のモック化
const mockLogin = vi.fn();

// useLogin カスタムフックをモック化してUI単体テストに集中させる
vi.mock("../hooks/use-login", () => ({
  useLogin: () => ({
    login: mockLogin,
    isLoading: false,
    error: null,
  }),
}));

/**
 * ログインフォームコンポーネントの単体テスト
 */
describe("LoginForm", () => {
  beforeEach(() => {
    // 各テスト実行前にモックの呼び出し履歴をクリア
    vi.clearAllMocks();
  });

  /**
   * @test UIコンポーネントが初期状態で正しくレンダリングされていることを確認
   */
  test("ログインフォームのUIが表示される", () => {
    render(<LoginForm />);

    // 主要な入力欄とボタンが存在することを検証
    expect(
      screen.getByPlaceholderText("example@email.com"),
    ).toBeInTheDocument();
    expect(screen.getByText("パスワード")).toBeInTheDocument();
    expect(
      screen.getByRole("button", {
        name: /ログイン/,
      }),
    ).toBeInTheDocument();
  });

  /**
   * @test 有効な入力値でフォームを送信した際、カスタムフックの処理が正しく呼び出されることを確認
   */
  test("ログインボタンをクリックするとloginが呼ばれる", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    // ユーザーによるメールアドレス入力をシミュレート
    await user.type(
      screen.getByPlaceholderText("example@email.com"),
      "test@example.com",
    );

    // プレースホルダー依存を避け、LabelTextからパスワード入力をシミュレート
    await user.type(screen.getByLabelText("パスワード"), "password123");

    // ログインボタンのクリック
    await user.click(
      screen.getByRole("button", {
        name: /ログイン/,
      }),
    );

    // ハンドラーが正しい引数で1回だけ呼ばれていることを検証
    expect(mockLogin).toHaveBeenCalledTimes(1);
    expect(mockLogin).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  /**
   * @test バリデーションエラー（必須チェック）が発生した際、処理をブロックしてエラーメッセージを表示することを確認
   */
  test("メールアドレス未入力ではloginが呼ばれない", async () => {
    const user = userEvent.setup();
    render(<LoginForm />);

    // パスワードのみ入力して送信を試みる
    await user.type(screen.getByLabelText("パスワード"), "password123");
    await user.click(
      screen.getByRole("button", {
        name: /ログイン/,
      }),
    );

    // バリデーションにより送信処理が呼ばれていないことを検証
    expect(mockLogin).not.toHaveBeenCalled();

    // エラーメッセージ表示を検証
    expect(
      await screen.findByText(VALIDATION_MESSAGES.required("メールアドレス")),
    ).toBeInTheDocument();
  });
});
