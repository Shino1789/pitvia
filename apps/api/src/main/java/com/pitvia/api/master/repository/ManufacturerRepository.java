package com.pitvia.api.master.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pitvia.api.master.entity.Manufacturer;

/**
 * メーカーマスタテーブル (manufacturers) に対するデータアクセスを管理するリポジトリ
 *
 * @author pitvia
 * @version 1.0
 */
public interface ManufacturerRepository extends JpaRepository<Manufacturer, Long> {

    /**
     * 全メーカーを表示順（sort_order）の昇順で取得する
     *
     * @return メーカー一覧（表示順）
     */
    List<Manufacturer> findAllByOrderBySortOrderAsc();

}
