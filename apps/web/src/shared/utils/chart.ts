/**
 * 最大値・初期上限・ステップ値をもとに、Y軸の上限値を算出
 *
 * 【動作仕様】
 * - maxValue が defaultMax 以下の場合は defaultMax を返す
 * - maxValue が defaultMax を超えた場合は、step 単位で切り上げてスケールを拡張
 *
 * 例 (defaultMax: 500,000 / step: 500,000):
 *  - 310,000   => 500,000
 *  - 490,000   => 500,000
 *  - 510,000   => 1,000,000
 *  - 1,200,000 => 1,500,000
 *
 * @param maxValue 描画対象データの最大値
 * @param defaultMax デフォルトのY軸上限値
 * @param step 超過時に追加拡張していく目盛り単位
 * @returns 切り上げ計算されたY軸の最大値
 */
export function calculateAxisMax(
  maxValue: number,
  defaultMax: number,
  step: number,
): number {
  if (maxValue <= defaultMax) {
    return defaultMax;
  }

  // defaultMax を超える場合は、step 単位で繰り上げる
  return Math.ceil(maxValue / step) * step;
}
