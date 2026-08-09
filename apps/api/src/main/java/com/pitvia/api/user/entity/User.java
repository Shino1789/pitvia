package com.pitvia.api.user.entity;

import java.time.Instant;
import java.util.UUID;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.common.entity.BaseEntity;
import com.pitvia.api.shop.entity.Shop;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * ユーザー情報エンティティ
 *
 * @author pitvia
 * @version 1.0
 */
@Entity
@Table(name = "users")
@SQLDelete(sql = "UPDATE users SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode(of = "id", callSuper = false)
public class User extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * ユーザーロール (OWNER, SHOP, ADMIN)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    /**
     * ユーザー名
     */
    @Column(nullable = false)
    private String userName;

    /**
     * ログイン用メールアドレス
     */
    @Column(nullable = false)
    private String email;

    /**
     * ハッシュ化済みパスワード
     */
    @Column(nullable = false)
    private String passwordHash;

    /**
     * アイコン画像のストレージキー
     */
    @Column(length = 500)
    private String iconKey;

    /**
     * メール認証日時
     */
    private Instant emailVerifiedAt;

    /**
     * 最終ログイン日時
     */
    private Instant lastLoginAt;

    /**
     * 紐づくショップ情報
     */
    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    private Shop shop;

    /**
     * 最終ログイン日時をセットする
     */
    public void updateLastLogin() {
        this.lastLoginAt = Instant.now();
    }

}
