package com.pitvia.api.maintenance.dto.request;

import java.math.BigDecimal;

import com.pitvia.api.maintenance.enums.PartCondition;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 交換部品登録・更新リクエストDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record PartRequest(

        /**
         * 部品ID
         *
         * <p>
         * 既存の部品を更新する場合はそのID、新規追加する場合はnullが送られることを想定
         * </p>
         */
        Long id,

        /**
         * 部品の状態（任意項目）
         */
        PartCondition partCondition,

        /**
         * 部品名
         */
        @NotBlank(message = "{validation.maintenanceRecord.part.partName.required}")
        @Size(max = 255, message = "{validation.maintenanceRecord.part.partName.size.max}")
        String partName,

        /**
         * パーツメーカー名
         */
        @Size(max = 255, message = "{validation.maintenanceRecord.part.manufacturerName.size.max}")
        String manufacturerName,

        /**
         * 部品型番 / 品番
         */
        @Size(max = 100, message = "{validation.maintenanceRecord.part.partModelNumber.size.max}")
        String partModelNumber,

        /**
         * 数量
         */
        @NotNull(message = "{validation.maintenanceRecord.part.quantity.required}")
        @DecimalMin(value = "0", inclusive = false, message = "{validation.maintenanceRecord.part.quantity.min}")
        BigDecimal quantity,

        /**
         * 部品単価
         */
        @NotNull(message = "{validation.maintenanceRecord.part.unitPrice.required}")
        @DecimalMin(value = "0", message = "{validation.maintenanceRecord.part.unitPrice.min}")
        BigDecimal unitPrice) {
}
