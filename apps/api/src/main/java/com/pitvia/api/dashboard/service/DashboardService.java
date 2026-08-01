package com.pitvia.api.dashboard.service;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.dashboard.dto.param.DashboardChartParam;
import com.pitvia.api.dashboard.dto.response.DashboardChartResponse;
import com.pitvia.api.dashboard.dto.response.DashboardResponse;
import com.pitvia.api.dashboard.query.DashboardQuery;

/**
 * ダッシュボード情報取得サービス
 *
 * @author pitvia
 * @version 1.0
 */
@Service
public class DashboardService {

    /** ユーザーロールとそれに対応するダッシュボード取得クエリクラスをマッピングしたマップ */
    private final Map<UserRole, DashboardQuery> queryMap;

    /**
     * コンストラクタ
     * Springによってインジェクションされた {@link DashboardQuery} の実装クラスリストから、
     * 対応するロール（{@link UserRole}）をキーとしたマップを構築
     *
     * @param queries ダッシュボード取得クエリの実装クラスのリスト
     */
    public DashboardService(List<DashboardQuery> queries) {
        this.queryMap = queries.stream().collect(Collectors.toMap(DashboardQuery::supports, Function.identity()));
    }

    /**
     * ログインユーザーの権限に応じたダッシュボードの初期表示データを取得
     *
     * @param principal 認証済みユーザー情報
     * @return 権限に応じたダッシュボード表示データを含む {@link DashboardResponse}
     */
    public DashboardResponse getDashboard(JwtPrincipal principal) {
        DashboardQuery query = getQuery(principal.role());
        return query.execute(principal.userId(), DashboardChartParam.defaultMonth());
    }

    /**
     * ログインユーザーの権限に応じたダッシュボードのグラフデータを取得
     *
     * @param principal 認証済みユーザー情報
     * @param param     グラフデータの絞り込み条件
     * @return 権限に応じたグラフ表示データを含む {@link DashboardChartResponse}
     */
    public DashboardChartResponse getChart(JwtPrincipal principal, DashboardChartParam param) {
        DashboardQuery query = getQuery(principal.role());
        return query.getChart(principal.userId(), param);
    }

    /**
     * 指定されたユーザーロールに対応するダッシュボード取得クエリを取得
     *
     * @param role 検索対象のユーザーロール
     * @return ロールに対応する {@link DashboardQuery} の実装インスタンス
     * @throws IllegalStateException 指定されたロールに対応するクエリ実装クラスが存在しない場合
     */
    private DashboardQuery getQuery(UserRole role) {
        return Optional.ofNullable(queryMap.get(role))
                .orElseThrow(() -> new IllegalStateException("DashboardQuery not found: " + role));
    }

}
