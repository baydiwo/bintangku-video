import type { BudgetConfig } from "../lib/config";
import { CliError } from "../providers/wavespeed/types";
import { getApiKey, getBalance } from "../providers/wavespeed";

export function estimateTtsCostUsd(
  budget: BudgetConfig,
  model: string,
  characters: number,
): number {
  const rate = budget.rates.find((r) => r.model === model);
  if (!rate) {
    // Unknown model — estimate 0 but warn via caller
    return 0;
  }
  if (rate.unit === "per_1000_chars") {
    return (characters / 1000) * rate.priceUsd;
  }
  return rate.priceUsd;
}

export async function assertBudgetAllows(opts: {
  budget: BudgetConfig;
  estimatedCostUsd: number;
  spentThisVideoUsd?: number;
}): Promise<{ balance: number }> {
  const balance = await getBalance(getApiKey());
  const min = opts.budget.minBalanceUsd ?? 0;

  if (balance < min) {
    throw new CliError(
      "ERR-BUDGET",
      `Balance $${balance.toFixed(4)} < minBalanceUsd $${min}`,
    );
  }

  if (balance < opts.estimatedCostUsd) {
    throw new CliError(
      "ERR-BUDGET",
      `Balance $${balance.toFixed(4)} < estimated $${opts.estimatedCostUsd.toFixed(4)}`,
    );
  }

  if (
    typeof opts.budget.perVideoUsd === "number" &&
    (opts.spentThisVideoUsd ?? 0) + opts.estimatedCostUsd >
      opts.budget.perVideoUsd
  ) {
    throw new CliError(
      "ERR-BUDGET",
      `Estimated cost would exceed perVideoUsd $${opts.budget.perVideoUsd} (spent $${(opts.spentThisVideoUsd ?? 0).toFixed(4)} + est $${opts.estimatedCostUsd.toFixed(4)})`,
    );
  }

  return { balance };
}
