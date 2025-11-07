const asyncHandler = require("express-async-handler");
const hqApi = require("../hq/hqApi");
const NodeCache = require("node-cache");
const ReservationAttempt = require("../models/ReservationAttempt");
const { generateSessionId } = require("../lib/idGenerator");
const cookieOptions = require("../lib/cookieOption");

const cache = new NodeCache({ stdTTL: 86400 });

//@DESC Validate Dates and Locations, List Available Vehicle Classes with Details
//@Route POST /car-rental/reservations/dates
//@Access Private
const validateDatesAndListVehicleClasses = asyncHandler(async (req, res) => {
  const {
    pick_up_date,
    pick_up_time,
    return_date,
    return_time,
    pick_up_location,
    return_location,
    brand_id,
    isCreate,
    isEdit,
    min_price,
    max_price,
    car_type,
    sort_by,
    seats,
    fuelType,
    transmission,
    connectivity,
    customer_id,
  } = req.body;

  console.log(req?.body);

  const reservationAttemptId = req.reservationAttemptId;

  // ✅ Step 1: Validate required input
  const missingMessage = getFirstMissingFieldMessage({
    pick_up_date,
    pick_up_time,
    return_date,
    return_time,
    pick_up_location,
    return_location,
  });

  if (missingMessage) {
    return res.status(400).json({ message: missingMessage });
  }

  try {
    // ✅ Step 2: Fetch reservation (always fresh)
    const reservationResponse = await hqApi.post(
      "car-rental/reservations/dates",
      {
        pick_up_date,
        pick_up_time,
        return_date,
        return_time,
        pick_up_location,
        return_location,
        brand_id,
      }
    );

    // ✅ Step 3: Get vehicles + classTypeArray from cache
    const cacheKey = "vehicles_with_classMap";
    let cachedData = cache.get(cacheKey);

    if (!cachedData) {
      console.log("Fetching vehicles + classTypeArray from API...");

      const vehicleResponse = await hqApi.get("fleets/vehicles/");
      const allVehicles = vehicleResponse?.data?.data || [];

      // Build classTypeArray once
      const classTypeArray = [];
      for (const vehicle of allVehicles) {
        if (
          vehicle.vehicle_class_id == null ||
          vehicle.vehicle_type_id == null
        ) {
          continue;
        }
        const exists = classTypeArray.some(
          (item) => item.vehicle_class_id === vehicle.vehicle_class_id
        );

        if (!exists) {
          classTypeArray.push({
            vehicle_class_id: vehicle.vehicle_class_id,
            vehicle_type_id: vehicle.vehicle_type_id,
          });
        }
      }

      cachedData = { allVehicles, classTypeArray };
      cache.set(cacheKey, cachedData);
    } else {
      console.log("Serving vehicles + classTypeArray from cache");
    }

    const { classTypeArray } = cachedData;

    const { applicable_classes = [], reservation: reservationDetails = {} } =
      reservationResponse?.data?.data || {};

    const pickup = formatDateTimeParts(reservationDetails.pick_up_date);
    const ret = formatDateTimeParts(reservationDetails.return_date);

    const reservation = {
      _id: generateSessionId(),
      pick_up_date: pickup?.date,
      pick_up_time: pickup?.time,
      return_date: ret?.date,
      return_time: ret?.time,
      pick_up_location: reservationDetails?.pick_up_location,
      return_location: reservationDetails?.return_location,
      selected_additional_charges: ["20"],
      brand_id,
      step: 2,
      ...(customer_id && { customer_id }),
    };

    let savedReservation;

    try {
      if (isCreate) {
        console.log(reservation);
        savedReservation = await ReservationAttempt.create(reservation);
      } else {
        if (reservationAttemptId) {
          savedReservation = await ReservationAttempt.findById(
            reservationAttemptId
          );

          if (!savedReservation) {
            return res
              .status(404)
              .json({ message: "Reservation attempt not found" });
          }
        } else {
          savedReservation = await ReservationAttempt.create(reservation);
        }
      }
    } catch (error) {
      console.log("Error handling reservation attempt:", error.message);
      return res
        .status(500)
        .json({ message: "Failed to process reservation attempt" });
    }

    let enrichedClasses = applicable_classes
      .filter((item) => item?.availability?.quantity > 0)
      .map((item) => {
        const typevehi = classTypeArray.find(
          (tp) => tp.vehicle_class_id === item.vehicle_class_id
        );

        return {
          id: item.vehicle_class_id,
          name: item.vehicle_class?.label || "Unknown",
          price: {
            daily_price: item.price?.details?.[0]?.base_daily_price || 0,
            total_price: item.price?.base_price || 0,
          },
          availability: {
            quantity: item.availability?.quantity || 0,
            selectable: item.availability?.selectable || false,
          },
          vehicle_type: typevehi?.vehicle_type_id,
          features: item?.vehicle_class?.features || [],
          recommended: item?.vehicle_class?.recommended || false,
          image: item?.vehicle_class?.image,
        };
      })
      .sort((a, b) => (b.recommended === true) - (a.recommended === true));

    if (isEdit) {
      const vehicle_class_id = savedReservation?.vehicle_class_id;
      const selectedVehicle = enrichedClasses?.filter(
        (cls) => cls?.id === Number(vehicle_class_id)
      );
      if (selectedVehicle?.length !== 0) {
        (savedReservation.pick_up_date = reservation?.pick_up_date),
          (savedReservation.pick_up_time = reservation?.pick_up_time),
          (savedReservation.pick_up_location = reservation?.pick_up_location),
          (savedReservation.return_date = reservation?.return_date),
          (savedReservation.return_time = reservation?.return_time),
          (savedReservation.return_location = reservation?.return_location),
          await savedReservation.save();
      } else {
        return res.status(400).json({
          message: `In selected Date Range Selected vehicle not available`,
        });
      }
    }

    if (sort_by === "lowToHigh") {
      enrichedClasses.sort(
        (a, b) => a.price.daily_price?.amount - b.price.daily_price?.amount
      );
    } else if (sort_by === "highToLow") {
      enrichedClasses.sort(
        (a, b) => b.price.daily_price?.amount - a.price.daily_price?.amount
      );
    } else if (sort_by === "recommended") {
      enrichedClasses = enrichedClasses.filter((a) => a?.recommended === true);
    }

    if (min_price !== undefined || max_price !== undefined) {
      enrichedClasses = enrichedClasses.filter((item) => {
        const total = item?.price.daily_price?.amount || 0;
        if (min_price !== undefined && total < min_price) return false;
        if (max_price !== undefined && total > max_price) return false;
        return true;
      });
    }

    const carTypesArray = Array.isArray(car_type)
      ? car_type
      : car_type !== undefined && car_type !== null
      ? [car_type]
      : [];

    if (carTypesArray.length > 0) {
      enrichedClasses = enrichedClasses.filter((item) =>
        carTypesArray.includes(item.vehicle_type)
      );
    }

    if (seats !== undefined) {
      enrichedClasses = enrichedClasses.filter((item) =>
        item.features.some((f) => seats?.includes(f.id))
      );
    }
    if (fuelType !== undefined) {
      enrichedClasses = enrichedClasses.filter((item) =>
        item.features.some((f) => f.id === fuelType)
      );
    }
    if (connectivity !== undefined) {
      enrichedClasses = enrichedClasses.filter((item) =>
        item.features.some((f) => f.id === connectivity)
      );
    }
    if (transmission !== undefined && transmission !== 0) {
      enrichedClasses = enrichedClasses.filter((item) =>
        item.features.some((f) => f.id === transmission)
      );
    }

    if (isCreate) {
      res.cookie("ssid", savedReservation._id.toString(), cookieOptions);
    }

    const selectedVehicle = enrichedClasses.filter(
      (item) => item?.id === Number(savedReservation?.vehicle_class_id)
    );

    res.status(200).json({
      reservation: savedReservation,
      VehicleClasses: enrichedClasses,
      selectedVehicle: selectedVehicle.length > 0 ? selectedVehicle[0] : null,
    });
  } catch (error) {
    console.log("Error validating dates and fetching vehicle classes:", error);

    const statusCode = error?.response?.status || 500;
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Failed to validate dates and get vehicle classes";

    res.status(statusCode).json({ message });
  }
});

// @DESC   Get Applicable Additional Charges based on selected Dates and Vehicle Class
// @ROUTE  GET /car-rental/reservations/additional-charges
// @ACCESS Private
const getAdditionalCharges = asyncHandler(async (req, res) => {
  const {
    pick_up_date,
    pick_up_time,
    return_date,
    return_time,
    pick_up_location,
    return_location,
    brand_id,
    vehicle_class_id,
  } = req.query;

  const vehicleClassId = Number(vehicle_class_id);
  const reservationAttemptId = req.reservationAttemptId;

  try {
    // Step 1: Fetch additional charges
    const additionalChargesResponse = await hqApi.get(
      "car-rental/reservations/additional-charges",
      {
        params: {
          pick_up_date,
          pick_up_time,
          return_date,
          return_time,
          pick_up_location,
          return_location,
          brand_id,
          vehicle_class_id,
        },
      }
    );

    const {
      selected_vehicle_class,
      reservation: reservationDetails = {},
      additional_charges,
    } = additionalChargesResponse?.data?.data || {};

    let savedReservation = null;
    if (reservationAttemptId) {
      savedReservation = await ReservationAttempt.findById(
        reservationAttemptId
      );
      if (!savedReservation) {
        return res
          .status(404)
          .json({ message: "Reservation attempt not found" });
      }
      savedReservation.vehicle_class_id = reservationDetails?.vehicle_class_id;
      if (!(savedReservation.step > 3)) savedReservation.step = 3;
      await savedReservation.save();
    }

    // Step 2: Build selected_vehicle
    const selected_vehicle = {
      vehicle_class_id: vehicleClassId,
      image: selected_vehicle_class?.vehicle_class?.image,
      features: selected_vehicle_class?.vehicle_class?.features,
      name: selected_vehicle_class?.vehicle_class?.label,
      tot_days: selected_vehicle_class?.price?.total_days,
      base_daily_price:
        selected_vehicle_class?.price?.details[0]?.base_daily_price,
      total_price_without_tax:
        selected_vehicle_class?.price?.details[0]?.total_price,
      total_price_with_tax:
        selected_vehicle_class?.price?.details[0]?.total_price_with_taxes,
      total_price_with_mandatory_charges_and_taxes:
        selected_vehicle_class?.price
          ?.total_price_with_mandatory_charges_and_taxes,
      total_tax: additionalChargesResponse?.data?.data?.applicable_taxes[0],
    };

    // Step 3: Group additional charges by category
    const categoryMap = new Map();

    for (const charge of additional_charges || []) {
      const { additional_charge_category: category } = charge;

      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          category: {
            id: category.id,
            label: category.label,
            icon: category.icon,
            order: category.order,
          },
          charges: [],
        });
      }

      categoryMap.get(category.id).charges.push(charge);
    }

    const groupedAdditionalCharges = Array.from(categoryMap.values()).sort(
      (a, b) => (a.category.order || 0) - (b.category.order || 0)
    );

    // Step 4: Return response
    return res.status(200).json({
      reservation: savedReservation,
      selected_vehicle,
      additional_charges: groupedAdditionalCharges,
    });
  } catch (error) {
    console.log("Error fetching additional charges:", error);

    const statusCode = error?.response?.status || 500;
    const message =
      error?.response?.data?.message ||
      error.message ||
      "Failed to fetch additional charges";

    return res.status(statusCode).json({ message });
  }
});

//@DESC Get Total Price Based on Selected Additional Charges
//@Router POST /car-rental/reservations/additional-charges
//@access Private
const checkAdditionalCharges = asyncHandler(async (req, res) => {
  try {
    const {
      pick_up_date,
      pick_up_location,
      return_location,
      return_date,
      pick_up_time,
      return_time,
      brand_id,
      vehicle_class_id,
      additional_charges,
      isFinal,
      coupon_code,
    } = req.query;
    const params = new URLSearchParams();

    const reservationAttemptId = req.reservationAttemptId;
    console.log(coupon_code);

    params.append("pick_up_date", pick_up_date);
    params.append("pick_up_time", pick_up_time);
    params.append("return_date", return_date);
    params.append("return_time", return_time);
    params.append("pick_up_location", pick_up_location);
    params.append("return_location", return_location);
    params.append("brand_id", brand_id);
    params.append("vehicle_class_id", vehicle_class_id);

    if (coupon_code) {
      params.append("coupon_code", coupon_code);
    }

    console.log(params);

    const normalizedCharges = Array.isArray(additional_charges)
      ? additional_charges
      : typeof additional_charges === "string"
      ? [additional_charges]
      : [];

    normalizedCharges.forEach((charge) => {
      params.append("additional_charges[]", charge);
    });

    const response = await hqApi.post(
      `car-rental/reservations/additional-charges?${params.toString()}`,
      {}
    );
    console.log(response?.data?.data);

    const {
      selected_vehicle_class,
      selected_additional_charges,
      total,
      applicable_discounts,
    } = response?.data?.data || {};

    let savedReservation = null;
    if (reservationAttemptId) {
      savedReservation = await ReservationAttempt.findById(
        reservationAttemptId
      );
      if (!savedReservation) {
        return res
          .status(404)
          .json({ message: "Reservation attempt not found" });
      }

      if (isFinal === "true") {
        console.log("updted");
        savedReservation.selected_additional_charges = normalizedCharges;
        savedReservation.step = 4;
      }
      await savedReservation.save();
    }

    const selected_vehicle = {
      vehicle_class_id: selected_vehicle_class?.vehicle_class_id,
      image: selected_vehicle_class?.vehicle_class?.image,
      features: selected_vehicle_class?.vehicle_class?.features,
      name: selected_vehicle_class?.vehicle_class?.label,
      tot_days: selected_vehicle_class?.price?.total_days,
      base_daily_price:
        selected_vehicle_class?.price?.details[0]?.base_daily_price,
      total_price_without_tax:
        selected_vehicle_class?.price?.details[0]?.total_price,
      total_price_with_tax:
        selected_vehicle_class?.price?.details[0]?.total_price_with_taxes,
      security_deposit: total?.security_deposit,
      total_price_with_mandatory_charges_and_taxes: total?.total_price,
      total_tax: response?.data?.data?.applicable_taxes[0],
    };

    const categoryMap = new Map();

    for (const charge of selected_additional_charges || []) {
      const { additional_charge_category: category } = charge;

      if (!categoryMap.has(category.id)) {
        categoryMap.set(category.id, {
          category: {
            id: category.id,
            label: category.label,
            icon: category.icon,
            order: category.order,
          },
          charges: [],
        });
      }

      categoryMap.get(category.id).charges.push(charge);
    }

    const groupedAdditionalCharges = Array.from(categoryMap.values()).sort(
      (a, b) => (a.category.order || 0) - (b.category.order || 0)
    );

    res.status(200).json({
      selected_additional_charges: groupedAdditionalCharges,
      selected_vehicle,
      reservation: savedReservation,
      selected_additional_charges_arr: normalizedCharges,
      discount: applicable_discounts,
    });
  } catch (error) {
    console.log("Error fetch:", error);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Failed to fetch",
    });
  }
});

//@DESC Conform Reservation
//@ROUTER POST /car-rental/conform-reservation
//@ACCESS Private
const confirmReservation = asyncHandler(async (req, res) => {
  try {
    const reservationAttemptId = req.reservationAttemptId;
    const { couponCode, isRemove } = req.body;
    console.log(isRemove, "remove");
    console.log(reservationAttemptId);

    const reservation = await ReservationAttempt.findById(reservationAttemptId);

    const formattedReservation = {
      pick_up_date: reservation?.pick_up_date,
      return_date: reservation?.return_date,
      pick_up_location: reservation?.pick_up_location.id,
      return_location: reservation?.return_location.id,
      pick_up_time: reservation?.pick_up_time,
      return_time: reservation?.return_time,
      brand_id: reservation?.brand_id,
      vehicle_class_id: Number(reservation?.vehicle_class_id),
      additional_charges: reservation?.selected_additional_charges,
      customer_id: reservation?.customer_id,
      skip_confirmation_email: true,
    };

    console.log("Formatted Reservation:", formattedReservation);

    console.log({
      coupon_code: couponCode,
      ...(isRemove ? { remove_discount: 1 } : { add_discount: 1 }),
    });

    let response;
    if (reservation.reservation_id) {
      response = await hqApi.post(
        `/car-rental/reservations/${reservation?.reservation_id}/update`,
        {
          coupon_code: couponCode,
          ...(isRemove ? { remove_discount: 1 } : { add_discount: 1 }),
        }
      );
    } else {
      response = await hqApi.post(
        "car-rental/reservations/confirm",
        formattedReservation
      );
    }

    if (response?.status == 200) {
      const id = response?.data?.data?.reservation?.id;
      reservation.reservation_id = id;
      reservation.isConformed = true;
      await reservation.save();
      const res = await hqApi.post(`/car-rental/reservations/${id}/pending`);
    }

    res.status(200).json(response?.data);
  } catch (error) {
    console.log("Error confirming reservation:", error);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Failed to confirm reservation",
    });
  }
});

//@DESC Process Payment Transaction
//@Router POST /reservations/process-payment
//@access Private
const processPayment = asyncHandler(async (req, res) => {
  try {
    const { amount, item_id, label, description, external_redirect } =
      req.query;

    const paymentUrl = `/payment-gateways/payment-transactions`;

    const response = await hqApi.post(paymentUrl, {
      amount,
      item_type: "car_rental.reservations",
      item_id,
      payment_method_id: 1,
      label,
      description,
      external_redirect,
    });

    res.status(200).json(response?.data);
  } catch (error) {
    console.log("Error processing payment:", error);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Failed to process payment",
    });
  }
});

//@DESC Get Reservation Details
//@ROUTER GET /car-rental/get-reservation/
//@ACCESS Private
const getReservation = asyncHandler(async (req, res) => {
  try {
    const reservationAttemptId = req.reservationAttemptId;
    const reservation = await ReservationAttempt.findById(reservationAttemptId);
    const id = reservation?.reservation_id;
    const response = await hqApi.get(`/car-rental/reservations/${id}`);

    const responseAgrrement = await hqApi.get(
      `/car-rental/reservations/${id}/rental-agreement`
    );

    res
      .status(response?.status || 200)
      .json({ ...response?.data, rental_agreement: responseAgrrement?.data });
  } catch (error) {
    console.log("Error fetching reservation details:", error);
    res.status(error.response?.status || 500).json({
      message:
        error.response?.data?.message || "Failed to fetch reservation details",
    });
  }
});

const getReservationById = asyncHandler(async (req, res) => {
  try {
    const { id: reservationAttemptId } = req.params;
    const reservation = await ReservationAttempt.findById(reservationAttemptId);
    const id = reservation?.reservation_id;

    const response = await hqApi.get(`/car-rental/reservations/${id}`);

    const responseAgrrement = await hqApi.get(
      `/car-rental/reservations/${id}/rental-agreement`
    );

    res.status(200).json({
      ...response?.data,
      rental_agreement: responseAgrrement?.data,
      reservation_attempt: reservation,
    });
  } catch (error) {
    console.log("Error fetching reservation:", error);
    res.status(error.response?.status || 500).json({
      message: "Failed to fetch reservation",
    });
  }
});
// @DESC   Get a Reservation Attempt by ID
// @ROUTE  GET /car-rental/reservations/reservation-attempts
// @ACCESS Private
const getReservationAttempt = asyncHandler(async (req, res) => {
  const reservationAttemptId = req.reservationAttemptId;

  try {
    if (!reservationAttemptId) {
      return res
        .status(400)
        .json({ message: "Reservation attempt ID is required" });
    }

    const reservation = await ReservationAttempt.findById(reservationAttemptId);
    if (!reservation) {
      return res.status(404).json({ message: "Reservation attempt not found" });
    }

    let vehicleDetails = null;
    if (reservation.vehicle_class_id) {
      const id = Number(reservation.vehicle_class_id);
      const { data } = await hqApi.get(
        `fleets/vehicle-classes/${id}`
      );
      const resData = data?.fleets_vehicle_class;

      if (resData) {
        vehicleDetails = {
          id: resData.id,
          name: resData.name,
          brand: {
            id: resData.brand?.id,
            name: resData.brand?.name,
            public_links: {
              reservations: resData.brand?.public_reservations_link_first_step,
              packages: resData.brand?.public_packages_link_first_step,
            },
          },
          image: resData.images?.[0]?.public_link || resData.public_image_link,
          features:resData.features,
          daily_rate: parseFloat(resData.active_rates?.[0]?.daily_rate || 0),
          available_on_website: resData.available_on_website,
          active: resData.active,
          created_at: resData.created_at,
          updated_at: resData.updated_at,
          public_image_link: resData.public_image_link,
        };
      }
    }

    return res.status(200).json({
      ...reservation.toObject(),
      selectedVehicle: vehicleDetails,
    });
  } catch (error) {
    console.error("Error fetching reservation attempt:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching reservation attempt",
    });
  }
});

const getFirstMissingFieldMessage = (fields) => {
  const orderedFields = [
    { key: "pick_up_location", label: "Pick-up location" },
    { key: "return_location", label: "Return location" },
    { key: "pick_up_date", label: "Pick-up date and Pick-up time" },
    { key: "return_date", label: "Return date and Return time" },
  ];

  for (const field of orderedFields) {
    if (!fields[field.key]) {
      return `Missing required: ${field.label}`;
    }
  }

  return null;
};

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

module.exports = {
  validateDatesAndListVehicleClasses,
  getAdditionalCharges,
  checkAdditionalCharges,
  getReservationAttempt,
  getReservation,
  confirmReservation,
  processPayment,
  getReservationById,
};
