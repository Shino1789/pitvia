package com.pitvia.api.auth.exception;

/**
 * JWT不正例外
 *
 * @author pitvia
 * @version 1.0
 */
public class InvalidJwtException extends RuntimeException {

    /**
     * デフォルト
     */
    public InvalidJwtException() {
        super("JWTが不正です。");
    }

    /**
     * 原因となった元の例外（JJWTライブラリの例外など）を指定
     *
     * @param cause 原因となった元の例外
     */
    public InvalidJwtException(Throwable cause) {
        super("JWTが不正です。", cause);
    }

}
