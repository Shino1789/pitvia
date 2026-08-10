package com.pitvia.api.vehicle.dto.response;

/**
 * 車両登録フォームの選択肢（value/labelペア）を表すデータ転送オブジェクト
 *
 * @author pitvia
 * @version 1.0
 */
public record VehicleSelectOption(

        /**
         * 選択値（enum名。例: "MT"）
         */
        String value,

        /**
         * 表示ラベル
         */
        String label) {
}
