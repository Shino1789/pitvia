package com.pitvia.api.maintenance.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.math.BigDecimal;
import java.net.URI;
import java.time.LocalDate;
import java.util.UUID;

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
import com.pitvia.api.maintenance.entity.MaintenancePart;
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

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import software.amazon.awssdk.auth.credentials.AwsBasicCredentials;
import software.amazon.awssdk.auth.credentials.StaticCredentialsProvider;
import software.amazon.awssdk.regions.Region;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.S3Configuration;
import software.amazon.awssdk.services.s3.model.CreateBucketRequest;

/**
 * 整備履歴更新APIの結合テスト
 *
 * <p>
 * 画像アップロード・差し替えを伴うテストを含むため、MinIOのTestcontainerを持たせている
 * （{@code MaintenanceRecordRegisterControllerTest}と同様）。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
@Testcontainers
class MaintenanceRecordUpdateControllerTest extends AbstractIntegrationTest {

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

    @PersistenceContext
    private EntityManager entityManager;

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
     * 基本情報（タイトル・整備種別・走行距離等）のみを変更する更新の正常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴更新（基本情報のみ）：正常系（登録者本人・OWNER）")
    void update_basicFields_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        MaintenanceRecord record = createRecord(vehicle, ownerUser, null, "エンジンオイル交換");
        Long workItemId = record.getWorkItems().get(0).getId();
        Long partId = record.getWorkItems().get(0).getParts().get(0).getId();

        String requestJson = """
                {
                    "title": "エンジンオイル交換（更新後）",
                    "maintenanceType": "PERIODIC_MAINTENANCE",
                    "workDateFrom": "2026-05-01",
                    "mileage": 81000,
                    "remarks": "次回は3ヶ月後",
                    "workItems": [
                        {
                            "id": %d,
                            "maintenanceCategory": "ENGINE",
                            "workContent": "エンジンオイル交換",
                            "performedBy": "ガレージ田中",
                            "laborCost": 2000,
                            "parts": [
                                { "id": %d, "partName": "オイルフィルター", "quantity": 1, "unitPrice": 1200 }
                            ]
                        }
                    ]
                }
                """.formatted(workItemId, partId);

        // Act
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.MAINTENANCE_RECORD + "/" + record.getId())
                .file(new MockMultipartFile("request", "", "application/json", requestJson.getBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk());

        // Assert
        MaintenanceRecord updated = maintenanceRecordRepository.findById(record.getId()).orElseThrow();
        assertThat(updated.getTitle()).isEqualTo("エンジンオイル交換（更新後）");
        assertThat(updated.getMileage()).isEqualTo(81000);
        assertThat(updated.getRemarks()).isEqualTo("次回は3ヶ月後");
        // 既存の作業項目・部品はID指定で更新されており、件数は変わらないこと
        assertThat(updated.getWorkItems()).hasSize(1);
        assertThat(updated.getWorkItems().get(0).getId()).isEqualTo(workItemId);
        assertThat(updated.getWorkItems().get(0).getParts().get(0).getId()).isEqualTo(partId);
    }

    /**
     * 既存の作業項目に加えて、新しい作業項目を追加する更新の正常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴更新（作業項目追加）：正常系")
    void update_addWorkItem_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        MaintenanceRecord record = createRecord(vehicle, ownerUser, null, "エンジンオイル交換");
        Long workItemId = record.getWorkItems().get(0).getId();
        Long partId = record.getWorkItems().get(0).getParts().get(0).getId();

        String requestJson = """
                {
                    "title": "エンジンオイル交換",
                    "maintenanceType": "PERIODIC_MAINTENANCE",
                    "workDateFrom": "2026-05-01",
                    "mileage": 81000,
                    "workItems": [
                        {
                            "id": %d,
                            "maintenanceCategory": "ENGINE",
                            "workContent": "エンジンオイル交換",
                            "performedBy": "ガレージ田中",
                            "laborCost": 2000,
                            "parts": [
                                { "id": %d, "partName": "オイルフィルター", "quantity": 1, "unitPrice": 1200 }
                            ]
                        },
                        {
                            "maintenanceCategory": "BRAKE",
                            "workContent": "ブレーキフルード点検",
                            "performedBy": "ガレージ田中",
                            "laborCost": 1000,
                            "parts": []
                        }
                    ]
                }
                """.formatted(workItemId, partId);

        // Act
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.MAINTENANCE_RECORD + "/" + record.getId())
                .file(new MockMultipartFile("request", "", "application/json", requestJson.getBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk());

        // Assert
        MaintenanceRecord updated = maintenanceRecordRepository.findById(record.getId()).orElseThrow();
        assertThat(updated.getWorkItems()).hasSize(2);
        assertThat(updated.getWorkItems().get(0).getId()).isEqualTo(workItemId);
        // 新規追加分は新しいIDが採番されていること
        assertThat(updated.getWorkItems().get(1).getId()).isNotEqualTo(workItemId);
        assertThat(updated.getWorkItems().get(1).getWorkContent()).isEqualTo("ブレーキフルード点検");
    }

    /**
     * リクエストに含まれなかった既存の作業項目が削除される更新の正常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴更新（作業項目削除）：正常系")
    void update_removeWorkItem_success() throws Exception {

        // Arrange：作業項目2件で登録する
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        MaintenanceRecord record = createRecordWithTwoWorkItems(vehicle, ownerUser);
        Long keepWorkItemId = record.getWorkItems().get(0).getId();

        // Act：1件目のみを含むリクエストで更新（2件目は削除される想定）
        String requestJson = """
                {
                    "title": "整備タイトル",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-05-01",
                    "mileage": 81000,
                    "workItems": [
                        {
                            "id": %d,
                            "maintenanceCategory": "ENGINE",
                            "workContent": "エンジンオイル交換",
                            "performedBy": "ガレージ田中",
                            "laborCost": 2000,
                            "parts": []
                        }
                    ]
                }
                """.formatted(keepWorkItemId);

        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.MAINTENANCE_RECORD + "/" + record.getId())
                .file(new MockMultipartFile("request", "", "application/json", requestJson.getBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk());

        // Assert
        MaintenanceRecord updated = maintenanceRecordRepository.findById(record.getId()).orElseThrow();
        assertThat(updated.getWorkItems()).hasSize(1);
        assertThat(updated.getWorkItems().get(0).getId()).isEqualTo(keepWorkItemId);
    }

    /**
     * 作業項目に新しい整備画像を追加する更新の正常系テスト（元画像なし）。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴更新（画像新規追加）：正常系")
    void update_addImage_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        MaintenanceRecord record = createRecord(vehicle, ownerUser, null, "エンジンオイル交換");
        Long workItemId = record.getWorkItems().get(0).getId();
        Long partId = record.getWorkItems().get(0).getParts().get(0).getId();

        String requestJson = """
                {
                    "title": "エンジンオイル交換",
                    "maintenanceType": "PERIODIC_MAINTENANCE",
                    "workDateFrom": "2026-05-01",
                    "mileage": 81000,
                    "workItems": [
                        {
                            "id": %d,
                            "maintenanceCategory": "ENGINE",
                            "workContent": "エンジンオイル交換",
                            "performedBy": "ガレージ田中",
                            "laborCost": 2000,
                            "parts": [
                                { "id": %d, "partName": "オイルフィルター", "quantity": 1, "unitPrice": 1200 }
                            ]
                        }
                    ]
                }
                """.formatted(workItemId, partId);

        // Act
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.MAINTENANCE_RECORD + "/" + record.getId())
                .file(new MockMultipartFile("request", "", "application/json", requestJson.getBytes()))
                .file(new MockMultipartFile("workItemImage_0", "work.png", "image/png", createTestPngBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk());

        // Assert
        MaintenanceRecord updated = maintenanceRecordRepository.findById(record.getId()).orElseThrow();
        assertThat(updated.getWorkItems().get(0).getImages()).hasSize(1);
        assertThat(updated.getWorkItems().get(0).getImages().get(0).getImageKey())
                .startsWith("maintenance/images/" + record.getId() + "/");
    }

    /**
     * 作業項目の既存画像を新しい画像へ差し替える更新の正常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴更新（画像差し替え）：正常系")
    void update_replaceImage_success() throws Exception {

        // Arrange：あらかじめ画像付きの作業項目を用意する
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        MaintenanceRecord record = createRecordWithImage(vehicle, owner);
        Long workItemId = record.getWorkItems().get(0).getId();
        String firstImageKey = record.getWorkItems().get(0).getImages().get(0).getImageKey();

        String requestJson = """
                {
                    "title": "整備タイトル",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-05-01",
                    "mileage": 81000,
                    "workItems": [
                        {
                            "id": %d,
                            "maintenanceCategory": "ENGINE",
                            "workContent": "エンジンオイル交換",
                            "performedBy": "ガレージ田中",
                            "laborCost": 2000,
                            "parts": []
                        }
                    ]
                }
                """.formatted(workItemId);

        // Act
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.MAINTENANCE_RECORD + "/" + record.getId())
                .file(new MockMultipartFile("request", "", "application/json", requestJson.getBytes()))
                .file(new MockMultipartFile("workItemImage_0", "work2.png", "image/png", createTestPngBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk());

        // Assert：画像は1枚のまま、キーが差し替わっていること
        MaintenanceRecord updated = maintenanceRecordRepository.findById(record.getId()).orElseThrow();
        assertThat(updated.getWorkItems().get(0).getImages()).hasSize(1);
        assertThat(updated.getWorkItems().get(0).getImages().get(0).getImageKey())
                .isNotEqualTo(firstImageKey);
    }

    /**
     * 作業項目の既存画像を削除する更新の正常系テスト（{@code removeImage=true}、ファイルなし）。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴更新（画像削除）：正常系（removeImage=true）")
    void update_removeImage_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        MaintenanceRecord record = createRecordWithImage(vehicle, owner);
        Long workItemId = record.getWorkItems().get(0).getId();

        String requestJson = """
                {
                    "title": "整備タイトル",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-05-01",
                    "mileage": 81000,
                    "workItems": [
                        {
                            "id": %d,
                            "maintenanceCategory": "ENGINE",
                            "workContent": "エンジンオイル交換",
                            "performedBy": "ガレージ田中",
                            "laborCost": 2000,
                            "removeImage": true,
                            "parts": []
                        }
                    ]
                }
                """.formatted(workItemId);

        // Act
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.MAINTENANCE_RECORD + "/" + record.getId())
                .file(new MockMultipartFile("request", "", "application/json", requestJson.getBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk());

        // Assert
        MaintenanceRecord updated = maintenanceRecordRepository.findById(record.getId()).orElseThrow();
        assertThat(updated.getWorkItems().get(0).getImages()).isEmpty();
    }

    /**
     * SHOPが登録した整備履歴を、車両所有者（OWNER）が更新しようとした場合：異常系。
     *
     * <p>
     * 「車両所有者だから編集可能」ではなく、登録者本人でなければ403になることを検証する
     * （Issueの核心仕様）。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴更新（SHOP登録・OWNER編集）：異常系（編集権限なし）")
    void update_shopCreatedRecord_owner_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        User shopUser = findUser(shop);
        Shop shopEntity = shopRepository.findById(shopUser.getId()).orElseThrow();

        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        approveLink(vehicle, shopEntity);
        MaintenanceRecord record = createRecord(vehicle, shopUser, shopEntity, "ブレーキパッド交換");
        Long workItemId = record.getWorkItems().get(0).getId();

        String requestJson = """
                {
                    "title": "不正な更新試行",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-05-01",
                    "mileage": 81000,
                    "workItems": [
                        {
                            "id": %d,
                            "maintenanceCategory": "ENGINE",
                            "workContent": "改ざん試行",
                            "performedBy": "ガレージ田中",
                            "laborCost": 2000,
                            "parts": []
                        }
                    ]
                }
                """.formatted(workItemId);

        // Act & Assert
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.MAINTENANCE_RECORD + "/" + record.getId())
                .file(new MockMultipartFile("request", "", "application/json", requestJson.getBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("MAINTENANCE_RECORD_EDIT_NOT_ALLOWED"));

        // 実際には更新されていないことも確認
        assertThat(maintenanceRecordRepository.findById(record.getId()).orElseThrow().getTitle())
                .isEqualTo("ブレーキパッド交換");
    }

    /**
     * OWNERが登録した整備履歴を、連携済みSHOPが更新しようとした場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴更新（OWNER登録・SHOP編集）：異常系（編集権限なし）")
    void update_ownerCreatedRecord_shop_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        User shopUser = findUser(shop);
        Shop shopEntity = shopRepository.findById(shopUser.getId()).orElseThrow();

        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        approveLink(vehicle, shopEntity);
        MaintenanceRecord record = createRecord(vehicle, ownerUser, null, "エンジンオイル交換");
        Long workItemId = record.getWorkItems().get(0).getId();

        String requestJson = """
                {
                    "title": "不正な更新試行",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-05-01",
                    "mileage": 81000,
                    "workItems": [
                        {
                            "id": %d,
                            "maintenanceCategory": "ENGINE",
                            "workContent": "改ざん試行",
                            "performedBy": "ガレージ田中",
                            "laborCost": 2000,
                            "parts": []
                        }
                    ]
                }
                """.formatted(workItemId);

        // Act & Assert
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.MAINTENANCE_RECORD + "/" + record.getId())
                .file(new MockMultipartFile("request", "", "application/json", requestJson.getBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("MAINTENANCE_RECORD_EDIT_NOT_ALLOWED"));
    }

    /**
     * 対象の整備記録に存在しない作業項目IDを指定した場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴更新：異常系（存在しない作業項目ID）")
    void update_unknownWorkItemId_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        MaintenanceRecord record = createRecord(vehicle, ownerUser, null, "エンジンオイル交換");

        String requestJson = """
                {
                    "title": "整備タイトル",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-05-01",
                    "mileage": 81000,
                    "workItems": [
                        {
                            "id": 999999,
                            "maintenanceCategory": "ENGINE",
                            "workContent": "存在しないID",
                            "performedBy": "ガレージ田中",
                            "laborCost": 2000,
                            "parts": []
                        }
                    ]
                }
                """;

        // Act & Assert
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.MAINTENANCE_RECORD + "/" + record.getId())
                .file(new MockMultipartFile("request", "", "application/json", requestJson.getBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("MAINTENANCE_WORK_ITEM_NOT_FOUND"));
    }

    /**
     * 存在しない整備記録を更新しようとした場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴更新：異常系（記録不存在）")
    void update_notFound_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);

        String requestJson = """
                {
                    "title": "整備タイトル",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-05-01",
                    "mileage": 81000,
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
                """;

        // Act & Assert
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.MAINTENANCE_RECORD + "/" + UUID.randomUUID())
                .file(new MockMultipartFile("request", "", "application/json", requestJson.getBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("MAINTENANCE_RECORD_NOT_FOUND"));
    }

    /**
     * 必須項目が欠落している場合の異常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴更新：異常系（バリデーションエラー）")
    void update_validationError_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        MaintenanceRecord record = createRecord(vehicle, ownerUser, null, "エンジンオイル交換");

        String requestJson = """
                {
                    "title": "",
                    "maintenanceType": null,
                    "workDateFrom": null,
                    "mileage": -1,
                    "workItems": []
                }
                """;

        // Act & Assert
        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.MAINTENANCE_RECORD + "/" + record.getId())
                .file(new MockMultipartFile("request", "", "application/json", requestJson.getBytes()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.validationErrors[?(@.field=='title')]").exists())
                .andExpect(jsonPath("$.error.validationErrors[?(@.field=='workItems')]").exists());
    }

    /**
     * 未認証アクセス：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴更新（未認証）：異常系")
    void update_unauthenticated_failure() throws Exception {

        String requestJson = """
                {
                    "title": "テスト",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-05-01",
                    "mileage": 0,
                    "workItems": [
                        { "maintenanceCategory": "ENGINE", "workContent": "テスト", "performedBy": "テスト", "laborCost": 0, "parts": [] }
                    ]
                }
                """;

        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.MAINTENANCE_RECORD + "/" + UUID.randomUUID())
                .file(new MockMultipartFile("request", "", "application/json", requestJson.getBytes())))
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
     * テスト用の整備記録を、作業項目1件・部品1件を伴って作成・保存する
     *
     * @param vehicle       対象車両
     * @param createdByUser 登録者
     * @param shop          登録者がSHOPの場合はそのショップ（DIYの場合はnull）
     * @param title         整備タイトル（アサーションで識別しやすいよう可変にする）
     * @return 保存済みの整備記録エンティティ
     */
    private MaintenanceRecord createRecord(Vehicle vehicle, User createdByUser, Shop shop, String title) {

        MaintenanceRecord record = buildBaseRecord(vehicle, createdByUser, shop, title);

        MaintenanceWorkItem workItem = MaintenanceWorkItem.builder()
                .maintenanceRecord(record)
                .maintenanceCategory(findCategory("ENGINE"))
                .workContent("エンジンオイル交換")
                .performedBy("ガレージ田中")
                .laborCost(BigDecimal.valueOf(2000))
                .sortOrder(0)
                .build();

        MaintenancePart part = MaintenancePart.builder()
                .maintenanceWorkItem(workItem)
                .partName("オイルフィルター")
                .quantity(BigDecimal.ONE)
                .unitPrice(BigDecimal.valueOf(1200))
                .sortOrder(0)
                .build();

        workItem.getParts().add(part);
        record.getWorkItems().add(workItem);

        return maintenanceRecordRepository.save(record);
    }

    /**
     * テスト用の整備記録を、作業項目2件（部品・画像なし）を伴って作成・保存する
     *
     * @param vehicle       対象車両
     * @param createdByUser 登録者
     * @return 保存済みの整備記録エンティティ
     */
    private MaintenanceRecord createRecordWithTwoWorkItems(Vehicle vehicle, User createdByUser) {

        MaintenanceRecord record = buildBaseRecord(vehicle, createdByUser, null, "整備タイトル");

        MaintenanceWorkItem workItem1 = MaintenanceWorkItem.builder()
                .maintenanceRecord(record)
                .maintenanceCategory(findCategory("ENGINE"))
                .workContent("エンジンオイル交換")
                .performedBy("ガレージ田中")
                .laborCost(BigDecimal.valueOf(2000))
                .sortOrder(0)
                .build();

        MaintenanceWorkItem workItem2 = MaintenanceWorkItem.builder()
                .maintenanceRecord(record)
                .maintenanceCategory(findCategory("BRAKE"))
                .workContent("ブレーキフルード点検")
                .performedBy("ガレージ田中")
                .laborCost(BigDecimal.valueOf(1000))
                .sortOrder(1)
                .build();

        record.getWorkItems().add(workItem1);
        record.getWorkItems().add(workItem2);

        return maintenanceRecordRepository.save(record);
    }

    /**
     * テスト用の整備記録を、画像付きの作業項目1件を伴って作成・保存する
     *
     * <p>
     * 画像はストレージキーの採番に整備記録IDを要するため、まず画像なしでDBへ直接保存し、
     * 確定したIDを使って更新API（本テストクラスの対象API自体）を1回呼ぶことで紐づける。
     * </p>
     *
     * @param vehicle 対象車両
     * @param creator 登録者のログインセッション（画像シード用の更新APIリクエストに使用）
     * @return 保存済みの整備記録エンティティ
     * @throws Exception 画像の生成、またはシード用の更新APIリクエストに失敗した場合
     */
    private MaintenanceRecord createRecordWithImage(Vehicle vehicle, LoginSession creator) throws Exception {

        User createdByUser = findUser(creator);
        MaintenanceRecord record = buildBaseRecord(vehicle, createdByUser, null, "整備タイトル");

        MaintenanceWorkItem workItem = MaintenanceWorkItem.builder()
                .maintenanceRecord(record)
                .maintenanceCategory(findCategory("ENGINE"))
                .workContent("エンジンオイル交換")
                .performedBy("ガレージ田中")
                .laborCost(BigDecimal.valueOf(2000))
                .sortOrder(0)
                .build();

        record.getWorkItems().add(workItem);
        MaintenanceRecord saved = maintenanceRecordRepository.save(record);

        MockMultipartFile requestPart = new MockMultipartFile(
                "request", "", "application/json", buildMinimalUpdateJson(
                        saved.getWorkItems().get(0).getId()).getBytes());
        MockMultipartFile imagePart = new MockMultipartFile(
                "workItemImage_0", "work.png", "image/png", createTestPngBytes());

        mockMvc.perform(multipart(HttpMethod.PUT, ApiPaths.MAINTENANCE_RECORD + "/" + saved.getId())
                .file(requestPart)
                .file(imagePart)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + creator.accessToken()))
                .andExpect(status().isOk());

        return maintenanceRecordRepository.findById(saved.getId()).orElseThrow();
    }

    /**
     * {@link #createRecordWithImage}で画像を事前アップロードするための、最小限の更新リクエストJSONを組み立てる
     *
     * @param workItemId 対象作業項目ID
     * @return リクエストJSON文字列
     */
    private String buildMinimalUpdateJson(Long workItemId) {
        return """
                {
                    "title": "整備タイトル",
                    "maintenanceType": "REPAIR",
                    "workDateFrom": "2026-05-01",
                    "mileage": 80000,
                    "workItems": [
                        {
                            "id": %d,
                            "maintenanceCategory": "ENGINE",
                            "workContent": "エンジンオイル交換",
                            "performedBy": "ガレージ田中",
                            "laborCost": 2000,
                            "parts": []
                        }
                    ]
                }
                """.formatted(workItemId);
    }

    /**
     * 整備記録ヘッダーの共通部分（作業項目・部品を除く）を組み立てる
     *
     * @param vehicle       対象車両
     * @param createdByUser 登録者
     * @param shop          登録者がSHOPの場合はそのショップ（DIYの場合はnull）
     * @param title         整備タイトル
     * @return 未保存の整備記録エンティティ
     */
    private MaintenanceRecord buildBaseRecord(Vehicle vehicle, User createdByUser, Shop shop, String title) {
        return MaintenanceRecord.builder()
                .vehicle(vehicle)
                .createdByUser(createdByUser)
                .shop(shop)
                .title(title)
                .maintenanceType(findMaintenanceType("REPAIR"))
                .workDateFrom(LocalDate.of(2026, 4, 10))
                .mileage(80000)
                .isDraft(false)
                .build();
    }

    /**
     * コードを指定して整備種別マスタを取得する
     *
     * @param code 整備種別コード
     * @return 整備種別マスタエンティティ
     */
    private com.pitvia.api.master.entity.MaintenanceType findMaintenanceType(String code) {
        return entityManager
                .createQuery(
                        "SELECT mt FROM com.pitvia.api.master.entity.MaintenanceType mt WHERE mt.code = :code",
                        com.pitvia.api.master.entity.MaintenanceType.class)
                .setParameter("code", code)
                .getSingleResult();
    }

    /**
     * コードを指定して整備カテゴリマスタを取得する
     *
     * @param code 整備カテゴリコード
     * @return 整備カテゴリマスタエンティティ
     */
    private com.pitvia.api.master.entity.MaintenanceCategory findCategory(String code) {
        return entityManager
                .createQuery(
                        "SELECT mc FROM com.pitvia.api.master.entity.MaintenanceCategory mc WHERE mc.code = :code",
                        com.pitvia.api.master.entity.MaintenanceCategory.class)
                .setParameter("code", code)
                .getSingleResult();
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
