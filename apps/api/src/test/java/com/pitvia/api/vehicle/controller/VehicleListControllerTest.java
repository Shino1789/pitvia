package com.pitvia.api.vehicle.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;

import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.master.entity.Manufacturer;
import com.pitvia.api.master.repository.ManufacturerRepository;
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
import com.pitvia.api.shop.entity.Shop;
import com.pitvia.api.shop.repository.ShopRepository;

/**
 * 車両一覧APIの結合テスト
 *
 * @author pitvia
 * @version 1.0
 */
class VehicleListControllerTest extends AbstractIntegrationTest {

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
     * ログインユーザー自身の車両一覧取得（OWNER）：正常系。
     *
     * <p>
     * 自分の車両のみが返り、他人の車両が混入しないことを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両一覧（自分・OWNER）：正常系")
    void list_ownVehicles_owner_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession otherOwner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        User otherUser = findUser(otherOwner);

        createVehicle(ownerUser, "RX-7");
        createVehicle(ownerUser, "GT-R");
        createVehicle(otherUser, "S2000");

        // Act & Assert
        mockMvc.perform(get(ApiPaths.VEHICLE)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.owner").doesNotExist())
                .andExpect(jsonPath("$.data.vehicles.length()").value(2))
                .andExpect(jsonPath("$.data.vehicles[*].modelName").value(
                        org.hamcrest.Matchers.containsInAnyOrder("RX-7", "GT-R")));
    }

    /**
     * ログインユーザー自身の車両一覧取得（SHOP）：正常系。
     *
     * <p>
     * SHOP自身が所有する車両（自社デモカー等）も、OWNERと同じ条件で取得できることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両一覧（自分・SHOP）：正常系")
    void list_ownVehicles_shop_success() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User shopUser = findUser(shop);
        createVehicle(shopUser, "デモカー");

        // Act & Assert
        mockMvc.perform(get(ApiPaths.VEHICLE)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.owner").doesNotExist())
                .andExpect(jsonPath("$.data.vehicles.length()").value(1))
                .andExpect(jsonPath("$.data.vehicles[0].modelName").value("デモカー"));
    }

    /**
     * SHOPが特定顧客の共有車両一覧を取得：正常系。
     *
     * <p>
     * ownerId・オーナー表示名がレスポンスへ正しく含まれることも合わせて検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両一覧（顧客車両・SHOP）：正常系")
    void list_customerVehicles_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        User shopUser = findUser(shop);
        Shop shopEntity = shopRepository.findById(shopUser.getId()).orElseThrow();

        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        approveLink(vehicle, shopEntity);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.VEHICLE)
                .param("ownerId", ownerUser.getId().toString())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.owner.id").value(ownerUser.getId().toString()))
                .andExpect(jsonPath("$.data.owner.userName").value(ownerUser.getUserName()))
                .andExpect(jsonPath("$.data.vehicles.length()").value(1))
                .andExpect(jsonPath("$.data.vehicles[0].modelName").value("RX-7"));
    }

    /**
     * SHOPが、車両共有関係の無いオーナーを指定した場合：異常系。
     *
     * <p>
     * オーナー自体・車両自体は実在するが、SHOPとの共有（APPROVED状態のリンク）が
     * 無いケース。単純に空配列を返すのではなく404になることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両一覧（顧客車両・共有関係なし）：異常系")
    void list_customerVehicles_notShared_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        createVehicle(ownerUser, "RX-7"); // 車両は存在するが、共有リンクを作成しない

        // Act & Assert
        mockMvc.perform(get(ApiPaths.VEHICLE)
                .param("ownerId", ownerUser.getId().toString())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("VEHICLE_OWNER_NOT_FOUND"));
    }

    /**
     * SHOPが、存在しないownerIdを指定した場合：異常系。
     *
     * <p>
     * 「共有関係なし」（{@link #list_customerVehicles_notShared_failure}）と全く同じ
     * ステータス・エラーコードになることを検証し、存在有無を外部から推測できないことを保証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両一覧（顧客車両・オーナー不存在）：異常系")
    void list_customerVehicles_ownerNotFound_failure() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.VEHICLE)
                .param("ownerId", UUID.randomUUID().toString())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("VEHICLE_OWNER_NOT_FOUND"));
    }

    /**
     * OWNERがownerIdパラメータを指定した場合：異常系。
     *
     * <p>
     * ownerIdはSHOP専用パラメータのため、OWNERが指定した場合は400になることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両一覧（OWNERがownerId指定）：異常系")
    void list_ownerSpecifiesOwnerId_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.VEHICLE)
                .param("ownerId", UUID.randomUUID().toString())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.error.code").value("OWNER_ID_NOT_ALLOWED"));
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

}
