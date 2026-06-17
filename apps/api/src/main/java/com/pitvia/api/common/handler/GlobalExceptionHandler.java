package com.pitvia.api.common.handler;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import com.pitvia.api.common.dto.response.ErrorResponse;
import com.pitvia.api.common.dto.response.ValidationError;
import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.common.factory.ResponseFactory;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
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
     * APIレスポンス生成ファクトリ
     */
    private final ResponseFactory responseFactory;

    /**
     * @Valid + @RequestBody のバリデーションエラーを処理する。
     */
    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleMethodArgumentNotValid(
            MethodArgumentNotValidException ex,
            HttpServletRequest request) {

        List<ValidationError> errors = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(this::toValidationError)
                .toList();

        log.warn("Validation error: {}", errors);

        return validationError(errors, request);
    }

    /**
     * @Validated を利用した
     * @RequestParam / @PathVariable のバリデーションエラーを処理する。
     */
    @ExceptionHandler(ConstraintViolationException.class)
    public ResponseEntity<ErrorResponse> handleConstraintViolation(
            ConstraintViolationException ex,
            HttpServletRequest request) {

        List<ValidationError> errors = ex.getConstraintViolations()
                .stream()
                .map(v -> new ValidationError(
                        extractFieldName(v),
                        v.getMessage()))
                .toList();

        log.warn("Constraint violation: {}", errors);

        return validationError(errors, request);
    }

    /**
     * 業務例外を処理する。
     */
    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<ErrorResponse> handleBusinessException(
            BusinessException ex,
            HttpServletRequest request) {

        log.warn(
                "Business error: code={}, message={}",
                ex.getErrorCode().getCode(),
                ex.getMessage());

        return ResponseEntity
                .status(ex.getStatus())
                .body(responseFactory.error(
                        ex.getErrorCode().getCode(),
                        ex.getMessage(),
                        request));
    }

    /**
     * 想定外例外を処理する。
     */
    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleException(
            Exception ex,
            HttpServletRequest request) {

        log.error(
                "Unexpected error path={}",
                request.getRequestURI(),
                ex);

        return ResponseEntity
                .status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(responseFactory.error(
                        ErrorCode.INTERNAL_SERVER_ERROR.getCode(),
                        ErrorCode.INTERNAL_SERVER_ERROR.getMessage(),
                        request));
    }

    /**
     * バリデーションエラーレスポンスを生成する。
     */
    private ResponseEntity<ErrorResponse> validationError(
            List<ValidationError> errors,
            HttpServletRequest request) {

        return ResponseEntity
                .badRequest()
                .body(responseFactory.error(
                        ErrorCode.VALIDATION_ERROR.getCode(),
                        ErrorCode.VALIDATION_ERROR.getMessage(),
                        errors,
                        request));
    }

    /**
     * SpringのFieldErrorをValidationErrorへ変換する。
     */
    private ValidationError toValidationError(FieldError fieldError) {

        return new ValidationError(
                fieldError.getField(),
                fieldError.getDefaultMessage());
    }

    /**
     * ConstraintViolationからフィールド名のみを抽出する。
     *
     * <pre>
     * createUser.id → id
     * getUser.userId → userId
     * </pre>
     */
    private String extractFieldName(ConstraintViolation<?> violation) {

        String path = violation.getPropertyPath().toString();

        int index = path.lastIndexOf('.');

        return index >= 0 ? path.substring(index + 1) : path;
    }

}
