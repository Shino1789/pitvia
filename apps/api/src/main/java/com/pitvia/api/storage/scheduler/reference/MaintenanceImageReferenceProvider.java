package com.pitvia.api.storage.scheduler.reference;

import java.util.Set;

import org.springframework.stereotype.Component;

import com.pitvia.api.maintenance.repository.MaintenanceWorkItemImageRepository;
import com.pitvia.api.storage.constant.ImageType;

import lombok.RequiredArgsConstructor;

/**
 * 整備履歴画像用の参照キー取得実装
 *
 * @author pitvia
 * @version 1.0
 */
@Component
@RequiredArgsConstructor
public class MaintenanceImageReferenceProvider implements StorageKeyReferenceProvider {

    /** 整備作業画像リポジトリ */
    private final MaintenanceWorkItemImageRepository maintenanceWorkItemImageRepository;

    @Override
    public ImageType supports() {
        return ImageType.MAINTENANCE_IMAGE;
    }

    @Override
    public Set<String> findAllReferencedKeys() {
        return maintenanceWorkItemImageRepository.findAllStorageKeys();
    }

}
