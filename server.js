require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const crypto = require('crypto');

const app = express();

// 詳細的CORS設置
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

console.log("Channel ID:", process.env.LINE_PAY_CHANNEL_ID);
console.log("Channel Secret:", process.env.LINE_PAY_CHANNEL_SECRET);

// 添加一個簡單的GET路由進行測試
app.get("/test", (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.json({ message: "服務器正常運行!" });
});

app.post("/create-payment", async (req, res) => {
  console.log("收到付款請求:", req.body);
  
  try {
    const amount = req.body.amount || 100;
    const orderId = `ORDER_${Date.now()}`;
    
    // 建立請求體
    const requestBody = {
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
    };
    
    // JSON字串
    const requestBodyString = JSON.stringify(requestBody);
    console.log("發送給LINE Pay的請求體:", requestBodyString);
    
    // 生成簽名
    const channelSecret = process.env.LINE_PAY_CHANNEL_SECRET;
    const nonce = Date.now().toString();
    const hmacString = channelSecret + '/v3/payments/request' + requestBodyString + nonce;
    const signature = crypto.createHmac('sha256', channelSecret).update(hmacString).digest('base64');
    
    console.log("簽名:", signature);
    console.log("Nonce:", nonce);
    
    // 發送請求
    const response = await axios.post(
      "https://sandbox-api-pay.line.me/v3/payments/request",
      requestBody,
      {
        headers: {
          "Content-Type": "application/json",
          "X-LINE-ChannelId": process.env.LINE_PAY_CHANNEL_ID,
          "X-LINE-Authorization-Nonce": nonce,
          "X-LINE-Authorization": signature,
        },
      }
    );

    console.log("LINE Pay API 回傳:", JSON.stringify(response.data, null, 2));
    
    // 檢查response.data的結構並正確提取paymentUrl
    res.setHeader('Content-Type', 'application/json');
    
    if (response.data.info && response.data.info.paymentUrl && response.data.info.paymentUrl.web) {
      console.log("找到付款URL:", response.data.info.paymentUrl.web);
      res.json({ paymentUrl: response.data.info.paymentUrl.web });
    } else {
      console.log("付款URL結構不符預期:", response.data);
      // 嘗試找出正確的路徑
      res.json({ 
        paymentUrl: response.data.info?.paymentUrl?.web || 
                  response.data.paymentUrl?.web || 
                  response.data.paymentUrl || 
                  response.data.info?.paymentUrl ||
                  "付款URL未找到",
        fullResponse: response.data // 返回完整響應以便調試
      });
    }
  } catch (error) {
    console.error("錯誤發生:");
    
    if (error.response) {
      console.error("狀態:", error.response.status);
      console.error("數據:", JSON.stringify(error.response.data, null, 2));
      console.error("標頭:", error.response.headers);
    } else if (error.request) {
      console.error("請求已發送但無響應");
      console.error(error.request);
    } else {
      console.error("錯誤:", error.message);
    }
    
    // 確保返回JSON格式
    res.setHeader('Content-Type', 'application/json');
    res.status(500).json({
      error: "伺服器錯誤",
      details: error.response?.data || error.message,
    });
  }
});

app.listen(4000, () => console.log("✅ Server is running on port 4000"));