// models/ReservationAttempt.js
const mongoose = require("mongoose");

const ReservationAttemptSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    brand_id: {
      type: String,
      required: true,
    },
    pick_up_date: {
      type: String,
      required: true,
    },
    pick_up_time: {
      type: String,
      required: true,
    },
    pick_up_location: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      timezone: { type: String, default: "" },
    },
    return_date: {
      type: String,
      required: true,
    },
    return_time: {
      type: String,
      required: true,
    },
    return_location: {
      id: { type: String, required: true },
      name: { type: String, required: true },
      timezone: { type: String, default: "" },
    },
    selected_additional_charges: {
      type: [String],
      default: [],
    },
    step: {
      type: Number,
      required: true,
    },
    vehicle_class_id: {
      type: String,
      required: false,
    },
    customer_id: {
      type: Number,
      required: false,
    },
    reservation_id: {
      type: Number,
      required: false,
    },
    isConformed : {
      type:Boolean,
      require:false
    }
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ReservationAttempt", ReservationAttemptSchema);
