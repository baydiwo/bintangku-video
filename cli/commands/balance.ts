import { getApiKey, getBalance } from "../providers/wavespeed";
import * as log from "../lib/log";

export async function cmdBalance(): Promise<void> {
  const bal = await getBalance(getApiKey());
  log.ok(`WaveSpeed balance: $${bal.toFixed(4)} USD`);
}
