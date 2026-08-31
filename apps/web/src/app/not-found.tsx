import { ErrorPage } from "@/shared/components/error/error-page";

/**
 * 404 Not Found エラー画面コンポーネント
 *
 * @component
 * @returns 404 エラーページのJSX要素
 */
export default function NotFound() {
  return (
    <ErrorPage
      code="404"
      title="NOT FOUND"
      description="お探しのページは見つかりませんでした。"
    />
  );
}
