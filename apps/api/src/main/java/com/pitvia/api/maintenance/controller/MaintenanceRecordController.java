package com.pitvia.api.maintenance.controller;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.common.dto.response.ApiResponse;
import com.pitvia.api.common.factory.ResponseFactory;
import com.pitvia.api.maintenance.dto.param.MaintenanceRecordListParam;
import com.pitvia.api.maintenance.dto.response.MaintenanceRecordListResponse;
import com.pitvia.api.maintenance.service.MaintenanceRecordListService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 整備履歴関連のAPIエンドポイントを提供するコントローラークラス
 *
 * @author pitvia
 * @version 1.0
 */
@RestController
@RequestMapping(ApiPaths.MAINTENANCE_RECORD)
@RequiredArgsConstructor
public class MaintenanceRecordController {

    /** 整備履歴一覧取得サービス */
    private final MaintenanceRecordListService maintenanceRecordListService;

    /** レスポンスオブジェクト生成ファクトリ */
    private final ResponseFactory responseFactory;

    /**
     * 整備履歴一覧を取得する
     *
     * <p>
     * {@code vehicleId}指定時はその車両の整備履歴に限定し、{@code ownerId}指定時はSHOPから見た
     * 特定顧客（オーナー）の共有車両群の整備履歴を返す。いずれも未指定の場合はログインユーザー
     * 自身の全車両分の整備履歴を返す。
     * </p>
     *
     * @param principal   認証済みユーザー情報
     * @param param       リクエストパラメータ
     * @param httpRequest HTTPリクエスト
     * @return 整備履歴一覧レスポンス
     */
    @GetMapping
    public ApiResponse<MaintenanceRecordListResponse> getList(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @ModelAttribute MaintenanceRecordListParam param,
            HttpServletRequest httpRequest) {

        MaintenanceRecordListResponse response = maintenanceRecordListService.getList(principal, param);

        return responseFactory.success(httpRequest, response);
    }

}
