package com.pitvia.api.vehicle.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;

import javax.imageio.ImageIO;

import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.MinIOContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.master.entity.Manufacturer;
import com.pitvia.api.master.repository.ManufacturerRepository;
import com.pitvia.api.shop.entity.Shop;
import com.pitvia.api.shop.repository.ShopRepository;
import com.pitvia.api.support.AbstractIntegrationTest;
import com.pitvia.api.support.TestUserHelper.LoginSession;
import com.pitvia.api.user.entity.User;
import com.pitvia.api.user.repository.UserRepository;
import com.pitvia.api.vehicle.entity.Vehicle;
import com.pitvia.api.vehicle.entity.VehicleShopLink;
import com.pitvia.api.vehicle.enums.DriveType;
import com.pitvia.api.vehicle.enums.LinkStatus;
import com.pitvia.api.vehicle.enums.TransmissionType;
import com.pitvia.api.vehicle.enums.VehicleType;
import com.pitvia.api.vehicle.repository.VehicleRepository;
import com.pitvia.api.vehicle.repository.VehicleShopLinkRepository;

import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;

/**
 * 車両更新APIの結合テスト
 *
 * <p>
 * 画像差し替えを伴うテストを含むため、{@code VehicleRegisterControllerTest}と同様に
 * このクラスにのみMinIOのTestcontainerを持たせている（{@code VehicleDetailControllerTest}
 * はGET/DELETEのみで画像を扱わないため、MinIOなしで完結させている）。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
@Testcontainers
class VehicleUpdateControllerTest extends AbstractIntegrationTest {

    /** {@code application-test.yml} のダミー値と一致させ、上書きが必要なプロパティを最小限に抑える */
    private static final String STORAGE_ACCESS_KEY = "test-access-key";
    private static final String STORAGE_SECRET_KEY = "test-secret-key";
    private static final String STORAGE_BUCKET = "test-bucket";

    /** 車両アイコン画像アップロード検証用のMinIOコンテナ */
    @Container
    static MinIOContainer minio = new MinIOContainer("minio/minio:RELEASE.2024-11-07T00-52-20Z")
            .withUserName(STORAGE_ACCESS_KEY)
            .withPassword(STORAGE_SECRET_KEY);

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private VehicleShopLinkRepository vehicleShopLinkRepository;

    @Autowired
    private ManufacturerRepository manufacturerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

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
     * 画像を変更しない車両更新の正常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両更新（画像変更なし）：正常系")
    void update_withoutImage_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");

        String requestJson = """
                {
                    "vehicleType": "CAR",
                    "modelName": "RX-7 (Updated)",
                    "manufacturerId": 1,
                    "modelCode": "FD3S",
                    "engineCode": "13B-REW",
                    "modelYear": 2003,
                    "currentMileage": 90000,
                    "transmissionType": "MT",
                    "driveType": "FR"
                }
                """;

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());

        // Act
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.VEHICLE + "/" + vehicle.getId())
                .file(requestPart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk());

        // Assert
        Vehicle updated = vehicleRepository.findById(vehicle.getId()).orElseThrow();
        assertThat(updated.getModelName()).isEqualTo("RX-7 (Updated)");
        assertThat(updated.getCurrentMileage()).isEqualTo(90000);
        assertThat(updated.getImageKey()).isNull();
    }

    /**
     * 画像を新規アップロードする車両更新の正常系テスト（更新前は画像未設定）。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両更新（画像新規設定）：正常系")
    void update_withNewImage_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");

        String requestJson = """
                {
                    "vehicleType": "CAR",
                    "modelName": "RX-7",
                    "manufacturerId": 1,
                    "modelYear": 2002,
                    "currentMileage": 85000,
                    "transmissionType": "MT",
                    "driveType": "FR"
                }
                """;

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());
        MockMultipartFile filePart = new MockMultipartFile(
                "file", "icon.png", "image/png", createTestPngBytes());

        // Act
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.VEHICLE + "/" + vehicle.getId())
                .file(requestPart)
                .file(filePart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk());

        // Assert
        Vehicle updated = vehicleRepository.findById(vehicle.getId()).orElseThrow();
        assertThat(updated.getImageKey()).startsWith("vehicles/icons/" + vehicle.getId() + "/");
    }

    /**
     * 既存画像を新しい画像へ差し替える車両更新の正常系テスト。
     *
     * <p>
     * 差し替え後のimageKeyが更新前と異なることを確認し、
     * {@code StorageTransactionManager#replaceAndExecute}による差し替え処理の動作を検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両更新（画像差し替え）：正常系")
    void update_replaceImage_success() throws Exception {

        // Arrange：まず画像ありで登録し、更新前のimageKeyを控えておく
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");

        String initialRequestJson = """
                {
                    "vehicleType": "CAR",
                    "modelName": "RX-7",
                    "manufacturerId": 1,
                    "modelYear": 2002,
                    "currentMileage": 85000,
                    "transmissionType": "MT",
                    "driveType": "FR"
                }
                """;
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.VEHICLE + "/" + vehicle.getId())
                .file(new MockMultipartFile("request", "", "application/json", initialRequestJson.getBytes()))
                .file(new MockMultipartFile("file", "icon.png", "image/png", createTestPngBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk());

        String firstImageKey = vehicleRepository.findById(vehicle.getId()).orElseThrow().getImageKey();

        // Act：2回目の更新で画像を差し替える
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.VEHICLE + "/" + vehicle.getId())
                .file(new MockMultipartFile("request", "", "application/json", initialRequestJson.getBytes()))
                .file(new MockMultipartFile("file", "icon2.png", "image/png", createTestPngBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk());

        // Assert
        String secondImageKey = vehicleRepository.findById(vehicle.getId()).orElseThrow().getImageKey();
        assertThat(secondImageKey).isNotNull().isNotEqualTo(firstImageKey);
    }

    /**
     * SHOPが、連携済み顧客の車両を更新しようとした場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両更新（顧客車両・SHOP）：異常系（編集権限なし）")
    void update_customerVehicle_shop_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        User shopUser = findUser(shop);
        Shop shopEntity = shopRepository.findById(shopUser.getId()).orElseThrow();

        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        approveLink(vehicle, shopEntity);

        String requestJson = """
                {
                    "vehicleType": "CAR",
                    "modelName": "RX-7 (Hacked)",
                    "manufacturerId": 1,
                    "modelYear": 2002,
                    "currentMileage": 85000,
                    "transmissionType": "MT",
                    "driveType": "FR"
                }
                """;

        // Act & Assert
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.VEHICLE + "/" + vehicle.getId())
                .file(new MockMultipartFile("request", "", "application/json", requestJson.getBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("VEHICLE_EDIT_NOT_ALLOWED"));

        // 実際には更新されていないことも確認
        assertThat(vehicleRepository.findById(vehicle.getId()).orElseThrow().getModelName()).isEqualTo("RX-7");
    }

    /**
     * 存在しないメーカーIDを指定した場合の異常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両更新：異常系（メーカー不存在）")
    void update_manufacturerNotFound_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");

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

        // Act & Assert
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.VEHICLE + "/" + vehicle.getId())
                .file(new MockMultipartFile("request", "", "application/json", requestJson.getBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("MANUFACTURER_NOT_FOUND"));
    }

    /**
     * 存在しない車両を更新しようとした場合の異常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両更新：異常系（車両不存在）")
    void update_notFound_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        String requestJson = """
                {
                    "vehicleType": "CAR",
                    "modelName": "RX-7",
                    "manufacturerId": 1,
                    "modelYear": 2002,
                    "currentMileage": 85000,
                    "transmissionType": "MT",
                    "driveType": "FR"
                }
                """;

        // Act & Assert
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.VEHICLE + "/" + java.util.UUID.randomUUID())
                .file(new MockMultipartFile("request", "", "application/json", requestJson.getBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("VEHICLE_NOT_FOUND"));
    }

    /**
     * ログインセッションからユーザーエンティティを取得する
     *
     * @param session ログインセッション情報
     * @return ユーザーエンティティ
     */
    private User findUser(LoginSession session) {
        return userRepository.findByEmail(session.email()).orElseThrow();
    }

    /**
     * テスト用の車両を最小限の必須項目で作成・保存する
     *
     * @param user      所有者
     * @param modelName 車種名
     * @return 保存済みの車両エンティティ
     */
    private Vehicle createVehicle(User user, String modelName) {
        Manufacturer manufacturer = manufacturerRepository.findById(1L).orElseThrow();

        Vehicle vehicle = Vehicle.builder()
                .user(user)
                .vehicleType(VehicleType.CAR)
                .modelName(modelName)
                .manufacturer(manufacturer)
                .modelYear((short) 2000)
                .currentMileage(10000)
                .transmissionType(TransmissionType.MT)
                .driveType(DriveType.FR)
                .build();

        return vehicleRepository.save(vehicle);
    }

    /**
     * 車両とショップの間にAPPROVED状態の共有リンクを作成する
     *
     * @param vehicle 対象車両
     * @param shop    対象ショップ
     */
    private void approveLink(Vehicle vehicle, Shop shop) {
        VehicleShopLink link = VehicleShopLink.builder()
                .vehicle(vehicle)
                .shop(shop)
                .status(LinkStatus.APPROVED)
                .build();

        vehicleShopLinkRepository.save(link);
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
