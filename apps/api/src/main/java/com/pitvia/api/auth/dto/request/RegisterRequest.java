package com.pitvia.api.auth.dto.request;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.common.validation.PasswordMatches;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * ユーザー登録リクエストDTO
 *
 * @author pitvia
 * @version 1.0
 */
@PasswordMatches
public record RegisterRequest(

        /**
         * ユーザーロール
         */
        @NotNull(message = "{validation.user.role.required}")
        UserRole role,

        /**
         * ユーザー名
         */
        @NotBlank(message = "{validation.user.userName.required}")
        @Size(max = 100, message = "{validation.user.userName.size.max}")
        String userName,

        /**
         * メールアドレス
         */
        @NotBlank(message = "{validation.user.email.required}")
        @Email(message = "{validation.user.email.invalid}")
        @Size(max = 255, message = "{validation.user.email.size.max}")
        String email,

        /**
         * パスワード
         */
        @NotBlank(message = "{validation.user.password.required}")
        @Size(min = 8, max = 128, message = "{validation.user.password.size.range}")
        @Pattern(regexp = "^(?=.*[A-Za-z])(?=.*\\d).+$", message = "{validation.user.password.pattern}")
        String password,

        /**
         * パスワード（確認用）
         */
        @NotBlank(message = "{validation.user.confirmPassword.required}")
        String confirmPassword) {
}
