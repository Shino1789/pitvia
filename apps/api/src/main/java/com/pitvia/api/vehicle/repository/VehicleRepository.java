package com.pitvia.api.vehicle.repository;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.pitvia.api.vehicle.entity.Vehicle;

/**
 * ユーザー車両情報テーブル (vehicles) に対するデータアクセスを管理するリポジトリ
 *
 * @author pitvia
 * @version 1.0
 */
public interface VehicleRepository extends JpaRepository<Vehicle, UUID> {

    /**
     * 指定ユーザーの登録車両数を取得
     *
     * @param userId ユーザーID
     * @return 登録車両数
     */
    long countByUser_Id(UUID userId);

    /**
     * 指定ユーザーが所有する車両一覧を、登録日時の新しい順に取得
     *
     * @param userId ユーザーID
     * @return 車両一覧（登録日時降順）
     */
    List<Vehicle> findAllByUser_IdOrderByCreatedAtDesc(UUID userId);

    /**
     * 車両画像が設定されている全車両のストレージキーを取得
     *
     * <p>
     * 論理削除済み車両は {@code @SQLRestriction} により対象外となる。
     * </p>
     *
     * @return 設定されているストレージキーの集合
     */
    @Query("SELECT v.imageKey FROM Vehicle v WHERE v.imageKey IS NOT NULL")
    Set<String> findAllStorageKeys();

}
