package com.pitvia.api.common.factory;

import java.time.OffsetDateTime;
import java.util.List;

import org.springframework.stereotype.Component;

import com.pitvia.api.common.constant.RequestContextKeys;
import com.pitvia.api.common.dto.response.ApiResponse;
import com.pitvia.api.common.dto.response.ErrorBody;
import com.pitvia.api.common.dto.response.ErrorResponse;
import com.pitvia.api.common.dto.response.Meta;
import com.pitvia.api.common.dto.response.ValidationError;
import com.pitvia.api.common.exception.ErrorCode;

import jakarta.servlet.http.HttpServletRequest;

/**
 * APIレスポンス生成ファクトリ
 *
 * @author pitvia
 * @version 1.0
 */
@Component
public class ResponseFactory {

    /**
     * 正常系レスポンス生成
     *
     * @param request HTTPリクエスト
     * @param data    レスポンスデータ
     * @param <T>     レスポンスデータ型
     * @return 正常レスポンス
     */
    public <T> ApiResponse<T> success(HttpServletRequest request, T data) {

        return new ApiResponse<>(createMeta(request), data);
    }

    /**
     * エラーレスポンスを生成（デフォルトメッセージ）
     *
     * @param errorCode エラーコード
     * @param request   HTTPリクエスト
     * @return エラーレスポンス
     */
    public ErrorResponse error(ErrorCode errorCode, HttpServletRequest request) {

        return createErrorResponse(errorCode, errorCode.getDefaultMessage(), null, request);
    }

    /**
     * エラーレスポンスを生成（カスタムメッセージ）
     *
     * @param errorCode エラーコード
     * @param message   クライアント向けメッセージ
     * @param request   HTTPリクエスト
     * @return エラーレスポンス
     */
    public ErrorResponse error(ErrorCode errorCode, String message, HttpServletRequest request) {

        return createErrorResponse(errorCode, message, null, request);
    }

    /**
     * バリデーションエラーレスポンスを生成（デフォルトメッセージ）
     *
     * @param validationErrors バリデーションエラー詳細
     * @param request          HTTPリクエスト
     * @return バリデーションエラーレスポンス
     */
    public ErrorResponse validationError(List<ValidationError> validationErrors, HttpServletRequest request) {

        return createErrorResponse(ErrorCode.VALIDATION_ERROR, ErrorCode.VALIDATION_ERROR.getDefaultMessage(),
                validationErrors,
                request);
    }

    /**
     * バリデーションエラーレスポンス生成（カスタムメッセージ）
     *
     * @param message          クライアント向けメッセージ
     * @param validationErrors バリデーションエラー詳細
     * @param request          HTTPリクエスト
     * @return バリデーションエラーレスポンス
     */
    public ErrorResponse validationError(String message, List<ValidationError> validationErrors,
            HttpServletRequest request) {

        return createErrorResponse(ErrorCode.VALIDATION_ERROR, message, validationErrors, request);
    }

    /**
     * エラーレスポンス生成の共通処理
     *
     * @param errorCode エラーコード
     * @param message   クライアント向けメッセージ
     * @param validationErrors   バリデーションエラー詳細
     * @param request   HTTPリクエスト
     * @return エラーレスポンス
     */
    private ErrorResponse createErrorResponse(ErrorCode errorCode, String message, List<ValidationError> validationErrors,
            HttpServletRequest request) {

        return new ErrorResponse(
                createMeta(request),
                new ErrorBody(
                        request.getRequestURI(),
                        errorCode.name(),
                        message,
                        validationErrors));
    }

    /**
     * メタ情報生成
     *
     * @param request HTTPリクエスト
     * @return メタ情報
     */
    private Meta createMeta(HttpServletRequest request) {

        return new Meta((String) request.getAttribute(RequestContextKeys.REQUEST_ID_ATTRIBUTE), OffsetDateTime.now());
    }

}
