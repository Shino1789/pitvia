package com.pitvia.api.health.controller;

import com.pitvia.api.health.service.HealthService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * アプリケーションの稼働状態を確認するためのコントローラークラス。
 *
 * @author pitvia
 * @version 1.0
 */
@RestController
@RequestMapping("/v1/health")
@CrossOrigin(origins = "http://localhost:3000")
@RequiredArgsConstructor
public class HealthController {

    private final HealthService healthService;

    /**
     * APIの生存状態を判定する。
     *
     * @return サーバーが正常であることを示す文字列
     */
    @GetMapping
    public String health() {
        return "Pitvia API OK";
    }

    /**
     * APIおよびDBの疎通確認を行う。
     *
     * @return 疎通確認結果
     */
    @GetMapping("/db")
    public String healthDb() {
        return healthService.checkHealth();
    }
}
