package com.pitvia.api.vehicle.repository;

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
     * 車両画像が設定されている全車両のストレージキーを取得
     *
     * @return 設定されているストレージキーの集合
     */
    @Query("SELECT v.imageUrl FROM Vehicle v WHERE v.imageUrl IS NOT NULL")
    Set<String> findAllStorageKeys();

}
