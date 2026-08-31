import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import { ConfirmDialog } from "./confirm-dialog";

/**
 * ConfirmDialog（共通確認ダイアログ）の単体テスト
 *
 * このコンポーネント自身が持つ責務（表示内容とコールバックの発火）のみを対象とし、
 * AlertDialog/Radix UIの内部動作（アニメーション等）は対象としない。
 */
describe("ConfirmDialog", () => {
  /**
   * @test open=trueの場合にtitle/descriptionが表示されることを確認
   */
  test("open=trueの場合、title・descriptionが表示される", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="入力内容を破棄しますか？"
        description="保存されていない変更は失われます。"
        onConfirm={vi.fn()}
      />,
    );

    expect(screen.getByText("入力内容を破棄しますか？")).toBeInTheDocument();
    expect(
      screen.getByText("保存されていない変更は失われます。"),
    ).toBeInTheDocument();
  });

  /**
   * @test open=falseの場合、ダイアログの内容が表示されないことを確認
   */
  test("open=falseの場合は表示されない", () => {
    render(
      <ConfirmDialog
        open={false}
        onOpenChange={vi.fn()}
        title="入力内容を破棄しますか？"
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.queryByText("入力内容を破棄しますか？"),
    ).not.toBeInTheDocument();
  });

  /**
   * @test confirmLabel/cancelLabelを指定した場合、そのラベルでボタンが表示されることを確認
   */
  test("confirmLabel・cancelLabelを指定するとボタンのラベルが変わる", () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="この車両を削除しますか？"
        confirmLabel="削除する"
        cancelLabel="やめる"
        onConfirm={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "削除する" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "やめる" })).toBeInTheDocument();
  });

  /**
   * @test 確定ボタンをクリックするとonConfirmが呼ばれることを確認
   */
  test("確定ボタンをクリックするとonConfirmが呼ばれる", async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="入力内容を破棄しますか？"
        confirmLabel="破棄する"
        onConfirm={onConfirm}
      />,
    );

    await user.click(screen.getByRole("button", { name: "破棄する" }));

    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  /**
   * @test キャンセルボタンをクリックするとonOpenChange(false)が呼ばれることを確認
   */
  test("キャンセルボタンをクリックするとonOpenChangeが呼ばれる", async () => {
    const user = userEvent.setup();
    const onOpenChange = vi.fn();

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={onOpenChange}
        title="入力内容を破棄しますか？"
        cancelLabel="キャンセル"
        onConfirm={vi.fn()}
      />,
    );

    await user.click(screen.getByRole("button", { name: "キャンセル" }));

    expect(onOpenChange).toHaveBeenCalledWith(false);
  });
});
