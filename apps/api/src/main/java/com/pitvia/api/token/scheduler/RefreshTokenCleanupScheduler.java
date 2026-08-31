package com.pitvia.api.token.scheduler;

import java.time.Instant;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitvia.api.token.repository.RefreshTokenRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * リフレッシュトークンの定期クリーンアップスケジューラ
 *
 * <p>
 * 有効期限切れ、または失効済みのリフレッシュトークンを
 * 定期的に物理削除し、データベースの肥大化を防止する。
 * </p>
 *
 * @author pitvia
 * @version 1.0
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class RefreshTokenCleanupScheduler {

    /** リフレッシュトークンリポジトリ */
    private final RefreshTokenRepository refreshTokenRepository;

    /**
     * リフレッシュトークンを定期的にクリーンアップ
     *
     * <p>
     * 毎日午前3時に実行し、有効期限切れ、または失効済みの
     * リフレッシュトークンを物理削除する。
     * </p>
     */
    @Scheduled(cron = "${app.scheduler.refresh-token-cron}")
    @Transactional
    public void cleanup() {

        // 有効期限切れ、または失効済みのトークンを物理削除
        int deleted = refreshTokenRepository.deleteAllByExpiredOrRevoked(Instant.now());

        log.info("Refresh token cleanup completed. deleted={}", deleted);
    }

}
