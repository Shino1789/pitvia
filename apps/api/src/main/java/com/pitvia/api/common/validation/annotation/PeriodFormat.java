package com.pitvia.api.common.validation.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import com.pitvia.api.common.validation.validator.PeriodFormatValidator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * 集計単位（月・年）に応じた日付文字列のフォーマット整合性を検証するバリデータアノテーション
 *
 * <p>
 * クラスレベルに付与し、指定された集計単位フィールドの値（MONTH / YEAR）に基づき、
 * 日付文字列フィールドがそれぞれ適切な形式（"yyyy-MM" / "yyyy"）で入力されているかを検証する
 * </p>
 *
 * @see PeriodFormatValidator
 * @author pitvia
 * @version 1.0
 */
@Documented
@Constraint(validatedBy = PeriodFormatValidator.class)
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface PeriodFormat {

    /**
     * 検証の判断基準となる集計単位（PeriodType）を保持するフィールド名を指定
     *
     * @return 集計単位のフィールド名（デフォルト: "period"）
     */
    String periodField() default "period";

    /**
     * 検証対象となる日付文字列を保持するフィールド名を指定
     *
     * @return 検証対象の日付フィールド名（デフォルト: "endPeriod"）
     */
    String valueField() default "endPeriod";

    /**
     * バリデーションエラー時のエラーメッセージ
     *
     * @return エラーメッセージキー
     */
    String message() default "{validation.period.invalid}";

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
