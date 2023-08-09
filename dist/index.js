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
    fetch("https://catalog.roblox.com/v1/categories")
        .then((r) => {
        res.status(r.status).send(r.body);
    })
        .catch((err) => {
        console.log(err);
    });
}));
app.listen(SERVER_PORT);
console.log(`LISTENING ON PORT: ${SERVER_PORT}`);
// /**
//  * Port to listen on: localhost:PORT || localhost:8080
//  */
// const SERVER_PORT = 8080;
// const HOST_DOMAIN = "roblox.com";
// const app = express();
// /**
//  * Middleware to not capture request made to /favicon.ico
//  */
// const noFavicon = (
//   req: express.Request,
//   res: express.Response,
//   next: express.NextFunction
// ) => {
//   if (req.originalUrl.includes("favicon.ico")) {
//     return res.status(204).end();
//   }
//   next();
// };
// /**
//  * Use no favicon middleware
//  */
// app.use(noFavicon);
// /**
//  * Captures all requests.
//  */
// app.all("*", async (req, res) => {
//   /**
//    * Get the subdomains of the request, if none, default to www
//    */
//   // console.log(req.subdomains);
//   // res.send("Hello");
//   // return;
//   const subdomain: string =
//     req.subdomains.length > 0 ? req.subdomains.join(".") : "www";
//   const uri: string =
//     "https://" + subdomain + "." + HOST_DOMAIN + req.originalUrl;
//   console.log("endpoint hit : " + req.originalUrl + " || forward => " + uri);
//   /**
//    * Get the requests method, POST | PATCH | GET, etc... If not then default to GET (which probably should never happen)
//    */
//   const m = req.method || "GET";
//   /**
//    * Make the api request using axios
//    */
//   await axios
//     .request({
//       method: m,
//       url: uri,
//       headers: req.headers,
//     })
//     .then((result) => {
//       /**
//        * Send the data received
//        */
//       res.status(result.status).send(result.data);
//     })
//     .catch((err) => {
//       if (err.response) {
//         /**
//          * Response error
//          */
//         return res.status(err.response.status).send(err.response.data);
//       }
//       /**
//        * Something went wrong on the proxies end
//        */
//       console.warn("Internal Error.", err);
//       res.status(400).json({ success: false, message: err.toString() });
//     });
// });
// /**
//  * Listen on PORT
//  */
// app.listen(SERVER_PORT);
// console.log("LISTENING ON PORT", SERVER_PORT);
//# sourceMappingURL=index.js.map