package com.pitvia.api.vehicle.controller;

import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RequestPart;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.common.dto.response.ApiResponse;
import com.pitvia.api.common.factory.ResponseFactory;
import com.pitvia.api.vehicle.dto.request.CreateVehicleRequest;
import com.pitvia.api.vehicle.dto.response.VehicleFormOptionsResponse;
import com.pitvia.api.vehicle.dto.response.VehicleListResponse;
import com.pitvia.api.vehicle.enums.VehicleType;
import com.pitvia.api.vehicle.service.VehicleFormOptionsService;
import com.pitvia.api.vehicle.service.VehicleListService;
import com.pitvia.api.vehicle.service.VehicleService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 車両関連のAPIエンドポイントを提供するコントローラークラス
 *
 * @author pitvia
 * @version 1.0
 */
@RestController
@RequestMapping(ApiPaths.VEHICLE)
@RequiredArgsConstructor
public class VehicleController {

    /** 車両登録サービス */
    private final VehicleService vehicleService;

    /** 車両フォーム選択肢取得サービス */
    private final VehicleFormOptionsService vehicleFormOptionsService;

    /** 車両一覧取得サービス */
    private final VehicleListService vehicleListService;

    /** レスポンスオブジェクト生成ファクトリ */
    private final ResponseFactory responseFactory;

    /**
     * 車両一覧を取得する
     *
     * <p>
     * {@code ownerId}未指定時はログインユーザー自身の車両一覧、指定時はSHOPから見た
     * 特定顧客（オーナー）の共有車両一覧を返す。
     * </p>
     *
     * @param principal   認証済みユーザー情報
     * @param ownerId     対象オーナーのユーザーID（任意、SHOP専用）
     * @param httpRequest HTTPリクエスト
     * @return 車両一覧レスポンス
     */
    @GetMapping
    public ApiResponse<VehicleListResponse> getVehicleList(
            @AuthenticationPrincipal JwtPrincipal principal,
            @RequestParam(required = false) UUID ownerId,
            HttpServletRequest httpRequest) {

        VehicleListResponse response = vehicleListService.getVehicleList(principal, ownerId);
        return responseFactory.success(httpRequest, response);
    }

    /**
     * 車両登録フォームの選択肢一式を取得する
     *
     * @param vehicleType 対象の車両種別
     * @param httpRequest HTTPリクエスト
     * @return フォーム選択肢一式（メーカー、トランスミッション形式、駆動方式）
     */
    @GetMapping("/form-options")
    public ApiResponse<VehicleFormOptionsResponse> getFormOptions(
            @RequestParam VehicleType vehicleType,
            HttpServletRequest httpRequest) {

        VehicleFormOptionsResponse response = vehicleFormOptionsService.getFormOptions(vehicleType);
        return responseFactory.success(httpRequest, response);
    }

    /**
     * 車両を新規登録する
     *
     * @param principal   認証済みユーザー情報
     * @param request     車両登録リクエスト情報
     * @param file        車両画像ファイル（任意）
     * @param httpRequest HTTPリクエスト
     * @return 201 Created ステータスと車両登録成功レスポンス
     */
    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<ApiResponse<Void>> register(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestPart("request") CreateVehicleRequest request,
            @RequestPart(value = "file", required = false) MultipartFile file,
            HttpServletRequest httpRequest) {

        // 所有者IDはリクエストボディからではなく、認証済みユーザー情報からのみ取得する
        vehicleService.register(request, principal.userId(), file);

        // 正常終了レスポンスの生成
        ApiResponse<Void> response = responseFactory.success(httpRequest, null);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

}
