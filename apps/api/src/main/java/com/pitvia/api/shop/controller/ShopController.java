package com.pitvia.api.shop.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.common.dto.response.ApiResponse;
import com.pitvia.api.common.dto.response.PageResponse;
import com.pitvia.api.common.factory.ResponseFactory;
import com.pitvia.api.shop.dto.param.ShopListParam;
import com.pitvia.api.shop.dto.request.ShopLinkRequest;
import com.pitvia.api.shop.dto.response.ShopInviteCodeResponse;
import com.pitvia.api.shop.dto.response.ShopLinkResponse;
import com.pitvia.api.shop.dto.response.ShopSummary;
import com.pitvia.api.shop.service.ShopInviteCodeService;
import com.pitvia.api.shop.service.ShopLinkService;
import com.pitvia.api.shop.service.ShopListService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * ショップ関連のAPIエンドポイントを提供するコントローラークラス
 *
 * @author pitvia
 * @version 1.0
 */
@RestController
@RequestMapping(ApiPaths.SHOP)
@RequiredArgsConstructor
public class ShopController {

    /** ショップ招待コードサービス */
    private final ShopInviteCodeService shopInviteCodeService;

    /** ショップ一覧取得サービス（OWNER向け） */
    private final ShopListService shopListService;

    /** ショップ連携サービス（OWNER向け） */
    private final ShopLinkService shopLinkService;

    /** レスポンスオブジェクト生成ファクトリ */
    private final ResponseFactory responseFactory;

    /**
     * 連携済みショップ一覧を取得する
     *
     * @param principal   認証済みユーザー情報
     * @param param       リクエストパラメータ
     * @param httpRequest HTTPリクエスト
     * @return ショップ一覧レスポンス
     */
    @PreAuthorize("hasRole('OWNER')")
    @GetMapping
    public ApiResponse<PageResponse<ShopSummary>> getList(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @ModelAttribute ShopListParam param,
            HttpServletRequest httpRequest) {

        PageResponse<ShopSummary> response = shopListService.getList(principal, param);
        return responseFactory.success(httpRequest, response);
    }

    /**
     * 招待コードによるショップ連携
     *
     * <p>
     * ベータ版ではSHOP側の承認フローが無いため、作成時点で即座に{@code APPROVED}状態となる。
     * </p>
     *
     * @param principal   認証済みユーザー情報
     * @param request     ショップ連携リクエスト（対象車両ID・招待コード）
     * @param httpRequest HTTPリクエスト
     * @return 201 Created ステータスと作成された連携情報
     */
    @PreAuthorize("hasRole('OWNER')")
    @PostMapping("/link")
    public ResponseEntity<ApiResponse<ShopLinkResponse>> link(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @RequestBody ShopLinkRequest request,
            HttpServletRequest httpRequest) {

        ShopLinkResponse response = shopLinkService.link(principal, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseFactory.success(httpRequest, response));
    }

    /**
     * 現在有効な招待コードを取得する
     *
     * <p>
     * 有効なコードが存在しない場合は{@code data}が{@code null}になる。
     * </p>
     *
     * @param principal   認証済みユーザー情報
     * @param httpRequest HTTPリクエスト
     * @return 現在有効な招待コードレスポンス
     */
    @PreAuthorize("hasRole('SHOP')")
    @GetMapping("/invite-code")
    public ApiResponse<ShopInviteCodeResponse> getInviteCode(
            @AuthenticationPrincipal JwtPrincipal principal,
            HttpServletRequest httpRequest) {

        ShopInviteCodeResponse response = shopInviteCodeService.getCurrent(principal);
        return responseFactory.success(httpRequest, response);
    }

    /**
     * 招待コードを新規発行する
     *
     * <p>
     * 失効していない既存コードが存在する場合は、それを即時失効させたうえで
     * 新しいコードを発行する（ショップごとに同時に有効なコードは常に1件のみ）。
     * </p>
     *
     * @param principal   認証済みユーザー情報
     * @param httpRequest HTTPリクエスト
     * @return 201 Created ステータスと新規発行された招待コード
     */
    @PreAuthorize("hasRole('SHOP')")
    @PostMapping("/invite-code")
    public ResponseEntity<ApiResponse<ShopInviteCodeResponse>> issueInviteCode(
            @AuthenticationPrincipal JwtPrincipal principal,
            HttpServletRequest httpRequest) {

        ShopInviteCodeResponse response = shopInviteCodeService.issue(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseFactory.success(httpRequest, response));
    }

}
