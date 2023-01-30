const mongoose = require("mongoose");
const UploadSchema = new mongoose.Schema(
    {
    title: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: true,
    },
    },{
        collection: "Upload",
    }
    
    
    );

mongoose.model("Upload", UploadSchema);