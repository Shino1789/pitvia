"use client";

import { AlertTriangleIcon, ArrowRightIcon, InfoIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { useVehicleList } from "@/features/vehicle/hooks/use-vehicle-list";
import { useLinkShop } from "../hooks/use-link-shop";
import {
  shopLinkSchema,
  EMPTY_SHOP_LINK_FORM_VALUES,
  type ShopLinkFormValues,
} from "../schemas/shop-link.schema";

/**
 * Props型定義
 */
interface ShopLinkModalProps {
  /** モーダルの表示状態 */
  open: boolean;
  /** 表示状態が変化した際のコールバック（背景クリック・Escでの操作を含む） */
  onOpenChange: (open: boolean) => void;
}

/**
 * ショップ連携モーダル内のフォーム本体のProps型定義
 */
interface ShopLinkFormProps {
  /** 連携処理中かどうか */
  isSubmitting: boolean;
  /** 連携API失敗時のエラーメッセージ（フォーム上部にインライン表示する） */
  apiError: string | null;
  /** フォーム送信時のコールバック */
  onSubmit: (data: ShopLinkFormValues) => void;
}

/**
 * ショップ連携モーダル内のフォーム本体
 *
 * モーダルが開いている間のみマウントされるため、車両一覧の取得はモーダルを開いた時点で
 * 初めて行われ、閉じると入力内容も破棄される。
 *
 * @component
 */
function ShopLinkForm({ isSubmitting, apiError, onSubmit }: ShopLinkFormProps) {
  // 対象車両の選択肢となる、ログインOWNER自身の車両一覧
  const {
    data: vehicleList,
    isPending: isVehiclePending,
    isError: isVehicleError,
    refetch: refetchVehicles,
  } = useVehicleList();

  const form = useForm<ShopLinkFormValues>({
    resolver: zodResolver(shopLinkSchema),
    defaultValues: EMPTY_SHOP_LINK_FORM_VALUES,
  });

  const vehicles = vehicleList?.vehicles ?? [];
  // 連携対象の車両が1台も無い場合、または車両一覧を取得できていない場合は連携操作をさせない
  const canSubmit = !isVehiclePending && !isVehicleError && vehicles.length > 0;

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-4"
        noValidate
      >
        {/* API失敗時のエラーメッセージ（vehicle-form.tsx等と同一パターン） */}
        {apiError && (
          <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-center text-xs text-destructive">
            {apiError}
          </div>
        )}

        {/* 対象車両 */}
        <FormField
          control={form.control}
          name="vehicleId"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm" required>
                対象車両を選択
              </FormLabel>

              {/* 車両一覧取得中 */}
              {isVehiclePending && <Skeleton className="h-9 w-full" />}

              {/* 車両一覧取得エラー */}
              {!isVehiclePending && isVehicleError && (
                <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-4 text-center">
                  <AlertTriangleIcon className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-muted-foreground">
                    車両一覧の取得に失敗しました。
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => refetchVehicles()}
                  >
                    再試行
                  </Button>
                </div>
              )}

              {/* 連携できる車両が無い場合 */}
              {!isVehiclePending && !isVehicleError && vehicles.length === 0 && (
                <div className="rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                  連携できる車両がありません。先に車両を登録してください。
                </div>
              )}

              {canSubmit && (
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="選択してください" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {vehicles.map((vehicle) => (
                      <SelectItem key={vehicle.id} value={vehicle.id}>
                        {vehicle.modelCode
                          ? `${vehicle.modelName} ${vehicle.modelCode}`
                          : vehicle.modelName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 招待コード */}
        <FormField
          control={form.control}
          name="inviteCode"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm" required>
                招待コードを入力
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="例：ABCD1234"
                  autoComplete="off"
                  {...field}
                />
              </FormControl>
              <FormDescription className="text-xs">
                ショップから受け取った招待コードを入力してください
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* 注意表示 */}
        <div className="flex gap-2 rounded-lg border border-primary/30 bg-primary/10 p-3 text-xs text-foreground">
          <InfoIcon className="h-4 w-4 shrink-0 text-primary" />
          <p>連携が完了すると、この車両の整備履歴をショップと共有できます。</p>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isSubmitting}>
              キャンセル
            </Button>
          </DialogClose>
          <Button
            type="submit"
            disabled={isSubmitting || !canSubmit}
            className="gap-1.5"
          >
            {isSubmitting ? "連携中..." : "連携する"}
            {!isSubmitting && <ArrowRightIcon className="h-4 w-4" />}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/**
 * 招待コード入力によるショップ連携モーダルコンポーネント（OWNER専用）
 *
 * 対象車両を選択し、ショップから受け取った招待コードを入力して連携を開始する。
 * 成功時はモーダルを閉じ、成功トーストの表示とショップ一覧の再取得を行う。
 * 失敗時はモーダルを開いたままフォーム上部にエラーを表示し、入力内容を修正して再試行できる。
 *
 * @component
 */
export function ShopLinkModal({ open, onOpenChange }: ShopLinkModalProps) {
  const { linkShop, isLoading, error, reset } = useLinkShop();

  /**
   * モーダルの開閉ハンドラー
   *
   * 連携処理中は、背景クリック・Esc・×ボタンによる意図しない閉じ操作を無効にする。
   * 閉じる際は前回のAPIエラー表示をリセットする。
   *
   * @param next 変更後の表示状態
   */
  const handleOpenChange = (next: boolean) => {
    if (isLoading) {
      return;
    }
    if (!next) {
      reset();
    }
    onOpenChange(next);
  };

  /**
   * フォーム送信ハンドラー（バリデーション通過後に呼ばれる）
   *
   * @param data バリデーション済みの入力値
   */
  const handleSubmit = async (data: ShopLinkFormValues) => {
    const succeeded = await linkShop(data);

    if (succeeded) {
      reset();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>ショップ連携</DialogTitle>
          <DialogDescription>
            ショップから発行された招待コードを入力して、連携を開始します。
          </DialogDescription>
        </DialogHeader>

        <ShopLinkForm
          isSubmitting={isLoading}
          apiError={error}
          onSubmit={handleSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}
