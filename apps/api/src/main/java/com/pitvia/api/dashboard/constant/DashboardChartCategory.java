package com.pitvia.api.dashboard.constant;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * ダッシュボードのグラフで使用する集計カテゴリを定義する列挙型
 *
 * @author pitvia
 * @version 1.0
 */
@Getter
@RequiredArgsConstructor
public enum DashboardChartCategory {

    /** 定期メンテナンス */
    PERIODIC_MAINTENANCE("定期メンテナンス"),

    /** 車検 */
    VEHICLE_INSPECTION("車検"),

    /** 点検 */
    INSPECTION("点検"),

    /** 修理 */
    REPAIR("修理"),

    /** カスタム */
    CUSTOM("カスタム"),

    /** チューニング */
    TUNING("チューニング"),

    /** セッティング */
    SETTING("セッティング");

    /** カテゴリ名 */
    private final String label;
}
