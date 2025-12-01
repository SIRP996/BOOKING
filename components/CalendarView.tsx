import React from 'react';
import { Booking, BookingStatus } from '../types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface CalendarViewProps {
  bookings: Booking[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ bookings }) => {
  const [currentDate, setCurrentDate] = React.useState(new Date());

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate); // 0 = Sunday
  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];

  // Mapping bookings to dates based on Air Date (or Start Date if Air Date missing)
  const bookingsByDate = bookings.reduce((acc, booking) => {
    const dateStr = booking.airDate || booking.startDate;
    if (dateStr) {
       // dateStr format YYYY-MM-DD
       if (!acc[dateStr]) acc[dateStr] = [];
       acc[dateStr].push(booking);
    }
    return acc;
  }, {} as Record<string, Booking[]>);

  const renderCells = () => {
    const cells = [];
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // Empty cells for previous month
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="h-32 bg-gray-50/50 border-r border-b border-gray-100"></div>);
    }

    // Days
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const dayBookings = bookingsByDate[dateStr] || [];
      const isToday = new Date().toISOString().split('T')[0] === dateStr;

      cells.push(
        <div key={day} className={`h-32 border-r border-b border-gray-100 p-2 overflow-y-auto hover:bg-blue-50/30 transition-colors group ${isToday ? 'bg-blue-50' : ''}`}>
          <div className="flex justify-between items-start mb-1">
             <span className={`text-sm font-bold w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'bg-blue-600 text-white' : 'text-gray-700'}`}>{day}</span>
             {dayBookings.length > 0 && <span className="text-[10px] text-gray-400 font-medium">{dayBookings.length} bài</span>}
          </div>
          <div className="space-y-1">
            {dayBookings.map(b => (
              <div key={b.id} className="text-[10px] bg-white border border-gray-200 p-1 rounded shadow-sm hover:shadow-md hover:border-blue-300 cursor-pointer truncate" title={`${b.kol.name} - ${b.productName}`}>
                <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${b.status === BookingStatus.COMPLETED ? 'bg-green-500' : 'bg-orange-400'}`}></span>
                <span className="font-bold text-gray-800">{b.kol.name}</span>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return cells;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="flex justify-between items-center p-4 border-b border-gray-100">
        <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            Lịch Đăng Bài - {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
        </h2>
        <div className="flex gap-2">
            <button onClick={prevMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronLeft className="w-5 h-5"/></button>
            <button onClick={nextMonth} className="p-2 hover:bg-gray-100 rounded-lg text-gray-600"><ChevronRight className="w-5 h-5"/></button>
        </div>
      </div>
      <div className="grid grid-cols-7 border-b border-gray-100 bg-gray-50 text-xs font-bold text-gray-500 uppercase text-center py-2">
        <div>CN</div><div>T2</div><div>T3</div><div>T4</div><div>T5</div><div>T6</div><div>T7</div>
      </div>
      <div className="grid grid-cols-7">
        {renderCells()}
      </div>
    </div>
  );
};

export default CalendarView;