import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/shared/ui/button";
import { cn } from "@/lib/utils";

/**
 * Props型定義
 */
interface PaginationProps {
  /** 現在のページ番号（1始まり） */
  page: number;
  /** 総ページ数 */
  totalPages: number;
  /** 全件数 */
  totalElements: number;
  /** ページ変更時のコールバック */
  onPageChange: (page: number) => void;
  /** 外枠のカスタムクラス */
  className?: string;
}

/**
 * 表示するページ番号（先頭・末尾・現在ページ周辺）の配列を組み立てる
 *
 * 連続していない箇所は"ellipsis"（省略記号）として表す。
 *
 * @param page       現在のページ番号
 * @param totalPages 総ページ数
 * @returns ページ番号・省略記号の配列
 */
function buildPageItems(
  page: number,
  totalPages: number,
): (number | "ellipsis")[] {
  const candidates = [1, page - 1, page, page + 1, totalPages].filter(
    (p) => p >= 1 && p <= totalPages,
  );
  const uniqueSorted = Array.from(new Set(candidates)).sort((a, b) => a - b);

  const items: (number | "ellipsis")[] = [];
  let prev: number | null = null;

  for (const p of uniqueSorted) {
    if (prev !== null && p - prev > 1) {
      items.push("ellipsis");
    }
    items.push(p);
    prev = p;
  }

  return items;
}

/**
 * 一覧画面共通のページングUIコンポーネント
 *
 * @component
 */
export function Pagination({
  page,
  totalPages,
  totalElements,
  onPageChange,
  className,
}: PaginationProps) {
  // 1ページのみの場合はページ番号操作UIを出さず、全件数のみ表示する
  if (totalPages <= 1) {
    return (
      <div className={cn("flex items-center", className)}>
        <p className="ml-auto shrink-0 text-xs text-muted-foreground">
          全{totalElements.toLocaleString()}件
        </p>
      </div>
    );
  }

  const items = buildPageItems(page, totalPages);

  return (
    <div className={cn("flex items-center gap-4", className)}>
      <nav
        className="flex flex-1 items-center justify-center gap-1"
        aria-label="ページネーション"
      >
        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="前のページ"
        >
          <ChevronLeftIcon className="h-4 w-4" />
        </Button>

        {items.map((item, index) =>
          item === "ellipsis" ? (
            <span
              key={`ellipsis-${index}`}
              className="px-1.5 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <Button
              key={item}
              type="button"
              variant={item === page ? "default" : "outline"}
              size="icon-sm"
              aria-current={item === page ? "page" : undefined}
              onClick={() => onPageChange(item)}
            >
              {item}
            </Button>
          ),
        )}

        <Button
          type="button"
          variant="outline"
          size="icon-sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
          aria-label="次のページ"
        >
          <ChevronRightIcon className="h-4 w-4" />
        </Button>
      </nav>

      <p className="ml-auto shrink-0 text-xs text-muted-foreground">
        全{totalElements.toLocaleString()}件
      </p>
    </div>
  );
}
