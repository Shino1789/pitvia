package com.pitvia.api.shop.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.assertj.core.data.TemporalUnitWithinOffset;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;

import com.jayway.jsonpath.JsonPath;
import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.shop.entity.Shop;
import com.pitvia.api.shop.entity.ShopInviteCode;
import com.pitvia.api.shop.repository.ShopInviteCodeRepository;
import com.pitvia.api.shop.repository.ShopRepository;
import com.pitvia.api.support.AbstractIntegrationTest;
import com.pitvia.api.support.TestUserHelper.LoginSession;
import com.pitvia.api.user.entity.User;
import com.pitvia.api.user.repository.UserRepository;

/**
 * ショップ招待コードAPIの結合テスト
 *
 * @author pitvia
 * @version 1.0
 */
class ShopInviteCodeControllerTest extends AbstractIntegrationTest {

    private static final String INVITE_CODE_PATH = ApiPaths.SHOP + "/invite-code";

    @Autowired
    private ShopInviteCodeRepository shopInviteCodeRepository;

    @Autowired
    private ShopRepository shopRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * 招待コード発行：正常系。
     *
     * <p>
     * 発行されたコードが「英数字4文字-英数字4文字」形式であり、有効期限が
     * 発行から24時間後になっていることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("招待コード発行：正常系")
    void issue_success() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        Instant beforeRequest = Instant.now();

        // Act & Assert
        var result = mockMvc.perform(post(INVITE_CODE_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.code").value(
                        org.hamcrest.Matchers.matchesPattern("^[A-Z0-9]{4}-[A-Z0-9]{4}$")))
                .andExpect(jsonPath("$.data.expiresAt").exists())
                .andReturn();

        String expiresAtStr = JsonPath.read(result.getResponse().getContentAsString(), "$.data.expiresAt");
        Instant expiresAt = Instant.parse(expiresAtStr);

        // 発行から24時間後（前後1分の許容）になっていることを確認
        assertThat(expiresAt).isCloseTo(
                beforeRequest.plus(24, ChronoUnit.HOURS),
                new TemporalUnitWithinOffset(1, ChronoUnit.MINUTES));
    }

    /**
     * 招待コード取得：正常系。
     *
     * <p>
     * 発行直後にGETすると、発行したコードがそのまま取得できることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("招待コード取得：正常系")
    void get_success() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);

        var issueResult = mockMvc.perform(post(INVITE_CODE_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isCreated())
                .andReturn();
        String issuedCode = JsonPath.read(issueResult.getResponse().getContentAsString(), "$.data.code");

        // Act & Assert
        mockMvc.perform(get(INVITE_CODE_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code").value(issuedCode));
    }

    /**
     * 招待コード取得：有効なコードが存在しない場合は{@code data}がnull：正常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("招待コード取得（未発行）：正常系")
    void get_noActiveCode_success() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);

        // Act & Assert
        mockMvc.perform(get(INVITE_CODE_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    /**
     * 招待コード再発行：正常系。
     *
     * <p>
     * 再発行すると新しいコードが発行され、旧コードとは異なる値になることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("招待コード再発行：正常系")
    void reissue_success() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);

        var firstResult = mockMvc.perform(post(INVITE_CODE_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isCreated())
                .andReturn();
        String firstCode = JsonPath.read(firstResult.getResponse().getContentAsString(), "$.data.code");

        // Act
        var secondResult = mockMvc.perform(post(INVITE_CODE_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isCreated())
                .andReturn();
        String secondCode = JsonPath.read(secondResult.getResponse().getContentAsString(), "$.data.code");

        // Assert
        assertThat(secondCode).isNotEqualTo(firstCode);

        // GETで取得できるのは再発行後のコードのみであること（旧コードは失効している）
        mockMvc.perform(get(INVITE_CODE_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.code").value(secondCode));
    }

    /**
     * 再発行前のコードが失効すること：正常系。
     *
     * <p>
     * 再発行後、DB上の旧コードレコードの{@code revokedAt}が設定されていることを直接検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("招待コード再発行：旧コードが失効すること")
    void reissue_revokesPreviousCode() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        User shopUser = userRepository.findByEmail(shop.email()).orElseThrow();

        var firstResult = mockMvc.perform(post(INVITE_CODE_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isCreated())
                .andReturn();
        String firstCode = JsonPath.read(firstResult.getResponse().getContentAsString(), "$.data.code");

        // Act
        mockMvc.perform(post(INVITE_CODE_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isCreated());

        // Assert
        ShopInviteCode firstEntity = shopInviteCodeRepository.findAll().stream()
                .filter(entity -> entity.getCode().equals(firstCode))
                .findFirst()
                .orElseThrow();

        assertThat(firstEntity.getRevokedAt()).isNotNull();
        assertThat(firstEntity.getShop().getId()).isEqualTo(shopUser.getId());
    }

    /**
     * 期限切れコードが残っている状態でGETしても、有効なコードとしては返らないこと：正常系。
     *
     * <p>
     * {@code revokedAt IS NULL}のまま有効期限だけが切れているレコードをDBへ直接投入し、
     * GETの判定が失効フラグだけでなく有効期限も考慮していることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("招待コード取得（期限切れ）：有効コードとして返らないこと")
    void get_expiredCode_notReturned() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        Shop shopEntity = findShop(shop);
        insertExpiredCode(shopEntity, "EXPI-RED1");

        // Act & Assert
        mockMvc.perform(get(INVITE_CODE_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data").doesNotExist());
    }

    /**
     * 期限切れだが失効していないコードが残っていても、新規発行できること：正常系。
     *
     * <p>
     * {@code WHERE revoked_at IS NULL}の部分一意インデックスと矛盾しないよう、
     * 発行時は有効期限切れかどうかを問わず無条件で既存コードを失効させてから
     * 新規発行する実装になっていることを検証する。
     * </p>
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("招待コード発行（期限切れコードが残存）：正常系")
    void issue_withExpiredRemainingCode_success() throws Exception {

        // Arrange
        LoginSession shop = testUserHelper.loginShop(mockMvc);
        Shop shopEntity = findShop(shop);
        insertExpiredCode(shopEntity, "EXPI-RED2");

        // Act & Assert（一意制約違反にならず、新しいコードが発行できること）
        mockMvc.perform(post(INVITE_CODE_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + shop.accessToken()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.data.code").value(org.hamcrest.Matchers.not("EXPI-RED2")));

        ShopInviteCode expiredEntity = shopInviteCodeRepository.findAll().stream()
                .filter(entity -> entity.getCode().equals("EXPI-RED2"))
                .findFirst()
                .orElseThrow();
        assertThat(expiredEntity.getRevokedAt()).isNotNull();
    }

    /**
     * OWNERロールがGETした場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("招待コード取得（OWNERロール）：異常系")
    void get_ownerRole_forbidden() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);

        // Act & Assert
        mockMvc.perform(get(INVITE_CODE_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    /**
     * OWNERロールがPOSTした場合：異常系。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("招待コード発行（OWNERロール）：異常系")
    void issue_ownerRole_forbidden() throws Exception {

        // Arrange
        LoginSession owner = testUserHelper.loginOwner(mockMvc);

        // Act & Assert
        mockMvc.perform(post(INVITE_CODE_PATH)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + owner.accessToken()))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.error.code").value("FORBIDDEN"));
    }

    /**
     * ログインセッションからショップエンティティを取得する
     *
     * @param session ログインセッション情報
     * @return ショップエンティティ
     */
    private Shop findShop(LoginSession session) {
        User user = userRepository.findByEmail(session.email()).orElseThrow();
        return shopRepository.findByUser_Id(user.getId()).orElseThrow();
    }

    /**
     * {@code revokedAt IS NULL}のまま有効期限だけが過去のコードを直接DBへ投入する
     * （通常のAPI経由では作れない状態を再現するためのテスト用ヘルパー）
     *
     * @param shop 対象ショップ
     * @param code 投入するコード値
     */
    private void insertExpiredCode(Shop shop, String code) {
        ShopInviteCode expired = ShopInviteCode.builder()
                .shop(shop)
                .code(code)
                .expiresAt(Instant.now().minus(1, ChronoUnit.HOURS))
                .build();

        shopInviteCodeRepository.save(expired);
    }

}
