package com.pitvia.api.shop.service;

import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;

import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitvia.api.auth.constant.UserRole;
import com.pitvia.api.auth.principal.JwtPrincipal;
import com.pitvia.api.common.exception.BusinessException;
import com.pitvia.api.common.exception.ErrorCode;
import com.pitvia.api.shop.constant.ShopInviteCodeConstants;
import com.pitvia.api.shop.dto.response.ShopInviteCodeResponse;
import com.pitvia.api.shop.entity.Shop;
import com.pitvia.api.shop.entity.ShopInviteCode;
import com.pitvia.api.shop.repository.ShopInviteCodeRepository;
import com.pitvia.api.shop.repository.ShopRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * ショップ招待コードの取得・発行を行うサービス
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class ShopInviteCodeService {

    /** 暗号学的に安全な乱数生成器（コード生成に使用） */
    private static final SecureRandom RANDOM = new SecureRandom();

    /** 招待コードリポジトリ */
    private final ShopInviteCodeRepository shopInviteCodeRepository;

    /** ショップリポジトリ */
    private final ShopRepository shopRepository;

    /**
     * 現在有効な招待コードを取得する
     *
     * @param principal 認証済みユーザー情報
     * @return 現在有効な招待コード（存在しない場合はnull）
     * @throws BusinessException OWNERロールが呼び出した場合（403、{@code FORBIDDEN}）
     */
    @Transactional(readOnly = true)
    public ShopInviteCodeResponse getCurrent(JwtPrincipal principal) {

        requireShop(principal);

        return shopInviteCodeRepository
                .findByShop_IdAndRevokedAtIsNullAndExpiresAtAfter(principal.userId(), Instant.now())
                .map(ShopInviteCodeResponse::from)
                .orElse(null);
    }

    /**
     * 招待コードを新規発行する
     *
     * <p>
     * 失効していない（{@code revokedAt IS NULL}）既存コードが存在する場合、有効期限切れかどうかに
     * 関わらず無条件で失効させたうえで、新しいコードを発行する。ショップ行に対する排他ロック
     * （{@link ShopRepository#findByIdForUpdate}）により、同一ショップからの同時リクエストが
     * あってもDBの部分一意インデックス（{@code shop_id} WHERE {@code revoked_at IS NULL}）と
     * 矛盾しないよう処理を直列化する。
     * </p>
     *
     * @param principal 認証済みユーザー情報
     * @return 新規発行された招待コード
     * @throws BusinessException OWNERロールが呼び出した場合（403、{@code FORBIDDEN}）
     */
    @Transactional
    public ShopInviteCodeResponse issue(JwtPrincipal principal) {

        requireShop(principal);

        // 同一ショップからの同時リクエストを直列化するための排他ロック
        Shop shop = shopRepository.findByIdForUpdate(principal.userId())
                .orElseThrow(() -> new IllegalStateException("Shop not found: " + principal.userId()));

        // 失効していない既存コードは、有効期限切れかどうかに関わらず無条件で失効させる
        shopInviteCodeRepository.findByShop_IdAndRevokedAtIsNull(principal.userId())
                .ifPresent(ShopInviteCode::revoke);

        ShopInviteCode newCode = ShopInviteCode.builder()
                .shop(shop)
                .code(generateUniqueCode())
                .expiresAt(Instant.now().plus(ShopInviteCodeConstants.EXPIRATION_HOURS, ChronoUnit.HOURS))
                .build();

        shopInviteCodeRepository.save(newCode);

        // コードの値そのものはログに出力しない
        log.info("Shop invite code issued. shopId={}", principal.userId());

        return ShopInviteCodeResponse.from(newCode);
    }

    /**
     * SHOPロールであることを検証する
     *
     * @param principal 認証済みユーザー情報
     * @throws BusinessException OWNERロールの場合（403、{@code FORBIDDEN}）
     */
    private void requireShop(JwtPrincipal principal) {
        if (principal.role() != UserRole.SHOP) {
            throw new BusinessException(ErrorCode.FORBIDDEN, HttpStatus.FORBIDDEN);
        }
    }

    /**
     * 既存コードと衝突しない招待コードを生成する
     *
     * @return 一意な招待コード
     */
    private String generateUniqueCode() {
        String code;
        do {
            code = generateCode();
        } while (shopInviteCodeRepository.existsByCode(code));
        return code;
    }

    /**
     * {@link SecureRandom}を用いて、ハイフン区切りの招待コード（例: "A7X9-K2LM"）を生成する
     *
     * @return 生成された招待コード
     */
    private String generateCode() {
        StringBuilder sb = new StringBuilder();
        String alphabet = ShopInviteCodeConstants.CODE_ALPHABET;

        for (int block = 0; block < ShopInviteCodeConstants.CODE_SEGMENT_COUNT; block++) {
            if (block > 0) {
                sb.append('-');
            }
            for (int i = 0; i < ShopInviteCodeConstants.CODE_SEGMENT_LENGTH; i++) {
                sb.append(alphabet.charAt(RANDOM.nextInt(alphabet.length())));
            }
        }

        return sb.toString();
    }

}
