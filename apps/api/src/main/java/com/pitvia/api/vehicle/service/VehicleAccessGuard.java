package com.pitvia.api.vehicle.service;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.vehicle.entity.Vehicle;
import com.pitvia.api.vehicle.enums.LinkStatus;
import com.pitvia.api.vehicle.repository.VehicleRepository;
import com.pitvia.api.vehicle.repository.VehicleShopLinkRepository;

import lombok.RequiredArgsConstructor;

/**
 * 「所有者本人」または「SHOPがAPPROVED状態で連携している」という、車両閲覧可否の共通判定を提供するクラス
 *
 * <p>
 * {@code VehicleDetailService}・{@code MaintenanceRecordService}（登録）・
 * {@code MaintenanceRecordListService}（車両単位の一覧取得）・{@code MaintenanceRecordDetailService}
 * の4箇所で全く同一の判定ロジックが必要になるため、本クラスへ共通化する。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
@Component
@RequiredArgsConstructor
public class VehicleAccessGuard {

    /** 車両リポジトリ */
    private final VehicleRepository vehicleRepository;

    /** 車両・ショップ連携リポジトリ */
    private final VehicleShopLinkRepository vehicleShopLinkRepository;

    /**
     * ログインユーザーから閲覧可能な車両を取得する
     *
     * <p>
     * 「所有者本人」または「SHOPが対象車両にAPPROVED状態で連携している」のいずれも
     * 満たさない場合は、車両自体が存在しない場合と区別せず404として扱う
     * （対象の存在有無を外部から推測できないようにする設計）。
     * </p>
     *
     * @param principal 認証済みユーザー情報
     * @param vehicleId 対象車両ID
     * @return 車両エンティティ
     * @throws BusinessException 車両が存在しない、または閲覧権限が無い場合（404、{@code VEHICLE_NOT_FOUND}）
     */
    public Vehicle resolveViewableVehicle(JwtPrincipal principal, UUID vehicleId) {

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new BusinessException(ErrorCode.VEHICLE_NOT_FOUND, HttpStatus.NOT_FOUND));

        if (!canView(vehicle, principal)) {
            throw new BusinessException(ErrorCode.VEHICLE_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        return vehicle;
    }

    /**
     * ログインユーザーが対象車両を閲覧できるかどうかを判定する
     *
     * <p>
     * 車両自体を主資源として扱わない呼び出し元（整備履歴詳細等、車両は付随情報にすぎない場合）で、
     * 独自のエラーコード・ステータスで404を返したい場合はこちらを使う
     * （{@link #resolveViewableVehicle}は常に{@code VEHICLE_NOT_FOUND}を送出するため使えない）。
     * </p>
     *
     * @param vehicle   判定対象の車両エンティティ
     * @param principal 認証済みユーザー情報
     * @return 閲覧可能であればtrue
     */
    public boolean canView(Vehicle vehicle, JwtPrincipal principal) {
        return isOwner(vehicle, principal) || isLinkedShop(principal, vehicle.getId());
    }

    /**
     * ログインユーザーが対象車両の所有者かどうかを判定する
     *
     * @param vehicle   対象車両
     * @param principal 認証済みユーザー情報
     * @return 所有者であればtrue
     */
    public boolean isOwner(Vehicle vehicle, JwtPrincipal principal) {
        return vehicle.getUser().getId().equals(principal.userId());
    }

    /**
     * ログインユーザーがSHOPとして対象車両にAPPROVED状態で連携しているかどうかを判定する
     *
     * @param principal 認証済みユーザー情報
     * @param vehicleId 対象車両ID
     * @return SHOPロールかつ承認済み連携が存在すればtrue
     */
    public boolean isLinkedShop(JwtPrincipal principal, UUID vehicleId) {
        return principal.role() == UserRole.SHOP
                && vehicleShopLinkRepository.existsByShop_IdAndVehicle_IdAndStatus(
                        principal.userId(), vehicleId, LinkStatus.APPROVED);
    }

}
