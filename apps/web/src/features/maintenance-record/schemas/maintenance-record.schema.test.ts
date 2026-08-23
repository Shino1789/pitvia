import { describe, test, expect } from "vitest";
import {
  maintenanceRecordSchema,
  toCreateMaintenanceRecordRequest,
  calculateTotalCost,
  EMPTY_WORK_ITEM_FORM_VALUES,
  EMPTY_PART_FORM_VALUES,
} from "./maintenance-record.schema";

/** 正常な部品入力値 */
const VALID_PART = {
  partCondition: "NEW",
  partName: "オイルフィルター",
  manufacturerName: "カストロール",
  partModelNumber: "C-111",
  quantity: "1",
  unitPrice: "1200",
};

/** 正常な作業項目入力値（部品1件を含む） */
const VALID_WORK_ITEM = {
  maintenanceCategory: "ENGINE",
  workContent: "エンジンオイル交換",
  performedBy: "ガレージ田中",
  laborCost: "2000",
  parts: [VALID_PART],
};

/** 正常な入力値のベース（各テストで一部を上書きして使う） */
const VALID_INPUT = {
  vehicleId: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
  title: "車検対応",
  maintenanceType: "VEHICLE_INSPECTION",
  workDateFrom: "2026-04-10",
  workDateTo: "2026-04-10",
  mileage: "70600",
  remarks: "次回はブレーキフルードも交換予定",
  workItems: [VALID_WORK_ITEM],
};

/**
 * maintenanceRecordSchema（整備履歴登録・変更フォームのバリデーションスキーマ）の単体テスト
 */
describe("maintenanceRecordSchema", () => {
  test("正常な入力値はバリデーションを通過する", () => {
    const result = maintenanceRecordSchema.safeParse(VALID_INPUT);
    expect(result.success).toBe(true);
  });

  test("任意項目（作業終了日・備考）が空文字でもバリデーションを通過する", () => {
    const result = maintenanceRecordSchema.safeParse({
      ...VALID_INPUT,
      workDateTo: "",
      remarks: "",
    });
    expect(result.success).toBe(true);
  });

  test("部品を伴わない作業項目（空配列）でもバリデーションを通過する", () => {
    const result = maintenanceRecordSchema.safeParse({
      ...VALID_INPUT,
      workItems: [{ ...VALID_WORK_ITEM, parts: [] }],
    });
    expect(result.success).toBe(true);
  });

  describe("トップレベル必須項目の欠落", () => {
    test.each([
      ["vehicleId", ""],
      ["title", ""],
      ["maintenanceType", ""],
      ["workDateFrom", ""],
    ])("%sが空の場合はバリデーションエラーになる", (field) => {
      const result = maintenanceRecordSchema.safeParse({
        ...VALID_INPUT,
        [field]: "",
      });
      expect(result.success).toBe(false);
    });

    test("workItemsが空配列の場合はバリデーションエラーになる", () => {
      const result = maintenanceRecordSchema.safeParse({
        ...VALID_INPUT,
        workItems: [],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("作業終了日の範囲チェック", () => {
    test("作業終了日が作業開始日と同日であればバリデーションを通過する", () => {
      const result = maintenanceRecordSchema.safeParse({
        ...VALID_INPUT,
        workDateFrom: "2026-04-10",
        workDateTo: "2026-04-10",
      });
      expect(result.success).toBe(true);
    });

    test("作業終了日が作業開始日より後であればバリデーションを通過する", () => {
      const result = maintenanceRecordSchema.safeParse({
        ...VALID_INPUT,
        workDateFrom: "2026-04-10",
        workDateTo: "2026-04-15",
      });
      expect(result.success).toBe(true);
    });

    test("作業終了日が作業開始日より前の場合はバリデーションエラーになる", () => {
      const result = maintenanceRecordSchema.safeParse({
        ...VALID_INPUT,
        workDateFrom: "2026-04-10",
        workDateTo: "2026-04-05",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path).toEqual(["workDateTo"]);
      }
    });
  });

  describe("走行距離の境界値", () => {
    test("走行距離が0であればバリデーションを通過する", () => {
      const result = maintenanceRecordSchema.safeParse({
        ...VALID_INPUT,
        mileage: "0",
      });
      expect(result.success).toBe(true);
    });

    test("走行距離が負数の場合はバリデーションエラーになる", () => {
      const result = maintenanceRecordSchema.safeParse({
        ...VALID_INPUT,
        mileage: "-1",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("作業項目のバリデーション", () => {
    test.each([
      ["maintenanceCategory", ""],
      ["workContent", ""],
      ["performedBy", ""],
      ["laborCost", ""],
    ])("%sが空の場合はバリデーションエラーになる", (field) => {
      const result = maintenanceRecordSchema.safeParse({
        ...VALID_INPUT,
        workItems: [{ ...VALID_WORK_ITEM, [field]: "" }],
      });
      expect(result.success).toBe(false);
    });

    test("工賃が負数の場合はバリデーションエラーになる", () => {
      const result = maintenanceRecordSchema.safeParse({
        ...VALID_INPUT,
        workItems: [{ ...VALID_WORK_ITEM, laborCost: "-100" }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe("部品のバリデーション", () => {
    test("部品名が空の場合はバリデーションエラーになる", () => {
      const result = maintenanceRecordSchema.safeParse({
        ...VALID_INPUT,
        workItems: [
          { ...VALID_WORK_ITEM, parts: [{ ...VALID_PART, partName: "" }] },
        ],
      });
      expect(result.success).toBe(false);
    });

    test("数量が0の場合はバリデーションエラーになる（0より大きい値が必須）", () => {
      const result = maintenanceRecordSchema.safeParse({
        ...VALID_INPUT,
        workItems: [
          { ...VALID_WORK_ITEM, parts: [{ ...VALID_PART, quantity: "0" }] },
        ],
      });
      expect(result.success).toBe(false);
    });

    test("単価が負数の場合はバリデーションエラーになる", () => {
      const result = maintenanceRecordSchema.safeParse({
        ...VALID_INPUT,
        workItems: [
          { ...VALID_WORK_ITEM, parts: [{ ...VALID_PART, unitPrice: "-1" }] },
        ],
      });
      expect(result.success).toBe(false);
    });

    test("部品状態が未選択（空文字）でもバリデーションを通過する", () => {
      const result = maintenanceRecordSchema.safeParse({
        ...VALID_INPUT,
        workItems: [
          {
            ...VALID_WORK_ITEM,
            parts: [{ ...VALID_PART, partCondition: "" }],
          },
        ],
      });
      expect(result.success).toBe(true);
    });
  });
});

/**
 * toCreateMaintenanceRecordRequest（フォーム入力値→APIリクエストへの変換）の単体テスト
 */
describe("toCreateMaintenanceRecordRequest", () => {
  test("フォーム入力値を整備履歴登録APIリクエストの形式へ変換する", () => {
    const parsed = maintenanceRecordSchema.parse(VALID_INPUT);
    const request = toCreateMaintenanceRecordRequest(parsed);

    expect(request).toEqual({
      vehicleId: "c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a33",
      title: "車検対応",
      maintenanceType: "VEHICLE_INSPECTION",
      workDateFrom: "2026-04-10",
      workDateTo: "2026-04-10",
      mileage: 70600,
      remarks: "次回はブレーキフルードも交換予定",
      workItems: [
        {
          maintenanceCategory: "ENGINE",
          workContent: "エンジンオイル交換",
          performedBy: "ガレージ田中",
          laborCost: 2000,
          parts: [
            {
              partCondition: "NEW",
              partName: "オイルフィルター",
              manufacturerName: "カストロール",
              partModelNumber: "C-111",
              quantity: 1,
              unitPrice: 1200,
            },
          ],
        },
      ],
    });
  });

  test("任意項目が空文字の場合はnullへ変換される", () => {
    const parsed = maintenanceRecordSchema.parse({
      ...VALID_INPUT,
      workDateTo: "",
      remarks: "",
      workItems: [
        {
          ...VALID_WORK_ITEM,
          parts: [
            {
              ...VALID_PART,
              partCondition: "",
              manufacturerName: "",
              partModelNumber: "",
            },
          ],
        },
      ],
    });
    const request = toCreateMaintenanceRecordRequest(parsed);

    expect(request.workDateTo).toBeNull();
    expect(request.remarks).toBeNull();
    expect(request.workItems[0].parts[0].partCondition).toBeNull();
    expect(request.workItems[0].parts[0].manufacturerName).toBeNull();
    expect(request.workItems[0].parts[0].partModelNumber).toBeNull();
  });
});

/**
 * calculateTotalCost（合計金額算出）の単体テスト
 */
describe("calculateTotalCost", () => {
  test("工賃と部品代（数量×単価）の合計を算出する", () => {
    const total = calculateTotalCost([
      {
        ...VALID_WORK_ITEM,
        laborCost: "2000",
        parts: [
          { ...VALID_PART, quantity: "4", unitPrice: "1500" }, // 6000
        ],
      },
      {
        ...EMPTY_WORK_ITEM_FORM_VALUES,
        laborCost: "8000",
        parts: [{ ...EMPTY_PART_FORM_VALUES, quantity: "2", unitPrice: "500" }], // 1000
      },
    ]);

    // 2000 + 6000 + 8000 + 1000 = 17000
    expect(total).toBe(17000);
  });

  test("作業項目・部品が空の場合は0を返す", () => {
    expect(calculateTotalCost([])).toBe(0);
  });

  test("数値として解釈できない入力値は0として扱う", () => {
    const total = calculateTotalCost([
      { ...EMPTY_WORK_ITEM_FORM_VALUES, laborCost: "", parts: [] },
    ]);
    expect(total).toBe(0);
  });
});
