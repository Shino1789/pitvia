package com.pitvia.api.auth.service;

import java.util.Locale;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.auth.dto.request.RegisterRequest;
import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.shop.entity.Shop;
import com.pitvia.api.shop.repository.ShopRepository;
import com.pitvia.api.user.entity.User;
import com.pitvia.api.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * アカウント登録サービス
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RegisterService {

    /** ユーザーリポジトリ */
    private final UserRepository userRepository;

    /** ショップリポジトリ */
    private final ShopRepository shopRepository;

    /** パスワードエンコーダー */
    private final PasswordEncoder passwordEncoder;

    /**
     * ユーザーアカウント登録処理
     *
     * @param request 登録リクエスト情報
     * @throws BusinessException メールアドレスが既に存在する場合、または不正なロールの場合
     */
    @Transactional
    public void register(RegisterRequest request) {

        // ADMIN（管理者）ロールの登録要求をブロック
        if (request.role() == UserRole.ADMIN) {
            log.warn("Register denied: Unauthorized attempt to register as ADMIN. email={}", request.email());
            throw new BusinessException(ErrorCode.INVALID_ROLE);
        }

        // メールアドレスの正規化
        String normalizedEmail = request.email().trim().toLowerCase(Locale.ROOT);
        log.info("Register started. email={}, role={}", normalizedEmail, request.role());

        // 既に同じメールアドレスが登録済みでないかチェック
        if (userRepository.existsByEmail(normalizedEmail)) {
            log.warn("Register failed: Duplicate email detected during pre-check. email={}", normalizedEmail);
            throw new BusinessException(ErrorCode.USER_ALREADY_EXISTS);
        }

        // パスワードのハッシュ化
        String encodedPassword = passwordEncoder.encode(request.password());

        User user = User.builder()
                .role(request.role())
                .userName(request.userName())
                .email(normalizedEmail)
                .passwordHash(encodedPassword)
                .build();

        User savedUser;

        try {
            // DBに即時登録
            savedUser = userRepository.saveAndFlush(user);
        } catch (DataIntegrityViolationException ex) {
            log.warn("Register failed: Duplicate email registration. email={}", normalizedEmail);
            throw new BusinessException(ErrorCode.USER_ALREADY_EXISTS);
        }

        // ロールが「SHOP」の場合、ショップ情報レコードも自動作成
        if (savedUser.getRole() == UserRole.SHOP) {
            Shop shop = Shop.builder()
                    .user(savedUser)
                    .build();

            shopRepository.save(shop);
        }

        log.info("Register completed successfully. userId={}", savedUser.getId());
    }

}
