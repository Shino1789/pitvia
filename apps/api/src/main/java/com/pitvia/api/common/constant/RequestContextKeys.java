package com.pitvia.api.common.constant;

/**
 * リクエストコンテキストに関する共通キー（HTTPヘッダ、リクエスト属性、MDCキーなど）を管理する定数クラス。
 *
 * @author pitvia
 * @version 1.0
 */
public final class RequestContextKeys {

    private RequestContextKeys() {
        // インスタンス化を防止するためのプライベートコンストラクタ
    }

    /**
     * クライアントや外部システムとの間でやり取りするレスポンスヘッダ名。
     */
    public static final String REQUEST_ID_HEADER = "X-Request-Id";

    /**
     * リクエストIDのリクエスト属性キー。
     */
    public static final String REQUEST_ID_ATTRIBUTE = "requestId";

    /**
     * リクエストIDをMDCへ格納する際のキー
     */
    public static final String MDC_REQUEST_ID = "requestId";

    /**
     * HTTPメソッドをMDCへ格納する際のキー
     */
    public static final String MDC_METHOD = "method";

    /**
     * リクエストパスをMDCへ格納する際のキー
     */
    public static final String MDC_PATH = "path";

}
