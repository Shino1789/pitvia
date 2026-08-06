package com.pitvia.api.storage.validator;

import java.util.Set;

import com.pitvia.api.storage.constant.ImageType;

/**
 * 画像用途別バリデーションポリシー
 *
 * <p>
 * {@link com.pitvia.api.storage.service.StorageService} が画像アップロード時の検証に使用する、
 * 画像用途種別（{@link ImageType}）ごとの許容条件を定義する。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
public interface ImageValidationPolicy {

    /**
     * この実装が対応する画像用途種別を返す
     *
     * @return 対応する画像用途種別
     */
    ImageType supports();

    /**
     * 許容する最大ファイルサイズを返す
     *
     * @return 最大ファイルサイズ（バイト）
     */
    long maxFileSize();

    /**
     * 許可する拡張子一覧を返す
     *
     * @return 許可する拡張子（小文字・ドット含む）の集合
     */
    Set<String> allowedExtensions();

    /**
     * 許可するMIMEタイプ一覧を返す
     *
     * @return 許可するMIMEタイプの集合
     */
    Set<String> allowedMimeTypes();

    /**
     * 許容する最大幅を返す
     *
     * @return 最大幅（ピクセル）
     */
    int maxWidth();

    /**
     * 許容する最大高さを返す
     *
     * @return 最大高さ（ピクセル）
     */
    int maxHeight();

    /**
     * 許容する最大総画素数を返す
     *
     * @return 最大総画素数（幅 × 高さ）
     */
    long maxPixels();

}
