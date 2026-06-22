package com.pitvia.api.auth.constant;

import lombok.Getter;

/**
 * ユーザーロール
 *
 * @author pitvia
 * @version 1.0
 */
@Getter
public enum UserRole {

    /**
     * オーナー権限
     */
    OWNER("ROLE_OWNER"),

    /**
     * 整備ショップ権限
     */
    SHOP("ROLE_SHOP"),

    /**
     * 管理者権限
     */
    ADMIN("ROLE_ADMIN");

    /**
     * Spring Securityが認識するプレフィックス（ROLE_）付きの権限文字列
     */
    private final String authority;

    UserRole(String authority) {
        this.authority = authority;
    }

}
