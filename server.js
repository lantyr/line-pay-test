require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.post("/create-payment", async (req, res) => {
    try {
        const amount = req.body.amount || 100; // 測試金額
        const orderId = `ORDER_${Date.now()}`; // 確保 orderId 是唯一的

        const response = await axios.post("https://sandbox-api-pay.line.me/v3/payments/request", {
            amount: amount,
            currency: "TWD",
            orderId: orderId,
            packages: [
                {
                    id: "1",
                    amount: amount,
                    name: "測試商品",
                    products: [  // ✅ API 需要 `products`
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

        console.log("API Response:", response.data); // ✅ Debug API 回傳資料
        res.json({ paymentUrl: response.data.info.paymentUrl.web });
    } catch (error) {
        console.error("LINE Pay API 回傳錯誤: ", error.response?.data || error.message);
        res.status(500).json({ error: "伺服器錯誤", details: error.response?.data || error.message });
    }
});

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});
