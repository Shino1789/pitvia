package com.pitvia.api.vehicle.repository;

import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;

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

}
