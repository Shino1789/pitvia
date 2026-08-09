package com.pitvia.api.storage.util;

import java.awt.image.BufferedImage;
import java.io.IOException;
import java.io.InputStream;
import java.util.Iterator;
import java.util.Locale;

import javax.imageio.ImageIO;
import javax.imageio.ImageReader;
import javax.imageio.stream.ImageInputStream;

import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.pitvia.api.storage.validator.ImageValidationPolicy;

/**
 * 画像ファイル関連のユーティリティ
 *
 * @author pitvia
 * @version 1.0
 */
public final class ImageUtils {

    private ImageUtils() {
        // インスタンス化を防止するためのプライベートコンストラクタ
    }

    /**
     * ファイル名から小文字の拡張子（ドット含む）を取得する
     *
     * @param file アップロード対象のファイル
     * @return 拡張子（例: {@code .png}）。ファイル名が存在しない、または拡張子を持たない場合は空文字
     */
    public static String extractExtension(MultipartFile file) {

        String originalFilename = file.getOriginalFilename();
        if (!StringUtils.hasText(originalFilename)) {
            return "";
        }

        int dotIndex = originalFilename.lastIndexOf('.');
        return dotIndex >= 0 ? originalFilename.substring(dotIndex).toLowerCase(Locale.ROOT) : "";
    }

    /**
     * 解像度チェックと画像のデコードを1パス（単一ストリーム）で実行する
     *
     * <p>
     * 拡張子・MIMEタイプ偽装への対策として、実際にデコード可能な画像データであることを検証する。
     * 読み取り不能・非対応形式・解像度超過の場合はすべて{@code false}を返し、詳細な失敗要因は呼び出し元で判定しない。
     * </p>
     *
     * @param file   アップロード対象のファイル
     * @param policy 検証対象の画像用途に対応するバリデーションポリシー
     * @return デコード可能かつ解像度制限内の場合は{@code true}
     */
    public static boolean validateAndDecodeImage(MultipartFile file, ImageValidationPolicy policy) {

        try (InputStream is = file.getInputStream();
                ImageInputStream input = ImageIO.createImageInputStream(is)) {

            // 画像ストリームとして読み取れない場合は不正な画像として扱う
            if (input == null) {
                return false;
            }

            // 対応するデコーダーが存在しない（非対応フォーマット）場合は不正な画像として扱う
            Iterator<ImageReader> readers = ImageIO.getImageReaders(input);
            if (!readers.hasNext()) {
                return false;
            }

            ImageReader reader = readers.next();
            try {
                reader.setInput(input);

                // ヘッダー情報のみで解像度を取得（デコード前のため軽量）
                int width = reader.getWidth(0);
                int height = reader.getHeight(0);

                if (width > policy.maxWidth() || height > policy.maxHeight()) {
                    return false;
                }
                if ((long) width * height > policy.maxPixels()) {
                    return false;
                }

                // 解像度チェック通過後、実際にデコード可能かを検証
                BufferedImage image = reader.read(0);
                return image != null;

            } finally {
                reader.dispose();
            }
        } catch (IOException ex) {
            // 破損データ・非対応形式などデコード不能な場合は不正な画像として扱う
            return false;
        }
    }

}
