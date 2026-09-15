package com.pitvia.api.customer.service;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.common.constant.PageConstants;
import com.pitvia.api.common.dto.response.PageResponse;
import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.customer.dto.param.CustomerListParam;
import com.pitvia.api.customer.dto.response.CustomerSummary;
import com.pitvia.api.customer.dto.response.CustomerVehicleSummary;
import com.pitvia.api.storage.resolver.StorageUrlResolver;
import com.pitvia.api.vehicle.entity.Vehicle;
import com.pitvia.api.vehicle.repository.VehicleShopLinkRepository;
import com.pitvia.api.vehicle.repository.projection.CustomerSummaryProjection;

import lombok.RequiredArgsConstructor;

/**
 * 顧客一覧取得サービス
 *
 * @author pitvia
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CustomerListService {

    /** 車両・ショップ連携リポジトリ */
    private final VehicleShopLinkRepository vehicleShopLinkRepository;

    /** ストレージURL解決クラス */
    private final StorageUrlResolver storageUrlResolver;

    /**
     * 顧客一覧を取得する
     *
     * @param principal 認証済みユーザー情報
     * @param param     リクエストパラメータ
     * @return 顧客一覧レスポンス（ページング付き）
     * @throws BusinessException OWNERロールが呼び出した場合（403、{@code FORBIDDEN}）
     */
    public PageResponse<CustomerSummary> getList(JwtPrincipal principal, CustomerListParam param) {

        if (principal.role() != UserRole.SHOP) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }

        String keyword = normalize(param.keyword());

        // API上のページ番号は1始まりのため、Spring Data基準（0始まり）へ変換。
        // 並び替えはクエリ側のORDER BYで固定するため、Pageableにはソートを含めない
        Pageable pageable = PageRequest.of(param.getPage() - 1, param.getSize());

        // 該当ショップに紐づく顧客情報を取得
        Page<CustomerSummaryProjection> page = vehicleShopLinkRepository
                .findCustomerSummaries(principal.userId(), keyword, pageable);

        // 取得した顧客情報のIDリストを作成
        List<UUID> ownerIds = page.getContent().stream()
                .map(CustomerSummaryProjection::getOwnerId)
                .toList();

        // N+1問題対策：該当する全顧客の承認済み連携車両を1回のクエリで取得し、オーナーIDごとにグループ化
        Map<UUID, List<Vehicle>> vehiclesByOwner = ownerIds.isEmpty()
                ? Map.of()
                : vehicleShopLinkRepository.findApprovedVehiclesByShopAndOwnerIn(principal.userId(), ownerIds)
                        .stream()
                        .collect(Collectors.groupingBy(
                                v -> v.getUser().getId(),
                                LinkedHashMap::new,
                                Collectors.toList()));

        return PageResponse.from(page.map(
                projection -> toCustomerSummary(
                        projection,
                        vehiclesByOwner.getOrDefault(projection.getOwnerId(), List.of()))));
    }

    /**
     * プロジェクションと連携車両一覧から、顧客一覧の1件分のレスポンスを組み立てる
     *
     * @param projection     顧客サマリーのプロジェクション
     * @param linkedVehicles 対象オーナーの連携車両一覧（全件、表示件数の上限は本メソッド内で適用）
     * @return CustomerSummary
     */
    private CustomerSummary toCustomerSummary(CustomerSummaryProjection projection, List<Vehicle> linkedVehicles) {

        // 顧客ユーザーにアイコンが設定されている場合は、アイコンURLを組み立てる
        String ownerIconUrl = projection.getOwnerIconKey() != null
                ? storageUrlResolver.resolve(projection.getOwnerIconKey())
                : null;

        // 連携車両のうち、最大3件をCustomerVehicleSummaryに変換してリスト化する
        List<CustomerVehicleSummary> vehicles = linkedVehicles.stream()
                .limit(PageConstants.CUSTOMER_LINKED_VEHICLE_DISPLAY_SIZE)
                .map(vehicle -> new CustomerVehicleSummary(
                        vehicle.getId(),
                        vehicle.getModelName(),
                        vehicle.getImageKey() != null ? storageUrlResolver.resolve(vehicle.getImageKey()) : null))
                .toList();

        return new CustomerSummary(
                projection.getOwnerId(),
                projection.getOwnerName(),
                ownerIconUrl,
                projection.getLastMaintenanceDate(),
                vehicles,
                linkedVehicles.size());
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

}
