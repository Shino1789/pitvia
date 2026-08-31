import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi, beforeEach } from "vitest";
import { RegisterForm } from "./register-form";

// register 関数のモック化
const mockRegister = vi.fn();

// useRegister カスタムフックをモック化してUI単体テストに集中させる
vi.mock("../hooks/use-register", () => ({
  useRegister: () => ({
    register: mockRegister,
    isLoading: false,
    error: null,
  }),
}));

/**
 * 新規ユーザー登録フォームコンポーネントの単体テスト
 */
describe("RegisterForm", () => {
  beforeEach(() => {
    // 各テスト実行前にモックの呼び出し履歴をクリア
    vi.clearAllMocks();
  });

  /**
   * @test UIコンポーネントが初期状態で正しくレンダリングされていることを確認
   */
  test("アカウント登録フォームのUIが表示される", () => {
    render(<RegisterForm />);

    // 主要なボタンや入力エリアが存在するかを検証
    expect(
      screen.getByRole("button", {
        name: /アカウントを作成/,
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("example@email.com"),
    ).toBeInTheDocument();
  });

  /**
   * @test 必須項目や規約同意を全て満たして送信した際、登録フックが正しい値で呼び出されるか検証
   */
  test("入力して送信するとregisterが呼ばれる", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    // 各フィールドに入力をシミュレート
    await user.type(screen.getByPlaceholderText("山田 太郎"), "山田 太郎");
    await user.type(
      screen.getByPlaceholderText("example@email.com"),
      "test@example.com",
    );
    await user.type(screen.getByPlaceholderText("8文字以上"), "password123");
    await user.type(
      screen.getByPlaceholderText("パスワードを再入力"),
      "password123",
    );

    // 利用規約・プライバシーポリシー同意のチェックボックスをクリック
    await user.click(screen.getByRole("checkbox"));

    // 送信ボタンをクリック
    await user.click(
      screen.getByRole("button", {
        name: /アカウントを作成/,
      }),
    );

    // 期待通りのオブジェクト構造で登録処理が呼ばれたかを検証
    expect(mockRegister).toHaveBeenCalledTimes(1);
    expect(mockRegister).toHaveBeenCalledWith({
      role: "OWNER",
      userName: "山田 太郎",
      email: "test@example.com",
      password: "password123",
      confirmPassword: "password123",
    });
  });

  /**
   * @test 利用規約のチェックボックスが未チェックの場合、ボタンが不活性になり登録処理がブロックされることを検証
   */
  test("利用規約未同意ではregisterが呼ばれない", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    // チェックボックスのクリックだけを意図的に除外して入力
    await user.type(screen.getByPlaceholderText("山田 太郎"), "山田 太郎");
    await user.type(
      screen.getByPlaceholderText("example@email.com"),
      "test@example.com",
    );
    await user.type(screen.getByPlaceholderText("8文字以上"), "password123");
    await user.type(
      screen.getByPlaceholderText("パスワードを再入力"),
      "password123",
    );

    // ボタンが非活性（disabled）になっているか検証
    const button = screen.getByRole("button", {
      name: /アカウントを作成/,
    });
    expect(button).toBeDisabled();

    // 登録ハンドラーが発火していないことを検証
    expect(mockRegister).not.toHaveBeenCalled();
  });

  /**
   * @test パスワードと確認用パスワードの入力値が不一致の場合、バリデーションで弾かれ登録が呼ばれないことを検証
   */
  test("パスワードが一致しない場合はregisterが呼ばれない", async () => {
    const user = userEvent.setup();
    render(<RegisterForm />);

    await user.type(screen.getByPlaceholderText("山田 太郎"), "山田 太郎");
    await user.type(
      screen.getByPlaceholderText("example@email.com"),
      "test@example.com",
    );
    // 異なるパスワードをそれぞれ入力
    await user.type(screen.getByPlaceholderText("8文字以上"), "password123");
    await user.type(
      screen.getByPlaceholderText("パスワードを再入力"),
      "password999",
    );
    await user.click(screen.getByRole("checkbox"));
    await user.click(
      screen.getByRole("button", {
        name: /アカウントを作成/,
      }),
    );

    // クライアントサイドバリデーションにより送信がストップしているか検証
    expect(mockRegister).not.toHaveBeenCalled();
  });
});
