package com.pitvia.api.common.exception;

import lombok.Getter;
import org.springframework.http.HttpStatus;

/**
 * 業務例外
 *
 * @author pitvia
 * @version 1.0
 */
@Getter
public class BusinessException extends RuntimeException {

    /**
     * エラーコード
     */
    private final ErrorCode errorCode;

    /**
     * レスポンスで返却するHTTPステータス
     */
    private final HttpStatus status;

    /**
     * HTTP 400(Bad Request) の業務例外を生成する。
     *
     * @param errorCode エラーコード
     */
    public BusinessException(ErrorCode errorCode) {

        this(errorCode, HttpStatus.BAD_REQUEST);

    }

    /**
     * 指定されたHTTPステータスで業務例外を生成する（デフォルトメッセージ）
     *
     * @param errorCode エラーコード
     * @param status    HTTPステータス
     */
    public BusinessException(ErrorCode errorCode, HttpStatus status) {

        super(errorCode.getDefaultMessage());

        this.errorCode = errorCode;
        this.status = status;
    }

    /**
     * 指定されたHTTPステータスで業務例外を生成する（カスタムメッセージ）
     *
     * @param errorCode エラーコード
     * @param message   メッセージ
     * @param status    HTTPステータス
     */
    public BusinessException(ErrorCode errorCode, String message, HttpStatus status) {

        super(message);

        this.errorCode = errorCode;
        this.status = status;
    }

}
