package com.pitvia.api.auth.details;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.pitvia.api.user.entity.User;

import java.util.Collection;
import java.util.List;
import java.util.UUID;

/**
 * Spring Securityの認証・認可処理で利用される独自ユーザー詳細情報クラス
 *
 * @author pitvia
 * @version 1.0
 */
public class CustomUserDetails implements UserDetails {

    /**
     * ユーザーエンティティ
     */
    private final User user;

    /**
     * ユーザーに付与された認可権限リスト
     */
    private final Collection<? extends GrantedAuthority> authorities;

    /**
     * Userエンティティを保持し、Securityに必要な情報をセットする
     *
     * @param user ユーザーエンティティ
     */
    public CustomUserDetails(User user) {
        this.user = user;
        this.authorities = List.of(new SimpleGrantedAuthority(user.getRole().getAuthority()));
    }

    /**
     * 認証済みのUserエンティティを直接取得するカスタムGetter
     *
     * @return ユーザーエンティティ
     */
    public User getUser() {
        return this.user;
    }

    /**
     * アプリケーション内でユーザーIDを特定するためのカスタムGetter
     */
    public UUID getId() {
        return this.user.getId();
    }

    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        return this.authorities;
    }

    @Override
    public String getPassword() {
        return this.user.getPasswordHash();
    }

    @Override
    public String getUsername() {
        return this.user.getEmail(); // PitviaではメールアドレスをログインIDとして扱う
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
