const mongoose = require("mongoose");

const dailyWagesSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    schedule: {
        required: true,
        type: String
    },
    category: {
        type: String,
        required: true
    },
    minimumRates: {
        type: Object,
        required:true
    },
    timeStamp: {
        type: Date,
        default: Date.now()
    },
    filename:String
});

module.exports = dailyWages = mongoose.model("DailyWages", dailyWagesSchema);