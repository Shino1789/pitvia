package com.pitvia.api.maintenance.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.multipart.MultipartHttpServletRequest;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.maintenance.dto.request.CreateMaintenanceRecordRequest;
import com.pitvia.api.maintenance.dto.request.PartRequest;
import com.pitvia.api.maintenance.dto.request.WorkItemRequest;
import com.pitvia.api.maintenance.entity.MaintenancePart;
import com.pitvia.api.maintenance.entity.MaintenanceRecord;
import com.pitvia.api.maintenance.entity.MaintenanceWorkItem;
import com.pitvia.api.maintenance.entity.MaintenanceWorkItemImage;
import com.pitvia.api.maintenance.repository.MaintenanceRecordRepository;
import com.pitvia.api.master.repository.MaintenanceCategoryRepository;
import com.pitvia.api.master.repository.MaintenanceTypeRepository;
import com.pitvia.api.shop.entity.Shop;
import com.pitvia.api.shop.repository.ShopRepository;
import com.pitvia.api.storage.constant.ImageType;
import com.pitvia.api.storage.transaction.StorageTransactionManager;
import com.pitvia.api.user.entity.User;
import com.pitvia.api.user.repository.UserRepository;
import com.pitvia.api.vehicle.entity.Vehicle;
import com.pitvia.api.vehicle.enums.LinkStatus;
import com.pitvia.api.vehicle.repository.VehicleRepository;
import com.pitvia.api.vehicle.repository.VehicleShopLinkRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 整備履歴登録サービス
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class MaintenanceRecordService {

    /** 整備記録リポジトリ */
    private final MaintenanceRecordRepository maintenanceRecordRepository;

    /** 車両リポジトリ */
    private final VehicleRepository vehicleRepository;

    /** 車両・ショップ連携リポジトリ */
    private final VehicleShopLinkRepository vehicleShopLinkRepository;

    /** 整備種別マスタリポジトリ */
    private final MaintenanceTypeRepository maintenanceTypeRepository;

    /** 整備カテゴリマスタリポジトリ */
    private final MaintenanceCategoryRepository maintenanceCategoryRepository;

    /** ユーザーリポジトリ */
    private final UserRepository userRepository;

    /** ショップリポジトリ */
    private final ShopRepository shopRepository;

    /** ストレージ操作とDBトランザクションを連携するマネージャー */
    private final StorageTransactionManager storageTransactionManager;

    /**
     * 整備履歴を新規登録する
     *
     * @param request          整備履歴登録リクエスト
     * @param principal        認証済みユーザー情報
     * @param multipartRequest 作業項目ごとの画像パートを取得するためのmultipartリクエスト
     * @throws BusinessException 車両が存在しない、または登録権限が無い場合（404）、
     *                           整備種別・整備カテゴリが存在しない場合、
     *                           または画像バリデーションに違反する場合
     */
    @Transactional
    public void register(
            CreateMaintenanceRecordRequest request,
            JwtPrincipal principal,
            MultipartHttpServletRequest multipartRequest) {

        log.info("Maintenance record registration started. userId={}, vehicleId={}",
                principal.userId(), request.vehicleId());

        // 対象車両の存在確認と登録権限チェック
        Vehicle vehicle = resolveAccessibleVehicle(request.vehicleId(), principal);

        // 整備種別マスタの存在チェック
        com.pitvia.api.master.entity.MaintenanceType maintenanceType = maintenanceTypeRepository
                .findByCode(request.maintenanceType().getCode())
                .orElseThrow(() -> new BusinessException(ErrorCode.MAINTENANCE_TYPE_NOT_FOUND));

        // JWTで検証済みのuserIdを作成者として使用する
        User createdByUser = userRepository.getReferenceById(principal.userId());

        // SHOPが登録した場合のみ実施ショップを紐づける（OWNERの登録はDIY扱いでnull）
        Shop shop = principal.role() == UserRole.SHOP
                ? shopRepository.getReferenceById(principal.userId())
                : null;

        // 整備記録ヘッダーの組み立て（作業項目・部品はこの時点ではまだ持たない）
        MaintenanceRecord record = MaintenanceRecord.builder()
                .vehicle(vehicle)
                .createdByUser(createdByUser)
                .shop(shop)
                .title(request.title())
                .maintenanceType(maintenanceType)
                .workDateFrom(request.workDateFrom())
                .workDateTo(request.workDateTo())
                .mileage(request.mileage())
                .remarks(request.remarks())
                .isDraft(false)
                .build();

        // 作業項目・部品エンティティを構築し、ヘッダーへ紐づける
        attachWorkItems(record, request.workItems());

        // ヘッダー・作業項目・部品を一括永続化する（cascade=ALLにより子エンティティも同時INSERTされる）。
        // 作業項目の画像はストレージキーの採番に整備記録ID（UUID）を要するため、
        // 画像なしで先に保存してIDを確定させてからアップロードする
        MaintenanceRecord saved = maintenanceRecordRepository.save(record);

        // 確定した整備記録IDで、作業項目ごとの画像をアップロードする
        uploadWorkItemImages(saved, multipartRequest);

        log.info("Maintenance record registration completed. maintenanceRecordId={}, userId={}",
                saved.getId(), principal.userId());
    }

    /**
     * 対象車両を取得し、ログインユーザーに登録権限があるかを検証する
     *
     * @param vehicleId 対象車両ID
     * @param principal 認証済みユーザー情報
     * @return 検証済みの車両エンティティ
     * @throws BusinessException 車両が存在しない、または登録権限が無い場合（404）
     */
    private Vehicle resolveAccessibleVehicle(UUID vehicleId, JwtPrincipal principal) {

        // 対象車両を取得（存在しない場合はここで404）
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new BusinessException(ErrorCode.VEHICLE_NOT_FOUND, HttpStatus.NOT_FOUND));

        // 所有者本人か、SHOPがAPPROVED状態で連携している車両かを判定
        boolean isOwner = vehicle.getUser().getId().equals(principal.userId());
        boolean isLinkedShop = !isOwner && principal.role() == UserRole.SHOP
                && vehicleShopLinkRepository.existsByShop_IdAndVehicle_IdAndStatus(
                        principal.userId(), vehicleId, LinkStatus.APPROVED);

        if (!isOwner && !isLinkedShop) {
            // 存在しない場合と登録権限が無い場合を区別せず、存在有無を外部から推測できないようにする
            throw new BusinessException(ErrorCode.VEHICLE_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        return vehicle;
    }

    /**
     * リクエストの作業項目・部品リストからエンティティを構築し、整備記録ヘッダーに紐づける
     *
     * @param record       紐づけ先の整備記録ヘッダー
     * @param workItemReqs 作業項目リクエストリスト
     * @throws BusinessException 整備カテゴリが存在しない場合
     */
    private void attachWorkItems(MaintenanceRecord record, List<WorkItemRequest> workItemReqs) {

        for (int i = 0; i < workItemReqs.size(); i++) {
            WorkItemRequest workItemReq = workItemReqs.get(i);

            // 整備カテゴリマスタの存在チェック
            com.pitvia.api.master.entity.MaintenanceCategory maintenanceCategory = maintenanceCategoryRepository
                    .findByCode(workItemReq.maintenanceCategory().getCode())
                    .orElseThrow(() -> new BusinessException(ErrorCode.MAINTENANCE_CATEGORY_NOT_FOUND));

            // sortOrderはクライアントの入力値を信頼せず、リストのインデックスから採番する
            MaintenanceWorkItem workItem = MaintenanceWorkItem.builder()
                    .maintenanceRecord(record)
                    .maintenanceCategory(maintenanceCategory)
                    .workContent(workItemReq.workContent())
                    .performedBy(workItemReq.performedBy())
                    .laborCost(workItemReq.laborCost())
                    .sortOrder(i)
                    .build();

            attachParts(workItem, workItemReq.parts());

            // 子（MaintenanceWorkItem）から親への参照はEntity側にsetterが無いため、
            // 親の可変コレクション（@Builder.Defaultで初期化済み）へ直接追加する
            record.getWorkItems().add(workItem);
        }
    }

    /**
     * リクエストの部品リストからエンティティを構築し、作業項目に紐づける
     *
     * @param workItem 紐づけ先の作業項目
     * @param partReqs 部品リクエストリスト（空リスト許容）
     */
    private void attachParts(MaintenanceWorkItem workItem, List<PartRequest> partReqs) {

        for (int i = 0; i < partReqs.size(); i++) {
            PartRequest partReq = partReqs.get(i);

            // sortOrderは作業項目と同様、リストのインデックスから採番する
            MaintenancePart part = MaintenancePart.builder()
                    .maintenanceWorkItem(workItem)
                    .partCondition(partReq.partCondition())
                    .partName(partReq.partName())
                    .manufacturerName(partReq.manufacturerName())
                    .partModelNumber(partReq.partModelNumber())
                    .quantity(partReq.quantity())
                    .unitPrice(partReq.unitPrice())
                    .sortOrder(i)
                    .build();

            // 作業項目と同様、setterが無いため可変コレクションへ直接追加する
            workItem.getParts().add(part);
        }
    }

    /**
     * 作業項目ごとの整備画像をアップロードし、保存済みの作業項目へ紐づける
     *
     * @param saved            保存済みの整備記録ヘッダー（{@code workItems}は登録時と同じ並び順）
     * @param multipartRequest 作業項目ごとの画像パートを取得するためのmultipartリクエスト
     * @throws BusinessException 画像バリデーションに違反する場合
     */
    private void uploadWorkItemImages(MaintenanceRecord saved, MultipartHttpServletRequest multipartRequest) {

        List<MaintenanceWorkItem> workItems = saved.getWorkItems();

        for (int i = 0; i < workItems.size(); i++) {
            // 作業項目ごとの画像は「workItemImage_{index}」（indexはworkItems配列のインデックス）
            // という名前のパートで送信される想定。画像は任意のため、対応するパートが無ければスキップする
            MultipartFile file = multipartRequest.getFile("workItemImage_" + i);

            if (file == null || file.isEmpty()) {
                continue;
            }

            MaintenanceWorkItem workItem = workItems.get(i);

            // ストレージキーの採番はUUIDのresourceIdを要するため、Long型の作業項目IDではなく
            // 親となる整備記録ID（UUID）を全画像で共通使用する
            storageTransactionManager.uploadAndExecute(
                    file, ImageType.MAINTENANCE_IMAGE, saved.getId(),
                    (String key) -> {
                        // アップロード成功後、発行されたストレージキーを画像エンティティとして作業項目へ紐づける
                        workItem.getImages().add(
                                MaintenanceWorkItemImage.builder()
                                        .maintenanceWorkItem(workItem)
                                        .imageKey(key)
                                        .sortOrder(0)
                                        .build());
                    });
            // ここで例外が発生した場合はアップロード済みファイルが自動削除されて再送出され、
            // トランザクション全体がロールバックする。既に成功していた他ファイルはストレージに残るが、
            // DBには未参照となるため、孤児ファイルクリーンアップスケジューラが後日回収する
        }
    }

}
