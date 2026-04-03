import React, { useState, useEffect, useRef } from "react";
import { MapPin, Camera, CheckCircle, Loader2, Upload } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function CollectWaste() {
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [image, setImage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      if (res.ok) {
        setReports(data.reports.filter((r: any) => r.status === "Pending"));
      }
    } catch (err) {
      console.error("Failed to fetch reports", err);
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCollect = async () => {
    if (!image || !selectedReport || !user) return;
    setSubmitting(true);

    try {
      const res = await fetch(`/api/reports/${selectedReport.id}/collect`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          collector_id: user.id,
          image_base64: image,
        }),
      });

      if (res.ok) {
        setReports(reports.filter((r) => r.id !== selectedReport.id));
        setSelectedReport(null);
        setImage(null);
        // Optionally show a success toast
      }
    } catch (err) {
      console.error("Failed to collect waste", err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-green-600" />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
        <h2 className="text-xl font-bold text-gray-900">Collect Waste</h2>
        <p className="text-gray-500 mt-1">View pending reports and confirm collection.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reports.map((report) => (
          <div key={report.id} className="bg-gradient-to-b from-white to-green-50/10 rounded-xl shadow-sm border border-green-100/60 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
            <div className="h-48 bg-gray-100 relative">
              {report.image_base64 ? (
                <img src={report.image_base64} alt="Waste" className="w-full h-full object-cover" />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">No Image</div>
              )}
              <div className="absolute top-3 right-3 bg-yellow-100 text-yellow-800 text-xs font-bold px-2.5 py-1 rounded-full">
                Pending
              </div>
            </div>
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-gray-900 text-lg">{report.waste_type || "Unknown Waste"}</h3>
              <div className="flex items-start mt-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4 mr-1.5 mt-0.5 flex-shrink-0 text-green-600" />
                <span>{report.address || `${report.lat?.toFixed(4)}, ${report.lng?.toFixed(4)}`}</span>
              </div>
              {report.lat && report.lng && (
                <a 
                  href={`https://www.google.com/maps/search/?api=1&query=${report.lat},${report.lng}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2 text-sm text-green-600 hover:text-green-700 font-medium inline-flex items-center"
                >
                  Open in Google Maps
                </a>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100 flex-1 flex items-end">
                <button
                  onClick={() => setSelectedReport(report)}
                  className="w-full bg-green-50 hover:bg-green-100 text-green-700 font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  Mark as Collected
                </button>
              </div>
            </div>
          </div>
        ))}
        {reports.length === 0 && (
          <div className="col-span-full py-12 text-center text-gray-500">
            No pending waste reports found. Great job!
          </div>
        )}
      </div>

      {/* Collection Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">Confirm Collection</h3>
              <p className="text-sm text-gray-500 mt-1">Upload a photo of the cleaned area to verify.</p>
            </div>
            <div className="p-6 space-y-4">
              {!image ? (
                <div 
                  className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:bg-gray-50 transition-colors cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-gray-900">Take a photo</p>
                  <input 
                    type="file" 
                    className="hidden" 
                    ref={fileInputRef}
                    accept="image/*"
                    capture="environment"
                    onChange={handleImageUpload}
                  />
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video">
                  <img src={image} alt="Cleaned area" className="w-full h-full object-cover" />
                  <button 
                    onClick={() => setImage(null)}
                    className="absolute top-2 right-2 bg-white/90 text-gray-700 px-2 py-1 rounded text-xs font-medium shadow-sm"
                  >
                    Retake
                  </button>
                </div>
              )}

              <div className="flex space-x-3 mt-6">
                <button 
                  onClick={() => { setSelectedReport(null); setImage(null); }}
                  className="flex-1 bg-white border border-gray-200 text-gray-700 font-medium py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  onClick={handleCollect}
                  disabled={!image || submitting}
                  className="flex-1 bg-green-600 text-white font-medium py-2.5 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 flex items-center justify-center"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                    <>
                      <CheckCircle className="h-5 w-5 mr-2" />
                      Confirm
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
