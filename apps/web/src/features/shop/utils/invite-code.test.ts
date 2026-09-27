import { describe, test, expect } from "vitest";
import { formatInviteCode } from "./invite-code";

/**
 * formatInviteCode（招待コード入力欄の整形）の単体テスト
 */
describe("formatInviteCode", () => {
  /**
   * @test ショップ側でコピーした「XXXX-XXXX」形式をそのままペーストしても、ハイフンが二重にならないことを確認
   */
  test("ハイフン付きコードをペーストしてもハイフンは1つのまま", () => {
    expect(formatInviteCode("XHVQ-2XCK")).toBe("XHVQ-2XCK");
  });

  /**
   * @test ハイフンが二重・三重に含まれる入力も、1つに正規化されることを確認
   */
  test("ハイフンが重複した入力は1つに正規化される", () => {
    expect(formatInviteCode("XHVQ--2XCK")).toBe("XHVQ-2XCK");
    expect(formatInviteCode("XHVQ---2XCK")).toBe("XHVQ-2XCK");
  });

  /**
   * @test ハイフン無しのペーストにもハイフンが自動挿入されることを確認
   */
  test("ハイフン無しの8文字にはハイフンが挿入される", () => {
    expect(formatInviteCode("XHVQ2XCK")).toBe("XHVQ-2XCK");
  });

  /**
   * @test 小文字が大文字へ変換されることを確認
   */
  test("小文字は大文字へ変換される", () => {
    expect(formatInviteCode("xhvq2xck")).toBe("XHVQ-2XCK");
    expect(formatInviteCode("xhVq-2xCk")).toBe("XHVQ-2XCK");
  });

  /**
   * @test 全角英数字（日本語IME）が半角へ変換されることを確認
   */
  test("全角英数字は半角へ変換される", () => {
    expect(formatInviteCode("ＸＨＶＱ－２ＸＣＫ")).toBe("XHVQ-2XCK");
  });

  /**
   * @test 前後・途中の空白（メール本文からのコピー時に混入しやすい）が除去されることを確認
   */
  test("前後や途中の空白は除去される", () => {
    expect(formatInviteCode("  XHVQ-2XCK  ")).toBe("XHVQ-2XCK");
    expect(formatInviteCode("XHVQ 2XCK")).toBe("XHVQ-2XCK");
    expect(formatInviteCode("XHVQ-2XCK\n")).toBe("XHVQ-2XCK");
  });

  /**
   * @test 英数字とハイフン以外の不正文字が除去されることを確認
   */
  test("不正文字は除去される", () => {
    expect(formatInviteCode("XH!VQ_2X#CK")).toBe("XHVQ-2XCK");
    expect(formatInviteCode("あいうえ")).toBe("");
  });

  /**
   * @test 8文字（ハイフンを含め9文字）を超える入力は切り捨てられることを確認
   */
  test("8文字を超える入力は切り捨てられる", () => {
    expect(formatInviteCode("XHVQ-2XCKZZZ")).toBe("XHVQ-2XCK");
    expect(formatInviteCode("XHVQ2XCKZZZ")).toBe("XHVQ-2XCK");
  });

  /**
   * @test 1ブロック目を入力し終えた（文字数が増えた）時点でハイフンが自動付与されることを確認
   */
  test("4文字目の入力でハイフンが自動付与される", () => {
    expect(formatInviteCode("XHVQ", "XHV")).toBe("XHVQ-");
    // 空欄へ4文字だけをペーストした場合も同様
    expect(formatInviteCode("XHVQ", "")).toBe("XHVQ-");
  });

  /**
   * @test 4文字に満たない入力にはハイフンが付かないことを確認
   */
  test("4文字未満にはハイフンが付かない", () => {
    expect(formatInviteCode("XHV", "XH")).toBe("XHV");
    expect(formatInviteCode("")).toBe("");
  });

  /**
   * @test 「XHVQ-」の状態でBackspaceしても（文字数が減る入力）ハイフンが再付与されず、削除を続けられることを確認
   */
  test("削除操作ではハイフンが再付与されない", () => {
    // 「XHVQ-」でBackspace → ブラウザ上の値は「XHVQ」
    expect(formatInviteCode("XHVQ", "XHVQ-")).toBe("XHVQ");
    // さらにBackspace → 「XHV」
    expect(formatInviteCode("XHV", "XHVQ")).toBe("XHV");
  });

  /**
   * @test 「XHVQ-2」から1文字削除すると、ハイフンだけが残らず4文字の状態へ戻ることを確認
   */
  test("2ブロック目を全て削除するとハイフンも消える", () => {
    expect(formatInviteCode("XHVQ-", "XHVQ-2")).toBe("XHVQ");
  });

  /**
   * @test 全選択して別のコードで置換した場合、新しい値が正しく整形されることを確認
   */
  test("全選択して置換しても新しいコードが整形される", () => {
    expect(formatInviteCode("abcd2efg", "XHVQ-2XCK")).toBe("ABCD-2EFG");
  });
});
