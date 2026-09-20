package com.pitvia.api.shop.dto.request;

import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * OWNERによる、招待コード入力を用いたショップ連携リクエストDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record ShopLinkRequest(

        /**
         * 連携対象の車両ID（OWNER本人が所有する車両である必要がある）
         */
        @NotNull(message = "{validation.shop.vehicleId.required}") UUID vehicleId,

        /**
         * SHOPが発行した招待コード
         */
        @NotBlank(message = "{validation.shop.inviteCode.required}") String inviteCode) {
}
