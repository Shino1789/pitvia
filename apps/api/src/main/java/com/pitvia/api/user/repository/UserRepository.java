package com.pitvia.api.user.repository;

import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import com.pitvia.api.user.entity.User;

/**
 * ユーザー情報テーブル (users) に対するデータアクセスを管理するリポジトリ
 *
 * @author pitvia
 * @version 1.0
 */
public interface UserRepository extends JpaRepository<User, UUID> {

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

    /**
     * アイコン画像が設定されている全ユーザーのストレージキーを取得
     *
     * @return 設定されているストレージキーの集合
     */
    @Query("SELECT u.iconUrl FROM User u WHERE u.iconUrl IS NOT NULL")
    Set<String> findAllStorageKeys();

}
