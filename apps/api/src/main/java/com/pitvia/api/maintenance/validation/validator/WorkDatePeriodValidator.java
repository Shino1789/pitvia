package com.pitvia.api.maintenance.validation.validator;

import com.pitvia.api.maintenance.validation.WorkDatePeriod;
import com.pitvia.api.maintenance.validation.annotation.ValidWorkDatePeriod;

import jakarta.validation.ConstraintValidator;
import jakarta.validation.ConstraintValidatorContext;

/**
 * 作業終了日が作業開始日以降かどうかを検証するバリデータアノテーションの実体クラス
 *
 * <p>
 * {@link WorkDatePeriod}を実装した型であれば、整備履歴の登録・更新どちらのリクエストDTOにも適用できる。
 * </p>
 *
 * @see ValidWorkDatePeriod
 * @author pitvia
 * @version 1.0
 */
public class WorkDatePeriodValidator implements ConstraintValidator<ValidWorkDatePeriod, WorkDatePeriod> {

    /**
     * 作業終了日が作業開始日以降かを検証する
     *
     * <p>
     * 作業終了日が未入力（null）の場合は任意項目のため検証をスキップする。
     * 作業開始日が未入力の場合は{@code @NotNull}の責務とし、本バリデーションはパスさせる。
     * </p>
     *
     * @param request 検証対象の整備履歴登録・更新リクエスト
     * @param context バリデーションのコンテキスト情報
     * @return true: 正常（または検証スキップ）、false: 作業終了日が作業開始日より前
     */
    @Override
    public boolean isValid(WorkDatePeriod request, ConstraintValidatorContext context) {

        if (request == null || request.workDateFrom() == null || request.workDateTo() == null) {
            return true;
        }

        boolean valid = !request.workDateTo().isBefore(request.workDateFrom());

        // クラスレベル制約はデフォルトのままだとフィールドに紐づかないため、違反時は明示的にworkDateToへ紐づけ直す
        if (!valid) {
            context.disableDefaultConstraintViolation();
            context.buildConstraintViolationWithTemplate(context.getDefaultConstraintMessageTemplate())
                    .addPropertyNode("workDateTo")
                    .addConstraintViolation();
        }

        return valid;
    }

}
