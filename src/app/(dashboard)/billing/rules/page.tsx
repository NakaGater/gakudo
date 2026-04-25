import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader } from "@/components/ui";
import { getUser } from "@/lib/auth/get-user";
import { getActiveBillingRule, getBillingRules } from "../actions";
import { BillingRuleForm } from "./billing-rule-form";
import type { BillingRule } from "../types";

function formatTime(time: string) {
  return time.slice(0, 5);
}

function formatDate(dateString: string) {
  return new Date(dateString).toLocaleDateString("ja-JP", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function isActive(rule: BillingRule, activeRule: BillingRule | null): boolean {
  return activeRule !== null && rule.id === activeRule.id;
}

export default async function BillingRulesPage() {
  const user = await getUser();
  if (user.role !== "admin") redirect("/");

  const [activeRule, allRules] = await Promise.all([getActiveBillingRule(), getBillingRules()]);

  return (
    <div className="p-6 max-w-4xl mx-auto flex flex-col gap-6">
      <h1 className="text-2xl font-bold text-fg">料金ルール</h1>

      {/* Current active rule */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-fg">現在のルール</h2>
        </CardHeader>
        <CardContent>
          {activeRule ? (
            <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-4">
              <div>
                <dt className="text-fg-muted">通常終了時刻</dt>
                <dd className="font-medium text-fg">{formatTime(activeRule.regular_end_time)}</dd>
              </div>
              <div>
                <dt className="text-fg-muted">延長単価</dt>
                <dd className="font-medium text-fg">
                  {activeRule.rate_per_unit.toLocaleString()}円
                </dd>
              </div>
              <div>
                <dt className="text-fg-muted">単位時間</dt>
                <dd className="font-medium text-fg">{activeRule.unit_minutes}分</dd>
              </div>
              <div>
                <dt className="text-fg-muted">適用開始日</dt>
                <dd className="font-medium text-fg">{formatDate(activeRule.effective_from)}</dd>
              </div>
            </dl>
          ) : (
            <p className="text-fg-muted text-sm">現在有効なルールがありません</p>
          )}
        </CardContent>
      </Card>

      {/* Create new rule form */}
      <BillingRuleForm />

      {/* Rule history */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-fg">ルール履歴</h2>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 font-medium text-fg-muted">適用開始日</th>
                  <th className="px-4 py-3 font-medium text-fg-muted">通常終了時刻</th>
                  <th className="px-4 py-3 font-medium text-fg-muted">延長単価</th>
                  <th className="px-4 py-3 font-medium text-fg-muted">単位時間</th>
                  <th className="px-4 py-3 font-medium text-fg-muted">状態</th>
                </tr>
              </thead>
              <tbody>
                {allRules.map((rule) => (
                  <tr key={rule.id} className="border-b border-border last:border-0">
                    <td className="px-4 py-3 text-fg">{formatDate(rule.effective_from)}</td>
                    <td className="px-4 py-3 text-fg">{formatTime(rule.regular_end_time)}</td>
                    <td className="px-4 py-3 text-fg">{rule.rate_per_unit.toLocaleString()}円</td>
                    <td className="px-4 py-3 text-fg">{rule.unit_minutes}分</td>
                    <td className="px-4 py-3">
                      {isActive(rule, activeRule) ? (
                        <span className="inline-flex items-center rounded-full bg-enter/10 px-2 py-0.5 text-xs font-medium text-enter">
                          有効
                        </span>
                      ) : (
                        <span className="text-fg-muted text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
                {allRules.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-fg-muted">
                      ルールがありません
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
