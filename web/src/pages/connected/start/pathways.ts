/** The question each pathway answers, as the analyst reads it on the Purpose card. */
export const PATHWAY_QUESTIONS: Readonly<Record<string, string>> = {
  lite_credit_assessment: "Is the credit sound, and how far is its first break?",
  credit_snapshot:
    "Is the credit sound, and does it hold through its downside, covenants, refinancing and forward cash flow?",
  deep_credit_assessment:
    "Beyond the full assessment: how do earnings, peers, ratings, market prices and recoveries change the view?",
  earnings_update: "What changed in the latest results against an earlier period, and why?",
  relative_value:
    "Which instrument offers the better value for its risk, against peers and the market?",
  covenant_refinancing: "How much room do the documents leave, and can the debt be refinanced?",
  distressed_restructuring:
    "How far is the break, what do the documents allow, and who recovers what?",
  portfolio_decision: "Which instruments to hold, and how do they fit the portfolio?",
};
