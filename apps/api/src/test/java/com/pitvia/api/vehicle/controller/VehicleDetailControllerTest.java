package com.pitvia.api.vehicle.controller;

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
 * 車両詳細取得・削除APIの結合テスト
 *
 * <p>
 * 画像アップロードを伴わないため、MinIOのTestcontainerは使用しない
 * （{@code VehicleRegisterControllerTest}／{@code VehicleUpdateControllerTest}参照）。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
class VehicleDetailControllerTest extends AbstractIntegrationTest {

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
     * 永続化コンテキストの1次キャッシュに頼らず、実際にDBへSQLがフラッシュされたことを
     * 検証するために使用する（詳細は{@link #delete_ownVehicle_owner_success}参照）
     */
    @PersistenceContext
    private EntityManager entityManager;

    /**
     * OWNER自身の車両詳細取得：正常系。canEditがtrueになることを検証する。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両詳細（自分・OWNER）：正常系")
    void detail_ownVehicle_owner_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");

        // Act & Assert
        mockMvc.perform(get(ApiPaths.VEHICLE + "/" + vehicle.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.modelName").value("RX-7"))
                .andExpect(jsonPath("$.data.canEdit").value(true));
    }

    /**
     * SHOPが連携済み顧客の車両詳細を取得：正常系。閲覧はできるがcanEditはfalseになることを検証する。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両詳細（顧客車両・SHOP）：正常系（閲覧のみ）")
    void detail_customerVehicle_shop_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        User shopUser = findUser(shop);
        Shop shopEntity = shopRepository.findById(shopUser.getId()).orElseThrow();

        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        approveLink(vehicle, shopEntity);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.VEHICLE + "/" + vehicle.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.modelName").value("RX-7"))
                .andExpect(jsonPath("$.data.canEdit").value(false));
    }

    /**
     * SHOPが、車両共有関係の無いオーナーの車両詳細を取得しようとした場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両詳細（顧客車両・共有関係なし）：異常系")
    void detail_customerVehicle_notShared_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7"); // 共有リンクは作成しない

        // Act & Assert
        mockMvc.perform(get(ApiPaths.VEHICLE + "/" + vehicle.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("VEHICLE_NOT_FOUND"));
    }

    /**
     * 存在しない車両IDを指定した場合：異常系。
     *
     * <p>
     * 「共有関係なし」（{@link #detail_customerVehicle_notShared_failure}）と全く同じ
     * ステータス・エラーコードになることを検証し、存在有無を外部から推測できないことを保証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両詳細（車両不存在）：異常系")
    void detail_notFound_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.VEHICLE + "/" + UUID.randomUUID())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.error.code").value("VEHICLE_NOT_FOUND"));
    }

    /**
     * OWNER自身の車両削除：正常系。
     *
     * <p>
     * {@code AbstractIntegrationTest}は{@code @Transactional}でテストメソッド全体を
     * 1つのトランザクションとして扱い、終了時はコミットではなくロールバックされる。
     * そのため、削除予約直後に永続化コンテキストの1次キャッシュ判定だけで
     * {@code findById}がnullを返る挙動に頼ってしまうと、{@code @SQLDelete}のSQLが
     * 実際にDBへ正しくflushされることを検証できない
     * （そのSQLにバグがあっても、flushが発生しない限りテストは気づけない）。
     * そのため本テストでは明示的に{@link EntityManager#flush()}を呼び、
     * {@code @SQLDelete}のUPDATE文が実際にDBへ実行されることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両削除（自分・OWNER）：正常系")
    void delete_ownVehicle_owner_success() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        User ownerUser = findUser(owner);
        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        UUID vehicleId = vehicle.getId();

        // Act
        mockMvc.perform(delete(ApiPaths.VEHICLE + "/" + vehicleId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isNoContent());

        // Assert：永続化コンテキストの1次キャッシュに頼らず、@SQLDeleteのUPDATE文が
        // 実際にDBへ実行されることを検証する（このflush()が、修正前の
        // 「The column index is out of range: 2」を確実に再現・検知するポイントになる）
        entityManager.flush();
        entityManager.clear();

        // deleted_atが実際に設定されていることを、@SQLRestrictionの影響を受けない
        // ネイティブクエリで直接確認する
        Object deletedAt = entityManager
                .createNativeQuery("SELECT deleted_at FROM vehicles WHERE id = ?1")
                .setParameter(1, vehicleId)
                .getSingleResult();
        assertThat(deletedAt).isNotNull();

        // 削除後は通常の検索（@SQLRestriction経由）から取得できないことを確認
        assertThat(vehicleRepository.findById(vehicleId)).isEmpty();

        // APIからも取得できなくなっていることを確認
        mockMvc.perform(get(ApiPaths.VEHICLE + "/" + vehicleId)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isNotFound());
    }

    /**
     * SHOPが、連携済み顧客の車両を削除しようとした場合：異常系。
     *
     * <p>
     * 閲覧はできるが所有者ではないため、404ではなく403になることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両削除（顧客車両・SHOP）：異常系（編集権限なし）")
    void delete_customerVehicle_shop_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User ownerUser = findUser(owner);
        User shopUser = findUser(shop);
        Shop shopEntity = shopRepository.findById(shopUser.getId()).orElseThrow();

        Vehicle vehicle = createVehicle(ownerUser, "RX-7");
        approveLink(vehicle, shopEntity);

        // Act & Assert
        mockMvc.perform(delete(ApiPaths.VEHICLE + "/" + vehicle.getId())
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("VEHICLE_EDIT_NOT_ALLOWED"));
    }

    /**
     * 存在しない車両を削除しようとした場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("車両削除（車両不存在）：異常系")
    void delete_notFound_failure() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);

        // Act & Assert
        mockMvc.perform(delete(ApiPaths.VEHICLE + "/" + UUID.randomUUID())
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

}
