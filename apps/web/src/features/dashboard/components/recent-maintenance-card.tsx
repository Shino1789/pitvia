import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/shared/ui/card";
import { Button } from "@/shared/ui/button";
import { Badge } from "@/shared/ui/badge";
import { Calendar, Store, User } from "lucide-react";
import type { RecentMaintenance } from "@/features/dashboard/types/dashboard";
import {
  MAINTENANCE_TYPE_LABELS,
  MAINTENANCE_TYPE_BADGE_CLASS,
} from "@/shared/constants/maintenance-type";
import { formatWorkPeriod } from "@/shared/utils/format";
import { ROUTES } from "@/shared/constants/routes";
import { USER_ROLE, type UserRole } from "@/shared/constants/role";

/**
 * Props型定義
 */
interface RecentMaintenanceCardProps {
  /** 整備履歴リストデータ */
  maintenances: RecentMaintenance[];
  /** ログインユーザーのロール */
  role: UserRole;
}

/**
 * サブ情報（名前とアイコン）を取得するヘルパー関数
 *
 * @param role ユーザーロール
 * @param item 整備履歴データ
 * @returns 表示用名とアイコンコンポーネント
 */
function getRoleSubInfo(role: UserRole, item: RecentMaintenance) {
  switch (role) {
    case USER_ROLE.OWNER:
      return { subName: item.shopName, SubIcon: Store };
    case USER_ROLE.SHOP:
      return { subName: item.ownerName, SubIcon: User };
    default:
      // サポートされていないロール（ADMINなど）が指定された場合はエラーをスロー
      throw new Error(`Unsupported role in RecentMaintenanceCard: ${role}`);
  }
}

/**
 * 直近の整備履歴カードコンポーネント
 *
 * @component
 */
export function RecentMaintenanceCard({
  maintenances,
  role,
}: RecentMaintenanceCardProps) {
  return (
    <Card className="bg-card border-border h-full flex flex-col">
      {/* カードヘッダーエリア（タイトル・一覧画面への遷移ボタン） */}
      <CardHeader className="flex flex-row items-start justify-between pb-2 flex-shrink-0">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground">
            最近の整備履歴
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            直近の整備・カスタム記録
          </CardDescription>
        </div>
        {/* 整備履歴一覧画面へのリンクボタン */}
        <Link href={ROUTES.MAINTENANCES}>
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground border-border hover:text-foreground"
          >
            すべて見る &rarr;
          </Button>
        </Link>
      </CardHeader>

      {/* カードメインコンテンツエリア */}
      <CardContent className="flex-1">
        {/* データが存在しない場合の空状態表示 */}
        {maintenances.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            整備履歴がありません
          </div>
        ) : (
          /* 整備履歴リスト表示 */
          <div className="space-y-2.5">
            {maintenances.map((item) => {
              // 整備種別（車検・修理など）に応じたバッジのスタイリングを取得
              const badgeClass =
                MAINTENANCE_TYPE_BADGE_CLASS[item.maintenanceType] ??
                MAINTENANCE_TYPE_BADGE_CLASS.OTHER;

              // ロールに応じた表示名とアイコンの取得
              const { subName, SubIcon } = getRoleSubInfo(role, item);

              return (
                <Link
                  key={item.maintenanceId}
                  href={`${ROUTES.MAINTENANCES}/${item.maintenanceId}`}
                >
                  {/* 整備履歴アイテムカード */}
                  <div className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
                    {/* 上段：整備種別バッジ & 合計費用 */}
                    <div className="flex items-start justify-between mb-1.5">
                      <Badge className={badgeClass}>
                        {MAINTENANCE_TYPE_LABELS[item.maintenanceType]}
                      </Badge>
                      <p className="font-semibold text-foreground text-sm">
                        ¥{item.totalCost.toLocaleString()}
                      </p>
                    </div>

                    {/* 中段：整備タイトル & 対象車両名 */}
                    <p className="font-medium text-foreground text-sm mb-1.5">
                      {item.title}{" "}
                      <span className="text-muted-foreground">
                        {item.vehicleName}
                      </span>
                    </p>

                    {/* 下段：作業期間 & ショップ名/オーナー名 */}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      {/* 作業期間 */}
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatWorkPeriod(item.workDateFrom, item.workDateTo)}
                      </span>
                      {/* 関連情報（ショップ名またはオーナー名） */}
                      {subName && (
                        <span className="flex items-center gap-1">
                          <SubIcon className="h-3 w-3" />
                          {subName}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
