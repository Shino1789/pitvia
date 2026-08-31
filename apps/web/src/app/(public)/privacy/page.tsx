import type { Metadata } from "next";
import {
  LegalLayout,
  LegalSectionBlock,
} from "@/features/legal/components/legal-layout";

/**
 * メタデータ定義
 */
export const metadata: Metadata = {
  title: "プライバシーポリシー | Pitvia",
  description: "Pitvia のプライバシーポリシーです。",
};

/**
 * プライバシーポリシーの各セクション定義
 */
const sections = [
  { id: "intro", heading: "はじめに" },
  { id: "collect", heading: "取得する情報" },
  { id: "purpose", heading: "利用目的" },
  { id: "thirdparty", heading: "第三者提供" },
  { id: "cookie", heading: "Cookie等の利用" },
  { id: "security", heading: "安全管理措置" },
  { id: "rights", heading: "ユーザーの権利" },
];

/**
 * プライバシーポリシーページコンポーネント
 *
 * @component
 * @returns プライバシーポリシー画面のJSX要素
 */
export default function PrivacyPage() {
  return (
    <LegalLayout
      title="プライバシーポリシー"
      subtitle="Pitvia（以下「本サービス」）は、ユーザーの個人情報を適切に取り扱うことを重要な責務と考えています。本ポリシーは、本サービスにおける個人情報の取り扱いについて定めるものです。"
      sections={sections}
    >
      {/* 1. はじめに */}
      <LegalSectionBlock id="intro" index={1} heading="はじめに">
        <p>
          本ポリシーは、本サービスがユーザーから取得する情報の種類、その利用目的、および管理方法について説明します。本サービスを利用することで、ユーザーは本ポリシーに同意したものとみなされます。
        </p>
      </LegalSectionBlock>

      {/* 2. 取得する情報 */}
      <LegalSectionBlock id="collect" index={2} heading="取得する情報">
        <p>本サービスは、以下の情報を取得することがあります。</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>アカウント情報（氏名または会社名、メールアドレス等）</li>
          <li>車両情報および整備記録などのユーザー登録データ</li>
          <li>サービス利用状況、アクセスログ、端末情報</li>
        </ul>
      </LegalSectionBlock>

      {/* 3. 利用目的 */}
      <LegalSectionBlock id="purpose" index={3} heading="利用目的">
        <p>取得した情報は、以下の目的で利用します。</p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>本サービスの提供、維持、および改善</li>
          <li>ユーザー認証およびアカウント管理</li>
          <li>お問い合わせへの対応</li>
          <li>利用状況の分析および機能開発</li>
        </ul>
      </LegalSectionBlock>

      {/* 4. 第三者提供 */}
      <LegalSectionBlock id="thirdparty" index={4} heading="第三者提供">
        <p>
          本サービスは、法令に基づく場合を除き、ユーザーの同意なく個人情報を第三者に提供することはありません。ただし、サービス提供に必要な範囲で業務委託先に情報を預託する場合があります。
        </p>
      </LegalSectionBlock>

      {/* 5. Cookie等の利用 */}
      <LegalSectionBlock id="cookie" index={5} heading="Cookie等の利用">
        <p>
          本サービスは、利便性の向上や利用状況の分析のため、Cookieおよび類似技術を利用することがあります。ユーザーはブラウザの設定によりCookieの利用を制限できますが、その場合一部機能が利用できなくなる可能性があります。
        </p>
      </LegalSectionBlock>

      {/* 6. 安全管理措置 */}
      <LegalSectionBlock id="security" index={6} heading="安全管理措置">
        <p>
          本サービスは、取得した個人情報の漏洩、滅失、または毀損を防止するため、適切な技術的・組織的な安全管理措置を講じます。
        </p>
      </LegalSectionBlock>

      {/* 7. ユーザーの権利 */}
      <LegalSectionBlock id="rights" index={7} heading="ユーザーの権利">
        <p>
          ユーザーは、自身の個人情報について、開示、訂正、削除、利用停止等を求めることができます。これらのご請求については、正式公開後に設置予定のお問い合わせフォームより受け付けます。
        </p>
      </LegalSectionBlock>
    </LegalLayout>
  );
}
