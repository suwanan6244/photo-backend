const mongoose = require("mongoose");
const BankSchema = new mongoose.Schema(
    {
        
        bankname: String,
        name: String,
        number: String,
    },
    {
        collection: "BankInfo",
    }
);

mongoose.model("BankInfo", BankSchema);