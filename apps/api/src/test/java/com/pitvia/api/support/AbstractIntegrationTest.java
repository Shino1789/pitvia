package com.pitvia.api.support;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

/**
 * テスト共通基底クラス
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
@ActiveProfiles("test")
public abstract class AbstractIntegrationTest {

    /** MockMvcインスタンス */
    @Autowired
    protected MockMvc mockMvc;

    /** テストユーザー操作用ヘルパー */
    @Autowired
    protected TestUserHelper testUserHelper;

}
