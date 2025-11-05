const MS_PER_DAY = 1000 * 60 * 60 * 24;

function parseDateOnlyToUTC(dateLike) {
  if (dateLike instanceof Date) {
    return new Date(
      Date.UTC(dateLike.getFullYear(), dateLike.getMonth(), dateLike.getDate())
    );
  }

  const s = String(dateLike).split("T")[0];
  const [y, m, d] = s.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

function formatLocalDate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const getRebookedDates = (prevPickup, prevReturn) => {
  const prevPickupUTC = parseDateOnlyToUTC(prevPickup);
  const prevReturnUTC = parseDateOnlyToUTC(prevReturn);

  // compute duration in whole days (UTC to avoid timezone issues)
  const diffMs = prevReturnUTC - prevPickupUTC;
  const rawDays = diffMs / MS_PER_DAY;
  const durationDays = Math.max(Math.round(rawDays), 1);

  // create local "tomorrow" (using local Y/M/D so it's the user's tomorrow)
  const todayLocal = new Date();
  const pickupLocal = new Date(
    todayLocal.getFullYear(),
    todayLocal.getMonth(),
    todayLocal.getDate() + 1
  );

  // returnLocal = pickupLocal + durationDays
  const returnLocal = new Date(
    pickupLocal.getFullYear(),
    pickupLocal.getMonth(),
    pickupLocal.getDate() + durationDays
  );

  return {
    pickupDate: formatLocalDate(pickupLocal),
    returnDate: formatLocalDate(returnLocal),
    durationDays,
  };
};

module.exports = getRebookedDates;
