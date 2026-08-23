package com.pitvia.api.storage.validator;

import java.util.Set;

/**
 * 標準的な画像アップロード制限（10MB・jpg/jpeg/png/webp・6000×6000px・2500万画素）を持つ
 * 画像用途向けの共通バリデーションポリシー
 *
 * <p>
 * {@link VehicleIconValidationPolicy}・{@link MaintenanceImageValidationPolicy}のように
 * 許容条件が完全に一致する画像用途はこのクラスを継承し、{@link #supports()}のみを実装する。
 * ユーザーアイコン（{@link UserIconValidationPolicy}）はサイズ・寸法上限が異なるため対象外。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
public abstract class AbstractStandardImageValidationPolicy implements ImageValidationPolicy {

    /** 許容する最大ファイルサイズ（10MB） */
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024;

    /** 許可する拡張子 */
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp");

    /** 許可するMIMEタイプ */
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    /** 許容する最大幅 */
    private static final int MAX_WIDTH = 6000;

    /** 許容する最大高さ */
    private static final int MAX_HEIGHT = 6000;

    /** 許容する最大総画素数（幅 × 高さ） */
    private static final long MAX_PIXELS = 25_000_000L;

    @Override
    public long maxFileSize() {
        return MAX_FILE_SIZE;
    }

    @Override
    public Set<String> allowedExtensions() {
        return ALLOWED_EXTENSIONS;
    }

    @Override
    public Set<String> allowedMimeTypes() {
        return ALLOWED_MIME_TYPES;
    }

    @Override
    public int maxWidth() {
        return MAX_WIDTH;
    }

    @Override
    public int maxHeight() {
        return MAX_HEIGHT;
    }

    @Override
    public long maxPixels() {
        return MAX_PIXELS;
    }

}
