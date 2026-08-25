package com.pitvia.api.maintenance.entity;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

import org.hibernate.annotations.BatchSize;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.pitvia.api.maintenance.dto.request.WorkItemRequest;
import com.pitvia.api.master.entity.MaintenanceCategory;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.OneToMany;
import jakarta.persistence.OrderBy;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 整備作業明細エンティティ
 *
 * @author pitvia
 * @version 1.0
 */
@Entity
@Table(name = "maintenance_work_items")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode(of = "id", callSuper = false)
@EntityListeners(AuditingEntityListener.class)
public class MaintenanceWorkItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 親となる整備記録ヘッダー情報
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maintenance_record_id", nullable = false)
    private MaintenanceRecord maintenanceRecord;

    /**
     * 整備カテゴリマスタ情報
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maintenance_category_id", nullable = false)
    private MaintenanceCategory maintenanceCategory;

    /**
     * 具体的な作業内容
     */
    @Column(nullable = false)
    private String workContent;

    /**
     * 作業実施者（ショップ名やオーナー自身など）
     */
    @Column(nullable = false)
    private String performedBy;

    /**
     * 技術料 / 工賃
     */
    @Column(nullable = false)
    private BigDecimal laborCost;

    /**
     * 明細内の表示並び順
     */
    @Column(nullable = false)
    private Integer sortOrder;

    /**
     * 楽観的ロック用のバージョン
     */
    @Version
    @Column(nullable = false)
    private Integer version;

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

    /**
     * 紐づく交換部品リスト（表示順にソート）
     */
    @Builder.Default
    @OneToMany(mappedBy = "maintenanceWorkItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @BatchSize(size = 20)
    private List<MaintenancePart> parts = new ArrayList<>();

    /**
     * 紐づく作業画像リスト（表示順にソート）
     */
    @Builder.Default
    @OneToMany(mappedBy = "maintenanceWorkItem", cascade = CascadeType.ALL, orphanRemoval = true)
    @OrderBy("sortOrder ASC")
    @BatchSize(size = 20)
    private List<MaintenanceWorkItemImage> images = new ArrayList<>();

    /**
     * 作業項目の基本情報を更新する
     *
     * <p>
     * 部品（{@code parts}）・画像（{@code images}）の更新は
     * {@code MaintenanceRecordDetailService}側で個別に行う。
     * </p>
     *
     * @param request             更新リクエスト（作業項目1件分）
     * @param maintenanceCategory 検証済みの整備カテゴリマスタエンティティ
     * @param sortOrder           リクエスト内での並び順（クライアントの入力値は信頼しない）
     */
    public void update(WorkItemRequest request, MaintenanceCategory maintenanceCategory, int sortOrder) {
        this.maintenanceCategory = maintenanceCategory;
        this.workContent = request.workContent();
        this.performedBy = request.performedBy();
        this.laborCost = request.laborCost();
        this.sortOrder = sortOrder;
    }

}
