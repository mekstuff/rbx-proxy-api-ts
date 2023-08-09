import http from "http";
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
  fetch("https://catalog.roblox.com/v1/categories")
    .then((r) => {
      res.status(r.status).send(r.body);
    })
    .catch((err) => {
      console.log(err);
    });
});

console.log(`LISTENING ON PORT: ${SERVER_PORT}`);
app.listen(SERVER_PORT);
