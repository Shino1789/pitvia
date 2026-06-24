package com.pitvia.api.auth.principal;

import com.pitvia.api.auth.constant.UserRole;

/**
 * 認証済みユーザーの情報を保持するクラス
 *
 * @author pitvia
 * @version 1.0
 */
public record JwtPrincipal(

        /**
         * ユーザーID
         */
        Long userId,

        /**
         * ユーザー権限
         */
        UserRole role) {
}
