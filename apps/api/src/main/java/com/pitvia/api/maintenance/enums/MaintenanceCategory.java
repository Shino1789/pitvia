package com.pitvia.api.maintenance.enums;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 整備カテゴリを表す列挙型
 *
 * @author pitvia
 * @version 1.0
 */
@Getter
@RequiredArgsConstructor
public enum MaintenanceCategory {

    /** エンジン */
    ENGINE("エンジン"),

    /** 吸排気 */
    INTAKE_EXHAUST("吸排気"),

    /** 冷却 */
    COOLING("冷却"),

    /** 駆動系 */
    DRIVETRAIN("駆動系"),

    /** 足回り */
    SUSPENSION("足回り"),

    /** ブレーキ */
    BRAKE("ブレーキ"),

    /** 電装 */
    ELECTRICAL("電装"),

    /** 外装 */
    BODY("外装"),

    /** 内装 */
    INTERIOR("内装"),

    /** エアコン */
    AIR_CONDITIONER("エアコン"),

    /** 板金 */
    BODY_REPAIR("板金"),

    /** 洗浄 */
    CLEANING("洗浄"),

    /** その他 */
    OTHER("その他");

    /**
     * 画面表示用ラベル。
     */
    private final String label;

    /**
     * code（Enum名）をキーにした検索用Map
     */
    private static final Map<String, MaintenanceCategory> MAP = Arrays.stream(values())
            .collect(Collectors.toUnmodifiableMap(
                    MaintenanceCategory::name,
                    Function.identity()));

    /**
     * ラベルコードから整備カテゴリを取得
     *
     * @param code 整備カテゴリコード
     * @return 対応する整備カテゴリ
     * @throws IllegalArgumentException 未定義のコードが指定された場合
     */
    public static MaintenanceCategory fromCode(String code) {

        MaintenanceCategory category = MAP.get(code);

        if (category == null) {
            throw new IllegalArgumentException(
                    "Unknown maintenance category code: " + code);
        }

        return category;
    }

    /**
     * DB連携用コードを返す
     *
     * @return 整備カテゴリコード
     */
    public String getCode() {
        return name();
    }

}
