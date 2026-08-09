package com.pitvia.api.storage.constant;

import lombok.Getter;

/**
 * 画像種別
 *
 * @author pitvia
 * @version 1.0
 */
@Getter
public enum ImageType {

    /**
     * ユーザーアイコン画像
     */
    USER_ICON("users/icons"),

    /**
     * 車両アイコン画像
     */
    VEHICLE_ICON("vehicles/icons"),

    /**
     * 整備履歴画像
     */
    MAINTENANCE_IMAGE("maintenance/images");

    /**
     * ストレージキーのディレクトリプレフィックス
     */
    private final String keyPrefix;

    ImageType(String keyPrefix) {
        this.keyPrefix = keyPrefix;
    }

}
