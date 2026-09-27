package com.pitvia.api.vehicle.repository.projection;

import java.util.UUID;

/**
 * OWNER視点のショップ一覧における、連携車両サマリー表示用の情報を保持するプロジェクション
 *
 * @author pitvia
 * @version 1.0
 */
public interface LinkedVehicleSummaryProjection {

    /**
     * 連携先ショップIDを取得する（呼び出し側でのグルーピングキー）
     */
    UUID getShopId();

    /**
     * 車両IDを取得する
     */
    UUID getVehicleId();

    /**
     * 車種名を取得する
     */
    String getVehicleModelName();

    /**
     * 車両画像のストレージキーを取得する（未設定の場合はnull）
     */
    String getVehicleImageKey();

}
