package com.pitvia.api.auth.dto.response;

import com.pitvia.api.auth.model.RefreshResult;

/**
 * トークンリフレッシュ（再発行）時のレスポンスDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record RefreshTokenResponse(

        /**
         * 新しく発行されたアクセストークン（JWT）
         */
        String accessToken) {

    /**
     * リフレッシュ処理結果モデルからレスポンスDTOを生成する
     *
     * @param result リフレッシュ処理結果
     * @return レンスポンスDTO
     */
    public static RefreshTokenResponse from(RefreshResult result) {
        return new RefreshTokenResponse(result.accessToken());
    }

}
