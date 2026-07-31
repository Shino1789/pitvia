import type { ReactNode } from "react";
import { Card, CardContent } from "@/shared/ui/card";
import type { LucideIcon } from "lucide-react";

/**
 * Props型定義
 */
interface StatCardProps {
  /** カードのタイトル（例: "登録車両"） */
  title: string;
  /** 表示する数値・メインテキスト（例: "3台", "¥150,000"） */
  value: string | number;
  /** サブタイトル・補足説明文（任意） */
  subtitle?: ReactNode;
  /**
   * サブタイトルのテキストカラー（デフォルト: "primary"）
   * - default: 標準のサブテキストカラー (muted-foreground)
   * - primary: メインカラー (primary)
   * - success: 成功・ポジティブな強調カラー (emerald-500)
   * - destructive: 警告・ネガティブな強調カラー (destructive)
   */
  subtitleColor?: "default" | "primary" | "success" | "destructive";
  /** 右上に表示するLucideアイコンコンポーネント */
  icon: LucideIcon;
}

/**
 * ダッシュボード画面用の統計カードコンポーネント
 *
 * @component
 */
export function StatCard({
  title,
  value,
  subtitle,
  subtitleColor = "primary",
  icon: Icon,
}: StatCardProps) {
  // サブタイトルのカラーに応じたTailwind CSSクラス定義
  const subtitleColorClasses = {
    default: "text-muted-foreground",
    primary: "text-primary",
    success: "text-emerald-500",
    destructive: "text-destructive",
  };

  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          {/* 左側：タイトル、メイン値、サブタイトル表記エリア */}
          <div>
            {/* カードタイトル */}
            <p className="text-sm text-muted-foreground">{title}</p>
            {/* 強調数値・メインテキスト */}
            <p className="text-4xl font-bold text-foreground mt-2">{value}</p>
            {/* サブタイトル（指定されている場合のみ表示） */}
            {subtitle && (
              <p
                className={`text-sm mt-1 ${subtitleColorClasses[subtitleColor]}`}
              >
                {subtitle}
              </p>
            )}
          </div>

          {/* 右側：アイコンエリア */}
          <div className="text-muted-foreground">
            <Icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
