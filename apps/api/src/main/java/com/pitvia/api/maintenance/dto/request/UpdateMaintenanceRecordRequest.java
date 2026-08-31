package com.pitvia.api.maintenance.dto.request;

import java.time.LocalDate;
import java.util.List;

import com.pitvia.api.maintenance.enums.MaintenanceType;
import com.pitvia.api.maintenance.validation.WorkDatePeriod;
import com.pitvia.api.maintenance.validation.annotation.ValidWorkDatePeriod;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * 整備履歴更新リクエストDTO
 *
 * <p>
 * {@code workItems}の各要素は{@link WorkItemRequest#id()}の有無で、既存作業項目の更新（IDあり）と
 * 新規追加（IDなし）を区別する。リクエストに含まれなかった既存作業項目・部品は削除対象として扱う
 * （{@code MaintenanceRecordDetailService}参照）。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
@ValidWorkDatePeriod
public record UpdateMaintenanceRecordRequest(

        /**
         * 整備タイトル
         */
        @NotBlank(message = "{validation.maintenanceRecord.title.required}")
        @Size(max = 255, message = "{validation.maintenanceRecord.title.size.max}")
        String title,

        /**
         * 整備種別
         */
        @NotNull(message = "{validation.maintenanceRecord.maintenanceType.required}")
        MaintenanceType maintenanceType,

        /**
         * 作業開始日
         */
        @NotNull(message = "{validation.maintenanceRecord.workDateFrom.required}")
        LocalDate workDateFrom,

        /**
         * 作業終了日（任意項目。指定する場合は作業開始日以降であること）
         */
        LocalDate workDateTo,

        /**
         * 作業時点の走行距離 (km)
         */
        @NotNull(message = "{validation.maintenanceRecord.mileage.required}")
        @Min(value = 0, message = "{validation.maintenanceRecord.mileage.min}")
        Integer mileage,

        /**
         * 備考
         */
        String remarks,

        /**
         * 紐づく作業項目リスト（1件以上必須）
         */
        @NotEmpty(message = "{validation.maintenanceRecord.workItems.required}")
        @Valid
        List<WorkItemRequest> workItems) implements WorkDatePeriod {
}
