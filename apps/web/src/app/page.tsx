import { redirect } from "next/navigation";
import { ROUTES } from "@/shared/constants/routes";

/**
 * ルートページコンポーネント
 */
export default function RootPage() {
  // ログイン画面にリダイレクト
  redirect(ROUTES.LOGIN);
}
