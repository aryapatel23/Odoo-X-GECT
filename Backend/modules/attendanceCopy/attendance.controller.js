const { getDB } = require("../../config/db");

// ✅ GET /attendance/:userId
exports.getTodayAttendance = async (req, res) => {
  const db = getDB();
  const id = req.params.userId;
  const nowIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
  const today = nowIST.toISOString().split("T")[0];

  try {
    // Find attendance for today
    // We check user_id field which is usually the string identifier
    const data = await db.collection("Attendance").findOne({
      $or: [{ user_id: id }, { id: id }],
      date: today
    });

    if (!data) {
      return res.status(200).json({ status: "Absent" });
    }
    return res.status(200).json({ status: data.status, checkOutTime: data.checkOutTime });
  } catch (err) {
    console.error("❌ Error:", err);
    res.status(500).json({ error: "DB error" });
  }
};

// ✅ POST /mark-attendance
exports.markAttendance = async (req, res) => {
  try {
    const db = getDB();
    // type: "check-in" or "check-out"
    // descriptor: Face descriptor array (required for check-in)
    const { username, location, id, type, descriptor } = req.body;
    console.log(`📥 Request: ${type} for ${username}`);

    // 1. Find user
    let userFilter = {
      $or: [
        { user_id: id },
        { id: id },
        { _id: id }
      ]
    };

    let user = await db.collection("users").findOne(userFilter);

    // Fallback for ObjectId
    if (!user && id && id.length === 24) {
      const { ObjectId } = require('mongodb');
      user = await db.collection("users").findOne({ _id: new ObjectId(id) });
    }

    if (!user) return res.status(404).json({ message: "❌ User not found" });

    // 2. Check location (Geofence)
    const office = { lat: 23.0457, lng: 72.5647 };
    const distance = (loc1, loc2) => {
      const R = 6371;
      const toRad = deg => (deg * Math.PI) / 180;
      const dLat = toRad(loc1.lat - loc2.lat);
      const dLon = toRad(loc1.lng - loc2.lng);
      const a =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(toRad(loc1.lat)) *
        Math.cos(toRad(loc2.lat)) *
        Math.sin(dLon / 2) ** 2;
      return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    };

    const dist = distance(location, office);
    console.log(`📍 USER LOCATION: lat: ${location.lat}, lng: ${location.lng}`);
    console.log(`🏢 OFFICE LOCATION: lat: ${office.lat}, lng: ${office.lng}`);
    console.log("📏 Distance calculated:", dist.toFixed(4), "km");

    if (dist > 3) {
      console.log(`⛔ Geofence Failure: User is ${dist.toFixed(4)}km away.`);
      return res.status(403).json({
        message: `⛔ Not at office location! You are ${dist.toFixed(2)}km away. Your location: ${location.lat.toFixed(4)}, ${location.lng.toFixed(4)}`
      });
    }

    // 3. Get IST time
    const utcNow = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istNow = new Date(utcNow.getTime() + istOffset);
    const dateStr = istNow.toISOString().split("T")[0];

    // Check if attendance exists for today
    const existingAttendance = await db.collection("Attendance").findOne({
      user_id: id,
      date: dateStr
    });

    if (type === "check-in") {
      if (existingAttendance) {
        return res.status(400).json({ message: "⚠️ You have already checked in today!" });
      }

      // FACE VERIFICATION BYPASSED AS REQUESTED


      // Time Validations
      const hours = istNow.getUTCHours();
      const minutes = istNow.getUTCMinutes();
      const totalMinutes = hours * 60 + minutes;

      // Status logic
      let status = "Late Absent";
      if (totalMinutes <= 615) { // Before 10:15 AM
        status = "Present";
      } else if (totalMinutes <= 645) { // Before 10:45 AM
        status = "Late";
      }

      await db.collection("Attendance").insertOne({
        user_id: id,
        username,
        location,
        checkInTime: istNow,
        checkOutTime: null,
        date: dateStr,
        status,
        time: istNow // Keep for backward compat sorting
      });

      return res.json({ message: `✅ Checked In as '${status}'` });

    } else if (type === "check-out") {
      if (!existingAttendance) {
        return res.status(400).json({ message: "⚠️ You have not checked in yet!" });
      }
      if (existingAttendance.checkOutTime) {
        return res.status(400).json({ message: "⚠️ You have already checked out!" });
      }

      await db.collection("Attendance").updateOne(
        { _id: existingAttendance._id },
        { $set: { checkOutTime: istNow } }
      );

      return res.json({ message: "👋 Checked Out Successfully" });

    } else {
      return res.status(400).json({ message: "Invalid type" });
    }

  } catch (error) {
    console.error("❌ Error in markAttendance:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// ✅ GET /all-attendance
exports.getAllAttendance = async (req, res) => {
  try {
    const db = getDB();
    const nowIST = new Date(new Date().getTime() + 5.5 * 60 * 60 * 1000);
    const today = nowIST.toISOString().split("T")[0]; // "2025-06-15"
    console.log("Today's date:", today);
    const todayDate = new Date(today); // midnight
    const tomorrowDate = new Date(today);

    tomorrowDate.setDate(todayDate.getDate() + 1); // next day;
    console.log("Tomorrow's date:", tomorrowDate);
    const attendance = await db
      .collection("Attendance")
      .find({
        date: {
          $gte: today, // greater than or equal to today
          $lt: tomorrowDate.toISOString().split("T")[0], // less than tomorrow
        },
      })
      .sort({ time: -1 })
      .toArray();

    res.status(200).json({ attendance });
  } catch (error) {
    res.status(500).json({ message: 'Error fetching attendance in db', error });
  }
};

exports.getAllAttendanceByMonthofuser = async (req, res) => {
  const db = getDB();
  const { userId, month } = req.params;

  const startDate = `${month}-01`; // e.g., 2025-06-01
  console.log("Start date:", startDate);
  const endDate = new Date(`${month}-01`);

  endDate.setMonth(endDate.getMonth() + 1);
  console.log("End date before increment:", endDate);
  const endStr = endDate.toISOString().split("T")[0]; // e.g., 2025-07-01

  try {
    const attendance = await db.collection("Attendance").find({
      user_id: userId,
      date: {
        $gte: startDate,
        $lt: endStr
      }
    }).toArray();

    res.json(attendance);
  } catch (err) {
    console.error("❌ Error fetching attendance:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
}

//  POST /register-face
exports.registerFace = async (req, res) => {
  try {
    const db = getDB();
    const { user_id, descriptor } = req.body;
    console.log("📥 RegisterFace: ID =", user_id, "| Descriptor type =", typeof descriptor, "| Length =", descriptor?.length);

    if (!user_id || !descriptor || !Array.isArray(descriptor)) {
      console.log("❌ Validation Failed: user_id or descriptor array missing");
      return res.status(400).json({ message: 'MISSING_DATA: User ID and Descriptor Array required' });
    }

    const result = await db.collection('users').updateOne(
      {
        $or: [
          { user_id: user_id },
          { id: user_id }, // Just in case it's named 'id'
          { _id: user_id }
        ]
      },
      { $set: { faceDescriptor: descriptor } }
    );

    if (result.matchedCount === 0) {
      // If still not found, try ObjectId if user_id looks like one
      if (user_id.length === 24) {
        const { ObjectId } = require('mongodb');
        const finalResult = await db.collection('users').updateOne(
          { _id: new ObjectId(user_id) },
          { $set: { faceDescriptor: descriptor } }
        );
        if (finalResult.matchedCount > 0) {
          return res.json({ message: ' Face ID registered successfully (via ObjectId)!' });
        }
      }
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: ' Face ID registered successfully!' });
  } catch (error) {
    console.error('Error registering face:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};
