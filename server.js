require("dotenv").config(); // 載入 .env

const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());

console.log("Channel ID:", process.env.LINE_PAY_CHANNEL_ID); // 測試印出
console.log("Channel Secret:", process.env.LINE_PAY_CHANNEL_SECRET); // 測試印出

app.post("/create-payment", async (req, res) => {
  try {
    const amount = req.body.amount || 100;
    const orderId = `ORDER_${Date.now()}`;

    const response = await axios.post(
      "https://sandbox-api-pay.line.me/v3/payments/request",
      {
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
                price: amount,
              },
            ],
          },
        ],
        redirectUrls: {
          confirmUrl: "https://lantyr.github.io/line-pay-test/",
          cancelUrl: "https://lantyr.github.io/line-pay-test/cancel",
        },
      },
      {
        headers: {
          "Content-Type": "application/json",
          "X-LINE-ChannelId": process.env.LINE_PAY_CHANNEL_ID, // ✅ 改這裡
          "X-LINE-ChannelSecret": process.env.LINE_PAY_CHANNEL_SECRET, // ✅ 改這裡
        },
      }
    );

    console.log("LINE Pay API 回傳資料: ", response.data);
    res.json({ paymentUrl: response.data.info.paymentUrl.web });
  } catch (error) {
    console.error("LINE Pay API 發生錯誤: ", error.response?.data || error.message);
    res.status(500).json({
      error: "伺服器錯誤",
      details: error.response?.data || error.message,
    });
  }
});

app.listen(4000, () => console.log("✅ Server is running on port 4000"));
