import chalk from "chalk";
import * as fs from "fs";
import * as path from "path";
import { videoLogsDir } from "./paths";

export function info(msg: string) {
  console.log(chalk.blue(msg));
}

export function ok(msg: string) {
  console.log(chalk.green(msg));
}

export function warn(msg: string) {
  console.log(chalk.yellow(msg));
}

export function fail(msg: string) {
  console.error(chalk.red(msg));
}

export function writeRunLog(
  videoId: string,
  cmd: string,
  lines: string[],
): void {
  const dir = videoLogsDir(videoId);
  fs.mkdirSync(dir, { recursive: true });
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const file = path.join(dir, `${stamp}-${cmd}.log`);
  fs.writeFileSync(file, lines.join("\n") + "\n", "utf8");
}
