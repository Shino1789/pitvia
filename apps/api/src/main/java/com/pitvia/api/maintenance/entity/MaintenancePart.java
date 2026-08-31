package com.pitvia.api.maintenance.entity;

import java.math.BigDecimal;
import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import com.pitvia.api.maintenance.dto.request.PartRequest;
import com.pitvia.api.maintenance.enums.PartCondition;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import jakarta.persistence.Version;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 交換部品明細エンティティ
 *
 * @author pitvia
 * @version 1.0
 */
@Entity
@Table(name = "maintenance_parts")
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode(of = "id", callSuper = false)
@EntityListeners(AuditingEntityListener.class)
public class MaintenancePart {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * 親となる整備作業明細情報
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "maintenance_work_item_id", nullable = false)
    private MaintenanceWorkItem maintenanceWorkItem;

    /**
     * 部品の状態 (NEW, USED, REBUILT)
     */
    @Enumerated(EnumType.STRING)
    @Column(length = 50)
    private PartCondition partCondition;

    /**
     * 部品名
     */
    @Column(nullable = false)
    private String partName;

    /**
     * パーツメーカー名
     */
    private String manufacturerName;

    /**
     * 部品型番 / 品番
     */
    private String partModelNumber;

    /**
     * 数量
     */
    @Column(nullable = false)
    private BigDecimal quantity;

    /**
     * 部品単価
     */
    @Column(nullable = false)
    private BigDecimal unitPrice;

    /**
     * 部品内の表示並び順
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
     * 部品の情報を更新する
     *
     * @param request    更新リクエスト（部品1件分）
     * @param sortOrder  リクエスト内での並び順（クライアントの入力値は信頼しない）
     */
    public void update(PartRequest request, int sortOrder) {
        this.partCondition = request.partCondition();
        this.partName = request.partName();
        this.manufacturerName = request.manufacturerName();
        this.partModelNumber = request.partModelNumber();
        this.quantity = request.quantity();
        this.unitPrice = request.unitPrice();
        this.sortOrder = sortOrder;
    }
}
