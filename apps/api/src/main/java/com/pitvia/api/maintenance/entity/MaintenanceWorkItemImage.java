package com.pitvia.api.maintenance.entity;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
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
 * 整備作業画像エンティティ
 *
 * @author pitvia
 * @version 1.0
 */
@Entity
@Table(name = "maintenance_work_item_images")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode(of = "id")
public class MaintenanceWorkItemImage {

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
     * 画像のストレージキー（列名はパスだが、実際に保存するのは公開URLではなくストレージキー）
     */
    @Column(nullable = false)
    private String imagePath;

    /**
     * 画像の表示並び順
     */
    @Column(nullable = false)
    private Integer sortOrder;

    /**
     * 登録日時
     */
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private Instant createdAt;
}
