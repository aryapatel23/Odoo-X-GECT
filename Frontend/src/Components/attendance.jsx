import React, { useState, useEffect } from "react";
import { API_BASE_URL } from "../config";
import { useSelector } from "react-redux";
import { MapPin, CheckCircle, Clock, ShieldCheck, Map, Calendar as CalendarIcon } from "lucide-react";

function AttendanceNew() {
  const { user } = useSelector((state) => state.auth);
  const [status, setStatus] = useState("loading");
  const [message, setMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    fetchTodayAttendance();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchTodayAttendance = async () => {
    try {
      const userIdToSend = user._id || user.user_id || user.id;
      const res = await fetch(`${API_BASE_URL}/api/attendance/${userIdToSend}`);
      const data = await res.json();
      if (data.status && data.status !== "Absent") {
        setStatus(data.checkOutTime ? "completed" : "checked-in");
      } else {
        setStatus("not-checked-in");
      }
    } catch (error) {
      console.error("❌ Error fetching attendance:", error);
      setStatus("not-checked-in");
    }
  };

  const handleCheckIn = async () => {
    setMessage("📍 Verifying Location...");
    if (!navigator.geolocation) {
      return setMessage("❌ Geolocation is not supported by your browser.");
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        const userIdToSend = user._id || user.user_id || user.id;

        try {
          const res = await fetch(`${API_BASE_URL}/api/mark-attendance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: userIdToSend,
              username: user.username,
              location,
              type: "check-in"
              // Face descriptor removed as requested
            }),
          });

          const data = await res.json();
          if (res.ok) {
            setMessage(data.message || "✅ Checked in successfully!");
            setStatus("checked-in");
          } else {
            setMessage(data.message || "❌ Check-in Failed");
          }
        } catch (err) {
          console.error("❌ Server Error:", err);
          setMessage("❌ Server Error. Please try again.");
        }
      },
      (geoErr) => {
        console.error("❌ Geolocation Error:", geoErr);
        setMessage(`❌ Location Error: ${geoErr.message}. Please enable GPS.`);
      },
      { enableHighAccuracy: true }
    );
  };

  const handleCheckOut = async () => {
    setMessage("📍 Verifying Location...");
    if (!navigator.geolocation) {
      return setMessage("❌ Geolocation is not supported by your browser.");
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const location = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        const userIdToSend = user._id || user.user_id || user.id;

        try {
          const res = await fetch(`${API_BASE_URL}/api/mark-attendance`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: userIdToSend,
              username: user.username,
              location,
              type: "check-out"
            }),
          });

          const data = await res.json();
          if (res.ok) {
            setMessage(data.message || "👋 Checked out successfully!");
            setStatus("completed");
          } else {
            setMessage(data.message || "❌ Check-out Failed");
          }
        } catch (err) {
          console.error("❌ Server Error:", err);
          setMessage("❌ Server Error");
        }
      },
      (geoErr) => {
        console.error("❌ Geolocation Error:", geoErr);
        setMessage(`❌ Location Error: ${geoErr.message}. Please enable GPS.`);
      },
      { enableHighAccuracy: true }
    );
  };

  return (
    <div className="max-w-6xl mx-auto p-4 animate-in fade-in duration-700 pb-24">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-3 bg-gradient-to-r from-indigo-700 to-purple-800 rounded-3xl p-8 text-white shadow-2xl relative overflow-hidden group">
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold mb-2">Hello, {user?.username}! 👋</h1>
            <p className="text-indigo-100 text-lg opacity-90 mb-6">Your workspace is ready. Let's make today productive!</p>
            <div className="flex flex-wrap gap-4">
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/20">
                <Clock size={18} />
                <span>{currentTime.toLocaleTimeString()}</span>
              </div>
              <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/20">
                <CalendarIcon size={18} />
                <span>{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
              </div>
            </div>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 group-hover:scale-110 transition-transform duration-500">
            <MapPin size={280} />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 p-8 lg:p-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {[
            { label: 'Check In', value: status === 'checked-in' || status === 'completed' ? 'Success' : 'Pending', icon: '📍', active: status === 'checked-in' },
            { label: 'Check Out', value: status === 'completed' ? 'Success' : 'Pending', icon: '👋', active: status === 'completed' },
            { label: 'Office Hours', value: '09:00 - 18:00', icon: '⏰', active: false }
          ].map((item, i) => (
            <div key={i} className={`p-8 rounded-[2rem] border-2 transition-all duration-300 ${item.active ? 'bg-indigo-50 border-indigo-200 scale-105' : 'bg-gray-50 border-gray-100 hover:border-indigo-100'}`}>
              <div className="text-4xl mb-4">{item.icon}</div>
              <h3 className="font-bold text-xl text-gray-800">{item.label}</h3>
              <p className={`text-sm font-semibold uppercase tracking-wider mt-1 ${item.value === 'Success' ? 'text-green-600' : 'text-gray-400'}`}>{item.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6 items-center">
          <div className="flex flex-col md:flex-row gap-4 justify-center items-center">
            {status === "not-checked-in" && (
              <button
                onClick={handleCheckIn}
                className="group px-12 py-6 bg-gradient-to-r from-indigo-600 to-purple-700 text-white text-2xl rounded-2xl font-black shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
              >
                <MapPin size={32} className="group-hover:bounce" />
                Mark Attendance
              </button>
            )}

            {status === "checked-in" && (
              <button
                onClick={handleCheckOut}
                className="group px-12 py-6 bg-gradient-to-r from-rose-500 to-red-700 text-white text-2xl rounded-2xl font-black shadow-2xl hover:scale-105 transition-all flex items-center gap-3"
              >
                <MapPin size={32} className="group-hover:rotate-12 transition-transform" />
                Sign Out Now
              </button>
            )}

            {status === "completed" && (
              <div className="px-12 py-6 bg-gray-100 text-gray-400 text-2xl rounded-2xl font-black border border-gray-200 flex items-center gap-3 cursor-default">
                <CheckCircle size={32} />
                Done for Today
              </div>
            )}
          </div>

          {message && (
            <div className={`p-4 rounded-2xl text-center text-lg font-bold border-2 animate-in slide-in-from-top-2 duration-300 max-w-md ${message.includes("❌") ? "bg-red-50 text-red-700 border-red-100" :
                message.includes("✅") || message.includes("👋") ? "bg-green-50 text-green-700 border-green-100" :
                  "bg-indigo-50 text-indigo-700 border-indigo-100"
              }`}>
              {message}
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-indigo-50/50 rounded-3xl p-6 border border-indigo-100/50 flex items-start gap-4">
          <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
            <ShieldCheck size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">Secure Location Check</h4>
            <p className="text-sm text-gray-500 mt-1">Verification happens in real-time based on your GPS coordinates. No biometric data is used.</p>
          </div>
        </div>
        <div className="bg-purple-50/50 rounded-3xl p-6 border border-purple-100/50 flex items-start gap-4">
          <div className="bg-purple-100 p-3 rounded-xl text-purple-600">
            <Map size={24} />
          </div>
          <div>
            <h4 className="font-bold text-gray-800">3KM Geofence Active</h4>
            <p className="text-sm text-gray-500 mt-1">Attendance only works within 3km of the office. Ensure your mobile data or Wi-Fi is stable for location accuracy.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AttendanceNew;
