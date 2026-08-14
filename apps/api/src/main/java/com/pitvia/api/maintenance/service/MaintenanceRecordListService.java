package com.pitvia.api.maintenance.service;

import java.util.List;
import java.util.Set;
import java.util.UUID;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.common.dto.response.PageResponse;
import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.maintenance.constant.MaintenanceRecordSort;
import com.pitvia.api.maintenance.dto.param.MaintenanceRecordListParam;
import com.pitvia.api.maintenance.dto.response.MaintenanceRecordListResponse;
import com.pitvia.api.maintenance.dto.response.MaintenanceRecordSummary;
import com.pitvia.api.maintenance.repository.MaintenanceRecordRepository;
import com.pitvia.api.maintenance.repository.projection.MaintenanceRecordListProjection;
import com.pitvia.api.vehicle.dto.response.VehicleOwnerSummary;
import com.pitvia.api.vehicle.entity.Vehicle;
import com.pitvia.api.vehicle.enums.LinkStatus;
import com.pitvia.api.vehicle.repository.VehicleRepository;
import com.pitvia.api.vehicle.repository.VehicleShopLinkRepository;

import lombok.RequiredArgsConstructor;

/**
 * 整備履歴一覧取得サービス
 *
 * @author pitvia
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class MaintenanceRecordListService {

    /** 整備記録リポジトリ */
    private final MaintenanceRecordRepository maintenanceRecordRepository;

    /** 車両リポジトリ */
    private final VehicleRepository vehicleRepository;

    /** 車両・ショップ連携リポジトリ */
    private final VehicleShopLinkRepository vehicleShopLinkRepository;

    /**
     * 整備履歴一覧を取得する
     *
     * @param principal 認証済みユーザー情報
     * @param param     リクエストパラメータ
     * @return 整備履歴一覧レスポンス
     * @throws BusinessException vehicleIdとownerIdが同時に指定された場合（400）、
     *                           OWNERがownerIdを指定した場合（400）、
     *                           車両が存在しない・閲覧できない場合（404）、
     *                           またはownerIdのユーザーが存在しない・共有関係が無い場合（404）
     */
    public MaintenanceRecordListResponse getList(JwtPrincipal principal, MaintenanceRecordListParam param) {

        UUID vehicleId = param.vehicleId();
        UUID ownerId = param.ownerId();

        // vehicleIdが指定されていれば対象車両の所有者は一意に決まるため、ownerIdとの同時指定は不正とする
        if (vehicleId != null && ownerId != null) {
            throw new BusinessException(ErrorCode.VEHICLE_ID_OWNER_ID_CONFLICT);
        }

        // 空文字列・空集合をnullへ正規化（JPQLの:param IS NULL判定に合わせるため）
        Set<String> normalizedTypeCodes = normalize(param.maintenanceType());
        String normalizedKeyword = normalize(param.keyword());

        // API上のページ番号は1始まりのため、Spring Data基準（0始まり）へ変換
        Pageable pageable = PageRequest.of(param.getPage() - 1, param.getSize(), resolveSort(param.getSort()));

        // vehicleId指定時：その車両の整備履歴に限定
        if (vehicleId != null) {
            return getByVehicle(principal, vehicleId, normalizedTypeCodes, normalizedKeyword, pageable);
        }

        // ownerId指定時：SHOPから見た特定顧客（オーナー）の共有車両群の整備履歴
        if (ownerId != null) {
            return getByOwner(principal, ownerId, normalizedTypeCodes, normalizedKeyword, pageable);
        }

        // いずれも未指定：ログインユーザー自身の全車両分の整備履歴
        return getSelf(principal, normalizedTypeCodes, normalizedKeyword, pageable);
    }

    /**
     * ログインユーザー自身の全車両分の整備履歴を取得する
     *
     * @param principal 認証済みユーザー情報
     * @param types     整備種別コードによる絞り込み（任意）
     * @param keyword   整備タイトルの部分一致キーワード（任意）
     * @param pageable  ページング・並び替え情報
     * @return 整備履歴一覧レスポンス
     */
    private MaintenanceRecordListResponse getSelf(
            JwtPrincipal principal, Set<String> types, String keyword, Pageable pageable) {

        Page<MaintenanceRecordListProjection> result = maintenanceRecordRepository
                .findSelfMaintenanceRecords(principal.userId(), null, types, keyword, pageable);

        return new MaintenanceRecordListResponse(null, toPageResponse(result));
    }

    /**
     * 特定車両（自分の車両、またはSHOPが連携している車両）の整備履歴を取得する
     *
     * @param principal 認証済みユーザー情報
     * @param vehicleId 対象車両ID
     * @param types     整備種別コードによる絞り込み（任意）
     * @param keyword   整備タイトルの部分一致キーワード（任意）
     * @param pageable  ページング・並び替え情報
     * @return 整備履歴一覧レスポンス
     * @throws BusinessException 車両が存在しない、または閲覧権限が無い場合（404）
     */
    private MaintenanceRecordListResponse getByVehicle(
            JwtPrincipal principal, UUID vehicleId, Set<String> types, String keyword, Pageable pageable) {

        // 対象車両を取得（存在しない場合はここで404）
        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new BusinessException(ErrorCode.VEHICLE_NOT_FOUND, HttpStatus.NOT_FOUND));

        // 所有者本人か、SHOPがAPPROVED状態で連携している車両かを判定
        boolean isOwner = vehicle.getUser().getId().equals(principal.userId());
        boolean isLinkedShop = !isOwner && principal.role() == UserRole.SHOP
                && vehicleShopLinkRepository.existsByShop_IdAndVehicle_IdAndStatus(
                        principal.userId(), vehicleId, LinkStatus.APPROVED);

        if (!isOwner && !isLinkedShop) {
            // 存在しない場合と閲覧権限が無い場合を区別せず、存在有無を外部から推測できないようにする
            throw new BusinessException(ErrorCode.VEHICLE_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        // 車両所有者のIDを基準に検索する（SHOPが閲覧する場合も、対象車両の所有者の履歴を取得する）
        Page<MaintenanceRecordListProjection> result = maintenanceRecordRepository
                .findSelfMaintenanceRecords(vehicle.getUser().getId(), vehicleId, types, keyword, pageable);

        // SHOPが閲覧する場合は、対象車両の所有者情報をレスポンスに含める
        VehicleOwnerSummary owner = isOwner ? null : VehicleOwnerSummary.from(vehicle.getUser());

        return new MaintenanceRecordListResponse(owner, toPageResponse(result));
    }

    /**
     * SHOPが、指定オーナー（顧客）と共有している車両群の整備履歴を取得する
     *
     * @param principal 認証済みユーザー情報
     * @param ownerId   対象オーナーのユーザーID
     * @param types     整備種別コードによる絞り込み（任意）
     * @param keyword   整備タイトルの部分一致キーワード（任意）
     * @param pageable  ページング・並び替え情報
     * @return 整備履歴一覧レスポンス
     * @throws BusinessException OWNERロールが呼び出した場合（400）、または共有車両が1台も無い場合（404）
     */
    private MaintenanceRecordListResponse getByOwner(
            JwtPrincipal principal, UUID ownerId, Set<String> types, String keyword, Pageable pageable) {

        // ownerIdはSHOP専用パラメータ
        if (principal.role() != UserRole.SHOP) {
            throw new BusinessException(ErrorCode.OWNER_ID_NOT_ALLOWED);
        }

        // SHOPと指定オーナーの間で共有されている車両群を取得
        List<Vehicle> sharedVehicles = vehicleShopLinkRepository.findApprovedVehiclesByShopAndOwner(
                principal.userId(), ownerId);

        if (sharedVehicles.isEmpty()) {
            throw new BusinessException(ErrorCode.VEHICLE_OWNER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        // 共有車両群の整備履歴を取得
        Page<MaintenanceRecordListProjection> result = maintenanceRecordRepository
                .findOwnerMaintenanceRecords(principal.userId(), ownerId, types, keyword, pageable);

        // 追加のユーザー検索を行わず、取得済みの共有車両からオーナー情報を取得する
        VehicleOwnerSummary owner = VehicleOwnerSummary.from(sharedVehicles.get(0).getUser());

        return new MaintenanceRecordListResponse(owner, toPageResponse(result));
    }

    /**
     * 整備履歴一覧プロジェクションのPageを、レスポンス用のPageResponseへ変換する
     *
     * @param page 変換元のPage
     * @return 変換後のPageResponse
     */
    private PageResponse<MaintenanceRecordSummary> toPageResponse(Page<MaintenanceRecordListProjection> page) {
        return PageResponse.from(page.map(MaintenanceRecordSummary::from));
    }

    /**
     * 並び替え条件をSpring DataのSortへ変換する
     *
     * @param sort 並び替え条件
     * @return 変換後のSort
     */
    private Sort resolveSort(MaintenanceRecordSort sort) {
        return switch (sort) {
            case WORK_DATE_ASC -> Sort.by(Sort.Direction.ASC, "workDateFrom");
            case WORK_DATE_DESC -> Sort.by(Sort.Direction.DESC, "workDateFrom");
        };
    }

    /**
     * 空文字列をnullへ正規化する（JPQLの{@code :param IS NULL}判定に合わせるため）
     *
     * @param value 正規化対象の文字列
     * @return 正規化後の文字列（空文字列・空白のみの場合はnull）
     */
    private String normalize(String value) {
        return (value == null || value.isBlank()) ? null : value.trim();
    }

    /**
     * 空集合をnullへ正規化する
     *
     * @param values 正規化対象の集合
     * @return 正規化後の集合（空集合の場合はnull）
     * @see #normalize(String)
     */
    private Set<String> normalize(Set<String> values) {
        return (values == null || values.isEmpty()) ? null : values;
    }

}
