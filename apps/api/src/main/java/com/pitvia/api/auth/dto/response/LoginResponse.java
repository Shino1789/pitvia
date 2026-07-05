package com.pitvia.api.auth.dto.response;

import com.pitvia.api.auth.model.LoginResult;
import com.pitvia.api.user.dto.response.UserResponse;

/**
 * ログイン成功時のレスポンスDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record LoginResponse(

        /**
         * ユーザー情報
         */
        UserResponse user,

        /**
         * アクセストークン（JWT）
         */
        String accessToken) {

    /**
     * ログイン処理結果モデルからレスポンスDTOを生成する。
     *
     * @param result ログイン処理結果
     * @return ログイン成功レスポンスDTO
     */
    public static LoginResponse from(LoginResult result) {
        return new LoginResponse(
                UserResponse.from(result.user()),
                result.accessToken());
    }

}
