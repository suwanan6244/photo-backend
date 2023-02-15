const mongoose = require("mongoose");
const DetectSchema = new mongoose.Schema(
    {
    name: {
        type: String,
        required: true,
    },
    watermark: {
        type: Buffer,
        required: true,
    },
    },{
        collection: "Detect",
    }
    
    
    );

mongoose.model("Detect", DetectSchema);