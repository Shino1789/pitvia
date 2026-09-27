package com.pitvia.api.vehicle.repository.projection;

import java.time.Instant;
import java.util.UUID;

/**
 * ショップ一覧表示用の情報を保持するプロジェクション
 *
 * @author pitvia
 * @version 1.0
 */
public interface ShopSummaryProjection {

    /**
     * ショップIDを取得する
     */
    UUID getShopId();

    /**
     * ショップ名（ユーザー名）を取得する
     */
    String getShopName();

    /**
     * ショップのユーザーアイコンのストレージキーを取得する（未設定の場合はnull）
     */
    String getShopIconKey();

    /**
     * 住所を取得する（未設定の場合はnull）
     */
    String getAddress();

    /**
     * 電話番号を取得する（未設定の場合はnull）
     */
    String getPhoneNumber();

    /**
     * OWNERとこのショップとの間で、最も新しく承認された連携の承認日時を取得する
     * （並び順の主要ソートキーとして使用。APIレスポンスには含めない）
     */
    Instant getLastLinkedAt();

}
