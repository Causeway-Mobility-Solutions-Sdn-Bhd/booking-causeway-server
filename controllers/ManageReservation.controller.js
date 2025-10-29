const asyncHandler = require("express-async-handler");
const Usermodel = require("../models/User.js");
const hqApi = require("../hq/hqApi");
const ReservationAttempt = require("../models/ReservationAttempt");
// @DESC Get All Reservations Related To User
// @Route GET /car-rental/manage-reservations/get-all-reservation
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

    const validReservations = hqReservations.filter(
      (r) => r.status?.toLowerCase() !== "pending"
    );

    const formattedReservations = validReservations.map((r) => ({
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
      vehicle_class:
        vehicleClasses.find((vc) => vc.id === r.vehicle_class_id) || null,

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

const updatePickupReturnLocation = asyncHandler(async (req, res) => {
  const {
    pick_up_date,
    pick_up_time,
    return_date,
    return_time,
    pick_up_location,
    return_location,
    brand_id,
    reservation_id,
    reservation_ssid,
  } = req.body;

  if (
    !pick_up_date ||
    !pick_up_time ||
    !return_date ||
    !return_time ||
    !pick_up_location ||
    !return_location ||
    !brand_id ||
    !reservation_id ||
    !reservation_ssid
  ) {
    return res
      .status(400)
      .json({ success: false, message: "Missing required fields." });
  }

  try {
    const reservation = await ReservationAttempt.findById(reservation_ssid);
    if (!reservation) {
      return res
        .status(404)
        .json({ success: false, message: "Reservation not found." });
    }

    const reservedVehicleClassId = reservation.vehicle_class_id;

    // 🔍 Check available classes for the new dates
    const response = await hqApi.post("car-rental/reservations/dates", {
      pick_up_date,
      pick_up_time,
      return_date,
      return_time,
      pick_up_location,
      return_location,
      brand_id,
    });

    const applicable_classes = response?.data?.data?.applicable_classes || [];
    const availableIds = applicable_classes.map((cls) => cls.vehicle_class_id);

    if (!availableIds.includes(Number(reservedVehicleClassId))) {
      return res.status(200).json({
        success: false,
        message: "Selected vehicle class is not available.",
      });
    }

    const locationChanged =
      reservation.pick_up_location?.id !== pick_up_location ||
      reservation.return_location?.id !== return_location;

    const datesChanged =
      reservation.pick_up_date !== pick_up_date ||
      reservation.pick_up_time !== pick_up_time ||
      reservation.return_date !== return_date ||
      reservation.return_time !== return_time;

    const results = [];

    if (datesChanged) {
      const dateUpdate = await hqApi.post(
        `car-rental/reservations/${reservation_id}/update`,
        {
          pick_up_date,
          pick_up_time,
          return_date,
          return_time,
        }
      );
      results.push({ type: "dates", status: dateUpdate.status });
    }

    if (locationChanged) {
      const locationUpdate = await hqApi.post(
        `car-rental/reservations/${reservation_id}/update`,
        {
          pick_up_location,
          return_location,
          vehicle_class_id: reservation.vehicle_class_id,
        }
      );
      results.push({ type: "locations", status: locationUpdate.status });
    }

    // Update DB record
    await ReservationAttempt.updateOne(
      { _id: reservation_ssid },
      {
        $set: {
          pick_up_date,
          pick_up_time,
          return_date,
          return_time,
          pick_up_location,
          return_location,
          updatedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Reservation updated successfully.",
      results,
    });
  } catch (error) {
    console.error("Error updating reservation:", error);
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Failed to update reservation.";
    res.status(500).json({ success: false, message });
  }
});

module.exports = { getAllReservations, updatePickupReturnLocation };
