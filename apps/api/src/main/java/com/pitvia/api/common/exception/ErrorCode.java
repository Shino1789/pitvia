package com.pitvia.api.common.exception;

import lombok.Getter;

/**
 * 業務エラーコード定義
 *
 * クライアントへ返却するエラーコードおよびメッセージを管理する。
 *
 * @author pitvia
 * @version 1.0
 */
@Getter
public enum ErrorCode {

    /**
     * バリデーションエラー
     */
    VALIDATION_ERROR(
            "VALIDATION_ERROR",
            "入力値に誤りがあります"),

    /**
     * 想定外エラー
     */
    INTERNAL_SERVER_ERROR(
            "INTERNAL_SERVER_ERROR",
            "予期しないエラーが発生しました"),

    /**
     * ユーザーが存在しない
     */
    USER_NOT_FOUND(
            "USER_NOT_FOUND",
            "ユーザーが存在しません"),

    /**
     * ユーザーが既に存在する
     */
    USER_ALREADY_EXISTS(
            "USER_ALREADY_EXISTS",
            "ユーザーは既に存在します");

    /**
     * クライアント向けエラーコード
     */
    private final String code;

    /**
     * クライアント向けメッセージ
     */
    private final String message;

    ErrorCode(String code, String message) {
        this.code = code;
        this.message = message;
    }

}
