package com.pitvia.api.common.factory;

import com.pitvia.api.common.dto.response.ApiResponse;
import com.pitvia.api.common.dto.response.ErrorBody;
import com.pitvia.api.common.dto.response.ErrorResponse;
import com.pitvia.api.common.dto.response.Meta;
import com.pitvia.api.common.dto.response.ValidationError;
import com.pitvia.api.common.filter.RequestIdFilter;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.List;

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
     * 異常系レスポンス生成
     *
     * @param code    エラーコード
     * @param message クライアント向けメッセージ
     * @param request HTTPリクエスト
     * @return 異常系レスポンス
     */
    public ErrorResponse error(String code, String message, HttpServletRequest request) {

        return error(code, message, List.of(), request);
    }

    /**
     * バリデーションエラーレスポンス生成
     *
     * @param code    エラーコード
     * @param message クライアント向けメッセージ
     * @param details バリデーションエラー詳細
     * @param request HTTPリクエスト
     * @return バリデーションエラーレスポンス
     */
    public ErrorResponse error(String code, String message, List<ValidationError> details, HttpServletRequest request) {

        return new ErrorResponse(
                createMeta(request),
                new ErrorBody(
                        request.getRequestURI(),
                        code,
                        message,
                        details == null ? List.of() : details));
    }

    /**
     * メタ情報生成
     *
     * @param request HTTPリクエスト
     * @return メタ情報
     */
    private Meta createMeta(HttpServletRequest request) {

        return new Meta((String) request.getAttribute(RequestIdFilter.REQUEST_ID_ATTRIBUTE), OffsetDateTime.now());
    }
}
