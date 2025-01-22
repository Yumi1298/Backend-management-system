import express from "express";
import multer from "multer";
import { z } from "zod";
import cors from "cors";
import abRouter from "./routes/user.js";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.set("view engine", "ejs");

// Top-level middlewares
const corsOptions = {
  credentials: true,
  origin: (origin, callback) => {
    // console.log({ origin });
    callback(null, true); // 允許所有網站取得資源
  },
};
app.use(cors(corsOptions));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// ******************* 自訂 top-level middleware
app.use((req, res, next) => {
  // res.send("<p>直接被中斷</p>"); // 不應該回應
  res.locals.title = "後臺管理系統"; // 預設的頁面 title
  res.locals.pageName = "";
  next();
});

// 路由設定, routes
// 1. get(): 只接受 HTTP GET 方法的拜訪
// 2. 只接受 路徑為 / 的 request
app.get("/", (req, res) => {
  res.render("home", { name: "Shinder" });
});

app.use("/user", abRouter);

// zod 套件測試
app.get("/zod-email/:email", async (req, res) => {
  const emailSchema = z.string().email({ message: "錯誤的 email 格式" });
  const result = emailSchema.safeParse(req.params.email);

  res.json(result);
});
app.get("/zod2/:index?", async (req, res) => {
  const index = +req.params.index || 0;
  const schema = z.object({
    account: z.string().email({ message: "錯誤的 email 格式" }),
    password: z.string().min(6, "最少 6 個字元").max(20, "最多 20 個字元"),
  });
  const ar = [
    {
      account: "shinder",
      password: "12345",
    },
    {
      account: "shinder@test.com",
      password: "12345398453984598sjhfsjfj3845",
    },
    {
      account: "shinder@test.com",
      password: "123fsjfj3845",
    },
  ];
  const result = schema.safeParse(ar[index]);
  res.json(result);
});

// ************* 設定靜態內容資料夾 *************
app.use(express.static("public"));
app.use("/bootstrap", express.static("node_modules/bootstrap/dist"));

// ************* 放在所有路由的後面 *************
// 404 頁面
app.use((req, res) => {
  res.status(404).send("<h1>您走錯路了</h1>");
});

const port = process.env.PORT || 3001;
app.listen(port, () => {
  console.log(`伺服器啟動了, port: ${port}`);
});

// 捕獲未處理的異常
process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
});

process.on("unhandledRejection", (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});
