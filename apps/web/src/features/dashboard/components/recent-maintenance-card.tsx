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

interface RecentMaintenanceCardProps {
  /** 整備履歴リスト */
  maintenances: RecentMaintenance[];
  /** owner: 担当ショップ名を表示 / shop: 顧客名（車両保有者）を表示 */
  variant: "owner" | "shop";
}

/**
 * 直近の整備履歴カードコンポーネント
 *
 * @component
 */
export function RecentMaintenanceCard({
  maintenances,
  variant,
}: RecentMaintenanceCardProps) {
  return (
    <Card className="bg-card border-border h-full flex flex-col">
      <CardHeader className="flex flex-row items-start justify-between pb-2 flex-shrink-0">
        <div>
          <CardTitle className="text-lg font-semibold text-foreground">
            最近の整備履歴
          </CardTitle>
          <CardDescription className="text-muted-foreground">
            直近の整備・カスタム記録
          </CardDescription>
        </div>
        <Link href="/maintenance">
          <Button
            variant="outline"
            size="sm"
            className="text-muted-foreground border-border hover:text-foreground"
          >
            すべて見る &rarr;
          </Button>
        </Link>
      </CardHeader>
      <CardContent className="flex-1">
        {maintenances.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            整備履歴がありません
          </div>
        ) : (
          <div className="space-y-2.5">
            {maintenances.map((item) => {
              const badgeClass =
                MAINTENANCE_TYPE_BADGE_CLASS[item.maintenanceType] ??
                MAINTENANCE_TYPE_BADGE_CLASS.OTHER;
              const subName =
                variant === "owner" ? item.shopName : item.ownerName;
              const SubIcon = variant === "owner" ? Store : User;

              return (
                <Link
                  key={item.maintenanceId}
                  href={`/maintenance/${item.maintenanceId}`}
                >
                  <div className="p-3 rounded-lg bg-secondary/50 hover:bg-secondary transition-colors cursor-pointer">
                    <div className="flex items-start justify-between mb-1.5">
                      <Badge className={badgeClass}>
                        {MAINTENANCE_TYPE_LABELS[item.maintenanceType]}
                      </Badge>
                      <p className="font-semibold text-foreground text-sm">
                        ¥{item.totalCost.toLocaleString()}
                      </p>
                    </div>
                    <p className="font-medium text-foreground text-sm mb-1.5">
                      {item.title}{" "}
                      <span className="text-muted-foreground">
                        {item.vehicleName}
                      </span>
                    </p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatWorkPeriod(item.workDateFrom, item.workDateTo)}
                      </span>
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
