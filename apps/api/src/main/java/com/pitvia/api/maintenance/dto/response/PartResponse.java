package com.pitvia.api.maintenance.dto.response;

import java.math.BigDecimal;

import com.pitvia.api.maintenance.entity.MaintenancePart;
import com.pitvia.api.maintenance.enums.PartCondition;

/**
 * 交換部品詳細情報レスポンスDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record PartResponse(

        /**
         * 部品ID
         */
        Long id,

        /**
         * 部品の状態
         */
        PartCondition partCondition,

        /**
         * 部品名
         */
        String partName,

        /**
         * パーツメーカー名
         */
        String manufacturerName,

        /**
         * 部品型番 / 品番
         */
        String partModelNumber,

        /**
         * 数量
         */
        BigDecimal quantity,

        /**
         * 部品単価
         */
        BigDecimal unitPrice) {

    /**
     * エンティティから生成する
     *
     * @param part 交換部品エンティティ
     * @return PartResponse
     */
    public static PartResponse from(MaintenancePart part) {
        return new PartResponse(
                part.getId(),
                part.getPartCondition(),
                part.getPartName(),
                part.getManufacturerName(),
                part.getPartModelNumber(),
                part.getQuantity(),
                part.getUnitPrice());
    }
}
