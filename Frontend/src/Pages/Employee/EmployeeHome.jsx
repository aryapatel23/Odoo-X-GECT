import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Users,
  DollarSign,
  Calendar,
  Clock,
  Briefcase,
  AlertCircle,
  MapPin,
  CheckCircle
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { setAttendanceStatus } from "../../Redux/Slice.jsx";

import { API_BASE_URL } from "../../config.js";

const Dashboard = () => {
  const [userId, setUserId] = useState("");
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [selectedRange, setSelectedRange] = useState("This Year");

  const handleBuddyPunching = () => navigate('/emattendance');
  const handleManagerPOV = () => navigate(`/emprofile/${user?.id}`);

  const user = useSelector((state) => state.auth.user);
  const attendanceStatus = useSelector((state) => state.auth.status);

  useEffect(() => {
    if (user?.id || user?._id) setUserId(user.id || user._id);
  }, [user]);

  useEffect(() => {
    if (!userId) return;
    fetchTodayStatus();
  }, [userId]);

  const fetchTodayStatus = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/api/attendance/${userId}`);
      const data = res.data;

      let currentStatus = "not-checked-in";
      if (data.status && data.status !== "Absent") {
        currentStatus = data.checkOutTime ? "completed" : "checked-in";
      }

      setStatus(currentStatus);
      dispatch(setAttendanceStatus(currentStatus));
    } catch (err) {
      console.error("Error fetching today's attendance", err);
      setStatus("not-checked-in");
    }
  };

  const handleCheckIn = async () => {
    setIsProcessing(true);
    setMessage("📍 Verifying Location...");

    if (!navigator.geolocation) {
      setIsProcessing(false);
      return setMessage("❌ Geolocation not supported");
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/mark-attendance`, {
            id: userId,
            username: user.username,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            },
            type: "check-in"
          });

          setMessage("✅ Check-in successfully!");
          setStatus("checked-in");
          dispatch(setAttendanceStatus("checked-in"));
          setTimeout(() => setMessage(""), 3000);
        } catch (err) {
          const errMsg = err.response?.data?.message || "❌ Check-in Failed";
          setMessage(errMsg);
        } finally {
          setIsProcessing(false);
        }
      },
      (geoErr) => {
        setMessage(`❌ Location Error: ${geoErr.message}`);
        setIsProcessing(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCheckOut = async () => {
    setIsProcessing(true);
    setMessage("📍 Verifying Location...");

    if (!navigator.geolocation) {
      setIsProcessing(false);
      return setMessage("❌ Geolocation not supported");
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const res = await axios.post(`${API_BASE_URL}/api/mark-attendance`, {
            id: userId,
            username: user.username,
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude
            },
            type: "check-out"
          });

          setMessage("👋 Check-out successfully!");
          setStatus("completed");
          dispatch(setAttendanceStatus("completed"));
          setTimeout(() => setMessage(""), 3000);
        } catch (err) {
          const errMsg = err.response?.data?.message || "❌ Check-out Failed";
          setMessage(errMsg);
        } finally {
          setIsProcessing(false);
        }
      },
      (geoErr) => {
        setMessage(`❌ Location Error: ${geoErr.message}`);
        setIsProcessing(false);
      },
      { enableHighAccuracy: true }
    );
  };

  const yearData = [
    { name: "Jan", Attendance: 24 },
    { name: "Feb", Attendance: 22 },
    { name: "Mar", Attendance: 18 },
    { name: "Apr", Attendance: 27 },
    { name: "May", Attendance: 30 },
    { name: "Jun", Attendance: 25 },
    { name: "Jul", Attendance: 29 },
    { name: "Aug", Attendance: 24 },
    { name: "Sep", Attendance: 26 },
    { name: "Oct", Attendance: 28 },
    { name: "Nov", Attendance: 23 },
    { name: "Dec", Attendance: 21 },
  ];

  const monthData = Array.from({ length: 31 }, (_, i) => ({
    name: `${i + 1}`,
    Attendance: Math.random() > 0.15 ? 1 : 0,
  }));

  const getStatusBadge = () => {
    if (status === "checked-in") return "bg-green-100 text-green-700 ring-green-600/20";
    if (status === "completed") return "bg-blue-100 text-blue-700 ring-blue-600/20";
    return "bg-red-100 text-red-700 ring-red-600/20";
  }

  const StatCard = ({ title, value, note, colorClass, icon: Icon }) => (
    <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border flex flex-col hover:shadow-md transition-shadow duration-200">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-xl ${colorClass.replace('text-', 'bg-').replace('600', '100').replace('primary', 'indigo')} bg-opacity-20`}>
          <Icon className={`w-6 h-6 ${colorClass}`} />
        </div>
        <span className="text-xs font-medium text-gray-400 bg-gray-50 px-2 py-1 rounded-lg">View</span>
      </div>
      <div>
        <h4 className="text-sm font-medium text-text-sub mb-1">{title}</h4>
        <p className={`text-2xl font-bold ${colorClass}`}>{value}</p>
        <p className="text-xs text-gray-400 mt-2">{note}</p>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-2xl border border-border shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-text-main mb-1">Dashboard</h1>
          <p className="text-text-sub">Good to see you, <span className="font-semibold text-primary">{user?.username}</span> 👋</p>
        </div>

        <div className="flex flex-wrap gap-3 items-center">
          {status === "not-checked-in" && (
            <button
              onClick={handleCheckIn}
              disabled={isProcessing}
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-indigo-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <MapPin size={18} />
              {isProcessing ? "Verifying..." : "Bind In"}
            </button>
          )}

          {status === "checked-in" && (
            <button
              onClick={handleCheckOut}
              disabled={isProcessing}
              className="bg-rose-500 hover:bg-rose-600 text-white px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg shadow-rose-200 transition-all active:scale-95 flex items-center gap-2"
            >
              <MapPin size={18} />
              {isProcessing ? "Verifying..." : "Bind Out"}
            </button>
          )}

          {status === "completed" && (
            <div className="bg-gray-100 text-gray-500 px-6 py-2.5 rounded-xl text-sm font-bold border border-gray-200 flex items-center gap-2">
              <CheckCircle size={18} />
              Done for Today
            </div>
          )}

          <button onClick={handleManagerPOV} className="border border-border bg-white hover:bg-gray-50 text-text-main px-5 py-2.5 rounded-xl text-sm font-medium transition-colors">
            View Profile
          </button>

          <div className={`px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm ring-1 ${getStatusBadge()}`}>
            {status === "checked-in" ? "Present" : status === "completed" ? "Signed Out" : "Absent"}
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl text-sm font-bold animate-in slide-in-from-top-2 duration-300 ${message.includes("❌") ? "bg-red-50 text-red-700 border border-red-100" :
            message.includes("✅") || message.includes("👋") ? "bg-green-50 text-green-700 border border-green-100" :
              "bg-indigo-50 text-indigo-700 border border-indigo-100"
          }`}>
          {message}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Leave Allowance" value="34" note="Paid 11 | Unpaid 4" colorClass="text-primary" icon={Briefcase} />
        <StatCard title="Leave Taken" value="20" note="Paid 62 | Unpaid 76" colorClass="text-red-600" icon={AlertCircle} />
        <StatCard title="Leave Available" value="87" note="Paid 50 | Unpaid 51" colorClass="text-green-600" icon={Calendar} />
        <StatCard title="Pending Requests" value="122" note="Paid 60 | Unpaid 53" colorClass="text-purple-600" icon={Clock} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Attendance Chart */}
        <div className="lg:col-span-2 bg-surface p-6 rounded-2xl shadow-sm border border-border">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-bold text-lg text-text-main">Attendance Trends</h3>
            <select
              className="text-sm border border-gray-200 bg-gray-50 rounded-lg px-3 py-2 text-text-main focus:outline-none focus:ring-2 focus:ring-primary/20"
              value={selectedRange}
              onChange={(e) => setSelectedRange(e.target.value)}
            >
              <option>This Year</option>
              <option>This Month</option>
            </select>
          </div>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={selectedRange === "This Year" ? yearData : monthData} barSize={20}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
              <Tooltip
                cursor={{ fill: '#F3E8FF' }}
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
              />
              <Bar dataKey="Attendance" fill="#6D28D9" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Announcements */}
        <div className="bg-surface p-6 rounded-2xl shadow-sm border border-border">
          <h3 className="font-bold text-lg text-text-main mb-6">Announcements</h3>
          <div className="space-y-4">
            {[
              { title: "Scrum Master", date: "Dec 4", desc: "Corrected item alignment", tag: "Tech" },
              { title: "Team Meeting", date: "Dec 30", desc: "Quarterly review session", tag: "General" },
              { title: "Holiday Party", date: "Dec 25", desc: "Annual celebration", tag: "Social" },
            ].map((item, idx) => (
              <div key={idx} className="group p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 cursor-pointer">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-text-main group-hover:text-primary transition-colors">{item.title}</h4>
                  <span className="text-[10px] uppercase font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">{item.tag}</span>
                </div>
                <p className="text-sm text-gray-500 mb-2 line-clamp-1">{item.desc}</p>
                <div className="flex items-center text-xs text-gray-400 gap-1">
                  <Calendar size={12} />
                  <span>{item.date}</span>
                </div>
              </div>
            ))}
          </div>
          <button className="w-full mt-6 py-2.5 text-sm font-medium text-primary hover:bg-accent/50 rounded-xl transition-colors">
            View All Announcements
          </button>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
