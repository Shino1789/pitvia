package com.pitvia.api.customer.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.LocalDate;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;

import com.jayway.jsonpath.JsonPath;
import com.pitvia.api.auth.constant.UserRole;
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
 * 顧客一覧APIの結合テスト
 *
 * @author pitvia
 * @version 1.0
 */
class CustomerListControllerTest extends AbstractIntegrationTest {

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private VehicleShopLinkRepository vehicleShopLinkRepository;

    @Autowired
    private ManufacturerRepository manufacturerRepository;

    @Autowired
    private MaintenanceTypeRepository maintenanceTypeRepository;

    @Autowired
    private MaintenanceRecordRepository maintenanceRecordRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    /**
     * 顧客一覧取得（SHOP）：正常系。
     *
     * <p>
     * 連携中オーナーの基本情報（氏名・連携車両・最終整備日）が正しく返ることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("顧客一覧取得：正常系")
    void list_success() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        Shop shopEntity = findShop(shop);
        User ownerUser = findUser(owner);

        Vehicle vehicle1 = createVehicle(ownerUser, "RX-7");
        Vehicle vehicle2 = createVehicle(ownerUser, "GT-R");
        approveLink(vehicle1, shopEntity);
        approveLink(vehicle2, shopEntity);

        createShopRecord(vehicle1, ownerUser, shopEntity, LocalDate.of(2026, 5, 1));

        // Act & Assert
        mockMvc.perform(get(ApiPaths.CUSTOMER)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].ownerId").value(ownerUser.getId().toString()))
                .andExpect(jsonPath("$.data.content[0].ownerName").value(ownerUser.getUserName()))
                .andExpect(jsonPath("$.data.content[0].lastMaintenanceDate").value("2026-05-01"))
                .andExpect(jsonPath("$.data.content[0].linkedVehicles.length()").value(2))
                .andExpect(jsonPath("$.data.content[0].linkedVehicleCount").value(2))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    /**
     * 顧客一覧取得：keyword検索：正常系。
     *
     * <p>
     * 顧客名（ユーザー名）の部分一致で絞り込めることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("顧客一覧取得（keyword検索）：正常系")
    void list_keyword_success() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        Shop shopEntity = findShop(shop);

        User tanaka = registerLinkedOwner("田中健太", shopEntity, "RX-7");
        registerLinkedOwner("佐藤美咲", shopEntity, "S2000");

        // Act & Assert
        mockMvc.perform(get(ApiPaths.CUSTOMER)
                .param("keyword", "田中")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].ownerId").value(tanaka.getId().toString()));
    }

    /**
     * 顧客一覧取得：pagination：正常系。
     *
     * <p>
     * 全件が整備履歴を持たない（{@code lastMaintenanceDate}が全てnull）状態にすることで
     * 第二ソート条件（ユーザー名昇順）を安定させ、ページごとの内容を検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("顧客一覧取得（pagination）：正常系")
    void list_pagination_success() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        Shop shopEntity = findShop(shop);

        registerLinkedOwner("顧客A", shopEntity, "RX-7");
        registerLinkedOwner("顧客B", shopEntity, "GT-R");
        registerLinkedOwner("顧客C", shopEntity, "S2000");

        // Act & Assert（1ページ目：2件）
        mockMvc.perform(get(ApiPaths.CUSTOMER)
                .param("page", "1")
                .param("size", "2")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andExpect(jsonPath("$.data.content[0].ownerName").value("顧客A"))
                .andExpect(jsonPath("$.data.content[1].ownerName").value("顧客B"))
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.totalPages").value(2));

        // Act & Assert（2ページ目：残り1件）
        mockMvc.perform(get(ApiPaths.CUSTOMER)
                .param("page", "2")
                .param("size", "2")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].ownerName").value("顧客C"));
    }

    /**
     * 顧客一覧取得：同姓同名かつlastMaintenanceDateも同一（null同士）の場合の並び順安定性：正常系。
     *
     * <p>
     * ORDER BYの第三条件（owner.id）により、最終整備日・ユーザー名が完全に一致する顧客が
     * 複数存在してもページ境界で重複・欠落せず、同一条件での再取得時も同じ順序になることを
     * 検証する（Postgres側のUUID比較結果をJava側で予測せず、ページングの一貫性そのものを見る）。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("顧客一覧取得（同姓同名・同一lastMaintenanceDateの並び順安定性）：正常系")
    void list_tieBreakByOwnerId_stable() throws Exception {

        // Arrange：同じユーザー名・整備履歴なし（lastMaintenanceDate=null同士）のオーナーを2人作成
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        Shop shopEntity = findShop(shop);

        User first = registerLinkedOwner("同姓同名テスト", shopEntity, "RX-7");
        User second = registerLinkedOwner("同姓同名テスト", shopEntity, "GT-R");

        // Act：size=1でページを分け、1件ずつ取得する
        var page1 = mockMvc.perform(get(ApiPaths.CUSTOMER)
                .param("page", "1")
                .param("size", "1")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.totalPages").value(2))
                .andReturn();
        String page1OwnerId = JsonPath.read(page1.getResponse().getContentAsString(), "$.data.content[0].ownerId");

        var page2 = mockMvc.perform(get(ApiPaths.CUSTOMER)
                .param("page", "2")
                .param("size", "1")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        String page2OwnerId = JsonPath.read(page2.getResponse().getContentAsString(), "$.data.content[0].ownerId");

        // Assert：2ページ分を合わせるとちょうど2人のオーナーを重複・欠落なく網羅する
        org.assertj.core.api.Assertions.assertThat(java.util.Set.of(page1OwnerId, page2OwnerId))
                .containsExactlyInAnyOrder(first.getId().toString(), second.getId().toString());

        // Assert：同一条件で再取得しても1ページ目の内容が変わらない（順序の再現性）
        mockMvc.perform(get(ApiPaths.CUSTOMER)
                .param("page", "1")
                .param("size", "1")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].ownerId").value(page1OwnerId));
    }

    /**
     * 連携車両が4台以上：正常系。
     *
     * <p>
     * {@code linkedVehicles}は最大3件に切り詰められ、{@code linkedVehicleCount}は
     * 実際の連携車両総数（4件）になることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("顧客一覧取得（連携車両4台以上）：正常系")
    void list_linkedVehiclesOverLimit_success() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        Shop shopEntity = findShop(shop);
        User ownerUser = findUser(owner);

        for (int i = 1; i <= 4; i++) {
            Vehicle vehicle = createVehicle(ownerUser, "車両" + i);
            approveLink(vehicle, shopEntity);
        }

        // Act & Assert
        mockMvc.perform(get(ApiPaths.CUSTOMER)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].linkedVehicles.length()").value(3))
                .andExpect(jsonPath("$.data.content[0].linkedVehicleCount").value(4));
    }

    /**
     * lastMaintenanceDateの算出範囲：正常系。
     *
     * <p>
     * 「ログインショップ自身が実施した整備履歴」に限定されることを検証する。
     * DIY整備・別ショップ実施の整備履歴の方が日付が新しくても、それらは対象に含まれない。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("顧客一覧取得（lastMaintenanceDateはログインショップ自身の実施分のみ）：正常系")
    void list_lastMaintenanceDate_scopedToOwnShop_success() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        LoginSession otherShop = testUserHelper.loginShop(mockMvc);
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        Shop shopEntity = findShop(shop);
        Shop otherShopEntity = findShop(otherShop);
        User ownerUser = findUser(owner);

        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        approveLink(vehicle, shopEntity);
        approveLink(vehicle, otherShopEntity);

        // ログインショップ自身の実施分（最も古い日付）
        createShopRecord(vehicle, ownerUser, shopEntity, LocalDate.of(2026, 3, 1));
        // DIY整備（shop=null、日付はより新しい）
        createDiyRecord(vehicle, ownerUser, LocalDate.of(2026, 6, 1));
        // 別ショップの実施分（日付はより新しい）
        createShopRecord(vehicle, ownerUser, otherShopEntity, LocalDate.of(2026, 7, 1));

        // Act & Assert
        mockMvc.perform(get(ApiPaths.CUSTOMER)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].lastMaintenanceDate").value("2026-03-01"));
    }

    /**
     * lastMaintenanceDateが存在しない場合：正常系。
     *
     * <p>
     * ログインショップ自身が実施した整備履歴が1件も無い場合はnullになることを検証する
     * （DIY整備履歴は存在するが、それはlastMaintenanceDateの対象に含まれない）。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("顧客一覧取得（lastMaintenanceDateが無い場合はnull）：正常系")
    void list_lastMaintenanceDate_null_success() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        Shop shopEntity = findShop(shop);
        User ownerUser = findUser(owner);

        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        approveLink(vehicle, shopEntity);
        createDiyRecord(vehicle, ownerUser, LocalDate.of(2026, 6, 1));

        // Act & Assert
        mockMvc.perform(get(ApiPaths.CUSTOMER)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].lastMaintenanceDate").doesNotExist());
    }

    /**
     * 連携関係の無いオーナーは顧客一覧に出ないこと：正常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("顧客一覧取得（連携関係なしのオーナーは含まれない）：正常系")
    void list_excludesUnlinkedOwner_success() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        LoginSession linkedOwner = testUserHelper.loginOwner(mockMvc);
        LoginSession unlinkedOwner = testUserHelper.loginOwner(mockMvc);
        Shop shopEntity = findShop(shop);
        User linkedOwnerUser = findUser(linkedOwner);
        User unlinkedOwnerUser = findUser(unlinkedOwner);

        Vehicle linkedVehicle = createVehicle(linkedOwnerUser, "RX-7");
        approveLink(linkedVehicle, shopEntity);
        createVehicle(unlinkedOwnerUser, "GT-R"); // 連携リンクは作成しない

        // Act & Assert
        mockMvc.perform(get(ApiPaths.CUSTOMER)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].ownerId").value(linkedOwnerUser.getId().toString()));
    }

    /**
     * OWNERロールがアクセスした場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("顧客一覧取得（OWNERロール）：異常系")
    void list_ownerRole_forbidden() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.CUSTOMER)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    /**
     * 未認証状態でアクセスした場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("顧客一覧取得：未認証アクセス時に401エラー")
    void list_unauthenticated() throws Exception {

        // Act & Assert
        mockMvc.perform(get(ApiPaths.CUSTOMER))
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
     * ログインセッションからショップエンティティを取得する
     *
     * @param session ログインセッション情報
     * @return ショップエンティティ
     */
    private Shop findShop(LoginSession session) {
        return shopRepository.findByUser_Id(findUser(session).getId()).orElseThrow();
    }

    /**
     * 新規OWNERアカウントを登録し、車両を1台登録したうえで、指定ショップとAPPROVED連携する
     *
     * @param userName  オーナーのユーザー名
     * @param shop      連携先ショップ
     * @param modelName 登録する車両の車種名
     * @return 作成したオーナーのユーザーエンティティ
     * @throws Exception アカウント登録・ログインに失敗した場合
     */
    private User registerLinkedOwner(String userName, Shop shop, String modelName) throws Exception {
        LoginSession session = testUserHelper.login(
                mockMvc, UserRole.OWNER, "owner-" + UUID.randomUUID() + "@example.com", userName);
        User user = findUser(session);
        Vehicle vehicle = createVehicle(user, modelName);
        approveLink(vehicle, shop);
        return user;
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
     * 指定ショップが実施した整備記録を作成・保存する
     *
     * @param vehicle      対象車両
     * @param createdBy    記録作成者（ショップユーザー）
     * @param shop         実施ショップ
     * @param workDateFrom 作業開始日
     * @return 保存済みの整備記録エンティティ
     */
    private MaintenanceRecord createShopRecord(Vehicle vehicle, User createdBy, Shop shop, LocalDate workDateFrom) {
        return saveRecord(vehicle, shop.getUser(), shop, workDateFrom);
    }

    /**
     * DIY（ショップなし）の整備記録を作成・保存する
     *
     * @param vehicle      対象車両
     * @param createdBy    記録作成者（オーナーユーザー）
     * @param workDateFrom 作業開始日
     * @return 保存済みの整備記録エンティティ
     */
    private MaintenanceRecord createDiyRecord(Vehicle vehicle, User createdBy, LocalDate workDateFrom) {
        return saveRecord(vehicle, createdBy, null, workDateFrom);
    }

    /**
     * @see #createShopRecord(Vehicle, User, Shop, LocalDate)
     */
    private MaintenanceRecord saveRecord(Vehicle vehicle, User createdBy, Shop shop, LocalDate workDateFrom) {
        MaintenanceType type = maintenanceTypeRepository.findByCode("PERIODIC_MAINTENANCE").orElseThrow();

        MaintenanceRecord record = MaintenanceRecord.builder()
                .vehicle(vehicle)
                .createdByUser(createdBy)
                .shop(shop)
                .title("整備")
                .maintenanceType(type)
                .workDateFrom(workDateFrom)
                .mileage(10000)
                .isDraft(false)
                .build();

        return maintenanceRecordRepository.save(record);
    }

}
