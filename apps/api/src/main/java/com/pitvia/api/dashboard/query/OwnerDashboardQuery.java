package com.pitvia.api.dashboard.query;

import java.time.LocalDate;
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
import com.pitvia.api.dashboard.dto.response.OwnerDashboardResponse;
import com.pitvia.api.dashboard.dto.response.RecentMaintenance;
import com.pitvia.api.dashboard.repository.DashboardRepository;
import com.pitvia.api.maintenance.enums.MaintenanceType;
import com.pitvia.api.maintenance.repository.MaintenanceRecordRepository;
import com.pitvia.api.vehicle.repository.VehicleRepository;
import com.pitvia.api.vehicle.repository.VehicleShopLinkRepository;

/**
 * オーナー権限（OWNER）専用のダッシュボード表示データおよびチャート情報を構築する戦略クラス
 */
@Component
@Transactional(readOnly = true)
public class OwnerDashboardQuery extends AbstractDashboardChartBuilder {

    /** 車両情報リポジトリ */
    private final VehicleRepository vehicleRepository;

    /** 車両・ショップ連携リポジトリ */
    private final VehicleShopLinkRepository vehicleShopLinkRepository;

    /**
     * コンストラクタ
     */
    public OwnerDashboardQuery(
            DashboardRepository dashboardRepository,
            MaintenanceRecordRepository maintenanceRecordRepository,
            VehicleRepository vehicleRepository,
            VehicleShopLinkRepository vehicleShopLinkRepository) {
        super(dashboardRepository, maintenanceRecordRepository);
        this.vehicleRepository = vehicleRepository;
        this.vehicleShopLinkRepository = vehicleShopLinkRepository;
    }

    @Override
    protected UserRole getRole() {
        return UserRole.OWNER;
    }

    @Override
    protected DashboardChartType getChartType() {
        return DashboardChartType.MAINTENANCE_COST_TREND;
    }

    @Override
    protected boolean canMoveBackward(UUID userId, LocalDate startDate) {
        return maintenanceRecordRepository.existsOwnerBeforeDate(userId, startDate);
    }

    @Override
    protected boolean canMoveForward(UUID userId, LocalDate endDate) {
        return maintenanceRecordRepository.existsOwnerAfterDate(userId, endDate);
    }

    @Override
    public DashboardResponse execute(UUID userId, DashboardChartParam param) {

        // カード表示用の集計値を取得
        long vehicleCount = vehicleRepository.countByUser_Id(userId);
        long maintenanceCount = maintenanceRecordRepository.countByVehicle_User_Id(userId);
        long linkedShopCount = vehicleShopLinkRepository.countLinkedShops(userId);

        // 最近の整備履歴を取得
        List<RecentMaintenance> recentMaintenances = createRecentMaintenances(userId);

        // 初期表示用チャートを生成
        DashboardChartResponse chartResponse = createChart(userId, param);

        // ダッシュボード全体レスポンスを構築
        return new OwnerDashboardResponse(
                vehicleCount,
                maintenanceCount,
                linkedShopCount,
                chartResponse,
                recentMaintenances);
    }

    @Override
    public DashboardChartResponse getChart(UUID userId, DashboardChartParam param) {
        // チャート生成メソッドを呼び出し、結果を返却
        return createChart(userId, param);
    }

    /**
     * オーナーユーザー向けの最近の整備履歴リストを取得
     *
     * @param userId 対象ユーザーID
     * @return 変換済みの最近の整備履歴リスト
     */
    private List<RecentMaintenance> createRecentMaintenances(UUID userId) {
        return maintenanceRecordRepository
                .findRecentOwnerMaintenances(userId, PageRequest.of(0, PageConstants.DASHBOARD_RECENT_MAINTENANCE_SIZE))
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
