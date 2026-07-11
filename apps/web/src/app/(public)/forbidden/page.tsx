import { ErrorPage } from "@/shared/components/error/error-page";

/**
 * 403 Forbidden エラー画面コンポーネント
 *
 * @component
 * @returns 403 エラーページのJSX要素
 */
export default function ForbiddenPage() {
  return (
    <ErrorPage
      code="403"
      title="FORBIDDEN"
      description="このページにアクセスする権限がありません。"
    />
  );
}
