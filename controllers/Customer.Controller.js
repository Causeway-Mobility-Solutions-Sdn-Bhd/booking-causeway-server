const asyncHandler = require("express-async-handler");
const hqApi = require("../hq/hqApi");
const ReservationAttempt = require("../models/ReservationAttempt");

// @DESC Get Customer Form Fields (Step 4)
// @Route GET /api/customers/form-fields
// @Access Private
const getCustomerFormFields = asyncHandler(async (req, res) => {
  try {
    const response = await hqApi.get(
      "/car-rental/reservations/fields/customer"
    );
    const fields = response?.data?.fields || {};

    res.status(200).json(fields);
  } catch (error) {
    console.log("Error fetching customer form fields:", error);
    res.status(error.response?.status || 500).json({
      message:
        error.response?.data?.message || "Failed to fetch customer form fields",
    });
  }
});

//@DESC Create Customer
//@Router POST /api/customers/create-customers
//@access Private
const createCustomer = asyncHandler(async (req, res) => {
  try {
    const queryParams = req.query;

    if (Object.keys(queryParams).length === 0) {
      return res.status(400).json({ message: "No query parameters provided" });
    }

    const response = await hqApi.post(
      `contacts/categories/3/contacts`,
      new URLSearchParams(queryParams),
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
      }
    );

    const reservationAttemptId = req.reservationAttemptId;

    const savedReservation = await ReservationAttempt.findById(
      reservationAttemptId
    );

    if (savedReservation) {
      savedReservation.step = 5;
      savedReservation.customer_id = response?.data?.contact?.id;
      await savedReservation.save();
    }

    res.status(200).json({customer : response.data , reservation : savedReservation});
  } catch (error) {
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Failed to create customer",
    });
  }
});

//@DESC Get Single Customer
//@Router GET /api/customers/get-customer/:id
//@access Private
const getSingleCustomerById = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params; // ✅ correct

    const response = await hqApi.get(`contacts/categories/3/contacts/${id}`);
    const contact = response?.data?.contact;

    let drivingLicence = [];
    let ids = [];

    if (contact?.id) {
      const responseFiles = await hqApi.get("/files", {
        params: {
          item_type: "contacts.3",
          item_id: contact?.id,
          limit: 10,
        },
      });

      const files = responseFiles.data.data || [];

      drivingLicence = files
        .filter((ff) => ff?.field_id === 252)
        .map((file) => ({
          label: file.label,
          public_link: file.public_link,
        }));

      ids = files
        .filter((ff) => ff?.field_id === 274)
        .map((file) => ({
          label: file.label,
          public_link: file.public_link,
        }));

      // ✅ update fields
      contact.f252 = drivingLicence;
      contact.f274 = ids;
    }

    res.status(200).json(contact);
  } catch (error) {
    res.status(error.response?.status || 500).json({
      message:
        error.response?.data?.message || "Failed to fetch Single Customer",
    });
  }
});

// @DESC Update Customer
// @Route PUT /api/customers/update-customer/:id
// @Access Private
const updateCustomer = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({ message: "Customer ID is required" });
    }

    const updateData = req.body;

    if (!updateData || Object.keys(updateData).length === 0) {
      return res.status(400).json({ message: "No update data provided" });
    }

    const response = await hqApi.put(
      `contacts/categories/3/contacts/${id}`,
      updateData,
    );

    res.status(200).json({
      message: "Customer updated successfully",
      customer: response?.data?.contact,
    });
  } catch (error) {
    console.log("Error updating customer:", error.message || error);

    if (error.response) {
      return res.status(error.response.status).json({
        message: error.response.data?.message || "Failed to update customer",
      });
    }

    res.status(500).json({ message: "An error occurred while updating customer" });
  }
});

module.exports = {
  getCustomerFormFields,
  createCustomer,
  getSingleCustomerById,
  updateCustomer
};
