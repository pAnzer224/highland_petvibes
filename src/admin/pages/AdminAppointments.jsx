import React, { useState, useEffect } from "react";
import { Calendar, ChevronDown, PawPrint } from "lucide-react";
import { getStoredAppointments } from "../../pages/appointmentsUtils";
import { toast } from "react-toastify";

function AppointmentCard({ appointment }) {
  const statusColors = {
    Confirmed: "bg-green3/50 text-green-800",
    Pending: "bg-yellow-100 text-yellow-800",
    Cancelled: "bg-red/80 text-red-800",
  };

  return (
    <div className="bg-gold p-4 rounded-lg border-2 border-green3 hover:border-primary/70 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-nunito-bold text-green2">
            {appointment.petName || "Unnamed Pet"}
          </h3>
          <p className="font-nunito-bold text-xs text-text/60">
            {appointment.service || "No service specified"}
          </p>
        </div>
        <span
          className={`px-3 py-1 rounded-full text-xs font-nunito-bold ${
            statusColors[appointment.status] || "bg-gray-100 text-gray-800"
          }`}
        >
          {appointment.status || "Unknown"}
        </span>
      </div>

      <div className="flex items-center text-sm text-text/80 font-nunito">
        <Calendar size={16} className="mr-2" />
        {appointment.date || "No date specified"}
      </div>
    </div>
  );
}

function Appointments() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("All Status");
  const [appointments, setAppointments] = useState([]);
  const statusOptions = ["All Status", "Confirmed", "Pending", "Cancelled"];

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const fetchedAppointments = await getStoredAppointments();
        setAppointments(fetchedAppointments);
      } catch (error) {
        toast.error("Failed to fetch appointments");
      }
    };

    fetchAppointments();
  }, []);

  const filteredAppointments =
    selectedStatus === "All Status"
      ? appointments
      : appointments.filter((apt) => apt.status === selectedStatus);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-nunito-bold text-green2">Appointments</h1>
        <div className="flex items-center mt-5">
          <PawPrint className="mr-2 text-primary size-7" />
          <p className="text-xl text-primary font-nunito-bold tracking-wide">
            Manage and track all pet appointments
          </p>
        </div>
      </div>

      <div className="relative w-full md:w-64 font-nunito-bold">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="w-full px-4 py-2 bg-green3 text-text rounded-full hover:bg-green3/80 transition-colors border-[1.6px] border-green2 flex items-center justify-between font-nunito"
        >
          <span>{selectedStatus}</span>
          <ChevronDown className="w-4 h-4" />
        </button>

        {isDropdownOpen && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-background/95 border-[1.6px] border-green2 rounded-xl shadow-lg z-50">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => {
                  setSelectedStatus(status);
                  setIsDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-green3/20 text-text transition-colors first:rounded-t-xl last:rounded-b-xl font-nunito"
              >
                {status}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredAppointments.map((appointment) => (
          <AppointmentCard key={appointment.id} appointment={appointment} />
        ))}
      </div>
    </div>
  );
}

export default Appointments;
