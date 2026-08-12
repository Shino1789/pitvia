package com.pitvia.api.vehicle.dto.response;

import java.util.List;

/**
 * 車両一覧取得APIのレスポンスDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record VehicleListResponse(

        /**
         * 対象オーナー情報
         *
         * <p>
         * {@code ownerId}を指定して他者（SHOPから見た顧客）の車両一覧を取得した場合のみ設定される。
         * ログインユーザー自身の車両一覧を取得した場合は{@code null}。
         * </p>
         */
        VehicleOwnerSummary owner,

        /**
         * 車両一覧
         */
        List<VehicleResponse> vehicles) {
}
