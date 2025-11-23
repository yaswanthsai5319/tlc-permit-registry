// app/schedule/page.jsx
'use client';

import { useEffect, useMemo, useState } from 'react';
import { storage } from '../utils/storage';
import { CheckCircle, X } from 'lucide-react';

const SHIFT_OPTIONS = [
  { id: 'shift0', label: '00:00 - 08:00', hours: [0,1,2,3,4,5,6,7] },
  { id: 'shift1', label: '08:00 - 16:00', hours: [8,9,10,11,12,13,14,15] },
  { id: 'shift2', label: '16:00 - 24:00', hours: [16,17,18,19,20,21,22,23] }
];

const ACTION_MAP = {
  work: 'booked',
  cancel: 'cancelled',
  holiday: 'holiday'
};

const detectExistingShift = (schedule, date) => {
  if (!schedule) return null;

  const shiftMap = {
    shift0: [0,1,2,3,4,5,6,7],
    shift1: [8,9,10,11,12,13,14,15],
    shift2: [16,17,18,19,20,21,22,23]
  };

  for (const key of Object.keys(shiftMap)) {
    const hours = shiftMap[key];
    const matching = schedule.filter(s => s.date === date && hours.includes(s.hour));

    if (matching.some(m => m.status !== "available")) {
      return key;
    }
  }

  return null;
};

export default function SchedulePage() {
  const [permits, setPermits] = useState([]);
  const [selectedPermitId, setSelectedPermitId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState(SHIFT_OPTIONS[0].id);
  const [selectedAction, setSelectedAction] = useState('work');
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const stored = storage.get('permits') || [];
    setPermits(stored);
  }, []);

  const approvedPermits = useMemo(() => {
    return permits.filter(p => p.status === 'approved');
  }, [permits]);

  const selectedPermit = useMemo(() => {
    return permits.find(p => p.id === selectedPermitId) || null;
  }, [permits, selectedPermitId]);

  const availableDates = useMemo(() => {
    if (!selectedPermit) return [];
    const set = new Set(selectedPermit.schedule.map(s => s.date));
    return Array.from(set).sort();
  }, [selectedPermit]);

  const currentShift = useMemo(() => {
    return SHIFT_OPTIONS.find(s => s.id === selectedShiftId);
  }, [selectedShiftId]);

  const shiftPreview = useMemo(() => {
    if (!selectedPermit || !selectedDate) return null;

    const lookup = {};
    selectedPermit.schedule.forEach(slot => {
      if (slot.date === selectedDate) lookup[slot.hour] = slot.status;
    });

    return currentShift.hours.map(h => ({
      hour: h,
      status: lookup[h] || 'available'
    }));
  }, [selectedPermit, selectedDate, currentShift]);

  const savePermits = (updatedPermits) => {
    storage.set('permits', updatedPermits);
    setPermits(updatedPermits);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessage(null);

    if (!selectedPermit)
      return setMessage({ type: 'error', text: 'Please select a permit.' });

    if (!selectedDate)
      return setMessage({ type: 'error', text: 'Please select a date.' });

    const existingShift = detectExistingShift(selectedPermit.schedule, selectedDate);
    if (existingShift) {
      return setMessage({
        type: 'error',
        text: `A shift is already booked for this date (${existingShift}).`
      });
    }

    setSubmitting(true);

    const newStatus = ACTION_MAP[selectedAction];

    const updatedPermits = permits.map(p => {
      if (p.id !== selectedPermitId) return p;

      let schedule = [...p.schedule];

      const existingHours = new Set(
        schedule.filter(s => s.date === selectedDate).map(s => s.hour)
      );

      currentShift.hours.forEach(hour => {
        if (!existingHours.has(hour)) {
          schedule.push({ date: selectedDate, hour, status: 'available' });
        }
      });

      schedule = schedule.map(s =>
        s.date === selectedDate && currentShift.hours.includes(s.hour)
          ? { ...s, status: newStatus }
          : s
      );

      schedule.sort((a, b) =>
        a.date.localeCompare(b.date) || a.hour - b.hour
      );

      return { ...p, schedule };
    });

    savePermits(updatedPermits);

    setSubmitting(false);
    setMessage({
      type: 'success',
      text: `Shift marked "${newStatus}" for ${selectedDate}.`
    });

    setTimeout(() => {
      const fresh = updatedPermits.find(p => p.id === selectedPermitId);
      setSelectedPermitId(fresh.id);
    }, 50);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow p-6">
        <h1 className="text-2xl font-bold text-gray-800 mb-6">Book Shift / Mark Holiday</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* PERMIT SELECT */}
          <div>
            <label className="block text-sm font-semibold mb-1">Select Permit</label>
            <select
              value={selectedPermitId}
              onChange={(e) => {
                setSelectedPermitId(e.target.value);
                setSelectedDate('');
                setMessage(null);
              }}
              className="w-full border px-3 py-2 rounded text-black"
            >
              <option value="">-- choose permit --</option>
              {approvedPermits.map(p => (
                <option key={p.id} value={p.id}>
                  {p.driverName} — {p.vehiclePlate}
                </option>
              ))}
            </select>
          </div>

          {/* DATE SELECT */}
          <div>
            <label className="block text-sm font-semibold mb-1">Select Date</label>
            <select
              value={selectedDate}
              onChange={(e) => {
                setSelectedDate(e.target.value);
                setMessage(null);
              }}
              disabled={!selectedPermit}
              className="w-full border px-3 py-2 rounded text-black"
            >
              <option value="">-- choose date --</option>
              {availableDates.map(d => {
                const exists = detectExistingShift(selectedPermit.schedule, d);
                return (
                  <option key={d} value={d} disabled={!!exists}>
                    {d} {exists ? '(already selected)' : ''}
                  </option>
                );
              })}
            </select>
          </div>

          {/* SHIFT SELECTOR */}
          {selectedPermit && selectedDate && (
            (() => {
              const existingShift = detectExistingShift(selectedPermit.schedule, selectedDate);

              return (
                <div>
                  <label className="block text-sm font-semibold mb-1">Choose Shift</label>

                  <div className="flex gap-3">
                    {SHIFT_OPTIONS.map(s => {
                      const isDisabled = existingShift && existingShift !== s.id;
                      const isChecked = existingShift
                        ? existingShift === s.id
                        : selectedShiftId === s.id;

                      return (
                        <label
                          key={s.id}
                          className={`flex-1 border rounded p-3 text-center cursor-pointer ${
                            isChecked ? 'bg-blue-50 border-blue-600' : ''
                          } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <input
                            type="radio"
                            name="shift"
                            value={s.id}
                            checked={isChecked}
                            disabled={isDisabled}
                            onChange={() => setSelectedShiftId(s.id)}
                            className="mr-2"
                          />
                          {s.label}
                        </label>
                      );
                    })}
                  </div>
                </div>
              );
            })()
          )}

          {/* ACTION SELECT */}
          {!detectExistingShift(selectedPermit?.schedule ?? [], selectedDate) && (
            <div>
              <label className="block text-sm font-semibold mb-1">Action</label>
              <div className="flex gap-3">
                <label className={`border px-4 py-2 rounded cursor-pointer ${selectedAction === 'work' ? 'bg-green-50 border-green-600' : ''}`}>
                  <input type="radio" value="work" checked={selectedAction === 'work'} onChange={() => setSelectedAction('work')} className="mr-2" />
                  Work
                </label>
                <label className={`border px-4 py-2 rounded cursor-pointer ${selectedAction === 'cancel' ? 'bg-yellow-50 border-yellow-600' : ''}`}>
                  <input type="radio" value="cancel" checked={selectedAction === 'cancel'} onChange={() => setSelectedAction('cancel')} className="mr-2" />
                  Cancel
                </label>
                <label className={`border px-4 py-2 rounded cursor-pointer ${selectedAction === 'holiday' ? 'bg-blue-50 border-blue-600' : ''}`}>
                  <input type="radio" value="holiday" checked={selectedAction === 'holiday'} onChange={() => setSelectedAction('holiday')} className="mr-2" />
                  Holiday
                </label>
              </div>
            </div>
          )}

          {/* PREVIEW */}
          {selectedPermit && selectedDate && (
            <>
              <label className="block text-sm font-semibold mb-1">Preview</label>
              <div className="grid grid-cols-8 gap-2">
                {currentShift.hours.map(h => {
                  const entry = selectedPermit.schedule.find(s => s.date === selectedDate && s.hour === h);
                  const status = entry ? entry.status : 'available';

                  const bg =
                    status === 'booked'
                      ? 'bg-red-500 text-white'
                      : status === 'cancelled'
                      ? 'bg-yellow-400 text-black'
                      : status === 'holiday'
                      ? 'bg-blue-500 text-white'
                      : 'bg-green-200 text-black';

                  return (
                    <div key={h} className={`p-2 rounded text-center text-xs font-semibold ${bg}`}>
                      {h}:00
                    </div>
                  );
                })}
              </div>
            </>
          )}

          {/* MESSAGE + SUBMIT */}
          <div className="flex justify-between">
            {message && (
              <div className={`px-3 py-2 rounded text-sm flex items-center ${
                message.type === 'success'
                  ? 'bg-green-50 text-green-800'
                  : 'bg-red-50 text-red-800'
              }`}>
                {message.type === 'success'
                  ? <CheckCircle className="mr-2 text-green-600" />
                  : <X className="mr-2 text-red-600" />}
                {message.text}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 disabled:opacity-50"
            >
              {submitting ? 'Saving...' : 'Save Shift'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
