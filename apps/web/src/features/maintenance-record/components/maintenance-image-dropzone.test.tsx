import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import { MaintenanceImageDropzone } from "./maintenance-image-dropzone";

/**
 * MaintenanceImageDropzone（整備画像アップロード用ドロップゾーン）の単体テスト
 *
 * ドラッグ&ドロップ等の共通挙動自体は{@link ImageDropzone}（vehicle-image-dropzone.test.tsxで
 * 詳細に検証済み）に委譲しているため、ここでは本コンポーネント固有のプレビュー表示・
 * ファイル選択連携のみを確認する。
 */
describe("MaintenanceImageDropzone", () => {
  /**
   * @test previewUrlが未指定の場合、プレースホルダー文言が表示されることを確認
   */
  test("previewUrlが無い場合はプレースホルダーが表示される", () => {
    render(
      <MaintenanceImageDropzone previewUrl={null} onFileSelect={vi.fn()} />,
    );

    expect(
      screen.getByText("クリックまたはドラッグ&ドロップで画像を追加"),
    ).toBeInTheDocument();
    expect(screen.queryByAltText("整備画像プレビュー")).not.toBeInTheDocument();
  });

  /**
   * @test previewUrlが指定されている場合、プレビュー画像が表示されることを確認
   */
  test("previewUrlが指定されている場合はプレビュー画像が表示される", () => {
    render(
      <MaintenanceImageDropzone
        previewUrl="blob:http://localhost/dummy"
        onFileSelect={vi.fn()}
      />,
    );

    const image = screen.getByAltText("整備画像プレビュー");
    expect(image).toHaveAttribute("src", "blob:http://localhost/dummy");
  });

  /**
   * @test ファイルを選択するとonFileSelectが選択ファイルとともに呼ばれることを確認
   */
  test("ファイルを選択するとonFileSelectが呼ばれる", async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();

    const { container } = render(
      <MaintenanceImageDropzone previewUrl={null} onFileSelect={onFileSelect} />,
    );

    const file = new File(["dummy"], "work.png", { type: "image/png" });
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    await user.upload(input as HTMLInputElement, file);

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  /**
   * @test 削除ボタン押下でonImageRemoveが呼ばれることを確認
   */
  test("削除ボタン押下でonImageRemoveが呼ばれる", async () => {
    const user = userEvent.setup();
    const onImageRemove = vi.fn();

    render(
      <MaintenanceImageDropzone
        previewUrl="blob:http://localhost/dummy"
        onFileSelect={vi.fn()}
        onImageRemove={onImageRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "画像を削除" }));

    expect(onImageRemove).toHaveBeenCalledTimes(1);
  });
});
