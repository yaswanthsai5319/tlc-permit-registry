import React, { useState } from "react";
import { User, Car, Home, Calendar, CheckCircle, XCircle } from "lucide-react";

const steps = [
    { label: "Select Driver", icon: <User className="w-5 h-5" /> },
    { label: "Select Vehicle", icon: <Car className="w-5 h-5" /> },
    { label: "Select Base", icon: <Home className="w-5 h-5" /> },
    { label: "Set Duration", icon: <Calendar className="w-5 h-5" /> },
];

export default function PairingWizard() {
    const [activeStep, setActiveStep] = useState(0);

    // Form state
    const [driver, setDriver] = useState({ license: "", name: "", status: "ACTIVE", expiry: "2024-12-31" });
    const [vehicle, setVehicle] = useState({ plate: "", vin: "", insurance: "Valid" });
    const [base, setBase] = useState({ id: "", borough: "Manhattan", capValid: true });
    const [duration, setDuration] = useState({ start: "", end: "" });
    const [compliance, setCompliance] = useState({ passed: true, message: "All checks passed." });

    // Step content
    const stepContent = [
        (
            <div className="space-y-4">
                <div className="font-bold text-lg mb-2">Step 1: Select Driver</div>
                <input
                    className="border rounded px-4 py-2 w-full"
                    placeholder="License No. or Name"
                    value={driver.license}
                    onChange={e => setDriver({ ...driver, license: e.target.value })}
                />
                <div className="bg-white rounded shadow p-4 flex items-center gap-4">
                    <User className="w-6 h-6 text-blue-500" />
                    <div>
                        <div className="font-semibold">Status: <span className={driver.status === "ACTIVE" ? "text-green-700" : "text-red-700"}>{driver.status}</span></div>
                        <div>Permit Expiry: <span className="font-semibold">{driver.expiry}</span></div>
                    </div>
                </div>
            </div>
        ),
        (
            <div className="space-y-4">
                <div className="font-bold text-lg mb-2">Step 2: Select Vehicle</div>
                <input
                    className="border rounded px-4 py-2 w-full mb-2"
                    placeholder="Plate No."
                    value={vehicle.plate}
                    onChange={e => setVehicle({ ...vehicle, plate: e.target.value })}
                />
                <input
                    className="border rounded px-4 py-2 w-full"
                    placeholder="VIN"
                    value={vehicle.vin}
                    onChange={e => setVehicle({ ...vehicle, vin: e.target.value })}
                />
                <div className="bg-white rounded shadow p-4 flex items-center gap-4">
                    <Car className="w-6 h-6 text-indigo-500" />
                    <div>
                        <div>Insurance Status: <span className={vehicle.insurance === "Valid" ? "text-green-700" : "text-red-700"}>{vehicle.insurance}</span></div>
                    </div>
                </div>
            </div>
        ),
        (
            <div className="space-y-4">
                <div className="font-bold text-lg mb-2">Step 3: Select Base</div>
                <input
                    className="border rounded px-4 py-2 w-full"
                    placeholder="Base ID"
                    value={base.id}
                    onChange={e => setBase({ ...base, id: e.target.value })}
                />
                <div className="bg-white rounded shadow p-4 flex items-center gap-4">
                    <Home className="w-6 h-6 text-green-500" />
                    <div>
                        <div>Borough: <span className="font-semibold">{base.borough}</span></div>
                        <div>
                            Permit Cap Validation: {base.capValid
                            ? <span className="flex items-center text-green-700"><CheckCircle className="w-4 h-4 mr-1" /> Valid</span>
                            : <span className="flex items-center text-red-700"><XCircle className="w-4 h-4 mr-1" /> Exceeded</span>
                        }
                        </div>
                    </div>
                </div>
            </div>
        ),
        (
            <div className="space-y-4">
                <div className="font-bold text-lg mb-2">Step 4: Set Duration</div>
                <div className="flex gap-4">
                    <input
                        type="datetime-local"
                        className="border rounded px-4 py-2"
                        value={duration.start}
                        onChange={e => setDuration({ ...duration, start: e.target.value })}
                    />
                    <input
                        type="datetime-local"
                        className="border rounded px-4 py-2"
                        value={duration.end}
                        onChange={e => setDuration({ ...duration, end: e.target.value })}
                    />
                </div>
                <div className="bg-white rounded shadow p-4 flex items-center gap-4">
                    {compliance.passed
                        ? <CheckCircle className="w-6 h-6 text-green-500" />
                        : <XCircle className="w-6 h-6 text-red-500" />
                    }
                    <span className={compliance.passed ? "text-green-700" : "text-red-700"}>{compliance.message}</span>
                </div>
                <div className="bg-blue-50 rounded-xl shadow p-6 mt-4">
                    <div className="font-bold mb-2">Summary</div>
                    <div className="flex items-center gap-4">
                        <User className="w-5 h-5 text-blue-500" />
                        <span>{driver.license || "Driver"}</span>
                        <span>⇄</span>
                        <Car className="w-5 h-5 text-indigo-500" />
                        <span>{vehicle.plate || "Vehicle"}</span>
                        <span>⇄</span>
                        <Home className="w-5 h-5 text-green-500" />
                        <span>{base.id || "Base"}</span>
                    </div>
                </div>
            </div>
        ),
    ];

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">

            <div className="flex-1 flex flex-col">
                {/* NAVBAR */}
                <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-end">
                    <span className="font-bold text-blue-700">Pairing Wizard</span>
                </nav>
                {/* HEADER */}
                <header className="bg-white shadow flex items-center gap-4 px-8 py-6">
                    <Car className="w-8 h-8 text-indigo-600" />
                    <div className="text-xl font-bold">Pairing Wizard</div>
                </header>
                {/* STEPPER */}
                <div className="bg-white px-8 pt-4 flex gap-8 border-b">
                    {steps.map((step, idx) => (
                        <button
                            key={step.label}
                            className={`flex items-center gap-2 pb-2 font-semibold text-gray-700 border-b-2 transition ${
                                activeStep === idx
                                    ? "border-blue-600 text-blue-700"
                                    : "border-transparent hover:text-blue-500"
                            }`}
                            onClick={() => setActiveStep(idx)}
                        >
                            <span className="rounded-full bg-blue-100 text-blue-700 px-2 py-1 mr-2">{idx + 1}</span>
                            {step.icon}
                            {step.label}
                        </button>
                    ))}
                </div>
                {/* STEP CONTENT */}
                <main className="flex-1 p-8">
                    {stepContent[activeStep]}
                    <div className="flex justify-between mt-8">
                        <button
                            className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold"
                            disabled={activeStep === 0}
                            onClick={() => setActiveStep(activeStep - 1)}
                        >
                            Back
                        </button>
                        {activeStep < steps.length - 1 ? (
                            <button
                                className="px-4 py-2 rounded bg-blue-600 text-white font-semibold"
                                onClick={() => setActiveStep(activeStep + 1)}
                            >
                                Next
                            </button>
                        ) : (
                            <button
                                className="px-6 py-2 rounded bg-green-600 text-white font-bold"
                                onClick={() => alert("Pairing Created!")}
                            >
                                Create Pairing
                            </button>
                        )}
                    </div>
                </main>
            </div>
        </div>
    );
}
