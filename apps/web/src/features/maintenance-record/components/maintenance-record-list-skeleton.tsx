import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

/**
 * 整備履歴一覧画面用ローディングスケルトン
 *
 * @returns 整備履歴一覧スケルトンのJSX要素
 */
export function MaintenanceRecordListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} className="bg-card border-border">
          <CardContent className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <Skeleton className="h-5 w-24 rounded-full" />
              <Skeleton className="h-5 w-16" />
            </div>
            <Skeleton className="h-5 w-1/2" />
            <Skeleton className="h-4 w-1/3" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
