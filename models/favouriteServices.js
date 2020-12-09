const mongoose = require("mongoose");

const favouriteServicesSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    favourates: {
        type:Object,
    },
    timeStamp: {
        type: Date,
        default: Date.now()
    },
    
});

module.exports = favouriteServices = mongoose.model("favouriteServices", favouriteServicesSchema);