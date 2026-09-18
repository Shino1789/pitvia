package com.pitvia.api.shop.service;

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
import com.pitvia.api.shop.dto.param.ShopListParam;
import com.pitvia.api.shop.dto.response.ShopLinkedVehicleSummary;
import com.pitvia.api.shop.dto.response.ShopSummary;
import com.pitvia.api.storage.resolver.StorageUrlResolver;
import com.pitvia.api.vehicle.repository.VehicleShopLinkRepository;
import com.pitvia.api.vehicle.repository.projection.LinkedVehicleSummaryProjection;
import com.pitvia.api.vehicle.repository.projection.ShopSummaryProjection;

import lombok.RequiredArgsConstructor;

/**
 * OWNER向け、連携済みショップ一覧取得サービス
 *
 * @author pitvia
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ShopListService {

    /** 車両・ショップ連携リポジトリ */
    private final VehicleShopLinkRepository vehicleShopLinkRepository;

    /** ストレージURL解決クラス */
    private final StorageUrlResolver storageUrlResolver;

    /**
     * 連携済みショップ一覧を取得する
     *
     * @param principal 認証済みユーザー情報
     * @param param     リクエストパラメータ
     * @return ショップ一覧レスポンス（ページング付き）
     * @throws BusinessException OWNER以外のロールが呼び出した場合（403、{@code FORBIDDEN}）
     */
    public PageResponse<ShopSummary> getList(JwtPrincipal principal, ShopListParam param) {

        requireOwner(principal);

        String keyword = normalize(param.keyword());

        // API上のページ番号は1始まりのため、Spring Data基準（0始まり）へ変換。
        // 並び替えはクエリ側のORDER BYで固定するため、Pageableにはソートを含めない
        Pageable pageable = PageRequest.of(param.getPage() - 1, param.getSize());

        // ログインOWNERとAPPROVED状態で連携しているショップ情報を取得
        Page<ShopSummaryProjection> page = vehicleShopLinkRepository
                .findLinkedShopSummaries(principal.userId(), keyword, pageable);

        // 取得したショップ情報のIDリストを作成
        List<UUID> shopIds = page.getContent().stream()
                .map(ShopSummaryProjection::getShopId)
                .toList();

        // N+1問題対策：該当する全ショップの連携車両を1回のクエリで取得し、ショップIDごとにグループ化
        Map<UUID, List<LinkedVehicleSummaryProjection>> vehiclesByShop = shopIds.isEmpty()
                ? Map.of()
                : vehicleShopLinkRepository.findLinkedVehicleSummariesByOwnerAndShopIn(principal.userId(), shopIds)
                        .stream()
                        .collect(Collectors.groupingBy(
                                LinkedVehicleSummaryProjection::getShopId,
                                LinkedHashMap::new,
                                Collectors.toList()));

        return PageResponse.from(page.map(
                projection -> toShopSummary(
                        projection,
                        vehiclesByShop.getOrDefault(projection.getShopId(), List.of()))));
    }

    /**
     * プロジェクションと連携車両一覧から、ショップ一覧の1件分のレスポンスを組み立てる
     *
     * @param projection     ショップサマリーのプロジェクション
     * @param linkedVehicles 対象ショップの連携車両一覧（全件、表示件数の上限は本メソッド内で適用）
     * @return ShopSummary
     */
    private ShopSummary toShopSummary(
            ShopSummaryProjection projection,
            List<LinkedVehicleSummaryProjection> linkedVehicles) {

        // ショップにアイコンが設定されている場合は、アイコンURLを組み立てる
        String shopIconUrl = projection.getShopIconKey() != null
                ? storageUrlResolver.resolve(projection.getShopIconKey())
                : null;

        // 連携車両のうち、最大3件をShopLinkedVehicleSummaryに変換してリスト化する
        List<ShopLinkedVehicleSummary> vehicles = linkedVehicles.stream()
                .limit(PageConstants.SHOP_LINKED_VEHICLE_DISPLAY_SIZE)
                .map(vehicle -> new ShopLinkedVehicleSummary(
                        vehicle.getVehicleId(),
                        vehicle.getVehicleModelName(),
                        vehicle.getVehicleImageKey() != null
                                ? storageUrlResolver.resolve(vehicle.getVehicleImageKey())
                                : null))
                .toList();

        return new ShopSummary(
                projection.getShopId(),
                projection.getShopName(),
                shopIconUrl,
                projection.getAddress(),
                projection.getPhoneNumber(),
                vehicles,
                linkedVehicles.size());
    }

    /**
     * OWNERロールであることを検証する
     *
     * @param principal 認証済みユーザー情報
     * @throws BusinessException OWNER以外のロールの場合（403、{@code FORBIDDEN}）
     */
    private void requireOwner(JwtPrincipal principal) {
        if (principal.role() != UserRole.OWNER) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }
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
