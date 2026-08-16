package com.pitvia.api.maintenance.dto.response;

import com.pitvia.api.common.dto.response.PageResponse;
import com.pitvia.api.vehicle.dto.response.VehicleOwnerSummary;

/**
 * 整備履歴一覧取得レスポンス
 *
 * @author pitvia
 * @version 1.0
 */
public record MaintenanceRecordListResponse(

        /**
         * 車両オーナー情報（SHOPが顧客の連携車両を見ている場合のみ設定）
         */
        VehicleOwnerSummary owner,

        /**
         * 整備履歴一覧（ページング付き）
         */
        PageResponse<MaintenanceRecordSummary> records) {
}
