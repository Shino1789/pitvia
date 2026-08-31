package com.pitvia.api.master.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pitvia.api.master.entity.MaintenanceType;

/**
 * 整備種別マスタテーブル (maintenance_types) に対するデータアクセスを管理するリポジトリ
 *
 * @author pitvia
 * @version 1.0
 */
public interface MaintenanceTypeRepository extends JpaRepository<MaintenanceType, Long> {

    /**
     * 整備種別コードに一致するマスタ情報を取得する
     *
     * @param code 整備種別コード（'REPAIR' 等）
     * @return 該当する整備種別マスタ情報
     */
    Optional<MaintenanceType> findByCode(String code);

}
