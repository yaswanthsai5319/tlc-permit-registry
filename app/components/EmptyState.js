"use client";
import React from "react";
import { User, Car } from "lucide-react";

export function EmptyDriverState({ userRole }) {
    if (userRole !== 'admin') return null;

    return (
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 text-center">
            <User className="w-12 h-12 text-blue-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Drivers Available</h3>
            <p className="text-sm text-slate-600">Create drivers in Admin Configuration to start pairing</p>
        </div>
    );
}

export function EmptyVehicleState({ userRole }) {
    if (userRole !== 'admin') return null;

    return (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
            <Car className="w-12 h-12 text-amber-400 mx-auto mb-3" />
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Vehicles Available</h3>
            <p className="text-sm text-slate-600">Create vehicles in Admin Configuration to start pairing</p>
        </div>
    );
}
