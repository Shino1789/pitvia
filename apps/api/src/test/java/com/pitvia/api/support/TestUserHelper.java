package com.pitvia.api.support;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.UUID;

import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.test.web.servlet.MockMvc;

import com.pitvia.api.auth.constant.CookieConstants;
import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.common.constant.ApiPaths;

import jakarta.servlet.http.Cookie;

/**
 * テスト用ユーザー操作を提供するヘルパークラス
 *
 * @author pitvia
 * @version 1.0
 */
@Component
public class TestUserHelper {

    /**
     * テストユーザー共通パスワード
     */
    public static final String PASSWORD = "Password123";

    /**
     * ログイン結果（テスト用セッション情報）
     *
     * @param email  ログインしたユーザーのメールアドレス
     * @param cookie レスポンスから取得したリフレッシュトークンCookie
     * @param role   ユーザーロール
     */
    public record LoginSession(String email, Cookie cookie, UserRole role) {
    }

    /**
     * SHOPユーザーでアカウント登録およびログインを行う
     *
     * @param mockMvc MockMvcインスタンス
     * @return SHOPユーザーのログインセッション情報
     * @throws Exception リクエスト実行時に例外が発生した場合
     */
    public LoginSession loginShop(MockMvc mockMvc) throws Exception {
        return login(mockMvc, UserRole.SHOP, generateEmail("shop"), "shop-user");
    }

    /**
     * OWNERユーザーでアカウント登録およびログインを行う
     *
     * @param mockMvc MockMvcインスタンス
     * @return OWNERユーザーのログインセッション情報
     * @throws Exception リクエスト実行時に例外が発生した場合
     */
    public LoginSession loginOwner(MockMvc mockMvc) throws Exception {
        return login(mockMvc, UserRole.OWNER, generateEmail("owner"), "owner-user");
    }

    /**
     * 指定されたロール、メールアドレス、ユーザー名でアカウントを登録し、ログインを実行する
     *
     * @param mockMvc  MockMvcインスタンス
     * @param role     ユーザーロール
     * @param email    メールアドレス
     * @param userName ユーザー名
     * @return 生成されたログインセッション情報
     * @throws Exception リクエスト実行時、またはステータス検証（200 OK / 201 Created）に失敗した場合
     */
    public LoginSession login(MockMvc mockMvc, UserRole role, String email, String userName) throws Exception {

        register(mockMvc, role, email, userName);

        String loginJson = """
                {
                    "email":"%s",
                    "password":"%s"
                }
                """.formatted(email, PASSWORD);

        var result = mockMvc
                .perform(post(ApiPaths.AUTH + "/login").contentType(MediaType.APPLICATION_JSON).content(loginJson))
                .andExpect(status().isOk())
                .andReturn();

        Cookie cookie = result.getResponse().getCookie(CookieConstants.REFRESH_TOKEN);
        return new LoginSession(email, cookie, role);
    }

    /**
     * 指定された情報をもとに、アカウント登録（/auth/register）リクエストをシミュレートする。
     *
     * @param mockMvc  MockMvcインスタンス
     * @param role     登録するユーザー権限ロール
     * @param email    登録するメールアドレス
     * @param userName 登録するユーザー名
     * @throws Exception リクエスト実行時、またはステータス検証（201 Created）に失敗した場合
     */
    public void register(MockMvc mockMvc, UserRole role, String email, String userName) throws Exception {
        String registerJson = """
                {
                    "role":"%s",
                    "userName":"%s",
                    "email":"%s",
                    "password":"%s",
                    "confirmPassword":"%s"
                }
                """.formatted(role.name(), userName, email, PASSWORD, PASSWORD);

        mockMvc.perform(post(ApiPaths.AUTH + "/register").contentType(MediaType.APPLICATION_JSON).content(registerJson))
                .andExpect(status().isCreated());
    }

    /**
     * テストごとに一意となるランダムなメールアドレスを生成する。
     *
     * @param prefix メールアドレスの接頭辞
     * @return 生成された一意のメールアドレス（例: shop-xxxx-xxxx...@example.com）
     */
    private String generateEmail(String prefix) {
        return "%s-%s@example.com".formatted(prefix, UUID.randomUUID());
    }

}
