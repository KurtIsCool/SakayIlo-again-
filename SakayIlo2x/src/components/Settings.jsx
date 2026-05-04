import React, { useState, useRef } from "react";
import { UserCircle, Camera } from "lucide-react";

export default function Settings() {
  const [partnerPhotoFile, setPartnerPhotoFile] = useState(null);
  const [partnerPhotoPreview, setPartnerPhotoPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handlePhotoUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPartnerPhotoFile(file);
      setPartnerPhotoPreview(URL.createObjectURL(file));
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const saveProfile = () => {
    // Simulating an IndexedDB mutation
    console.log("Saving partner profile picture to IndexedDB...", {
      photo: partnerPhotoFile
    });
    alert("Partner profile picture updated successfully!");
  };

  return (
    <div className="w-full h-full flex flex-col items-center p-6 bg-gray-50 min-h-[400px]">
      <h2 className="text-xl font-bold text-gray-800 mb-8 uppercase tracking-wider">Settings</h2>

      <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center w-full max-w-[320px]">
        <h3 className="text-sm font-bold uppercase text-gray-500 mb-6">Partner Profile</h3>

        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handlePhotoUpload}
        />

        <div className="relative mb-8 cursor-pointer group" onClick={triggerFileInput}>
          {partnerPhotoPreview ? (
            <img
              src={partnerPhotoPreview}
              alt="Partner Profile Preview"
              className="w-32 h-32 object-cover rounded-full shadow-lg border-4 border-rose-100"
            />
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded-full flex items-center justify-center text-gray-400 border-4 border-dashed border-gray-300 group-hover:border-rose-300 group-hover:bg-rose-50 group-hover:text-rose-400 transition-colors">
              <UserCircle size={64} strokeWidth={1} />
            </div>
          )}

          <div className="absolute bottom-0 right-0 bg-rose-500 text-white p-2 rounded-full shadow-md border-2 border-white group-hover:scale-110 transition-transform">
            <Camera size={16} />
          </div>
        </div>

        <button
          onClick={saveProfile}
          disabled={!partnerPhotoFile}
          className={`w-full py-3 font-bold uppercase text-sm rounded-xl shadow-lg transition-all ${partnerPhotoFile ? 'bg-rose-500 hover:bg-rose-600 text-white border-b-4 border-rose-700 active:border-b-0 active:translate-y-1' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        >
          Save Profile
        </button>
      </div>
    </div>
  );
}
