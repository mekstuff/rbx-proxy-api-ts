import purl from "url";
import fetch from "node-fetch";
import express from "express";
import proxies from "./proxies.js";
import { HttpsProxyAgent } from "https-proxy-agent";
import { ParsedQs } from "qs";

import * as dotenv from "dotenv";
dotenv.config();

const WEBSITE_BASE_DOMAIN = "roblox.com";

/**
 * The query that should be passed with the API_ACCESS_TOKEN
 */
const SECURITY_TOKEN_NAME = "apitoken";

/**
 * Port to listen on: localhost:PORT || localhost:8080
 */
const SERVER_PORT = process.env.SERVER_PORT || 80;

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
  const q = resolveUrl(
    typeof qurl.useSubdomains === "string"
      ? qurl.useSubdomains.split(".")
      : req.subdomains,
    req.query
  );
  if (!process.env.API_ACCESS_TOKEN || process.env.API_ACCESS_TOKEN === "") {
    return res.status(403).send("No access token set on endpoint.");
  }
  if (process.env.API_ACCESS_TOKEN !== q.token) {
    return res.status(401).send(`Invalid access token provided. "${q.token}"`);
  }
  const url = "https://" + q.base + req.path + q.query;
  const r = await tryRequest(url, 1);
  return res.status(r.status).json(r.json);
});

const MAX_REQUEST_TRIES = 5;

async function tryRequest(
  url: string,
  t: number
): Promise<{
  status: number;
  json?: unknown;
}> {
  const ProxyAgent =
    proxies.length > 0
      ? new HttpsProxyAgent(
          `http://${process.env.WEBSHARE_USERNAME}:${
            process.env.WEBSHARE_PASSWORD
          }@${getRandomProxyAddress()}`
        )
      : undefined;
  return await fetch(url, { agent: ProxyAgent })
    .then(async (fetchRes) => {
      if (fetchRes.ok) {
        try {
          return {
            status: fetchRes.status,
            json: await fetchRes.json(),
          };
        } catch (err) {
          return t > MAX_REQUEST_TRIES
            ? {
                status: 400,
                json: { Error: err },
              }
            : await tryRequest(url, t + 1);
        }
      } else {
        return t > MAX_REQUEST_TRIES
          ? {
              status: 401,
              json: await fetchRes.json(),
            }
          : await tryRequest(url, t + 1);
      }
    })
    .catch((err) => {
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
  return {
    base:
      (subdomains.length > 0 ? subdomains.join(".") : "www") +
      `.${WEBSITE_BASE_DOMAIN}`,
    query: q,
    token: stoken,
  };
}

function getRandomProxyAddress(): string {
  return proxies[Math.floor(Math.random() * proxies.length)];
}

console.log(`LISTENING ON PORT: ${SERVER_PORT}`);
app.listen(SERVER_PORT);
