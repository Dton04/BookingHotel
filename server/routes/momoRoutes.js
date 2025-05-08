const express = require('express');
const router = express.Router();
const https = require('https');
const crypto = require('crypto');

// MoMo configuration (Test environment)
const config = {
    partnerCode: process.env.MOMO_PARTNER_CODE || 'MOMO',
    accessKey: process.env.MOMO_ACCESS_KEY || 'F8BBA842ECF85',
    secretKey: process.env.MOMO_SECRET_KEY || 'K951B6PE1waDMi640xX08PD3vg6EkVlz',
    redirectUrl: 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
    ipnUrl: 'https://webhook.site/b3088a6a-2d17-4f8d-a383-71389a6c600b',
    requestType: 'payWithMethod',
    autoCapture: true,
    lang: 'vi',
    hostname: 'test-payment.momo.vn',
    path: '/v2/gateway/api/create',
};

// Endpoint to create MoMo payment
router.post('/create-payment', async (req, res) => {
    try {
        const { amount, orderId, orderInfo } = req.body;

        // Validate input
        if (!amount || !orderId || !orderInfo) {
            return res.status(400).json({ message: 'Missing required fields: amount, orderId, orderInfo' });
        }

        const requestId = orderId;
        const extraData = ''; // Optional
        const orderGroupId = '';

        // Create raw signature
        const rawSignature = `accessKey=${config.accessKey}&amount=${amount}&extraData=${extraData}&ipnUrl=${config.ipnUrl}&orderId=${orderId}&orderInfo=${orderInfo}&partnerCode=${config.partnerCode}&redirectUrl=${config.redirectUrl}&requestId=${requestId}&requestType=${config.requestType}`;
        
        // Generate signature
        const signature = crypto.createHmac('sha256', config.secretKey)
            .update(rawSignature)
            .digest('hex');

        // Create request body
        const requestBody = JSON.stringify({
            partnerCode: config.partnerCode,
            partnerName: 'Test',
            storeId: 'MomoTestStore',
            requestId: requestId,
            amount: amount,
            orderId: orderId,
            orderInfo: orderInfo,
            redirectUrl: config.redirectUrl,
            ipnUrl: config.ipnUrl,
            lang: config.lang,
            requestType: config.requestType,
            autoCapture: config.autoCapture,
            extraData: extraData,
            orderGroupId: orderGroupId,
            signature: signature,
        });

        // HTTPS request options
        const options = {
            hostname: config.hostname,
            port: 443,
            path: config.path,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(requestBody),
            },
        };

        // Send request to MoMo
        const momoReq = https.request(options, (momoRes) => {
            let data = '';
            momoRes.setEncoding('utf8');
            momoRes.on('data', (chunk) => {
                data += chunk;
            });
            momoRes.on('end', () => {
                const response = JSON.parse(data);
                if (response.resultCode === 0) {
                    // Success: return payUrl
                    res.status(200).json({
                        payUrl: response.payUrl,
                        orderId: orderId,
                        requestId: requestId,
                    });
                } else {
                    // Error from MoMo
                    res.status(400).json({
                        message: response.message || 'Failed to create MoMo payment',
                        resultCode: response.resultCode,
                    });
                }
            });
        });

        momoReq.on('error', (e) => {
            res.status(500).json({ message: `MoMo request error: ${e.message}` });
        });

        // Write data and send request
        momoReq.write(requestBody);
        momoReq.end();
    } catch (error) {
        res.status(500).json({ message: `Server error: ${error.message}` });
    }
});

module.exports = router;