package com.pitvia.api.vehicle.repository.projection;

import java.time.LocalDate;
import java.util.UUID;

/**
 * 顧客一覧表示用の情報を保持するプロジェクション
 *
 * @author pitvia
 * @version 1.0
 */
public interface CustomerSummaryProjection {

    /**
     * 顧客（オーナー）のユーザーIDを取得する
     */
    UUID getOwnerId();

    /**
     * 顧客のユーザー名を取得する
     */
    String getOwnerName();

    /**
     * 顧客のユーザーアイコンのストレージキーを取得する（未設定の場合はnull）
     */
    String getOwnerIconKey();

    /**
     * ログインショップ自身が実施した整備履歴のうち、最も新しい作業開始日を取得する
     * （該当する整備履歴が1件も無い場合はnull）
     */
    LocalDate getLastMaintenanceDate();

}
