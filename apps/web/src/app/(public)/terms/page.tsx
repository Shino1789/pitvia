import type { Metadata } from "next";
import {
  LegalLayout,
  LegalSectionBlock,
} from "@/features/legal/components/legal-layout";

/**
 * メタデータ定義
 */
export const metadata: Metadata = {
  title: "利用規約 | Pitvia",
  description: "Pitvia の利用規約です。",
};

/**
 * 利用規約の各セクション定義
 */
const sections = [
  { id: "agreement", heading: "規約への同意" },
  { id: "account", heading: "アカウント登録" },
  { id: "usage", heading: "サービスの利用" },
  { id: "prohibited", heading: "禁止事項" },
  { id: "content", heading: "投稿コンテンツ" },
  { id: "disclaimer", heading: "免責事項" },
  { id: "changes", heading: "規約の変更" },
];

/**
 * 利用規約ページコンポーネント
 *
 * @component
 * @returns 利用規約画面のJSX要素
 */
export default function TermsPage() {
  return (
    <LegalLayout
      title="利用規約"
      subtitle="本利用規約（以下「本規約」）は、Pitvia（以下「本サービス」）の利用条件を定めるものです。本サービスをご利用いただく前に、必ずお読みください。"
      sections={sections}
    >
      {/* 1. 規約への同意 */}
      <LegalSectionBlock id="agreement" index={1} heading="規約への同意">
        <p>
          ユーザーは、本サービスを利用することにより、本規約のすべての内容に同意したものとみなされます。本規約に同意いただけない場合は、本サービスをご利用いただくことはできません。
        </p>
      </LegalSectionBlock>

      {/* 2. アカウント登録 */}
      <LegalSectionBlock id="account" index={2} heading="アカウント登録">
        <p>
          本サービスの一部機能をご利用いただくには、アカウントの登録が必要です。ユーザーは、登録の際に正確かつ最新の情報を提供するものとします。
        </p>
        <p>
          ユーザーは、自身のアカウント情報およびパスワードの管理について責任を負うものとし、第三者による不正利用が判明した場合は速やかに運営者へ通知するものとします。
        </p>
      </LegalSectionBlock>

      {/* 3. サービスの利用 */}
      <LegalSectionBlock id="usage" index={3} heading="サービスの利用">
        <p>
          本サービスは、車両の整備記録・部品交換履歴・走行ログの管理、および連携ショップ情報の閲覧などの機能を提供します。ユーザーは、法令および本規約に従って本サービスを利用するものとします。
        </p>
        <p>
          運営者は、事前の通知なく本サービスの内容を変更、追加、または停止することがあります。
        </p>
      </LegalSectionBlock>

      {/* 4. 禁止事項 */}
      <LegalSectionBlock id="prohibited" index={4} heading="禁止事項">
        <p>
          ユーザーは、本サービスの利用にあたり、以下の行為を行ってはならないものとします。
        </p>
        <ul className="list-disc space-y-1.5 pl-5">
          <li>法令または公序良俗に違反する行為</li>
          <li>他のユーザーまたは第三者の権利を侵害する行為</li>
          <li>虚偽の情報を登録する行為</li>
          <li>本サービスの運営を妨害する行為</li>
          <li>不正アクセスまたはこれを試みる行為</li>
        </ul>
      </LegalSectionBlock>

      {/* 5. 投稿コンテンツ */}
      <LegalSectionBlock id="content" index={5} heading="投稿コンテンツ">
        <p>
          ユーザーが本サービスに登録した整備記録・画像・レビュー等のコンテンツに関する権利は、ユーザーに帰属します。ただし、運営者はサービスの提供・改善に必要な範囲でこれらを利用できるものとします。
        </p>
      </LegalSectionBlock>

      {/* 6. 免責事項 */}
      <LegalSectionBlock id="disclaimer" index={6} heading="免責事項">
        <p>
          運営者は、本サービスに関して、その完全性、正確性、有用性等について保証するものではありません。本サービスの利用によりユーザーに生じた損害について、運営者は法令で認められる範囲で責任を負わないものとします。
        </p>
      </LegalSectionBlock>

      {/* 7. 規約の変更 */}
      <LegalSectionBlock id="changes" index={7} heading="規約の変更">
        <p>
          運営者は、必要と判断した場合、ユーザーへの事前の通知なく本規約を変更できるものとします。変更後の規約は、本サービス上に表示された時点から効力を生じるものとします。
        </p>
      </LegalSectionBlock>
    </LegalLayout>
  );
}
