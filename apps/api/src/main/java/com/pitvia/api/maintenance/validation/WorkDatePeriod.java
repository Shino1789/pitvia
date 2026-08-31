package com.pitvia.api.maintenance.validation;

import java.time.LocalDate;

/**
 * 作業開始日・作業終了日を持つリクエストDTOが実装するインターフェース
 *
 * <p>
 * {@link com.pitvia.api.maintenance.validation.validator.WorkDatePeriodValidator}は、
 * このインターフェースを実装した型であれば整備履歴の登録・更新どちらのリクエストDTOに対しても
 * 同じ検証ロジックを適用できる。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
public interface WorkDatePeriod {

    /**
     * 作業開始日
     *
     * @return 作業開始日
     */
    LocalDate workDateFrom();

    /**
     * 作業終了日（任意項目）
     *
     * @return 作業終了日
     */
    LocalDate workDateTo();

}
