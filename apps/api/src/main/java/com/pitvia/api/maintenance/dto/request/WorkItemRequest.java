package com.pitvia.api.maintenance.dto.request;

import java.math.BigDecimal;
import java.util.List;

import com.pitvia.api.maintenance.enums.MaintenanceCategory;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 整備作業明細登録リクエストDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record WorkItemRequest(

        /**
         * 整備カテゴリ
         */
        @NotNull(message = "{validation.maintenanceRecord.workItem.maintenanceCategory.required}")
        MaintenanceCategory maintenanceCategory,

        /**
         * 具体的な作業内容
         */
        @NotBlank(message = "{validation.maintenanceRecord.workItem.workContent.required}")
        @Size(max = 255, message = "{validation.maintenanceRecord.workItem.workContent.size.max}")
        String workContent,

        /**
         * 作業実施者
         */
        @NotBlank(message = "{validation.maintenanceRecord.workItem.performedBy.required}")
        @Size(max = 255, message = "{validation.maintenanceRecord.workItem.performedBy.size.max}")
        String performedBy,

        /**
         * 技術料 / 工賃
         */
        @NotNull(message = "{validation.maintenanceRecord.workItem.laborCost.required}")
        @DecimalMin(value = "0", message = "{validation.maintenanceRecord.workItem.laborCost.min}")
        BigDecimal laborCost,

        /**
         * 紐づく交換部品リスト（部品なしの作業項目もあり得るため空リストを許容）
         */
        @Valid
        List<PartRequest> parts) {

    /**
     * partsが省略・nullで送信された場合に空リストへ正規化するコンパクトコンストラクタ
     */
    public WorkItemRequest {
        parts = parts != null ? parts : List.of();
    }
}
