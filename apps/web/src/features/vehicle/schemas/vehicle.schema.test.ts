import { describe, test, expect } from "vitest";
import { vehicleSchema, toCreateVehicleRequest } from "./vehicle.schema";

/** 正常な入力値のベース（各テストで一部を上書きして使う） */
const VALID_INPUT = {
  modelName: "RX-7",
  manufacturerId: "1",
  modelCode: "FD3S",
  engineCode: "13B-REW",
  modelYear: "2002",
  licensePlate: "品川 300 な 77-77",
  currentMileage: "85000",
  transmissionType: "MT",
  driveType: "FR",
  memo: "オーナーのメイン車両",
};

/**
 * vehicleSchema（車両登録・変更フォームのバリデーションスキーマ）の単体テスト
 *
 * Zod自体の仕様確認ではなく、「Pitviaの車両フォームとして正しい入力/不正な入力を
 * 判定できるか」というビジネスルールの観点でテストする。
 */
describe("vehicleSchema", () => {
  /**
   * @test 全項目を正しく入力した場合、バリデーションが通ることを確認
   */
  test("正常な入力値はバリデーションを通過する", () => {
    const result = vehicleSchema.safeParse(VALID_INPUT);
    expect(result.success).toBe(true);
  });

  /**
   * @test 任意項目（型式・エンジン型式・ナンバープレート・メモ）が空文字でもバリデーションを通過することを確認
   */
  test("任意項目が空文字でもバリデーションを通過する", () => {
    const result = vehicleSchema.safeParse({
      ...VALID_INPUT,
      modelCode: "",
      engineCode: "",
      licensePlate: "",
      memo: "",
    });
    expect(result.success).toBe(true);
  });

  describe("必須項目の欠落", () => {
    test.each([
      ["modelName", ""],
      ["manufacturerId", ""],
      ["modelYear", ""],
      ["currentMileage", ""],
      ["transmissionType", ""],
      ["driveType", ""],
    ])("%sが空の場合はバリデーションエラーになる", (field) => {
      const result = vehicleSchema.safeParse({
        ...VALID_INPUT,
        [field]: "",
      });
      expect(result.success).toBe(false);
    });
  });

  /**
   * @test メーカー未選択（フォーム初期値である"0"扱いの空文字）は必須エラーとして扱われることを確認
   */
  test("manufacturerIdが0以下の場合はバリデーションエラーになる", () => {
    const result = vehicleSchema.safeParse({
      ...VALID_INPUT,
      manufacturerId: "0",
    });
    expect(result.success).toBe(false);
  });

  describe("文字数制限", () => {
    test("車名が255文字以内であればバリデーションを通過する", () => {
      const result = vehicleSchema.safeParse({
        ...VALID_INPUT,
        modelName: "あ".repeat(255),
      });
      expect(result.success).toBe(true);
    });

    test("車名が256文字を超えるとバリデーションエラーになる", () => {
      const result = vehicleSchema.safeParse({
        ...VALID_INPUT,
        modelName: "あ".repeat(256),
      });
      expect(result.success).toBe(false);
    });

    test("型式が101文字を超えるとバリデーションエラーになる", () => {
      const result = vehicleSchema.safeParse({
        ...VALID_INPUT,
        modelCode: "A".repeat(101),
      });
      expect(result.success).toBe(false);
    });
  });

  describe("年式の境界値", () => {
    test("年式が1900年ちょうどであればバリデーションを通過する", () => {
      const result = vehicleSchema.safeParse({
        ...VALID_INPUT,
        modelYear: "1900",
      });
      expect(result.success).toBe(true);
    });

    test("年式が1900年未満はバリデーションエラーになる", () => {
      const result = vehicleSchema.safeParse({
        ...VALID_INPUT,
        modelYear: "1899",
      });
      expect(result.success).toBe(false);
    });

    test("年式が来年（許容オフセット+1年）であればバリデーションを通過する", () => {
      const nextYear = new Date().getFullYear() + 1;
      const result = vehicleSchema.safeParse({
        ...VALID_INPUT,
        modelYear: String(nextYear),
      });
      expect(result.success).toBe(true);
    });

    test("年式が再来年（許容オフセットを超える未来）はバリデーションエラーになる", () => {
      const tooFarFuture = new Date().getFullYear() + 2;
      const result = vehicleSchema.safeParse({
        ...VALID_INPUT,
        modelYear: String(tooFarFuture),
      });
      expect(result.success).toBe(false);
    });

    test("年式が整数でない場合はバリデーションエラーになる", () => {
      const result = vehicleSchema.safeParse({
        ...VALID_INPUT,
        modelYear: "2002.5",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("走行距離の境界値", () => {
    test("走行距離が0であればバリデーションを通過する", () => {
      const result = vehicleSchema.safeParse({
        ...VALID_INPUT,
        currentMileage: "0",
      });
      expect(result.success).toBe(true);
    });

    test("走行距離が負数の場合はバリデーションエラーになる", () => {
      const result = vehicleSchema.safeParse({
        ...VALID_INPUT,
        currentMileage: "-1",
      });
      expect(result.success).toBe(false);
    });

    test("走行距離が整数でない場合はバリデーションエラーになる", () => {
      const result = vehicleSchema.safeParse({
        ...VALID_INPUT,
        currentMileage: "1000.5",
      });
      expect(result.success).toBe(false);
    });

    test("走行距離が数値として解釈できない文字列の場合はバリデーションエラーになる", () => {
      const result = vehicleSchema.safeParse({
        ...VALID_INPUT,
        currentMileage: "abc",
      });
      expect(result.success).toBe(false);
    });
  });
});

/**
 * toCreateVehicleRequest（フォーム入力値→APIリクエストへの変換）の単体テスト
 */
describe("toCreateVehicleRequest", () => {
  /**
   * @test 文字列で保持しているフォーム値が、数値項目については正しくnumberへ変換され、
   * vehicleTypeが付与されたAPIリクエスト形式になることを確認
   */
  test("フォーム入力値を車両登録APIリクエストの形式へ変換する", () => {
    const parsed = vehicleSchema.parse(VALID_INPUT);
    const request = toCreateVehicleRequest(parsed, "CAR");

    expect(request).toEqual({
      vehicleType: "CAR",
      modelName: "RX-7",
      manufacturerId: 1,
      modelCode: "FD3S",
      engineCode: "13B-REW",
      modelYear: 2002,
      licensePlate: "品川 300 な 77-77",
      currentMileage: 85000,
      transmissionType: "MT",
      driveType: "FR",
      memo: "オーナーのメイン車両",
    });
  });
});
