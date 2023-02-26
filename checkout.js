const mongoose = require("mongoose");
const moment = require('moment-timezone');
const BangkokTime = moment.tz(Date.now(), "Asia/Bangkok").format('YYYY-MM-DD HH:mm:ss');

const CheckoutSchema = new mongoose.Schema(
    {
        buyerId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'UserInfo',
            required: true,
        },
        products: [
            {
                productId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Upload',
                    required: true,
                },
                quantity: {
                    type: Number,
                    required: true,
                },
                
            },
        ],
        totalAmount: {
            type: Number,
            required: true,
        },
        createdAt: {
            type: Date,
            default: BangkokTime,
        },
    },{
        collection: "Checkout",
    });

mongoose.model("Checkout", CheckoutSchema);