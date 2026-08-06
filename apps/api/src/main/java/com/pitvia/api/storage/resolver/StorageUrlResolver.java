package com.pitvia.api.storage.resolver;

import org.springframework.stereotype.Component;
import org.springframework.web.util.UriComponentsBuilder;

import com.pitvia.api.storage.properties.StorageProperties;

import lombok.RequiredArgsConstructor;

/**
 * ストレージキーから公開URLを組み立てるクラス
 *
 * @author pitvia
 * @version 1.0
 */
@Component
@RequiredArgsConstructor
public class StorageUrlResolver {

    /** ストレージ設定プロパティ */
    private final StorageProperties storageProperties;

    /**
     * ストレージキーから公開URLを組み立てる
     *
     * @param key 対象のストレージキー
     * @return 公開URL
     * @throws IllegalArgumentException ストレージキーが未指定の場合
     */
    public String resolve(String key) {

        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("Storage key must not be null or blank");
        }

        // 公開URLのベースにストレージキーをパスセグメントとして連結
        return UriComponentsBuilder.fromUriString(storageProperties.publicBaseUrl())
                .pathSegment(key.split("/"))
                .build()
                .toUriString();
    }

}
