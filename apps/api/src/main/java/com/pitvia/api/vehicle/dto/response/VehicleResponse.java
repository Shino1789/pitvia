package com.pitvia.api.vehicle.dto.response;

import java.util.UUID;

import com.pitvia.api.storage.resolver.StorageUrlResolver;
import com.pitvia.api.vehicle.entity.Vehicle;
import com.pitvia.api.vehicle.enums.DriveType;
import com.pitvia.api.vehicle.enums.TransmissionType;
import com.pitvia.api.vehicle.enums.VehicleType;

/**
 * 車両情報レスポンスDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record VehicleResponse(

        /**
         * 車両ID
         */
        UUID id,

        /**
         * 車両種別
         */
        VehicleType vehicleType,

        /**
         * 車種名（例: RX-7, GT-R）
         */
        String modelName,

        /**
         * メーカー表示名
         */
        String manufacturerName,

        /**
         * 型式
         */
        String modelCode,

        /**
         * エンジン型式
         */
        String engineCode,

        /**
         * 年式（西暦）
         */
        Short modelYear,

        /**
         * ナンバープレート
         */
        String licensePlate,

        /**
         * 車両画像の公開URL（未設定の場合はnull）
         */
        String imageUrl,

        /**
         * 現在の積算走行距離 (km)
         */
        Integer currentMileage,

        /**
         * トランスミッション形式
         */
        TransmissionType transmissionType,

        /**
         * 駆動方式
         */
        DriveType driveType,

        /**
         * 車両メモ / 補足情報
         */
        String memo) {

    /**
     * Vehicleエンティティから生成
     *
     * <p>
     * 画像のストレージキーは、この変換処理の中で公開URLへ解決する。
     * {@code manufacturer}は遅延ロードのため、本メソッドは呼び出し元のトランザクション内で実行すること。
     * </p>
     *
     * @param vehicle           車両エンティティ
     * @param storageUrlResolver 公開URL組み立てクラス
     * @return VehicleResponse
     */
    public static VehicleResponse from(Vehicle vehicle, StorageUrlResolver storageUrlResolver) {

        String imageUrl = vehicle.getImageKey() != null
                ? storageUrlResolver.resolve(vehicle.getImageKey())
                : null;

        return new VehicleResponse(
                vehicle.getId(),
                vehicle.getVehicleType(),
                vehicle.getModelName(),
                vehicle.getManufacturer().getName(),
                vehicle.getModelCode(),
                vehicle.getEngineCode(),
                vehicle.getModelYear(),
                vehicle.getLicensePlate(),
                imageUrl,
                vehicle.getCurrentMileage(),
                vehicle.getTransmissionType(),
                vehicle.getDriveType(),
                vehicle.getMemo());
    }
}
