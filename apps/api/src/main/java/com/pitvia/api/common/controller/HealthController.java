package com.pitvia.api.common.controller;

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
@RequestMapping("/health")
@CrossOrigin(origins = "http://localhost:3000")
public class HealthController {

    /**
     * システムの生存状態を判定する。
     *
     * @return サーバーが正常であることを示す文字列
     */
    @GetMapping
    public String health() {
        return "Pitvia API OK";
    }

}
