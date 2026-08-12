package com.pitvia.api.vehicle.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
import java.time.Year;
import java.util.UUID;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MinIOContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.support.AbstractIntegrationTest;
import com.pitvia.api.support.TestUserHelper.LoginSession;
import com.pitvia.api.vehicle.entity.Vehicle;
import com.pitvia.api.vehicle.repository.VehicleRepository;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;

/**
 * 車両登録APIの結合テスト
 *
 * <p>
 * 画像アップロードを伴うテストのみを含むため、このクラスにのみMinIOのTestcontainerを持たせている。
 * {@code AbstractIntegrationTest}には追加せず、MinIOを使わない他のテストクラスの起動を重くしないようにしている。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
@Testcontainers
class VehicleControllerTest extends AbstractIntegrationTest {

    /** {@code application-test.yml} のダミー値と一致させ、上書きが必要なプロパティを最小限に抑える */
    private static final String STORAGE_ACCESS_KEY = "test-access-key";
    private static final String STORAGE_SECRET_KEY = "test-secret-key";
    private static final String STORAGE_BUCKET = "test-bucket";

    /** 車両アイコン画像アップロード検証用のMinIOコンテナ */
    @Container
    static MinIOContainer minio = new MinIOContainer("minio/minio:RELEASE.2024-11-07T00-52-20Z")
            .withUserName(STORAGE_ACCESS_KEY)
            .withPassword(STORAGE_SECRET_KEY);

    /** 車両リポジトリ（画像アップロード結果の検証用） */
    @Autowired
    private VehicleRepository vehicleRepository;

    /**
     * ランダムなポートで起動するMinIOコンテナの接続先を、Springのプロパティへ動的に反映する
     *
     * @param registry 動的プロパティレジストリ
     */
    @DynamicPropertySource
    static void overrideStorageProperties(DynamicPropertyRegistry registry) {
        registry.add("app.storage.endpoint", minio::getS3URL);
    }

    /**
     * {@code application-test.yml} が参照するバケットをMinIOコンテナ上に作成する
     */
    @BeforeAll
    static void createBucket() {

        try (S3Client setupClient = S3Client.builder()
                .region(Region.of("us-east-1"))
                .credentialsProvider(StaticCredentialsProvider.create(
                        AwsBasicCredentials.create(STORAGE_ACCESS_KEY, STORAGE_SECRET_KEY)))
                .endpointOverride(URI.create(minio.getS3URL()))
                .serviceConfiguration(S3Configuration.builder().pathStyleAccessEnabled(true).build())
                .build()) {

            setupClient.createBucket(CreateBucketRequest.builder().bucket(STORAGE_BUCKET).build());
        }
    }

    /**
     * 画像を添付しない車両登録の正常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両登録（画像なし）：正常系")
    void register_withoutImage_success() throws Exception {

        // Arrange
        LoginSession session = testUserHelper.loginOwner(mockMvc);
        String requestJson = """
                {
                    "vehicleType": "CAR",
                    "modelName": "RX-7",
                    "manufacturerId": 1,
                    "modelCode": "FD3S",
                    "engineCode": "13B-REW",
                    "modelYear": 2002,
                    "currentMileage": 85000,
                    "transmissionType": "MT",
                    "driveType": "FR"
                }
                """;

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());

        // Act & Assert
        mockMvc.perform(multipart(ApiPaths.VEHICLE)
                .file(requestPart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isCreated());
    }

    /**
     * 画像を添付した車両登録の正常系テスト。
     *
     * <p>
     * ステータスコードだけでなく、DBに保存された {@code imageKey} が確定した車両IDを含む
     * 想定のプレフィックスになっていることまで確認し、画像アップロードの実処理が
     * 正しく動作したことを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両登録（画像あり）：正常系")
    void register_withImage_success() throws Exception {

        // Arrange
        LoginSession session = testUserHelper.loginOwner(mockMvc);
        String modelName = "GT-R-" + UUID.randomUUID();
        String requestJson = """
                {
                    "vehicleType": "CAR",
                    "modelName": "%s",
                    "manufacturerId": 1,
                    "modelCode": "BNR34",
                    "engineCode": "RB26DETT",
                    "modelYear": 2001,
                    "currentMileage": 45000,
                    "transmissionType": "MT",
                    "driveType": "AWD"
                }
                """.formatted(modelName);

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());
        MockMultipartFile filePart = new MockMultipartFile(
                "file", "icon.png", "image/png", createTestPngBytes());

        // Act
        mockMvc.perform(multipart(ApiPaths.VEHICLE)
                .file(requestPart)
                .file(filePart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isCreated());

        // Assert
        Vehicle saved = vehicleRepository.findAll().stream()
                .filter(vehicle -> vehicle.getModelName().equals(modelName))
                .findFirst()
                .orElseThrow();

        assertThat(saved.getImageKey()).startsWith("vehicles/icons/" + saved.getId() + "/");
    }

    /**
     * 存在しないメーカーIDを指定した場合の異常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両登録：異常系（メーカー不存在）")
    void register_manufacturerNotFound_failure() throws Exception {

        // Arrange
        LoginSession session = testUserHelper.loginOwner(mockMvc);
        String requestJson = """
                {
                    "vehicleType": "CAR",
                    "modelName": "RX-7",
                    "manufacturerId": 999999,
                    "modelYear": 2002,
                    "currentMileage": 85000,
                    "transmissionType": "MT",
                    "driveType": "FR"
                }
                """;

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());

        // Act & Assert
        mockMvc.perform(multipart(ApiPaths.VEHICLE)
                .file(requestPart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("MANUFACTURER_NOT_FOUND"));
    }

    /**
     * 許容範囲（現在の年+1年）を超えた未来の年式を指定した場合の異常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両登録：異常系（年式が未来すぎる）")
    void register_futureModelYear_failure() throws Exception {

        // Arrange
        LoginSession session = testUserHelper.loginOwner(mockMvc);

        // @ValidModelYearの許容は「現在の年 + 1年」までのため、+2年は必ず違反する
        short tooFarYear = (short) (Year.now().getValue() + 2);

        String requestJson = """
                {
                    "vehicleType": "CAR",
                    "modelName": "RX-7",
                    "manufacturerId": 1,
                    "modelYear": %d,
                    "currentMileage": 0,
                    "transmissionType": "MT",
                    "driveType": "FR"
                }
                """.formatted(tooFarYear);

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());

        // Act & Assert
        mockMvc.perform(multipart(ApiPaths.VEHICLE)
                .file(requestPart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.validationErrors[?(@.field=='modelYear')]").exists());
    }

    /**
     * テスト用の最小限の有効なPNG画像バイト列を生成する
     *
     * @return PNG形式の画像バイト列
     * @throws IOException 画像エンコードに失敗した場合
     */
    private byte[] createTestPngBytes() throws IOException {
        BufferedImage image = new BufferedImage(8, 8, BufferedImage.TYPE_INT_RGB);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        ImageIO.write(image, "png", out);
        return out.toByteArray();
    }

}
