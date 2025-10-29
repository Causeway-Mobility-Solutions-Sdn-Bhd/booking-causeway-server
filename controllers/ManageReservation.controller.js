const asyncHandler = require("express-async-handler");
const Usermodel = require("../models/User.js");
const hqApi = require("../hq/hqApi");

// @DESC Get All Reservations Related To User
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
        type: "number",
        column: "customer_id",
        operator: "equals",
        value: dbUser.HqId,
      },
    ]);

    const response = await hqApi.get(
      `/car-rental/reservations?filters=${encodeURIComponent(filters)}`
    );

    const hqReservations = response.data || [];

    if (!hqReservations.length) {
      return res.status(200).json({
        message: "No reservations found",
        data: [],
      });
    }

    res.status(200).json({
      message: "Reservations fetched successfully",
      data: hqReservations,
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
