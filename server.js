require("dotenv").config(); // 載入 .env 環境變數
const express = require("express");
const axios = require("axios");
const cors = require("cors");
app.use(cors());
const app = express();

// ✅ 確保 CORS 正確啟用，讓前端 localhost 能呼叫
app.use(cors());
app.use(express.json());

// ✅ 處理 OPTIONS 預檢請求，避免 preflight 出錯
app.options('/create-payment', cors());

// ✅ 處理 LINE Pay 建立付款請求
app.post("/create-payment", async (req, res) => {
    try {
        const amount = req.body.amount || 100; // 測試金額
        const orderId = `ORDER_${Date.now()}`; // 唯一訂單編號

        // 🔗 呼叫 LINE Pay API
        const response = await axios.post("https://sandbox-api-pay.line.me/v3/payments/request", {
            amount: amount,
            currency: "TWD",
            orderId: orderId,
            packages: [
                {
                    id: "1",
                    amount: amount,
                    name: "測試商品",
                    products: [  // 必填 products
                        {
                            id: "P001",
                            name: "測試商品",
                            quantity: 1,
                            price: amount
                        }
                    ]
                }
            ],
            redirectUrls: {
                confirmUrl: "https://lantyr.github.io/line-pay-test/", // 成功返回
                cancelUrl: "https://lantyr.github.io/line-pay-test/cancel" // 取消返回
            }
        }, {
            headers: {
                "Content-Type": "application/json",
                "X-LINE-ChannelId": process.env.CHANNEL_ID,
                "X-LINE-ChannelSecret": process.env.CHANNEL_SECRET
            }
        });

        // ✅ 成功回傳 LINE Pay 的付款網址
        console.log("LINE Pay API 回傳資料: ", response.data); // 除錯用
        res.json({ paymentUrl: response.data.info.paymentUrl.web }); // 前端會拿來導向付款
    } catch (error) {
        //
        console.error("LINE Pay API 發生錯誤: ", error.response?.data || error.message);
        res.status(500).json({ error: "伺服器錯誤", details: error.response?.data || error.message });
    }
});

// ✅ 監聽 3000 port
app.listen(3000, () => {
    console.log("✅ Server is running on port 3000");
});
