import express, { type Express, type Request, type Response } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import { clerkMiddleware } from "@clerk/express";
import path from "path";
import fs from "fs";
import {
  CLERK_PROXY_PATH,
  clerkProxyMiddleware,
} from "./middlewares/clerkProxyMiddleware";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);

app.use(CLERK_PROXY_PATH, clerkProxyMiddleware());

app.use(cors({ credentials: true, origin: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(clerkMiddleware());

app.use("/api", router);

if (process.env.NODE_ENV === "production") {
  const distPath = path.resolve(__dirname, "../../respect-family/dist/public");
  if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get("/{*path}", (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  } else {
    logger.warn({ distPath }, "Frontend dist folder not found — skipping static serving");
  }
}

export default app;
