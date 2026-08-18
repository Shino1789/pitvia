package com.pitvia.api.maintenance.validation.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import com.pitvia.api.maintenance.validation.validator.WorkDatePeriodValidator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * 作業終了日（{@code workDateTo}）が作業開始日（{@code workDateFrom}）以降かどうかを検証するバリデータアノテーション
 *
 * <p>
 * {@code workDateTo}は任意項目のため、未指定（null）の場合は検証をスキップする。
 * </p>
 *
 * @see WorkDatePeriodValidator
 * @author pitvia
 * @version 1.0
 */
@Documented
@Constraint(validatedBy = WorkDatePeriodValidator.class)
@Target({ ElementType.TYPE })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidWorkDatePeriod {

    /**
     * バリデーションエラー時のエラーメッセージ
     *
     * @return エラーメッセージキー
     */
    String message() default "{validation.maintenanceRecord.workDateTo.beforeFrom}";

    /**
     * バリデーショングループを指定
     *
     * @return グループクラスの配列
     */
    Class<?>[] groups() default {};

    /**
     * バリデーションに関連付けるカスタムペイロードを指定
     *
     * @return ペイロードクラスの配列
     */
    Class<? extends Payload>[] payload() default {};

}
