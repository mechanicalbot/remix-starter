import { type Env, type Context } from "hono";
import { createMiddleware } from "hono/factory";

export type LoggerArgs = {
  skip?: (ctx: Context) => boolean;
  log: (message: string) => void;
};

export const logger = <TEnv extends Env = Env>(
  { skip, log }: LoggerArgs = { log: console.log },
) => {
  return createMiddleware<TEnv>(async (ctx, next) => {
    const start = Date.now();
    await next();
    const end = Date.now();

    if (skip?.(ctx)) {
      return;
    }

    log(
      `${ctx.req.method} ${ctx.req.raw.url} ${colorStatus(ctx.res.status)} - ${end - start}ms`,
    );
  });
};

const colorStatus = (status: number) => {
  const c = consoleColors;
  const out: Record<number, string> = {
    7: `${c.magenta}${status}${c.reset}`,
    5: `${c.red}${status}${c.reset}`,
    4: `${c.yellow}${status}${c.reset}`,
    3: `${c.cyan}${status}${c.reset}`,
    2: `${c.green}${status}${c.reset}`,
    1: `${c.green}${status}${c.reset}`,
    0: `${c.yellow}${status}${c.reset}`,
  };

  const calculateStatus = (status / 100) | 0;

  return out[calculateStatus];
};

// https://gist.github.com/abritinthebay/d80eb99b2726c83feb0d97eab95206c4
const consoleColors = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  underscore: "\x1b[4m",
  blink: "\x1b[5m",
  reverse: "\x1b[7m",
  hidden: "\x1b[8m",

  black: "\x1b[30m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",

  BGblack: "\x1b[40m",
  BGred: "\x1b[41m",
  BGgreen: "\x1b[42m",
  BGyellow: "\x1b[43m",
  BGblue: "\x1b[44m",
  BGmagenta: "\x1b[45m",
  BGcyan: "\x1b[46m",
  BGwhite: "\x1b[47m",
};
