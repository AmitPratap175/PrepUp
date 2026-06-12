import React, { useState, useRef } from 'react';
import { GoogleGenAI } from '@google/genai';
import { Upload, Image as ImageIcon, Map as MapIcon, RefreshCw, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MapScope, MapType } from '@/data/maps';

// @ts-ignore
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "dummy_key_to_prevent_crash";
const ai = new GoogleGenAI({ apiKey: API_KEY });

export interface ExtractedLocation {
  name: string;
  lat: number;
  lng: number;
}

export interface ExtractedData {
  scope: MapScope;
  type: MapType;
  labels: ExtractedLocation[];
}

interface CustomMapQuizProps {
  onStartCustomVectorQuiz?: (data: ExtractedData) => void;
}

export function CustomMapQuiz({ onStartCustomVectorQuiz }: CustomMapQuizProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [targetType, setTargetType] = useState<string>('auto');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load persisted data on mount
  React.useEffect(() => {
    try {
      const savedImage = localStorage.getItem('customMapImage');
      const savedData = localStorage.getItem('customMapData');
      if (savedImage) setImageSrc(savedImage);
      if (savedData) setExtractedData(JSON.parse(savedData));
    } catch (e) {
      console.error("Error loading persisted map data:", e);
    }
  }, []);

  // Save data when it changes
  React.useEffect(() => {
    try {
      if (imageSrc) {
        localStorage.setItem('customMapImage', imageSrc);
      } else {
        localStorage.removeItem('customMapImage');
      }
      
      if (extractedData) {
        localStorage.setItem('customMapData', JSON.stringify(extractedData));
      } else {
        localStorage.removeItem('customMapData');
      }
    } catch (e) {
      console.error("Error saving map data to localStorage (might be too large):", e);
    }
  }, [imageSrc, extractedData]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setImageSrc(base64);
      await processImage(file, base64);
    };
    reader.readAsDataURL(file);
  };

  const processImage = async (file: File, base64: string) => {
    setIsProcessing(true);
    try {
      let apiKey = import.meta.env.VITE_GEMINI_API_KEY || API_KEY;
      try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/chatbot/config/', {
          headers: { 'Authorization': `Token ${token}` }
        });
        const data = await response.json();
        if (data.api_key) {
          apiKey = data.api_key;
        }
      } catch (e) {
        console.error("Failed to fetch runtime API key for custom map upload", e);
      }

      const aiClient = new GoogleGenAI({ apiKey: apiKey });

      const typeInstruction = targetType === 'auto' 
        ? `2. Identify the type of map. It must be exactly one of these: "political" (states/countries), "physical" (mountains/deserts), "climatic", "capitals", "rivers".`
        : `2. The type of map is strictly "${targetType}". Do not auto-detect.`;

      const response = await aiClient.models.generateContent({
        model: "gemini-2.5-pro",
        contents: [
          {
            role: "user",
            parts: [
              { inlineData: { mimeType: file.type, data: base64.split(',')[1] } },
              { text: `Analyze this map image. 
1. Identify the region/country it represents. It must be exactly one of these: "world", "asia", "africa", "europe", "north-america", "south-america", "oceania", "india", "odisha".
${typeInstruction}
3. Extract ALL distinct geographical text labels found on the map that match the identified type. Be exhaustive and list every single relevant label you can find. Do not stop until you have extracted every single label visible on the map. For example, if the type is 'rivers', extract all river names. If the type is 'political', extract all state/country/city names. Do not mix different types of labels (e.g., keep rivers and cities separate).
4. For each extracted label, provide its approximate latitude and longitude coordinates based on its real-world location.
Return a JSON object with this exact structure:
{
  "scope": "india",
  "type": "${targetType === 'auto' ? 'rivers' : targetType}",
  "labels": [
    { "name": "Ganges", "lat": 25.3, "lng": 83.0 },
    { "name": "Yamuna", "lat": 28.6, "lng": 77.2 }
  ]
}
Only return the JSON object.` }
            ]
          }
        ],
        config: {
          responseMimeType: "application/json",
        }
      });
      
      let text = response.text || '';
      text = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      const data: ExtractedData = JSON.parse(text);
      
      setExtractedData(data);
    } catch (error) {
      console.error("Error processing image:", error);
      alert("Failed to process image. Please try again.");
      setImageSrc(null);
    } finally {
      setIsProcessing(false);
    }
  };

  const resetGame = () => {
    setImageSrc(null);
    setExtractedData(null);
  };

  return (
    <div className="flex flex-col h-full bg-[#FDFCF8] relative">
      <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
        {/* Left Sidebar / Info */}
        <div className="w-full lg:w-96 border-r border-[#1A1A1A]/10 bg-white p-6 flex flex-col gap-6 overflow-y-auto">
          {!extractedData ? (
            <div className="text-center space-y-4 mt-10">
              <div className="w-16 h-16 bg-[#1A1A1A]/5 rounded-full flex items-center justify-center mx-auto">
                <ImageIcon className="w-8 h-8 text-[#1A1A1A]/40" />
              </div>
              <div>
                <h3 className="font-bold text-lg">Upload Map</h3>
                <p className="text-sm text-[#1A1A1A]/60 mt-1">Upload a map image. AI will extract the locations and generate a custom vector map quiz for you.</p>
              </div>

              <div className="text-left space-y-2 mt-4">
                <label className="text-xs font-bold text-[#1A1A1A]/60 uppercase tracking-wider">Extraction Target</label>
                <select 
                  value={targetType}
                  onChange={(e) => setTargetType(e.target.value)}
                  className="w-full p-3 bg-[#1A1A1A]/5 border border-[#1A1A1A]/10 rounded-xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="auto">Auto-detect</option>
                  <option value="political">Places / Political (States/Cities)</option>
                  <option value="physical">Physical Features (Mountains/Deserts)</option>
                  <option value="rivers">Rivers</option>
                  <option value="capitals">Capitals</option>
                  <option value="climatic">Climatic Zones</option>
                </select>
              </div>

              <input 
                type="file" 
                accept="image/*,application/pdf" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileUpload}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                disabled={isProcessing}
                className="w-full py-3 bg-[#1A1A1A] text-white rounded-xl font-medium hover:bg-[#1A1A1A]/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Analyzing Map...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    Select Image
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="space-y-6">
              <button 
                onClick={resetGame}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#1A1A1A]/5 hover:bg-[#1A1A1A]/10 rounded-xl font-medium transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Upload New Map
              </button>

              <div className="bg-[#1A1A1A]/5 p-5 rounded-xl space-y-4">
                <div>
                  <div className="text-xs font-bold text-[#1A1A1A]/40 uppercase tracking-wider mb-1">Detected Region</div>
                  <div className="text-lg font-bold capitalize">{extractedData.scope.replace('-', ' ')}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1A1A1A]/40 uppercase tracking-wider mb-1">Map Type</div>
                  <div className="text-lg font-bold capitalize">{extractedData.type}</div>
                </div>
                <div>
                  <div className="text-xs font-bold text-[#1A1A1A]/40 uppercase tracking-wider mb-2">Extracted Locations ({extractedData.labels.length})</div>
                  <div className="flex flex-wrap gap-2">
                    {extractedData.labels.map((label, i) => (
                      <span key={i} className="px-2 py-1 bg-white border border-[#1A1A1A]/10 rounded-md text-xs font-medium">
                        {label.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => onStartCustomVectorQuiz?.(extractedData)}
                className="w-full py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
              >
                <MapIcon className="w-5 h-5" />
                Start Vector Map Quiz
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Map Area */}
        <div className="flex-1 bg-[#FDFCF8] p-6 flex items-center justify-center overflow-auto relative">
          {imageSrc ? (
            <div className="relative inline-block shadow-2xl rounded-xl overflow-hidden border border-[#1A1A1A]/10 bg-white">
              <img 
                src={imageSrc} 
                alt="Uploaded Map" 
                className="max-w-full max-h-[800px] object-contain block"
              />
            </div>
          ) : (
            <div className="text-center text-[#1A1A1A]/40 max-w-md">
              <ImageIcon className="w-16 h-16 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No map uploaded</p>
              <p className="text-sm mt-2">Upload a map image to extract its locations.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
