const asyncHandler = require("express-async-handler");
const Usermodel = require("../models/User.js");
const hqApi = require("../hq/hqApi");
const ReservationAttempt = require("../models/ReservationAttempt");
const { generateSessionId } = require("../lib/idGenerator.js");
const getRebookedDates = require("../lib/getRebookedDates.js");
const cookieOptions = require("../lib/cookieOption.js");

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

    const response = await hqApi.get(
      `/car-rental/reservations?filters=${encodeURIComponent(filters)}`
    );

    const vehicleClassRes = await hqApi.get("fleets/vehicle-classes");
    const vehicleClasses = vehicleClassRes?.data?.fleets_vehicle_classes || [];

    const hqReservations = response?.data?.data || [];

    // const validReservations = hqReservations.filter(
    //   (r) => r.status?.toLowerCase() !== "pending"
    // );
    const validReservations = hqReservations;
    const reservationIds = validReservations.map((r) => r.id);
    const attempts = await ReservationAttempt.find({
      reservation_id: { $in: reservationIds },
    }).select("_id reservation_id");

    const attemptMap = new Map(attempts.map((a) => [a.reservation_id, a._id]));
    const formattedReservations = validReservations.map((r) => {
      const pickUpDate = new Date(r.pick_up_date);
      const returnDate = new Date(r.return_date);

      const durationDays = Math.ceil(
        (returnDate - pickUpDate) / (1000 * 60 * 60 * 24)
      );

      const options = { weekday: "short", day: "2-digit", month: "short" };
      const formattedDate = pickUpDate.toLocaleDateString("en-GB", options);

      const time = pickUpDate.toLocaleTimeString("en-US", {
        hour: "numeric",
        hour12: true,
      });

      return {
        id: attemptMap.get(r.id) || null,
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

        // ✅ New key for formatted duration
        dateWithDays: `${formattedDate}, ${time} (${durationDays} day${
          durationDays > 1 ? "s" : ""
        })`,
      };
    });

    const bookings = {
      upcoming: formattedReservations.filter(
        (b) => b.status === "open" || b.status === "pending"
      ),
      completed: formattedReservations.filter((b) => b.status === "completed"),
      cancelled: formattedReservations.filter((b) => b.status === "cancelled"),
    };
    res.status(200).json({
      message: "Reservations fetched successfully",
      data: bookings,
    });
  } catch (error) {
    console.error("Error fetching reservation details:", error.message);
    res.status(error.response?.status || 500).json({
      message:
        error.response?.data?.message || "Failed to fetch reservation details",
    });
  }
});
const formatDateTimeParts = (datetimeString) => {
  const dateObj = new Date(datetimeString);

  const yyyy = dateObj.getFullYear();
  const mm = String(dateObj.getMonth() + 1).padStart(2, "0");
  const dd = String(dateObj.getDate()).padStart(2, "0");

  const hh = String(dateObj.getHours()).padStart(2, "0");
  const min = String(dateObj.getMinutes()).padStart(2, "0");

  return {
    date: `${yyyy}-${mm}-${dd}`,
    time: `${hh}:${min}`,
  };
};
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

    // Check available classes for the new dates
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
    const availableClassesFiltered = applicable_classes.filter(
      (cls) => cls.availability.quantity > 0
    );
    const availableIds = availableClassesFiltered.map(
      (cls) => cls.vehicle_class_id
    );
    console.log(availableClassesFiltered);

    console.log(availableIds);

    if (!availableIds.includes(Number(reservedVehicleClassId))) {
      return res.status(200).json({
        success: false,
        message: "Selected vehicle class is not available.",
      });
    }
    let updatedReservation;
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
        `car-rental/reservations/${reservation.reservation_id}/update`,
        {
          pick_up_date,
          pick_up_time,
          return_date,
          return_time,
        }
      );
      updatedReservation = dateUpdate.data.data.reservation;
      results.push({ type: "dates", status: dateUpdate.status });
    }

    if (locationChanged) {
      const vehicleClass = Number(reservedVehicleClassId);
      console.log(vehicleClass);
      console.log(pick_up_location);

      const locationUpdate = await hqApi.post(
        `car-rental/reservations/${reservation.reservation_id}/update`,
        {
          pick_up_location,
          return_location,
          vehicle_class_id: vehicleClass,
        }
      );
      console.log(locationUpdate.data);

      if (locationUpdate.data.data.success) {
        updatedReservation = locationUpdate.data.data.reservation;
      }
      results.push({ type: "locations", status: locationUpdate.status });
    }
    if (updatedReservation) {
      const pickup = formatDateTimeParts(updatedReservation.pick_up_date);
      const ret = formatDateTimeParts(updatedReservation.return_date);
      // Update DB record

      await ReservationAttempt.updateOne(
        { _id: reservation_ssid },
        {
          $set: {
            pick_up_date: pickup?.date,
            pick_up_time: pickup?.time,
            return_date: ret?.date,
            return_time: ret?.time,
            pick_up_location: updatedReservation?.pick_up_location,
            return_location: updatedReservation?.return_location,
            updatedAt: new Date(),
          },
        }
      );
    }

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

//@DESC Change Additional Charges of a Reservation
//@ROUTE POST /car-rental/reservations/:id/update
//@ACCESS Private
const updateAddons = asyncHandler(async (req, res) => {
  try {
    const { reservation_id, additional_charges } = req.body;

    if (!reservation_id) {
      return res.status(400).json({ message: "Reservation ID is required" });
    }

    if (!Array.isArray(additional_charges) || additional_charges.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one additional charge is required" });
    }

    const payload = new URLSearchParams();

    additional_charges.forEach((charge) => {
      payload.append("additional_charges[]", charge);
    });

    const response = await hqApi.post(
      `/car-rental/reservations/${reservation_id}/update`,
      payload
    );

    res.status(200).json({
      success: true,
      message: "Additional charges updated successfully",
      data: response?.data?.data || response?.data,
    });
  } catch (error) {
    console.error("Error updating additional charges:", error);
    res.status(error.response?.status || 500).json({
      success: false,
      message:
        error.response?.data?.message || "Failed to update additional charges",
    });
  }
});

const cancelBooking = asyncHandler(async (req, res) => {
  try {
    console.log(req.body);

    const { id } = req.body;
    console.log(id);

    if (!id) {
      return res
        .status(400)
        .json({ message: "Reservation attempt ID is required" });
    }

    const attempt = await ReservationAttempt.findById(id);
    if (!attempt) {
      return res.status(404).json({ message: "Reservation attempt not found" });
    }

    const reservationId = attempt.reservation_id;
    if (!reservationId) {
      return res
        .status(400)
        .json({ message: "No reservation_id found for this attempt" });
    }

    const cancellationDate = new Date().toISOString();

    const response = await hqApi.post(
      `/car-rental/reservations/${reservationId}/cancelled`,
      {},
      {
        params: { cancellation_date: cancellationDate },
      }
    );

    attempt.status = "cancelled";
    attempt.cancellation_date = cancellationDate;
    await attempt.save();

    res.status(200).json({
      message: "Reservation cancelled successfully",
      data: {
        reservation_id: reservationId,
        cancellation_date: cancellationDate,
        hq_response: response?.data || {},
      },
    });
  } catch (error) {
    console.error("Error cancelling reservation:", error.message);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Failed to cancel reservation",
    });
  }
});

const findBooking = asyncHandler(async (req, res) => {
  try {
    const { reservation_id, email } = req.body;

    if (!reservation_id) {
      return res.status(400).json({ message: "Reservation ID is required" });
    }

    const filters = JSON.stringify([
      {
        type: "string",
        column: "prefixed_id",
        operator: "equals",
        value: String(reservation_id),
      },
    ]);

    // Call HQ API
    const response = await hqApi.get(
      `/car-rental/reservations?filters=${encodeURIComponent(filters)}`
    );

    const hqReservations = response?.data?.data || [];

    if (!hqReservations.length) {
      return res.status(404).json({ message: "No reservation found" });
    }

    // Email Same??
    const reservation = hqReservations[0];
    if (
      email &&
      reservation?.customer?.email?.toLowerCase() !== email.toLowerCase()
    ) {
      return res
        .status(403)
        .json({ message: "Email does not match the booking record" });
    }
    const attempt = await ReservationAttempt.findOne({
      reservation_id: reservation.id,
    }).select("_id reservation_id status");
    if (!attempt) {
      return res.status(404).json({
        message: "No reservation attempt found for this booking",
      });
    }
    res.status(200).json({
      message: "Reservation found successfully",
      data: {
        reservation,
        attempt_id: attempt._id,
        attempt_status: attempt.status,
      },
    });
  } catch (error) {
    console.error("Error finding reservation:", error.message);
    res.status(error.response?.status || 500).json({
      message:
        error.response?.data?.message || "Failed to fetch reservation details",
    });
  }
});

const rebookReservation = asyncHandler(async (req, res) => {
  const { id } = req.body;

  if (!id) {
    return res.status(400).json({ message: "Reservation ID is required." });
  }

  const existingReservation = await ReservationAttempt.findById(id);
  if (!existingReservation) {
    return res.status(404).json({ message: "Reservation not found." });
  }

  if (existingReservation.rebookedAt) {
    const rebooked = await ReservationAttempt.findById(
      existingReservation.rebookedAt
    );

    if (rebooked) {
      if (rebooked.isConformed === false) {
        res.cookie("ssid", rebooked._id.toString(), cookieOptions);
        return res.status(200).json({
          message: "Rebook attempt already exists and is not confirmed yet.",
          reservation: rebooked,
        });
      }
    }
  }

  const { pickupDate, returnDate } = getRebookedDates(
    existingReservation.pick_up_date,
    existingReservation.return_date
  );
  const newReservationData = {
    _id: generateSessionId(),
    brand_id: existingReservation.brand_id,
    pick_up_date: pickupDate,
    pick_up_time: existingReservation.pick_up_time,
    return_date: returnDate,
    return_time: existingReservation.return_time,
    pick_up_location: existingReservation.pick_up_location,
    return_location: existingReservation.return_location,
    selected_additional_charges:
      existingReservation.selected_additional_charges,
    customer_id: existingReservation.customer_id,
    vehicle_class_id: existingReservation.vehicle_class_id,
    step: 2,
    isConformed: false,
    status: "pending",
  };

  const newReservation = await ReservationAttempt.create(newReservationData);

  existingReservation.rebookedAt = newReservation._id;
  await existingReservation.save();

  res.cookie("ssid", newReservation._id.toString(), cookieOptions);

  res.status(201).json({
    message: "Rebooked successfully",
    reservation: newReservation,
  });
});

module.exports = {
  getAllReservations,
  updatePickupReturnLocation,
  cancelBooking,
  findBooking,
  rebookReservation,
  updateAddons,
};
