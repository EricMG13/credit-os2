import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { HeadlineFigures } from "./HeadlineFigures";
import type { CatalogueRun } from "./publishedReport";

const run = (metrics: CatalogueRun["metrics"]): CatalogueRun => ({
  id: "r",
  name: "r",
  issuer: "A",
  title: "",
  date: "2025-01-01",
  sector: "",
  period: "",
  metrics,
});

describe("headline year comparator", () => {
  it("draws sign, words and colour for each metric", () => {
    render(
      <HeadlineFigures
        catalogue={run({
          net_leverage: {
            value: "4.4",
            unit: "x",
            period: "FY2024",
            prior: { value: "4.2", period: "FY2023" },
            change: "0.2",
          },
          coverage: {
            value: "4.00",
            unit: "x",
            period: "FY2024",
            prior: { value: "4.50", period: "FY2023" },
            change: "-0.50",
          },
          cash: {
            value: "275",
            unit: "USD millions",
            period: "FY2024",
            prior: { value: "300", period: "FY2023" },
            change: "-25",
          },
          revenue: {
            value: "100",
            unit: "USD millions",
            period: "FY2024",
            prior: { value: "100", period: "FY2023" },
            change: "0",
          },
          leverage: { value: "5.0", unit: "x", period: "FY2024" },
        })}
      />,
    );
    const lev = screen.getByText(/\+0\.2x vs FY2023/);
    expect(lev.textContent).toContain("worse");
    expect(lev.className).toContain("text-error-text");
    const cov = screen.getByText(/-0\.50x vs FY2023/);
    expect(cov.textContent).toContain("worse");
    const cash = screen.getByText(/-\$25m vs FY2023/);
    for (const word of ["better", "worse", "unchanged"])
      expect(cash.textContent).not.toContain(word);
    expect(cash.className).toContain("text-text-secondary");
    expect(cash.querySelector("[data-shape]")).toBeNull();
    const flat = screen.getByText(/\$0m vs FY2023/);
    expect(flat.textContent).toContain("unchanged");
    expect(flat.className).toContain("text-text-secondary");
    expect(screen.getAllByText(/ vs /)).toHaveLength(4);
  });

  it("marks each tone with a visible word and a shape, once, never sr-only", () => {
    const metric = (change: string) => ({
      value: "4.4",
      unit: "x",
      period: "FY2024",
      prior: { value: "4.2", period: "FY2023" },
      change,
    });
    render(
      <HeadlineFigures
        catalogue={run({
          net_leverage: metric("0.2"),
          coverage: metric("0.2"),
          revenue: { ...metric("0"), unit: "USD millions" },
        })}
      />,
    );
    const line = (text: RegExp) => {
      const el = screen.getByText(text);
      expect(el.className).not.toContain("sr-only");
      expect(el.querySelector(".sr-only")).toBeNull();
      return el;
    };
    const count = (el: HTMLElement, word: string) => el.textContent.split(word).length - 1;
    const [lev, cov] = screen.getAllByText(/\+0\.2x vs FY2023/);
    if (!lev || !cov) throw new Error("both 0.2x comparators should be drawn");
    expect(within(lev).getByText("worse")).toBeVisible();
    expect(count(lev, "worse")).toBe(1);
    expect(lev.querySelector('[data-shape="diamond"]')).not.toBeNull();
    expect(within(cov).getByText("better")).toBeVisible();
    expect(count(cov, "better")).toBe(1);
    expect(cov.querySelector('[data-shape="filled circle"]')).not.toBeNull();
    for (const el of [lev, cov]) expect(el.querySelector(".sr-only")).toBeNull();
    const flat = line(/\$0m vs FY2023/);
    expect(count(flat, "unchanged")).toBe(1);
    expect(flat.querySelector('[data-shape="ring"]')).not.toBeNull();
  });
});

describe("revenue and cash cards", () => {
  const figures = (change: string) => ({
    value: "2,250",
    unit: "USD millions",
    period: "FY2024",
    prior: { value: "2,100", period: "FY2023" },
    change,
  });

  it("judges revenue higher-is-better and leaves cash without a word or shape", () => {
    render(
      <HeadlineFigures
        catalogue={run({
          revenue: figures("150"),
          cash: { ...figures("-25"), value: "275" },
        })}
      />,
    );
    expect(screen.getByText("Revenue")).toBeVisible();
    expect(screen.getByText("$2,250m")).toBeVisible();
    const revenue = screen.getByText(/\+\$150m vs FY2023/);
    expect(within(revenue).getByText("better")).toBeVisible();
    expect(revenue.querySelector('[data-shape="filled circle"]')).not.toBeNull();
    const cash = screen.getByText(/-\$25m vs FY2023/);
    expect(cash.textContent).not.toMatch(/better|worse|unchanged/);
    expect(cash.querySelector("[data-shape]")).toBeNull();
  });

  it("lists the cards in the owner's order", () => {
    render(
      <HeadlineFigures
        catalogue={run({
          cash: figures("1"),
          adjusted_ebitda: figures("1"),
          revenue: figures("1"),
        })}
      />,
    );
    // A figure the catalogue lacks keeps its place as a stated gap (C3-020) instead of dropping out.
    expect(screen.getAllByRole("term").map((el) => el.textContent)).toEqual([
      "Net leverage",
      "Gross leverage",
      "Interest coverage",
      "Revenue",
      "Adjusted EBITDA",
      "Cash",
    ]);
  });
});

it("draws no Undrawn facilities card even when the catalogue carries the figure", () => {
  render(
    <HeadlineFigures
      catalogue={run({
        net_leverage: { value: "4.4", unit: "x", period: "FY2024" },
        undrawn: { value: "100", unit: "USD millions", period: "FY2024" },
      })}
    />,
  );
  expect(screen.getByText("Net leverage")).toBeVisible();
  expect(screen.queryByText("Undrawn facilities")).toBeNull();
});
