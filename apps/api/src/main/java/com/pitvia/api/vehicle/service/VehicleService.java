package com.pitvia.api.vehicle.service;

import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.master.entity.Manufacturer;
import com.pitvia.api.master.repository.ManufacturerRepository;
import com.pitvia.api.storage.constant.ImageType;
import com.pitvia.api.storage.transaction.StorageTransactionManager;
import com.pitvia.api.user.entity.User;
import com.pitvia.api.user.repository.UserRepository;
import com.pitvia.api.vehicle.dto.request.CreateVehicleRequest;
import com.pitvia.api.vehicle.entity.Vehicle;
import com.pitvia.api.vehicle.repository.VehicleRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * 車両登録サービス
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class VehicleService {

    /** 車両リポジトリ */
    private final VehicleRepository vehicleRepository;

    /** メーカーリポジトリ */
    private final ManufacturerRepository manufacturerRepository;

    /** ユーザーリポジトリ */
    private final UserRepository userRepository;

    /** ストレージ操作とDBトランザクションを連携するマネージャー */
    private final StorageTransactionManager storageTransactionManager;

    /**
     * 車両を新規登録する
     *
     * <p>
     * 車両画像のストレージキーは車両ID配下（{@code vehicles/icons/{vehicleId}/...}）に採番されるため、
     * IDが確定していない新規作成時は「画像なしで先に車両を保存してIDを確定させる」
     * →「確定したIDで画像をアップロードする」→「画像キーで車両を更新する」という順で処理する。
     * 画像アップロード後の紐づけ処理が失敗した場合は、アップロード済みのファイルを自動的に削除する
     * （{@link StorageTransactionManager#uploadAndExecute}によるロールバック）。
     * </p>
     *
     * <p>
     * 登録直後の一覧画面遷移＋トースト表示のみを行う画面要件のため、
     * {@code RegisterService}（アカウント登録）と同様に戻り値は持たない。
     * </p>
     *
     * @param request リクエスト情報
     * @param userId  ログインユーザーID（JWTから取得した値のみを使用する）
     * @param file    車両画像ファイル（任意）
     * @throws BusinessException メーカーが存在しない場合、または画像バリデーションに違反する場合
     */
    @Transactional
    public void register(CreateVehicleRequest request, UUID userId, MultipartFile file) {

        log.info("Vehicle registration started. userId={}", userId);

        // メーカーの存在チェック
        Manufacturer manufacturer = manufacturerRepository.findById(request.manufacturerId())
                .orElseThrow(() -> new BusinessException(ErrorCode.MANUFACTURER_NOT_FOUND));

        // JWTで検証済みのuserIdを所有者として使用する
        User user = userRepository.getReferenceById(userId);

        Vehicle vehicle = Vehicle.builder()
                .user(user)
                .vehicleType(request.vehicleType())
                .modelName(request.modelName())
                .manufacturer(manufacturer)
                .modelCode(request.modelCode())
                .engineCode(request.engineCode())
                .modelYear(request.modelYear())
                .licensePlate(request.licensePlate())
                .currentMileage(request.currentMileage())
                .transmissionType(request.transmissionType())
                .driveType(request.driveType())
                .memo(request.memo())
                .build();

        // 画像なしで先に保存し、Hibernateが採番した実際の車両IDを確定させる
        Vehicle saved = vehicleRepository.save(vehicle);

        if (file != null && !file.isEmpty()) {
            // 確定した車両IDで画像をアップロードし、成功後にキーを紐づける
            // saved はこのトランザクション内で管理された状態のため、
            // 紐づけ後に明示的なsave()呼び出しは不要（コミット時にダーティチェックでUPDATEが走る）
            storageTransactionManager.uploadAndExecute(
                    file, ImageType.VEHICLE_ICON, saved.getId(), saved::updateImageKey);
        }

        log.info("Vehicle registration completed. vehicleId={}, userId={}", saved.getId(), userId);
    }

}
