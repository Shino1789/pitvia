import { Skeleton } from "@/shared/ui/skeleton";

/**
 * 整備履歴登録・詳細画面用ローディングスケルトン
 *
 * @returns 整備履歴フォームスケルトンのJSX要素
 */
export function MaintenanceRecordFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* 基本情報 */}
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-4 w-20" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>

      {/* 作業項目 */}
      <div className="space-y-4 rounded-lg border border-border bg-card p-4">
        <Skeleton className="h-4 w-24" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-1.5">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          ))}
        </div>
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    </div>
  );
}
