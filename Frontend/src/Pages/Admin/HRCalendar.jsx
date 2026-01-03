import React, { useState, useEffect } from 'react';
import Header from '../../Components/Header';
import Sidebar from '../../Components/HRSidebar';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Plus, Trash2 } from 'lucide-react';
import dayjs from 'dayjs';
import { API_BASE_URL } from "../../config.js";
import { toast } from 'react-toastify';

const HRCalendar = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [holidays, setHolidays] = useState({});
  const [holidayList, setHolidayList] = useState([]);
  const [formData, setFormData] = useState({ date: '', reason: '' });
  const [loading, setLoading] = useState(false);

  const fetchHolidays = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/holidays`);
      const data = await res.json();
      const holidayMap = {};
      data.forEach(holiday => {
        holidayMap[holiday.date] = holiday.reason;
      });
      setHolidays(holidayMap);

      const now = dayjs().startOf('day');
      const upcoming = data
        .filter(h => dayjs(h.date).isAfter(now) || dayjs(h.date).isSame(now, 'day'))
        .sort((a, b) => dayjs(a.date).diff(now) - dayjs(b.date).diff(now));

      setHolidayList(upcoming);
    } catch (err) {
      console.error("Error loading holidays:", err);
    }
  };

  useEffect(() => {
    fetchHolidays();
  }, []);

  const startOfMonth = currentDate.startOf('month');
  const startDay = startOfMonth.day();
  const daysInMonth = currentDate.daysInMonth();

  const prevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const nextMonth = () => setCurrentDate(currentDate.add(1, 'month'));

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleAddHoliday = async (e) => {
    e.preventDefault();
    if (!formData.date || !formData.reason) return toast.error("All fields are required");

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/holidays/add`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      if (res.ok) {
        toast.success("✅ Holiday added successfully");
        setFormData({ date: '', reason: '' });
        fetchHolidays();
      } else {
        const result = await res.json();
        toast.error(result.message || "Failed to add holiday");
      }
    } catch (error) {
      console.error("Error adding holiday:", error);
      toast.error("Error adding holiday");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (!window.confirm("Are you sure you want to delete this holiday?")) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/holidays/${id}`, {
        method: "DELETE"
      });
      if (res.ok) {
        toast.success("✅ Holiday deleted");
        fetchHolidays();
      }
    } catch (error) {
      toast.error("Failed to delete holiday");
    }
  };

  return (
    <div className="flex flex-col bg-[#fafbfc] min-h-screen relative overflow-hidden text-slate-900">
      {/* Mesh Gradient Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/40 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-violet-100/30 blur-[100px] rounded-full"></div>

      <div className="p-4 sm:p-8 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 sm:gap-8 mb-8 sm:mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1 w-8 bg-indigo-600 rounded-full"></div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Admin Control</span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
              Command <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-indigo-800">Center</span>
            </h2>
            <p className="text-gray-500 font-medium max-w-md text-sm">
              Strategic oversight and configuration for company holidays and seasonal events.
            </p>
          </div>

          <div className="flex items-center gap-6 p-4 bg-white/70 backdrop-blur-xl rounded-3xl border border-white shadow-xl shadow-indigo-100/50 px-8">
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-pulse shadow-[0_0_10px_rgba(79,70,229,0.5)]"></div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Public Holiday</span>
            </div>
            <div className="w-px h-6 bg-gray-100"></div>
            <div className="flex items-center gap-3">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-400 shadow-[0_0_10px_rgba(244,63,94,0.3)]"></div>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">General Weekend</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* Main Calendar Section */}
          <div className="xl:col-span-8 space-y-10">
            <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-xl overflow-hidden relative">
              {/* Header */}
              <div className="p-8 bg-white/40 flex justify-between items-center border-b border-white/40">
                <div className="flex gap-2">
                  <button onClick={prevMonth} className="p-3 rounded-2xl hover:bg-white text-gray-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md border border-transparent hover:border-indigo-50 active:scale-95">
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button onClick={nextMonth} className="p-3 rounded-2xl hover:bg-white text-gray-400 hover:text-indigo-600 transition-all shadow-sm hover:shadow-md border border-transparent hover:border-indigo-50 active:scale-95">
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>

                <div className="flex flex-col items-center">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight uppercase leading-none">
                    {currentDate.format('MMMM')}
                  </h3>
                  <div className="px-3 py-0.5 bg-indigo-600 rounded-full text-[10px] font-bold text-white uppercase tracking-widest mt-2">
                    {currentDate.format('YYYY')}
                  </div>
                </div>

                <div className="flex items-center gap-4 bg-white/50 p-1.5 px-4 rounded-2xl border border-white/60">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                  <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Master View</span>
                </div>
              </div>

              <div className="p-10">
                {/* Week Headers */}
                <div className="grid grid-cols-7 mb-8 border-b border-gray-100 pb-4">
                  {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                    <div key={day} className="text-center text-[10px] font-black text-gray-300 tracking-[0.3em]">
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grid */}
                <div className="grid grid-cols-7 gap-2 sm:gap-5 text-xs sm:text-sm">
                  {days.map((day, idx) => {
                    if (!day) return <div key={idx} className="h-10 sm:h-16 opacity-0"></div>;

                    const fullDate = currentDate.date(day).format('YYYY-MM-DD');
                    const weekDay = currentDate.date(day).day();
                    const isToday = day === dayjs().date() && currentDate.month() === dayjs().month() && currentDate.year() === dayjs().year();
                    const isHoliday = holidays[fullDate];
                    const isSunday = weekDay === 0;

                    return (
                      <div
                        key={idx}
                        className={`relative aspect-[1/1] p-4 rounded-3xl transition-all duration-300 overflow-hidden flex flex-col items-center justify-center group border
                          ${isToday
                            ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 scale-105 z-10 border-indigo-600'
                            : isHoliday
                              ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 border-indigo-100 text-indigo-900'
                              : 'bg-white hover:bg-white shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 border-gray-50 hover:border-indigo-100'
                          }
                        `}
                      >
                        <span className={`text-xl font-black tracking-tight ${isToday ? 'text-white' : isSunday ? 'text-rose-500/80' : 'text-gray-900 group-hover:text-indigo-600 transition-colors'}`}>
                          {day}
                        </span>

                        {isHoliday && (
                          <div className="absolute inset-0 flex items-end justify-center pb-3">
                            <div className="px-2 py-0.5 bg-indigo-600/10 rounded-lg">
                              <p className="text-[8px] font-black uppercase text-indigo-600 tracking-wider truncate max-w-[80px]">
                                {holidays[fullDate]}
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Quick Add Form Section - Bespoke Management Dashboard */}
            <div className="bg-white rounded-[2.5rem] border border-white shadow-2xl p-10 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-[0.03] pointer-events-none">
                <Plus className="w-40 h-40" />
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg shadow-indigo-600/20">
                  <Plus className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-2xl font-black text-gray-900 tracking-tight leading-none mb-1">Schedule Event</h4>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">New Company Holiday</p>
                </div>
              </div>

              <form onSubmit={handleAddHoliday} className="grid grid-cols-1 md:grid-cols-12 gap-8 relative z-10">
                <div className="md:col-span-4 space-y-3">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-1">Selected Date</label>
                  <input
                    type="date"
                    name="date"
                    value={formData.date}
                    onChange={handleInputChange}
                    className="w-full px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all font-black text-gray-900"
                    required
                  />
                </div>
                <div className="md:col-span-8 space-y-3 font-bold">
                  <label className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] px-1">Event Logic / Description</label>
                  <div className="flex gap-4">
                    <input
                      type="text"
                      name="reason"
                      placeholder="Describe the occasion..."
                      value={formData.reason}
                      onChange={handleInputChange}
                      className="flex-1 px-6 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-600/5 focus:border-indigo-600 outline-none transition-all font-bold text-gray-900 leading-tight"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-10 py-4 bg-indigo-600 text-white font-black rounded-2xl hover:bg-indigo-700 transition-all active:scale-95 shadow-xl shadow-indigo-600/30 disabled:opacity-50 flex items-center gap-3"
                    >
                      {loading ? 'Processing...' : (
                        <>
                          <span>Deploy</span>
                          <ChevronRight className="w-5 h-5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Side Listing Panel - Holiday Queue */}
          <div className="xl:col-span-4 space-y-8">
            <div className="bg-white rounded-[2.5rem] border border-white shadow-2xl flex flex-col h-full max-h-[850px] overflow-hidden">
              <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                <div className="flex items-center gap-3 mb-1">
                  <div className="w-1.5 h-6 bg-indigo-600 rounded-full"></div>
                  <h4 className="text-xl font-black text-gray-900 tracking-tighter">Holiday Queue</h4>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-4">Live Event Feed</p>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {holidayList.length > 0 ? (
                  holidayList.map((h, i) => (
                    <div key={i} className="group p-6 bg-gray-50/50 hover:bg-white rounded-[2rem] border border-transparent hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500 relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4 relative z-10">
                        <div className="px-3 py-1 rounded-xl bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-600/20">
                          {dayjs(h.date).format('MMM D')}
                        </div>
                        <button
                          onClick={() => handleDeleteHoliday(h._id)}
                          className="p-2 text-gray-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0"
                        >
                          <Trash2 size={16} strokeWidth={3} />
                        </button>
                      </div>
                      <p className="font-black text-gray-900 leading-tight text-lg mb-1 relative z-10 italic">"{h.reason}"</p>
                      <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.2em] relative z-10">{dayjs(h.date).format('YYYY')} SCHEDULE</p>

                      {/* Subtle decor for list item */}
                      <div className="absolute top-0 right-0 p-4 opacity-[0.02] group-hover:opacity-[0.05] transition-opacity">
                        <CalendarIcon className="w-20 h-20" />
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-24 px-8">
                    <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-6 text-gray-200">
                      <CalendarIcon className="w-10 h-10" />
                    </div>
                    <p className="text-lg font-black text-gray-900 leading-tight mb-2">Queue is Empty</p>
                    <p className="text-sm font-bold text-gray-400 leading-relaxed">
                      All systems nominal. No upcoming holidays have been scheduled yet.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HRCalendar;