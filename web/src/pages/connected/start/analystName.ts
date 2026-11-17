// The analyst's name as the service takes it: a first name, one space, then one or two capital
// initials ("Eric G", or "Eric MG" where two analysts would otherwise read the same; owner,
// 2026-11-16). The same rule as is_analyst_name in src/deploy_workflow/run_start/submissions.py.
const ANALYST_NAME = /^\p{L}+(?:[-'\u2019]\p{L}+)* \p{Lu}{1,2}$/u;

export const ANALYST_NAME_RULE =
  "Enter your name as your first name and initial, for example Eric G, or two initials, for example Eric MG.";

export const isAnalystName = (text: string) => ANALYST_NAME.test(text);
