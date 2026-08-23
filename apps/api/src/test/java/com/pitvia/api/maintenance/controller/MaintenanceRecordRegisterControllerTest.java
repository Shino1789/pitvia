package com.pitvia.api.maintenance.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.net.URI;
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
import com.pitvia.api.maintenance.entity.MaintenanceRecord;
import com.pitvia.api.maintenance.entity.MaintenanceWorkItem;
import com.pitvia.api.maintenance.repository.MaintenanceRecordRepository;
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
 * 整備履歴登録APIの結合テスト
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
class MaintenanceRecordRegisterControllerTest extends AbstractIntegrationTest {

    /** {@code application-test.yml} のダミー値と一致させ、上書きが必要なプロパティを最小限に抑える */
    private static final String STORAGE_ACCESS_KEY = "test-access-key";
    private static final String STORAGE_SECRET_KEY = "test-secret-key";
    private static final String STORAGE_BUCKET = "test-bucket";

    /** 整備画像アップロード検証用のMinIOコンテナ */
    @Container
    static MinIOContainer minio = new MinIOContainer("minio/minio:RELEASE.2024-11-07T00-52-20Z")
            .withUserName(STORAGE_ACCESS_KEY)
            .withPassword(STORAGE_SECRET_KEY);

    @Autowired
    private MaintenanceRecordRepository maintenanceRecordRepository;

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
     * 画像を添付しない登録の正常系テスト（部品を伴う作業項目・伴わない作業項目を1件ずつ含む）。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴登録（画像なし・複数作業項目）：正常系（OWNER自己所有車両）")
    void register_withoutImage_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");
        String title = "定期メンテナンス-" + UUID.randomUUID();

        String requestJson = """
                {
                    "vehicleId": "%s",
                    "title": "%s",
                    "maintenanceType": "PERIODIC_MAINTENANCE",
                    "workDateFrom": "2026-05-01",
                    "mileage": 85500,
                    "workItems": [
                        {
                            "maintenanceCategory": "ENGINE",
                            "workContent": "エンジンオイル交換",
                            "performedBy": "オーナー本人（DIY）",
                            "laborCost": 0,
                            "parts": [
                                {
                                    "partName": "オイルフィルター",
                                    "quantity": 1,
                                    "unitPrice": 1200
                                }
                            ]
                        },
                        {
                            "maintenanceCategory": "BRAKE",
                            "workContent": "ブレーキフルード点検",
                            "performedBy": "オーナー本人（DIY）",
                            "laborCost": 0,
                            "parts": []
                        }
                    ]
                }
                """.formatted(vehicle.getId(), title);

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());

        // Act
        mockMvc.perform(multipart(ApiPaths.MAINTENANCE_RECORD)
                .file(requestPart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isCreated());

        // Assert
        MaintenanceRecord saved = findRecordByTitle(title);
        assertThat(saved.getShop()).isNull();
        assertThat(saved.getWorkItems()).hasSize(2);
        assertThat(saved.getWorkItems().get(0).getParts()).hasSize(1);
        assertThat(saved.getWorkItems().get(0).getParts().get(0).getPartName()).isEqualTo("オイルフィルター");
        assertThat(saved.getWorkItems().get(1).getParts()).isEmpty();
        assertThat(saved.getWorkItems().get(0).getImages()).isEmpty();
    }

    /**
     * 画像を添付した登録の正常系テスト。
     *
     * <p>
     * ステータスコードだけでなく、DBに保存された{@code imageKey}が、整備記録ID（UUID）を
     * 含む想定のプレフィックスになっていることまで確認する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴登録（画像あり）：正常系")
    void register_withImage_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");
        String title = "車検対応-" + UUID.randomUUID();

        String requestJson = """
                {
                    "vehicleId": "%s",
                    "title": "%s",
                    "maintenanceType": "VEHICLE_INSPECTION",
                    "workDateFrom": "2026-04-10",
                    "mileage": 86200,
                    "workItems": [
                        {
                            "maintenanceCategory": "ENGINE",
                            "workContent": "エンジンオイル交換",
                            "performedBy": "ガレージ田中",
                            "laborCost": 2000,
                            "parts": []
                        }
                    ]
                }
                """.formatted(vehicle.getId(), title);

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());
        MockMultipartFile imagePart = new MockMultipartFile(
                "workItemImage_0", "work.png", "image/png", createTestPngBytes());

        // Act
        mockMvc.perform(multipart(ApiPaths.MAINTENANCE_RECORD)
                .file(requestPart)
                .file(imagePart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isCreated());

        // Assert
        MaintenanceRecord saved = findRecordByTitle(title);
        MaintenanceWorkItem workItem = saved.getWorkItems().get(0);
        assertThat(workItem.getImages()).hasSize(1);
        assertThat(workItem.getImages().get(0).getImageKey())
                .startsWith("maintenance/images/" + saved.getId() + "/");
    }

    /**
     * 複数の作業項目のうち一部にのみ画像を添付した場合の正常系テスト。
     *
     * <p>
     * {@code workItemImage_{index}}のインデックスと作業項目が正しく対応し、
     * 画像を添付していない作業項目には画像が紐づかないことを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴登録（複数作業項目・一部のみ画像）：正常系")
    void register_multipleWorkItems_partialImage_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");
        String title = "複数作業項目-" + UUID.randomUUID();

        String requestJson = """
                {
                    "vehicleId": "%s",
                    "title": "%s",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-06-15",
                    "mileage": 86500,
                    "workItems": [
                        {
                            "maintenanceCategory": "BRAKE",
                            "workContent": "ブレーキパッド交換",
                            "performedBy": "ガレージ田中",
                            "laborCost": 8000,
                            "parts": []
                        },
                        {
                            "maintenanceCategory": "SUSPENSION",
                            "workContent": "車高調整",
                            "performedBy": "ガレージ田中",
                            "laborCost": 5000,
                            "parts": []
                        }
                    ]
                }
                """.formatted(vehicle.getId(), title);

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());
        // workItems[1]（車高調整）にのみ画像を添付する
        MockMultipartFile imagePart = new MockMultipartFile(
                "workItemImage_1", "work.png", "image/png", createTestPngBytes());

        // Act
        mockMvc.perform(multipart(ApiPaths.MAINTENANCE_RECORD)
                .file(requestPart)
                .file(imagePart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isCreated());

        // Assert
        MaintenanceRecord saved = findRecordByTitle(title);
        assertThat(saved.getWorkItems().get(0).getImages()).isEmpty();
        assertThat(saved.getWorkItems().get(1).getImages()).hasSize(1);
    }

    /**
     * SHOPが、APPROVED状態で連携している顧客車両に登録する場合の正常系テスト。
     *
     * <p>
     * 登録者がSHOPのため、保存された整備記録の{@code shop}に登録実行者のショップが
     * 紐づけられることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴登録：正常系（SHOP・連携済み顧客車両）")
    void register_shopLinkedVehicle_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        User shopUser = findUser(shop);
        Shop shopEntity = shopRepository.findById(shopUser.getId()).orElseThrow();

        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");
        approveLink(vehicle, shopEntity);
        String title = "ブレーキパッド交換-" + UUID.randomUUID();

        String requestJson = """
                {
                    "vehicleId": "%s",
                    "title": "%s",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-06-15",
                    "mileage": 86500,
                    "workItems": [
                        {
                            "maintenanceCategory": "BRAKE",
                            "workContent": "フロントブレーキパッド交換",
                            "performedBy": "ガレージ田中",
                            "laborCost": 8000,
                            "parts": []
                        }
                    ]
                }
                """.formatted(vehicle.getId(), title);

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());

        // Act
        mockMvc.perform(multipart(ApiPaths.MAINTENANCE_RECORD)
                .file(requestPart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isCreated());

        // Assert
        MaintenanceRecord saved = findRecordByTitle(title);
        assertThat(saved.getCreatedByUser().getId()).isEqualTo(shopUser.getId());
        assertThat(saved.getShop()).isNotNull();
        assertThat(saved.getShop().getId()).isEqualTo(shopUser.getId());
    }

    /**
     * SHOPが、車両共有関係（APPROVED状態の連携）が無い車両に登録しようとした場合の異常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴登録：異常系（未連携車両）")
    void register_notLinkedVehicle_notFound_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S"); // 共有リンクを作成しない

        String requestJson = """
                {
                    "vehicleId": "%s",
                    "title": "無許可の登録試行",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-06-15",
                    "mileage": 86500,
                    "workItems": [
                        {
                            "maintenanceCategory": "BRAKE",
                            "workContent": "ブレーキパッド交換",
                            "performedBy": "ガレージ田中",
                            "laborCost": 8000,
                            "parts": []
                        }
                    ]
                }
                """.formatted(vehicle.getId());

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());

        // Act & Assert
        mockMvc.perform(multipart(ApiPaths.MAINTENANCE_RECORD)
                .file(requestPart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("VEHICLE_NOT_FOUND"));
    }

    /**
     * 必須項目が欠落している場合の異常系テスト（トップレベル・ネストしたフィールドの両方を検証）。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴登録：異常系（バリデーションエラー）")
    void register_validationError_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        String requestJson = """
                {
                    "vehicleId": null,
                    "title": "",
                    "maintenanceType": null,
                    "workDateFrom": null,
                    "mileage": -1,
                    "workItems": [
                        {
                            "maintenanceCategory": null,
                            "workContent": "",
                            "performedBy": "",
                            "laborCost": -100,
                            "parts": [
                                {
                                    "partName": "",
                                    "quantity": 0,
                                    "unitPrice": -1
                                }
                            ]
                        }
                    ]
                }
                """;

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());

        // Act & Assert
        mockMvc.perform(multipart(ApiPaths.MAINTENANCE_RECORD)
                .file(requestPart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.validationErrors[?(@.field=='vehicleId')]").exists())
                .andExpect(jsonPath("$.error.validationErrors[?(@.field=='title')]").exists())
                .andExpect(jsonPath("$.error.validationErrors[?(@.field=='workItems[0].workContent')]").exists())
                .andExpect(jsonPath("$.error.validationErrors[?(@.field=='workItems[0].parts[0].partName')]").exists());
    }

    /**
     * 作業終了日が作業開始日より前の場合の異常系テスト（{@code @ValidWorkDatePeriod}）。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴登録：異常系（作業終了日が作業開始日より前）")
    void register_workDateToBeforeFrom_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");

        String requestJson = """
                {
                    "vehicleId": "%s",
                    "title": "期間不正テスト",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-06-15",
                    "workDateTo": "2026-06-10",
                    "mileage": 86500,
                    "workItems": [
                        {
                            "maintenanceCategory": "BRAKE",
                            "workContent": "ブレーキパッド交換",
                            "performedBy": "ガレージ田中",
                            "laborCost": 8000,
                            "parts": []
                        }
                    ]
                }
                """.formatted(vehicle.getId());

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());

        // Act & Assert
        mockMvc.perform(multipart(ApiPaths.MAINTENANCE_RECORD)
                .file(requestPart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.validationErrors[?(@.field=='workDateTo')]").exists());
    }

    /**
     * 作業項目の{@code parts}キー自体を省略した場合の正常系テスト。
     *
     * <p>
     * 「部品が任意」（0件でも登録できる）と「partsフィールド自体が任意」（キー省略・nullも許容する）は
     * 別の関心事であり、後者を検証する。{@code WorkItemRequest}のコンパクトコンストラクタで
     * 空リストへ正規化されるため、NPE（500）にならず正常登録できることを確認する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴登録（作業項目のpartsキーを省略）：正常系")
    void register_workItemPartsOmitted_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");
        String title = "partsキー省略-" + UUID.randomUUID();

        String requestJson = """
                {
                    "vehicleId": "%s",
                    "title": "%s",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-06-15",
                    "mileage": 86500,
                    "workItems": [
                        {
                            "maintenanceCategory": "BRAKE",
                            "workContent": "ブレーキパッド交換",
                            "performedBy": "ガレージ田中",
                            "laborCost": 8000
                        }
                    ]
                }
                """.formatted(vehicle.getId(), title);

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());

        // Act
        mockMvc.perform(multipart(ApiPaths.MAINTENANCE_RECORD)
                .file(requestPart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isCreated());

        // Assert
        MaintenanceRecord saved = findRecordByTitle(title);
        assertThat(saved.getWorkItems().get(0).getParts()).isEmpty();
    }

    /**
     * 作業項目の{@code parts}に{@code null}を送信した場合の正常系テスト（上記と同じ観点の別ケース）。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴登録（作業項目のpartsがnull）：正常系")
    void register_workItemPartsNull_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");
        String title = "partsがnull-" + UUID.randomUUID();

        String requestJson = """
                {
                    "vehicleId": "%s",
                    "title": "%s",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-06-15",
                    "mileage": 86500,
                    "workItems": [
                        {
                            "maintenanceCategory": "BRAKE",
                            "workContent": "ブレーキパッド交換",
                            "performedBy": "ガレージ田中",
                            "laborCost": 8000,
                            "parts": null
                        }
                    ]
                }
                """.formatted(vehicle.getId(), title);

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());

        // Act
        mockMvc.perform(multipart(ApiPaths.MAINTENANCE_RECORD)
                .file(requestPart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isCreated());

        // Assert
        MaintenanceRecord saved = findRecordByTitle(title);
        assertThat(saved.getWorkItems().get(0).getParts()).isEmpty();
    }

    /**
     * 存在しない整備種別コードを指定した場合の異常系テスト。
     *
     * <p>
     * {@code maintenanceType}は列挙型（{@code maintenance.enums.MaintenanceType}）で
     * 受け取るため、未定義のコードはBean Validationに到達する前にJSONパース段階で
     * 400（Bad Request）となる。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴登録：異常系（不正な整備種別コード）")
    void register_invalidMaintenanceType_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");

        String requestJson = """
                {
                    "vehicleId": "%s",
                    "title": "不正な整備種別テスト",
                    "maintenanceType": "UNKNOWN_TYPE",
                    "workDateFrom": "2026-04-10",
                    "mileage": 86200,
                    "workItems": [
                        {
                            "maintenanceCategory": "ENGINE",
                            "workContent": "エンジンオイル交換",
                            "performedBy": "オーナー本人（DIY）",
                            "laborCost": 0,
                            "parts": []
                        }
                    ]
                }
                """.formatted(vehicle.getId());

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());

        // Act & Assert
        mockMvc.perform(multipart(ApiPaths.MAINTENANCE_RECORD)
                .file(requestPart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isBadRequest());
    }

    /**
     * 未認証アクセス：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴登録（未認証）：異常系")
    void register_unauthenticated_failure() throws Exception {

        // Arrange
        String requestJson = """
                {
                    "vehicleId": "%s",
                    "title": "未認証テスト",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-04-10",
                    "mileage": 1000,
                    "workItems": [
                        {
                            "maintenanceCategory": "ENGINE",
                            "workContent": "テスト",
                            "performedBy": "テスト",
                            "laborCost": 0,
                            "parts": []
                        }
                    ]
                }
                """.formatted(UUID.randomUUID());

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", requestJson.getBytes());

        // Act & Assert
        mockMvc.perform(multipart(ApiPaths.MAINTENANCE_RECORD).file(requestPart))
                .andExpect(status().isUnauthorized());
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
     * @param modelCode 型式（任意）
     * @return 保存済みの車両エンティティ
     */
    private Vehicle createVehicle(User user, String modelName, String modelCode) {
        Manufacturer manufacturer = manufacturerRepository.findById(1L).orElseThrow();

        Vehicle vehicle = Vehicle.builder()
                .user(user)
                .vehicleType(VehicleType.CAR)
                .modelName(modelName)
                .modelCode(modelCode)
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
     * タイトルを条件に、登録済みの整備記録を1件取得する（テスト検証用）
     *
     * @param title 検索対象のタイトル
     * @return 該当する整備記録エンティティ
     */
    private MaintenanceRecord findRecordByTitle(String title) {
        return maintenanceRecordRepository.findAll().stream()
                .filter(record -> record.getTitle().equals(title))
                .findFirst()
                .orElseThrow();
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
