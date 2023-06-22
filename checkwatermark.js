const mongoose = require("mongoose")
const CheckwatermarkSchema = new mongoose.Schema(
    {
    image: {
        type: String,
        required: true,
    },
    
    },{
        collection: "Checkwatermark",
    }
    
    
    );

mongoose.model("Checkwatermark", CheckwatermarkSchema)