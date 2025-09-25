const asyncHandler = require("express-async-handler");
const hqApi = require("../hq/hqApi");
const NodeCache = require("node-cache");

const cache = new NodeCache({ stdTTL: 86400 }); 

//@DESC Get All Vehicle Classes
//@Route GET /api/fleets/vehicle-classes
//@access Private
const getAllVehicalesClasses = asyncHandler(async (req, res) => {
  try {
    const response = await hqApi.get("fleets/vehicle-classes");
    const vehicleClasses = response?.data?.fleets_vehicle_classes || [];

    const filteredVehicleClasses = vehicleClasses.map((vehicle) => ({
      id: vehicle.id,
      name: vehicle.name,
      uuid: vehicle.uuid,
      public_image_link: vehicle.public_image_link,
      brand: vehicle.brand,
      features: vehicle.features,
      active_rates: vehicle.active_rates,
      images: vehicle?.images,
    }));

    res.status(200).json(filteredVehicleClasses);
  } catch (error) {
    console.log("Error fetching vehicle class:", error);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Failed to fetch vehicle class",
    });
  }
});

//@DESC Get All Vehicle Types
//@Router GET /api/fleets/vehicle-types
//@access Private
const getAllVehicleTypes = asyncHandler(async (req, res) => {
  try {
    const cacheKey = "vehicle_types";
    const cached = cache.get(cacheKey);

    if (cached) {
      console.log("Serving vehicle types from cache");
      return res.status(200).json(cached);
    }

    const response = await hqApi.get("fleets/vehicle-types");

    const activeVehicleTypes = response.data.fleets_vehicle_types?.filter(
      (type) => type.active === true
    );

    cache.set(cacheKey, activeVehicleTypes); 
    console.log("Vehicle types cached");

    res.status(200).json(activeVehicleTypes);
  } catch (error) {
    console.log("Error fetching vehicle types:", error);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Failed to fetch vehicle types",
    });
  }
});

//@DESC Get All Location
//@Router GET /api/fleets/locations
//@access Private
const getAllLocation = asyncHandler(async (req, res) => {
  try {
    const cacheKey = "locations";
    const cached = cache.get(cacheKey);

    if (cached) {
      console.log("Serving locations from cache");
      return res.status(200).json(cached);
    }

    const response = await hqApi.get("fleets/locations");
    cache.set(cacheKey, response.data.fleets_locations); 
    console.log("Locations cached");

    res.status(200).json(response.data.fleets_locations);
  } catch (error) {
    console.log("Error fetching  location :", error);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Failed to fetch location",
    });
  }
});

//@DESC Get All Unique Brands from Locations
//@Route GET /api/fleets/location-brands
//@Access Private
const getAllBrands = asyncHandler(async (req, res) => {
  try {
    const cacheKey = "brands";
    const cached = cache.get(cacheKey);

    if (cached) {
      console.log("Serving brands from cache");
      return res.status(200).json(cached);
    }

    const response = await hqApi.get("fleets/locations");
    const locations = response.data.fleets_locations;

    const brandMap = new Map();

    locations.forEach((location) => {
      if (location.brand && !brandMap.has(location.brand.id)) {
        brandMap.set(location.brand.id, location.brand);
      }
    });

    const uniqueBrands = Array.from(brandMap.values());

    cache.set(cacheKey, uniqueBrands); 
    console.log("Brands cached");

    res.status(200).json(uniqueBrands);
  } catch (error) {
    console.log("Error fetching brands from locations:", error);
    res.status(error.response?.status || 500).json({
      message: error.response?.data?.message || "Failed to fetch brands",
    });
  }
});

// @DESC   Get All Available Vehicles with Pricing (Ultra Optimized)
// @ROUTE  GET /api/fleets/vehicles/:id
// @ACCESS Private
const getAllVehicles = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const cacheKey = `vehicles_${id}`;

    const cachedData = cache.get(cacheKey);
    if (cachedData) {
      console.log("Serving from cache:", cacheKey);
      return res.status(200).json(cachedData);
    }

    const dates = getOptimizedDates();

    const [vehiclesResponse, vehicleClassRes, reservationResponse] =
      await Promise.all([
        hqApi.get("fleets/vehicles/", {
          params: { brand_id: 1 },
          timeout: 5000,
        }),
        hqApi.get("fleets/vehicle-classes", { timeout: 5000 }),
        hqApi.post(
          "car-rental/reservations/dates",
          {
            ...dates,
            pick_up_location: 1,
            return_location: 1,
            brand_id: 1,
          },
          { timeout: 5000 }
        ),
      ]);

    const vehicles = vehiclesResponse?.data?.data;
    const vehicleClasses = vehicleClassRes?.data?.fleets_vehicle_classes;
    const applicableClasses =
      reservationResponse?.data?.data?.applicable_classes;

    if (!vehicles?.length) return res.status(200).json([]);

    const { priceMap, classMap } = createLookupMaps(
      applicableClasses,
      vehicleClasses
    );
    const processedVehicles = processVehiclesOptimized(
      vehicles,
      priceMap,
      classMap
    );
    const filteredVehicles = processedVehicles.filter(
      (vehicle) => vehicle?.vehicle_type?.id === parseInt(id)
    );

    if (!filteredVehicles.length) {
      return res
        .status(404)
        .json({ message: "No vehicles found for the given vehicle type ID" });
    }

    const result = fastShuffleByBrand(filteredVehicles);

    cache.set(cacheKey, result);
    console.log("Data cached:", cacheKey);

    return res.status(200).json(result);
  } catch (error) {
    console.log("Error fetching vehicles:", error.message);
    res
      .status(error.response?.status || 500)
      .json({ message: "Failed to fetch vehicles" });
  }
});

const getOptimizedDates = () => {
  const now = Date.now();
  const tomorrow = new Date(now + 24 * 60 * 60 * 1000);
  const dayAfter = new Date(now + 48 * 60 * 60 * 1000);

  return {
    pick_up_date: formatDateFast(tomorrow),
    pick_up_time: "10:30",
    return_date: formatDateFast(dayAfter),
    return_time: "10:30",
  };
};

const formatDateFast = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const createLookupMaps = (applicableClasses, vehicleClasses) => {
  const priceMap = new Map();
  const classMap = new Map();

  if (applicableClasses) {
    for (const classData of applicableClasses) {
      priceMap.set(
        classData.vehicle_class_id,
        classData.price?.details?.[0]?.base_daily_price || "N/A"
      );
    }
  }

  if (vehicleClasses) {
    for (const vc of vehicleClasses) {
      classMap.set(vc.id, vc.features);
    }
  }

  return { priceMap, classMap };
};

const processVehiclesOptimized = (vehicles, priceMap, classMap) => {
  const seenCombinations = new Set();
  const result = [];

  for (const vehicle of vehicles) {
    if (vehicle?.vehicle_class?.brand_id !== 1) continue;

    const brandId = vehicle?.vehicle_model?.vehicle_brand?.id;
    const classId = vehicle?.vehicle_class?.id;

    if (!brandId || !classId) continue;

    const combination = `${brandId}-${classId}`;
    if (seenCombinations.has(combination)) continue;
    seenCombinations.add(combination);

    result.push({
      id: vehicle.id,
      vehicle_brand: vehicle.vehicle_model?.vehicle_brand || "",
      vehicle_class: {
        id: classId,
        name: vehicle.vehicle_class?.name,
        public_image: vehicle.vehicle_class?.public_image_link,
        images: vehicle.vehicle_class?.images,
        brand_id: vehicle.vehicle_class?.brand_id,
      },
      vehicle_type: vehicle.vehicle_type,
      vehicle_name: vehicle.label,
      price: priceMap.get(classId) || "N/A",
      features: classMap.get(classId) || [],
    });
  }

  return result;
};

const fastShuffleByBrand = (vehicles) => {
  if (vehicles.length <= 1) return vehicles;

  const brandGroups = {};
  for (const vehicle of vehicles) {
    const brandId = vehicle.vehicle_brand?.id;
    if (!brandGroups[brandId]) {
      brandGroups[brandId] = [];
    }
    brandGroups[brandId].push(vehicle);
  }

  Object.values(brandGroups).forEach(shuffleInPlace);

  const result = [];
  const brandIds = Object.keys(brandGroups);
  let lastBrandIndex = -1;

  while (result.length < vehicles.length) {
    let selectedBrandId = null;

    for (let i = 0; i < brandIds.length; i++) {
      const brandId = brandIds[i];
      if (brandGroups[brandId].length > 0 && i !== lastBrandIndex) {
        selectedBrandId = brandId;
        lastBrandIndex = i;
        break;
      }
    }

    if (!selectedBrandId) {
      for (const brandId of brandIds) {
        if (brandGroups[brandId].length > 0) {
          selectedBrandId = brandId;
          break;
        }
      }
    }

    if (!selectedBrandId) break;

    result.push(brandGroups[selectedBrandId].pop());
  }

  return result;
};

const shuffleInPlace = (array) => {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    if (i !== j) {
      [array[i], array[j]] = [array[j], array[i]];
    }
  }
};

module.exports = {
  getAllVehicleTypes,
  getAllVehicalesClasses,
  getAllLocation,
  getAllBrands,
  getAllVehicles,
};
