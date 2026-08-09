package com.pitvia.api.storage.validator;

import java.util.Set;

import org.springframework.stereotype.Component;

import com.pitvia.api.storage.constant.ImageType;

/**
 * ユーザーアイコン画像用バリデーションポリシー
 *
 * @author pitvia
 * @version 1.0
 */
@Component
public class UserIconValidationPolicy implements ImageValidationPolicy {

    /** 許容する最大ファイルサイズ（2MB） */
    private static final long MAX_FILE_SIZE = 2 * 1024 * 1024;

    /** 許可する拡張子 */
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".jpg", ".jpeg", ".png", ".webp");

    /** 許可するMIMEタイプ */
    private static final Set<String> ALLOWED_MIME_TYPES = Set.of("image/jpeg", "image/png", "image/webp");

    /** 許容する最大幅 */
    private static final int MAX_WIDTH = 2000;

    /** 許容する最大高さ */
    private static final int MAX_HEIGHT = 2000;

    /** 許容する最大総画素数（幅 × 高さ） */
    private static final long MAX_PIXELS = 4_000_000L;

    @Override
    public ImageType supports() {
        return ImageType.USER_ICON;
    }

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
