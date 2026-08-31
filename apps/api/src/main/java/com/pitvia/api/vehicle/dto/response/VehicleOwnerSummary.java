package com.pitvia.api.vehicle.dto.response;

import java.util.UUID;

import com.pitvia.api.user.entity.User;

/**
 * 車両一覧の対象オーナーを表すデータ転送オブジェクト
 *
 * @author pitvia
 * @version 1.0
 */
public record VehicleOwnerSummary(

        /**
         * オーナーのユーザーID
         */
        UUID id,

        /**
         * オーナーの表示名
         */
        String userName) {

    /**
     * Userエンティティから生成
     *
     * @param user オーナーのユーザーエンティティ
     * @return VehicleOwnerSummary
     */
    public static VehicleOwnerSummary from(User user) {
        return new VehicleOwnerSummary(user.getId(), user.getUserName());
    }
}
