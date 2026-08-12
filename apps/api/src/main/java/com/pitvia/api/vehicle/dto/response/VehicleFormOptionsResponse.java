package com.pitvia.api.vehicle.dto.response;

import java.util.List;

/**
 * 車両登録フォームの初期化に必要な選択肢一式を保持するデータ転送オブジェクト
 *
 * @author pitvia
 * @version 1.0
 */
public record VehicleFormOptionsResponse(

        /**
         * メーカー選択肢一覧
         */
        List<ManufacturerOption> manufacturers,

        /**
         * トランスミッション形式の選択肢一覧
         */
        List<VehicleSelectOption> transmissionTypes,

        /**
         * 駆動方式の選択肢一覧
         */
        List<VehicleSelectOption> driveTypes) {
}
