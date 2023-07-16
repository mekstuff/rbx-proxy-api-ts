"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const axios_1 = __importDefault(require("axios"));
const express_1 = __importDefault(require("express"));
/**
 * Port to listen on: localhost:PORT || localhost:8080
 */
const SERVER_PORT = 8080;
const HOST_DOMAIN = "roblox.com";
const app = (0, express_1.default)();
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
    /**
     * Get the subdomains of the request, if none, default to www
     */
    const subdomain = req.subdomains.length > 0 ? req.subdomains.join(".") : "www";
    const uri = "https://" + subdomain + "." + HOST_DOMAIN + req.originalUrl;
    /**
     * Get the requests method, POST | PATCH | GET, etc... If not then default to GET (which probably should never happen)
     */
    const m = req.method || "GET";
    /**
     * Make the api request using axios
     */
    yield axios_1.default
        .request({
        method: m,
        url: uri,
        headers: req.headers,
    })
        .then((result) => {
        /**
         * Send the data received
         */
        res.status(result.status).send(result.data);
    })
        .catch((err) => {
        if (err.response) {
            /**
             * Response error
             */
            return res.status(err.response.status).send(err.response.data);
        }
        /**
         * Something went wrong on the proxies end
         */
        console.warn("Internal Error.");
        res.status(400).json({ success: false, message: err.toString() });
    });
}));
/**
 * Listen on PORT
 */
app.listen(SERVER_PORT);
//# sourceMappingURL=index.js.map