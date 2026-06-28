package com.pitvia.api.token.repository;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.pitvia.api.token.entity.RefreshToken;

/**
 * リフレッシュトークン管理テーブル (refresh_tokens) に対するデータアクセスを管理するリポジトリ
 *
 * @author pitvia
 * @version 1.0
 */
public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {

    /**
     * JWT IDを条件にリフレッシュトークンを検索
     *
     * @param jti JWT ID
     * @return 該当するリフレッシュトークン情報（存在しない場合は空）
     */
    Optional<RefreshToken> findByJti(UUID jti);

    /**
     * JWT IDを条件に有効な（無効化されておらず、期限内の）リフレッシュトークンを検索
     *
     * @param jti JWT ID
     * @param now 現在日時
     * @return 該当する有効なリフレッシュトークン情報（存在しない、または無効な場合は空）
     */
    Optional<RefreshToken> findByJtiAndRevokedAtIsNullAndExpiresAtAfter(UUID jti, Instant now);

    /**
     * トークンのハッシュ値を条件にリフレッシュトークンを検索
     *
     * @param tokenHash リフレッシュトークンのハッシュ値
     * @return 該当するリフレッシュトークン情報（存在しない場合は空）
     */
    Optional<RefreshToken> findByTokenHash(String tokenHash);

    /**
     * トークンのハッシュ値を条件に有効な（無効化されておらず、期限内の）リフレッシュトークンを検索
     *
     * @param tokenHash リフレッシュトークンのハッシュ値
     * @param now       現在日時
     * @return 該当する有効なリフレッシュトークン情報（存在しない、または無効な場合は空）
     */
    Optional<RefreshToken> findByTokenHashAndRevokedAtIsNullAndExpiresAtAfter(String tokenHash, Instant now);

    /**
     * トークンのハッシュ値とJWT IDを条件に有効な（無効化されておらず、期限内の）リフレッシュトークンを検索
     *
     * @param tokenHash リフレッシュトークンのハッシュ値
     * @param jti       JWT ID
     * @param now       現在日時
     * @return 該当する有効なリフレッシュトークン情報
     */
    Optional<RefreshToken> findByTokenHashAndJtiAndRevokedAtIsNullAndExpiresAtAfter(String tokenHash, UUID jti,
            Instant now);

    /**
     * ユーザーIDに紐づくリフレッシュトークンを全て取得
     *
     * @param userId ユーザーID
     * @return 該当するリフレッシュトークンのリスト（存在しない場合は空）
     */
    List<RefreshToken> findAllByUser_Id(UUID userId);

    /**
     * ユーザーIDに紐づくリフレッシュトークンを全て物理削除
     *
     * @param userId ユーザーID
     * @return 削除されたレコード件数
     */
    long deleteAllByUser_Id(UUID userId);

    /**
     * 有効期限切れ、もしくは無効化されたリフレッシュトークンを全て物理削除
     *
     * @param now 現在日時
     * @return 削除されたレコード件数
     */
    @Modifying
    @Query("DELETE FROM RefreshToken r WHERE r.expiresAt < :now OR r.revokedAt IS NOT NULL")
    int deleteAllByExpiredOrRevoked(@Param("now") Instant now);

}
