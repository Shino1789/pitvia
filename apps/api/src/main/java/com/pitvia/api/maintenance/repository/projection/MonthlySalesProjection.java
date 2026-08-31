package com.pitvia.api.maintenance.repository.projection;

import java.math.BigDecimal;

/**
 * 月次売上集計用のプロジェクション
 *
 * @author pitvia
 * @version 1.0
 */
public interface MonthlySalesProjection {

    /**
     * 合算された総売上（工賃＋部品代）を取得する
     *
     * @return 総売上
     */
    BigDecimal getTotalSales();
}
