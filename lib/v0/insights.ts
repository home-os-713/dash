// ── Insights — shared types + deterministic rule-based generator ──────────────
//
// The insights API route (app/api/insights/route.ts) upgrades to Claude when
// ANTHROPIC_API_KEY is set, but the SAME rule-based generator below is the
// graceful-degradation path with no key — and the client falls back to it if the
// fetch fails. Either way the numbers come straight from the analytics engine, so
// nothing is ever fabricated.

import type { PortfolioMetrics, ProjectionSummary, Assumptions } from "@/lib/v0/analytics";
import { fmtMoney, fmtPct, fmtRatio } from "@/lib/v0/analytics";

export type InsightTone = "positive" | "watch" | "neutral";

export type Insight = {
  title: string;
  body: string;
  tone: InsightTone;
};

export type InsightsResponse = {
  source: "ai" | "rules"; // which engine produced these
  headline: string; // one-sentence portfolio summary
  insights: Insight[];
};

// The compact, real-numbers payload the page sends to the API and the rules use.
// Keeping it explicit (not the raw DB rows) means the AI prompt is small,
// cacheable, and contains only derived figures — no raw PII.
export type InsightsInput = {
  view: "owner" | "investor";
  assumptions: Assumptions;
  portfolio: PortfolioMetrics;
  projection: ProjectionSummary | null;
};

// ── Rule-based generator (deterministic, no fabrication) ──────────────────────

export function ruleBasedInsights(input: InsightsInput): InsightsResponse {
  const { portfolio: m, projection: proj, assumptions: a, view } = input;
  const insights: Insight[] = [];

  // Headline
  const headline =
    m.propertyCount === 0
      ? "Add a property to see portfolio analytics."
      : `${m.propertyCount} ${plural(m.propertyCount, "property", "properties")}` +
        (m.unitCount > m.propertyCount ? ` (${m.unitCount} units)` : "") +
        ` · ${fmtMoney(m.totalEquity)} equity on ${fmtMoney(m.totalValue)} of value` +
        (m.monthlyCashFlow !== 0
          ? ` · ${fmtMoney(m.monthlyCashFlow)}/mo cash flow`
          : "");

  // 1. Cash flow position
  if (m.monthlyCashFlow > 0) {
    insights.push({
      tone: "positive",
      title: "Portfolio is cash-flow positive",
      body: `Across your ${plural(m.propertyCount, "property", "properties")} you net ${fmtMoney(
        m.monthlyCashFlow
      )}/mo (${fmtMoney(m.monthlyCashFlow * 12)}/yr) after expenses and debt service.`,
    });
  } else if (m.monthlyCashFlow < 0) {
    insights.push({
      tone: "watch",
      title: "Portfolio runs negative monthly",
      body: `You're carrying ${fmtMoney(Math.abs(m.monthlyCashFlow))}/mo out of pocket after expenses and debt service. Appreciation and principal paydown may still make this profitable — see the projection below.`,
    });
  }

  // 2. Leverage / equity
  if (m.ltv != null) {
    if (m.ltv > 0.8) {
      insights.push({
        tone: "watch",
        title: "Highly leveraged",
        body: `Loan-to-value is ${fmtPct(m.ltv, 0)} — equity is a thin ${fmtPct(1 - m.ltv, 0)} of value. Refis and rate moves will swing returns more than at lower leverage.`,
      });
    } else {
      insights.push({
        tone: "neutral",
        title: "Healthy equity cushion",
        body: `Loan-to-value is ${fmtPct(m.ltv, 0)}, leaving ${fmtMoney(m.totalEquity)} of equity (${fmtPct(1 - m.ltv, 0)} of value).`,
      });
    }
  }

  // 3. Investor ratios (only surface in investor view, or when notable)
  if (view === "investor" || m.blendedCapRate != null) {
    if (m.blendedCapRate != null) {
      insights.push({
        tone: m.blendedCapRate >= 0.06 ? "positive" : "neutral",
        title: `Blended cap rate ${fmtPct(m.blendedCapRate)}`,
        body: `Portfolio NOI of ${fmtMoney(m.annualNOI)}/yr on ${fmtMoney(m.totalValue)} of value.${
          m.blendedCashOnCash != null
            ? ` Cash-on-cash on current equity is ${fmtPct(m.blendedCashOnCash)}.`
            : ""
        }`,
      });
    }
    if (m.blendedDSCR != null) {
      insights.push({
        tone: m.blendedDSCR >= 1.25 ? "positive" : m.blendedDSCR >= 1 ? "neutral" : "watch",
        title: `DSCR ${fmtRatio(m.blendedDSCR)}`,
        body:
          m.blendedDSCR >= 1.25
            ? `NOI covers debt service ${fmtRatio(m.blendedDSCR)} over — comfortably above the 1.25× most lenders want.`
            : m.blendedDSCR >= 1
              ? `NOI covers debt service ${fmtRatio(m.blendedDSCR)} over — positive but below the 1.25× lenders typically prefer.`
              : `NOI covers only ${fmtRatio(m.blendedDSCR)} of debt service — operations don't currently cover the mortgage.`,
      });
    }
  }

  // 4. The projection — the most decision-relevant, clearly labeled as modeled.
  if (proj && proj.holdingPeriod > 0) {
    const parts: string[] = [];
    parts.push(
      `Assuming ${a.appreciation}% appreciation and ${a.rentGrowth}% rent growth, in ${proj.holdingPeriod} years your equity grows from ${fmtMoney(
        proj.startEquity
      )} to ${fmtMoney(proj.endEquity)} (+${fmtMoney(proj.equityGain)}).`
    );
    parts.push(
      `That's ${fmtMoney(proj.appreciationGain)} of appreciation plus ${fmtMoney(
        proj.principalPaydown
      )} of loan paydown, with ${fmtMoney(proj.totalCashFlow)} of cumulative cash flow.`
    );
    insights.push({
      tone: "neutral",
      title: `Projected ${proj.holdingPeriod}-year outlook`,
      body: parts.join(" "),
    });

    if (proj.annualizedReturnPct != null) {
      insights.push({
        tone: proj.annualizedReturnPct >= 0.08 ? "positive" : "neutral",
        title: `~${fmtPct(proj.annualizedReturnPct)} projected annual return`,
        body: `Modeled total return on equity over the ${proj.holdingPeriod}-year hold, combining equity buildup and cash flow. These are projections under your assumptions, not guarantees.`,
      });
    }
  }

  // 5. Concentration risk
  if (m.perProperty.length > 1 && m.totalEquity > 0) {
    const top = [...m.perProperty].sort((x, y) => y.equity - x.equity)[0];
    const share = top.equity / m.totalEquity;
    if (share > 0.6) {
      insights.push({
        tone: "watch",
        title: "Equity is concentrated",
        body: `${fmtPct(share, 0)} of your equity sits in ${top.name}. A single-market or single-asset shock would hit the portfolio hard.`,
      });
    }
  }

  // 6. Data gaps — honest about what's missing rather than guessing.
  const missing = m.perProperty.filter((p) => !p.hasValue || !p.hasIncome);
  if (missing.length > 0) {
    insights.push({
      tone: "neutral",
      title: "Some figures are incomplete",
      body: `${missing.length} of ${m.perProperty.length} ${plural(
        m.perProperty.length,
        "property is",
        "properties are"
      )} missing a value or income figure, so portfolio ratios understate reality. Add them on each property page for sharper numbers.`,
    });
  }

  return { source: "rules", headline, insights: insights.slice(0, 6) };
}

function plural(n: number, one: string, many: string): string {
  return n === 1 ? one : many;
}
