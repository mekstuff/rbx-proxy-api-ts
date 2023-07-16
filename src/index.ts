import axios from "axios";
import express from "express";

/**
 * Port to listen on: localhost:PORT || localhost:8080
 */
const SERVER_PORT = 8080;

const HOST_DOMAIN = "roblox.com";

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
  /**
   * Get the subdomains of the request, if none, default to www
   */
  const subdomain: string =
    req.subdomains.length > 0 ? req.subdomains.join(".") : "www";
  const uri: string =
    "https://" + subdomain + "." + HOST_DOMAIN + req.originalUrl;

  /**
   * Get the requests method, POST | PATCH | GET, etc... If not then default to GET (which probably should never happen)
   */
  const m = req.method || "GET";

  /**
   * Make the api request using axios
   */
  await axios
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
});

/**
 * Listen on PORT
 */
app.listen(SERVER_PORT);
