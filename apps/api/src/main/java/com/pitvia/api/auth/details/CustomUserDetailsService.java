package com.pitvia.api.auth.details;

import lombok.RequiredArgsConstructor;

import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.pitvia.api.user.repository.UserRepository;

/**
 * メールアドレスを基準にユーザー情報をDBから取得し、Spring Securityへ仲介するサービス
 *
 * @author pitvia
 * @version 1.0
 */
@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    /**
     * ユーザー情報アクセス用のリポジトリ
     */
    private final UserRepository userRepository;

    /**
     * {@link #loadUserByEmail(String)}を呼び出して処理を委譲する
     *
     * @param email ログイン時に入力されたメールアドレス
     * @return 認証処理に必要なUserDetailsオブジェクト
     * @throws UsernameNotFoundException 該当ユーザーが存在しない、または論理削除されている場合
     */
    @Override
    @Transactional(readOnly = true)
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return loadUserByEmail(email);
    }

    /**
     * メールアドレスを条件にユーザー情報を検索し、UserDetailsオブジェクトを返却
     *
     * @param email ログイン時に入力されたメールアドレス
     * @return 認証処理に必要なUserDetailsオブジェクト
     * @throws UsernameNotFoundException 該当ユーザーが存在しない、または論理削除されている場合
     */
    @Transactional(readOnly = true)
    public CustomUserDetails loadUserByEmail(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .map(CustomUserDetails::new)
                .orElseThrow(() -> new UsernameNotFoundException("User not found"));
    }

}
