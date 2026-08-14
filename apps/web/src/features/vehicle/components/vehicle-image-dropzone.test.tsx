import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, test, expect, vi } from "vitest";
import { VehicleImageDropzone } from "./vehicle-image-dropzone";

/**
 * VehicleImageDropzone（車両画像アップロード用ドロップゾーン）の単体テスト
 */
describe("VehicleImageDropzone", () => {
  /**
   * @test previewUrlが未指定の場合、プレースホルダー（UPLOAD PHOTO）が表示されることを確認
   */
  test("previewUrlが無い場合はプレースホルダーが表示される", () => {
    render(
      <VehicleImageDropzone previewUrl={null} onFileSelect={vi.fn()} />,
    );

    expect(screen.getByText("UPLOAD PHOTO")).toBeInTheDocument();
    expect(screen.queryByAltText("車両画像プレビュー")).not.toBeInTheDocument();
  });

  /**
   * @test previewUrlが指定されている場合、プレビュー画像が表示されることを確認
   */
  test("previewUrlが指定されている場合はプレビュー画像が表示される", () => {
    render(
      <VehicleImageDropzone
        previewUrl="blob:http://localhost/dummy"
        onFileSelect={vi.fn()}
      />,
    );

    const image = screen.getByAltText("車両画像プレビュー");
    expect(image).toHaveAttribute("src", "blob:http://localhost/dummy");
  });

  /**
   * @test ファイル選択（隠しinput経由）によってonFileSelectが選択ファイルとともに呼ばれることを確認
   */
  test("ファイルを選択するとonFileSelectが呼ばれる", async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();

    const { container } = render(
      <VehicleImageDropzone previewUrl={null} onFileSelect={onFileSelect} />,
    );

    const file = new File(["dummy"], "icon.png", { type: "image/png" });
    // 隠しinput（sr-only）はクエリでアクセスできるがrole="button"では無いため、直接取得する
    const input = container.querySelector('input[type="file"]');
    expect(input).not.toBeNull();

    await user.upload(input as HTMLInputElement, file);

    expect(onFileSelect).toHaveBeenCalledWith(file);
  });

  /**
   * @test disabled=trueの場合、ファイル選択用inputが描画されず、
   * ルート要素にaria-disabledが付与されることを確認
   */
  test("disabled=trueの場合はinputが描画されず操作不可になる", () => {
    const { container } = render(
      <VehicleImageDropzone
        previewUrl={null}
        onFileSelect={vi.fn()}
        disabled
      />,
    );

    expect(container.querySelector('input[type="file"]')).toBeNull();
    expect(screen.getByRole("button")).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  /**
   * @test previewUrl・onImageRemoveの両方が指定されている場合、削除ボタンが表示されることを確認
   */
  test("previewUrlとonImageRemoveが指定されている場合は削除ボタンが表示される", () => {
    render(
      <VehicleImageDropzone
        previewUrl="blob:http://localhost/dummy"
        onFileSelect={vi.fn()}
        onImageRemove={vi.fn()}
      />,
    );

    expect(
      screen.getByRole("button", { name: "画像を削除" }),
    ).toBeInTheDocument();
  });

  /**
   * @test onImageRemove未指定の場合、previewUrlがあっても削除ボタンが表示されないことを確認
   */
  test("onImageRemove未指定の場合は削除ボタンが表示されない", () => {
    render(
      <VehicleImageDropzone
        previewUrl="blob:http://localhost/dummy"
        onFileSelect={vi.fn()}
      />,
    );

    expect(
      screen.queryByRole("button", { name: "画像を削除" }),
    ).not.toBeInTheDocument();
  });

  /**
   * @test disabled=trueの場合、previewUrl・onImageRemoveが指定されていても
   * 削除ボタンが表示されないことを確認（閲覧モードでの誤操作防止）
   */
  test("disabled=trueの場合は削除ボタンが表示されない", () => {
    render(
      <VehicleImageDropzone
        previewUrl="blob:http://localhost/dummy"
        onFileSelect={vi.fn()}
        onImageRemove={vi.fn()}
        disabled
      />,
    );

    expect(
      screen.queryByRole("button", { name: "画像を削除" }),
    ).not.toBeInTheDocument();
  });

  /**
   * @test 削除ボタン押下時、onImageRemoveが呼ばれ、onFileSelect（親のファイル選択処理）は
   * 呼ばれない（クリックイベントの伝播が止められている）ことを確認
   */
  test("削除ボタン押下でonImageRemoveのみが呼ばれる", async () => {
    const user = userEvent.setup();
    const onFileSelect = vi.fn();
    const onImageRemove = vi.fn();

    render(
      <VehicleImageDropzone
        previewUrl="blob:http://localhost/dummy"
        onFileSelect={onFileSelect}
        onImageRemove={onImageRemove}
      />,
    );

    await user.click(screen.getByRole("button", { name: "画像を削除" }));

    expect(onImageRemove).toHaveBeenCalledTimes(1);
    expect(onFileSelect).not.toHaveBeenCalled();
  });
});
