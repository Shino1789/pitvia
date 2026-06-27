package com.pitvia.api.token.entity;

import java.time.Instant;
import java.util.UUID;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;

import com.pitvia.api.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * リフレッシュトークン管理エンティティ
 *
 * @author pitvia
 * @version 1.0
 */
@Entity
@Table(name = "refresh_tokens")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(of = "id", callSuper = false)
public class RefreshToken {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 認証済みユーザー
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * JWT ID
     */
    @Column(nullable = false, unique = true, updatable = false)
    private UUID jti;

    /**
     * リフレッシュトークンのハッシュ値
     */
    @Column(nullable = false, unique = true, updatable = false)
    private String tokenHash;

    /**
     * ユーザーエージェント
     */
    private String userAgent;

    /**
     * IPアドレス
     */
    private String ipAddress;

    /**
     * トークンの有効期限日時
     */
    @Column(nullable = false)
    private Instant expiresAt;

    /**
     * トークンの無効化日時
     */
    private Instant revokedAt;

    /**
     * 最終使用日時
     */
    private Instant lastUsedAt;

    /**
     * 作成日時
     */
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * 最終更新日時
     */
    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;

}
