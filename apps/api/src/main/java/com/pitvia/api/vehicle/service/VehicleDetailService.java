package com.pitvia.api.vehicle.service;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.master.entity.Manufacturer;
import com.pitvia.api.master.repository.ManufacturerRepository;
import com.pitvia.api.storage.constant.ImageType;
import com.pitvia.api.storage.resolver.StorageUrlResolver;
import com.pitvia.api.storage.transaction.StorageTransactionManager;
import com.pitvia.api.vehicle.dto.request.CreateVehicleRequest;
import com.pitvia.api.vehicle.dto.response.VehicleResponse;
import com.pitvia.api.vehicle.entity.Vehicle;
import com.pitvia.api.vehicle.enums.LinkStatus;
import com.pitvia.api.vehicle.repository.VehicleRepository;
import com.pitvia.api.vehicle.repository.VehicleShopLinkRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 車両詳細取得・更新・削除サービス
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleDetailService {

    /** 車両リポジトリ */
    private final VehicleRepository vehicleRepository;

    /** 車両・ショップ連携リポジトリ */
    private final VehicleShopLinkRepository vehicleShopLinkRepository;

    /** メーカーリポジトリ */
    private final ManufacturerRepository manufacturerRepository;

    /** ストレージURL解決クラス */
    private final StorageUrlResolver storageUrlResolver;

    /** ストレージ操作とDBトランザクションを連携するマネージャー */
    private final StorageTransactionManager storageTransactionManager;

    /**
     * 車両詳細を取得する
     *
     * @param principal 認証済みユーザー情報
     * @param vehicleId 対象車両ID
     * @return 車両詳細レスポンス（canEditはログインユーザーが所有者かどうか）
     * @throws BusinessException 車両が存在しない、またはログインユーザーから閲覧できない場合（404）
     */
    @Transactional(readOnly = true)
    public VehicleResponse getDetail(JwtPrincipal principal, UUID vehicleId) {

        Vehicle vehicle = resolveViewableVehicle(principal, vehicleId);
        boolean canEdit = isOwner(vehicle, principal);

        return VehicleResponse.from(vehicle, storageUrlResolver, canEdit);
    }

    /**
     * 車両情報を更新する
     *
     * <p>
     * 画像の扱いは{@code file}と{@code request.removeImage()}の組み合わせで決まる。
     * {@code file}が指定されている場合は{@code removeImage}の値に関わらず画像差し替えを優先する。
     * 削除時はストレージを明示的に削除せず、{@code imageKey}をnullへ更新するのみとする
     * （{@link #delete}と同様、孤児ファイルクリーンアップスケジューラに実削除を委譲する）。
     * </p>
     *
     * @param principal 認証済みユーザー情報
     * @param vehicleId 対象車両ID
     * @param request   更新リクエスト情報
     * @param file      車両画像ファイル（任意、未指定時は{@code removeImage}に従う）
     * @throws BusinessException 車両が存在しない・閲覧できない場合（404）、
     *                           閲覧はできるが所有者でない場合（403）、
     *                           またはメーカーが存在しない・画像バリデーションに違反する場合（400）
     */
    @Transactional
    public void update(JwtPrincipal principal, UUID vehicleId, CreateVehicleRequest request, MultipartFile file) {

        Vehicle vehicle = resolveViewableVehicle(principal, vehicleId);
        requireOwner(vehicle, principal);

        Manufacturer manufacturer = manufacturerRepository.findById(request.manufacturerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.MANUFACTURER_NOT_FOUND));

        vehicle.update(request, manufacturer);

        if (file != null && !file.isEmpty()) {
            // 新しい画像が指定された場合は、removeImageの値に関わらず差し替えを優先する
            String oldImageKey = vehicle.getImageKey();
            storageTransactionManager.replaceAndExecute(
                    file, ImageType.VEHICLE_ICON, vehicleId, oldImageKey, newKey -> {
                        vehicle.updateImageKey(newKey);
                        return newKey;
                    });
        } else if (request.removeImage()) {
            // ストレージ上のファイルはここでは削除せず、参照を外すのみに留める
            vehicle.updateImageKey(null);
        }

        log.info("Vehicle update completed. vehicleId={}, userId={}", vehicleId, principal.userId());
    }

    /**
     * 車両を論理削除する
     *
     * <p>
     * ストレージ上の画像は明示的に削除しない。論理削除によりimageKeyが参照キー一覧
     * （{@link VehicleRepository#findAllStorageKeys}）から除外されるため、
     * 孤児ファイルクリーンアップスケジューラが猶予期間経過後に自動的に回収する。
     * </p>
     *
     * @param principal 認証済みユーザー情報
     * @param vehicleId 対象車両ID
     * @throws BusinessException 車両が存在しない・閲覧できない場合（404）、
     *                           または閲覧はできるが所有者でない場合（403）
     */
    @Transactional
    public void delete(JwtPrincipal principal, UUID vehicleId) {

        Vehicle vehicle = resolveViewableVehicle(principal, vehicleId);
        requireOwner(vehicle, principal);

        vehicleRepository.delete(vehicle);

        log.info("Vehicle delete completed. vehicleId={}, userId={}", vehicleId, principal.userId());
    }

    /**
     * ログインユーザーから閲覧可能な車両を取得する
     *
     * <p>
     * 「所有者本人」または「SHOPが対象車両にAPPROVED状態で連携している」のいずれも
     * 満たさない場合は、車両自体が存在しない場合と区別せず404として扱う
     * （{@code VehicleListService}のownerId認可と同じ、存在有無を外部から推測させない設計）。
     * </p>
     *
     * @param principal 認証済みユーザー情報
     * @param vehicleId 対象車両ID
     * @return 車両エンティティ
     * @throws BusinessException 車両が存在しない、または閲覧権限が無い場合（404）
     */
    private Vehicle resolveViewableVehicle(JwtPrincipal principal, UUID vehicleId) {

        Vehicle vehicle = vehicleRepository.findById(vehicleId)
                .orElseThrow(() -> new BusinessException(ErrorCode.VEHICLE_NOT_FOUND, HttpStatus.NOT_FOUND));

        boolean canView = isOwner(vehicle, principal) || isLinkedShop(principal, vehicleId);

        if (!canView) {
            throw new BusinessException(ErrorCode.VEHICLE_NOT_FOUND, HttpStatus.NOT_FOUND);
        }

        return vehicle;
    }

    /**
     * ログインユーザーが対象車両の所有者であることを要求する
     *
     * @param vehicle   対象車両（閲覧可能であることは呼び出し元で確認済み）
     * @param principal 認証済みユーザー情報
     * @throws BusinessException 所有者でない場合（403）
     */
    private void requireOwner(Vehicle vehicle, JwtPrincipal principal) {
        if (!isOwner(vehicle, principal)) {
            throw new BusinessException(ErrorCode.VEHICLE_EDIT_NOT_ALLOWED, HttpStatus.FORBIDDEN);
        }
    }

    /**
     * ログインユーザーが対象車両の所有者かどうかを判定する
     *
     * @param vehicle   対象車両
     * @param principal 認証済みユーザー情報
     * @return 所有者であればtrue
     */
    private boolean isOwner(Vehicle vehicle, JwtPrincipal principal) {
        return vehicle.getUser().getId().equals(principal.userId());
    }

    /**
     * ログインユーザーがSHOPとして対象車両にAPPROVED状態で連携しているかどうかを判定する
     *
     * @param principal 認証済みユーザー情報
     * @param vehicleId 対象車両ID
     * @return SHOPロールかつ承認済み連携が存在すればtrue
     */
    private boolean isLinkedShop(JwtPrincipal principal, UUID vehicleId) {
        return principal.role() == UserRole.SHOP
                && vehicleShopLinkRepository.existsByShop_IdAndVehicle_IdAndStatus(
                        principal.userId(), vehicleId, LinkStatus.APPROVED);
    }

}
