package com.pitvia.api.auth.details;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.pitvia.api.user.entity.User;

import java.util.Collection;
import java.util.List;

/**
 * Spring Securityの認証・認可処理で利用される独自ユーザー詳細情報クラス
 *
 * @author pitvia
 * @version 1.0
 */
public class CustomUserDetails implements UserDetails {

    /**
     * ユーザーID
     */
    private final Long id;

    /**
     * メールアドレス
     */
    private final String email;

    /**
     * パスワードハッシュ
     */
    private final String passwordHash;

    /**
     * ユーザーに付与された認可権限リスト
     */
    private final Collection<? extends GrantedAuthority> authorities;

    /**
     * UserエンティティからSecurityに必要な情報のみを抽出してセットする
     *
     * @param user ユーザーエンティティ
     */
    public CustomUserDetails(User user) {
        this.id = user.getId();
        this.email = user.getEmail();
        this.passwordHash = user.getPasswordHash();
        this.authorities = List.of(new SimpleGrantedAuthority(user.getRole().getAuthority()));
    }

    /**
     * アプリケーション内でユーザーIDを特定するためのカスタムGetter
     */
    public Long getId() {
        return this.id;
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.authorities;
    }

    @Override
    public String getPassword() {
        return this.passwordHash;
    }

    @Override
    public String getUsername() {
        return this.email; // PitviaではメールアドレスをログインIDとして扱う
    }

    @Override
    public boolean isAccountNonExpired() {
        return true; // アカウント有効期限の要件がないためtrue
    }

    @Override
    public boolean isAccountNonLocked() {
        return true; // アカウントロック機能はサービス層で制御するため原則true
    }

    @Override
    public boolean isCredentialsNonExpired() {
        return true; // 資格情報の期限切れは使用しないため原則true
    }

    @Override
    public boolean isEnabled() {
        return true; // 論理削除等はリポジトリの検索条件(SQLRestriction等)で弾くため原則true
    }

}
