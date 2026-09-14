"use client";

import {
  AlertTriangleIcon,
  ClockIcon,
  CopyIcon,
  RefreshCwIcon,
  TicketIcon,
} from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Button } from "@/shared/ui/button";
import { Skeleton } from "@/shared/ui/skeleton";
import { useInviteCode } from "../hooks/use-invite-code";
import { useIssueInviteCode } from "../hooks/use-issue-invite-code";
import { formatDateTime, formatRemainingTime } from "@/shared/utils/format";
import { appToast } from "@/lib/toast";
import { TOAST_MESSAGES } from "@/shared/messages/toast";

/**
 * Props型定義
 */
interface InviteCodeModalProps {
  /** モーダルの表示状態 */
  open: boolean;
  /** 表示状態が変化した際のコールバック（背景クリック・Escでの操作を含む） */
  onOpenChange: (open: boolean) => void;
}

/**
 * ショップ招待コードの発行・再表示を行うモーダルコンポーネント
 *
 * 開いた際に現在有効な招待コード（GET）を取得して再表示する。新規発行・再発行は
 * 「発行する」/「再発行」ボタン押下時（POST）のみ行い、モーダルを開くたびに
 * 自動でPOSTすることはしない。
 *
 * @component
 */
export function InviteCodeModal({ open, onOpenChange }: InviteCodeModalProps) {
  // モーダルが開いている間のみ現在の招待コードを取得する
  const {
    data: inviteCode,
    isPending,
    isError,
    refetch,
  } = useInviteCode(open);

  const { issueInviteCode, isLoading: isIssuing } = useIssueInviteCode();

  const handleCopy = async (code: string) => {
    await navigator.clipboard.writeText(code);
    appToast.success(TOAST_MESSAGES.SUCCESS.SHOP.INVITE_CODE_COPY);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>招待コードを発行</DialogTitle>
          <DialogDescription>
            このコードをオーナーに共有してください。オーナーが入力するとショップ連携されます。
          </DialogDescription>
        </DialogHeader>

        {/* データ取得中 */}
        {isPending && (
          <div className="space-y-2">
            <Skeleton className="h-20 w-full rounded-lg" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        )}

        {/* データ取得エラー */}
        {!isPending && isError && (
          <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border p-6 text-center">
            <AlertTriangleIcon className="h-6 w-6 text-destructive" />
            <p className="text-sm text-muted-foreground">
              招待コードの取得に失敗しました。
            </p>
            <Button variant="outline" size="sm" onClick={() => refetch()}>
              再試行
            </Button>
          </div>
        )}

        {/* 現在有効な招待コードが存在する場合 */}
        {!isPending && !isError && inviteCode && (
          <div className="space-y-4">
            <div className="rounded-lg border border-border bg-muted/40 p-4">
              <p className="text-xs text-muted-foreground">招待コード</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="text-2xl font-bold tracking-wider text-primary">
                  {inviteCode.code}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="gap-1.5"
                  onClick={() => handleCopy(inviteCode.code)}
                >
                  <CopyIcon className="h-3.5 w-3.5" />
                  コピー
                </Button>
              </div>
              <div className="mt-3 flex items-center gap-1.5 text-xs text-muted-foreground">
                <ClockIcon className="h-3.5 w-3.5" />
                <span>
                  有効期限 {formatDateTime(inviteCode.expiresAt)} まで（
                  {formatRemainingTime(inviteCode.expiresAt)}）
                </span>
              </div>
            </div>

            <div className="flex gap-2 rounded-lg border border-border bg-muted/40 p-3 text-xs text-muted-foreground">
              <TicketIcon className="h-4 w-4 shrink-0" />
              <p>
                現在有効な招待コードはこの1つのみです。
                <br />
                新しいコードを発行すると、現在のコードは無効になります。
              </p>
            </div>
          </div>
        )}

        {/* 現在有効な招待コードが存在しない場合 */}
        {!isPending && !isError && !inviteCode && (
          <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
            <TicketIcon className="h-6 w-6 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              現在有効な招待コードはありません。
            </p>
          </div>
        )}

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              閉じる
            </Button>
          </DialogClose>
          <Button
            type="button"
            onClick={() => issueInviteCode()}
            disabled={isPending || isIssuing}
            className="gap-1.5"
          >
            <RefreshCwIcon className="h-3.5 w-3.5" />
            {inviteCode ? "再発行" : "発行する"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
