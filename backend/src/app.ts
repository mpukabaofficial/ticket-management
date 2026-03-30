import express from "express";
import cors from "cors";
import { config } from "./config";
import routes from "./routes";

const app = express();

app.use(cors({ origin: config.clientUrl, credentials: true }));
app.use(express.json());

app.use("/api", routes);

export default app;
