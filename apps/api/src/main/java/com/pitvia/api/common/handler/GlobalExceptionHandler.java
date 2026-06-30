package com.pitvia.api.common.handler;

import java.util.List;
import java.util.stream.StreamSupport;

import org.springframework.context.MessageSource;
import org.springframework.context.i18n.LocaleContextHolder;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.servlet.NoHandlerFoundException;

import com.fasterxml.jackson.databind.exc.InvalidFormatException;
import com.pitvia.api.common.dto.response.ErrorResponse;
import com.pitvia.api.common.dto.response.ValidationError;
import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.common.factory.ResponseFactory;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Path;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * グローバル例外ハンドラ。
 *
 * <pre>
 * 例外種別とHTTPステータス
 * --------------------------------------------------------
 * Validation Error : 入力値不正      -> 400 Bad Request
 * Business Error   : 業務ルール違反   -> 4xx
 * System Error     : 想定外エラー     -> 500 Internal Server Error
 * --------------------------------------------------------
 * </pre>
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@RestControllerAdvice
@RequiredArgsConstructor
public class GlobalExceptionHandler {

    /**
     * メッセージソース
     */
    private final MessageSource messageSource;

    /**
     * APIレスポンス生成ファクトリ
     */
    private final ResponseFactory responseFactory;

    /**
     * {@code @Valid} または {@code @Validated} が付与されたオブジェクト({@code @RequestBody})の
     * 相関バリデーションエラーをキャッチ
     *
     * @param ex      バリデーション例外
     * @param request HTTPリクエスト
     * @return 400 Bad Request のレスポンスエンティティ
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        // 各フィールドのエラー情報を抽出し、独自のDTOに変換
        List<ValidationError> validationErrors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toValidationError)
                .toList();

        // バリデーションチェックで違反になったフィールドリストをログに出力
        log.warn("Validation error: {}", validationErrors);

        return buildValidationErrorResponse(validationErrors, request);
    }

    /**
     * メソッド引数単体({@code @RequestParam} や {@code @PathVariable})に対する
     * 単項目バリデーションエラーをキャッチ
     *
     * @param ex      制約違反例外
     * @param request HTTPリクエスト情報
     * @return 400 Bad Request のレスポンスエンティティ
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request) {

        // パスから末尾のフィールド名のみを抽出し、独自のDTOに変換
        List<ValidationError> validationErrors = ex.getConstraintViolations()
                .stream()
                .map(v -> new ValidationError(
                        extractFieldName(v),
                        v.getMessage()))
                .toList();

        // バリデーションチェックで違反になったフィールドリストをログに出力
        log.warn("Constraint violation: {}", validationErrors);

        return buildValidationErrorResponse(validationErrors, request);
    }

    /**
     * JSONパースエラーをキャッチ
     *
     * @param ex      JSONパース例外
     * @param request HTTPリクエスト
     * @return 400 Bad Request のレスポンスエンティティ
     */
    @ExceptionHandler(HttpMessageNotReadableException.class)
    public ResponseEntity<ErrorResponse> handleHttpMessageNotReadable(
            HttpMessageNotReadableException ex,
            HttpServletRequest request) {

        // 例外チェーンの最終到達例外取得
        Throwable cause = ex.getMostSpecificCause();

        // フィールド型不一致による例外の場合
        if (cause instanceof InvalidFormatException ife) {

            String fieldName = "";
            // プロパティからフィールド型不一致用のエラーメッセージを取得する
            String message = messageSource.getMessage(
                    "validation.json.invalid.format",
                    null,
                    LocaleContextHolder.getLocale());

            if (!ife.getPath().isEmpty()) {
                // 原因となった不正なフィールド名を特定
                fieldName = ife.getPath().get(ife.getPath().size() - 1).getFieldName();
            }

            List<ValidationError> validationErrors = List.of(new ValidationError(fieldName, message));

            // 型変換失敗フィールドと原因例外種別のみログ出力
            log.warn("JSON field conversion error field={} cause={}", fieldName, cause.getClass().getSimpleName());

            return buildValidationErrorResponse(validationErrors, request);

        }

        log.warn("Malformed JSON request cause={}", cause.getClass().getSimpleName());

        // JSON構文エラーやDTO構造不一致の場合、validationErrorsは含めずに返却
        return ResponseEntity.badRequest().body(responseFactory.error(ErrorCode.MALFORMED_JSON, request));

    }

    /**
     * 存在しないリソースへのアクセス例外をキャッチ
     *
     * @param ex      リソース未検出例外
     * @param request HTTPリクエスト
     * @return 404 Not Found のレスポンスエンティティ
     */
    @ExceptionHandler(NoHandlerFoundException.class)
    public ResponseEntity<ErrorResponse> handleNoResourceFound(
            NoHandlerFoundException ex,
            HttpServletRequest request) {

        // リクエストされたURLをログに出力
        log.warn("Resource not found path={}", request.getRequestURI());

        return ResponseEntity
                .status(HttpStatus.NOT_FOUND)
                .body(responseFactory.error(
                        ErrorCode.RESOURCE_NOT_FOUND,
                        request));

    }

    /**
     * 業務例外(ビジネスロジック違反)をキャッチ
     *
     * @param ex      業務例外
     * @param request HTTPリクエスト
     * @return 業務例外に応じたHTTPステータスのレスポンスエンティティ
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
            BusinessException ex,
            HttpServletRequest request) {

        // エラーコードとメッセージをログに出力
        log.warn("Business error: code={}, message={}", ex.getErrorCode(), ex.getMessage());

        return ResponseEntity
                .status(ex.getStatus())
                .body(responseFactory.error(
                        ex.getErrorCode(),
                        ex.getMessage(),
                        request));
    }

    /**
     * 想定外の例外をキャッチ
     *
     * @param ex      例外
     * @param request HTTPリクエスト
     * @return 500 Internal Server Error のレスポンスエンティティ
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(
            Exception ex,
            HttpServletRequest request) {

        // 例外発生時のリクエストURIとスタックトレースをerrorログとして記録
        log.error("Unexpected error path={}", request.getRequestURI(), ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(responseFactory.error(
                        ErrorCode.INTERNAL_SERVER_ERROR,
                        request));
    }

    /**
     * バリデーションエラーとして {@link ResponseEntity} を組み立てる
     *
     * @param validationErrors バリデーションエラー詳細リスト
     * @param request          HTTPリクエスト情報
     * @return 400 Bad Request のレスポンスエンティティ
     */
    private ResponseEntity<ErrorResponse> buildValidationErrorResponse(
            List<ValidationError> validationErrors,
            HttpServletRequest request) {

        return ResponseEntity
                .badRequest()
                .body(responseFactory.validationError(
                        validationErrors,
                        request));
    }

    /**
     * Springの {@link FieldError} を独自の {@link ValidationError} へ変換
     *
     * @param fieldError SpringのFieldError
     */
    private ValidationError toValidationError(FieldError fieldError) {

        return new ValidationError(fieldError.getField(), fieldError.getDefaultMessage());
    }

    /**
     * {@link ConstraintViolation} のプロパティパスから、ネストされたオブジェクト階層を無視して
     * 末尾の純粋な「フィールド名」のみを抽出する
     *
     * <pre>
     * 変換例:
     * - createUser.id -> "id"
     * - createUser.user.address.zipCode -> "zipCode"
     * </pre>
     *
     * @param violation 制約違反情報
     * @return 抽出されたフィールド名(取得できない場合は空文字)
     */
    private String extractFieldName(ConstraintViolation<?> violation) {

        return StreamSupport.stream(
                violation.getPropertyPath().spliterator(), false)
                // 各ノードをストリームで流し、reduceで最後のノード(末尾のフィールド)のみを残す
                .reduce((first, second) -> second)
                // ノードから文字列のフィールド名を取得
                .map(Path.Node::getName)
                // 万が一取得できなかった場合のデフォルト値
                .orElse("");
    }

}
