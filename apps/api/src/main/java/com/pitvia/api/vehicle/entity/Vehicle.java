package com.pitvia.api.vehicle.entity;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import com.pitvia.api.common.entity.BaseEntity;
import com.pitvia.api.master.entity.Manufacturer;
import com.pitvia.api.user.entity.User;
import com.pitvia.api.vehicle.enums.DriveType;
import com.pitvia.api.vehicle.enums.TransmissionType;
import com.pitvia.api.vehicle.enums.VehicleType;

import jakarta.persistence.CascadeType;
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
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * ユーザーが所有する車両情報エンティティ
 *
 * @author pitvia
 * @version 1.0
 */
@Entity
@Table(name = "vehicles")
@SQLDelete(sql = "UPDATE vehicles SET deleted_at = NOW() WHERE id = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode(of = "id", callSuper = false)
public class Vehicle extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 車両を所有するユーザー情報
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    /**
     * 車両区分 (CAR, MOTORCYCLE, KART, OTHER)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private VehicleType vehicleType;

    /**
     * 車種名（例: RX-7, GT-R）
     */
    @Column(nullable = false)
    private String modelName;

    /**
     * メーカー情報
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "manufacturer_id", nullable = false)
    private Manufacturer manufacturer;

    /**
     * 型式
     */
    private String modelCode;

    /**
     * エンジン型式
     */
    private String engineCode;

    /**
     * 年式（西暦）
     */
    @Column(nullable = false)
    private Short modelYear;

    /**
     * ナンバープレート（チューニングカー・サーキット専用車等を考慮し任意項目）
     */
    private String licensePlate;

    /**
     * 車両画像のストレージキー
     */
    private String imageKey;

    /**
     * 現在の積算走行距離 (km)
     */
    @Column(nullable = false)
    private Integer currentMileage;

    /**
     * トランスミッション形式 (MT, AT, CVT, DCT)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TransmissionType transmissionType;

    /**
     * 駆動方式 (FR, FF, AWD, MR, RR)
     */
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private DriveType driveType;

    /**
     * 車両メモ / 補足情報
     */
    @Column(columnDefinition = "TEXT")
    private String memo;

    /**
     * 車両とショップの連携履歴・ステータス
     */
    @Builder.Default
    @OneToMany(mappedBy = "vehicle", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<VehicleShopLink> shopLinks = new ArrayList<>();

    /**
     * 積算走行距離を更新する
     *
     * @param mileage 新しい走行距離 (km)
     */
    public void updateMileage(Integer mileage) {
        if (mileage != null && mileage >= 0) {
            this.currentMileage = mileage;
        }
    }

    /**
     * 車両画像のストレージキーを更新する
     *
     * @param imageKey 新しいストレージキー
     */
    public void updateImageKey(String imageKey) {
        this.imageKey = imageKey;
    }
}
