import React, { useState } from "react";
import { Shield, Car, User, Home, Clock, List } from "lucide-react";

const entity = {
    type: "Vehicle",
    status: "ACTIVE",
    name: "Toyota Camry",
    plate: "ABC-1234",
    license: "V123456",
    metadata: [
        { label: "Insurance", value: "Valid", icon: <Shield className="w-4 h-4 text-blue-500" /> },
        { label: "VIN", value: "1HGCM82633A123456", icon: <Car className="w-4 h-4 text-indigo-500" /> },
        { label: "Base", value: "NYC Base 42", icon: <Home className="w-4 h-4 text-green-500" /> },
    ],
    permitStatus: "ACTIVE",
};

const timelineEvents = [
    { time: "2024-06-01 10:00", event: "Permit Issued" },
    { time: "2024-06-10 14:30", event: "Insurance Updated" },
];

const pairings = [
    { driver: "John Doe", vehicle: "Toyota Camry", base: "NYC Base 42" },
];

const auditLogs = [
    { type: "Edit", timestamp: "2024-06-12 09:00", action: "Status Change", reason: "Renewal" },
    { type: "View", timestamp: "2024-06-11 16:20", action: "Record Accessed", reason: "Audit" },
];

const tabs = ["Overview", "Timeline", "Pairings", "Audit"];

export default function EntityDetail() {
    const [activeTab, setActiveTab] = useState("Overview");

    return (
        <div className="min-h-screen flex bg-gradient-to-br from-blue-50 to-indigo-100">
            {/* SIDEBAR */}
            <div className="flex-1 flex flex-col">
                {/* NAVBAR */}
                <nav className="bg-white shadow-sm px-6 py-4 flex items-center justify-end">
                    <button className="relative">
                        <Clock className="w-6 h-6 text-blue-700" />
                    </button>
                </nav>
                {/* ENTITY HEADER */}
                <header className="bg-white shadow flex items-center gap-4 px-8 py-6">
                    <Car className="w-8 h-8 text-indigo-600" />
                    <div>
                        <div className="text-xl font-bold">{entity.type}: {entity.name}</div>
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                            entity.status === "ACTIVE"
                                ? "bg-green-200 text-green-800"
                                : "bg-red-200 text-red-800"
                        }`}>
              {entity.status}
            </span>
                    </div>
                </header>
                {/* TABS */}
                <div className="bg-white px-8 pt-4 flex gap-8 border-b">
                    {tabs.map(tab => (
                        <button
                            key={tab}
                            className={`pb-2 font-semibold text-gray-700 border-b-2 transition ${
                                activeTab === tab
                                    ? "border-blue-600 text-blue-700"
                                    : "border-transparent hover:text-blue-500"
                            }`}
                            onClick={() => setActiveTab(tab)}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
                {/* TAB CONTENT */}
                <main className="flex-1 p-8">
                    {activeTab === "Overview" && (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-white rounded-xl shadow p-6 flex flex-col gap-2">
                                <div className="font-bold text-lg mb-2">Metadata</div>
                                {entity.metadata.map((meta, idx) => (
                                    <div key={idx} className="flex items-center gap-2">
                                        {meta.icon}
                                        <span className="font-semibold">{meta.label}:</span>
                                        <span>{meta.value}</span>
                                    </div>
                                ))}
                            </div>
                            <div className="bg-white rounded-xl shadow p-6">
                                <div className="font-bold text-lg mb-2">Permit Status</div>
                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                                    entity.permitStatus === "ACTIVE"
                                        ? "bg-green-200 text-green-800"
                                        : "bg-red-200 text-red-800"
                                }`}>
                  {entity.permitStatus}
                </span>
                            </div>
                        </div>
                    )}
                    {activeTab === "Timeline" && (
                        <div className="bg-white rounded-xl shadow p-6">
                            <div className="font-bold text-lg mb-4">Attestation Events</div>
                            <ul>
                                {timelineEvents.map((ev, idx) => (
                                    <li key={idx} className="mb-2 flex items-center gap-2">
                                        <Clock className="w-4 h-4 text-blue-500" />
                                        <span className="font-semibold">{ev.time}</span>
                                        <span>{ev.event}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {activeTab === "Pairings" && (
                        <div className="bg-white rounded-xl shadow p-6">
                            <div className="font-bold text-lg mb-4">Active Pairings</div>
                            <ul>
                                {pairings.map((p, idx) => (
                                    <li key={idx} className="flex items-center gap-4 mb-2">
                                        <User className="w-4 h-4 text-blue-500" />
                                        <span>{p.driver}</span>
                                        <span>⇄</span>
                                        <Car className="w-4 h-4 text-indigo-500" />
                                        <span>{p.vehicle}</span>
                                        <span>⇄</span>
                                        <Home className="w-4 h-4 text-green-500" />
                                        <span>{p.base}</span>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                    {activeTab === "Audit" && (
                        <div className="bg-white rounded-xl shadow p-6">
                            <div className="font-bold text-lg mb-4">Audit Logs</div>
                            <ul>
                                {auditLogs.map((log, idx) => (
                                    <li key={idx} className="mb-2">
                                        <button
                                            className="w-full text-left flex items-center gap-2 p-2 rounded hover:bg-blue-50"
                                            onClick={() => {}}
                                        >
                                            <List className="w-4 h-4 text-gray-500" />
                                            <span className="font-semibold">{log.type}</span>
                                            <span>{log.timestamp}</span>
                                            <span>{log.action}</span>
                                            <span className="text-gray-500">{log.reason}</span>
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </main>
            </div>
        </div>
    );
}
