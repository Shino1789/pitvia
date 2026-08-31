import { toast } from "sonner";

/**
 * トースト通知の表示オプション
 */
const TOAST_OPTIONS = {
  // すべてのトースト表示時間を3秒（3000ms）に統一
  duration: 3000,
} as const;

/**
 * アプリケーション共通のトースト通知を提供するラッパーオブジェクト
 */
export const appToast = {
  /**
   * 成功時のトースト通知
   * @param message 表示するメッセージ
   */
  success(message: string) {
    toast.success(message, TOAST_OPTIONS);
  },

  /**
   * エラー発生時のトースト通知
   * @param message 表示するメッセージ
   */
  error(message: string) {
    toast.error(message, TOAST_OPTIONS);
  },

  /**
   * 警告時のトースト通知
   * @param message 表示するメッセージ
   */
  warning(message: string) {
    toast.warning(message, TOAST_OPTIONS);
  },

  /**
   * 情報通知時のトースト通知
   * @param message 表示するメッセージ
   */
  info(message: string) {
    toast.info(message, TOAST_OPTIONS);
  },
};
