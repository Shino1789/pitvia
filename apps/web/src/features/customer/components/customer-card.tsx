import Link from "next/link";
import { CalendarIcon, ChevronRightIcon, UserIcon } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { CustomerLinkedVehicles } from "./customer-linked-vehicles";
import { vehicleListRoute } from "@/shared/constants/routes";
import type { CustomerSummary } from "../types/customer";

/**
 * Props型定義
 */
interface CustomerCardProps {
  /** 表示対象の顧客情報 */
  customer: CustomerSummary;
}

/**
 * 顧客一覧の1件分のカードコンポーネント
 *
 * 押下すると、対象顧客の共有車両一覧画面（{@link vehicleListRoute}）へ遷移する。
 *
 * @component
 */
export function CustomerCard({ customer }: CustomerCardProps) {
  return (
    <Link href={vehicleListRoute(customer.ownerId)}>
      <Card className="bg-card border-border transition-colors hover:bg-accent/40">
        <CardContent className="flex items-center gap-4">
          {/* 顧客アイコン */}
          <Avatar className="h-12 w-12 shrink-0">
            <AvatarImage
              src={customer.ownerIconUrl ?? undefined}
              alt={customer.ownerName}
            />
            <AvatarFallback className="bg-primary/10 text-primary">
              <UserIcon className="h-5 w-5" />
            </AvatarFallback>
          </Avatar>

          {/* 顧客名 & 最終整備日（長い顧客名でも「様」やレイアウトが崩れないようtruncateする） */}
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline gap-1">
              <h3 className="truncate text-base font-semibold text-foreground">
                {customer.ownerName}
              </h3>
              <span className="shrink-0 text-sm text-muted-foreground">
                様
              </span>
            </div>
            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="shrink-0">最終整備日</span>
              <span className="truncate">
                {customer.lastMaintenanceDate
                  ? customer.lastMaintenanceDate.replaceAll("-", "/")
                  : "未整備"}
              </span>
            </div>
          </div>

          {/* 連携車両 & 遷移アイコン */}
          <div className="flex shrink-0 items-center gap-3">
            <CustomerLinkedVehicles
              vehicles={customer.linkedVehicles}
              totalCount={customer.linkedVehicleCount}
            />
            <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
