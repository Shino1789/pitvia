package com.pitvia.api.storage.generator;

import java.nio.file.Path;
import java.util.UUID;

import org.springframework.stereotype.Component;

import com.pitvia.api.storage.constant.ImageType;

/**
 * ストレージキー生成クラス
 *
 * @author pitvia
 * @version 1.0
 */
@Component
public class StorageKeyGenerator {

    /**
     * ストレージキーを生成する
     *
     * @param imageType  アップロード用途種別
     * @param resourceId リソース識別子（ユーザーID、車両ID等）
     * @param extension  ファイルの拡張子（ドット含む。例: {@code .png}）
     * @return {@code {keyPrefix}/{resourceId}/{UUID}{拡張子}} 形式のストレージキー
     */
    public String generate(ImageType imageType, UUID resourceId, String extension) {

        // ファイル名の衝突を避けるためUUIDを採番し、拡張子を付与
        String fileName = UUID.randomUUID() + extension;

        // 例: users/icons/{userId}/{uuid}.png や vehicles/icons/{vehicleId}/{uuid}.png
        return Path.of(imageType.getKeyPrefix(), resourceId.toString(), fileName)
                .toString()
                // OS依存のセパレータ（Windowsの"\"）が混入しないよう、"/"へ正規化
                .replace("\\", "/");
    }

}
