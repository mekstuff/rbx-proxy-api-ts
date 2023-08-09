var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import fetch from "node-fetch";
import express from "express";
import proxies from "./proxies.js";
import { HttpsProxyAgent } from "https-proxy-agent";
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
const noFavicon = (req, res, next) => {
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
app.all("*", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const q = resolveUrl(req.subdomains, req.query);
    if (!process.env.API_ACCESS_TOKEN || process.env.API_ACCESS_TOKEN === "") {
        return res.status(403).send("No access token set on endpoint.");
    }
    if (process.env.API_ACCESS_TOKEN !== q.token) {
        return res.status(401).send("Invalid access token provided.");
    }
    console.log(q.token, process.env.API_ACCESS_TOKEN);
    const url = "https://" + q.base + req.path + q.query;
    const r = yield tryRequest(url, 1);
    return res.status(r.status).json(r.json);
}));
const MAX_REQUEST_TRIES = 5;
function tryRequest(url, t) {
    return __awaiter(this, void 0, void 0, function* () {
        const ProxyAgent = proxies.length > 0
            ? new HttpsProxyAgent(`http://${process.env.WEBSHARE_USERNAME}:${process.env.WEBSHARE_PASSWORD}@${getRandomProxyAddress()}`)
            : undefined;
        return yield fetch(url, { agent: ProxyAgent })
            .then((fetchRes) => __awaiter(this, void 0, void 0, function* () {
            if (fetchRes.ok) {
                try {
                    return {
                        status: fetchRes.status,
                        json: yield fetchRes.json(),
                    };
                }
                catch (err) {
                    return t > MAX_REQUEST_TRIES
                        ? {
                            status: 400,
                            json: { Error: err },
                        }
                        : yield tryRequest(url, t + 1);
                }
            }
            else {
                return t > MAX_REQUEST_TRIES
                    ? {
                        status: 401,
                        json: yield fetchRes.json(),
                    }
                    : yield tryRequest(url, t + 1);
            }
        }))
            .catch((err) => {
            return {
                status: 400,
                json: { Error: err },
            };
        });
    });
}
function resolveUrl(subdomains, query) {
    let q = "";
    let stoken = undefined;
    let f = false;
    for (const tq in query) {
        if (tq !== SECURITY_TOKEN_NAME) {
            q += `${f ? "&" : "?"}${tq}=${query[tq]}`;
        }
        else {
            stoken = query[tq];
        }
        f = true;
    }
    return {
        base: (subdomains.length > 0 ? subdomains.join(".") : "www") +
            `.${WEBSITE_BASE_DOMAIN}`,
        query: q,
        token: stoken,
    };
}
function getRandomProxyAddress() {
    return proxies[Math.floor(Math.random() * proxies.length)];
}
console.log(`LISTENING ON PORT: ${SERVER_PORT}`);
app.listen(SERVER_PORT);
//# sourceMappingURL=index.js.map