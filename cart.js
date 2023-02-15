const mongoose = require("mongoose");
const CartSchema = new mongoose.Schema(
    {
    items : [
        {
            /*_id: {
                type: Schema.Type.ObjectId,
                ref: "Upload",
                required: true,
            },*/
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
            countInStock: {
                type: Number,
                required: true,
            },
            description: {
                type: String,
                required: true,
              },
        }
        ]
    }
    ,{
        collection: "Cart",
    }
    
    
    );

mongoose.model("Cart", CartSchema);