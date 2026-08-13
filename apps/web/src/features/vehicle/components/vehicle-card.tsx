import Link from "next/link";
import {
  ArrowRightIcon,
  CarIcon,
  GaugeIcon,
  IdCardIcon,
  WrenchIcon,
} from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { ROUTES, vehicleDetailRoute } from "@/shared/constants/routes";
import type { VehicleDetail } from "../types/vehicle";

/**
 * Props型定義
 */
interface VehicleCardProps {
  /** 表示対象の車両情報 */
  vehicle: VehicleDetail;
  /**
   * 遷移元の対象オーナーID
   *
   * SHOPが特定顧客の車両一覧から遷移した場合のみ指定する。詳細画面の「一覧へ戻る」で
   * 同じ絞り込み一覧へ戻れるよう、詳細画面のURLへそのまま引き継ぐために使用する。
   */
  ownerId?: string;
}

/**
 * 車両一覧の1台分のカードコンポーネント
 *
 * @component
 */
export function VehicleCard({ vehicle, ownerId }: VehicleCardProps) {
  return (
    <Card className="bg-card border-border">
      <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex min-w-0 flex-1 items-center gap-4">
          {/* 車両アイコン（未登録の場合はデフォルトアイコンを表示） */}
          <Avatar className="h-20 w-20 shrink-0 rounded-lg">
            <AvatarImage
              src={vehicle.imageUrl ?? undefined}
              alt={vehicle.modelName}
              className="object-cover"
            />
            <AvatarFallback className="rounded-lg border border-primary/30 bg-primary/10">
              <CarIcon className="h-8 w-8 text-primary" />
            </AvatarFallback>
          </Avatar>

          {/* 車両基本情報 */}
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-2">
              <h3 className="truncate text-lg font-semibold text-foreground">
                {vehicle.modelName}
              </h3>
              {vehicle.modelCode && (
                <p className="text-xs text-muted-foreground">
                  {vehicle.modelCode}
                </p>
              )}
            </div>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              <Badge variant="outline">{vehicle.manufacturerName}</Badge>
              <Badge variant="outline">{vehicle.modelYear}</Badge>
            </div>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <GaugeIcon className="h-3.5 w-3.5" />
                {vehicle.currentMileage.toLocaleString()} km
              </span>
              {vehicle.licensePlate && (
                <span className="flex items-center gap-1">
                  <IdCardIcon className="h-3.5 w-3.5" />
                  {vehicle.licensePlate}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex shrink-0 flex-col gap-2 sm:w-44">
          <Link href={vehicleDetailRoute(vehicle.id, ownerId)}>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 border-primary/40 text-primary hover:bg-primary/10 hover:text-primary"
            >
              車両詳細を見る
              <ArrowRightIcon className="h-3.5 w-3.5" />
            </Button>
          </Link>
          {/* 整備履歴機能は別Issueのスコープのため、一覧画面自体は未実装だがルートは予約済み
              （RecentMaintenanceCard等と同様、リンク自体は先に用意しておく） */}
          <Link href={`${ROUTES.MAINTENANCES}?vehicleId=${vehicle.id}`}>
            <Button
              variant="outline"
              size="sm"
              className="w-full gap-1.5 border-pink-500/40 text-pink-400 hover:bg-pink-500/10 hover:text-pink-400"
            >
              整備履歴を見る
              <WrenchIcon className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
