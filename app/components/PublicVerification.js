import React, { useState } from "react";
import { ShieldCheck, XCircle } from "lucide-react";

const mockResults = {
    "D12345": {
        type: "Driver",
        status: "ACTIVE",
        updated: "2024-06-25 14:32",
    },
    "V67890": {
        type: "Vehicle",
        status: "EXPIRED",
        updated: "2024-06-20 09:15",
    },
};

export default function PublicVerification() {
    const [licenseId, setLicenseId] = useState("");
    const [captcha, setCaptcha] = useState("");
    const [result, setResult] = useState(null);
    const [error, setError] = useState("");

    const handleVerify = e => {
        e.preventDefault();
        setError("");
        if (!licenseId) {
            setError("Please enter a License ID.");
            setResult(null);
            return;
        }
        if (captcha !== "1234") {
            setError("Captcha incorrect.");
            setResult(null);
            return;
        }
        const res = mockResults[licenseId.trim()];
        if (res) {
            setResult(res);
        } else {
            setError("No record found. Please check the License ID.");
            setResult(null);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center">
            {/* HEADER */}
            <header className="w-full flex justify-between items-center bg-white shadow px-8 py-4 mb-8">
                <div className="text-xl font-bold text-blue-700">Public Verification</div>
                {/*<img src="/logo.png" alt="Logo" className="h-10" />*/}
            </header>
            {/* SEARCH FORM */}
            <form
                className="bg-white rounded-xl shadow p-8 flex flex-col gap-4 w-full max-w-md"
                onSubmit={handleVerify}
            >
                <label className="font-semibold text-gray-700">Verify by License ID</label>
                <input
                    className="border rounded px-3 py-2"
                    placeholder="Enter License ID"
                    value={licenseId}
                    onChange={e => setLicenseId(e.target.value)}
                />
                <div className="flex items-center gap-2">
                    <input
                        className="border rounded px-3 py-2 w-32"
                        placeholder="Captcha: 1234"
                        value={captcha}
                        onChange={e => setCaptcha(e.target.value)}
                    />
                    <span className="text-xs text-gray-500">Enter 1234</span>
                </div>
                <button
                    type="submit"
                    className="bg-blue-600 text-white px-4 py-2 rounded font-bold"
                >
                    Verify
                </button>
                {error && (
                    <div className="text-red-600 flex items-center gap-2">
                        <XCircle className="w-4 h-4" /> {error}
                    </div>
                )}
            </form>
            {/* RESULT CARD */}
            {result && (
                <div className="bg-white rounded-xl shadow p-6 mt-8 w-full max-w-md flex flex-col items-center">
                    <div className="flex items-center gap-2 mb-2">
                        <ShieldCheck className="w-6 h-6 text-blue-500" />
                        <span className="font-bold text-lg">Verification Result</span>
                    </div>
                    <div className="flex flex-col gap-2 items-center">
                        <div className="text-gray-700">
                            Permit Type: <span className="font-semibold">{result.type}</span>
                        </div>
                        <div>
                            Status:{" "}
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-bold ${
                                    result.status === "ACTIVE"
                                        ? "bg-green-200 text-green-800"
                                        : "bg-red-200 text-red-800"
                                }`}
                            >
                {result.status}
              </span>
                        </div>
                        <div className="text-gray-500 text-xs">
                            Last Updated: {result.updated}
                        </div>
                    </div>
                </div>
            )}
            {/* HELP LINK */}
            <div className="mt-8 text-sm text-gray-600">
                Need help?{" "}
                <a
                    href="mailto:support@example.com"
                    className="text-blue-700 underline font-semibold"
                >
                    Contact Support
                </a>
            </div>
        </div>
    );
}
