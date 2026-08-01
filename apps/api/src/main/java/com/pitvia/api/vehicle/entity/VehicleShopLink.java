package com.pitvia.api.vehicle.entity;

import java.time.Instant;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import com.pitvia.api.common.entity.BaseEntity;
import com.pitvia.api.shop.entity.Shop;
import com.pitvia.api.vehicle.enums.LinkStatus;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
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
 * 車両と整備ショップ情報の中間（連携）エンティティ
 *
 * @author pitvia
 * @version 1.0
 */
@Entity
@Table(name = "vehicle_shop_links")
@SQLDelete(sql = "UPDATE vehicle_shop_links SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode(of = "id", callSuper = false)
public class VehicleShopLink extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 連携対象の車両情報
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    /**
     * 連携対象の整備ショップ情報
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id", nullable = false)
    private Shop shop;

    /**
     * 連携ステータス (PENDING, APPROVED, REJECTED)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private LinkStatus status;

    /**
     * 招待 / 承認コード（連携申請用）
     */
    private String inviteCode;

    /**
     * 連携承認日時
     */
    private Instant approvedAt;

    /**
     * 連携申請を承認する
     */
    public void approve() {
        this.status = LinkStatus.APPROVED;
        this.approvedAt = Instant.now();
        this.inviteCode = null; // 承認後はコードをクリア
    }

    /**
     * 連携申請を却下する
     */
    public void reject() {
        this.status = LinkStatus.REJECTED;
        this.inviteCode = null;
    }
}
