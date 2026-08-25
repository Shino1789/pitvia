package com.pitvia.api.maintenance.service;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.maintenance.dto.request.PartRequest;
import com.pitvia.api.maintenance.dto.request.UpdateMaintenanceRecordRequest;
import com.pitvia.api.maintenance.dto.request.WorkItemRequest;
import com.pitvia.api.maintenance.dto.response.MaintenanceRecordResponse;
import com.pitvia.api.maintenance.entity.MaintenancePart;
import com.pitvia.api.maintenance.entity.MaintenanceRecord;
import com.pitvia.api.maintenance.entity.MaintenanceWorkItem;
import com.pitvia.api.maintenance.entity.MaintenanceWorkItemImage;
import com.pitvia.api.maintenance.repository.MaintenanceRecordRepository;
import com.pitvia.api.master.repository.MaintenanceCategoryRepository;
import com.pitvia.api.master.repository.MaintenanceTypeRepository;
import com.pitvia.api.storage.constant.ImageType;
import com.pitvia.api.storage.resolver.StorageUrlResolver;
import com.pitvia.api.storage.transaction.StorageTransactionManager;
import com.pitvia.api.vehicle.service.VehicleAccessGuard;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 整備履歴詳細取得・更新・削除サービス
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MaintenanceRecordDetailService {

    /** 整備記録リポジトリ */
    private final MaintenanceRecordRepository maintenanceRecordRepository;

    /** 整備種別マスタリポジトリ */
    private final MaintenanceTypeRepository maintenanceTypeRepository;

    /** 整備カテゴリマスタリポジトリ */
    private final MaintenanceCategoryRepository maintenanceCategoryRepository;

    /** 車両閲覧可否の共通判定クラス */
    private final VehicleAccessGuard vehicleAccessGuard;

    /** ストレージURL解決クラス */
    private final StorageUrlResolver storageUrlResolver;

    /** ストレージ操作とDBトランザクションを連携するマネージャー */
    private final StorageTransactionManager storageTransactionManager;

    /**
     * 整備履歴詳細を取得する
     *
     * @param principal           認証済みユーザー情報
     * @param maintenanceRecordId 対象整備記録ID
     * @return 整備履歴詳細レスポンス（canEditは登録者本人かどうか）
     * @throws BusinessException 整備記録が存在しない、または閲覧できない場合（404）
     */
    @Transactional(readOnly = true)
    public MaintenanceRecordResponse getDetail(JwtPrincipal principal, UUID maintenanceRecordId) {

        MaintenanceRecord record = resolveViewableRecord(principal, maintenanceRecordId);
        boolean canEdit = isCreator(record, principal);

        return MaintenanceRecordResponse.from(record, storageUrlResolver, canEdit);
    }

    /**
     * 整備履歴を更新する
     *
     * <p>
     * 対象車両（{@code vehicleId}）は更新対象外（登録後は変更不可）。作業項目・部品は
     * リクエストの{@link WorkItemRequest#id()}/{@link PartRequest#id()}を基準に、
     * 既存分は更新、リクエストに含まれない既存分は削除、IDなしの要素は新規追加として反映する
     * （{@link #applyWorkItems}参照）。
     * </p>
     *
     * @param principal           認証済みユーザー情報
     * @param maintenanceRecordId 対象整備記録ID
     * @param request             整備履歴更新リクエスト情報
     * @param multipartRequest    作業項目ごとの画像パートを取得するためのmultipartリクエスト
     * @throws BusinessException 整備記録が存在しない・閲覧できない場合（404）、
     *                           閲覧はできるが登録者本人でない場合（403）、
     *                           整備種別・整備カテゴリが存在しない場合、
     *                           リクエストの作業項目/部品IDが対象の整備記録に存在しない場合、
     *                           または画像バリデーションに違反する場合
     */
    @Transactional
    public void update(
            JwtPrincipal principal,
            UUID maintenanceRecordId,
            UpdateMaintenanceRecordRequest request,
            MultipartHttpServletRequest multipartRequest) {

        MaintenanceRecord record = resolveViewableRecord(principal, maintenanceRecordId);
        requireCreator(record, principal);

        // 整備種別マスタの存在チェック
        com.pitvia.api.master.entity.MaintenanceType maintenanceType = maintenanceTypeRepository
                .findByCode(request.maintenanceType().getCode())
                .orElseThrow(() -> new BusinessException(ErrorCode.MAINTENANCE_TYPE_NOT_FOUND));

        record.update(request, maintenanceType);

        applyWorkItems(record, request.workItems(), multipartRequest);

        log.info("Maintenance record update completed. maintenanceRecordId={}, userId={}",
                maintenanceRecordId, principal.userId());
    }

    /**
     * 整備履歴を論理削除する
     *
     * <p>
     * 紐づく作業項目・部品・画像（{@code cascade=ALL, orphanRemoval=true}）は物理削除される
     * （{@code Vehicle}→{@code VehicleShopLink}と同じ既存の挙動を踏襲）。画像の実ファイルは
     * ここでは削除せず、参照が失われたストレージキーは孤児ファイルクリーンアップスケジューラが
     * 猶予期間経過後に自動的に回収する。
     * </p>
     *
     * @param principal           認証済みユーザー情報
     * @param maintenanceRecordId 対象整備記録ID
     * @throws BusinessException 整備記録が存在しない・閲覧できない場合（404）、
     *                           または閲覧はできるが登録者本人でない場合（403）
     */
    @Transactional
    public void delete(JwtPrincipal principal, UUID maintenanceRecordId) {

        MaintenanceRecord record = resolveViewableRecord(principal, maintenanceRecordId);
        requireCreator(record, principal);

        maintenanceRecordRepository.delete(record);

        log.info("Maintenance record delete completed. maintenanceRecordId={}, userId={}",
                maintenanceRecordId, principal.userId());
    }

    /**
     * ログインユーザーから閲覧可能な整備記録を取得する
     *
     * <p>
     * 「対象車両の所有者本人」または「SHOPが対象車両にAPPROVED状態で連携している」の
     * いずれも満たさない場合は、整備記録自体が存在しない場合と区別せず404として扱う
     * （存在有無を外部から推測できないようにする設計。車両単位の判定は
     * {@link VehicleAccessGuard}を再利用する）。
     * </p>
     *
     * @param principal           認証済みユーザー情報
     * @param maintenanceRecordId 対象整備記録ID
     * @return 整備記録エンティティ
     * @throws BusinessException 整備記録が存在しない、または閲覧権限が無い場合（404）
     */
    private MaintenanceRecord resolveViewableRecord(JwtPrincipal principal, UUID maintenanceRecordId) {

        MaintenanceRecord record = maintenanceRecordRepository.findDetailById(maintenanceRecordId)
                .orElseThrow(() -> new BusinessException(ErrorCode.MAINTENANCE_RECORD_NOT_FOUND, HttpStatus.NOT_FOUND));

        if (!vehicleAccessGuard.canView(record.getVehicle(), principal)) {
            // 整備記録自体が主資源のため、車両側のエラーコード（VEHICLE_NOT_FOUND）は使わず、
            // 整備記録専用のエラーコードで404を返す
            throw new BusinessException(ErrorCode.MAINTENANCE_RECORD_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        return record;
    }

    /**
     * ログインユーザーがこの整備履歴を編集できることを要求する
     *
     * @param record    対象整備記録（閲覧可能であることは呼び出し元で確認済み）
     * @param principal 認証済みユーザー情報
     * @throws BusinessException 登録者本人でない場合（403）
     */
    private void requireCreator(MaintenanceRecord record, JwtPrincipal principal) {
        if (!isCreator(record, principal)) {
            throw new BusinessException(ErrorCode.MAINTENANCE_RECORD_EDIT_NOT_ALLOWED, HttpStatus.FORBIDDEN);
        }
    }

    /**
     * ログインユーザーがこの整備履歴の登録者本人かどうかを判定する
     *
     * <p>
     * 車両所有者かどうかではなく、{@code createdByUser}が一致するかどうかで判定する
     * （車両所有者と整備履歴登録者は別概念であるため。例：SHOPが登録した履歴を車両所有者である
     * OWNERが閲覧しても、OWNERはこの履歴を編集できない）。
     * </p>
     *
     * @param record    対象整備記録
     * @param principal 認証済みユーザー情報
     * @return 登録者本人であればtrue
     */
    private boolean isCreator(MaintenanceRecord record, JwtPrincipal principal) {
        return record.getCreatedByUser().getId().equals(principal.userId());
    }

    /**
     * リクエストの作業項目リストと、既存の作業項目リストを突き合わせて反映する
     *
     * <p>
     * {@link WorkItemRequest#id()}が指定されている要素は既存作業項目の更新、
     * 指定されていない（null）要素は新規追加として扱う。既存作業項目のうち、
     * リクエストに含まれなかったものは削除対象とする（{@code orphanRemoval}により実削除される。
     * 子である部品・画像も、その作業項目自身のcascade設定により連鎖的に削除される）。
     * </p>
     *
     * @param record            更新対象の整備記録ヘッダー
     * @param workItemReqs      作業項目リクエストリスト
     * @param multipartRequest  作業項目ごとの画像パートを取得するためのmultipartリクエスト
     * @throws BusinessException 整備カテゴリが存在しない場合、
     *                           またはリクエストの作業項目IDが対象の整備記録に存在しない場合
     */
    private void applyWorkItems(
            MaintenanceRecord record, List<WorkItemRequest> workItemReqs, MultipartHttpServletRequest multipartRequest) {

        // 既存の作業項目をIDでインデックス化（このメソッド呼び出し時点ではまだ元のリストのまま）
        Map<Long, MaintenanceWorkItem> existingById = record.getWorkItems().stream()
                .collect(Collectors.toMap(MaintenanceWorkItem::getId, Function.identity()));

        // 整備カテゴリマスタを作業項目件数分のN+1クエリにせず、まとめて1回で解決する（register()と同じ方針）
        Set<String> categoryCodes = workItemReqs.stream()
                .map(req -> req.maintenanceCategory().getCode())
                .collect(Collectors.toSet());
        Map<String, com.pitvia.api.master.entity.MaintenanceCategory> categoryByCode = maintenanceCategoryRepository
                .findAllByCodeIn(categoryCodes)
                .stream()
                .collect(Collectors.toMap(
                        com.pitvia.api.master.entity.MaintenanceCategory::getCode, Function.identity()));

        List<MaintenanceWorkItem> newWorkItems = new ArrayList<>();

        for (int i = 0; i < workItemReqs.size(); i++) {
            WorkItemRequest req = workItemReqs.get(i);

            // 整備カテゴリマスタの存在チェック
            com.pitvia.api.master.entity.MaintenanceCategory maintenanceCategory = categoryByCode
                    .get(req.maintenanceCategory().getCode());
            if (maintenanceCategory == null) {
                throw new BusinessException(ErrorCode.MAINTENANCE_CATEGORY_NOT_FOUND);
            }

            MaintenanceWorkItem workItem;
            if (req.id() != null) {
                // 既存作業項目の更新。この整備記録に属さないIDが指定された場合は不正なリクエストとして扱う
                workItem = existingById.get(req.id());
                if (workItem == null) {
                    throw new BusinessException(ErrorCode.MAINTENANCE_WORK_ITEM_NOT_FOUND);
                }
                // sortOrderはクライアントの入力値を信頼せず、リストのインデックスから採番する
                workItem.update(req, maintenanceCategory, i);
            } else {
                // 新規追加
                workItem = MaintenanceWorkItem.builder()
                        .maintenanceRecord(record)
                        .maintenanceCategory(maintenanceCategory)
                        .workContent(req.workContent())
                        .performedBy(req.performedBy())
                        .laborCost(req.laborCost())
                        .sortOrder(i)
                        .build();
            }

            applyParts(workItem, req.parts());
            applyWorkItemImage(record.getId(), workItem, i, req.removeImage(), multipartRequest);

            newWorkItems.add(workItem);
        }

        // 差分反映：clear()→addAll()により、newWorkItemsに含まれない既存行はorphanRemovalでDELETE、
        // 既存インスタンスを再利用した行はUPDATE、新規ビルドした行はINSERTとしてHibernateが解決する
        // （中間でclear()を挟んでも、フラッシュ時に評価されるのは最終的なコレクションの状態のため安全）
        record.getWorkItems().clear();
        record.getWorkItems().addAll(newWorkItems);
    }

    /**
     * リクエストの部品リストと、対象作業項目が持つ既存の部品リストを突き合わせて反映する
     *
     * @param workItem 紐づけ先の作業項目（新規作業項目の場合は既存部品を持たない）
     * @param partReqs 部品リクエストリスト（空リスト許容）
     * @throws BusinessException リクエストの部品IDが対象の作業項目に存在しない場合
     */
    private void applyParts(MaintenanceWorkItem workItem, List<PartRequest> partReqs) {

        Map<Long, MaintenancePart> existingById = workItem.getParts().stream()
                .collect(Collectors.toMap(MaintenancePart::getId, Function.identity()));

        List<MaintenancePart> newParts = new ArrayList<>();

        for (int i = 0; i < partReqs.size(); i++) {
            PartRequest req = partReqs.get(i);

            MaintenancePart part;
            if (req.id() != null) {
                // 既存部品の更新。対象の作業項目に属さないIDが指定された場合は不正なリクエストとして扱う
                part = existingById.get(req.id());
                if (part == null) {
                    throw new BusinessException(ErrorCode.MAINTENANCE_PART_NOT_FOUND);
                }
                part.update(req, i);
            } else {
                // 新規追加
                part = MaintenancePart.builder()
                        .maintenanceWorkItem(workItem)
                        .partCondition(req.partCondition())
                        .partName(req.partName())
                        .manufacturerName(req.manufacturerName())
                        .partModelNumber(req.partModelNumber())
                        .quantity(req.quantity())
                        .unitPrice(req.unitPrice())
                        .sortOrder(i)
                        .build();
            }

            newParts.add(part);
        }

        // 差分反映（applyWorkItemsと同じ考え方）
        workItem.getParts().clear();
        workItem.getParts().addAll(newParts);
    }

    /**
     * 作業項目1件分の整備画像の追加・差し替え・削除を反映する
     *
     * @param maintenanceRecordId 親となる整備記録ID（ストレージキーのresourceIdとして使用。register()と同じ方針）
     * @param workItem            対象の作業項目
     * @param index               リクエスト内でのworkItemsインデックス（画像パート名の解決に使用）
     * @param removeImage         既存画像を削除するかどうか（新しいファイルが指定された場合は無視される）
     * @param multipartRequest    作業項目ごとの画像パートを取得するためのmultipartリクエスト
     * @throws BusinessException 画像バリデーションに違反する場合
     */
    private void applyWorkItemImage(
            UUID maintenanceRecordId,
            MaintenanceWorkItem workItem,
            int index,
            boolean removeImage,
            MultipartHttpServletRequest multipartRequest) {

        // 作業項目ごとの画像は「workItemImage_{index}」（indexはworkItems配列のインデックス）
        // という名前のパートで送信される想定（register()と同じ命名規則）
        MultipartFile file = multipartRequest.getFile("workItemImage_" + index);

        if (file != null && !file.isEmpty()) {
            // 新しい画像が指定された場合は、removeImageの値に関わらず差し替えを優先する
            // （VehicleDetailService.updateと同じ設計。既存画像が無い新規作業項目の場合、
            // oldImageKeyはnullのままreplaceAndExecuteへ渡されるが、削除処理側で安全に無視される）
            String oldImageKey = workItem.getImages().stream()
                    .findFirst()
                    .map(MaintenanceWorkItemImage::getImageKey)
                    .orElse(null);

            storageTransactionManager.replaceAndExecute(
                    file, ImageType.MAINTENANCE_IMAGE, maintenanceRecordId, oldImageKey,
                    (String newKey) -> {
                        workItem.getImages().clear();
                        workItem.getImages().add(
                                MaintenanceWorkItemImage.builder()
                                        .maintenanceWorkItem(workItem)
                                        .imageKey(newKey)
                                        .sortOrder(0)
                                        .build());
                        return newKey;
                    });
            return;
        }

        if (removeImage) {
            // ストレージ上のファイルはここでは削除せず、参照を外すのみに留める
            // （VehicleDetailService.updateと同様、実削除は孤児ファイルクリーンアップスケジューラに委譲）
            workItem.getImages().clear();
        }

        // どちらも指定されていない場合は既存画像に一切触れない
    }

}
