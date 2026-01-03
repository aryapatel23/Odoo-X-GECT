const { getDB } = require('../../config/db');
const { ObjectId } = require('mongodb');
const jwt = require("jsonwebtoken");
const transporter = require("../mail/mailtransporter");

const getProfile = async (req, res) => {
  const db = getDB();

  if (!req.user || !req.user.userId)
    return res.status(400).json({ message: 'Invalid user' });

  const user = await db.collection('users').findOne(
    { _id: new ObjectId(req.user.user_id) },
    { projection: { password: 0 } }
  );

  if (!user) return res.status(404).json({ message: 'User not found' });

  res.json({ user });
};

const updateProfile = async (req, res) => {
  const db = getDB();
  const { userId } = req.params;
  if (!userId) return res.status(400).json({ message: 'Invalid user' });

  const {
    username,
    email,
    mobile,
    address,
    bankAccount,
    gender,
    IFSC,
    emergencyContact,
    emergencyContactname,
  } = req.body;
  // Dynamically construct update fields
  const updateFields = {};

  if (username !== undefined) updateFields.username = username;
  if (email !== undefined) updateFields.email = email;
  if (mobile !== undefined) updateFields.mobile = mobile;
  if (address !== undefined) updateFields.address = address;
  if (bankAccount !== undefined) updateFields.bankAccount = bankAccount;
  if (gender !== undefined) updateFields.gender = gender;
  if (IFSC !== undefined) updateFields.IFSC = IFSC;
  if (emergencyContact !== undefined) updateFields.emergencyContact = emergencyContact;
  if (emergencyContactname !== undefined) updateFields.emergencyContactname = emergencyContactname;

  try {
    if (Object.keys(updateFields).length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    const result = await db.collection('users').updateOne(
      { user_id: userId },
      { $set: updateFields }
    );
    if (result.modifiedCount === 0) {
      return res.status(404).json({ message: 'User not found or no changes made' });
    }

    res.json({ message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
};

const addUser = async (req, res) => {
  try {
    const db = getDB();
    const {
      name,
      gender,
      id,
      joigningDate,
      designation,
      address,
      bankAccount,
      mobile,
      email,
      role,
      salary,
      employmentType,
      attendanceType,
      emergencyContact,
      emergencyContactname,
      IFSC,
    } = req.body;

    // ✅ Required Fields Check
    if (!name || !id || !email || !role) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    // ✅ Check for duplicate email or ID
    const existingUser = await db.collection("users").findOne({
      $or: [{ email }, { user_id: id }],
    });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // ✅ Generate token for setting password (valid for 1 hour)
    const token = jwt.sign({ email }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    // ✅ Insert user with null password initially
    const result = await db.collection("users").insertOne({
      username: name,
      user_id: id,
      gender,
      joigningDate,
      designation,
      address,
      bankAccount,
      mobile,
      email,
      role,
      salary,
      employmentType,
      attendanceType,
      emergencyContact,
      emergencyContactname,
      IFSC,
      password: null,
      passwordSetToken: token,
      tokenExpiry: new Date(new Date().getTime() + 6.5 * 60 * 60 * 1000), // 6.5 hours
    });

    // ✅ Send welcome mail
    const setPasswordLink = `${process.env.FRONTEND_URL}/${id}/set-password?token=${token}`;

    await transporter.sendMail({
      from: `"Payroll App" <${process.env.SMTP_EMAIL}>`,
      to: email,
      subject: "Welcome to the Team – Set Your Password",
      html: `
        <p>Hello <strong>${name}</strong>,</p>
        <p>Your HR has created an account for you in the Payroll system.</p>
        <p>Click the link below to set your password (valid for 1 hour):</p>
        <a href="${setPasswordLink}">${setPasswordLink}</a>
        <p>Please review your details below:</p>
        <ul>
          <li><strong>User ID:</strong> ${id}</li>
          <li><strong>Name:</strong> ${name}</li>
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Phone:</strong> ${mobile}</li>
          <li><strong>Designation:</strong> ${designation}</li>
          <li><strong>Salary:</strong> ${salary}</li>
          <li><strong>Bank Account:</strong> ${bankAccount}</li>
          <li><strong>IFSC:</strong> ${IFSC}</li>
          <li><strong>Employment Type:</strong> ${employmentType}</li>
          <li><strong>Attendance Type:</strong> ${attendanceType}</li>
          <li><strong>Emergency Contact:</strong> ${emergencyContact}</li>
          <li><strong>Emergency Contact Name:</strong> ${emergencyContactname}</li>
          <li><strong>Joining Date:</strong> ${joigningDate}</li>
        </ul>
        <br /><br />
        <p>If any of these details are incorrect, please contact the HR team at ${process.env.HR_EMAIL}</p>
        <p>Thank you!</p>
        <p>Best regards,</p>
      `,
    });

    // ✅ Final Response
    res.status(201).json({
      message: "User created & welcome email sent.",
      userId: result.insertedId,
    });
  } catch (error) {
  console.error("❌ Error adding user:", error); // <- This will log the exact problem
  res.status(500).json({ message: "Internal Server Error", error: error.message });
  }
};

const alluser = async (req,res)=>{
  const db = getDB();
  try{
    const users = await db.collection('users').find().project({ password: 0 }).toArray();
    if (!users || users.length === 0) {
      return res.status(404).json({ message: 'No users found' });
    }
    res.status(200).json({message:"User fetched sucessfully", users});
    

  }catch(error){
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}

const userByitsId = async (req,res)=>{
  const db=getDB();

  const {userid}=req.params;
  console.log("id recieved is",req.params);
  try{
    const user=await db.collection('users').findOne(
      {user_id:userid},
      {projection: { password: 0 } }
    )
    if(!user) return res.status(404).json({ message: 'User not found' });
    res.status(200).json({ message: 'User fetched successfully', user });
  }
  catch(error){
    console.error('Error fetching user by ID:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
}


module.exports = { getProfile, addUser, alluser,userByitsId,updateProfile};