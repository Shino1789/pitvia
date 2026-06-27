package com.pitvia.api.auth.controller;

import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.pitvia.api.auth.dto.request.LoginRequest;
import com.pitvia.api.auth.dto.request.RegisterRequest;
import com.pitvia.api.auth.dto.response.LoginResponse;
import com.pitvia.api.auth.factory.RefreshTokenCookieFactory;
import com.pitvia.api.auth.model.LoginResult;
import com.pitvia.api.auth.service.LoginService;
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
@RequestMapping(ApiPaths.AUTH)
@RequiredArgsConstructor
@Validated
public class AuthController {

    /** アカウント登録サービス */
    private final RegisterService registerService;

    /** ログインサービス */
    private final LoginService loginService;

    /** リフレッシュトークンクッキー生成ファクトリ */
    private final RefreshTokenCookieFactory cookieFactory;

    /** レスポンスオブジェクト生成ファクトリ */
    private final ResponseFactory responseFactory;

    /**
     * 新規アカウント登録
     *
     * @param request     登録リクエスト情報
     * @param httpRequest HTTPリクエスト
     * @return 201 Created ステータスとアカウント作成成功レスポンス
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

    /**
     * ログイン認証
     *
     * @param request     ログインリクエスト情報
     * @param httpRequest HTTPリクエスト
     * @return 200 OK ステータス、Set-Cookieヘッダー、およびログイン成功レスポンス
     */
    @PostMapping("/login")
    public ResponseEntity<ApiResponse<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) { // ★ httpResponse を削除！

        // ログイン認証の実行
        LoginResult result = loginService.login(request, httpRequest);

        // ファクトリーからリフレッシュトークンCookieの生成
        ResponseCookie cookie = cookieFactory.create(result.refreshToken());

        // 処理結果モデルからレスポンスDTOへの変換
        LoginResponse loginResponse = LoginResponse.from(result);

        // 共通正常レスポンスの生成
        ApiResponse<LoginResponse> response = responseFactory.success(httpRequest, loginResponse);

        return ResponseEntity.ok()
                .header(HttpHeaders.SET_COOKIE, cookie.toString())
                .body(response);
    }

}
