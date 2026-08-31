package com.pitvia.api.storage.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.storage.constant.ImageType;
import com.pitvia.api.storage.generator.StorageKeyGenerator;
import com.pitvia.api.storage.provider.StorageProvider;
import com.pitvia.api.storage.resolver.StorageUrlResolver;
import com.pitvia.api.storage.util.ImageUtils;
import com.pitvia.api.storage.util.ImageValidationResult;
import com.pitvia.api.storage.validator.ImageValidationPolicy;

import lombok.extern.slf4j.Slf4j;

/**
 * ストレージ操作サービス
 *
 * <p>
 * {@link StorageProvider} の実装（MinIO / S3）のみに依存し、
 * 利用側は実装差異を意識せず画像のアップロード・削除を行える。
 * バリデーションおよびストレージキーの採番は本クラスの責務とする。
 * 公開URLの組み立ては本クラスの責務ではないため、利用側は {@link StorageUrlResolver} を直接利用すること。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Service
public class StorageService {

    /** ストレージプロバイダー（STORAGE_PROVIDER環境変数によりMinIO / S3が切り替わる） */
    private final StorageProvider storageProvider;

    /** ストレージキー生成クラス */
    private final StorageKeyGenerator storageKeyGenerator;

    /** 画像用途種別とそれに対応するバリデーションポリシーをマッピングしたマップ */
    private final Map<ImageType, ImageValidationPolicy> validationPolicyMap;

    /**
     * コンストラクタ
     * Springによってインジェクションされた {@link ImageValidationPolicy} の実装クラスリストから、
     * 対応する画像用途種別（{@link ImageType}）をキーとしたマップを構築する
     *
     * @param storageProvider     ストレージプロバイダー
     * @param storageKeyGenerator ストレージキー採番クラス
     * @param validationPolicies  画像バリデーションポリシーの実装クラスのリスト
     */
    public StorageService(
            StorageProvider storageProvider,
            StorageKeyGenerator storageKeyGenerator,
            List<ImageValidationPolicy> validationPolicies) {

        this.storageProvider = storageProvider;
        this.storageKeyGenerator = storageKeyGenerator;
        this.validationPolicyMap = validationPolicies.stream()
                .collect(Collectors.toMap(ImageValidationPolicy::supports, Function.identity()));
    }

    /**
     * 画像ファイルをアップロードする
     *
     * @param file       アップロード対象のファイル
     * @param imageType  画像用途種別
     * @param resourceId リソース識別子（ユーザーID、車両ID等）
     * @return 保存されたストレージキー（DB保存用。公開URLは {@link StorageUrlResolver#resolve(String)}
     *         で取得する）
     * @throws IllegalArgumentException リソースIDが未指定の場合
     * @throws BusinessException        ファイルが空、またはバリデーションポリシーに違反する場合
     */
    public String upload(MultipartFile file, ImageType imageType, UUID resourceId) {

        // 呼び出し元の実装ミスを早期検知するためのガード
        if (resourceId == null) {
            throw new IllegalArgumentException("Resource ID must not be null");
        }

        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.FILE_EMPTY);
        }

        log.info("Upload started. imageType={}, resourceId={}", imageType, resourceId);

        // 拡張子はバリデーションとキー生成の両方で利用するため、ここで一度だけ抽出する
        String extension = ImageUtils.extractExtension(file);
        validate(file, imageType, extension);

        // 画像用途種別・リソースID・拡張子からストレージキーを採番し、実体をアップロード
        String key = storageKeyGenerator.generate(imageType, resourceId, extension);
        storageProvider.upload(file, key);

        log.info("Upload completed. key={}", key);

        return key;
    }

    /**
     * ファイルを削除する
     *
     * @param key 削除対象のストレージキー
     * @throws IllegalArgumentException ストレージキーが未指定の場合
     */
    public void delete(String key) {

        if (key == null || key.isBlank()) {
            throw new IllegalArgumentException("Storage key must not be null or blank");
        }

        log.info("Delete started. key={}", key);
        storageProvider.delete(key);
        log.info("Delete completed. key={}", key);
    }

    /**
     * 画像用途種別に対応するバリデーションポリシーに基づき、アップロード対象ファイルを検証する
     *
     * @param file      アップロード対象のファイル
     * @param imageType 画像用途種別
     * @param extension アップロード対象ファイルの拡張子（呼び出し元で抽出済みのものを利用する）
     * @throws BusinessException ファイルサイズ超過、非対応の拡張子・MIMEタイプ、
     *                           デコード不能な画像（{@code UNSUPPORTED_IMAGE_TYPE}）、
     *                           または解像度超過（{@code IMAGE_RESOLUTION_EXCEEDED}）の場合
     */
    private void validate(MultipartFile file, ImageType imageType, String extension) {

        ImageValidationPolicy policy = getValidationPolicy(imageType);

        // ファイルサイズ上限チェック
        if (file.getSize() > policy.maxFileSize()) {
            throw new BusinessException(ErrorCode.FILE_SIZE_EXCEEDED);
        }

        // 拡張子の許可チェック
        if (!policy.allowedExtensions().contains(extension)) {
            throw new BusinessException(ErrorCode.UNSUPPORTED_IMAGE_TYPE);
        }

        // MIMEタイプの許可チェック
        String contentType = file.getContentType();
        if (contentType == null || !policy.allowedMimeTypes().contains(contentType)) {
            throw new BusinessException(ErrorCode.UNSUPPORTED_IMAGE_TYPE);
        }

        // 拡張子・MIMEタイプの偽装対策として、実データのデコード可否と解像度を検証
        ImageValidationResult result = ImageUtils.validateAndDecodeImage(file, policy);
        switch (result) {
            // デコード不能な画像（拡張子・MIMEタイプの偽装の可能性あり）の場合
            case INVALID_IMAGE -> throw new BusinessException(ErrorCode.UNSUPPORTED_IMAGE_TYPE);
            // 解像度が上限を超過している場合
            case RESOLUTION_EXCEEDED -> throw new BusinessException(ErrorCode.IMAGE_RESOLUTION_EXCEEDED);
            // バリデーションを全て通過した場合は何もせず終了
            case VALID -> {
            }
        }
    }

    /**
     * 指定された画像用途種別に対応するバリデーションポリシーを取得する
     *
     * @param imageType 検索対象の画像用途種別
     * @return 画像用途種別に対応する {@link ImageValidationPolicy} の実装インスタンス
     * @throws IllegalStateException 指定された画像用途種別に対応するポリシー実装クラスが存在しない場合
     */
    private ImageValidationPolicy getValidationPolicy(ImageType imageType) {
        return Optional.ofNullable(validationPolicyMap.get(imageType))
                .orElseThrow(() -> new IllegalStateException("ImageValidationPolicy not found: " + imageType));
    }

}
