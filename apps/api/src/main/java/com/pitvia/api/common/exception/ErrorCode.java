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
    VALIDATION_ERROR("入力値に誤りがあります"),

    /**
     * JSONパースエラー
     */
    MALFORMED_JSON("JSON形式が不正です"),

    /**
     * 未認証エラー（401）
     */
    UNAUTHORIZED("認証が必要です"),

    /**
     * 権限不足エラー（403）
     */
    FORBIDDEN("この操作を実行する権限がありません"),

    /**
     * リソース未検出エラー（404）
     */
    RESOURCE_NOT_FOUND("リソースが見つかりません"),

    /**
     * 想定外エラー
     */
    INTERNAL_SERVER_ERROR("予期しないエラーが発生しました"),

    /**
     * 不正なロール指定
     */
    INVALID_ROLE("不正なロールが指定されました"),

    /**
     * ユーザーが存在しない
     */
    USER_NOT_FOUND("ユーザーが存在しません"),

    /**
     * ユーザーが既に存在する
     */
    USER_ALREADY_EXISTS("ユーザーは既に存在します"),

    /**
     * 認証情報の不一致
     */
    INVALID_CREDENTIALS("ログインIDまたはパスワードが正しくありません");

    /**
     * クライアント向けデフォルトメッセージ
     */
    private final String defaultMessage;

    ErrorCode(String message) {
        this.defaultMessage = message;
    }

}
