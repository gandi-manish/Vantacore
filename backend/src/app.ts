import express, { Application, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import routes from "./routes";
import { logger } from "./config/logger";
import { errorHandler } from "./middleware/error.middleware";
import { requestContext } from "./middleware/request-context.middleware";

const app: Application = express();

app.use(helmet());
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(requestContext);

app.use(
  morgan("combined", {
    stream: {
      write: (message: string) => {
        logger.info("HTTP request", { message: message.trim() });
      },
    },
  })
);

app.get("/", (_req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: "Welcome to VantaCore — Control. Observe. Defend.",
  });
});

app.use("/api", routes);
app.use(errorHandler);

export default app;