const mongoose = require("mongoose");
const CartSchema = new mongoose.Schema(
  {
    buyerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'UserInfo',
      required: true
    },
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Upload',
        required: true
      },
      quantity: {
        type: Number,
        required: true
      }
  },{
    collection: "Cart",
});
  
mongoose.model("Cart", CartSchema);