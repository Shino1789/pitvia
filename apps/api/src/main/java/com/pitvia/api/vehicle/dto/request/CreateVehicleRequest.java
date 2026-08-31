package com.pitvia.api.vehicle.dto.request;

import com.pitvia.api.vehicle.enums.DriveType;
import com.pitvia.api.vehicle.enums.TransmissionType;
import com.pitvia.api.vehicle.enums.VehicleType;
import com.pitvia.api.vehicle.validation.annotation.ValidModelYear;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 車両登録リクエストDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record CreateVehicleRequest(

        /**
         * 車両種別
         */
        @NotNull(message = "{validation.vehicle.vehicleType.required}") VehicleType vehicleType,

        /**
         * 車種名（例: RX-7, GT-R）
         */
        @NotBlank(message = "{validation.vehicle.modelName.required}") @Size(max = 255, message = "{validation.vehicle.modelName.size.max}") String modelName,

        /**
         * メーカーID
         */
        @NotNull(message = "{validation.vehicle.manufacturerId.required}") Long manufacturerId,

        /**
         * 型式
         */
        @Size(max = 100, message = "{validation.vehicle.modelCode.size.max}") String modelCode,

        /**
         * エンジン型式
         */
        @Size(max = 100, message = "{validation.vehicle.engineCode.size.max}") String engineCode,

        /**
         * 年式（西暦）
         */
        @NotNull(message = "{validation.vehicle.modelYear.required}") @Min(value = 1900, message = "{validation.vehicle.modelYear.min}") @ValidModelYear Short modelYear,

        /**
         * ナンバープレート（チューニングカー・サーキット専用車等を考慮し任意項目）
         */
        @Size(max = 100, message = "{validation.vehicle.licensePlate.size.max}") String licensePlate,

        /**
         * 現在の積算走行距離 (km)
         */
        @NotNull(message = "{validation.vehicle.currentMileage.required}") @Min(value = 0, message = "{validation.vehicle.currentMileage.min}") Integer currentMileage,

        /**
         * トランスミッション形式
         */
        @NotNull(message = "{validation.vehicle.transmissionType.required}") TransmissionType transmissionType,

        /**
         * 駆動方式
         */
        @NotNull(message = "{validation.vehicle.driveType.required}") DriveType driveType,

        /**
         * 車両メモ / 補足情報
         */
        String memo,

        /**
         * 既存の車両画像を削除するかどうか（更新時のみ使用。未指定時はfalse扱い）
         */
        boolean removeImage) {
}
