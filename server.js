require("dotenv").config();

const fleetsRoute = require("./routes/FleetsRoute");
const reservationRoute = require("./routes/ReservationRoute");
const CustomerRoute = require("./routes/CustomerRoute");
const FileRoute = require("./routes/FileRoute");

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB  = require("./db/config");

connectDB();
const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://staging-causewaymy.vercel.app",
];
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(
  cors({
    credentials: true,
    origin: (origin, callback) => {
      if (allowedOrigins.includes(origin) || !origin) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS"));
      }
    },
  })
);
app.options("*", cors());

// Routers
app.get("/", (req, res) => {
  res.send("Hello, Causeway API is working!");
});
app.get("/api/version", (req, res) => {
  res.json(require("./version.json"));
});
app.use("/api/fleets", fleetsRoute);
app.use("/api/car-rental", reservationRoute);
app.use("/api/customers", CustomerRoute);
app.use("/api/file", FileRoute);

const port = process.env.PORT || 5000;

app.listen(port, () => {
  const token = process.env.ENCODE_TOKEN;
  console.log("Server listen", port);
});
