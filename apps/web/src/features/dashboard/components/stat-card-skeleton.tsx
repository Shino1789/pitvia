import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

/**
 * 統計カード用スケルトン
 *
 * @returns StatCard構造に合わせたスケルトンJSX
 */
export function StatCardSkeleton() {
  return (
    <Card className="bg-card border-border">
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          {/* 左側：タイトル、メイン数値、サブタイトル領域 */}
          <div className="space-y-2">
            {/* タイトル領域 */}
            <Skeleton className="h-4 w-20" />
            {/* メイン数値領域 */}
            <Skeleton className="h-9 w-28 mt-2" />
            {/* サブタイトル領域 */}
            <Skeleton className="h-4 w-36 mt-1" />
          </div>

          {/* 右側：アイコン領域 */}
          <Skeleton className="h-6 w-6 rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}
