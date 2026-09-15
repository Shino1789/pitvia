package com.pitvia.api.shop.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.common.dto.response.ApiResponse;
import com.pitvia.api.common.factory.ResponseFactory;
import com.pitvia.api.shop.dto.response.ShopInviteCodeResponse;
import com.pitvia.api.shop.service.ShopInviteCodeService;

import jakarta.servlet.http.HttpServletRequest;
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

    /** レスポンスオブジェクト生成ファクトリ */
    private final ResponseFactory responseFactory;

    /**
     * 現在有効な招待コードを取得する
     *
     * <p>
     * SHOPロール専用。招待コード発行モーダルを再度開いた際に、現在有効なコードを
     * 再表示するために使用する。有効なコードが存在しない場合は{@code data}が{@code null}になる。
     * </p>
     *
     * @param principal   認証済みユーザー情報
     * @param httpRequest HTTPリクエスト
     * @return 現在有効な招待コードレスポンス
     */
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
     * SHOPロール専用。失効していない既存コードが存在する場合は、それを即時失効させたうえで
     * 新しいコードを発行する（ショップごとに同時に有効なコードは常に1件のみ）。
     * </p>
     *
     * @param principal   認証済みユーザー情報
     * @param httpRequest HTTPリクエスト
     * @return 201 Created ステータスと新規発行された招待コード
     */
    @PostMapping("/invite-code")
    public ResponseEntity<ApiResponse<ShopInviteCodeResponse>> issueInviteCode(
            @AuthenticationPrincipal JwtPrincipal principal,
            HttpServletRequest httpRequest) {

        ShopInviteCodeResponse response = shopInviteCodeService.issue(principal);
        return ResponseEntity.status(HttpStatus.CREATED).body(responseFactory.success(httpRequest, response));
    }

}
