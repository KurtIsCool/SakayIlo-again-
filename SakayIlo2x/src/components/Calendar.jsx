import React, { useState, useRef } from "react";
import { DayPicker } from "react-day-picker";
import { Camera, Utensils, Gift, CalendarHeart, Clapperboard } from "lucide-react";

export default function Calendar() {
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Memory Logging State
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [photoFile, setPhotoFile] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleCategoryClick = (category) => {
    setSelectedCategory(category);
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const saveMemory = () => {
    // Simulating an IndexedDB mutation
    console.log("Saving memory to IndexedDB...", {
      date: selectedDate,
      category: selectedCategory,
      photo: photoFile
    });

    // Reset state after saving
    setSelectedCategory(null);
    setPhotoFile(null);
    if (photoPreview) URL.revokeObjectURL(photoPreview);
    setPhotoPreview(null);
    alert("Memory saved successfully!");
  };

  return (
    <div className="w-full flex flex-col justify-center items-center mx-auto overflow-hidden p-4">
      <div className="w-full flex justify-center items-center">
        <DayPicker
          mode="single"
          selected={selectedDate}
          onSelect={setSelectedDate}
          className="p-4 bg-white rounded-2xl shadow-xl"
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

      <div className="mt-8 w-full max-w-[320px] bg-white p-6 rounded-2xl shadow-xl flex flex-col items-center">
        <h3 className="text-sm font-bold uppercase text-gray-700 mb-4">Add a memory for this day</h3>

        <div className="flex justify-between w-full mb-6">
          <button
            onClick={() => handleCategoryClick('Dining')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${selectedCategory === 'Dining' ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-400' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Utensils size={24} className="mb-1" />
            <span className="text-[0.65rem] font-bold uppercase">Dining</span>
          </button>
          <button
            onClick={() => handleCategoryClick('Gift')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${selectedCategory === 'Gift' ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-400' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Gift size={24} className="mb-1" />
            <span className="text-[0.65rem] font-bold uppercase">Gift</span>
          </button>
          <button
            onClick={() => handleCategoryClick('Date')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${selectedCategory === 'Date' ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-400' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <CalendarHeart size={24} className="mb-1" />
            <span className="text-[0.65rem] font-bold uppercase">Date</span>
          </button>
          <button
            onClick={() => handleCategoryClick('Media')}
            className={`flex flex-col items-center p-2 rounded-xl transition-colors ${selectedCategory === 'Media' ? 'bg-rose-100 text-rose-600 ring-2 ring-rose-400' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Clapperboard size={24} className="mb-1" />
            <span className="text-[0.65rem] font-bold uppercase">Media</span>
          </button>
        </div>

        {selectedCategory && (
          <div className="w-full flex flex-col items-center animate-in fade-in zoom-in duration-200">
            <input
              type="file"
              accept="image/*"
              className="hidden"
              ref={fileInputRef}
              onChange={handlePhotoUpload}
            />

            {photoPreview ? (
              <div className="relative mb-4 group cursor-pointer" onClick={triggerFileInput}>
                <img src={photoPreview} alt="Memory preview" className="w-32 h-32 object-cover rounded-2xl shadow-md border-4 border-rose-100" />
                <div className="absolute inset-0 bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera className="text-white" size={24} />
                </div>
              </div>
            ) : (
              <button
                onClick={triggerFileInput}
                className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 hover:bg-rose-50 hover:text-rose-400 transition-colors mb-4 border-2 border-dashed border-gray-300 hover:border-rose-300"
              >
                <Camera size={28} />
              </button>
            )}

            <button
              onClick={saveMemory}
              className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white font-bold uppercase text-sm rounded-xl shadow-lg border-b-4 border-rose-700 active:border-b-0 active:translate-y-1 transition-all"
            >
              Save Memory
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
