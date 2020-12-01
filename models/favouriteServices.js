const mongoose = require("mongoose");

const favouriteServicesSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    department: {
        required: true,
        type: String
    },
    authority: {
        type: String,
        required: true
    },
    url: {
        type: String,
        required: true,
        default:"#"
    },
    subject: {
        type: String,
        required: true,
    },
    timeStamp: {
        type: Date,
        default: Date.now()
    },
    
});

module.exports = favouriteServices = mongoose.model("favouriteServices", favouriteServicesSchema);