import { CarIcon, MapPinIcon, PhoneIcon, StoreIcon } from "lucide-react";
import { Card, CardContent } from "@/shared/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/shared/ui/avatar";
import type { ShopSummary } from "../types/shop";

/**
 * Props型定義
 */
interface ShopCardProps {
  /** 表示対象のショップ情報 */
  shop: ShopSummary;
}

/**
 * ショップ一覧の1件分のカードコンポーネント
 *
 * TODO: ショップ詳細画面（ベータ版対象外）の実装後、カード全体をLinkでラップして
 * 詳細画面へ遷移できるようにする（顧客一覧のCustomerCardと同様の構成）。
 * 遷移先が未実装のため、現状は遷移せず表示のみとしている。
 *
 * @component
 */
export function ShopCard({ shop }: ShopCardProps) {
  // 表示しきれない残りの連携車両数（APIは最大3件で返すため、総数との差分を「他N台」で表示する）
  const remaining = shop.linkedVehicleCount - shop.linkedVehicles.length;
  const vehicleNames = shop.linkedVehicles
    .map((vehicle) => vehicle.vehicleName)
    .join(" / ");

  return (
    <Card className="bg-card border-border">
      <CardContent className="flex items-center gap-4">
        {/* ショップ画像（未設定の場合はデフォルトアイコンを表示） */}
        <Avatar className="h-16 w-16 shrink-0">
          <AvatarImage
            src={shop.shopIconUrl ?? undefined}
            alt={shop.shopName}
            className="object-cover"
          />
          <AvatarFallback className="bg-primary/10 text-primary">
            <StoreIcon className="h-6 w-6" />
          </AvatarFallback>
        </Avatar>

        {/* ショップ情報（長い名称・住所でもレイアウトが崩れないようtruncateする） */}
        <div className="min-w-0 flex-1 space-y-1">
          <h3 className="truncate text-base font-semibold text-foreground">
            {shop.shopName}
          </h3>

          {shop.address && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPinIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{shop.address}</span>
            </p>
          )}

          {shop.phoneNumber && (
            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
              <PhoneIcon className="h-3.5 w-3.5 shrink-0" />
              <span className="truncate">{shop.phoneNumber}</span>
            </p>
          )}

          <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <CarIcon className="h-3.5 w-3.5 shrink-0" />
            <span className="shrink-0">連携車両：</span>
            <span className="truncate">{vehicleNames || "なし"}</span>
            {remaining > 0 && <span className="shrink-0">他{remaining}台</span>}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
