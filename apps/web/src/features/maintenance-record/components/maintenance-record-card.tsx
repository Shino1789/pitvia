import Link from "next/link";
import { CalendarIcon, GaugeIcon, StoreIcon } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import {
  MAINTENANCE_TYPE_LABELS,
  MAINTENANCE_TYPE_BADGE_CLASS,
} from "@/shared/constants/maintenance-type";
import { formatWorkPeriod } from "@/shared/utils/format";
import { maintenanceRecordDetailRoute } from "@/shared/constants/routes";
import type { MaintenanceRecordSummary } from "../types/maintenance-record";

/**
 * Props型定義
 */
interface MaintenanceRecordCardProps {
  /** 表示対象の整備履歴情報 */
  record: MaintenanceRecordSummary;
  /** 対象車両一覧の取得元オーナーID（詳細画面のヘッダーに対象オーナー名を表示するために使う） */
  ownerId?: string;
  /** 詳細画面のキャンセル時に戻る一覧画面のパス（一覧画面の現在のURL） */
  returnTo?: string;
}

/**
 * 整備履歴一覧の1件分のカードコンポーネント
 *
 * @component
 */
export function MaintenanceRecordCard({
  record,
  ownerId,
  returnTo,
}: MaintenanceRecordCardProps) {
  const badgeClass = MAINTENANCE_TYPE_BADGE_CLASS[record.maintenanceType];

  // 車両名の表記は車両一覧画面と統一し、車種名→型式の順で表示する（例: "GT-R R32"）
  const vehicleName = record.vehicleModelCode
    ? `${record.vehicleModelName} ${record.vehicleModelCode}`
    : record.vehicleModelName;

  return (
    <Link href={maintenanceRecordDetailRoute(record.id, { ownerId, returnTo })}>
      <Card className="bg-card border-border transition-colors hover:bg-accent/40">
        <CardContent className="flex items-center justify-between gap-4">
          <div className="min-w-0 flex-1 space-y-2">
            {/* 上段：整備種別バッジ & 走行距離 */}
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={badgeClass}>
                {MAINTENANCE_TYPE_LABELS[record.maintenanceType]}
              </Badge>
              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                <GaugeIcon className="h-3.5 w-3.5" />
                {record.mileage.toLocaleString()} km
              </span>
            </div>

            {/* 中段：対象車両名 & 整備タイトル */}
            <div className="flex flex-wrap items-baseline gap-x-2">
              <span className="text-xs text-muted-foreground">{vehicleName}</span>
              <h3 className="text-base font-semibold text-foreground">
                {record.title}
              </h3>
            </div>

            {/* 下段：作業期間 & ショップ名（DIYの場合は非表示） */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <CalendarIcon className="h-3 w-3" />
                {formatWorkPeriod(record.workDateFrom, record.workDateTo)}
              </span>
              {record.shopName && (
                <span className="flex items-center gap-1">
                  <StoreIcon className="h-3 w-3" />
                  {record.shopName}
                </span>
              )}
            </div>
          </div>

          {/* 右端：合計費用（カード全体の縦中央に配置） */}
          <p className="shrink-0 text-lg font-semibold text-foreground">
            ¥{record.totalCost.toLocaleString()}
          </p>
        </CardContent>
      </Card>
    </Link>
  );
}
