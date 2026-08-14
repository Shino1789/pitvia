package com.pitvia.api.storage.util;

/**
 * 画像デコード・解像度検証（{@link ImageUtils#validateAndDecodeImage}）の結果種別
 *
 * @author pitvia
 * @version 1.0
 */
public enum ImageValidationResult {

    /**
     * デコード可能かつ解像度が上限内だった場合
     */
    VALID,

    /**
     * 画像として読み取れない、または対応するデコーダーが存在しない（非対応フォーマット・破損データ）場合
     */
    INVALID_IMAGE,

    /**
     * デコード自体は可能だが、幅・高さ・総画素数のいずれかが上限を超えていた場合
     */
    RESOLUTION_EXCEEDED,

}
