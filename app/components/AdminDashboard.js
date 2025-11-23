'use client';

import { useState, useEffect, useMemo } from 'react';
import { Building, FileText, Car, User, Clock, CheckCircle, XCircle, AlertCircle, TrendingUp } from 'lucide-react';
import { storage } from '../utils/storage';

const STATUS_ORDER = ['available', 'booked', 'cancelled', 'holiday'];
const STATUS_COLOR = {
  available: 'bg-green-200',
  booked: 'bg-red-500',
  cancelled: 'bg-yellow-400',
  holiday: 'bg-blue-500'
};

function getDatesRange(days = 7, start = new Date()) {
  const dates = [];
  for (let i = 0; i < days; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    dates.push(d.toISOString().split('T')[0]);
  }
  return dates;
}

export default function AdminDashboard({ user, onLogout }) {

  const [viewModal, setViewModal] = useState({
    open: false,
    permit: null
  });

  const [dotModal, setDotModal] = useState({
    open: false,
    driver: null,
    permit: null,
    status: null,
    date: null,
    hour: null
  });


  // --- Add these handlers ---
  const openViewModal = (permit) => {
    setViewModal({ open: true, permit });
  };

  const closeViewModal = () => {
    setViewModal({ open: false, permit: null });
  };

  const approveFromViewModal = () => {
    if (!viewModal.permit) return;
    openApproveModal(viewModal.permit.id);
    closeViewModal();
  };

  const rejectFromViewModal = () => {
    if (!viewModal.permit) return;
    rejectPermit(viewModal.permit.id);
    closeViewModal();
  };

  const [permits, setPermits] = useState([]);
  const [activeTab, setActiveTab] = useState('overview');

  // heatmap controls
  const [daysRange, setDaysRange] = useState(7);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    loadPermits();
  }, []);

  const loadPermits = () => {
    const storedPermits = storage.get('permits') || [];
    setPermits(storedPermits);
  };

  const savePermits = (updated) => {
    storage.set('permits', updated);
    setPermits(updated);
  };

  const approvePermit = (permitId) => {
    const updatedPermits = permits.map(permit =>
      permit.id === permitId
        ? { ...permit, status: 'approved', approvedAt: new Date().toISOString() }
        : permit
    );
    savePermits(updatedPermits);
  };

  const rejectPermit = (permitId) => {
    const updatedPermits = permits.map(permit =>
      permit.id === permitId
        ? { ...permit, status: 'rejected', approvedAt: new Date().toISOString() }
        : permit
    );
    savePermits(updatedPermits);
  };

  // update schedule status for a specific permit id (or for all permits of a driver)
  const updateHourStatus = (opts) => {
    // opts: { target: 'permit'|'driver', permitId?, driverLicense?, date, hour, newStatus }
    const { target, permitId, driverLicense, date, hour, newStatus } = opts;

    const updated = permits.map(p => {
      // identify which permits to update
      if (target === 'permit' && p.id !== permitId) return p;
      if (target === 'driver' && p.licenseNo !== driverLicense) return p;

      if (!Array.isArray(p.schedule)) return p; // nothing to update

      const newSchedule = p.schedule.map(s => {
        if (s.date === date && s.hour === hour) {
          return { ...s, status: newStatus };
        }
        return s;
      });

      return { ...p, schedule: newSchedule };
    });

    savePermits(updated);
  };

  const [approveModal, setApproveModal] = useState({
    open: false,
    permitId: null,
    start: new Date().toISOString().split("T")[0],
    end: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
      .toISOString().split("T")[0]
  });

  const openApproveModal = (id) => {
    setApproveModal(prev => ({ ...prev, open: true, permitId: id }));
  };

  // Build schedule for every date/hour
  const buildDefaultSchedule = (start, end) => {
    const days = [];
    let current = new Date(start);
    const last = new Date(end);

    while (current <= last) {
      const dateStr = current.toISOString().split("T")[0];

      for (let hour = 0; hour < 24; hour++) {
        days.push({
          date: dateStr,
          hour,
          status: "available"
        });
      }

      current.setDate(current.getDate() + 1);
    }

    return days;
  };

  const finalizeApproval = () => {
    const { permitId, start, end } = approveModal;

    const updated = permits.map(p =>
      p.id === permitId
        ? {
          ...p,
          status: "approved",
          approvedAt: new Date().toISOString(),
          schedule: buildDefaultSchedule(start, end)
        }
        : p
    );

    savePermits(updated);
    setApproveModal({ open: false });
  };


  // derive lists & stats
  const getStats = () => {
    const pending = permits.filter(p => p.status === 'pending').length;
    const approved = permits.filter(p => p.status === 'approved').length;
    const rejected = permits.filter(p => p.status === 'rejected').length;
    const totalVehicles = new Set(permits.map(p => p.vehiclePlate)).size;
    const totalDrivers = new Set(permits.map(p => p.licenseNo)).size;

    return { pending, approved, rejected, totalVehicles, totalDrivers };
  };

  const stats = getStats();

  // drivers list (unique)
  const drivers = useMemo(() => {
    const map = new Map();
    permits.forEach(p => {
      if (!map.has(p.licenseNo)) {
        map.set(p.licenseNo, { licenseNo: p.licenseNo, name: p.driverName });
      }
    });
    return Array.from(map.values());
  }, [permits]);

  // select first driver by default if available
  useEffect(() => {
    if (!selectedDriver && drivers.length > 0) {
      setSelectedDriver(drivers[0].licenseNo);
    }
  }, [drivers, selectedDriver]);

  const dates = getDatesRange(daysRange, new Date(startDate));

  const [filters, setFilters] = useState({
    booked: true,
    holiday: true
  });

  // heatmapMatrix must be defined before filteredHeatmapMatrix
  const heatmapMatrix = useMemo(() => {
    const matrix = {};

    dates.forEach(date => {
      matrix[date] = Array(24).fill(null).map(() => ({
        booked: [],
        holiday: []
      }));
    });

    permits.forEach(p => {
      if (!Array.isArray(p.schedule)) return;

      p.schedule.forEach(slot => {
        if (!matrix[slot.date]) return;

        if (slot.status === "booked" || slot.status === "holiday") {
          matrix[slot.date][slot.hour][slot.status].push({
            permit: p,
            driverName: p.driverName,
            licenseNo: p.licenseNo,
            status: slot.status
          });
        }
      });
    });

    return matrix;
  }, [permits, dates]);

  // Add state for selected borough in heatmap
  const [selectedBorough, setSelectedBorough] = useState('');

  // Get unique boroughs from permits
  const boroughs = useMemo(() => {
    const set = new Set();
    permits.forEach(p => {
      if (p.borough) set.add(p.borough);
    });
    return Array.from(set);
  }, [permits]);

  // Modified heatmapMatrix for borough filter
  const filteredHeatmapMatrix = useMemo(() => {
    if (!selectedBorough) return heatmapMatrix;
    // Only show booked slots for selected borough
    const matrix = {};
    dates.forEach(date => {
      matrix[date] = Array(24).fill(null).map(() => ({
        booked: [],
        holiday: []
      }));
    });
    permits.forEach(p => {
      if (!Array.isArray(p.schedule)) return;
      if (p.borough !== selectedBorough) return;
      p.schedule.forEach(slot => {
        if (!matrix[slot.date]) return;
        if (slot.status === "booked") {
          matrix[slot.date][slot.hour].booked.push({
            permit: p,
            driverName: p.driverName,
            licenseNo: p.licenseNo,
            status: slot.status
          });
        }
      });
    });
    return matrix;
  }, [permits, dates, selectedBorough, heatmapMatrix]);




  // --- Permitmap & LocationMap states ---
  const [permitHour, setPermitHour] = useState(0);
  const [permitShift, setPermitShift] = useState('0-8');
  const [permitDaysRange, setPermitDaysRange] = useState(7);
  const [permitFilters, setPermitFilters] = useState({
    available: true,
    booked: true,
    holiday: true
  });

  // Shift hour ranges
  const SHIFTS = [
    { label: '0-8', start: 0, end: 7 },
    { label: '8-16', start: 8, end: 15 },
    { label: '16-23', start: 16, end: 23 }
  ];

  // Helper to get shift range
  const getShiftRange = (shiftLabel) => {
    const shift = SHIFTS.find(s => s.label === shiftLabel);
    return shift ? [shift.start, shift.end] : [0, 7];
  };

  // Dates for permitmap tab
  const permitMapDates = useMemo(() => getDatesRange(permitDaysRange, new Date(startDate)), [permitDaysRange, startDate]);

  // Build permit heatmap matrix for shifts and filters
  const permitMapMatrix = useMemo(() => {
    const [shiftStart, shiftEnd] = getShiftRange(permitShift);
    const matrix = {};
    permits.forEach(p => {
      if (!Array.isArray(p.schedule)) return;
      matrix[p.id] = {};
      permitMapDates.forEach(date => {
        // Find all slots in the shift for this date
        const slots = p.schedule.filter(s => s.date === date && s.hour >= shiftStart && s.hour <= shiftEnd);
        // Count statuses
        const statusCount = { available: 0, booked: 0, holiday: 0 };
        slots.forEach(s => {
          if (statusCount[s.status] !== undefined) statusCount[s.status]++;
        });
        // Determine display status based on filters and priority: booked > holiday > available
        let displayStatus = null;
        if (permitFilters.booked && statusCount.booked > 0) displayStatus = 'booked';
        else if (permitFilters.holiday && statusCount.holiday > 0) displayStatus = 'holiday';
        else if (permitFilters.available && statusCount.available > 0) displayStatus = 'available';
        matrix[p.id][date] = displayStatus;
      });
    });
    return matrix;
  }, [permits, permitMapDates, permitShift, permitFilters]);

  // --- LocationMap matrix ---
  // const locationMapMatrix = useMemo(() => {
  //   const matrix = {};
  //   permits.forEach(p => {
  //     if (!Array.isArray(p.schedule)) return;
  //     if (!matrix[p.baseNo]) matrix[p.baseNo] = {};
  //     dates.forEach(date => {
  //       if (!matrix[p.baseNo][date]) matrix[p.baseNo][date] = { booked: 0, available: 0, holiday: 0 };
  //       const slot = p.schedule.find(s => s.date === date && s.hour === locationHour);
  //       if (slot) {
  //         if (matrix[p.baseNo][date][slot.status] !== undefined) {
  //           matrix[p.baseNo][date][slot.status]++;
  //         }
  //       }
  //     });
  //   });
  //   return matrix;
  // }, [permits, dates, locationHour]);

  // cycle status helper
  const cycleStatus = (s) => {
    const idx = STATUS_ORDER.indexOf(s);
    const next = (idx + 1) % STATUS_ORDER.length;
    return STATUS_ORDER[next];
  };

  // when admin clicks a cell: toggle status (updates all permits of the driver)
  const handleCellClick = (date, hour) => {
    if (!selectedDriver) return;
    const current = heatmapMatrix[date][hour] || 'available';
    const next = cycleStatus(current);
    // update all permits of the selected driver so admin edits are consistent
    updateHourStatus({ target: 'driver', driverLicense: selectedDriver, date, hour, newStatus: next });
  };

  // small UI to bulk-set a range of hours/day to a particular status for the selected driver
  const bulkUpdate = (date, status) => {
    if (!selectedDriver) return;
    for (let hour = 0; hour < 24; hour++) {
      updateHourStatus({ target: 'driver', driverLicense: selectedDriver, date, hour, newStatus: status });
    }
  };

  // Vehicles & Drivers lists (unique)
  const getVehiclesList = () => {
    const vehiclesMap = new Map();
    permits.forEach(permit => {
      if (!vehiclesMap.has(permit.vehiclePlate)) {
        vehiclesMap.set(permit.vehiclePlate, {
          plate: permit.vehiclePlate,
          vin: permit.vehicleVin,
          make: permit.vehicleMake,
          model: permit.vehicleModel,
          year: permit.vehicleYear,
          status: permit.status
        });
      }
    });
    return Array.from(vehiclesMap.values());
  };

  const vehiclesList = getVehiclesList();

  // --- Vehicle search states ---
  const [vehicleSearchLicense, setVehicleSearchLicense] = useState('');
  const [vehicleSearchName, setVehicleSearchName] = useState('');
  const [vehicleSearchVin, setVehicleSearchVin] = useState('');
  const [vehicleSearchPlate, setVehicleSearchPlate] = useState('');
  const [vehicleSearchPermitId, setVehicleSearchPermitId] = useState('');

  // Helper: get driver info for a vehicle
  const getDriverInfoForVehicle = (plate) => {
    const permit = permits.find(p => p.vehiclePlate === plate);
    if (!permit) return {};
    // Driver status logic (example: based on licenseExpiry)
    let driverStatus = 'ACTIVE';
    if (permit.licenseExpiry && new Date(permit.licenseExpiry) < new Date()) driverStatus = 'EXPIRED';
    if (permit.driverSuspended) driverStatus = 'SUSPENDED';
    return {
      name: permit.driverName,
      licenseNo: permit.licenseNo,
      driverStatus,
      permitExpiry: permit.schedule && permit.schedule.length > 0
        ? permit.schedule[permit.schedule.length - 1].date
        : '',
      violations: permit.violations || []
    };
  };

  // Filter vehicles by search
  const filteredVehiclesList = useMemo(() => {
    return vehiclesList.filter(vehicle => {
      const driverInfo = getDriverInfoForVehicle(vehicle.plate);
      const matchLicense = vehicleSearchLicense === '' || (driverInfo.licenseNo && driverInfo.licenseNo.toLowerCase().includes(vehicleSearchLicense.toLowerCase()));
      const matchName = vehicleSearchName === '' || (driverInfo.name && driverInfo.name.toLowerCase().includes(vehicleSearchName.toLowerCase()));
      const matchVin = vehicleSearchVin === '' || (vehicle.vin && vehicle.vin.toLowerCase().includes(vehicleSearchVin.toLowerCase()));
      const matchPlate = vehicleSearchPlate === '' || (vehicle.plate && vehicle.plate.toLowerCase().includes(vehicleSearchPlate.toLowerCase()));
      // Find permit for this vehicle
      const permit = permits.find(p => p.vehiclePlate === vehicle.plate);
      const matchPermitId = vehicleSearchPermitId === '' || (permit && permit.id && permit.id.toLowerCase().includes(vehicleSearchPermitId.toLowerCase()));
      return matchLicense && matchName && matchVin && matchPlate && matchPermitId;
    });
  }, [vehiclesList, vehicleSearchLicense, vehicleSearchName, vehicleSearchVin, vehicleSearchPlate, vehicleSearchPermitId, permits]);

  // --- Driver search states ---
  const [driverSearchLicense, setDriverSearchLicense] = useState('');
  const [driverSearchName, setDriverSearchName] = useState('');
  const [driverSearchQR, setDriverSearchQR] = useState('');

  // Filter drivers by search
  const filteredDrivers = useMemo(() => {
    return drivers.filter(driver => {
      const matchLicense = driverSearchLicense === '' || (driver.licenseNo && driver.licenseNo.toLowerCase().includes(driverSearchLicense.toLowerCase()));
      const matchName = driverSearchName === '' || (driver.name && driver.name.toLowerCase().includes(driverSearchName.toLowerCase()));
      // QR/scan: match against licenseNo or name (simulate QR value)
      const matchQR = driverSearchQR === '' || (driver.licenseNo && driver.licenseNo.toLowerCase().includes(driverSearchQR.toLowerCase())) || (driver.name && driver.name.toLowerCase().includes(driverSearchQR.toLowerCase()));
      return matchLicense && matchName && matchQR;
    });
  }, [drivers, driverSearchLicense, driverSearchName, driverSearchQR]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-green-50">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm rounded-b-xl mb-2">
        <div className="max-w-7xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-extrabold text-blue-800 tracking-wide drop-shadow">TLC Admin Dashboard</h1>
          <button
            onClick={onLogout}
            className="px-4 py-2 text-sm text-white bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 rounded-lg shadow transition-colors font-semibold"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          {/* Card Example */}
          <div className="bg-gradient-to-br from-orange-50 to-white p-6 rounded-xl shadow-lg border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-orange-700 font-semibold">Pending</p>
                <p className="text-3xl font-extrabold text-orange-600">{stats.pending}</p>
              </div>
              <Clock className="w-10 h-10 text-orange-500" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-white p-6 rounded-xl shadow-lg border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-700 font-semibold">Approved</p>
                <p className="text-3xl font-extrabold text-green-600">{stats.approved}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-500" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-xl shadow-lg border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-700 font-semibold">Rejected</p>
                <p className="text-3xl font-extrabold text-red-600">{stats.rejected}</p>
              </div>
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-white p-6 rounded-xl shadow-lg border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-700 font-semibold">Total Vehicles</p>
                <p className="text-3xl font-extrabold text-blue-600">{stats.totalVehicles}</p>
              </div>
              <Car className="w-10 h-10 text-blue-500" />
            </div>
          </div>
          <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-xl shadow-lg border border-indigo-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-indigo-700 font-semibold">Total Drivers</p>
                <p className="text-3xl font-extrabold text-indigo-600">{stats.totalDrivers}</p>
              </div>
              <User className="w-10 h-10 text-indigo-500" />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-lg mb-6 border border-gray-100">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6 bg-gradient-to-r from-blue-50 via-green-50 to-purple-50 rounded-t-xl">
              {['overview', 'permits', 'heatmap', 'permitmap', 'vehicles', 'drivers'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-1 border-b-2 font-semibold text-sm transition-all duration-150 ${
                    activeTab === tab
                      ? 'border-blue-500 text-blue-700 bg-gradient-to-r from-blue-100 to-green-100 shadow'
                      : 'border-transparent text-gray-500 hover:text-blue-600 hover:border-blue-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6 bg-gradient-to-br from-white via-blue-50 to-green-50 rounded-b-xl">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <h2 className="text-xl font-extrabold text-blue-800 mb-2">System Overview</h2>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-blue-50 p-6 rounded-lg shadow border border-blue-100">
                    <h3 className="font-semibold text-blue-800 mb-4">Quick Metrics</h3>
                    <div className="space-y-3 text-sm text-black">
                      <div className="flex justify-between"><span>Pending</span><strong>{stats.pending}</strong></div>
                      <div className="flex justify-between"><span>Approved</span><strong>{stats.approved}</strong></div>
                      <div className="flex justify-between"><span>Rejected</span><strong>{stats.rejected}</strong></div>
                      <div className="flex justify-between"><span>Total Vehicles</span><strong>{stats.totalVehicles}</strong></div>
                    </div>
                  </div>
                  <div className="bg-green-50 p-6 rounded-lg shadow border border-green-100">
                    <h3 className="font-semibold text-green-800 mb-4">Recent Activity</h3>
                    <div className="space-y-2 text-sm text-black">
                      {permits.slice().reverse().slice(0, 5).map(p => (
                        <div key={p.id} className="flex justify-between">
                          <div>
                            <div className="font-semibold">{p.driverName}</div>
                            <div className="text-xs text-black">{p.vehiclePlate} — {p.licenseNo}</div>
                          </div>
                          <div className="text-sm text-black">{new Date(p.submittedAt).toLocaleDateString()}</div>
                        </div>
                      ))}
                      {permits.length === 0 && <p className="text-black">No recent activity</p>}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Permits Tab */}
            {activeTab === 'permits' && (
              <div>
                <h2 className="text-xl font-extrabold text-blue-800 mb-4">Permit Requests</h2>
                {viewModal.open && viewModal.permit && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                      {/* Fleet Owner Information */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                          <Building className="w-5 h-5 mr-2 text-blue-600" />
                          Fleet Owner Information
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4 grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Owner Name</p>
                            <p className="font-semibold text-gray-900">{viewModal.permit.fleetOwnerName}</p>
                          </div>
                          {viewModal.permit.fleetOwnerEmail && (
                            <div>
                              <p className="text-gray-600">Email</p>
                              <p className="font-semibold text-gray-900">{viewModal.permit.fleetOwnerEmail}</p>
                            </div>
                          )}
                          {viewModal.permit.fleetOwnerPhone && (
                            <div>
                              <p className="text-gray-600">Phone</p>
                              <p className="font-semibold text-gray-900">{viewModal.permit.fleetOwnerPhone}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-gray-600">Company Name</p>
                            <p className="font-semibold text-gray-900">{viewModal.permit.fleetCompanyName}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Base Number</p>
                            <p className="font-semibold text-gray-900">{viewModal.permit.baseNo}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Borough</p>
                            <p className="font-semibold text-gray-900">{viewModal.permit.borough}</p>
                          </div>
                        </div>
                      </div>
                      {/* Driver & License Information */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                          <User className="w-5 h-5 mr-2 text-green-600" />
                          Driver & License Information
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4 grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Driver Name</p>
                            <p className="font-semibold text-gray-900">{viewModal.permit.driverName}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">License Number</p>
                            <p className="font-semibold text-gray-900">{viewModal.permit.licenseNo}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">License Expiry</p>
                            <p className="font-semibold text-gray-900">
                              {viewModal.permit.licenseExpiry ? new Date(viewModal.permit.licenseExpiry).toLocaleDateString() : ''}
                            </p>
                          </div>
                          {viewModal.permit.driverPhone && (
                            <div>
                              <p className="text-gray-600">Phone</p>
                              <p className="font-semibold text-gray-900">{viewModal.permit.driverPhone}</p>
                            </div>
                          )}
                          {viewModal.permit.driverEmail && (
                            <div>
                              <p className="text-gray-600">Email</p>
                              <p className="font-semibold text-gray-900">{viewModal.permit.driverEmail}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Vehicle Information */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                          <Car className="w-5 h-5 mr-2 text-purple-600" />
                          Vehicle Information
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4 grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Plate Number</p>
                            <p className="font-semibold text-gray-900">{viewModal.permit.vehiclePlate}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">VIN</p>
                            <p className="font-semibold text-gray-900">{viewModal.permit.vehicleVin}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Make & Model</p>
                            <p className="font-semibold text-gray-900">
                              {viewModal.permit.vehicleMake} {viewModal.permit.vehicleModel}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Year</p>
                            <p className="font-semibold text-gray-900">{viewModal.permit.vehicleYear}</p>
                          </div>
                          {viewModal.permit.vehicleColor && (
                            <div>
                              <p className="text-gray-600">Color</p>
                              <p className="font-semibold text-gray-900">{viewModal.permit.vehicleColor}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Insurance Information */}
                      <div>
                        <h3 className="text-lg font-bold text-gray-800 mb-3 flex items-center">
                          <FileText className="w-5 h-5 mr-2 text-orange-600" />
                          Insurance Information
                        </h3>
                        <div className="bg-gray-50 rounded-xl p-4 grid md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Policy Number</p>
                            <p className="font-semibold text-gray-900">{viewModal.permit.insurancePolicy}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Carrier</p>
                            <p className="font-semibold text-gray-900">{viewModal.permit.insuranceCarrier}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Expiry Date</p>
                            <p className="font-semibold text-gray-900">
                              {viewModal.permit.insuranceExpiry ? new Date(viewModal.permit.insuranceExpiry).toLocaleDateString() : ''}
                            </p>
                          </div>
                          {viewModal.permit.insuranceCoverage && (
                            <div>
                              <p className="text-gray-600">Coverage Amount</p>
                              <p className="font-semibold text-gray-900">{viewModal.permit.insuranceCoverage}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      {/* Next Steps */}
                      <div className="bg-blue-50 border-l-4 border-blue-600 p-4 rounded mt-4">
                        <h4 className="font-semibold text-blue-900 mb-2">Next Steps</h4>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                          <li>Your permit request is now pending review by TLC admin</li>
                          <li>You will be notified once the admin reviews your application</li>
                          <li>Please keep your contact information updated</li>
                        </ul>
                      </div>
                      {/* Modal Actions */}
                      <div className="flex justify-end gap-2 mt-6">
                        <button
                          onClick={closeViewModal}
                          className="px-4 py-2 bg-gray-200 rounded text-black"
                        >
                          Close
                        </button>
                        <button
                          onClick={approveFromViewModal}
                          className="px-4 py-2 bg-green-600 rounded text-black"
                        >
                          Approve
                        </button>
                        <button
                          onClick={rejectFromViewModal}
                          className="px-4 py-2 bg-red-600 rounded text-black"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Approve Modal */}
                {approveModal.open && (
                  <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96">
                      <h3 className="text-lg font-bold mb-4 text-gray-800">Set Permit Validity</h3>

                      <label className="text-sm text-gray-700">Start Date</label>
                      <input
                        type="date"
                        value={approveModal.start ?? ''}
                        onChange={e => {
                          const newStart = e.target.value;
                          const newEnd = new Date(newStart);
                          newEnd.setFullYear(newEnd.getFullYear() + 1);
                          setApproveModal(prev => ({
                            ...prev,
                            start: newStart,
                            end: newEnd.toISOString().split('T')[0]
                          }));
                        }}
                        className="w-full px-3 py-2 border rounded mb-3 text-black"
                      />

                      <label className="text-sm text-gray-700">End Date</label>
                      <input
                        type="date"
                        value={approveModal.end ?? ''}
                        onChange={(e) => setApproveModal(prev => ({ ...prev, end: e.target.value }))}
                        className="w-full px-3 py-2 border rounded mb-4 text-black"
                      />

                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setApproveModal({ open: false })}
                          className="px-4 py-2 bg-gray-200 rounded text-black"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={finalizeApproval}
                          className="px-4 py-2 bg-green-600 rounded text-black"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  {permits.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <AlertCircle className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                      <p>No permit requests yet</p>
                    </div>
                  ) : (
                    permits.map(permit => (
                      <div key={permit.id} className="border border-gray-200 rounded-lg p-4 bg-gradient-to-r from-white via-blue-50 to-green-50 hover:shadow-lg transition-shadow">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="font-semibold text-gray-800">{permit.driverName}</h3>
                            <p className="text-sm text-gray-600">License: {permit.licenseNo}</p>
                            <p className="text-sm text-gray-600">Vehicle: {permit.vehiclePlate} ({permit.vehicleMake} {permit.vehicleModel})</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${permit.status === 'pending'
                            ? 'bg-orange-100 text-orange-700'
                            : permit.status === 'approved'
                              ? 'bg-green-100 text-green-700'
                              : 'bg-red-100 text-red-700'
                            }`}>
                            {permit.status.toUpperCase()}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                          <div>
                            <p className="text-gray-600">Insurance: {permit.insurancePolicy}</p>
                            <p className="text-gray-600">Base: {permit.baseNo}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Borough: {permit.borough}</p>
                            <p className="text-gray-600">
                              Submitted: {new Date(permit.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>

                        {permit.status === 'pending' && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => openViewModal(permit)}
                              className="flex-1 bg-blue-600 text-gray-900 py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center"
                            >
                              <AlertCircle className="w-4 h-4 mr-2" />View
                            </button>
                            {/* NEW — approve opens modal */}
                            <button
                              onClick={() => openApproveModal(permit.id)}
                              className="flex-1 bg-green-600 text-gray-900 py-2 px-4 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />Approve
                            </button>

                            <button
                              onClick={() => rejectPermit(permit.id)}
                              className="flex-1 bg-red-600 text-gray-900 py-2 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                            >
                              <XCircle className="w-4 h-4 mr-2" />Reject
                            </button>

                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}


            {activeTab === 'heatmap' && (
              <div>

                {/* HEADER */}
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-blue-800">Driver Availability Heatmap</h2>
                    <p className="text-sm text-gray-600">Each dot = 1 driver</p>
                  </div>

                  <div className="flex flex-wrap gap-4 items-center bg-gradient-to-r from-blue-50 to-green-50 p-2 rounded-lg shadow">
                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-blue-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="px-3 py-2 text-black border-2 border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all shadow-sm bg-gradient-to-r from-blue-50 to-white placeholder-gray-400"
                      />
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-green-700 mb-1">Days</label>
                      <select
                        value={daysRange}
                        onChange={(e) => setDaysRange(Number(e.target.value))}
                        className="px-3 py-2 border-2 border-green-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition-all shadow-sm bg-gradient-to-r from-green-50 to-white"
                      >
                        <option value={7}>7</option>
                        <option value={14}>14</option>
                        <option value={21}>21</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-purple-700 mb-1">Borough</label>
                      <select
                        value={selectedBorough}
                        onChange={e => setSelectedBorough(e.target.value)}
                        className="px-3 py-2 border-2 border-purple-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all shadow-sm bg-gradient-to-r from-purple-50 to-white"
                      >
                        <option value="">All</option>
                        {boroughs.map(b => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-gray-700 mb-1">Filters</label>
                      <div className="flex space-x-3">
                        {["booked", "holiday"].map(st => (
                          <label key={st} className="flex items-center space-x-1 text-sm text-black">
                            <input
                              type="checkbox"
                              checked={filters[st]}
                              onChange={() =>
                                setFilters(prev => ({ ...prev, [st]: !prev[st] }))
                              }
                            />
                            <span className="capitalize">{st}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* HEATMAP TABLE */}
                <div className="overflow-x-auto border rounded-lg">
                  <table className="border-collapse w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-2 border text-xs sticky left-0 bg-gray-50 text-black">Hour</th>

                        {dates.map(date => (
                          <th
                            key={date}
                            className="p-2 border text-xs text-center text-black"
                          >
                            {date}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {[0, 8, 16].map(hour => (
                        <tr key={hour} className="hover:bg-gray-50 text-black">

                          {/* Hour label */}
                          <td className="p-1 border text-xs font-semibold sticky left-0 bg-white">
                            {hour}:00 - {hour + 8}:00
                          </td>

                          {dates.map(date => {
                            const cell = filteredHeatmapMatrix[date][hour];
                            return (
                              <td
                                key={`${date}-${hour}`}
                                className="w-20 h-16 border relative cursor-pointer bg-white"
                                onClick={() => handleCellClick(date, hour)}
                              >
                                <div className="absolute inset-0 flex flex-wrap p-1 gap-1">
                                  {Object.entries(cell)
                                    .filter(([status, arr]) =>
                                      arr.length > 0 &&
                                      (!selectedBorough
                                        ? filters[status]
                                        : status === "booked")
                                    )
                                    .flatMap(([status, arr]) =>
                                      arr.map((info, i) => (
                                        <div key={`${status}-${i}`} className="relative group">
                                          {/* Use a circle icon for the dot */}
                                          <span
                                            onClick={e => {
                                              e.stopPropagation();
                                              setDotModal({
                                                open: true,
                                                driver: info.driverName,
                                                permit: info.permit,
                                                status,
                                                date,
                                                hour
                                              });
                                            }}
                                            className={`flex items-center justify-center w-5 h-5 rounded-full border border-black/30 cursor-pointer ${STATUS_COLOR[status]}`}
                                            title={`${info.driverName} (${status})`}
                                          >
                                            <svg width="14" height="14" viewBox="0 0 14 14" className="block">
                                              <circle cx="7" cy="7" r="6" fill="currentColor" />
                                            </svg>
                                          </span>
                                          {/* Elegant tooltip on hover */}
                                          <div className="absolute z-10 left-6 top-0 hidden group-hover:flex flex-col min-w-[220px] bg-white border border-gray-200 shadow-lg rounded-lg p-3 text-xs text-black"
                                            style={{ pointerEvents: 'none' }}
                                          >
                                            <div className="font-bold text-blue-700 mb-1">{info.driverName}</div>
                                            <div><span className="font-semibold">License:</span> {info.licenseNo}</div>
                                            <div><span className="font-semibold">Vehicle:</span> {info.permit.vehiclePlate}</div>
                                            <div><span className="font-semibold">Permit ID:</span> {info.permit.id}</div>
                                            <div><span className="font-semibold">Status:</span> <span className={`font-bold ${STATUS_COLOR[status]}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span></div>
                                            <div><span className="font-semibold">Date:</span> {date}</div>
                                            <div><span className="font-semibold">Hour:</span> {hour}:00</div>
                                          </div>
                                        </div>
                                      ))
                                    )}
                                </div>
                              </td>
                            );
                          })}

                        </tr>
                      ))}
                    </tbody>

                  </table>
                </div>

                {/* LEGEND */}
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-red-500 rounded-sm inline-block" />
                    <span className="text-sm text-black">Booked</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-blue-500 rounded-sm inline-block" />
                    <span className="text-sm text-black">Holiday</span>
                  </div>
                </div>


              </div>
            )}

            {/* Permitmap Tab */}
            {activeTab === 'permitmap' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-blue-800">Permitmap</h2>
                    <p className="text-sm text-gray-600">Shows slot status for each permit by shift.</p>
                  </div>
                  <div className="flex flex-wrap gap-4 items-center bg-gradient-to-r from-blue-50 to-green-50 p-2 rounded-lg shadow">
                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-blue-700 mb-1">Shift</label>
                      <select
                        value={permitShift}
                        onChange={e => setPermitShift(e.target.value)}
                        className="px-3 py-2 border-2 border-blue-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all shadow-sm bg-gradient-to-r from-blue-50 to-white"
                      >
                        {SHIFTS.map(s => (
                          <option key={s.label} value={s.label}>{s.label.replace('-', ':00 - ') + ':00'}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-green-700 mb-1">Days</label>
                      <select
                        value={permitDaysRange}
                        onChange={e => setPermitDaysRange(Number(e.target.value))}
                        className="px-3 py-2 border-2 border-green-300 text-black rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400 transition-all shadow-sm bg-gradient-to-r from-green-50 to-white"
                      >
                        <option value={7}>7</option>
                        <option value={14}>14</option>
                        <option value={21}>21</option>
                      </select>
                    </div>
                    <div className="flex flex-col">
                      <label className="text-xs font-semibold text-gray-700 mb-1">Filters</label>
                      <div className="flex space-x-3">
                        {["available", "booked", "holiday"].map(st => (
                          <label key={st} className="flex items-center space-x-1 text-sm text-black">
                            <input
                              type="checkbox"
                              checked={permitFilters[st]}
                              onChange={() =>
                                setPermitFilters(prev => ({ ...prev, [st]: !prev[st] }))
                              }
                            />
                            <span className="capitalize">{st}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto border rounded-lg">
                  <table className="border-collapse w-full">
                    <thead>
                      <tr className="bg-gray-50">
                        <th className="p-2 border text-xs sticky left-0 bg-gray-50 text-black">Permit</th>
                        {permitMapDates.map(date => (
                          <th key={date} className="p-2 border text-xs text-center text-black">{date}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {permits.map(p => (
                        <tr key={p.id} className="hover:bg-gray-50 text-black">
                          <td className="p-1 border text-xs font-semibold sticky left-0 bg-white">
                            {p.driverName} <span className="text-xs text-gray-500">({p.vehiclePlate})</span>
                          </td>
                          {permitMapDates.map(date => {
                            const status = permitMapMatrix[p.id][date];
                            return (
                              <td key={date} className={`w-16 h-10 border text-center`}>
                                {status ? (
                                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${STATUS_COLOR[status]}`}>
                                    {status.charAt(0).toUpperCase() + status.slice(1)}
                                  </span>
                                ) : (
                                  <span className="text-xs text-gray-400">-</span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex items-center space-x-4 mt-2">
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-green-200 rounded-sm inline-block" />
                    <span className="text-sm text-black">Available</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-red-500 rounded-sm inline-block" />
                    <span className="text-sm text-black">Booked</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="w-4 h-4 bg-blue-500 rounded-sm inline-block" />
                    <span className="text-sm text-black">Holiday</span>
                  </div>
                </div>
              </div>
            )}

            {/* Vehicles Tab */}
            {activeTab === 'vehicles' && (
              <div>
                <h2 className="text-xl font-extrabold text-blue-800 mb-4">Vehicle Details</h2>
                {/* Search Inputs */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-blue-700 mb-1 tracking-wide drop-shadow">
                      Search by License #
                    </label>
                    <input
                      type="text"
                      value={vehicleSearchLicense}
                      onChange={e => setVehicleSearchLicense(e.target.value)}
                      className="px-4 py-2 border-2 border-blue-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all shadow-sm bg-gradient-to-r from-blue-50 to-white placeholder-gray-400"
                      placeholder="License #"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-green-700 mb-1 tracking-wide drop-shadow">
                      Search by Name
                    </label>
                    <input
                      type="text"
                      value={vehicleSearchName}
                      onChange={e => setVehicleSearchName(e.target.value)}
                      className="px-4 py-2 border-2 border-green-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-green-400 transition-all shadow-sm bg-gradient-to-r from-green-50 to-white placeholder-gray-400"
                      placeholder="Driver Name"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-purple-700 mb-1 tracking-wide drop-shadow">
                      Search by VIN
                    </label>
                    <input
                      type="text"
                      value={vehicleSearchVin}
                      onChange={e => setVehicleSearchVin(e.target.value)}
                      className="px-4 py-2 border-2 border-purple-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all shadow-sm bg-gradient-to-r from-purple-50 to-white placeholder-gray-400"
                      placeholder="VIN"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-indigo-700 mb-1 tracking-wide drop-shadow">
                      Search by Plate
                    </label>
                    <input
                      type="text"
                      value={vehicleSearchPlate}
                      onChange={e => setVehicleSearchPlate(e.target.value)}
                      className="px-4 py-2 border-2 border-indigo-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-indigo-400 transition-all shadow-sm bg-gradient-to-r from-indigo-50 to-white placeholder-gray-400"
                      placeholder="Plate"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-pink-700 mb-1 tracking-wide drop-shadow">
                      Search by Permit #
                    </label>
                    <input
                      type="text"
                      value={vehicleSearchPermitId}
                      onChange={e => setVehicleSearchPermitId(e.target.value)}
                      className="px-4 py-2 border-2 border-pink-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-pink-400 transition-all shadow-sm bg-gradient-to-r from-pink-50 to-white placeholder-gray-400"
                      placeholder="Permit #"
                    />
                  </div>
                </div>
                {filteredVehiclesList.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <Car className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No vehicles registered yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-gradient-to-r from-blue-100 via-green-100 to-purple-100">
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase rounded-tl-lg shadow-sm">Plate</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase shadow-sm">VIN</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase shadow-sm">Make/Model</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase shadow-sm">Year</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase shadow-sm">Driver Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase shadow-sm">License #</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase shadow-sm">Driver Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase shadow-sm">Permit Expiry</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase shadow-sm">Violations</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase rounded-tr-lg shadow-sm">Permit Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredVehiclesList.map((vehicle, index) => {
              const driverInfo = getDriverInfoForVehicle(vehicle.plate);
              return (
                <tr key={index} className="bg-white hover:bg-blue-50 transition-shadow shadow rounded-lg">
                  <td className="px-6 py-3 text-sm font-semibold text-blue-900">{vehicle.plate}</td>
                  <td className="px-6 py-3 text-sm text-purple-900">{vehicle.vin}</td>
                  <td className="px-6 py-3 text-sm text-gray-800">{vehicle.make} <span className="font-semibold">{vehicle.model}</span></td>
                  <td className="px-6 py-3 text-sm text-gray-700">{vehicle.year}</td>
                  <td className="px-6 py-3 text-sm text-green-900 font-semibold">{driverInfo.name || '-'}</td>
                  <td className="px-6 py-3 text-sm text-blue-900">{driverInfo.licenseNo || '-'}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold shadow ${
                      driverInfo.driverStatus === 'ACTIVE' ? 'bg-green-200 text-green-800 border border-green-400'
                      : driverInfo.driverStatus === 'SUSPENDED' ? 'bg-yellow-200 text-yellow-800 border border-yellow-400'
                      : 'bg-red-200 text-red-800 border border-red-400'
                    }`}>
                      {driverInfo.driverStatus}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm text-gray-900">
                    {driverInfo.permitExpiry || '-'}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {driverInfo.violations && driverInfo.violations.length > 0 ? (
                      <span className="px-2 py-1 rounded bg-red-100 text-red-700 font-semibold shadow">
                        {driverInfo.violations.join(', ')}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold shadow ${
                      vehicle.status === 'approved' ? 'bg-green-100 text-green-700 border border-green-400'
                      : vehicle.status === 'pending' ? 'bg-orange-100 text-orange-700 border border-orange-400'
                      : 'bg-red-100 text-red-700 border border-red-400'
                    }`}>
                      {vehicle.status.charAt(0).toUpperCase() + vehicle.status.slice(1)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
                )}
              </div>
            )}

            {/* Drivers Tab */}
            {activeTab === 'drivers' && (
              <div>
                <h2 className="text-xl font-extrabold text-blue-800 mb-4">Driver Details</h2>
                {/* Search Inputs */}
                <div className="flex flex-wrap gap-4 mb-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-blue-700 mb-1 tracking-wide drop-shadow">
                      Search by License #
                    </label>
                    <input
                      type="text"
                      value={driverSearchLicense}
                      onChange={e => setDriverSearchLicense(e.target.value)}
                      className="px-4 py-2 border-2 border-blue-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-blue-400 transition-all shadow-sm bg-gradient-to-r from-blue-50 to-white placeholder-gray-400"
                      placeholder="License #"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-green-700 mb-1 tracking-wide drop-shadow">
                      Search by Name
                    </label>
                    <input
                      type="text"
                      value={driverSearchName}
                      onChange={e => setDriverSearchName(e.target.value)}
                      className="px-4 py-2 border-2 border-green-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-green-400 transition-all shadow-sm bg-gradient-to-r from-green-50 to-white placeholder-gray-400"
                      placeholder="Driver Name"
                    />
                  </div>
                  <div className="flex flex-col">
                    <label className="text-sm font-semibold text-purple-700 mb-1 tracking-wide drop-shadow">
                      Search by QR/Scan
                    </label>
                    <input
                      type="text"
                      value={driverSearchQR}
                      onChange={e => setDriverSearchQR(e.target.value)}
                      className="px-4 py-2 border-2 border-purple-300 rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-purple-400 transition-all shadow-sm bg-gradient-to-r from-purple-50 to-white placeholder-gray-400"
                      placeholder="QR/Scan"
                    />
                  </div>
                </div>
                {filteredDrivers.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <User className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                    <p>No drivers registered yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full border-separate border-spacing-y-2">
          <thead>
            <tr className="bg-gradient-to-r from-blue-100 via-green-100 to-purple-100">
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase rounded-tl-lg shadow-sm">Name</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase shadow-sm">License No</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase shadow-sm">License Expiry</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase shadow-sm">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase shadow-sm">Email</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase shadow-sm">Status</th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase rounded-tr-lg shadow-sm">Violations</th>
            </tr>
          </thead>
          <tbody>
            {filteredDrivers.map((d, i) => {
              // Find permit for this driver to get extra info
              const permit = permits.find(p => p.licenseNo === d.licenseNo);
              const expiry = permit && permit.licenseExpiry
                ? new Date(permit.licenseExpiry).toLocaleDateString()
                : '-';
              const phone = permit && permit.driverPhone ? permit.driverPhone : '-';
              const email = permit && permit.driverEmail ? permit.driverEmail : '-';
              let driverStatus = 'ACTIVE';
              if (permit && permit.licenseExpiry && new Date(permit.licenseExpiry) < new Date()) driverStatus = 'EXPIRED';
              if (permit && permit.driverSuspended) driverStatus = 'SUSPENDED';
              const violations = permit && permit.violations && permit.violations.length > 0
                ? permit.violations.join(', ')
                : '-';
              return (
                <tr key={i} className="bg-white hover:bg-blue-50 transition-shadow shadow rounded-lg">
                  <td className="px-6 py-3 text-sm font-semibold text-green-900">{d.name}</td>
                  <td className="px-6 py-3 text-sm text-blue-900">{d.licenseNo}</td>
                  <td className="px-6 py-3 text-sm text-purple-900">{expiry}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">{phone}</td>
                  <td className="px-6 py-3 text-sm text-gray-900">{email}</td>
                  <td className="px-6 py-3 text-sm">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold shadow ${
                      driverStatus === 'ACTIVE' ? 'bg-green-200 text-green-800 border border-green-400'
                      : driverStatus === 'SUSPENDED' ? 'bg-yellow-200 text-yellow-800 border border-yellow-400'
                      : 'bg-red-200 text-red-800 border border-red-400'
                    }`}>
                      {driverStatus}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-sm">
                    {violations !== '-' ? (
                      <span className="px-2 py-1 rounded bg-red-100 text-red-700 font-semibold shadow">
                        {violations}
                      </span>
                    ) : (
                      <span className="text-gray-400">-</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
                )}
              </div>
            )}

            {dotModal.open && (
              <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
                <div className="bg-white p-6 rounded-lg shadow-xl w-96 text-black">

                  <h2 className="text-lg font-bold mb-3">{dotModal.status.toUpperCase()} Slot</h2>

                  <p><strong>Driver:</strong> {dotModal.driver}</p>
                  <p><strong>License:</strong> {dotModal.permit.licenseNo}</p>
                  <p><strong>Vehicle:</strong> {dotModal.permit.vehiclePlate}</p>
                  <p><strong>Permit ID:</strong> {dotModal.permit.id}</p>

                  <p className="mt-2">
                    <strong>Date:</strong> {dotModal.date}
                  </p>
                  <p>
                    <strong>Hour:</strong> {dotModal.hour}:00
                  </p>

                  <div className="flex justify-end mt-4">
                    <button
                      onClick={() => setDotModal({ open: false })}
                      className="px-4 py-2 bg-gray-200 rounded"
                    >
                      Close
                    </button>
                  </div>

                </div>
              </div>
            )}


          </div>
        </div>
      </div>
    </div>
  );
}
