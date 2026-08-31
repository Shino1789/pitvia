package com.pitvia.api.storage.util;

import static org.assertj.core.api.Assertions.assertThat;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.util.Set;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import com.pitvia.api.storage.constant.ImageType;
import com.pitvia.api.storage.validator.ImageValidationPolicy;

/**
 * {@link ImageUtils} の単体テスト
 *
 * <p>
 * 実際の{@code VehicleIconValidationPolicy}等の上限値（2000px, 400万画素）に依存すると、
 * 解像度超過を再現するためだけに巨大な画像を生成する必要があり非効率なため、
 * このテスト専用の小さな上限値を持つ{@link ImageValidationPolicy}実装を使用する。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
class ImageUtilsTest {

    /** テスト用に上限値を小さくしたバリデーションポリシー（幅・高さ10px、総画素数100） */
    private static final ImageValidationPolicy SMALL_LIMIT_POLICY = new ImageValidationPolicy() {
        @Override
        public ImageType supports() {
            return ImageType.VEHICLE_ICON;
        }

        @Override
        public long maxFileSize() {
            return Long.MAX_VALUE;
        }

        @Override
        public Set<String> allowedExtensions() {
            return Set.of(".png");
        }

        @Override
        public Set<String> allowedMimeTypes() {
            return Set.of("image/png");
        }

        @Override
        public int maxWidth() {
            return 10;
        }

        @Override
        public int maxHeight() {
            return 10;
        }

        @Override
        public long maxPixels() {
            return 100;
        }
    };

    /**
     * @test 上限内の解像度で、実際にデコード可能な画像の場合、VALIDが返ることを確認
     */
    @Test
    @DisplayName("上限内の解像度・デコード可能な画像はVALIDを返す")
    void validateAndDecodeImage_validImage_returnsValid() throws IOException {

        // Arrange
        MockMultipartFile file = toPngMultipartFile(createTestImage(8, 8));

        // Act
        ImageValidationResult result = ImageUtils.validateAndDecodeImage(file, SMALL_LIMIT_POLICY);

        // Assert
        assertThat(result).isEqualTo(ImageValidationResult.VALID);
    }

    /**
     * @test 画像として読み取れないデータ（テキストファイル等）の場合、INVALID_IMAGEが返ることを確認
     */
    @Test
    @DisplayName("デコード不能なデータはINVALID_IMAGEを返す")
    void validateAndDecodeImage_undecodableData_returnsInvalidImage() {

        // Arrange：PNGとして偽装しているが、実データはただのテキスト
        MockMultipartFile file = new MockMultipartFile(
                "file", "fake.png", "image/png", "this is not an image".getBytes());

        // Act
        ImageValidationResult result = ImageUtils.validateAndDecodeImage(file, SMALL_LIMIT_POLICY);

        // Assert
        assertThat(result).isEqualTo(ImageValidationResult.INVALID_IMAGE);
    }

    /**
     * @test 幅が上限を超える画像の場合、RESOLUTION_EXCEEDEDが返ることを確認
     */
    @Test
    @DisplayName("幅が上限を超える画像はRESOLUTION_EXCEEDEDを返す")
    void validateAndDecodeImage_widthExceedsLimit_returnsResolutionExceeded() throws IOException {

        // Arrange：幅11px（上限10pxを超過）、高さは上限内
        MockMultipartFile file = toPngMultipartFile(createTestImage(11, 5));

        // Act
        ImageValidationResult result = ImageUtils.validateAndDecodeImage(file, SMALL_LIMIT_POLICY);

        // Assert
        assertThat(result).isEqualTo(ImageValidationResult.RESOLUTION_EXCEEDED);
    }

    /**
     * @test 幅・高さは上限内だが総画素数が上限を超える画像の場合、RESOLUTION_EXCEEDEDが返ることを確認
     *
     * スマートフォン等の高解像度写真をそのままアップロードした際に発生する不具合の再発防止テスト
     * （幅・高さ単体の上限は超えないが、総画素数の上限を超えるケース）。
     */
    @Test
    @DisplayName("総画素数が上限を超える画像はRESOLUTION_EXCEEDEDを返す")
    void validateAndDecodeImage_pixelCountExceedsLimit_returnsResolutionExceeded() throws IOException {

        // Arrange：10×10=100px（幅・高さは上限ちょうど）に対し、9×9=81は上限内、10×10は境界値ちょうど
        // 幅・高さ単体では上限(10px)を超えないが、総画素数の上限(100)を超える組み合わせは無いため、
        // ここでは幅・高さの上限は超えないが総画素数のみ超過するケースを別途小さい上限値で検証する
        ImageValidationPolicy pixelOnlyLimitPolicy = new ImageValidationPolicy() {
            @Override
            public ImageType supports() {
                return ImageType.VEHICLE_ICON;
            }

            @Override
            public long maxFileSize() {
                return Long.MAX_VALUE;
            }

            @Override
            public Set<String> allowedExtensions() {
                return Set.of(".png");
            }

            @Override
            public Set<String> allowedMimeTypes() {
                return Set.of("image/png");
            }

            @Override
            public int maxWidth() {
                return 100;
            }

            @Override
            public int maxHeight() {
                return 100;
            }

            @Override
            public long maxPixels() {
                return 50;
            }
        };
        // 8×8=64px：幅・高さ（上限100）は超えないが、総画素数（上限50）は超過する
        MockMultipartFile file = toPngMultipartFile(createTestImage(8, 8));

        // Act
        ImageValidationResult result = ImageUtils.validateAndDecodeImage(file, pixelOnlyLimitPolicy);

        // Assert
        assertThat(result).isEqualTo(ImageValidationResult.RESOLUTION_EXCEEDED);
    }

    /**
     * テスト用のBufferedImageを生成する
     *
     * @param width  幅
     * @param height 高さ
     * @return 指定サイズのBufferedImage
     */
    private BufferedImage createTestImage(int width, int height) {
        return new BufferedImage(width, height, BufferedImage.TYPE_INT_RGB);
    }

    /**
     * BufferedImageをPNGエンコードし、MockMultipartFileへ変換する
     *
     * @param image 変換対象の画像
     * @return PNG形式のMockMultipartFile
     * @throws IOException 画像エンコードに失敗した場合
     */
    private MockMultipartFile toPngMultipartFile(BufferedImage image) throws IOException {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return new MockMultipartFile("file", "icon.png", "image/png", out.toByteArray());
    }

}
