# Portfolio recommendation methodology

How the app arrives at the recommendation it proposes for an issuer in each portfolio, written so
an analyst can check any proposal by hand.

Status: approved by the owner on 2026-11-25 with the design it belongs to
(`docs/rulings/2026-11-25-deliverables-and-recommendations.md`). Not built yet: no code computes
any of this today. Where this document and the ruling differ, the ruling governs; for the rubric
text, section 9 of the approved design governs. Four statements below are marked "Confirmed by
the owner, 2026-11-25": the approved design did not state them, and the owner confirmed them that
day ("fine").

## 1. Bottom line

- A recommendation is proposed from two scores: a Credit Score for the issuer and a Valuation
  score for each eligible instrument in that portfolio. Ruled by the owner, 2026-11-25: the
  portfolio takes the best result across its eligible instruments (section 7).
- The credit analysis scores 17 rubric factors from 1 to 5, each with a one-line basis. Everything
  after that is fixed arithmetic and table lookup on those scores, supplied prices and the
  portfolio's reference files: no judgement is added downstream.
- Every recommendation is shown as proposed until the analyst confirms it in the Credit Snapshot
  workbook. The analyst can change any score or recommendation.

## 2. The three scales

Lower is better on all three.

| Level | Credit Score | Valuation | Recommendation |
| ---: | --- | --- | --- |
| 1 | Strong | Very attractive | Strong OW |
| 2 | Good | not named in the approved design | Modest OW |
| 3 | Fair | not named in the approved design | MW |
| 4 | Weak | not named in the approved design | Modest UW |
| 5 | Stressed | Very unattractive | Strong UW |

OW, MW and UW are overweight, market weight and underweight. The rubric factors use a fourth set
of level names (section 3); the Credit Score names above apply to the rolled-up score only.

## 3. The Risk Rubric: 17 factors

Level text transcribed from the owner's Risk Rubric (owner image, 2026-11-25), with three cells
amended on the owner's ruling the same day (see below the table), as recorded in section 9 of `docs/superpowers/specs/2026-11-25-deliverables-credit-snapshot.md`. Levels:
1 Excellent, 2 Strong, 3 Satisfactory, 4 Weak, 5 Poor. The image has no row labels: the factor
names are the coordinating session's reading, confirmed by the owner. The rubric's Probability of
default row is dropped by ruling R9.

| # | Factor | 1 Excellent | 2 Strong | 3 Satisfactory | 4 Weak | 5 Poor |
| ---: | --- | --- | --- | --- | --- | --- |
| 1 | Scale | EBITDA > $1bn — large, diversified issuer with global reach | $500m–$1bn — strong mid-cap with solid market presence | $200m–$500m — medium-sized, regionally focused | $100m–$200m — small-scale, limited diversification | < $100m — niche or subscale, vulnerable to shocks |
| 2 | Market position | Market leader with strong pricing power and durable brand | Top-tier competitor with moderate pricing power | Mid-tier competitor in fragmented industry | Weak player in highly competitive or commoditized sector | Marginal operator with limited market relevance |
| 3 | Regulatory exposure | Minimal regulatory exposure; stable framework | Moderate oversight, but manageable compliance burden | Some exposure to evolving regulation; minor compliance risk | High regulatory sensitivity (e.g., pharma, healthcare, finance) | Significant compliance or litigation risk; ongoing investigations |
| 4 | Technology | Tech leader or innovator; disrupts peers | Competitive adopter; technology embedded in strategy | Average tech positioning; not at risk near-term | Lagging digital adoption; facing disruptive pressures | Obsolete tech; business model threatened by innovation |
| 5 | Barriers to entry | Very high barriers (capital intensity, IP, regulation) | High barriers (brand, relationships, economies of scale) | Moderate barriers (cost efficiencies, know-how) | Low barriers (few obstacles to entry) | None (high churn, perfect competition) |
| 6 | Leverage | Low leverage (<3x), conservative structure | Moderate leverage (3–4x), ample headroom | Elevated leverage (4–5x), stable but stretched | High leverage (5–6x), limited covenant cushion | Very high leverage (>6x), fragile structure or covenant breach risk |
| 7 | Free cash flow | Strong, consistent FCF >10% of revenue | Solid FCF, positive through cycle | Modest FCF, positive in stable years only | Weak FCF, negative under mild stress | Persistent negative FCF, reliant on external financing |
| 8 | Liquidity | Cash & RCF comfortably cover 2+ years' obligations | Sufficient to cover 12–24 months | Adequate for 6–12 months | Tight liquidity; dependent on revolver draw | Insufficient liquidity; default risk within 12 months |
| 9 | Rating trend | Stable rating trend, strong outlook | Limited downgrade risk, stable fundamentals | Balanced risk of upgrade/downgrade | Negative outlook or on watch | Repeated downgrades or imminent distress |
| 10 | Geographic diversification | Operations in >3 continents; diversified customer base globally | 2–3 major regions, with one contributing 40–50% of revenue | Majority (>60%) of revenues from one region, limited operations elsewhere | >80% of revenue from one country; minimal cross-border sales | 100% single country operations |
| 11 | Product diversification | Multiple independent revenue streams across end-markets | 1–2 products/services contribute 30–50% of sales | 1 main product/service contributes 60–70% of sales | 1–2 products/services contribute >80% of sales | 100% of revenues derived from one product/service |
| 12 | Market share | Dominant market leader (>30%) | Top 3 competitor, or 10–30% share | Mid-tier, 5–10% share | Small player, <5% share | Marginal presence or niche operator |
| 13 | Customer concentration | Highly diversified; no customer >5% of sales | Some concentration; top 3 <20% total | Moderate; top 3 <35% total | High; top 3 >50% total | Extreme; one client >50% total |
| 14 | Market access | Frequent issuer; broad investor base | Regular market access; well-followed credit | Occasional issuer; depends on market conditions | Limited access; small or private placement only | No market access; dependent on sponsor or bank support |
| 15 | Maturity profile | No maturities <3 years | Small near-term maturities, easily manageable | Moderate maturities, likely refinanced | Large maturities requiring market access | Refinancing wall imminent or missed maturity |
| 16 | Interest cover | EBITDA/Interest >4.0x | 3.0–4.0x | 2.0–3.0x | 1.0–2.0x | <1.0x (interest not covered) |
| 17 | Financial policy | Conservative and creditor-friendly. Net leverage <2.5x; stable policy. | Moderately conservative. Leverage <3.5x; disciplined management. | Neutral or balanced policy. Leverage 3.5–4.5x; some shareholder bias. | Aggressive policy. Frequent debt-funded actions. | Highly aggressive / equity-focused. Covenant breaches; distressed history. |

Two cells were amended on the owner's ruling of 2026-11-25 ("fix"); the wording is the
coordinating session's. Leverage level 4 was "High leverage (>5x), limited covenant cushion";
Market share level 2 was "Top 3 competitor" and level 3 "Mid-tier, <10% share", which overlapped
level 4. This closes the two gaps the image left (no level for 5–6x leverage; none for a 10–30%
share outside the top three).

How a factor is scored: the credit analysis picks the level whose text fits the issuer's evidence
and writes one line saying why. A factor with no evidence is left unscored and listed as a gap.

The scorecard also shows four items outside the 17: Management, Sector Outlook, Sponsor Quality
and Credit Direction. They are written by the credit analysis. Confirmed by the owner,
2026-11-25: they do not enter the Credit Score.

## 4. Credit Score roll-up

1. Take the factors that were scored. If fewer than 12 of the 17 are scored, there is no Credit
   Score. Confirmed by the owner, 2026-11-25: there is then no proposed recommendation either.
2. Take their equal-weight mean.
3. Round to a whole level; an exact half rounds toward the weaker score (2.5 becomes 3).
4. Floor: if Liquidity or Maturity profile is scored 5, the Credit Score is no better than 4.

Example 1: 15 factors scored, none of them a 5, sum 39: mean 2.6, Credit Score 3 (Fair).
Example 2: 16 factors scored, sum 40, with Liquidity at 5: mean 2.5 rounds to 3, and the floor
makes the Credit Score 4 (Weak).

## 5. Valuation score

Scored per instrument, against the instruments of the same rating bucket in that portfolio's
reference (section 8). Loans are compared by discount margin, against the CLO book and the loan
index holdings; bonds by spread, against the high-yield index holdings. The measure is the
instrument's level less the bucket's median, in basis points. Confirmed by the owner, 2026-11-25:
wider than the median is more attractive.

| Instrument less bucket median | Valuation |
| --- | ---: |
| +100 bp or more | 1 |
| +40 to +100 bp | 2 |
| within ±40 bp | 3 |
| −40 to −100 bp | 4 |
| −100 bp or less | 5 |

- Ruled by the owner, 2026-11-25: a portfolio has no single Valuation. Each eligible instrument
  has its own, and the portfolio's recommendation is the best result across them (section 7);
  the reading shows the Valuation of the instrument that result rests on.
- With no price, or a bucket of fewer than five names, Valuation is left blank for the analyst.
- Ruled by the owner, 2026-11-25: a difference of exactly +40 bp or −40 bp is a 3 ("within ±40"
  includes its ends). Exactly +100 bp is a 1 and exactly −100 bp a 5, as the bands say.

## 6. The 5×5 table

The proposed recommendation is read from this table: row by Credit Score, column by Valuation.

| Credit ↓ / Valuation → | 1 | 2 | 3 | 4 | 5 |
| --- | ---: | ---: | ---: | ---: | ---: |
| 1 Strong | 1 | 2 | 2 | 3 | 3 |
| 2 Good | 2 | 2 | 3 | 3 | 4 |
| 3 Fair | 2 | 3 | 3 | 4 | 4 |
| 4 Weak | 3 | 3 | 4 | 4 | 5 |
| 5 Stressed | 3 | 4 | 4 | 5 | 5 |

The rule behind it: the average of the two scores, an exact half rounded toward the weaker score;
a 5 on either axis can be no better than 3. The table is what was approved and is what applies.

## 7. Reading by portfolio, and limit caps

Each portfolio gets its own recommendation, because portfolios differ in the instruments they can
hold, the reference they are measured against and their limits.

- No eligible instrument for a portfolio: that portfolio shows "n/a".
- Limit cap: if adding the name would breach one of that portfolio's supplied limits (sector,
  rating bucket, CCC, price floor), the result for that instrument is no better than 3 (MW), and
  the limit is named beside it. Confirmed by the owner, 2026-11-25: a 4 or 5 from the table is
  unchanged.
- Ruled by the owner, 2026-11-25, how a breach is decided: a limit that applies to the issuer (its
  sector, its rating bucket, the CCC limit if it is rated CCC) is breached when the portfolio's
  file shows no headroom left (zero or negative) or a breached status; the price floor is breached
  when the instrument's price is below it. No position size is assumed.
- Ruled by the owner, 2026-11-25: the portfolio's recommendation is the best (lowest) result across
  every eligible instrument that has a Valuation. An instrument's result is the table's cell on
  the Credit Score and its own Valuation, held to 3 when the cell is 1 or 2 and that instrument
  breaches a limit. Limits are read per instrument, on its own rating bucket and price; the
  issuer's sector applies to all. The reading names the instrument it rests on and shows that
  instrument's Valuation, limits, cell, any cap and reason. A more attractive instrument that
  breaches a limit therefore cannot lower the recommendation below what a clean instrument gives,
  and the order the instruments are listed in never changes it.
- The coordinator's ruling (not the owner's): when two instruments give the same result, the one
  that is not capped comes first, then the lower (better) Valuation, then the instrument's name
  in alphabetical order (plain, case-sensitive). Two instruments that share even the name are
  ordered by their remaining fields, so the answer never depends on the list. With no Credit
  Score there is no result: the reading is blank and names the instrument by Valuation, then name.
- Worked example, Credit Score 2, a CLO whose CCC limit is breached. The first lien loan (rated
  B, Valuation 2) breaches nothing: the table gives 2 and it stays 2. The second lien loan
  (rated CCC, Valuation 1) gives 2 but breaches the CCC limit, so it is held to 3. The portfolio
  takes 2, resting on the first lien loan, not capped. (Reading it on the instrument with the
  better Valuation alone would have shown 3.)
- Ruled by the owner, 2026-11-25: an instrument with no rating (bucket Unrated) against a rating
  limit worded for a bucket "and below" (or lower, or worse; also written with &) that does not
  name Unrated: the limit is not read, so the analyst sees it, whatever the file shows. It is not
  treated as below CCC and not as "does not apply". A limit that names Unrated is read as it
  says; one worded "and above" is unchanged. A not-read limit never caps. So an Unrated
  instrument can give the portfolio's result ahead of a rated one held to 3 by the same limit.
- The issuer's current weight in the portfolio or index is shown beside the recommendation.
- A custom portfolio supplied when the run is started gets its own column by the same rules.
- Each instrument in the capital structure also carries a proposed recommendation, which the
  analyst can change. Ruled by the owner, 2026-11-25: it is read from the 5×5 table on the
  issuer's Credit Score and that instrument's own Valuation against the index for its type (the
  loan index for a loan, the high-yield index for a bond). No limit cap applies to it. With no
  Valuation it is blank.
- Ruled by the owner, 2026-11-25: eligibility is by asset type alone. Loans are eligible for the
  CLO and the loan index, bonds for the high-yield index. A custom portfolio takes the asset type
  declared for it, or both when none is declared.

## 8. Reference data and as-of dates

| Portfolio | Reference | Source |
| --- | --- | --- |
| CLO | The CLO book: holdings, constraints and mandate | Files the analyst supplies (`holdings.csv`, constraints, mandate) |
| Loan index | SSGA LVLN daily holdings | Fetched by the app, or a file the analyst supplies |
| High-yield index | SSGA JNK daily holdings | Fetched by the app, or a file the analyst supplies |
| Custom | Any portfolio the analyst supplies when starting the run | Analyst's file |

Each reference is stored with its as-of date, and that date is printed on the workbook. A
Valuation is only as current as its reference file and the prices supplied.

## 9. Proposed and confirmed

- The app proposes; the analyst confirms. Each recommendation carries a "proposed" tag until the
  analyst sets the confirm cell in the workbook. The analyst's name and the confirmation date are
  analyst cells and are blank when the file is downloaded.
- The workbook's Matrix sheet holds this rubric, the valuation bands and the 5×5 table. The
  Snapshot's recommendation cells look up into it, so an analyst's edit to a score re-derives the
  proposal in Excel.
- Open: the approved design has the analyst confirm in the workbook and does not say whether the
  app records that confirmation. As designed, it exists only in the analyst's copy of the file.

## 10. Limitations

- Not built and not tested: no proposal has been computed from a real run.
- The factors are equally weighted; apart from the Liquidity and Maturity profile floor, a single
  very weak factor can be averaged away.
- Valuation is relative to one rating bucket's median on one date. It says nothing about whether
  the bucket itself is cheap or dear.
- The layout of the SSGA holdings files has not been verified, nor that the app's host can reach
  ssga.com.
- Other modules already write a 1–5 issuer scorecard and an overweight, neutral or underweight
  view of their own. How those relate to this proposal is not settled; a reader may see both.
