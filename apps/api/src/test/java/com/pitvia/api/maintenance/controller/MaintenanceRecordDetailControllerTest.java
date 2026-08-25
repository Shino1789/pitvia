package com.pitvia.api.maintenance.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;

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

import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;

/**
 * 整備履歴詳細取得・削除APIの結合テスト
 *
 * <p>
 * 画像アップロードを伴わないため、MinIOのTestcontainerは使用しない
 * （{@code MaintenanceRecordRegisterControllerTest}／{@code MaintenanceRecordUpdateControllerTest}参照）。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
class MaintenanceRecordDetailControllerTest extends AbstractIntegrationTest {

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

    /** {@code @SQLDelete}のUPDATE文が実際にDBへflushされることを検証するために使用する */
    @PersistenceContext
    private EntityManager entityManager;

    /**
     * OWNER自身の整備履歴詳細取得：正常系。登録者本人のためcanEditがtrueになることを検証する。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴詳細（登録者本人・OWNER）：正常系")
    void detail_ownRecord_owner_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        MaintenanceRecord record = createMaintenanceRecord(vehicle, ownerUser, null, "エンジンオイル交換");

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD + "/" + record.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.title").value("エンジンオイル交換"))
                .andExpect(jsonPath("$.data.vehicleId").value(vehicle.getId().toString()))
                .andExpect(jsonPath("$.data.canEdit").value(true))
                .andExpect(jsonPath("$.data.workItems[0].workContent").value("エンジンオイル交換"))
                .andExpect(jsonPath("$.data.workItems[0].parts[0].partName").value("オイルフィルター"));
    }

    /**
     * SHOPが登録した整備履歴を、車両所有者（OWNER）が閲覧：正常系。
     *
     * <p>
     * 閲覧はできるが、登録者本人ではないためcanEditはfalseになることを検証する
     * （「車両所有者だから編集可能」ではないことの確認）。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴詳細（SHOP登録・OWNER閲覧）：正常系（閲覧のみ）")
    void detail_shopCreatedRecord_owner_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        User shopUser = findUser(shop);
        Shop shopEntity = shopRepository.findById(shopUser.getId()).orElseThrow();

        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        approveLink(vehicle, shopEntity);
        MaintenanceRecord record = createMaintenanceRecord(vehicle, shopUser, shopEntity, "ブレーキパッド交換");

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD + "/" + record.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.canEdit").value(false))
                .andExpect(jsonPath("$.data.shopName").exists());
    }

    /**
     * SHOPが、車両共有関係（APPROVED状態の連携）が無い車両の整備履歴を閲覧しようとした場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴詳細（未連携車両・SHOP）：異常系")
    void detail_notLinkedVehicle_shop_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7"); // 共有リンクを作成しない
        MaintenanceRecord record = createMaintenanceRecord(vehicle, ownerUser, null, "エンジンオイル交換");

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD + "/" + record.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("MAINTENANCE_RECORD_NOT_FOUND"));
    }

    /**
     * 存在しない整備記録IDを指定した場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴詳細（記録不存在）：異常系")
    void detail_notFound_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD + "/" + UUID.randomUUID())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("MAINTENANCE_RECORD_NOT_FOUND"));
    }

    /**
     * 登録者本人（OWNER）による整備履歴削除：正常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴削除（登録者本人・OWNER）：正常系")
    void delete_ownRecord_owner_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        MaintenanceRecord record = createMaintenanceRecord(vehicle, ownerUser, null, "エンジンオイル交換");
        UUID recordId = record.getId();

        // Act
        mockMvc.perform(delete(ApiPaths.MAINTENANCE_RECORD + "/" + recordId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isNoContent());

        // Assert：@SQLDeleteのUPDATE文が実際にDBへ実行されることを検証する
        entityManager.flush();
        entityManager.clear();

        Object deletedAt = entityManager
                .createNativeQuery("SELECT deleted_at FROM maintenance_records WHERE id = ?1")
                .setParameter(1, recordId)
                .getSingleResult();
        assertThat(deletedAt).isNotNull();

        assertThat(maintenanceRecordRepository.findById(recordId)).isEmpty();

        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD + "/" + recordId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isNotFound());
    }

    /**
     * 整備履歴を登録していない、車両所有者（OWNER）による削除：異常系。
     *
     * <p>
     * SHOPが登録した履歴を、車両所有者であるOWNERが削除しようとしても、
     * 登録者本人でなければ403になることを検証する（Issueの核心仕様）。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴削除（SHOP登録・OWNER）：異常系（編集権限なし）")
    void delete_shopCreatedRecord_owner_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        User shopUser = findUser(shop);
        Shop shopEntity = shopRepository.findById(shopUser.getId()).orElseThrow();

        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        approveLink(vehicle, shopEntity);
        MaintenanceRecord record = createMaintenanceRecord(vehicle, shopUser, shopEntity, "ブレーキパッド交換");

        // Act & Assert
        mockMvc.perform(delete(ApiPaths.MAINTENANCE_RECORD + "/" + record.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("MAINTENANCE_RECORD_EDIT_NOT_ALLOWED"));

        // 実際には削除されていないことも確認
        assertThat(maintenanceRecordRepository.findById(record.getId())).isPresent();
    }

    /**
     * 存在しない整備記録を削除しようとした場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴削除（記録不存在）：異常系")
    void delete_notFound_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);

        // Act & Assert
        mockMvc.perform(delete(ApiPaths.MAINTENANCE_RECORD + "/" + UUID.randomUUID())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("MAINTENANCE_RECORD_NOT_FOUND"));
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
     * @param workContent   作業内容（アサーションで識別しやすいよう可変にする）
     * @return 保存済みの整備記録エンティティ
     */
    private MaintenanceRecord createMaintenanceRecord(
            Vehicle vehicle, User createdByUser, Shop shop, String workContent) {

        com.pitvia.api.master.entity.MaintenanceType maintenanceType = entityManager
                .createQuery(
                        "SELECT mt FROM com.pitvia.api.master.entity.MaintenanceType mt WHERE mt.code = :code",
                        com.pitvia.api.master.entity.MaintenanceType.class)
                .setParameter("code", "REPAIR")
                .getSingleResult();

        com.pitvia.api.master.entity.MaintenanceCategory category = entityManager
                .createQuery(
                        "SELECT mc FROM com.pitvia.api.master.entity.MaintenanceCategory mc WHERE mc.code = :code",
                        com.pitvia.api.master.entity.MaintenanceCategory.class)
                .setParameter("code", "ENGINE")
                .getSingleResult();

        MaintenanceRecord record = MaintenanceRecord.builder()
                .vehicle(vehicle)
                .createdByUser(createdByUser)
                .shop(shop)
                .title(workContent)
                .maintenanceType(maintenanceType)
                .workDateFrom(java.time.LocalDate.of(2026, 4, 10))
                .mileage(80000)
                .isDraft(false)
                .build();

        MaintenanceWorkItem workItem = MaintenanceWorkItem.builder()
                .maintenanceRecord(record)
                .maintenanceCategory(category)
                .workContent(workContent)
                .performedBy("ガレージ田中")
                .laborCost(java.math.BigDecimal.valueOf(2000))
                .sortOrder(0)
                .build();

        com.pitvia.api.maintenance.entity.MaintenancePart part = com.pitvia.api.maintenance.entity.MaintenancePart
                .builder()
                .maintenanceWorkItem(workItem)
                .partName("オイルフィルター")
                .quantity(java.math.BigDecimal.ONE)
                .unitPrice(java.math.BigDecimal.valueOf(1200))
                .sortOrder(0)
                .build();

        workItem.getParts().add(part);
        record.getWorkItems().add(workItem);

        return maintenanceRecordRepository.save(record);
    }

}
