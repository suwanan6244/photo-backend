const mongoose = require("mongoose")
const crypto = require("crypto")

function generateId() {
    return crypto.randomBytes(16).toString('hex')
}

const DataQRcodeSchema = new mongoose.Schema({
    _id: { 
        type: String, 
        default: generateId
    },
    title: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    price: {
        type: Number,
        required: true,
    },
    seller: {
        fname: {
            type: String,
            required: true,
        },
        lname: {
            type: String,
            required: true,
        },
    },
    buyer: {
        fname: {
            type: String,
            required: true,
        },
        lname: {
            type: String,
            required: true,
        },
    },
    purchaseTime: {
        type: Date,
        default: Date.now
    },
}, {
    collection: 'DataQRcode',
    timestamps: true,
})

mongoose.model("DataQRcode", DataQRcodeSchema)
