package com.pitvia.api.customer.controller;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.common.dto.response.ApiResponse;
import com.pitvia.api.common.dto.response.PageResponse;
import com.pitvia.api.common.factory.ResponseFactory;
import com.pitvia.api.customer.dto.param.CustomerListParam;
import com.pitvia.api.customer.dto.response.CustomerSummary;
import com.pitvia.api.customer.service.CustomerListService;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 顧客関連のAPIエンドポイントを提供するコントローラークラス
 *
 * @author pitvia
 * @version 1.0
 */
@RestController
@RequestMapping(ApiPaths.CUSTOMER)
@RequiredArgsConstructor
public class CustomerController {

    /** 顧客一覧取得サービス */
    private final CustomerListService customerListService;

    /** レスポンスオブジェクト生成ファクトリ */
    private final ResponseFactory responseFactory;

    /**
     * 顧客一覧を取得する
     *
     * <p>
     * SHOPロール専用。ログインショップとAPPROVED状態で連携している車両を、所有者（顧客）単位で
     * グルーピングして一覧取得する。
     * </p>
     *
     * @param principal   認証済みユーザー情報
     * @param param       リクエストパラメータ
     * @param httpRequest HTTPリクエスト
     * @return 顧客一覧レスポンス
     */
    @GetMapping
    public ApiResponse<PageResponse<CustomerSummary>> getList(
            @AuthenticationPrincipal JwtPrincipal principal,
            @Valid @ModelAttribute CustomerListParam param,
            HttpServletRequest httpRequest) {

        PageResponse<CustomerSummary> response = customerListService.getList(principal, param);
        return responseFactory.success(httpRequest, response);
    }

}
