import { describe, test, expect } from "vitest";
import { shopLinkSchema } from "./shop-link.schema";

/**
 * shopLinkSchema（ショップ連携フォームのバリデーションスキーマ）の単体テスト
 */
describe("shopLinkSchema", () => {
  /**
   * @test 車両と招待コードが入力されていれば検証を通過することを確認
   */
  test("車両と招待コードが入力されていれば有効", () => {
    const result = shopLinkSchema.safeParse({
      vehicleId: "vehicle-1",
      inviteCode: "A7X9-K2LM",
    });

    expect(result.success).toBe(true);
  });

  /**
   * @test 対象車両が未選択（空文字）の場合、必須エラーになることを確認
   */
  test("対象車両が未選択の場合は必須エラーになる", () => {
    const result = shopLinkSchema.safeParse({
      vehicleId: "",
      inviteCode: "A7X9-K2LM",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("対象車両は必須です");
    }
  });

  /**
   * @test 招待コードが空文字の場合、必須エラーになることを確認
   */
  test("招待コードが空の場合は必須エラーになる", () => {
    const result = shopLinkSchema.safeParse({
      vehicleId: "vehicle-1",
      inviteCode: "",
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].message).toBe("招待コードは必須です");
    }
  });

  /**
   * @test 空白のみの招待コードは未入力扱いとして必須エラーになることを確認
   */
  test("空白のみの招待コードは必須エラーになる", () => {
    const result = shopLinkSchema.safeParse({
      vehicleId: "vehicle-1",
      inviteCode: "   ",
    });

    expect(result.success).toBe(false);
  });

  /**
   * @test 招待コードの前後の空白が除去されて出力されることを確認
   */
  test("招待コードの前後の空白は除去される", () => {
    const result = shopLinkSchema.safeParse({
      vehicleId: "vehicle-1",
      inviteCode: "  A7X9-K2LM  ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.inviteCode).toBe("A7X9-K2LM");
    }
  });
});
