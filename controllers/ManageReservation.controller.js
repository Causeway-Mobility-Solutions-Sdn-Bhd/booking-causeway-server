const asyncHandler = require("express-async-handler");
const Usermodel = require("../models/User.js");
const hqApi = require("../hq/hqApi");

// @DESC Get All Reservations Related To User (Simplified)
// @Route GET /car-rental/manage-reservations
// @Access Private
const getAllReservations = asyncHandler(async (req, res) => {
  try {
    const user = req.user;

    const dbUser = await Usermodel.findById(user.id);
    if (!dbUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const filters = JSON.stringify([
      {
        type: "string",
        column: "customer_id",
        operator: "equals",
        value: String(dbUser.HqId),
      },
    ]);

    console.log(
      `/car-rental/reservations?filters=${encodeURIComponent(filters)}`
    );

    const response = await hqApi.get(
      `/car-rental/reservations?filters=${encodeURIComponent(filters)}`
    );

    const vehicleClassRes = await hqApi.get("fleets/vehicle-classes");
    const vehicleClasses = vehicleClassRes?.data?.fleets_vehicle_classes || [];

    const hqReservations = response?.data?.data || [];

    const formattedReservations = hqReservations.map((r) => ({
      reservation_id: r.id,
      reservation_number: r.prefixed_id,
      status: r.status,
      customer_id: r.customer_id,
      customer_name: r.customer?.label,
      customer_email: r.customer?.email,
      customer_phone: r.customer?.phone_number,

      pick_up_location: r.pick_up_location_label,
      pick_up_address: r.pick_up_location?.address,
      pick_up_date: r.pick_up_date,
      pick_up_time: r.pick_up_time,

      return_location: r.return_location_label,
      return_address: r.return_location?.address,
      return_date: r.return_date,
      return_time: r.return_time,

      vehicle_class_id: r.vehicle_class_id,
      vehicle_class_image: r.vehicle_class?.public_image_link,
      vehicle_class: vehicleClasses.find(vc => vc.id === r.vehicle_class_id) || null,

      total_price: r.total_price,
      currency: r.currency,

      created_at: r.created_at,
      updated_at: r.updated_at,
    }));

    res.status(200).json({
      message: "Reservations fetched successfully",
      data: formattedReservations,
    });
  } catch (error) {
    console.error("Error fetching reservation details:", error.message);
    res.status(error.response?.status || 500).json({
      message:
        error.response?.data?.message || "Failed to fetch reservation details",
    });
  }
});

module.exports = { getAllReservations };
