import purl from "url";
import fetch from "node-fetch";
import express from "express";
import proxies from "./proxies.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { ParsedQs } from "qs";

import * as dotenv from "dotenv";
dotenv.config();

let useProxiesList: string[] = proxies;

const WEBSITE_BASE_DOMAIN = "roblox.com";

let DEBUGGING = false;
/**
 * Log process information in development
 */
export function SET_DEBUGGING(state: boolean) {
  DEBUGGING = state;
}

/**
 * Log message only if DEBUGGING is true
 */
function LogDebugInfo(...args: unknown[]) {
  if (DEBUGGING === true) {
    console.log(...args);
  }
}

/**
 * The query that should be passed with the API_ACCESS_TOKEN
 */
let SECURITY_TOKEN_NAME = "apitoken";

/**
 * Port to listen on: localhost:PORT || localhost:8080
 */
const SERVER_PORT = process.env.SERVER_PORT ?? 80;

const app = express();
/**
 * Middleware to not capture request made to /favicon.ico
 */
const noFavicon = (
  req: express.Request,
  res: express.Response,
  next: express.NextFunction
) => {
  if (req.originalUrl.includes("favicon.ico")) {
    return res.status(204).end();
  }
  next();
};

/**
 * Use no favicon middleware
 */
app.use(noFavicon);

/**
 * Captures all requests.
 */
app.all("*", async (req, res) => {
  const qurl = purl.parse(req.url, true).query;
  LogDebugInfo("qurl:", qurl);
  const q = resolveUrl(
    typeof qurl.useSubdomains === "string"
      ? qurl.useSubdomains.split(".")
      : req.subdomains,
    req.query
  );

  if (!process.env.API_ACCESS_TOKEN || process.env.API_ACCESS_TOKEN === "") {
    LogDebugInfo("No API_ACCESS_TOKEN token set");
    return res.status(403).send("No access token set on endpoint.");
  }
  if (process.env.API_ACCESS_TOKEN !== q.token) {
    LogDebugInfo(
      `Invalid API_ACCESS_TOKEN passed. Got ${q.token} but expected ${process.env.API_ACCESS_TOKEN}`
    );
    return res.status(401).send(`Invalid access token provided. "${q.token}"`);
  }
  const url = "https://" + q.base + req.path + q.query;
  LogDebugInfo(`using url to try initial request: ${url}`);
  const r = await tryRequest(url, 1);
  return res.status(r.status).json(r.json);
});

/**
 * How much time a failed request will be tried before erroring.
 */
let MAX_REQUEST_TRIES = process.env.MAX_REQUEST_TRIES
  ? Number(process.env.MAX_REQUEST_TRIES)
  : 5;

console.log(MAX_REQUEST_TRIES);

/**
 * Set how much times a failed request will be retried
 */
export function SET_MAX_REQUEST_TRIES(value: number) {
  MAX_REQUEST_TRIES = value;
}

async function tryRequest(
  url: string,
  t: number
): Promise<{
  status: number;
  json?: unknown;
}> {
  LogDebugInfo(`Trying request number ${t} with url: ${url}`);
  const ProxyAgent =
    useProxiesList.length > 0
      ? new HttpsProxyAgent(
          `http://${process.env.WEBSHARE_USERNAME}:${
            process.env.WEBSHARE_PASSWORD
          }@${getRandomProxyAddress()}`
        )
      : undefined;
  return await fetch(url, { agent: ProxyAgent })
    .then(async (fetchRes) => {
      if (fetchRes.ok) {
        LogDebugInfo("fetch got ok response");
        try {
          return {
            status: fetchRes.status,
            json: await fetchRes.json(),
          };
        } catch (err) {
          LogDebugInfo(`Request failed with: ${err}`);
          return t > MAX_REQUEST_TRIES
            ? {
                status: 400,
                json: { Error: err },
              }
            : await tryRequest(url, t + 1);
        }
      } else {
        LogDebugInfo(`Request failed from fetchRes.ok: ${fetchRes}`);
        return t > MAX_REQUEST_TRIES
          ? {
              status: 401,
              json: await fetchRes.json(),
            }
          : await tryRequest(url, t + 1);
      }
    })
    .catch((err) => {
      LogDebugInfo(`Request failed from try block: ${err}`);
      return {
        status: 400,
        json: { Error: err },
      };
    });
}

function resolveUrl(subdomains: string[], query: ParsedQs) {
  let q = "";
  let stoken: string | undefined = undefined;
  let f = false;
  for (const tq in query) {
    if (tq === "useSubdomains") {
      continue;
    }
    if (tq !== SECURITY_TOKEN_NAME) {
      q += `${f ? "&" : "?"}${tq}=${query[tq]}`;
    } else {
      stoken = query[tq] as string;
    }
    f = true;
  }
  const base =
    (subdomains.length > 0 ? subdomains.join(".") : "www") +
    `.${WEBSITE_BASE_DOMAIN}`;
  LogDebugInfo(`resolved url => base:${base} || query:${q} || token:${stoken}`);
  return {
    base: base,
    query: q,
    token: stoken,
  };
}

/**
 * Fresh proxies are proxies that have not been tried yet during the session, when all are exhausted, will refresh the list
 * and try again randomly, `MAX_REQUEST_TRIES` handles timing out.
 */
let FreshProxies: string[] = [];
function getRandomProxyAddress(): string {
  if (FreshProxies.length === 0) {
    FreshProxies = [...useProxiesList];
  }
  const randomproxyindex = Math.floor(Math.random() * FreshProxies.length);
  const p = FreshProxies[randomproxyindex];
  FreshProxies.splice(randomproxyindex, 1);
  LogDebugInfo(`Fetched random proxy ${p}`);
  /*
  LogDebugInfo(`Removing from fresh proxies: "${p}"`);
  LogDebugInfo(
    `Current fresh proxies: ${FreshProxies.join(
      ",\n"
    )}.\n\n All Proxies: ${useProxiesList.join(",\n")}`
  );
  */
  return p;
}

/*
If you're not using as a package, remove this comment so that the app starts with node.
↓↓↓
app.listen(SERVER_PORT, () => {
  console.log(`Listening on PORT: ${SERVER_PORT}`);
});
↑↑↑ */

// Use as package
export function useProxy(Proxies?: string[], SET_SECURITY_TOKEN_NAME?: string) {
  if (SET_SECURITY_TOKEN_NAME !== undefined) {
    SECURITY_TOKEN_NAME = SET_SECURITY_TOKEN_NAME;
  }
  if (Proxies) {
    useProxiesList = Proxies;
  }
  app.listen(SERVER_PORT, () => {
    console.log(`Listening on PORT: ${SERVER_PORT}`);
  });
}
