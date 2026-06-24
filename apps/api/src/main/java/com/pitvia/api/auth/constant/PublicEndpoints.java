package com.pitvia.api.auth.constant;

import com.pitvia.api.common.constant.ApiPaths;

/**
 * 公開エンドポイントのパス定義クラス
 *
 * @author pitvia
 * @version 1.0
 */
public final class PublicEndpoints {

    private PublicEndpoints() {
        // インスタンス化を防止するためのプライベートコンストラクタ
    }

    /**
     * 常に公開するパスの配列
     */
    public static final String[] PUBLIC_URLS = {
            ApiPaths.HEALTH,
            ApiPaths.AUTH + "/**"
    };

    /**
     * Swagger・APIドキュメントのパスの配列
     */
    public static final String[] SWAGGER_URLS = {
            ApiPaths.SWAGGER + "/**",
            ApiPaths.API_DOCS + "/**"
    };
}
