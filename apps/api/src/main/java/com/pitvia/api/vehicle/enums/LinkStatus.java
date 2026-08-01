package com.pitvia.api.vehicle.enums;

/**
 * 車両とショップの連携ステータスを定義する列挙型
 *
 * @author pitvia
 * @version 1.0
 */
public enum LinkStatus {

    /** 申請中 / 承認待ち */
    PENDING,

    /** 連携承認済み */
    APPROVED,

    /** 拒否 */
    REJECTED
}
