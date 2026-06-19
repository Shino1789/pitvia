"use client";

import { useState } from "react";

/**
 * ルートパス (/)
 */
export default function Home() {
  // APIレスポンスメッセージ
  const [message, setMessage] = useState<string>("");

  // ローディング状態
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 共通ヘルスチェック関数
   *
   * @param endpoint APIエンドポイント
   */
  const fetchHealth = async (endpoint: string) => {
    setIsLoading(true);
    setMessage("");

    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}${endpoint}`;

      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();

      setMessage(data);
    } catch (error) {
      console.error("API接続エラー:", error);

      setMessage("APIへの接続に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Hello, Pitvia.</h1>

      <div
        style={{
          marginTop: "1.5rem",
          display: "flex",
          gap: "1rem",
        }}
      >
        {/* API疎通確認 */}
        <button
          onClick={() => fetchHealth("/health")}
          disabled={isLoading}
          style={buttonStyle}
        >
          {isLoading ? "接続中..." : "API疎通確認"}
        </button>

        {/* DB疎通確認 */}
        <button
          onClick={() => fetchHealth("/health/db")}
          disabled={isLoading}
          style={buttonStyle}
        >
          {isLoading ? "接続中..." : "DB疎通確認"}
        </button>
      </div>

      {/* 結果表示 */}
      {message && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
            borderLeft: "4px solid #0070f3",
          }}
        >
          <strong>レスポンス:</strong>

          <p style={{ margin: "0.5rem 0 0 0" }}>{message}</p>
        </div>
      )}
    </main>
  );
}

/**
 * ボタン共通スタイル
 */
const buttonStyle = {
  padding: "0.5rem 1rem",
  cursor: "pointer",
  backgroundColor: "#0070f3",
  color: "white",
  border: "none",
  borderRadius: "4px",
  fontSize: "1rem",
};
