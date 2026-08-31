package com.pitvia.api.auth.controller;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.MediaType;

import com.pitvia.api.auth.constant.CookieConstants;
import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.support.AbstractIntegrationTest;
import com.pitvia.api.support.TestUserHelper;
import com.pitvia.api.support.TestUserHelper.LoginSession;

/**
 * 認証・認可APIの結合テスト
 *
 * @author pitvia
 * @version 1.0
 */
class AuthControllerTest extends AbstractIntegrationTest {

    /**
     * 新規アカウント登録（/auth/register）の正常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("アカウント登録：正常系")
    void register_success() throws Exception {

        // Arrange
        String email = "register-" + UUID.randomUUID() + "@example.com";

        String registerJson = """
                {
                    "role":"%s",
                    "userName":"direct-register-user",
                    "email":"%s",
                    "password":"%s",
                    "confirmPassword":"%s"
                }
                """.formatted(
                UserRole.SHOP.name(),
                email,
                TestUserHelper.PASSWORD,
                TestUserHelper.PASSWORD);

        // Act & Assert
        mockMvc.perform(post(ApiPaths.AUTH + "/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(registerJson))
                .andExpect(status().isCreated());
    }

    /**
     * ログイン認証（/auth/login）の正常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ログイン：正常系")
    void login_success() throws Exception {

        // Arrange
        String email = "login-" + UUID.randomUUID() + "@example.com";

        testUserHelper.register(
                mockMvc,
                UserRole.OWNER,
                email,
                "owner-user");

        String loginJson = """
                {
                    "email":"%s",
                    "password":"%s"
                }
                """.formatted(email, TestUserHelper.PASSWORD);

        // Act & Assert
        var result = mockMvc.perform(post(ApiPaths.AUTH + "/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(loginJson))
                .andExpect(status().isOk())
                .andExpect(cookie().exists(CookieConstants.REFRESH_TOKEN))
                .andExpect(cookie().httpOnly(CookieConstants.REFRESH_TOKEN, true))
                .andExpect(jsonPath("$.data.accessToken").exists())
                .andReturn();

        assertNotNull(result.getResponse().getCookie(CookieConstants.REFRESH_TOKEN));
        assertEquals(
                CookieConstants.REFRESH_TOKEN,
                result.getResponse().getCookie(CookieConstants.REFRESH_TOKEN).getName());
    }

    /**
     * トークンリフレッシュ（/auth/refresh）の正常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("リフレッシュ：正常系")
    void refresh_success() throws Exception {

        // Arrange
        LoginSession session = testUserHelper.loginShop(mockMvc);

        // Act & Assert
        mockMvc.perform(post(ApiPaths.AUTH + "/refresh")
                .cookie(session.cookie()))
                .andExpect(status().isOk())
                .andExpect(cookie().exists(CookieConstants.REFRESH_TOKEN))
                .andExpect(jsonPath("$.data.accessToken").exists());
    }

    /**
     * ログアウト（/auth/logout）の正常系テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ログアウト：正常系")
    void logout_success() throws Exception {

        // Arrange
        LoginSession session = testUserHelper.loginOwner(mockMvc);

        // Act & Assert
        mockMvc.perform(post(ApiPaths.AUTH + "/logout")
                .cookie(session.cookie()))
                .andExpect(status().isOk())
                .andExpect(cookie().maxAge(CookieConstants.REFRESH_TOKEN, 0));
    }

}
