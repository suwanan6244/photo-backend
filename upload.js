const mongoose = require("mongoose")
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
    price: {
        type: Number,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
      sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'UserInfo',
        required: true,
    },
    },{
        collection: "Upload",
    }
    
    
    )

mongoose.model("Upload", UploadSchema)