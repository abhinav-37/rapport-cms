const mongoose = require("mongoose");

const orderDataSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }, 
    orderData: {
        type: Object,
        required:true
    }
});

module.exports = OrderData = mongoose.model("orderData", orderDataSchema);