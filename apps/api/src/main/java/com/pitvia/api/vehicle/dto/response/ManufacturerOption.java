package com.pitvia.api.vehicle.dto.response;

/**
 * 車両登録フォームの「メーカー」選択肢を表すデータ転送オブジェクト
 *
 * @author pitvia
 * @version 1.0
 */
public record ManufacturerOption(

        /**
         * メーカーID
         */
        Long id,

        /**
         * メーカー表示名
         */
        String name) {
}
