import express from "express";
import cors from "cors";

const app = express();

app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));
app.use(express.static("public"));

app.get("/", (_, res) => {
  res.send({ status: 200, message: "ok" });
});

import invoiceRoutes from "./routes/invoice.routes.js";

app.use("/api", invoiceRoutes);

export { app };
