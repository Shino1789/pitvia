import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import { Pagination } from "./pagination";

/**
 * Pagination（共通ページングコンポーネント）の単体テスト
 */
describe("Pagination", () => {
  /**
   * @test 総ページ数が1以下の場合は何も表示しないことを確認
   */
  test("totalPagesが1以下の場合は何も描画しない", () => {
    const { container } = render(
      <Pagination page={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  /**
   * @test 現在ページ・先頭・末尾のページ番号ボタンが表示され、間が省略記号になることを確認
   */
  test("先頭・末尾・現在ページ周辺のページ番号と省略記号を表示する", () => {
    render(<Pagination page={5} totalPages={12} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "4" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "5" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "6" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "12" })).toBeInTheDocument();
    // 1と4の間、6と12の間はそれぞれ省略される
    expect(screen.getAllByText("…").length).toBe(2);
  });

  /**
   * @test 現在ページのボタンにaria-current="page"が設定されることを確認
   */
  test("現在ページのボタンにaria-currentが設定される", () => {
    render(<Pagination page={5} totalPages={12} onPageChange={vi.fn()} />);

    expect(screen.getByRole("button", { name: "5" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    expect(screen.getByRole("button", { name: "6" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  /**
   * @test ページ番号ボタン押下でonPageChangeが該当ページ番号で呼ばれることを確認
   */
  test("ページ番号ボタン押下でonPageChangeが呼ばれる", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "4" }));

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  /**
   * @test 前へ/次へボタン押下で、それぞれ前後のページ番号でonPageChangeが呼ばれることを確認
   */
  test("前へ/次へボタンで前後のページへ移動できる", async () => {
    const user = userEvent.setup();
    const onPageChange = vi.fn();
    render(<Pagination page={3} totalPages={5} onPageChange={onPageChange} />);

    await user.click(screen.getByRole("button", { name: "前のページ" }));
    expect(onPageChange).toHaveBeenCalledWith(2);

    await user.click(screen.getByRole("button", { name: "次のページ" }));
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  /**
   * @test 先頭ページでは「前のページ」ボタンが、末尾ページでは「次のページ」ボタンが無効化されることを確認
   */
  test("先頭・末尾ページでは移動ボタンが無効化される", () => {
    const { rerender } = render(
      <Pagination page={1} totalPages={5} onPageChange={vi.fn()} />,
    );
    expect(screen.getByRole("button", { name: "前のページ" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "次のページ" })).toBeEnabled();

    rerender(<Pagination page={5} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByRole("button", { name: "前のページ" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "次のページ" })).toBeDisabled();
  });
});
