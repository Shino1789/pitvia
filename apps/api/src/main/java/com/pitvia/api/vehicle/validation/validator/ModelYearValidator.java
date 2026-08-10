package com.pitvia.api.vehicle.validation.validator;

import java.time.Year;

import com.pitvia.api.vehicle.validation.annotation.ValidModelYear;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * 年式（西暦）が「現在の年 + 許容年数」を超えていないかを検証するバリデータアノテーションの実体クラス
 *
 * @see ValidModelYear
 * @author pitvia
 * @version 1.0
 */
public class ModelYearValidator implements ConstraintValidator<ValidModelYear, Short> {

    /** 現在の年から許容する未来年数 */
    private int maxYearsAhead;

    /**
     * アノテーション属性値の初期化
     *
     * @param annotation 対象のアノテーションインスタンス
     */
    @Override
    public void initialize(ValidModelYear annotation) {
        this.maxYearsAhead = annotation.maxYearsAhead();
    }

    /**
     * 年式が「現在の年 + 許容年数」以内かを検証する
     *
     * <p>
     * 未入力（null）の場合は{@code @NotNull}等の必須チェックの責務とし、本バリデーションはパスさせる。
     * </p>
     *
     * @param value   検証対象の年式
     * @param context バリデーションのコンテキスト情報
     * @return true: 正常（または検証スキップ）、false: 許容年数を超えた未来の年式
     */
    @Override
    public boolean isValid(Short value, ConstraintValidatorContext context) {

        if (value == null) {
            return true;
        }

        int maxAllowedYear = Year.now().getValue() + maxYearsAhead;

        return value <= maxAllowedYear;
    }

}
