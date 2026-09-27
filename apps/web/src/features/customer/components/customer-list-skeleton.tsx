import { Card, CardContent } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

/**
 * 顧客一覧画面用ローディングスケルトン
 *
 * @returns 顧客一覧スケルトンのJSX要素
 */
export function CustomerListSkeleton() {
  return (
    <div className="flex flex-col gap-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <Card key={index} className="bg-card border-border">
          <CardContent className="flex items-center gap-4">
            <Skeleton className="h-12 w-12 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <Skeleton className="h-5 w-1/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex shrink-0 gap-1.5">
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
              <Skeleton className="h-9 w-9 rounded-md" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
