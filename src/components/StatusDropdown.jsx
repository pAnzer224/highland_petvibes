import React, { useState, useEffect, useRef } from "react";
import { ChevronDown } from "lucide-react";

function StatusDropdown({
  statusOptions,
  selectedStatus,
  onStatusChange,
  className,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleStatusSelect = (status) => {
    onStatusChange(status);
    setIsDropdownOpen(false);
  };

  return (
    <div
      ref={dropdownRef}
      className={`relative w-full md:w-64 font-nunito-bold ${className || ""}`}
    >
      <button
        onClick={(e) => {
          e.stopPropagation();
          setIsDropdownOpen(!isDropdownOpen);
        }}
        className="w-full px-4 py-2 bg-green3/90 text-primary rounded-xl hover:bg-green3/80 transition-colors border-[1.6px] border-green2 flex items-center justify-between font-nunito"
      >
        <span>{selectedStatus}</span>
        <ChevronDown className="w-4 h-4" />
      </button>

      {isDropdownOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 border-[1.6px] border-green2 rounded-xl shadow-lg z-50">
          {statusOptions.map((status) => (
            <button
              key={status}
              onClick={(e) => {
                e.stopPropagation();
                handleStatusSelect(status);
              }}
              className="w-full px-4 py-2 text-left hover:bg-green3/20 text-primary transition-colors first:rounded-t-xl last:rounded-b-xl font-nunito"
            >
              {status}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default StatusDropdown;
