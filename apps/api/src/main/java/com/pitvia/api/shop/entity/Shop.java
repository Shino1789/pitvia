package com.pitvia.api.shop.entity;

import com.pitvia.api.common.entity.BaseEntity;
import com.pitvia.api.user.entity.User;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

/**
 * 整備ショップ情報エンティティ
 *
 * @author pitvia
 * @version 1.0
 */
@Entity
@Table(name = "shops")
@SQLDelete(sql = "UPDATE shops SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(of = "id", callSuper = false)
public class Shop extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * ショップアカウントに紐づくユーザー情報
     */
    @OneToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    private User user;

    /**
     * 電話番号
     */
    private String phoneNumber;

    /**
     * 郵便番号
     */
    private String postalCode;

    /**
     * 住所
     */
    private String address;

    /**
     * ショップ公式サイトURL
     */
    private String websiteUrl;

    /**
     * ショップ説明文
     */
    @Column(columnDefinition = "TEXT")
    private String description;

}
