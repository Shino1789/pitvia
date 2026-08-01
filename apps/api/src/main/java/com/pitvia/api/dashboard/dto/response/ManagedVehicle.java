package com.pitvia.api.dashboard.dto.response;

/**
 * 管理車両数内訳データ
 *
 * @author pitvia
 * @version 1.0
 */
public record ManagedVehicle(

        /**
         * 管理車両総数
         */
        long total,

        /**
         * マイカー車両数
         */
        long own,

        /**
         * 顧客車両数
         */
        long customer) {
}
