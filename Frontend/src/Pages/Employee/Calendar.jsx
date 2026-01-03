import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import dayjs from 'dayjs';
import Sidebar from '../../Components/Sidebar';
import Header from '../../Components/Header';

import { API_BASE_URL } from "../../config.js";

const Calendar = () => {
  const [currentDate, setCurrentDate] = useState(dayjs());
  const [holidays, setHolidays] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [nextHoliday, setNextHoliday] = useState(null);

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/holidays`)
      .then(res => res.json())
      .then(data => {
        const map = {};
        const now = dayjs();
        let closest = null;

        data.forEach(h => {
          map[h.date] = h.reason;
          const hDate = dayjs(h.date);
          if (hDate.isAfter(now) || hDate.isSame(now, 'day')) {
            if (!closest || hDate.isBefore(dayjs(closest.date))) {
              closest = h;
            }
          }
        });
        setHolidays(map);
        setNextHoliday(closest);
      })
      .catch(err => console.error("Error loading holidays:", err));
  }, []);

  const startOfMonth = currentDate.startOf('month');
  const startDay = startOfMonth.day(); // Sunday = 0
  const daysInMonth = currentDate.daysInMonth();

  const prevMonth = () => setCurrentDate(currentDate.subtract(1, 'month'));
  const nextMonth = () => setCurrentDate(currentDate.add(1, 'month'));

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);

  const handleDayClick = (day) => {
    const fullDate = currentDate.date(day).format('YYYY-MM-DD');
    if (holidays[fullDate]) {
      setSelectedDate({ date: fullDate, reason: holidays[fullDate] });
    } else {
      setSelectedDate(null);
    }
  };

  return (
    <div className="flex flex-col bg-[#fafbfc] min-h-screen relative overflow-hidden text-slate-900">
      {/* Mesh Gradient Background Decor */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 blur-[120px] rounded-full"></div>
      <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-violet-100/40 blur-[100px] rounded-full"></div>

      <div className="p-4 sm:p-8 relative z-10">
        <div className="flex flex-col lg:flex-row justify-between items-start gap-6 sm:gap-8 mb-8 sm:mb-10">
          <div className="space-y-2">
            <div className="flex items-center gap-3 mb-1">
              <div className="h-1 w-8 bg-indigo-600 rounded-full"></div>
              <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest leading-none">Company Roadmap</span>
            </div>
            <h2 className="text-4xl font-black text-gray-900 tracking-tight leading-none">
              Holiday <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-600">Calendar</span>
            </h2>
            <p className="text-gray-500 font-medium max-w-md text-sm">
              A bespoke overview of upcoming company breaks and important seasonal events.
            </p>
          </div>

          {/* Countdown Card - High End */}
          {nextHoliday && (
            <div className="bg-white/70 backdrop-blur-xl border border-white p-6 rounded-[2rem] shadow-2xl shadow-indigo-100 flex items-center gap-6 group hover:scale-[1.02] transition-transform duration-500">
              <div className="bg-gradient-to-br from-indigo-600 to-indigo-700 p-4 rounded-2xl shadow-lg shadow-indigo-200 group-hover:rotate-6 transition-transform">
                <CalendarIcon className="w-8 h-8 text-white" />
              </div>
              <div>
                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-1">Featured Event</p>
                <h4 className="text-xl font-black text-gray-900 leading-tight mb-1">{nextHoliday.reason}</h4>
                <p className="text-sm font-bold text-gray-500 italic">
                  Starts in <span className="text-gray-900 not-italic">{dayjs(nextHoliday.date).diff(dayjs(), 'day')} days</span>
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
          {/* Main Calendar Card */}
          <div className="xl:col-span-8 bg-white/40 backdrop-blur-md rounded-[2.5rem] border border-white/60 shadow-xl overflow-hidden relative">
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
                <div className="px-3 py-0.5 bg-indigo-600 rounded-full text-[10px] font-bold text-white uppercase tracking-widest mt-2 overflow-hidden">
                  {currentDate.format('YYYY')}
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/50 p-1.5 px-4 rounded-2xl border border-white/60">
                <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse"></div>
                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Live Sync</span>
              </div>
            </div>

            <div className="p-10">
              {/* Week Headers - Unique Alignment */}
              <div className="grid grid-cols-7 mb-8 border-b border-gray-100 pb-4">
                {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => (
                  <div key={day} className="text-center text-[10px] font-black text-gray-300 tracking-[0.3em]">
                    {day}
                  </div>
                ))}
              </div>

              {/* Day Grid */}
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
                      onClick={() => handleDayClick(day)}
                      className={`relative aspect-[1/1] p-4 rounded-3xl transition-all duration-500 cursor-pointer overflow-hidden flex flex-col items-center justify-center group
                        ${isToday
                          ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30 scale-105 z-10'
                          : isHoliday
                            ? 'bg-gradient-to-br from-indigo-50 to-indigo-100/50 border border-indigo-100 text-indigo-900'
                            : 'bg-white hover:bg-white shadow-sm hover:shadow-2xl hover:shadow-indigo-500/10 hover:-translate-y-2 border border-gray-50 hover:border-indigo-100'
                        }
                      `}
                    >
                      <span className={`text-xl font-black tracking-tight ${isToday ? 'text-white' : isSunday ? 'text-rose-500/80' : 'text-gray-900 group-hover:text-indigo-600 transition-colors'}`}>
                        {day}
                      </span>

                      {isHoliday && (
                        <div className="absolute inset-0 bg-indigo-600/0 hover:bg-indigo-600/5 transition-colors flex items-end justify-center pb-3">
                          <div className="px-2 py-0.5 bg-indigo-600/10 rounded-lg">
                            <p className="text-[8px] font-black uppercase text-indigo-600 tracking-wider truncate max-w-[80%]">{isHoliday}</p>
                          </div>
                        </div>
                      )}

                      {isSunday && !isHoliday && (
                        <div className="mt-1 w-1 h-1 rounded-full bg-rose-400"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Sidebar Section - Detail View */}
          <div className="xl:col-span-4 space-y-8">
            <div className={`bg-white rounded-[2.5rem] border border-white shadow-2xl p-8 min-h-[400px] flex flex-col transition-all duration-700
              ${selectedDate ? 'shadow-indigo-500/10 translate-y-0' : 'translate-y-4 opacity-100'}
            `}>
              <div className="mb-8 overflow-hidden">
                <h4 className="text-gray-900 font-black text-2xl tracking-tighter mb-2">Details</h4>
                <div className="h-1 w-12 bg-indigo-600 rounded-full"></div>
              </div>

              {selectedDate ? (
                <div className="flex-1 flex flex-col justify-center animate-in slide-in-from-bottom-4 duration-500">
                  <div className="space-y-6">
                    <div>
                      <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Timestamp</p>
                      <h5 className="text-3xl font-black text-gray-900 tracking-tight leading-none leading-none">
                        {dayjs(selectedDate.date).format('DD')} <span className="text-indigo-600">{dayjs(selectedDate.date).format('MMM')}</span>
                      </h5>
                      <p className="text-sm font-bold text-gray-400 mt-2">{dayjs(selectedDate.date).format('dddd, YYYY')}</p>
                    </div>

                    <div className="p-8 bg-indigo-600 rounded-[2rem] shadow-xl shadow-indigo-600/30 text-white relative overflow-hidden group">
                      <div className="absolute top-[-20%] right-[-20%] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-1000"></div>
                      <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-4 opacity-70">Official Reason</p>
                      <h6 className="text-2xl font-black leading-tight italic">"{selectedDate.reason}"</h6>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
                  <div className="w-24 h-24 bg-gray-50 rounded-full flex items-center justify-center mb-6 text-gray-200">
                    <CalendarIcon className="w-12 h-12" />
                  </div>
                  <p className="text-lg font-black text-gray-900 leading-tight mb-2">Nothing Selected</p>
                  <p className="text-sm font-bold text-gray-400 leading-relaxed">
                    Select any highlighted date on the calendar to view full holiday specifics.
                  </p>
                </div>
              )}

              <div className="mt-10 pt-8 border-t border-gray-50 font-bold">
                <div className="bg-gray-50 rounded-2xl p-4 flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-white shadow-sm flex items-center justify-center font-black text-indigo-600">?</div>
                  <div>
                    <p className="text-xs font-black text-gray-900 uppercase leading-none mb-1">Need more leave?</p>
                    <p className="text-[10px] font-bold text-gray-400 leading-none">Request it in the Sidebar</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Summary Card */}
            <div className="bg-gradient-to-br from-gray-900 to-black p-8 rounded-[2.5rem] shadow-2xl text-white relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 opacity-10">
                <CalendarIcon className="w-32 h-32" />
              </div>
              <h4 className="text-xl font-black mb-4 relative z-10">Holiday Impact</h4>
              <p className="text-gray-400 text-sm font-medium leading-relaxed mb-6 opacity-80">
                Holidays are designed to keep the team refreshed. Make sure to wrap up your tasks before the break!
              </p>
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10">
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Fixed</p>
                  <p className="text-2xl font-black">12 Days</p>
                </div>
                <div className="h-10 w-0.5 bg-white/10"></div>
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">This Month</p>
                  <p className="text-2xl font-black">2 Days</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
