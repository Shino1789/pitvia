import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind CSSのクラス名を安全に結合・上書きするユーティリティ関数
 *
 * @param {ClassValue[]} inputs - 結合したいクラス名、または条件付きクラス名オブジェクトのリスト
 * @returns {string} 重複や衝突が解消された、1つのクラス名文字列
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
