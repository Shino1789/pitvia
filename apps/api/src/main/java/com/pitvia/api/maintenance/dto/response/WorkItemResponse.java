package com.pitvia.api.maintenance.dto.response;

import java.math.BigDecimal;
import java.util.List;

import com.pitvia.api.maintenance.entity.MaintenanceWorkItem;
import com.pitvia.api.maintenance.enums.MaintenanceCategory;
import com.pitvia.api.storage.resolver.StorageUrlResolver;

/**
 * 整備作業明細詳細情報レスポンスDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record WorkItemResponse(

        /**
         * 作業項目ID
         */
        Long id,

        /**
         * 整備カテゴリ
         */
        MaintenanceCategory maintenanceCategory,

        /**
         * 具体的な作業内容
         */
        String workContent,

        /**
         * 作業実施者
         */
        String performedBy,

        /**
         * 技術料 / 工賃
         */
        BigDecimal laborCost,

        /**
         * 整備画像の公開URL（未設定の場合はnull）
         */
        String imageUrl,

        /**
         * 紐づく交換部品リスト
         */
        List<PartResponse> parts) {

    /**
     * エンティティから生成する
     *
     * <p>
     * 画像のストレージキーは、この変換処理の中で公開URLへ解決する。{@code images}/{@code parts}
     * は遅延ロードのため、本メソッドは呼び出し元のトランザクション内で実行すること。
     * </p>
     *
     * @param workItem           整備作業明細エンティティ
     * @param storageUrlResolver 公開URL組み立てクラス
     * @return WorkItemResponse
     */
    public static WorkItemResponse from(MaintenanceWorkItem workItem, StorageUrlResolver storageUrlResolver) {

        // 現状「作業項目につき画像は最大1枚」の制約のため、先頭の1件のみを採用する
        String imageUrl = workItem.getImages().stream()
                .findFirst()
                .map(image -> storageUrlResolver.resolve(image.getImageKey()))
                .orElse(null);

        return new WorkItemResponse(
                workItem.getId(),
                MaintenanceCategory.fromCode(workItem.getMaintenanceCategory().getCode()),
                workItem.getWorkContent(),
                workItem.getPerformedBy(),
                workItem.getLaborCost(),
                imageUrl,
                workItem.getParts().stream().map(PartResponse::from).toList());
    }
}
