import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

/**
 * 車両登録・詳細画面用ローディングスケルトン
 *
 * @returns 車両フォームスケルトンのJSX要素
 */
export function VehicleFormSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-[14rem_1fr]">
          {/* 画像アップロード枠 */}
          <Skeleton className="aspect-square w-full max-w-56 rounded-lg" />

          {/* 右側：基本情報の入力欄 */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="space-y-1.5">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* 車両スペックセクション */}
        <div className="space-y-4 border-t border-border pt-4">
          <Skeleton className="h-4 w-24" />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="space-y-1.5">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))}
          </div>
        </div>

        {/* メモ欄 */}
        <div className="space-y-1.5">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-24 w-full rounded-md" />
        </div>

        {/* 送信ボタン */}
        <div className="flex justify-end gap-2">
          <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
