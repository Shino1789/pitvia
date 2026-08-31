package com.pitvia.api.vehicle.service;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.storage.resolver.StorageUrlResolver;
import com.pitvia.api.vehicle.dto.response.VehicleListResponse;
import com.pitvia.api.vehicle.dto.response.VehicleOwnerSummary;
import com.pitvia.api.vehicle.dto.response.VehicleResponse;
import com.pitvia.api.vehicle.entity.Vehicle;
import com.pitvia.api.vehicle.repository.VehicleRepository;
import com.pitvia.api.vehicle.repository.VehicleShopLinkRepository;

import lombok.RequiredArgsConstructor;

/**
 * 車両一覧取得サービス
 *
 * <p>
 * {@code ownerId}未指定時はログインユーザー自身の車両一覧を、指定時はSHOPから見た
 * 特定顧客（オーナー）の共有車両一覧を返す。後者はOWNERロールでは利用できない。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class VehicleListService {

    /** 車両リポジトリ */
    private final VehicleRepository vehicleRepository;

    /** 車両・ショップ連携リポジトリ */
    private final VehicleShopLinkRepository vehicleShopLinkRepository;

    /** ストレージURL解決クラス */
    private final StorageUrlResolver storageUrlResolver;

    /**
     * 車両一覧を取得する
     *
     * @param principal 認証済みユーザー情報
     * @param ownerId   対象オーナーのユーザーID（省略時はログインユーザー自身の一覧を取得）
     * @return 車両一覧レスポンス
     * @throws BusinessException OWNERが{@code ownerId}を指定した場合（400）、
     *                            またはSHOPが指定した{@code ownerId}が存在しない・
     *                            共有関係が無い場合（404）
     */
    public VehicleListResponse getVehicleList(JwtPrincipal principal, UUID ownerId) {

        if (ownerId == null) {
            // ownerId未指定：ログインユーザー自身の車両一覧（OWNER/SHOPとも同一条件）
            List<Vehicle> vehicles = vehicleRepository.findAllByUser_IdOrderByCreatedAtDesc(principal.userId());
            return new VehicleListResponse(null, toResponseList(vehicles));
        }

        // ownerIdはSHOPが顧客の共有車両を見るための専用パラメータ
        if (principal.role() != UserRole.SHOP) {
            throw new BusinessException(ErrorCode.OWNER_ID_NOT_ALLOWED);
        }

        // ショップと対象オーナーの間でAPPROVED状態の共有が無ければ、車両一覧は空になる。
        // 「オーナーが存在しない」場合も同じく空になるため、結果的に同一のエラーへ集約される。
        List<Vehicle> vehicles = vehicleShopLinkRepository.findApprovedVehiclesByShopAndOwner(
                principal.userId(), ownerId);

        if (vehicles.isEmpty()) {
            throw new BusinessException(ErrorCode.VEHICLE_OWNER_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        // 追加のユーザー検索を行わず、取得済みの車両からオーナー情報を取得する
        VehicleOwnerSummary owner = VehicleOwnerSummary.from(vehicles.get(0).getUser());

        return new VehicleListResponse(owner, toResponseList(vehicles));
    }

    /**
     * 車両エンティティ一覧をレスポンスDTO一覧へ変換する
     *
     * @param vehicles 車両エンティティ一覧
     * @return 車両レスポンスDTO一覧
     */
    private List<VehicleResponse> toResponseList(List<Vehicle> vehicles) {
        return vehicles.stream()
                .map(vehicle -> VehicleResponse.from(vehicle, storageUrlResolver))
                .toList();
    }

}
