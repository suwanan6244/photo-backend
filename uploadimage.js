const mongoose = require("mongoose");
const UploadimageSchema = new mongoose.Schema(
    {
    imag: {
        type: String,
        required: true,
    },
   
    },{
        collection: "Uploadimage",
    }
    
    
    );

mongoose.model("Uploadimage", UploadimageSchema);