package com.pitvia.api.storage.scheduler.reference;

import java.util.Set;

import org.springframework.stereotype.Component;

import com.pitvia.api.storage.constant.ImageType;
import com.pitvia.api.vehicle.repository.VehicleRepository;

import lombok.RequiredArgsConstructor;

/**
 * 車両画像用の参照キー取得実装
 *
 * @author pitvia
 * @version 1.0
 */
@Component
@RequiredArgsConstructor
public class VehicleImageReferenceProvider implements StorageKeyReferenceProvider {

    /** 車両リポジトリ */
    private final VehicleRepository vehicleRepository;

    @Override
    public ImageType supports() {
        return ImageType.VEHICLE_ICON;
    }

    @Override
    public Set<String> findAllReferencedKeys() {
        return vehicleRepository.findAllStorageKeys();
    }

}
