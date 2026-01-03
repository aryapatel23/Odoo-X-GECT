const { getDB } = require("../../config/db");
const { ObjectId } = require("mongodb");
const transporter = require("../mail/mailtransporter");

// POST /apply-leave
const applyLeave = async (req, res) => {
  try {
    const db = getDB();
    // Support both req.body (from guide) and req.user (from token)
    let { user_id, user_name, leaveType, startDate, endDate, reason } = req.body;

    // Fallback to token data if not in body
    if (!user_id && req.user) user_id = req.user.user_id;
    if (!user_name && req.user) user_name = req.user.username;

    if (!user_id || !leaveType || !startDate || !endDate) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // Date Validation
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (start < today) {
      return res.status(400).json({ message: "Cannot apply for leave in the past." });
    }

    if (end < start) {
      return res.status(400).json({ message: "End date cannot be before start date." });
    }

    const leaveRequest = {
      user_id,
      user_name: user_name || "Employee",
      leaveType, // 'Paid', 'Sick', 'Unpaid'
      startDate: start,
      endDate: end,
      reason,
      status: "Pending", // Pending, Approved, Rejected
      appliedAt: new Date(),
    };

    const result = await db.collection("LeaveRequests").insertOne(leaveRequest);
    console.log("✅ Leave Applied:", result.insertedId);
    res.status(201).json({ message: "Leave application submitted successfully", id: result.insertedId });
  } catch (error) {
    console.error("❌ Error applying for leave:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET /my-leaves/:userId
const getLeaveHistory = async (req, res) => {
  try {
    const db = getDB();
    const { userId } = req.params;
    const leaves = await db.collection("LeaveRequests")
      .find({ user_id: userId })
      .sort({ appliedAt: -1 })
      .toArray();
    res.status(200).json(leaves);
  } catch (error) {
    console.error("❌ Error fetching history:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// GET /all-leaves (Admin)
const getAllLeaves = async (req, res) => {
  try {
    const db = getDB();
    const leaves = await db.collection("LeaveRequests").find({}).sort({ appliedAt: -1 }).toArray();
    res.status(200).json(leaves);
  } catch (error) {
    console.error("❌ Error fetching all leaves:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// PUT /update-leave-status (Admin)
const updateLeaveStatus = async (req, res) => {
  try {
    const db = getDB();
    const { id, status, adminComment } = req.body;

    if (!id || !["Approved", "Rejected"].includes(status)) {
      return res.status(400).json({ message: "Invalid Request" });
    }

    const result = await db.collection("LeaveRequests").updateOne(
      { _id: new ObjectId(id) },
      { $set: { status, adminComment, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) return res.status(404).json({ message: "Not found" });

    // Email Notification
    const leave = await db.collection("LeaveRequests").findOne({ _id: new ObjectId(id) });
    if (leave) {
      // Find user email if possible (by user_id)
      const user = await db.collection("users").findOne({ user_id: leave.user_id });
      if (user && user.email) {
        const isApproved = status === "Approved";
        const statusColor = isApproved ? "#10b981" : "#ef4444";
        const statusBg = isApproved ? "#ecfdf5" : "#fef2f2";

        const htmlContent = `
          <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; overflow: hidden; color: #1e293b;">
            <div style="background-color: #4f46e5; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 24px;">Circle Soft OdooX</h1>
              <p style="color: #e0e7ff; margin: 4px 0 0 0; font-size: 14px;">Human Resources Management</p>
            </div>
            <div style="padding: 32px; background-color: #ffffff;">
              <div style="text-align: center; margin-bottom: 24px;">
                <div style="display: inline-block; padding: 8px 16px; background-color: ${statusBg}; color: ${statusColor}; border-radius: 9999px; font-weight: bold; font-size: 14px; text-transform: uppercase; border: 1px solid ${statusColor}40;">
                  ${status}
                </div>
              </div>
              
              <p style="font-size: 16px; line-height: 1.6; margin-bottom: 24px;">
                Hello <strong>${user.username}</strong>,<br><br>
                Your leave request has been reviewed by the HR team and it has been <strong>${status.toLowerCase()}</strong>.
              </p>
              
              <div style="background-color: #f8fafc; border-radius: 8px; padding: 20px; margin-bottom: 24px; border-left: 4px solid #4f46e5;">
                <h3 style="margin: 0 0 12px 0; font-size: 14px; color: #64748b; text-transform: uppercase;">Leave Details</h3>
                <table style="width: 100%; font-size: 14px; border-collapse: collapse;">
                  <tr>
                    <td style="padding: 4px 0; color: #64748b; width: 120px;">Type:</td>
                    <td style="padding: 4px 0; font-weight: 600;">${leave.leaveType}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Duration:</td>
                    <td style="padding: 4px 0; font-weight: 600;">${new Date(leave.startDate).toLocaleDateString()} to ${new Date(leave.endDate).toLocaleDateString()}</td>
                  </tr>
                  <tr>
                    <td style="padding: 4px 0; color: #64748b;">Your Reason:</td>
                    <td style="padding: 4px 0; font-style: italic;">"${leave.reason || "N/A"}"</td>
                  </tr>
                </table>
              </div>

              ${adminComment ? `
              <div style="background-color: ${statusBg}; border-radius: 8px; padding: 16px; margin-bottom: 24px; border: 1px dashed ${statusColor}80;">
                <h4 style="margin: 0 0 8px 0; font-size: 13px; color: ${statusColor}; text-transform: uppercase;">HR Feedback</h4>
                <p style="margin: 0; font-size: 14px; line-height: 1.5;">${adminComment}</p>
              </div>
              ` : ''}
              
              <p style="font-size: 14px; color: #64748b; margin-top: 32px; text-align: center;">
                If you have any questions regarding this decision, please contact the HR department.
              </p>
            </div>
            <div style="background-color: #f1f5f9; padding: 20px; text-align: center; border-t: 1px solid #e2e8f0;">
              <p style="margin: 0; font-size: 12px; color: #94a3b8;">&copy; ${new Date().getFullYear()} Circle Soft OdooX. All rights reserved.</p>
            </div>
          </div>
        `;

        await transporter.sendMail({
          from: `"HR System" <${process.env.SMTP_EMAIL}>`,
          to: user.email,
          subject: `Leave Request Update: ${status}`,
          html: htmlContent
        });
      }
    }

    res.status(200).json({ message: `Leave request ${status}` });
  } catch (error) {
    console.error("❌ Error updating status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete Route (Extra, kept for convenience)
const deleteLeave = async (req, res) => {
  try {
    const db = getDB();
    const { id } = req.params;
    await db.collection("LeaveRequests").deleteOne({ _id: new ObjectId(id) });
    res.status(200).json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
};

const updateLeave = async (req, res) => {
  // Basic update logic matching new structure
  try {
    const db = getDB();
    const { id } = req.params;
    const { startDate, endDate, reason, leaveType } = req.body;
    await db.collection("LeaveRequests").updateOne(
      { _id: new ObjectId(id) },
      { $set: { startDate: new Date(startDate), endDate: new Date(endDate), reason, leaveType } }
    );
    res.status(200).json({ message: "Updated" });
  } catch (error) {
    res.status(500).json({ message: "Error" });
  }
}


module.exports = {
  applyLeave,
  getLeaveHistory,
  getAllLeaves,
  updateLeaveStatus,
  deleteLeave,
  updateLeave
};
