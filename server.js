require("dotenv").config();

const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const connectDB = require("./db/config");

const fleetsRoute = require("./routes/Fleets.Route");
const reservationRoute = require("./routes/Reservation.Route");
const manageReservationRoute = require("./routes/ManageReservation.Route");
const CustomerRoute = require("./routes/Customer.Route");
const FileRoute = require("./routes/File.Route");
const AuthRoute = require("./routes/Auth.Route");
const EmailRoute = require("./routes/Email.Route");

connectDB();

const app = express();

app.use(cookieParser());
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const allowedOrigins = [
  "http://localhost:3000",
  "https://staging-causewaymy.vercel.app",
  "https://causeway.my",
  "https://www.causeway.my",
];

app.use(
  cors({
    origin: function (origin, callback) {
      if (!origin) return callback(null, true);

      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    // allowedHeaders: [
    //   "Content-Type",
    //   "Authorization",
    //   "x-access-token",
    //   "X-Requested-With",
    // ],
    // methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  })
);

app.get("/", (req, res) => {
  res.send("✅ Causeway API is working!");
});

app.get("/api/version", (req, res) => {
  res.json(require("./version.json"));
});

app.use("/api/fleets", fleetsRoute);
app.use("/api/customers", CustomerRoute);
app.use("/api/file", FileRoute);
app.use("/api/auth", AuthRoute);
app.use("/api/email", EmailRoute);
app.use("/api/car-rental/reservations", reservationRoute);
app.use("/api/car-rental/manage-reservations", manageReservationRoute);


app.use((err, req, res, next) => {
  console.error("Global error handler:", err.message);
  res.status(err.status || 500).json({
    message: err.message || "Internal Server Error",
  });
});

const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`🚀 Server running on port ${port}`);
});
