package com.pitvia.api.auth.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pitvia.api.auth.dto.request.RegisterRequest;
import com.pitvia.api.auth.service.RegisterService;
import com.pitvia.api.common.constant.ApiPaths;
import com.pitvia.api.common.dto.response.ApiResponse;
import com.pitvia.api.common.factory.ResponseFactory;

import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * 認証・認可関連のエンドポイントを管理するコントローラー
 *
 * @author pitvia
 * @version 1.0
 */
@RestController
@RequestMapping(ApiPaths.V1 + "/auth")
@RequiredArgsConstructor
@Validated
public class AuthController {

    /** アカウント登録サービス */
    private final RegisterService registerService;

    /** レスポンスオブジェクト生成ファクトリ */
    private final ResponseFactory responseFactory;

    /**
     * 新規アカウント登録
     *
     * @param request     登録リクエスト情報
     * @param httpRequest HTTPリクエスト
     * @return 201 Created ステータスと共通レスポンス形式
     */
    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Void>> register(
            @Valid @RequestBody RegisterRequest request,
            HttpServletRequest httpRequest) {

        // ユーザー登録処理
        registerService.register(request);

        // 正常終了レスポンスの生成
        ApiResponse<Void> response = responseFactory.success(httpRequest, null);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

}
