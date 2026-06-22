package com.pitvia.api.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.pitvia.api.user.entity.User;

import java.util.Optional;

/**
 * ユーザー情報テーブル (users) に対するデータアクセスを管理するリポジトリ
 *
 * @author pitvia
 * @version 1.0
 */
public interface UserRepository extends JpaRepository<User, Long> {

    /**
     * メールアドレスを条件に、論理削除されていない有効なユーザーを検索
     *
     * @param email ログイン用メールアドレス
     * @return 該当するユーザー情報（存在しない場合は空）
     */
    Optional<User> findByEmail(String email);

    /**
     * メールアドレスが既に登録（かつ有効）されているかをチェック
     *
     * @param email チェック対象のメールアドレス
     * @return 既に存在する場合は true、存在しない場合は false
     */
    boolean existsByEmail(String email);

}
