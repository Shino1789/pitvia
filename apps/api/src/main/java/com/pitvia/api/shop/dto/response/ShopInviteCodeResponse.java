package com.pitvia.api.shop.dto.response;

import java.time.Instant;

import com.pitvia.api.shop.entity.ShopInviteCode;

/**
 * ショップ招待コードレスポンスDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record ShopInviteCodeResponse(

        /**
         * 招待コード
         */
        String code,

        /**
         * 有効期限
         */
        Instant expiresAt) {

    /**
     * ShopInviteCodeエンティティから生成
     *
     * @param entity 招待コードエンティティ
     * @return ShopInviteCodeResponse
     */
    public static ShopInviteCodeResponse from(ShopInviteCode entity) {
        return new ShopInviteCodeResponse(entity.getCode(), entity.getExpiresAt());
    }

}
