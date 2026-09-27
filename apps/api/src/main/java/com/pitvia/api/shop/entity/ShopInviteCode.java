package com.pitvia.api.shop.entity;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * ショップ招待コード管理エンティティ
 *
 * <p>
 * <b>{@code code}の平文保存について：</b>
 * {@link com.pitvia.api.token.entity.RefreshToken RefreshToken}と異なり、本エンティティは
 * {@code code}をハッシュ化せず平文のままDBへ保存する。招待コードは発行モーダルの再表示要件
 * （GETで現在有効なコードをそのまま再表示する）があり、ハッシュ化すると元の値を復元できず
 * 要件を満たせないため。ただし本コードは「認証情報・パスワード」ではなく、第三者に知られると
 * ショップ連携が行われ得る「期限付きの招待用コード」として扱う（β版における意図的な設計判断）。
 * ログ・例外メッセージ等には{@code code}の値を絶対に出力しないこと。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
@Entity
@Table(name = "shop_invite_codes")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode(of = "id", callSuper = false)
public class ShopInviteCode {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 発行元ショップ
     */
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    /**
     * 招待コード（平文保存。ログ・例外メッセージに出力しないこと）
     */
    @Column(nullable = false, unique = true, updatable = false)
    private String code;

    /**
     * 有効期限
     */
    @Column(nullable = false)
    private Instant expiresAt;

    /**
     * 無効化日時（再発行時に旧コードを失効させる際に設定）
     */
    private Instant revokedAt;

    /**
     * 作成日時
     */
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    /**
     * 更新日時
     */
    @LastModifiedDate
    @Column(nullable = false)
    private Instant updatedAt;

    /**
     * このコードが現在有効（失効しておらず、期限内）かどうかを判定する
     *
     * @return 有効であればtrue
     */
    public boolean isActive() {
        return revokedAt == null && expiresAt.isAfter(Instant.now());
    }

    /**
     * コードを失効させる（冪等）
     *
     * <p>
     * 有効期限切れかどうかは問わない。再発行時は、この判定を経由せず
     * {@code revokedAt IS NULL}の既存コードを無条件で失効させる運用とする。
     * </p>
     */
    public void revoke() {
        if (revokedAt != null) {
            return;
        }
        this.revokedAt = Instant.now();
    }

}
