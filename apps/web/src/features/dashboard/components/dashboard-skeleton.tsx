import { StatCardSkeleton } from "@/features/dashboard/components/stat-card-skeleton";
import { Card, CardContent, CardHeader } from "@/shared/ui/card";
import { Skeleton } from "@/shared/ui/skeleton";

/**
 * ダッシュボード画面全体用ローディングスケルトン
 *
 * @returns ダッシュボードスケルトンのJSX要素
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* 上段: 統計カードエリア */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>

      {/* 下段: メインコンテンツエリア */}
      <div className="grid gap-6 lg:grid-cols-7">
        {/* 左側：推移グラフ用スケルトン */}
        <div className="lg:col-span-4">
          <Card className="bg-card border-border h-full flex flex-col">
            {/* ヘッダー領域 */}
            <CardHeader className="pb-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1.5">
                {/* グラフタイトル */}
                <Skeleton className="h-5 w-32" />
                {/* 期間範囲ラベル */}
                <Skeleton className="h-4 w-44" />
              </div>
              {/* コントロール（前後ボタン ＋ 月次/年次トグル） */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-8 w-16 rounded-md" />
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            </CardHeader>

            {/* チャート描画領域 */}
            <CardContent className="pt-0 flex-1 flex items-end">
              <Skeleton className="h-[300px] w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>

        {/* 右側：最近の整備履歴用スケルトン */}
        <div className="lg:col-span-3">
          <Card className="bg-card border-border h-full flex flex-col">
            {/* ヘッダー領域（タイトル・すべて見るボタン） */}
            <CardHeader className="flex flex-row items-start justify-between pb-2 flex-shrink-0">
              <div className="space-y-1.5">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-40" />
              </div>
              <Skeleton className="h-8 w-20 rounded-md" />
            </CardHeader>

            {/* 履歴リスト領域 */}
            <CardContent className="flex-1 space-y-2.5">
              <Skeleton className="h-[76px] w-full rounded-lg" />
              <Skeleton className="h-[76px] w-full rounded-lg" />
              <Skeleton className="h-[76px] w-full rounded-lg" />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
