package com.pitvia.api.common.validation.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import com.pitvia.api.common.validation.validator.PasswordMatchesValidator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * パスワードと確認用パスワードの一致を検証するカスタムアノテーション
 *
 * @see PasswordMatchesValidator
 * @author pitvia
 * @version 1.0
 */
@Documented
@Constraint(validatedBy = PasswordMatchesValidator.class)
@Target({ ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
public @interface PasswordMatches {

    /**
     * 検証対象となるメインパスワードのフィールド名。
     *
     * @return フィールド名（デフォルト: "password"）
     */
    String passwordField() default "password";

    /**
     * 検証対象となる確認用パスワードのフィールド名。
     *
     * @return フィールド名（デフォルト: "confirmPassword"）
     */
    String confirmPasswordField() default "confirmPassword";

    /**
     * エラー時のデフォルトメッセージキー
     *
     * @return エラーメッセージ
     */
    String message() default "{validation.user.confirmPassword.mismatch}";

    Class<?>[] groups() default {};

    Class<? extends Payload>[] payload() default {};

}
