package com.pitvia.api.master.entity;

import java.time.Instant;

import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 自動車のメーカーマスタエンティティ
 *
 * @author pitvia
 * @version 1.0
 */
@Entity
@Table(name = "manufacturers")
@EntityListeners(AuditingEntityListener.class)
@Getter
@Builder
@NoArgsConstructor
@AllArgsConstructor(access = AccessLevel.PRIVATE)
@EqualsAndHashCode(of = "id")
public class Manufacturer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /**
     * メーカーコード（'TOYOTA', 'HONDA' など）
     */
    @Column(nullable = false, unique = true)
    private String code;

    /**
     * メーカー表示名（'トヨタ', 'ホンダ' など）
     */
    @Column(nullable = false, unique = true)
    private String name;

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
