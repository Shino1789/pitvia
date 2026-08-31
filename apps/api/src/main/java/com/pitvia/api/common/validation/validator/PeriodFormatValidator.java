package com.pitvia.api.common.validation.validator;

import java.time.YearMonth;
import java.time.Year;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;

import org.springframework.beans.BeanWrapperImpl;

import com.pitvia.api.common.validation.annotation.PeriodFormat;
import com.pitvia.api.common.constant.PeriodType;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * 集計単位（月・年）に応じた日付文字列のフォーマット整合性を検証するバリデータアノテーションの実体クラス
 *
 * @see PeriodFormat
 * @author pitvia
 * @version 1.0
 */
public class PeriodFormatValidator implements ConstraintValidator<PeriodFormat, Object> {

    /** 年形式 (yyyy) */
    private static final DateTimeFormatter YEAR_FORMAT = DateTimeFormatter.ofPattern("yyyy");

    /** 月形式 (yyyy-MM) */
    private static final DateTimeFormatter MONTH_FORMAT = DateTimeFormatter.ofPattern("yyyy-MM");

    /** 検証対象となる集計単位（MONTH / YEAR）のフィールド名 */
    private String periodField;

    /** 検証対象となる日付文字列（"2026-06" など）のフィールド名 */
    private String valueField;

    /**
     * アノテーション属性値の初期化
     *
     * @param annotation 対象のアノテーションインスタンス
     */
    @Override
    public void initialize(PeriodFormat annotation) {
        this.periodField = annotation.periodField();
        this.valueField = annotation.valueField();
    }

    /**
     * 集計単位の指定に合わせて、日付文字列のフォーマットが適切に設定されているかを検証
     *
     * @param value   検証対象のオブジェクト（DTO）
     * @param context バリデーションのコンテキスト情報
     * @return true: 正常（または検証スキップ）、false: フォーマット不正
     * @throws IllegalStateException アノテーションで指定されたフィールド名が検証対象オブジェクトに存在しない場合
     */
    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {

        if (value == null) {
            return true;
        }

        // BeanWrapperImplを使って、ターゲットのフィールド値を動的に取得する
        BeanWrapperImpl wrapper = new BeanWrapperImpl(value);

        // 指定されたフィールド名がDTOに存在するかチェックし、存在しない場合は設定ミスとみなして例外をスロー
        if (!wrapper.isReadableProperty(periodField)) {
            throw new IllegalStateException(
                    "Property '" + periodField + "' not found on object of type " + value.getClass().getName());
        }
        if (!wrapper.isReadableProperty(valueField)) {
            throw new IllegalStateException(
                    "Property '" + valueField + "' not found on object of type " + value.getClass().getName());
        }

        Object periodObject = wrapper.getPropertyValue(periodField);
        Object valueObject = wrapper.getPropertyValue(valueField);

        // 集計単位が PeriodType Enum 型であることを検証（型が合わない場合はスキップ）
        if (!(periodObject instanceof PeriodType period)) {
            return true;
        }

        // 検証対象の値が未入力の場合は必須チェックの領分とするため、当バリデーションはパスさせる
        if (valueObject == null) {
            return true;
        }

        // 日付値が String型 であることを検証
        if (!(valueObject instanceof String periodValue)) {
            return true;
        }

        if (periodValue.isBlank()) {
            return true;
        }

        // 集計単位（月・年）に応じたフォーマットパース判定
        boolean valid = switch (period) {
            case MONTH -> {
                try {
                    YearMonth.parse(periodValue, MONTH_FORMAT);
                    yield true;
                } catch (DateTimeParseException ex) {
                    yield false;
                }
            }
            case YEAR -> {
                try {
                    Year.parse(periodValue, YEAR_FORMAT);
                    yield true;
                } catch (DateTimeParseException ex) {
                    yield false;
                }
            }
        };

        // フォーマットエラーがある場合、動的に日付文字列側のフィールドにエラーを紐づける
        if (!valid) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                    .addPropertyNode(valueField)
                    .addConstraintViolation();
        }

        return valid;
    }
}
