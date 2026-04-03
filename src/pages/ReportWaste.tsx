import { useState, useRef, ChangeEvent } from "react";
import { Camera, Upload, MapPin, Loader2, CheckCircle2 } from "lucide-react";
import { GoogleGenAI } from "@google/genai";
import { useAuth } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function ReportWaste() {
  const [image, setImage] = useState<string | null>(null);
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [address, setAddress] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [result, setResult] = useState<{ type: string; description: string; points: number; approxWeight: string; items: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImage(reader.result as string);
        getLocation();
      };
      reader.readAsDataURL(file);
    }
  };

  const getLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setLocation({ lat, lng });
          
          // Reverse Geocoding using Google Maps API
          try {
            const apiKey = "AIzaSyDQ5cpKVm6ILGXT032NcCl-f0TDYvQwrpA";
            const res = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`);
            const data = await res.json();
            if (data.results && data.results.length > 0) {
              setAddress(data.results[0].formatted_address);
            }
          } catch (err) {
            console.error("Geocoding error:", err);
          }
        },
        (err) => {
          console.error("Error getting location:", err);
          setError("Could not get your location. Please enable location services.");
        }
      );
    }
  };

  const analyzeWaste = async () => {
    if (!image) return;

    setIsAnalyzing(true);
    setError(null);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      // Extract base64 data
      const base64Data = image.split(',')[1];
      const mimeType = image.split(';')[0].split(':')[1];

      const prompt = `Analyze this image of waste. 
      1. Identify the general type of waste (e.g., Plastic, Organic, Electronic, Paper, Glass, Metal, Hazardous).
      2. Estimate the approximate weight of the waste accumulation (e.g., "2 kg", "500 g").
      3. List precisely what specific items are visible in the waste.
      4. Provide a brief description of how it should be properly disposed of or recycled.
      5. Assign a reward points value between 10 and 50 based on the environmental impact of recycling it.
      
      Return ONLY a JSON object with this exact structure, no markdown formatting:
      {
        "type": "Waste Type",
        "approxWeight": "Estimated weight",
        "items": ["item 1", "item 2"],
        "description": "Disposal instructions",
        "points": 25
      }`;

      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: {
          parts: [
            { text: prompt },
            { inlineData: { data: base64Data, mimeType } }
          ]
        }
      });

      const text = response.text || "{}";
      // Clean up potential markdown code blocks
      const cleanedText = text.replace(/```json\n?|\n?```/g, '').trim();
      
      try {
        const parsedResult = JSON.parse(cleanedText);
        setResult(parsedResult);
      } catch (e) {
        console.error("Failed to parse JSON:", text);
        throw new Error("Failed to parse analysis results.");
      }

    } catch (err) {
      console.error("Analysis error:", err);
      setError("Failed to analyze the image. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const submitReport = async () => {
    if (!user || !result || !location || !image) return;
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          lat: location.lat,
          lng: location.lng,
          address: address,
          waste_type: result.type,
          image_base64: image,
          points: result.points || 10,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      // Update local user points (in a real app, you'd fetch the updated user profile)
      user.points += result.points;
      
      navigate("/map");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">Report Waste</h2>
          <p className="text-gray-500 mt-1">Upload a photo of the waste to identify it and earn rewards.</p>
        </div>

        <div className="p-6">
          {!image ? (
            <div 
              className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center hover:bg-gray-50 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <div className="mx-auto h-16 w-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900">Click to upload photo</h3>
              <p className="text-gray-500 mt-2">or drag and drop</p>
              <p className="text-xs text-gray-400 mt-4">PNG, JPG up to 10MB</p>
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
            <div className="space-y-6">
              <div className="relative rounded-xl overflow-hidden bg-gray-100 aspect-video flex items-center justify-center">
                <img src={image} alt="Uploaded waste" className="max-h-full object-contain" />
                <button 
                  onClick={() => { setImage(null); setResult(null); }}
                  className="absolute top-4 right-4 bg-white/90 backdrop-blur text-gray-700 px-3 py-1.5 rounded-lg text-sm font-medium shadow-sm hover:bg-white"
                >
                  Change Photo
                </button>
              </div>

              {address ? (
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <MapPin className="h-4 w-4 mr-2 text-green-600" />
                  Location tagged: {address}
                </div>
              ) : location ? (
                <div className="flex items-center text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
                  <MapPin className="h-4 w-4 mr-2 text-green-600" />
                  Location tagged: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
                </div>
              ) : null}

              {error && (
                <div className="p-4 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {!result && !isAnalyzing && (
                <button
                  onClick={analyzeWaste}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center"
                >
                  <Camera className="h-5 w-5 mr-2" />
                  Analyze Waste
                </button>
              )}

              {isAnalyzing && (
                <div className="w-full bg-green-50 text-green-700 font-medium py-4 px-4 rounded-lg flex items-center justify-center">
                  <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                  AI is analyzing the image...
                </div>
              )}

              {result && (
                <div className="bg-gradient-to-br from-green-50 to-emerald-50/50 border border-green-200/60 rounded-xl p-6 animate-in fade-in slide-in-from-bottom-4 shadow-sm">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 pr-4">
                      <div className="flex items-center">
                        <CheckCircle2 className="h-6 w-6 text-green-600 mr-2" />
                        <h3 className="text-xl font-bold text-gray-900">{result.type}</h3>
                      </div>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-start">
                          <span className="text-sm font-semibold text-gray-700 w-24 flex-shrink-0">Weight:</span>
                          <span className="text-sm text-gray-600">{result.approxWeight}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-sm font-semibold text-gray-700 w-24 flex-shrink-0">Items:</span>
                          <span className="text-sm text-gray-600">{result.items?.join(", ")}</span>
                        </div>
                        <div className="flex items-start">
                          <span className="text-sm font-semibold text-gray-700 w-24 flex-shrink-0">Disposal:</span>
                          <span className="text-sm text-gray-600 leading-relaxed">{result.description}</span>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white/80 backdrop-blur px-4 py-3 rounded-xl shadow-sm border border-green-100 text-center min-w-[100px]">
                      <span className="block text-xs text-gray-500 font-medium uppercase tracking-wider">Reward</span>
                      <span className="block text-2xl font-bold text-green-600">+{result.points}</span>
                      <span className="block text-xs text-gray-500">pts</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t border-green-200/50 flex space-x-3">
                    <button 
                      onClick={() => { setImage(null); setResult(null); }}
                      className="flex-1 bg-white text-green-700 border border-green-200 hover:bg-green-50 font-medium py-2.5 px-4 rounded-lg transition-colors"
                    >
                      Report Another
                    </button>
                    <button 
                      onClick={submitReport}
                      disabled={isSubmitting}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2.5 px-4 rounded-lg transition-colors flex items-center justify-center disabled:opacity-50 shadow-sm"
                    >
                      {isSubmitting ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirm & Submit"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
