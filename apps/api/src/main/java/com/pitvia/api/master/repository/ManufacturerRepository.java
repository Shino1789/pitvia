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
     * 全メーカーを名称の昇順で取得する
     *
     * @return メーカー一覧（名称昇順）
     */
    List<Manufacturer> findAllByOrderByNameAsc();

}
