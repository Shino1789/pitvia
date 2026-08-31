package com.pitvia.api.maintenance.enums;

import java.util.Arrays;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 整備種別を表す列挙型
 *
 * @author pitvia
 * @version 1.0
 */
@Getter
@RequiredArgsConstructor
public enum MaintenanceType {

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
    SETTING("セッティング"),

    /** その他 */
    OTHER("その他");

    /**
     * 画面表示用ラベル。
     */
    private final String label;

    /**
     * code（Enum名）をキーにした検索用Map
     */
    private static final Map<String, MaintenanceType> MAP = Arrays.stream(values())
            .collect(Collectors.toUnmodifiableMap(
                    MaintenanceType::name,
                    Function.identity()));

    /**
     * ラベルコードから整備種別を取得
     *
     * @param code 整備種別コード
     * @return 対応する整備種別
     * @throws IllegalArgumentException 未定義のコードが指定された場合
     */
    public static MaintenanceType fromCode(String code) {

        MaintenanceType type = MAP.get(code);

        if (type == null) {
            throw new IllegalArgumentException(
                    "Unknown maintenance type code: " + code);
        }

        return type;
    }

    /**
     * DB連携用コードを返す
     *
     * @return 整備種別コード
     */
    public String getCode() {
        return name();
    }

}
