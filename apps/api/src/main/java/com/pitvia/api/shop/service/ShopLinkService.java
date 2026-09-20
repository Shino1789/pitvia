package com.pitvia.api.shop.service;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.shop.dto.request.ShopLinkRequest;
import com.pitvia.api.shop.dto.response.ShopLinkResponse;
import com.pitvia.api.shop.entity.Shop;
import com.pitvia.api.shop.entity.ShopInviteCode;
import com.pitvia.api.shop.repository.ShopInviteCodeRepository;
import com.pitvia.api.vehicle.entity.Vehicle;
import com.pitvia.api.vehicle.entity.VehicleShopLink;
import com.pitvia.api.vehicle.enums.LinkStatus;
import com.pitvia.api.vehicle.repository.VehicleShopLinkRepository;
import com.pitvia.api.vehicle.service.VehicleAccessGuard;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * OWNERによる、招待コード入力を用いたショップ連携サービス
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShopLinkService {

    /** 車両アクセスガード（所有権チェックに使用） */
    private final VehicleAccessGuard vehicleAccessGuard;

    /** ショップ招待コードリポジトリ */
    private final ShopInviteCodeRepository shopInviteCodeRepository;

    /** 車両・ショップ連携リポジトリ */
    private final VehicleShopLinkRepository vehicleShopLinkRepository;

    /**
     * 招待コードを用いて対象車両のショップ連携を実行する
     *
     * <p>
     * OWNERロール専用（{@code @PreAuthorize}によりController層で制御）。
     * </p>
     *
     * @param principal 認証済みユーザー情報
     * @param request   ショップ連携リクエスト（対象車両ID・招待コード）
     * @return 作成された連携の情報
     * @throws BusinessException 車両が存在しない・本人所有でない場合（404、{@code VEHICLE_NOT_FOUND}）、
     *                           招待コードが無効な場合（400、{@code INVALID_INVITE_CODE}）、
     *                           既に連携済みの場合（409、{@code SHOP_ALREADY_LINKED}）
     */
    @Transactional
    public ShopLinkResponse link(JwtPrincipal principal, ShopLinkRequest request) {

        // 対象車両の存在確認と所有権チェック
        Vehicle vehicle = vehicleAccessGuard.resolveViewableVehicle(principal, request.vehicleId());

        // 招待コードの検索と有効性検証
        ShopInviteCode inviteCode = shopInviteCodeRepository.findByCode(normalize(request.inviteCode()))
                .filter(ShopInviteCode::isActive)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_INVITE_CODE));

        // 招待コードに紐づく発行元ショップを取得
        Shop shop = inviteCode.getShop();

        // 既に対象車両がショップと連携済みかどうかを確認
        if (vehicleShopLinkRepository.existsByVehicle_IdAndShop_Id(vehicle.getId(), shop.getId())) {
            throw new BusinessException(ErrorCode.SHOP_ALREADY_LINKED, HttpStatus.CONFLICT);
        }

        // 承認フロー（PENDING）を経ないベータ版仕様のため、生成直後にapprove()で即時承認する。
        VehicleShopLink link = VehicleShopLink.builder()
                .vehicle(vehicle)
                .shop(shop)
                .status(LinkStatus.PENDING)
                .build();
        link.approve();

        vehicleShopLinkRepository.save(link);

        log.info("Vehicle linked to shop. vehicleId={}, shopId={}", vehicle.getId(), shop.getId());

        return ShopLinkResponse.from(link);
    }

    /**
     * 招待コードの前後空白を除去する
     *
     * @param value 正規化対象の文字列
     * @return 正規化後の文字列
     */
    private String normalize(String value) {
        return value == null ? null : value.trim();
    }

}
