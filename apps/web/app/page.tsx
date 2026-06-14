"use client";

import { useState } from "react";

/**
 * ルートパス (/)
 */
export default function Home() {
  // APIからのレスポンスを保存するステート
  const [healthMessage, setHealthMessage] = useState<string>("");
  // ローディング状態を管理するステート
  const [isLoading, setIsLoading] = useState<boolean>(false);

  /**
   * 疎通確認用API（Spring Boot）を呼び出す関数
   */
  const checkApiHealth = async () => {
    setIsLoading(true);
    setHealthMessage("");

    try {
      // 環境変数からベースURLを取得して結合
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/health`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.text();
      setHealthMessage(data); // "Pitvia API OK" がセットされる
    } catch (error) {
      console.error("API接続エラー:", error);
      setHealthMessage("APIへの接続に失敗しました。");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main style={{ padding: "2rem", fontFamily: "sans-serif" }}>
      <h1>Hello, Pitvia.</h1>

      <div style={{ marginTop: "1.5rem" }}>
        <button
          onClick={checkApiHealth}
          disabled={isLoading}
          style={{
            padding: "0.5rem 1rem",
            cursor: isLoading ? "not-allowed" : "pointer",
            backgroundColor: "#0070f3",
            color: "white",
            border: "none",
            borderRadius: "4px",
            fontSize: "1rem",
          }}
        >
          {isLoading ? "接続中..." : "API疎通確認"}
        </button>
      </div>

      {/* 結果の表示エリア */}
      {healthMessage && (
        <div
          style={{
            marginTop: "1.5rem",
            padding: "1rem",
            backgroundColor: "#f0f0f0",
            borderRadius: "4px",
            borderLeft: "4px solid #0070f3",
          }}
        >
          <strong>APIレスポンス:</strong>
          <p style={{ margin: "0.5rem 0 0 0" }}>{healthMessage}</p>
        </div>
      )}
    </main>
  );
}
