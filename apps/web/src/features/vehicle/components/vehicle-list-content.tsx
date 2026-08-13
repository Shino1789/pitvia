"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { PlusIcon, SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { ErrorState } from "@/shared/components/state/error-state";
import { VehicleListSkeleton } from "./vehicle-list-skeleton";
import { VehicleCard } from "./vehicle-card";
import { useVehicleList } from "../hooks/use-vehicle-list";
import { useHeader } from "@/shared/hooks/use-header";
import { ROUTES } from "@/shared/constants/routes";

/**
 * 車両一覧画面表示用メインコンテンツコンポーネント
 *
 * @component
 * @returns 車両一覧コンテンツのJSX要素
 */
export function VehicleListContent() {
  // URLの ownerId クエリパラメータから、対象オーナーIDを取得する
  // （SHOPが顧客管理画面から特定顧客の車両一覧へ遷移してきた場合のみ付与される想定）
  const searchParams = useSearchParams();
  const ownerId = searchParams.get("ownerId") ?? undefined;

  const { data, isPending, isError, refetch } = useVehicleList(ownerId);

  // 検索バーの開閉状態と入力中のキーワードを管理するstate
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [keyword, setKeyword] = useState("");

  // ownerId指定時は対象オーナーの表示名を、未指定時は固定タイトルを表示する
  const title = data?.owner ? `${data.owner.userName} 様の車両一覧` : "車両一覧";

  // データ取得完了かつ自分自身の一覧を見ている場合のみ、ヘッダーへ検索・追加アクションを表示する
  const showActions = !isPending && !isError && !!data;

  // useHeaderの依存配列は参照の同一性で比較されるため、actionsをuseMemoで安定化させないと
  // 「actions生成→setHeader→再レンダリング→actions再生成」が無限ループしてしまう
  //
  // 検索欄のInputはuseHeader経由でAppHeader側（別ツリー）に描画されるため、keywordをこの
  // useMemoの依存配列に含めて1文字入力ごとにactionsを再生成すると、その都度
  // useHeaderのuseEffect→setHeader→Context経由の再レンダリングという非同期の往復が発生する。
  // この往復の遅延により、IME変換中の文字列とReactが把握するvalueとの間にズレが生じ、
  // 変換セッションが中断されて「いnn」のような文字化けが起きるため、Inputは非制御にして
  // keywordの変化ではactionsを再生成しないようにしている。
  const actions = useMemo(() => {
    if (!showActions) {
      return undefined;
    }

    return (
      <div className="flex items-center gap-2">
        {isSearchOpen ? (
          <div className="flex items-center gap-1">
            <Input
              autoFocus
              placeholder="車両名で検索"
              onChange={(e) => setKeyword(e.target.value)}
              className="h-8 w-36 sm:w-56"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              aria-label="検索を閉じる"
              onClick={() => {
                setIsSearchOpen(false);
                setKeyword("");
              }}
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="車両名で検索"
            onClick={() => setIsSearchOpen(true)}
          >
            <SearchIcon className="h-4 w-4" />
          </Button>
        )}

        {/* 自分自身の一覧を見ている場合のみ、車両登録への導線を表示する */}
        {!ownerId && (
          <Link href={ROUTES.VEHICLE_NEW}>
            <Button type="button" size="sm" className="gap-1.5">
              <PlusIcon className="h-4 w-4" />
              車両を追加
            </Button>
          </Link>
        )}
      </div>
    );
  }, [showActions, isSearchOpen, ownerId]);

  useHeader({ title, actions });

  // データ取得中はスケルトンUIを表示
  if (isPending) {
    return <VehicleListSkeleton />;
  }

  // データの取得に失敗した場合
  if (isError || !data) {
    return <ErrorState onRetry={refetch} />;
  }

  // 車両名によるクライアント側の絞り込み（Backend検索は導入せず、取得済み一覧から絞り込む）
  const normalizedKeyword = keyword.trim().toLowerCase();
  const filteredVehicles = normalizedKeyword
    ? data.vehicles.filter((vehicle) =>
        vehicle.modelName.toLowerCase().includes(normalizedKeyword),
      )
    : data.vehicles;

  return (
    <div className="space-y-4">
      {filteredVehicles.length === 0 ? (
        <div className="flex min-h-[200px] items-center justify-center text-sm text-muted-foreground">
          {normalizedKeyword
            ? "該当する車両が見つかりません"
            : "登録されている車両がありません"}
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard key={vehicle.id} vehicle={vehicle} ownerId={ownerId} />
          ))}
        </div>
      )}
    </div>
  );
}
