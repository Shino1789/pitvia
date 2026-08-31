import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { ROUTES } from "@/shared/constants/routes";

/**
 * 未ログイン状態でもアクセスを許可する公開ルート群
 */
const publicRoutes = [
  "/",
  ROUTES.HEALTH,
  ROUTES.LOGIN,
  ROUTES.REGISTER,
  ROUTES.TERMS,
  ROUTES.PRIVACY,
] as string[];

/**
 * ログイン済みのユーザーにはアクセスさせないルート群
 */
const authRoutes = [ROUTES.LOGIN, ROUTES.REGISTER] as string[];

/**
 * アプリケーション共通のルーティング・認証ガードミドルウェア
 *
 * @param request Next.jsのリクエストオブジェクト
 * @returns 次の処理への遷移（NextResponse.next）またはリダイレクト処理
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 静的ファイルは無条件でスルー
  if (/\.(.*)$/.test(pathname)) {
    return NextResponse.next();
  }

  // バックエンドが発行したリフレッシュトークンのクッキー存在確認
  const hasRefreshToken = request.cookies.has("refresh_token");

  // 現在のアクセス先が公開ページであるか判定
  const isAuthRoute = authRoutes.includes(pathname);
  if (isAuthRoute) {
    // ログイン済みであれば、ダッシュボード画面へリダイレクト
    if (hasRefreshToken) {
      return NextResponse.redirect(new URL(ROUTES.DASHBOARD, request.url));
    }
    return NextResponse.next();
  }

  // 現在のパスが公開ルート、またはその配下のサブパスか判定
  const isPublic = publicRoutes.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );

  // 有効なクッキーを持たない未ログインユーザーは一律でログイン画面に弾く
  if (!isPublic && !hasRefreshToken) {
    const loginUrl = new URL(ROUTES.LOGIN, request.url);
    // リクエストされたパスとクエリパラメータを抽出
    const fullPath = `${pathname}${request.nextUrl.search}`;
    // ログイン後に元のページにリダイレクトするためのクエリパラメータを付与
    loginUrl.searchParams.set("callbackUrl", fullPath);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

/**
 * ミドルウェアの適用対象ルート設定
 */
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
