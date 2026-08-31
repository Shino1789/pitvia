package com.pitvia.api.common.validation.validator;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;
import org.springframework.beans.BeanWrapperImpl;

import com.pitvia.api.common.validation.annotation.PasswordMatches;

/**
 * パスワードと確認用パスワードの一致を検証するバリデータアノテーションの実体クラス
 *
 * @see PasswordMatches
 * @author pitvia
 * @version 1.0
 */
public class PasswordMatchesValidator implements ConstraintValidator<PasswordMatches, Object> {

    /**
     * 検証対象となるメインパスワードのフィールド名。
     */
    private String passwordField;

    /**
     * 検証対象となる確認用パスワードのフィールド名。
     */
    private String confirmPasswordField;

    /**
     * アノテーションの属性値を初期化
     *
     * @param constraintAnnotation 対象のアノテーションインスタンス
     */
    @Override
    public void initialize(PasswordMatches constraintAnnotation) {
        this.passwordField = constraintAnnotation.passwordField();
        this.confirmPasswordField = constraintAnnotation.confirmPasswordField();
    }

    /**
     * 入力されたパスワードと確認用パスワードの値が一致しているかをチェックする
     *
     * @param value   検証対象のオブジェクト
     * @param context バリデーションのコンテキスト情報
     * @return true: 正常（または検証スキップ）、false: 不一致
     *
     */
    @Override
    public boolean isValid(Object value, ConstraintValidatorContext context) {

        if (value == null) {
            return true;
        }

        // BeanWrapperImplを使って、ターゲットのフィールド値を動的に取得する
        BeanWrapperImpl wrapper = new BeanWrapperImpl(value);

        // 指定されたフィールド名がDTOに存在するかチェック
        if (!wrapper.isReadableProperty(passwordField) || !wrapper.isReadableProperty(confirmPasswordField)) {
            return true;
        }

        Object passwordValue = wrapper.getPropertyValue(passwordField);
        Object confirmPasswordValue = wrapper.getPropertyValue(confirmPasswordField);

        // String型であることを検証
        if (!(passwordValue instanceof String password) || !(confirmPasswordValue instanceof String confirmPassword)) {
            return true;
        }

        // パスワードの一致チェック
        boolean isValid = password.equals(confirmPassword);

        // グローバルエラーではなく、動的に指定された確認用フィールドにエラーを紐づけるための処理
        if (!isValid) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                    .addPropertyNode(confirmPasswordField)
                    .addConstraintViolation();
        }

        return isValid;
    }

}
