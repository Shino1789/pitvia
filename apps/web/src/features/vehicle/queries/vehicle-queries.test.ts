import { describe, test, expect } from "vitest";
import { vehicleQueries } from "./vehicle-queries";

/**
 * vehicleQueries（Query Options定義）の単体テスト
 *
 * queryFn/queryKey自体の実行はTanStack Queryの責務のため対象外とし、
 * このモジュール固有のロジックである`enabled`の条件分岐のみを検証する。
 */
describe("vehicleQueries.detail", () => {
  /**
   * @test 車両IDが空文字の場合、クエリが無効化される（enabled: false）ことを確認
   */
  test("vehicleIdが空文字の場合はenabledがfalseになる", () => {
    expect(vehicleQueries.detail("").enabled).toBe(false);
  });

  /**
   * @test 車両IDが指定されている場合、クエリが有効化される（enabled: true）ことを確認
   */
  test("vehicleIdが指定されている場合はenabledがtrueになる", () => {
    expect(vehicleQueries.detail("vehicle-id-123").enabled).toBe(true);
  });
});
