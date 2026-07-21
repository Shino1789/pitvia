package com.pitvia.api.dashboard.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpHeaders;

import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.common.constant.PeriodType;
import com.pitvia.api.support.AbstractIntegrationTest;
import com.pitvia.api.support.TestUserHelper.LoginSession;

/**
 * ダッシュボードAPIの結合テスト
 *
 * @author pitvia
 * @version 1.0
 */
class DashboardControllerTest extends AbstractIntegrationTest {

    /**
     * OWNER権限ユーザーによるダッシュボード初期表示データの取得テスト
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ダッシュボード初期表示取得（OWNER権限）：正常系")
    void getOwnerDashboard_success() throws Exception {

        // Arrange
        LoginSession session = testUserHelper.loginOwner(mockMvc);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.DASHBOARD)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.vehicleCount").exists())
                .andExpect(jsonPath("$.data.maintenanceCount").exists())
                .andExpect(jsonPath("$.data.linkedShopCount").exists())
                .andExpect(jsonPath("$.data.maintenanceCostChart").exists())
                .andExpect(jsonPath("$.data.maintenanceCostChart.chartType").value("MAINTENANCE_COST_TREND"))
                .andExpect(jsonPath("$.data.recentMaintenances").isArray());
    }

    /**
     * SHOP権限ユーザーによるダッシュボード初期表示データの取得テスト
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ダッシュボード初期表示取得（SHOP権限）：正常系")
    void getShopDashboard_success() throws Exception {

        // Arrange
        LoginSession session = testUserHelper.loginShop(mockMvc);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.DASHBOARD)
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.managedVehicles").exists())
                .andExpect(jsonPath("$.data.managedVehicles.total").exists())
                .andExpect(jsonPath("$.data.managedVehicles.own").exists())
                .andExpect(jsonPath("$.data.managedVehicles.customer").exists())
                .andExpect(jsonPath("$.data.monthlySales").exists())
                .andExpect(jsonPath("$.data.linkedCustomerCount").exists())
                .andExpect(jsonPath("$.data.maintenanceCountChart").exists())
                .andExpect(jsonPath("$.data.maintenanceCountChart.chartType").value("MAINTENANCE_COUNT_TREND"))
                .andExpect(jsonPath("$.data.recentMaintenances").isArray());
    }

    /**
     * 年次（YEAR）指定によるダッシュボードグラフデータ単体取得テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("グラフデータ取得（年次集計：YEAR）：正常系")
    void getChart_year_success() throws Exception {

        // Arrange
        LoginSession session = testUserHelper.loginOwner(mockMvc);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.DASHBOARD + "/chart")
                .param("period", PeriodType.YEAR.name())
                .param("endPeriod", "2026")
                .param("size", "5")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.periodType").value("YEAR"))
                .andExpect(jsonPath("$.data.startPeriod").value("2022"))
                .andExpect(jsonPath("$.data.endPeriod").value("2026"))
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.items.length()").value(5));
    }

    /**
     * 月次（MONTH）指定によるダッシュボードグラフデータ単体取得テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("グラフデータ取得（月次集計：MONTH）：正常系")
    void getChart_month_success() throws Exception {

        // Arrange
        LoginSession session = testUserHelper.loginShop(mockMvc);

        // Act & Assert
        mockMvc.perform(get(ApiPaths.DASHBOARD + "/chart")
                .param("period", PeriodType.MONTH.name())
                .param("endPeriod", "2026-07")
                .param("size", "6")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + session.accessToken()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.periodType").value("MONTH"))
                .andExpect(jsonPath("$.data.startPeriod").value("2026-02"))
                .andExpect(jsonPath("$.data.endPeriod").value("2026-07"))
                .andExpect(jsonPath("$.data.items").isArray())
                .andExpect(jsonPath("$.data.items.length()").value(6));
    }

    /**
     * 未認証（ログインなし/トークンなし）状態でのアクセス制御テスト。
     *
     * @throws Exception リクエスト実行、または検証に失敗した場合
     */
    @Test
    @DisplayName("ダッシュボード取得：未認証アクセス時に401エラー")
    void getDashboard_unauthorized() throws Exception {

        // Act & Assert (HeaderやCookieなしでアクセス)
        mockMvc.perform(get(ApiPaths.DASHBOARD))
                .andExpect(status().isUnauthorized());
    }

}
