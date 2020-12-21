const mongoose = require("mongoose");

const customerResponseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
    },
    nameOfService: {
        type: String,
        required: true,
    },
    name: {
        type: String,
        required: true,
    },
    idOfService: {
        type: String,
        required: true,
    },
    serviceType: {
        type: String,
        required: true,
    },
    company_name: {
        type: Number,
        required: true,
    },
    email: {
        type: String,
        required: true,
    },
    contact_number: {
        type: Number,
        required: true,
    },
    primaryBusiness: {
        type: String,
        required: true,
    },
    employeeCount: {
        type: Number,
        required: true,
    },
    billingAddress: {
        type: String,
        required: true,
    },
    city: { type: String, required: true },
    state: { type: String, required: true },
    employeeAssigned: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
    },
    statusOfWork: {
        type: String,
        default: "started",
    },
    timeStamp: {
        type: Date,
        default: Date.now(),
    },
    nameOfImage: String,
});

module.exports = CustomerResponse = mongoose.model(
    "customerResponse",
    customerResponseSchema
);
