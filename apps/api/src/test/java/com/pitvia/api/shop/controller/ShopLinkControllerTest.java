package com.pitvia.api.shop.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;

import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.master.entity.Manufacturer;
import com.pitvia.api.master.repository.ManufacturerRepository;
import com.pitvia.api.shop.entity.Shop;
import com.pitvia.api.shop.entity.ShopInviteCode;
import com.pitvia.api.shop.repository.ShopInviteCodeRepository;
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
 * OWNERによるショップ連携（招待コード入力）APIの結合テスト
 *
 * @author pitvia
 * @version 1.0
 */
class ShopLinkControllerTest extends AbstractIntegrationTest {

    private static final String LINK_PATH = ApiPaths.SHOP + "/link";

    @Autowired
    private VehicleRepository vehicleRepository;

    @Autowired
    private VehicleShopLinkRepository vehicleShopLinkRepository;

    @Autowired
    private ShopInviteCodeRepository shopInviteCodeRepository;

    @Autowired
    private ManufacturerRepository manufacturerRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private ShopRepository shopRepository;

    /**
     * ショップ連携：正常系。
     *
     * <p>
     * OWNERが自分の車両と、SHOPが発行した有効な招待コードで連携できること、作成された
     * {@code VehicleShopLink}のDB上の状態（status=APPROVED、approvedAtが設定され、
     * inviteCodeがクリアされていること）を検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ連携：正常系")
    void link_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        Shop shopEntity = findShop(shop);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        ShopInviteCode inviteCode = insertActiveCode(shopEntity, "LINK-0001");

        Instant beforeRequest = Instant.now();

        // Act & Assert
        mockMvc.perform(post(LINK_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .content(linkRequestJson(vehicle.getId(), inviteCode.getCode()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.shopId").value(shopEntity.getId().toString()))
                .andExpect(jsonPath("$.data.shopName").value(shopEntity.getUser().getUserName()))
                .andExpect(jsonPath("$.data.vehicleId").value(vehicle.getId().toString()))
                .andExpect(jsonPath("$.data.status").value("APPROVED"))
                .andExpect(jsonPath("$.data.approvedAt").exists());

        // Assert：DB上のVehicleShopLinkの状態を直接検証
        VehicleShopLink link = vehicleShopLinkRepository.findAll().stream()
                .filter(l -> l.getVehicle().getId().equals(vehicle.getId()))
                .findFirst()
                .orElseThrow();

        assertThat(link.getStatus()).isEqualTo(LinkStatus.APPROVED);
        assertThat(link.getShop().getId()).isEqualTo(shopEntity.getId());
        assertThat(link.getApprovedAt()).isAfterOrEqualTo(beforeRequest);
        assertThat(link.getInviteCode()).isNull();
    }

    /**
     * ショップ連携：正常連携後、ショップ一覧に反映されること：正常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ連携：正常連携後にショップ一覧へ反映されること")
    void link_success_reflectedInShopList() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        Shop shopEntity = findShop(shop);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        ShopInviteCode inviteCode = insertActiveCode(shopEntity, "LINK-0002");

        // Act
        mockMvc.perform(post(LINK_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .content(linkRequestJson(vehicle.getId(), inviteCode.getCode()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isCreated());

        // Assert
        mockMvc.perform(get(ApiPaths.SHOP)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.content.length()").value(1))
                .andExpect(jsonPath("$.data.content[0].shopId").value(shopEntity.getId().toString()));
    }

    /**
     * ショップ連携：他人の車両IDを指定した場合：異常系。
     *
     * <p>
     * 車両が存在しない場合と区別せず404を返す既存の車両アクセス制御方針を踏襲していることを
     * 検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ連携（他人の車両ID）：異常系")
    void link_otherOwnersVehicle_notFound() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession otherOwner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User otherOwnerUser = findUser(otherOwner);
        Shop shopEntity = findShop(shop);
        Vehicle othersVehicle = createVehicle(otherOwnerUser, "GT-R");
        ShopInviteCode inviteCode = insertActiveCode(shopEntity, "LINK-0003");

        // Act & Assert
        mockMvc.perform(post(LINK_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .content(linkRequestJson(othersVehicle.getId(), inviteCode.getCode()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("VEHICLE_NOT_FOUND"));
    }

    /**
     * ショップ連携：存在しない招待コードを指定した場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ連携（存在しない招待コード）：異常系")
    void link_codeNotFound_invalid() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");

        // Act & Assert
        mockMvc.perform(post(LINK_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .content(linkRequestJson(vehicle.getId(), "NOPE-0000"))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INVITE_CODE"));
    }

    /**
     * ショップ連携：期限切れの招待コードを指定した場合：異常系。
     *
     * <p>
     * 存在しない招待コードの場合と同一のエラーコード（{@code INVALID_INVITE_CODE}）になり、
     * 区別されないことを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ連携（期限切れ招待コード）：異常系")
    void link_expiredCode_invalid() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        Shop shopEntity = findShop(shop);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        ShopInviteCode expired = insertExpiredCode(shopEntity, "LINK-0004");

        // Act & Assert
        mockMvc.perform(post(LINK_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .content(linkRequestJson(vehicle.getId(), expired.getCode()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INVITE_CODE"));
    }

    /**
     * ショップ連携：失効済みの招待コードを指定した場合：異常系。
     *
     * <p>
     * 期限切れ・存在しないコードの場合と同一のエラーコード（{@code INVALID_INVITE_CODE}）に
     * なり、区別されないことを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ連携（失効済み招待コード）：異常系")
    void link_revokedCode_invalid() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        Shop shopEntity = findShop(shop);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        ShopInviteCode revoked = insertRevokedCode(shopEntity, "LINK-0005");

        // Act & Assert
        mockMvc.perform(post(LINK_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .content(linkRequestJson(vehicle.getId(), revoked.getCode()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("INVALID_INVITE_CODE"));
    }

    /**
     * ショップ連携：既に連携済みの車両×ショップの組み合わせを指定した場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ連携（既に連携済み）：異常系")
    void link_alreadyLinked_conflict() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        Shop shopEntity = findShop(shop);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        approveLink(vehicle, shopEntity);
        ShopInviteCode inviteCode = insertActiveCode(shopEntity, "LINK-0006");

        // Act & Assert
        mockMvc.perform(post(LINK_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .content(linkRequestJson(vehicle.getId(), inviteCode.getCode()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.error.code").value("SHOP_ALREADY_LINKED"))
                .andExpect(jsonPath("$.error.message").value("この車両は既にこのショップと連携済みです"));
    }

    /**
     * 同じショップと別の車両を連携する場合：正常系。
     *
     * <p>
     * 重複判定は「車両×ショップ」の組み合わせ単位であり、既に連携済みのショップであっても、
     * 別の車両であれば連携できること（エラーメッセージが示す意味と実際の判定条件の一致）を検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ連携（同じショップと別の車両）：正常系")
    void link_sameShopDifferentVehicle_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        Shop shopEntity = findShop(shop);
        Vehicle linkedVehicle = createVehicle(ownerUser, "RX-7");
        Vehicle anotherVehicle = createVehicle(ownerUser, "GT-R");
        approveLink(linkedVehicle, shopEntity);
        ShopInviteCode inviteCode = insertActiveCode(shopEntity, "LINK-0007");

        // Act & Assert
        mockMvc.perform(post(LINK_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .content(linkRequestJson(anotherVehicle.getId(), inviteCode.getCode()))
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.vehicleId").value(anotherVehicle.getId().toString()));
    }

    /**
     * SHOPロールがアクセスした場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ連携（SHOPロール）：異常系")
    void link_shopRole_forbidden() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);

        // Act & Assert
        mockMvc.perform(post(LINK_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .content(linkRequestJson(UUID.randomUUID(), "ANY-0000"))
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
    @DisplayName("ショップ連携：未認証アクセス時に401エラー")
    void link_unauthenticated() throws Exception {

        // Act & Assert
        mockMvc.perform(post(LINK_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .content(linkRequestJson(UUID.randomUUID(), "ANY-0000")))
                .andExpect(status().isUnauthorized());
    }

    /**
     * リクエストのバリデーションエラー：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ショップ連携（バリデーションエラー）：異常系")
    void link_validationError() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        String invalidJson = """
                {
                  "vehicleId": null,
                  "inviteCode": ""
                }
                """;

        // Act & Assert
        mockMvc.perform(post(LINK_PATH)
                .contentType(MediaType.APPLICATION_JSON)
                .content(invalidJson)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("VALIDATION_ERROR"))
                .andExpect(jsonPath("$.error.validationErrors.length()").value(2));
    }

    /**
     * ショップ連携リクエストのJSONボディを組み立てる
     *
     * @param vehicleId  対象車両ID
     * @param inviteCode 招待コード
     * @return リクエストJSON文字列
     */
    private String linkRequestJson(UUID vehicleId, String inviteCode) {
        return """
                {
                  "vehicleId": "%s",
                  "inviteCode": "%s"
                }
                """.formatted(vehicleId, inviteCode);
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
     * 車両とショップの間にAPPROVED状態の共有リンクを直接作成する（事前に連携済み状態を作る用途）
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

    /**
     * 現在有効な招待コードをDBへ直接投入する
     *
     * @param shop 対象ショップ
     * @param code 投入するコード値
     * @return 保存済みの招待コードエンティティ
     */
    private ShopInviteCode insertActiveCode(Shop shop, String code) {
        ShopInviteCode active = ShopInviteCode.builder()
                .shop(shop)
                .code(code)
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .build();

        return shopInviteCodeRepository.save(active);
    }

    /**
     * {@code revokedAt IS NULL}のまま有効期限だけが過去の招待コードをDBへ直接投入する
     * （通常のAPI経由では作れない状態を再現するためのテスト用ヘルパー）
     *
     * @param shop 対象ショップ
     * @param code 投入するコード値
     * @return 保存済みの招待コードエンティティ
     */
    private ShopInviteCode insertExpiredCode(Shop shop, String code) {
        ShopInviteCode expired = ShopInviteCode.builder()
                .shop(shop)
                .code(code)
                .expiresAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .build();

        return shopInviteCodeRepository.save(expired);
    }

    /**
     * 失効済み（{@code revokedAt}が設定済み）の招待コードをDBへ直接投入する
     *
     * @param shop 対象ショップ
     * @param code 投入するコード値
     * @return 保存済みの招待コードエンティティ
     */
    private ShopInviteCode insertRevokedCode(Shop shop, String code) {
        ShopInviteCode revoked = ShopInviteCode.builder()
                .shop(shop)
                .code(code)
                .expiresAt(Instant.now().plus(24, ChronoUnit.HOURS))
                .build();
        revoked.revoke();

        return shopInviteCodeRepository.save(revoked);
    }

}
