package com.pitvia.api.maintenance.repository;

import java.util.Set;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.pitvia.api.maintenance.entity.MaintenanceWorkItemImage;

/**
 * 整備作業画像テーブル (maintenance_work_item_images) に対するデータアクセスを管理するリポジトリ
 *
 * @author pitvia
 * @version 1.0
 */
public interface MaintenanceWorkItemImageRepository extends JpaRepository<MaintenanceWorkItemImage, Long> {

    /**
     * 登録されている全整備作業画像のストレージキーを取得
     *
     * @return 登録されているストレージキーの集合
     */
    @Query("SELECT i.imagePath FROM MaintenanceWorkItemImage i")
    Set<String> findAllStorageKeys();

}
