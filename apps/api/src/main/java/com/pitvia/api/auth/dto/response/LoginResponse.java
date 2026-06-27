package com.pitvia.api.auth.dto.response;

import java.util.UUID;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.auth.model.LoginResult;

/**
 * ログイン成功時のレスポンスDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record LoginResponse(

        /**
         * ユーザーID
         */
        UUID userId,

        /**
         * ユーザー名
         */
        String userName,

        /**
         * ユーザー権限
         */
        UserRole role,

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
                result.userId(),
                result.userName(),
                result.role(),
                result.accessToken());
    }

}
