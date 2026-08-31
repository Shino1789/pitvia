import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import { DashboardChartHeader } from "./dashboard-chart-header";
import { PERIOD_TYPE } from "@/shared/constants/period";

/**
 * ダッシュボードグラフヘッダーコンポーネントの単体テスト
 */
describe("DashboardChartHeader", () => {
  // テスト共通のデフォルトProps
  const defaultProps = {
    title: "整備費用推移",
    rangeLabel: "2026年7月",
    isMonthly: true,
    canMoveBackward: true,
    canMoveForward: false,
    onPrev: vi.fn(),
    onNext: vi.fn(),
    onChangePeriod: vi.fn(),
  };

  /**
   * @test UIコンポーネントが初期状態でタイトルや表示期間ラベルを正しく描画しているか確認
   */
  test("タイトルと期間ラベルが表示される", () => {
    render(<DashboardChartHeader {...defaultProps} />);

    // 主要なテキスト要素が存在することを検証
    expect(screen.getByText("整備費用推移")).toBeInTheDocument();
    expect(screen.getByText("2026年7月")).toBeInTheDocument();
  });

  /**
   * @test 過去期間（前へ）ボタンをクリックした際、親から受け取った onPrev ハンドラーが呼び出されることを確認
   */
  test("過去期間（前へ）ボタンをクリックすると onPrev が呼ばれる", async () => {
    const user = userEvent.setup();
    const onPrev = vi.fn();

    render(<DashboardChartHeader {...defaultProps} onPrev={onPrev} />);

    // アクセシビリティラベルから過去期間切り替えボタンを取得してクリックをシミュレート
    const prevButton = screen.getByLabelText("過去の期間を表示");
    await user.click(prevButton);

    // ハンドラーが1回呼ばれていることを検証
    expect(onPrev).toHaveBeenCalledTimes(1);
  });

  /**
   * @test 期間種別（年次）ボタンをクリックした際、正しく引数を持って onChangePeriod が呼び出されることを確認
   */
  test("年次ボタンをクリックすると onChangePeriod が呼ばれる", async () => {
    const user = userEvent.setup();
    const onChangePeriod = vi.fn();

    render(
      <DashboardChartHeader
        {...defaultProps}
        onChangePeriod={onChangePeriod}
      />,
    );

    // 「年次」ボタンのクリックをシミュレート
    const yearlyButton = screen.getByRole("button", { name: "年次" });
    await user.click(yearlyButton);

    // PERIOD_TYPE.YEAR パラメータを渡して呼び出されていることを検証
    expect(onChangePeriod).toHaveBeenCalledWith(PERIOD_TYPE.YEAR);
  });
});
