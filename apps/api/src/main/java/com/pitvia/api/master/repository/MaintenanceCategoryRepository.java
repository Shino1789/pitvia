package com.pitvia.api.master.repository;

import java.util.Collection;
import java.util.List;
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

    /**
     * 整備カテゴリコード群に一致するマスタ情報をまとめて取得する
     *
     * @param codes 整備カテゴリコードの集合
     * @return 該当する整備カテゴリマスタ情報のリスト
     */
    List<MaintenanceCategory> findAllByCodeIn(Collection<String> codes);

}
