package com.pitvia.api.master.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pitvia.api.master.entity.MaintenanceCategory;

/**
 * 整備カテゴリマスタテーブル (maintenance_categories) に対するデータアクセスを管理するリポジトリ
 *
 * @author pitvia
 * @version 1.0
 */
public interface MaintenanceCategoryRepository extends JpaRepository<MaintenanceCategory, Long> {

    /**
     * 整備カテゴリコードに一致するマスタ情報を取得する
     *
     * @param code 整備カテゴリコード（'ENGINE' 等）
     * @return 該当する整備カテゴリマスタ情報
     */
    Optional<MaintenanceCategory> findByCode(String code);

}
