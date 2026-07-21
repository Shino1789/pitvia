package com.pitvia.api.dashboard.query;

import java.time.LocalDate;
import java.time.YearMonth;
import java.util.List;
import java.util.UUID;

import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.common.constant.PageConstants;
import com.pitvia.api.dashboard.constant.DashboardChartType;
import com.pitvia.api.dashboard.dto.param.DashboardChartParam;
import com.pitvia.api.dashboard.dto.response.DashboardChartResponse;
import com.pitvia.api.dashboard.dto.response.DashboardResponse;
import com.pitvia.api.dashboard.dto.response.ManagedVehicle;
import com.pitvia.api.dashboard.dto.response.RecentMaintenance;
import com.pitvia.api.dashboard.dto.response.ShopDashboardResponse;
import com.pitvia.api.dashboard.repository.DashboardRepository;
import com.pitvia.api.maintenance.enums.MaintenanceType;
import com.pitvia.api.maintenance.repository.MaintenanceRecordRepository;
import com.pitvia.api.maintenance.repository.MaintenanceWorkItemRepository;
import com.pitvia.api.maintenance.repository.projection.MonthlySalesProjection;
import com.pitvia.api.vehicle.repository.VehicleRepository;
import com.pitvia.api.vehicle.repository.VehicleShopLinkRepository;

/**
 * ショップ権限（SHOP）専用のダッシュボード表示データおよびチャート情報を構築する戦略クラス
 */
@Component
@Transactional(readOnly = true)
public class ShopDashboardQuery extends AbstractDashboardChartBuilder {

    /** 車両情報リポジトリ */
    private final VehicleRepository vehicleRepository;

    /** 車両・ショップ連携リポジトリ */
    private final VehicleShopLinkRepository vehicleShopLinkRepository;

    /** 整備作業明細リポジトリ */
    private final MaintenanceWorkItemRepository maintenanceWorkItemRepository;

    /**
     * コンストラクタ
     */
    public ShopDashboardQuery(
            DashboardRepository dashboardRepository,
            MaintenanceRecordRepository maintenanceRecordRepository,
            VehicleRepository vehicleRepository,
            VehicleShopLinkRepository vehicleShopLinkRepository,
            MaintenanceWorkItemRepository maintenanceWorkItemRepository) {

        super(dashboardRepository, maintenanceRecordRepository);
        this.vehicleRepository = vehicleRepository;
        this.vehicleShopLinkRepository = vehicleShopLinkRepository;
        this.maintenanceWorkItemRepository = maintenanceWorkItemRepository;

    }

    @Override
    protected UserRole getRole() {
        return UserRole.SHOP;
    }

    @Override
    protected DashboardChartType getChartType() {
        return DashboardChartType.MAINTENANCE_COUNT_TREND;
    }

    @Override
    protected boolean canMoveBackward(UUID userId, LocalDate startDate) {
        return maintenanceRecordRepository.existsShopBeforeDate(userId, startDate);
    }

    @Override
    protected boolean canMoveForward(UUID userId, LocalDate endDate) {
        return maintenanceRecordRepository.existsShopAfterDate(userId, endDate);
    }

    @Override
    public DashboardResponse execute(UUID userId, DashboardChartParam param) {

        // 自社所有の車両数を取得
        long ownCount = vehicleRepository.countByUser_Id(userId);

        // 連携中顧客の車両数を取得
        long customerCount = vehicleShopLinkRepository.countCustomerVehicles(userId);

        // 管理車両のサマリー（総数・マイカー数・顧客車両数）を構築
        ManagedVehicle managedVehicle = new ManagedVehicle(
                ownCount + customerCount,
                ownCount,
                customerCount);

        // 当月のシステム日付から店舗の総売上を集計
        YearMonth currentMonth = YearMonth.now();
        MonthlySalesProjection sales = maintenanceWorkItemRepository.calculateSales(
                userId,
                currentMonth.atDay(1),
                currentMonth.atEndOfMonth());
        long monthlySales = sales != null && sales.getTotalSales() != null ? sales.getTotalSales().longValue() : 0L;

        // 現在連携中の顧客総数を取得
        long linkedOwnerCount = vehicleShopLinkRepository.countLinkedOwners(userId);

        // 自店舗が実施した最近の整備履歴リストを取得
        List<RecentMaintenance> recentMaintenances = createRecentMaintenances(userId);

        // 初期表示用チャートを生成
        DashboardChartResponse chartResponse = createChart(userId, param);

        // ダッシュボード全体レスポンスを構築
        return new ShopDashboardResponse(
                managedVehicle,
                monthlySales,
                linkedOwnerCount,
                chartResponse,
                recentMaintenances);
    }

    @Override
    public DashboardChartResponse getChart(UUID userId, DashboardChartParam param) {
        // チャート生成メソッドを呼び出し、結果を返却
        return createChart(userId, param);
    }

    /**
     * ショップユーザー向けの最近の整備履歴リストを取得
     *
     * @param userId 対象ショップユーザーID
     * @return 変換済みの最近の整備履歴リスト
     */
    private List<RecentMaintenance> createRecentMaintenances(UUID userId) {
        return maintenanceRecordRepository
                .findRecentShopMaintenances(userId, PageRequest.of(0, PageConstants.DASHBOARD_RECENT_MAINTENANCE_SIZE))
                .stream()
                .map(result -> new RecentMaintenance(
                        result.getId(),
                        result.getVehicleName(),
                        result.getOwnerName(),
                        MaintenanceType.fromCode(result.getMaintenanceTypeCode()),
                        result.getTitle(),
                        result.getWorkDateFrom(),
                        result.getWorkDateTo(),
                        result.getTotalCost().longValue(),
                        result.getShopName()))
                .toList();
    }

}
