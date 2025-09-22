require("dotenv").config();

const fleetsRoute = require("./routes/Fleets.Route");
const reservationRoute = require("./routes/Reservation.Route");
const CustomerRoute = require("./routes/Customer.Route");
const FileRoute = require("./routes/File.Route");

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./db/config");

connectDB();
const app = express();

const allowedOrigins = [
  "http://localhost:3000",
  "https://staging-causewaymy.vercel.app",
  "https://apistaging-causewaymy.vercel.app"
];
app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cors({
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true
}));
app.use((err, req, res, next) => {
  console.error("Global error handler:", err);

  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Credentials", "true");

  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});


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
