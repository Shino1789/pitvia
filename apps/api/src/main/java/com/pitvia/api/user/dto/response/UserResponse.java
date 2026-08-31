package com.pitvia.api.user.dto.response;

import java.util.UUID;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.user.entity.User;

/**
 * ユーザー情報レスポンス
 */
public record UserResponse(

        /**
         * ユーザーID
         */
        UUID userId,

        /**
         * ユーザー権限
         */
        UserRole role,

        /**
         * ユーザー名
         */
        String userName,

        /**
         * メールアドレス
         */
        String email,

        /**
         * アイコン画像のストレージキー
         */
        String iconKey

) {

    /**
     * Userエンティティから生成
     *
     * @param user ユーザー
     * @return UserResponse
     */
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getRole(),
                user.getUserName(),
                user.getEmail(),
                user.getIconKey());
    }
}
