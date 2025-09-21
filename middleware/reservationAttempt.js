const reservationAttempt = (req, res, next) => {
  // const reservationAttemptCookieId  = req.cookies.ssid

  // if(reservationAttemptCookieId) {
  //   console.log("coookiue")
  //   req.reservationAttemptId = reservationAttemptCookieId;
  // }
  // else{
  //   console.log("local")
  //   const reservationAttemptLocalId = req.headers["reservation-attempt-id"]
  //   req.reservationAttemptId = reservationAttemptLocalId;
  // }
  
  const reservationAttemptLocalId = req.headers["reservation-attempt-id"];
  req.reservationAttemptId = reservationAttemptLocalId;

  next();
};

module.exports = { reservationAttempt };
