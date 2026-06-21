package com.pitvia.api.security.repository;

import com.pitvia.api.security.entity.Shop;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

/**
 * 整備ショップ情報テーブル (shops) に対するデータアクセスを管理するリポジトリ
 *
 * @author pitvia
 * @version 1.0
 */
public interface ShopRepository extends JpaRepository<Shop, Long> {

    /**
     * ユーザーIDに紐づく有効な整備ショップ情報を検索
     *
     * @param userId ユーザーID
     * @return 該当するショップ情報（存在しない場合は空）
     */
    Optional<Shop> findByUser_Id(Long userId);

    /**
     * ユーザーIDに紐づくショップが存在するかチェック
     *
     * @param userId ユーザーID
     * @return 存在する場合は true、存在しない場合は false
     */
    boolean existsByUser_Id(Long userId);

}
