package com.pitvia.api.common.constant;

/**
 * ページング等のデータ取得件数を管理するクラス
 *
 * @author pitvia
 * @version 1.0
 */
public final class PageConstants {

    private PageConstants() {
        // インスタンス化を防止するためのプライベートコンストラクタ
    }

    /** ダッシュボード最近の整備履歴 */
    public static final int DASHBOARD_RECENT_MAINTENANCE_SIZE = 3;

    /** 顧客一覧における連携車両の表示件数上限 */
    public static final int CUSTOMER_LINKED_VEHICLE_DISPLAY_SIZE = 3;

    /** ショップ一覧における連携車両の表示件数上限 */
    public static final int SHOP_LINKED_VEHICLE_DISPLAY_SIZE = 3;

}
