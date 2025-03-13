require("dotenv").config(); // 載入 .env 環境變數
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express(); // 先宣告 app

app.use(cors()); // 啟用 CORS
app.use(express.json()); // 啟用 JSON 處理

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
                    products: [
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
                confirmUrl: "https://lantyr.github.io/line-pay-test/",
                cancelUrl: "https://lantyr.github.io/line-pay-test/cancel"
            }
        }, {
            headers: {
                "Content-Type": "application/json",
                "X-LINE-ChannelId": process.env.CHANNEL_ID,
                "X-LINE-ChannelSecret": process.env.CHANNEL_SECRET
            }
        });

        console.log("LINE Pay API 回傳資料: ", response.data); // 除錯
        res.json({ paymentUrl: response.data.info.paymentUrl.web }); // 回傳付款網址
    } catch (error) {
        console.error("LINE Pay API 發生錯誤: ", error.response?.data || error.message);
        res.status(500).json({ error: "伺服器錯誤", details: error.response?.data || error.message });
    }
});

// ✅ 改成監聽 4000 port
app.listen(4000, () => {
    console.log("✅ Server is running on port 4000");
});
