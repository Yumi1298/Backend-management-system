import multer from "multer";
import path from "path";

// 設定 Multer 儲存配置
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // 設定檔案儲存路徑
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // 使用時間戳作為檔案名
  },
});

// 檔案過濾條件，限制只能上傳 .xlsx 檔案
const fileFilter = (req, file, cb) => {
  const fileExtension = path.extname(file.originalname).toLowerCase();
  if (fileExtension === ".xlsx") {
    cb(null, true); // 允許此檔案
  } else {
    cb(new Error("請上傳.xlsx 格式"), false); // 拒絕其他檔案格式
  }
};

// 設定 Multer 的檔案過濾器
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 設定檔案大小限制（10MB）
});

export default upload;
