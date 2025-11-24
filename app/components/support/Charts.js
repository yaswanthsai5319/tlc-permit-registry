import React from "react";

export default function Charts() {
    // Replace with real chart components or mock data
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-4 rounded shadow">
                <h4 className="font-semibold mb-2">Driver Utilization</h4>
                <div className="h-32 bg-blue-50 flex items-center justify-center">[Chart]</div>
            </div>
            <div className="bg-white p-4 rounded shadow">
                <h4 className="font-semibold mb-2">Vehicle Utilization</h4>
                <div className="h-32 bg-green-50 flex items-center justify-center">[Chart]</div>
            </div>
            <div className="bg-white p-4 rounded shadow col-span-2">
                <h4 className="font-semibold mb-2">Permit Trends</h4>
                <div className="h-32 bg-indigo-50 flex items-center justify-center">[Chart]</div>
            </div>
        </div>
    );
}
