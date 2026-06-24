package com.pitvia.api.auth.constant;

import com.pitvia.api.auth.exception.InvalidJwtException;

/**
 * トークンタイプ
 *
 * @author pitvia
 * @version 1.0
 */
public enum TokenType {

    /**
     * アクセストークン（API認証用）
     */
    ACCESS("access"),

    /**
     * リフレッシュトーケン（トークン更新用）
     */
    REFRESH("refresh");

    /**
     * JWT格納される値
     */
    private final String value;

    TokenType(String value) {
        this.value = value;
    }

    /**
     * JWT用の文字列を取得
     */
    public String value() {
        return this.value;
    }

    /**
     * JWTの値からTokenTypeを取得
     *
     * @param value JWTの文字列值
     * @return TokenType
     */
    public static TokenType from(String value) {
        for (TokenType type : values()) {
            if (type.value.equals(value)) {
                return type;
            }
        }
        throw new InvalidJwtException();
    }

}
