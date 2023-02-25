const mongoose = require("mongoose");
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
            default: Date.now,
        },
        
    },{
        collection: "Checkout",
    });

mongoose.model("Checkout", CheckoutSchema);