package com.pitvia.api.maintenance.constant;

/**
 * 整備履歴一覧の並び替え条件
 *
 * @author pitvia
 * @version 1.0
 */
public enum MaintenanceRecordSort {

    /**
     * 作業日が新しい順（デフォルト）
     */
    WORK_DATE_DESC,

    /**
     * 作業日が古い順
     */
    WORK_DATE_ASC,

}
