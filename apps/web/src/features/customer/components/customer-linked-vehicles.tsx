import { CarIcon } from "lucide-react";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/shared/ui/tooltip";
import { Badge } from "@/shared/ui/badge";
import type { CustomerVehicleSummary } from "../types/customer";

/**
 * Props型定義
 */
interface CustomerLinkedVehiclesProps {
  /** 表示対象の連携車両一覧（APIレスポンス上は最大3件） */
  vehicles: CustomerVehicleSummary[];
  /** 連携車両の総数（表示件数より多い場合、残数を「+N」で表示する） */
  totalCount: number;
}

/**
 * 顧客カードの連携車両アイコン群（最大3件 + 残数バッジ）を表示するコンポーネント
 *
 * 各車両アイコンにカーソルを合わせると、Tooltipで車両名を表示する。
 *
 * @component
 */
export function CustomerLinkedVehicles({
  vehicles,
  totalCount,
}: CustomerLinkedVehiclesProps) {
  if (vehicles.length === 0) {
    return (
      <span className="text-xs text-muted-foreground">連携車両なし</span>
    );
  }

  // 表示しきれない残数（APIは既に最大3件で返すが、表示側でも安全のため上限を設ける）
  const displayed = vehicles.slice(0, 3);
  const remaining = totalCount - displayed.length;

  return (
    <div className="flex items-center gap-1.5">
      {displayed.map((vehicle) => (
        <Tooltip key={vehicle.vehicleId}>
          <TooltipTrigger asChild>
            <Avatar className="h-9 w-9 shrink-0 rounded-md border border-border">
              <AvatarImage
                src={vehicle.imageUrl ?? undefined}
                alt={vehicle.vehicleName}
                className="object-cover"
              />
              <AvatarFallback className="rounded-md bg-primary/10 text-primary">
                <CarIcon className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </TooltipTrigger>
          <TooltipContent>{vehicle.vehicleName}</TooltipContent>
        </Tooltip>
      ))}

      {remaining > 0 && (
        <Badge
          variant="outline"
          className="h-9 shrink-0 rounded-md px-1.5 text-xs text-muted-foreground"
        >
          +{remaining}
        </Badge>
      )}
    </div>
  );
}
