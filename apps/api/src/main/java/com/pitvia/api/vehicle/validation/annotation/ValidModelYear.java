package com.pitvia.api.vehicle.validation.annotation;

import java.lang.annotation.Documented;
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

import com.pitvia.api.vehicle.validation.validator.ModelYearValidator;

import jakarta.validation.Constraint;
import jakarta.validation.Payload;

/**
 * 年式（西暦）が「現在の年 + 許容年数」を超えていないかを検証するバリデータアノテーション
 *
 * <p>
 * 自動車は年末頃から翌年モデルが販売されることがあるため、
 * 現在の年より未来の年式を一律で禁止せず、{@link #maxYearsAhead()}年先までは許容する。
 * 過去方向の下限（極端に古い年式の拒否）は{@code @Min}等の標準バリデータで別途担う。
 * </p>
 *
 * @see ModelYearValidator
 * @author pitvia
 * @version 1.0
 */
@Documented
@Constraint(validatedBy = ModelYearValidator.class)
@Target({ ElementType.FIELD, ElementType.METHOD, ElementType.PARAMETER })
@Retention(RetentionPolicy.RUNTIME)
public @interface ValidModelYear {

    /**
     * 現在の年から何年先までを許容するか
     *
     * @return 許容する未来年数（デフォルト: 1）
     */
    int maxYearsAhead() default 1;

    /**
     * バリデーションエラー時のエラーメッセージ
     *
     * @return エラーメッセージキー
     */
    String message() default "{validation.vehicle.modelYear.future}";

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
