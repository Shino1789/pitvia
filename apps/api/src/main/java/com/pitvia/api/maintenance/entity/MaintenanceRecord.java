package com.pitvia.api.maintenance.entity;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.hibernate.annotations.BatchSize;
import org.hibernate.annotations.SQLDelete;
import org.hibernate.annotations.SQLRestriction;

import com.pitvia.api.common.entity.BaseEntity;
import com.pitvia.api.maintenance.dto.request.UpdateMaintenanceRecordRequest;
import com.pitvia.api.master.entity.MaintenanceType;
import com.pitvia.api.shop.entity.Shop;
import com.pitvia.api.user.entity.User;
import com.pitvia.api.vehicle.entity.Vehicle;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 整備記録ヘッダーエンティティ
 *
 * @author pitvia
 * @version 1.0
 */
@Entity
@Table(name = "maintenance_records")
@SQLDelete(sql = "UPDATE maintenance_records SET deleted_at = NOW() WHERE id = ? AND version = ?")
@SQLRestriction("deleted_at IS NULL")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode(of = "id", callSuper = false)
public class MaintenanceRecord extends BaseEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    /**
     * 対象の車両情報
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "vehicle_id", nullable = false)
    private Vehicle vehicle;

    /**
     * 登録・作成したユーザー情報
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by_user_id", nullable = false)
    private User createdByUser;

    /**
     * 整備を実施したショップ情報（DIYの場合はNULL）
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "shop_id")
    private Shop shop;

    /**
     * 整備タイトル
     */
    @Column(nullable = false)
    private String title;

    /**
     * 整備種別マスタ情報
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maintenance_type_id", nullable = false)
    private MaintenanceType maintenanceType;

    /**
     * 整備開始日
     */
    @Column(nullable = false)
    private LocalDate workDateFrom;

    /**
     * 整備完了日
     */
    private LocalDate workDateTo;

    /**
     * 整備実施時の積算走行距離 (km)
     */
    @Column(nullable = false)
    private Integer mileage;

    /**
     * 総合備考 / 特記事項
     */
    @Column(columnDefinition = "TEXT")
    private String remarks;

    /**
     * 下書きフラグ (true: 下書き, false: 本登録)
     */
    @Column(nullable = false)
    private boolean isDraft;

    /**
     * 紐づく作業明細リスト（表示順にソート）
     */
    @Builder.Default
    @OneToMany(mappedBy = "maintenanceRecord", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @BatchSize(size = 20)
    private List<MaintenanceWorkItem> workItems = new ArrayList<>();

    /**
     * 整備記録ヘッダーの基本情報を更新する
     *
     * @param request         更新リクエスト
     * @param maintenanceType 検証済みの整備種別マスタエンティティ
     */
    public void update(UpdateMaintenanceRecordRequest request, MaintenanceType maintenanceType) {
        this.title = request.title();
        this.maintenanceType = maintenanceType;
        this.workDateFrom = request.workDateFrom();
        this.workDateTo = request.workDateTo();
        this.mileage = request.mileage();
        this.remarks = request.remarks();
    }
}
