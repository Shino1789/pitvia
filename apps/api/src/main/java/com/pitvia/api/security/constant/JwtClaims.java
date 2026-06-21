package com.pitvia.api.security.constant;

/**
 * JWT ペイロードの中身の各クレーム定義クラス
 *
 * @author pitvia
 * @version 1.0
 */
public final class JwtClaims {

    private JwtClaims() {
        // インスタンス化を防止するためのプライベートコンストラクタ
    }

    /**
     * メールアドレス
     */
    public static final String EMAIL = "email";

    /**
     * ユーザーロール
     */
    public static final String ROLE = "role";

}
