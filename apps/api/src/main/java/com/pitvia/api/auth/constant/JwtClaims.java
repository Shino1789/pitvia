package com.pitvia.api.auth.constant;

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
     * トークンタイプ
     */
    public static final String TOKEN_TYPE = "type";

    /**
     * ユーザーロール
     */
    public static final String ROLE = "role";

}
