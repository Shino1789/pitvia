package com.pitvia.api.health.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

/**
 * ヘルスチェックサービス。
 *
 * @author pitvia
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
public class HealthService {

    private final JdbcTemplate jdbcTemplate;

    /**
     * DB接続確認を行う。
     *
     * @return 疎通確認メッセージ
     */
    public String checkHealth() {

        Integer result = jdbcTemplate.queryForObject(
                "SELECT 1",
                Integer.class);

        if (result != null && result == 1) {
            return "Pitvia API & DB OK";
        }

        return "DB Connection Failed";
    }
}
