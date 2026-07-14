package com.pitvia.api.common.constant;

/**
 * APIパス定義クラス
 *
 * @author pitvia
 * @version 1.0
 */
public final class ApiPaths {

    private ApiPaths() {
        // インスタンス化を防止するためのプライベートコンストラクタ
    }

    /** Base Path */
    public static final String BASE_PATH = "/api";

    /** API Version 1 */
    public static final String V1 = "/v1";

    /** ヘルスチェックエンドポイント */
    public static final String HEALTH = V1 + "/health";

    /** 認証系エンドポイントのプレフィックス */
    public static final String AUTH = V1 + "/auth";

    /** ダッシュボードエンドポイントのプレフィックス */
    public static final String DASHBOARD = V1 + "/dashboard";

    /** Swagger UI 画面パス */
    public static final String SWAGGER = "/swagger-ui";

    /** OpenAPI ドキュメントJSONパス */
    public static final String API_DOCS = "/v3/api-docs";

}
