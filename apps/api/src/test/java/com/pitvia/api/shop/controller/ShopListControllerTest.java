package com.pitvia.api.shop.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;

import com.jayway.jsonpath.JsonPath;
import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.master.repository.ManufacturerRepository;
import com.pitvia.api.master.entity.Manufacturer;
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
 * OWNER向けショップ一覧APIの結合テスト
 *
 * @author pitvia
 * @version 1.0
 */
class ShopListControllerTest extends AbstractIntegrationTest {

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
     * ショップ一覧取得（OWNER）：正常系。
     *
     * <p>
     * 連携中ショップの基本情報（ショップ名・連携車両）が正しく返ることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ一覧取得：正常系")
    void list_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        Shop shopEntity = findShop(shop);

        Vehicle vehicle1 = createVehicle(ownerUser, "RX-7");
        Vehicle vehicle2 = createVehicle(ownerUser, "GT-R");
        approveLink(vehicle1, shopEntity);
        approveLink(vehicle2, shopEntity);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.SHOP)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].shopId").value(shopEntity.getId().toString()))
                .andExpect(jsonPath("$.data.content[0].shopName").value(shopEntity.getUser().getUserName()))
                .andExpect(jsonPath("$.data.content[0].linkedVehicles.length()").value(2))
                .andExpect(jsonPath("$.data.content[0].linkedVehicleCount").value(2))
                .andExpect(jsonPath("$.data.totalElements").value(1));
    }

    /**
     * ショップ一覧取得：複数ショップと連携：正常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ一覧取得（複数ショップ）：正常系")
    void list_multipleShops_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");

        registerLinkedShop("ショップA", vehicle);
        registerLinkedShop("ショップB", vehicle);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.SHOP)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andExpect(jsonPath("$.data.totalElements").value(2));
    }

    /**
     * ショップ一覧取得：keyword検索：正常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ一覧取得（keyword検索）：正常系")
    void list_keyword_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");

        registerLinkedShop("横浜整備工場", vehicle);
        registerLinkedShop("名古屋カスタムショップ", vehicle);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.SHOP)
                .param("keyword", "横浜")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].shopName").value("横浜整備工場"));
    }

    /**
     * ショップ一覧取得：pagination：正常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ一覧取得（pagination）：正常系")
    void list_pagination_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");

        registerLinkedShop("ショップ1", vehicle);
        registerLinkedShop("ショップ2", vehicle);
        registerLinkedShop("ショップ3", vehicle);

        // Act & Assert（1ページ目：2件）
        mockMvc.perform(get(ApiPaths.SHOP)
                .param("page", "1")
                .param("size", "2")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(2))
                .andExpect(jsonPath("$.data.totalElements").value(3))
                .andExpect(jsonPath("$.data.totalPages").value(2));

        // Act & Assert（2ページ目：残り1件）
        mockMvc.perform(get(ApiPaths.SHOP)
                .param("page", "2")
                .param("size", "2")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1));
    }

    /**
     * ショップ一覧取得：同一主要ソート値（承認日時null同士）のショップが複数ある場合の
     * 並び順安定性：正常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ一覧取得（同名・承認日時なし同士の並び順安定性）：正常系")
    void list_tieBreakByShopId_stable() throws Exception {

        // Arrange：同じショップ名・承認日時なし（lastLinkedAt=null同士）のショップを2件作成
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");

        Shop first = registerLinkedShopWithoutApprovedAt("同名テスト", vehicle);
        Shop second = registerLinkedShopWithoutApprovedAt("同名テスト", vehicle);

        // Act：size=1でページを分け、1件ずつ取得する
        var page1 = mockMvc.perform(get(ApiPaths.SHOP)
                .param("page", "1")
                .param("size", "1")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.totalElements").value(2))
                .andExpect(jsonPath("$.data.totalPages").value(2))
                .andReturn();
        String page1ShopId = JsonPath.read(page1.getResponse().getContentAsString(), "$.data.content[0].shopId");

        var page2 = mockMvc.perform(get(ApiPaths.SHOP)
                .param("page", "2")
                .param("size", "1")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andReturn();
        String page2ShopId = JsonPath.read(page2.getResponse().getContentAsString(), "$.data.content[0].shopId");

        // Assert：2ページ分を合わせるとちょうど2件のショップを重複・欠落なく網羅する
        org.assertj.core.api.Assertions.assertThat(java.util.Set.of(page1ShopId, page2ShopId))
                .containsExactlyInAnyOrder(first.getId().toString(), second.getId().toString());

        // Assert：同一条件で再取得しても1ページ目の内容が変わらない（順序の再現性）
        mockMvc.perform(get(ApiPaths.SHOP)
                .param("page", "1")
                .param("size", "1")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].shopId").value(page1ShopId));
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
    @DisplayName("ショップ一覧取得（連携車両4台以上）：正常系")
    void list_linkedVehiclesOverLimit_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        Shop shopEntity = findShop(shop);

        for (int i = 1; i <= 4; i++) {
            Vehicle vehicle = createVehicle(ownerUser, "車両" + i);
            approveLink(vehicle, shopEntity);
        }

        // Act & Assert
        mockMvc.perform(get(ApiPaths.SHOP)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content[0].linkedVehicles.length()").value(3))
                .andExpect(jsonPath("$.data.content[0].linkedVehicleCount").value(4));
    }

    /**
     * SHOPロールがアクセスした場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ一覧取得（SHOPロール）：異常系")
    void list_shopRole_forbidden() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.SHOP)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    /**
     * 未認証状態でアクセスした場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ一覧取得：未認証アクセス時に401エラー")
    void list_unauthenticated() throws Exception {

        // Act & Assert
        mockMvc.perform(get(ApiPaths.SHOP))
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
     * 新規SHOPアカウントを登録し、指定車両とAPPROVED連携する（承認日時は現在時刻）
     *
     * @param userName ショップのユーザー名
     * @param vehicle  連携対象の車両
     * @return 作成したショップエンティティ
     * @throws Exception アカウント登録・ログインに失敗した場合
     */
    private Shop registerLinkedShop(String userName, Vehicle vehicle) throws Exception {
        LoginSession session = testUserHelper.login(
                mockMvc, UserRole.SHOP, "shop-" + UUID.randomUUID() + "@example.com", userName);
        Shop shop = findShop(session);
        approveLink(vehicle, shop);
        return shop;
    }

    /**
     * 新規SHOPアカウントを登録し、指定車両とAPPROVED連携する（承認日時は未設定＝null）
     *
     * <p>
     * 並び順の主要ソートキー（{@code MAX(approvedAt)}）が複数ショップ間で同値（null同士）に
     * なるケースを再現するために使用する。
     * </p>
     *
     * @param userName ショップのユーザー名
     * @param vehicle  連携対象の車両
     * @return 作成したショップエンティティ
     * @throws Exception アカウント登録・ログインに失敗した場合
     */
    private Shop registerLinkedShopWithoutApprovedAt(String userName, Vehicle vehicle) throws Exception {
        LoginSession session = testUserHelper.login(
                mockMvc, UserRole.SHOP, "shop-" + UUID.randomUUID() + "@example.com", userName);
        Shop shop = findShop(session);

        VehicleShopLink link = VehicleShopLink.builder()
                .vehicle(vehicle)
                .shop(shop)
                .status(LinkStatus.APPROVED)
                .build();
        vehicleShopLinkRepository.save(link);

        return shop;
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
     * 車両とショップの間にAPPROVED状態の共有リンクを作成する（承認日時は現在時刻）
     *
     * @param vehicle 対象車両
     * @param shop    対象ショップ
     */
    private void approveLink(Vehicle vehicle, Shop shop) {
        VehicleShopLink link = VehicleShopLink.builder()
                .vehicle(vehicle)
                .shop(shop)
                .status(LinkStatus.APPROVED)
                .approvedAt(Instant.now())
                .build();

        vehicleShopLinkRepository.save(link);
    }

}
