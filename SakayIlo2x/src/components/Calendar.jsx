import React, { useState } from "react";
import { DayPicker } from "react-day-picker";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  return (
    <div className="w-full flex justify-center items-center mx-auto overflow-hidden">
      <DayPicker
        mode="single"
        selected={selectedDate}
        onSelect={setSelectedDate}
        className="p-4"
        classNames={{
          months: "flex flex-col space-y-4",
          month: "space-y-4",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "space-x-1 flex items-center",
          nav_button: "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 transition-opacity",
          nav_button_previous: "absolute left-1",
          nav_button_next: "absolute right-1",
          table: "w-full max-w-[320px] mx-auto border-collapse",
          head_row: "flex w-full",
          head_cell: "text-gray-500 rounded-md w-10 font-normal text-[0.8rem] text-center",
          row: "flex w-full mt-2",
          cell: "text-center p-0 relative bg-transparent focus-within:relative focus-within:z-20",
          day: "w-10 h-10 flex items-center justify-center rounded-full m-auto bg-transparent hover:bg-gray-100 cursor-pointer text-sm transition-colors focus:outline-none",
          day_selected: "bg-rose-100 text-rose-900 ring-2 ring-rose-400 ring-offset-2 ring-offset-white rounded-full font-bold hover:bg-rose-100 hover:text-rose-900",
          day_today: "text-rose-500 font-bold",
          day_outside: "text-gray-400 opacity-50",
          day_disabled: "text-gray-400 opacity-50 cursor-not-allowed",
          day_hidden: "invisible",
        }}
      />
    </div>
  );
}
