package com.pitvia.api.maintenance.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;

import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.maintenance.entity.MaintenanceRecord;
import com.pitvia.api.maintenance.repository.MaintenanceRecordRepository;
import com.pitvia.api.master.entity.Manufacturer;
import com.pitvia.api.master.entity.MaintenanceType;
import com.pitvia.api.master.repository.ManufacturerRepository;
import com.pitvia.api.master.repository.MaintenanceTypeRepository;
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

/**
 * 整備履歴一覧APIの結合テスト
 *
 * @author pitvia
 * @version 1.0
 */
class MaintenanceRecordControllerTest extends AbstractIntegrationTest {

    @Autowired
    private MaintenanceRecordRepository maintenanceRecordRepository;

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private VehicleShopLinkRepository vehicleShopLinkRepository;

    @Autowired
    private ManufacturerRepository manufacturerRepository;

    @Autowired
    private MaintenanceTypeRepository maintenanceTypeRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    /**
     * 自分自身の整備履歴一覧取得（OWNER）：正常系。
     *
     * <p>
     * 自分の車両分の整備履歴のみが返り、他人の整備履歴が混入しないことを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（自分・OWNER）：正常系")
    void list_ownRecords_owner_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession otherOwner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        User otherUser = findUser(otherOwner);

        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");
        createRecord(vehicle, ownerUser, null, "エンジンオイル交換", "PERIODIC_MAINTENANCE",
                LocalDate.of(2026, 5, 1), 85000);

        Vehicle otherVehicle = createVehicle(otherUser, "S2000", "AP1");
        createRecord(otherVehicle, otherUser, null, "他人の整備履歴", "REPAIR",
                LocalDate.of(2026, 5, 1), 30000);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.owner").doesNotExist())
                .andExpect(jsonPath("$.data.records.content.length()").value(1))
                .andExpect(jsonPath("$.data.records.content[0].title").value("エンジンオイル交換"))
                .andExpect(jsonPath("$.data.records.content[0].vehicleModelName").value("RX-7"))
                .andExpect(jsonPath("$.data.records.content[0].vehicleModelCode").value("FD3S"));
    }

    /**
     * 自分自身の整備履歴一覧取得（SHOP）：正常系。
     *
     * <p>
     * SHOP自身が所有する車両（自社デモカー等）の整備履歴も、OWNERと同じ条件で取得できることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（自分・SHOP）：正常系")
    void list_ownRecords_shop_success() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User shopUser = findUser(shop);

        Vehicle demoCar = createVehicle(shopUser, "デモカー", null);
        createRecord(demoCar, shopUser, null, "デモカー整備", "INSPECTION",
                LocalDate.of(2026, 4, 1), 5000);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.owner").doesNotExist())
                .andExpect(jsonPath("$.data.records.content.length()").value(1))
                .andExpect(jsonPath("$.data.records.content[0].title").value("デモカー整備"));
    }

    /**
     * vehicleId指定・自分の車両：正常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（vehicleId指定・自分の車両）：正常系")
    void list_byVehicle_own_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);

        Vehicle vehicle = createVehicle(ownerUser, "GT-R", "R32");
        createRecord(vehicle, ownerUser, null, "ECUセッティング", "SETTING",
                LocalDate.of(2026, 5, 10), 89120);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .param("vehicleId", vehicle.getId().toString())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.owner").doesNotExist())
                .andExpect(jsonPath("$.data.records.content.length()").value(1))
                .andExpect(jsonPath("$.data.records.content[0].vehicleModelName").value("GT-R"));
    }

    /**
     * vehicleId指定・SHOPが共有している車両：正常系。
     *
     * <p>
     * レスポンスの{@code owner}にオーナー情報が設定されることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（vehicleId指定・共有車両）：正常系（SHOP）")
    void list_byVehicle_sharedByShop_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        User shopUser = findUser(shop);
        Shop shopEntity = shopRepository.findById(shopUser.getId()).orElseThrow();

        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");
        approveLink(vehicle, shopEntity);
        createRecord(vehicle, ownerUser, shopEntity, "エアコンコンプレッサー修理", "REPAIR",
                LocalDate.of(2026, 4, 10), 87200);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .param("vehicleId", vehicle.getId().toString())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.owner.id").value(ownerUser.getId().toString()))
                .andExpect(jsonPath("$.data.records.content.length()").value(1))
                .andExpect(jsonPath("$.data.records.content[0].shopName").value(shopUser.getUserName()));
    }

    /**
     * vehicleId指定・未共有車両：異常系。
     *
     * <p>
     * 車両自体は実在するが、SHOPとの共有（APPROVED状態のリンク）が無いケース。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（vehicleId指定・未共有車両）：異常系")
    void list_byVehicle_notShared_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S"); // 共有リンクを作成しない

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .param("vehicleId", vehicle.getId().toString())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("VEHICLE_NOT_FOUND"));
    }

    /**
     * vehicleId指定・存在しない車両：異常系。
     *
     * <p>
     * 「未共有車両」（{@link #list_byVehicle_notShared_failure}）と全く同じ
     * ステータス・エラーコードになることを検証し、存在有無を外部から推測できないことを保証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（vehicleId指定・車両不存在）：異常系")
    void list_byVehicle_notFound_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .param("vehicleId", UUID.randomUUID().toString())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("VEHICLE_NOT_FOUND"));
    }

    /**
     * ownerId指定・SHOPが共有している顧客：正常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（ownerId指定・共有顧客）：正常系（SHOP）")
    void list_byOwner_sharedCustomer_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        User shopUser = findUser(shop);
        Shop shopEntity = shopRepository.findById(shopUser.getId()).orElseThrow();

        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");
        approveLink(vehicle, shopEntity);
        createRecord(vehicle, ownerUser, shopEntity, "法定点検", "INSPECTION",
                LocalDate.of(2026, 4, 28), 88850);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .param("ownerId", ownerUser.getId().toString())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.owner.id").value(ownerUser.getId().toString()))
                .andExpect(jsonPath("$.data.owner.userName").value(ownerUser.getUserName()))
                .andExpect(jsonPath("$.data.records.content.length()").value(1))
                .andExpect(jsonPath("$.data.records.content[0].title").value("法定点検"));
    }

    /**
     * ownerId指定・共有関係なし：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（ownerId指定・共有関係なし）：異常系")
    void list_byOwner_notShared_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");
        createRecord(vehicle, ownerUser, null, "オーナー自身の整備", "REPAIR",
                LocalDate.of(2026, 4, 1), 10000); // 共有リンクを作成しない

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .param("ownerId", ownerUser.getId().toString())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("VEHICLE_OWNER_NOT_FOUND"));
    }

    /**
     * OWNERがownerIdパラメータを指定した場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（OWNERがownerId指定）：異常系")
    void list_ownerSpecifiesOwnerId_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .param("ownerId", UUID.randomUUID().toString())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("OWNER_ID_NOT_ALLOWED"));
    }

    /**
     * vehicleIdとownerIdが同時に指定された場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（vehicleId・ownerId同時指定）：異常系")
    void list_vehicleIdAndOwnerIdConflict_failure() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .param("vehicleId", UUID.randomUUID().toString())
                .param("ownerId", UUID.randomUUID().toString())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VEHICLE_ID_OWNER_ID_CONFLICT"));
    }

    /**
     * keyword検索：正常系。
     *
     * <p>
     * 整備タイトルの部分一致（大文字小文字を区別しない）で絞り込まれることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（keyword検索）：正常系")
    void list_keywordSearch_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");

        createRecord(vehicle, ownerUser, null, "エンジンオイル＆フィルター交換", "PERIODIC_MAINTENANCE",
                LocalDate.of(2026, 5, 1), 85000);
        createRecord(vehicle, ownerUser, null, "ECUセッティング", "SETTING",
                LocalDate.of(2026, 5, 2), 85100);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .param("keyword", "オイル")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.records.content.length()").value(1))
                .andExpect(jsonPath("$.data.records.content[0].title").value("エンジンオイル＆フィルター交換"));
    }

    /**
     * 整備種別の単一絞り込み：正常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（整備種別単一絞り込み）：正常系")
    void list_maintenanceTypeSingleFilter_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");

        createRecord(vehicle, ownerUser, null, "修理その1", "REPAIR", LocalDate.of(2026, 5, 1), 85000);
        createRecord(vehicle, ownerUser, null, "点検その1", "INSPECTION", LocalDate.of(2026, 5, 2), 85100);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .param("maintenanceType", "REPAIR")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.records.content.length()").value(1))
                .andExpect(jsonPath("$.data.records.content[0].maintenanceType").value("REPAIR"));
    }

    /**
     * 整備種別の複数絞り込み：正常系。
     *
     * <p>
     * 複数指定時はOR条件で絞り込まれることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（整備種別複数絞り込み）：正常系")
    void list_maintenanceTypeMultipleFilter_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");

        createRecord(vehicle, ownerUser, null, "修理その1", "REPAIR", LocalDate.of(2026, 5, 1), 85000);
        createRecord(vehicle, ownerUser, null, "カスタムその1", "CUSTOM", LocalDate.of(2026, 5, 2), 85100);
        createRecord(vehicle, ownerUser, null, "点検その1", "INSPECTION", LocalDate.of(2026, 5, 3), 85200);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .param("maintenanceType", "REPAIR", "CUSTOM")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.records.content.length()").value(2))
                .andExpect(jsonPath("$.data.records.content[*].maintenanceType").value(
                        org.hamcrest.Matchers.containsInAnyOrder("REPAIR", "CUSTOM")));
    }

    /**
     * 並び替え（作業日昇順・降順）：正常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（並び替え：作業日昇順・降順）：正常系")
    void list_sort_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");

        createRecord(vehicle, ownerUser, null, "古い整備", "REPAIR", LocalDate.of(2026, 1, 1), 80000);
        createRecord(vehicle, ownerUser, null, "新しい整備", "REPAIR", LocalDate.of(2026, 5, 1), 85000);

        // Act & Assert：デフォルト（未指定）は作業日が新しい順
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.records.content[0].title").value("新しい整備"))
                .andExpect(jsonPath("$.data.records.content[1].title").value("古い整備"));

        // Act & Assert：作業日が古い順
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .param("sort", "WORK_DATE_ASC")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.records.content[0].title").value("古い整備"))
                .andExpect(jsonPath("$.data.records.content[1].title").value("新しい整備"));
    }

    /**
     * ページング：正常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（ページング）：正常系")
    void list_pagination_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");

        for (int i = 0; i < 15; i++) {
            createRecord(vehicle, ownerUser, null, "整備" + i, "REPAIR",
                    LocalDate.of(2026, 1, 1).plusDays(i), 80000 + i);
        }

        // Act & Assert：1ページ目（10件、totalElements=15、totalPages=2）
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .param("page", "1")
                .param("size", "10")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.records.content.length()").value(10))
                .andExpect(jsonPath("$.data.records.page").value(1))
                .andExpect(jsonPath("$.data.records.size").value(10))
                .andExpect(jsonPath("$.data.records.totalElements").value(15))
                .andExpect(jsonPath("$.data.records.totalPages").value(2));

        // Act & Assert：2ページ目（残り5件）
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .param("page", "2")
                .param("size", "10")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.records.content.length()").value(5))
                .andExpect(jsonPath("$.data.records.page").value(2));
    }

    /**
     * 下書き（isDraft=true）の整備履歴は一覧に含まれないことを検証する。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（下書き除外）：正常系")
    void list_excludesDraftRecords_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7", "FD3S");

        createRecord(vehicle, ownerUser, null, "本登録済み整備", "REPAIR", LocalDate.of(2026, 5, 1), 85000);
        createDraftRecord(vehicle, ownerUser, "下書き整備", "REPAIR", LocalDate.of(2026, 5, 2), 85100);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.records.content.length()").value(1))
                .andExpect(jsonPath("$.data.records.content[0].title").value("本登録済み整備"));
    }

    /**
     * 未認証アクセス：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("整備履歴一覧（未認証）：異常系")
    void list_unauthenticated_failure() throws Exception {

        // Act & Assert
        mockMvc.perform(get(ApiPaths.MAINTENANCE_RECORD))
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
     * テスト用の整備記録を最小限の必須項目で作成・保存する（本登録）
     *
     * @param vehicle      対象車両
     * @param createdBy    記録作成者
     * @param shop         整備を実施したショップ（DIYの場合はnull）
     * @param title        整備タイトル
     * @param typeCode     整備種別コード
     * @param workDateFrom 作業開始日
     * @param mileage      作業時点の走行距離
     * @return 保存済みの整備記録エンティティ
     */
    private MaintenanceRecord createRecord(
            Vehicle vehicle, User createdBy, Shop shop, String title, String typeCode,
            LocalDate workDateFrom, int mileage) {
        return saveRecord(vehicle, createdBy, shop, title, typeCode, workDateFrom, mileage, false);
    }

    /**
     * テスト用の下書き整備記録を作成・保存する
     *
     * @param vehicle      対象車両
     * @param createdBy    記録作成者
     * @param title        整備タイトル
     * @param typeCode     整備種別コード
     * @param workDateFrom 作業開始日
     * @param mileage      作業時点の走行距離
     * @return 保存済みの整備記録エンティティ
     */
    private MaintenanceRecord createDraftRecord(
            Vehicle vehicle, User createdBy, String title, String typeCode,
            LocalDate workDateFrom, int mileage) {
        return saveRecord(vehicle, createdBy, null, title, typeCode, workDateFrom, mileage, true);
    }

    /**
     * @see #createRecord(Vehicle, User, Shop, String, String, LocalDate, int)
     */
    private MaintenanceRecord saveRecord(
            Vehicle vehicle, User createdBy, Shop shop, String title, String typeCode,
            LocalDate workDateFrom, int mileage, boolean isDraft) {

        MaintenanceType type = maintenanceTypeRepository.findByCode(typeCode).orElseThrow();

        MaintenanceRecord record = MaintenanceRecord.builder()
                .vehicle(vehicle)
                .createdByUser(createdBy)
                .shop(shop)
                .title(title)
                .maintenanceType(type)
                .workDateFrom(workDateFrom)
                .mileage(mileage)
                .isDraft(isDraft)
                .build();

        return maintenanceRecordRepository.save(record);
    }

}
