package com.pitvia.api.auth.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/**
 * ログインリクエストDTO
 *
 * @author pitvia
 * @version 1.0
 */
public record LoginRequest(

        /**
         * メールアドレス
         */
        @NotBlank(message = "{validation.user.email.required}")
        @Email(message = "{validation.user.email.invalid}")
        String email,

        /**
         * パスワード
         */
        @NotBlank(message = "{validation.user.password.required}")
        String password) {

}
