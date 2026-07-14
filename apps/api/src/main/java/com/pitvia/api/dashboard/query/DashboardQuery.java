package com.pitvia.api.dashboard.query;

import java.util.UUID;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.dashboard.dto.param.DashboardChartParam;
import com.pitvia.api.dashboard.dto.response.DashboardChartResponse;
import com.pitvia.api.dashboard.dto.response.DashboardResponse;

/**
 * ダッシュボード情報を取得するための戦略インターフェース
 */
public interface DashboardQuery {

    /**
     * この実装が対応するユーザーロールを返す
     *
     * @return 対応するユーザーロール
     */
    UserRole supports();

    /**
     * 指定したユーザーのダッシュボード情報を取得する
     *
     * @param userId 対象ユーザーのID
     * @return ダッシュボード情報
     */
    DashboardResponse execute(UUID userId);

    /**
     * 指定した期間のダッシュボードチャート情報を取得する
     *
     * @param userId 対象ユーザーのID
     * @param period 取得条件
     * @return ダッシュボードチャート情報
     */
    DashboardChartResponse getChart(UUID userId, DashboardChartParam param);
}
