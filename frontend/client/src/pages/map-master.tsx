import React, { useState, useEffect, useMemo, memo, useCallback, useRef } from 'react';
import { 
  ComposableMap, 
  Geographies, 
  Geography, 
  ZoomableGroup,
  Sphere,
  Graticule,
  useMapContext,
  Marker,
  Line
} from 'react-simple-maps';
import { geoCentroid } from 'd3-geo';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Map as MapIcon, 
  Trophy, 
  Compass, 
  Globe, 
  Flag, 
  Mountain, 
  CloudSun,
  Landmark,
  ChevronRight,
  RotateCcw,
  CheckCircle2,
  XCircle,
  Info,
  BookOpen,
  SkipForward,
  Maximize,
  Minimize,
  CheckSquare,
  Play,
  Search,
  GripHorizontal,
  Newspaper,
  CloudRain,
  LineChart,
  Bookmark,
  Trash2,
  PanelLeftClose,
  PanelLeftOpen,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import ReactConfetti from 'react-confetti';
import { feature } from 'topojson-client';
import Markdown from 'react-markdown';
import { AreaChart, Area, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { cn } from '@/lib/utils';
import { MAP_SOURCES, QUESTIONS, MapScope, MapType, Question, RIVER_SOURCES, LAKE_SOURCES } from '@/data/maps';

const RegionLabel = memo(({ geo, name, scope, isVisible }: { geo: any, name: string, scope: string, isVisible?: boolean }) => {
  const { projection } = useMapContext();
  if (!projection) return null;

  const centroid = useMemo(() => {
    try {
      const c = geoCentroid(geo);
      if (c && !isNaN(c[0]) && !isNaN(c[1])) {
        return c;
      }
    } catch (e) {
      return null;
    }
    return null;
  }, [geo]);

  if (!isVisible || !centroid) return null;

  const projected = projection(centroid);
  if (!projected || isNaN(projected[0]) || isNaN(projected[1])) return null;

  const getFontSize = () => {
    switch (scope) {
      case 'india': return "6px";
      case 'odisha': return "2px";
      case 'world': return "10px";
      case 'europe': return "4px";
      default: return "6px";
    }
  };

  return (
    <text
      x={projected[0]}
      y={projected[1] + 2}
      textAnchor="middle"
      style={{
        fontFamily: "system-ui",
        fill: "#1A1A1A",
        fontSize: getFontSize(),
        pointerEvents: "none",
        fontWeight: "600",
        opacity: 0.8,
        textShadow: "1px 1px 0px rgba(255,255,255,0.8), -1px -1px 0px rgba(255,255,255,0.8), 1px -1px 0px rgba(255,255,255,0.8), -1px 1px 0px rgba(255,255,255,0.8)"
      }}
    >
      {name}
    </text>
  );
});

const MemoizedGeography = memo(({ 
  geo, 
  geoId,
  geoName,
  isSelected, 
  isHovered, 
  isDragging, 
  defaultFill, 
  strokeW, 
  colors, 
  onMouseEnter, 
  onMouseLeave, 
  onClick 
}: any) => {
  const style = useMemo(() => ({
    default: {
      fill: isSelected ? colors.selected : (isDragging && isHovered ? colors.hover : defaultFill),
      stroke: "#1A1A1A",
      strokeWidth: strokeW,
      outline: "none",
    },
    hover: {
      fill: colors.hover,
      stroke: "#1A1A1A",
      strokeWidth: strokeW * 1.5,
      outline: "none",
      cursor: "pointer",
    },
    pressed: {
      fill: colors.selected,
      stroke: "#1A1A1A",
      strokeWidth: strokeW * 1.5,
      outline: "none",
    },
  }), [isSelected, isHovered, isDragging, defaultFill, strokeW, colors]);

  const handleMouseEnter = useCallback(() => {
    if (onMouseEnter) onMouseEnter(geoName, geoId, geo);
  }, [onMouseEnter, geoName, geoId, geo]);

  const handleClick = useCallback((e: any) => {
    if (onClick) onClick(geo, e);
  }, [onClick, geo]);

  return (
    <Geography
      geography={geo}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      style={style}
    />
  );
});

const MemoizedRiver = memo(({ geo, geoId, geoName, isSelected, onMouseEnter, onMouseLeave, onClick }: any) => {
  const handleMouseEnter = useCallback(() => {
    if (onMouseEnter) onMouseEnter(geoName, geoId, geo);
  }, [onMouseEnter, geoName, geoId, geo]);

  const handleClick = useCallback((e: any) => {
    if (onClick) onClick(geo, e);
  }, [onClick, geo]);

  const style = useMemo(() => ({
    default: { fill: "none", stroke: isSelected ? "#1A1A1A" : "#3498db", strokeWidth: isSelected ? 3 : 1.5, outline: "none" },
    hover: { fill: "none", stroke: "#2980b9", strokeWidth: 3, outline: "none", cursor: "pointer" },
    pressed: { fill: "none", stroke: "#1A1A1A", strokeWidth: 3, outline: "none" }
  }), [isSelected]);

  return (
    <Geography
      geography={geo}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      style={style}
    />
  );
});

const MemoizedLake = memo(({ geo, geoId, geoName, isSelected, onMouseEnter, onMouseLeave, onClick }: any) => {
  const handleMouseEnter = useCallback(() => {
    if (onMouseEnter) onMouseEnter(geoName, geoId, geo);
  }, [onMouseEnter, geoName, geoId, geo]);

  const handleClick = useCallback((e: any) => {
    if (onClick) onClick(geo, e);
  }, [onClick, geo]);

  const style = useMemo(() => ({
    default: { fill: isSelected ? "#1A1A1A" : "#a2d9ff", stroke: "#3498db", strokeWidth: 0.5, outline: "none" },
    hover: { fill: "#7fb3d5", stroke: "#3498db", strokeWidth: 1, outline: "none", cursor: "pointer" },
    pressed: { fill: "#1A1A1A", stroke: "#3498db", strokeWidth: 1, outline: "none" }
  }), [isSelected]);

  return (
    <Geography
      geography={geo}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={onMouseLeave}
      onClick={handleClick}
      style={style}
    />
  );
});

const POLITICAL_COLORS = [
  "#FCA5A5", // red-300
  "#FCD34D", // amber-300
  "#86EFAC", // green-300
  "#93C5FD", // blue-300
  "#C4B5FD", // violet-300
  "#F9A8D4", // pink-300
  "#FDBA74", // orange-300
  "#6EE7B7", // emerald-300
  "#67E8F9", // cyan-300
  "#D8B4FE", // purple-300
];

const MAJOR_CITIES: Record<string, {name: string, coordinates: [number, number]}[]> = {
  world: [
    { name: 'New York', coordinates: [-74.006, 40.7128] },
    { name: 'London', coordinates: [-0.1276, 51.5074] },
    { name: 'Tokyo', coordinates: [139.6917, 35.6895] },
    { name: 'Sydney', coordinates: [151.2093, -33.8688] },
    { name: 'Cairo', coordinates: [31.2357, 30.0444] },
    { name: 'Rio de Janeiro', coordinates: [-43.1729, -22.9068] },
  ],
  india: [
    { name: 'Delhi', coordinates: [77.2090, 28.6139] },
    { name: 'Mumbai', coordinates: [72.8777, 19.0760] },
    { name: 'Chennai', coordinates: [80.2707, 13.0827] },
    { name: 'Kolkata', coordinates: [88.3639, 22.5726] },
    { name: 'Bengaluru', coordinates: [77.5946, 12.9716] },
  ],
  europe: [
    { name: 'London', coordinates: [-0.1276, 51.5074] },
    { name: 'Paris', coordinates: [2.3522, 48.8566] },
    { name: 'Berlin', coordinates: [13.4050, 52.5200] },
    { name: 'Rome', coordinates: [12.4964, 41.9028] },
    { name: 'Madrid', coordinates: [-3.7038, 40.4168] },
  ],
  'north-america': [
    { name: 'New York', coordinates: [-74.006, 40.7128] },
    { name: 'Los Angeles', coordinates: [-118.2437, 34.0522] },
    { name: 'Toronto', coordinates: [-79.3832, 43.6532] },
    { name: 'Mexico City', coordinates: [-99.1332, 19.4326] },
  ],
  'south-america': [
    { name: 'São Paulo', coordinates: [-46.6333, -23.5505] },
    { name: 'Buenos Aires', coordinates: [-58.3816, -34.6037] },
    { name: 'Bogotá', coordinates: [-74.0721, 4.7110] },
    { name: 'Lima', coordinates: [-77.0428, -12.0464] },
  ],
  africa: [
    { name: 'Lagos', coordinates: [3.3792, 6.5244] },
    { name: 'Cairo', coordinates: [31.2357, 30.0444] },
    { name: 'Johannesburg', coordinates: [28.0473, -26.2041] },
    { name: 'Nairobi', coordinates: [36.8219, -1.2921] },
  ],
  asia: [
    { name: 'Tokyo', coordinates: [139.6917, 35.6895] },
    { name: 'Shanghai', coordinates: [121.4737, 31.2304] },
    { name: 'Delhi', coordinates: [77.2090, 28.6139] },
    { name: 'Dubai', coordinates: [55.2708, 25.2048] },
    { name: 'Singapore', coordinates: [103.8198, 1.3521] },
  ],
  oceania: [
    { name: 'Sydney', coordinates: [151.2093, -33.8688] },
    { name: 'Melbourne', coordinates: [144.9631, -37.8136] },
    { name: 'Auckland', coordinates: [174.7633, -36.8485] },
    { name: 'Fiji', coordinates: [178.0650, -17.7134] },
  ]
};

const getPoliticalColor = (name: string) => {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return POLITICAL_COLORS[Math.abs(hash) % POLITICAL_COLORS.length];
};

const GeographyList = memo(({ 
  geographies, 
  scope, 
  type, 
  gameStatus, 
  feedback, 
  selectedGeoId, 
  hoveredGeoId, 
  isDragging, 
  isMoving, 
  colors, 
  handleMouseEnter, 
  handleMouseLeave, 
  handleGeographyClick,
  getPoliticalColor
}: any) => {
  return (
    <>
      {geographies.map((geo: any) => {
        const geoId = geo.id || geo.properties?.id || geo.properties?.['hc-key'] || geo.properties?.ISO_A3 || geo.properties?.ST_NM || geo.properties?.district || geo.properties?.NAME_1 || geo.rsmKey;
        const geoName = geo.properties?.name || geo.properties?.NAME || geo.properties?.ST_NM || geo.properties?.district || geo.properties?.NAME_1 || "Unknown Region";
        const isSelected = selectedGeoId === geoId;
        const isHovered = hoveredGeoId === geoId;
        
        const strokeW = scope === 'world' ? 0.5 : 1;
        const defaultFill = type === 'political' && scope !== 'world' 
           ? getPoliticalColor(geoName) 
           : colors.default;
        
        return (
          <g key={geo.rsmKey}>
            <MemoizedGeography
              geo={geo}
              geoId={geoId}
              geoName={geoName}
              isSelected={isSelected}
              isHovered={isHovered}
              isDragging={isDragging}
              defaultFill={defaultFill}
              strokeW={strokeW}
              colors={colors}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={handleGeographyClick}
            />
            <RegionLabel 
              geo={geo} 
              name={geoName} 
              scope={scope} 
              isVisible={!isMoving && scope !== 'world' && (type === 'political' || type === 'physical') && (gameStatus !== 'playing' || (feedback && isSelected))} 
            />
          </g>
        );
      })}
    </>
  );
});

const RiverList = memo(({ 
  geographies, 
  scope, 
  gameStatus, 
  feedback, 
  selectedGeoId, 
  hoveredGeoName, 
  isMoving, 
  handleMouseEnter, 
  handleMouseLeave, 
  handleGeographyClick 
}: any) => {
  return (
    <>
      {geographies.map((geo: any) => {
        const p = geo.properties || {};
        const name = p.name || p.name_en || p.NAME || p.Name || p.name_alt || "River";
        const isSelected = selectedGeoId === name;
        return (
          <g key={geo.rsmKey}>
            <MemoizedRiver
              geo={geo}
              geoId={name}
              geoName={name}
              isSelected={isSelected}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={handleGeographyClick}
            />
            <RegionLabel 
              geo={geo} 
              name={name} 
              scope={scope} 
              isVisible={!isMoving && (gameStatus !== 'playing' || (feedback && isSelected)) && (hoveredGeoName === name || isSelected)} 
            />
          </g>
        );
      })}
    </>
  );
});

const LakeList = memo(({ 
  geographies, 
  scope, 
  gameStatus, 
  feedback, 
  selectedGeoId, 
  hoveredGeoName, 
  isMoving, 
  handleMouseEnter, 
  handleMouseLeave, 
  handleGeographyClick 
}: any) => {
  return (
    <>
      {geographies.map((geo: any) => {
        const p = geo.properties || {};
        const name = p.name || p.name_en || p.NAME || p.Name || "Lake";
        const isSelected = selectedGeoId === name;
        return (
          <g key={geo.rsmKey}>
            <MemoizedLake
              geo={geo}
              geoId={name}
              geoName={name}
              isSelected={isSelected}
              onMouseEnter={handleMouseEnter}
              onMouseLeave={handleMouseLeave}
              onClick={handleGeographyClick}
            />
            <RegionLabel 
              geo={geo} 
              name={name} 
              scope={scope} 
              isVisible={!isMoving && (gameStatus !== 'playing' || (feedback && isSelected)) && (hoveredGeoName === name || isSelected)} 
            />
          </g>
        );
      })}
    </>
  );
});

type GameStatus = 'idle' | 'playing' | 'finished' | 'practice';

interface Bookmark {
  id: string;
  name: string;
  scope: MapScope;
  type: MapType;
  center: [number, number];
  zoom: number;
  regionId?: string;
  regionName?: string;
  customQuizLocations?: ExtractedLocation[] | null;
}

import { CustomMapQuiz, ExtractedLocation, ExtractedData } from '@/components/map/CustomMapQuiz';

const SidebarSection = ({ title, children, defaultOpen = true }: { title: string, children: React.ReactNode, defaultOpen?: boolean }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  return (
    <section className="border-b border-[#1A1A1A]/10 pb-6 last:border-0 last:pb-0">
      <button 
        onClick={() => setIsOpen(!isOpen)} 
        className="w-full flex items-center justify-between text-left mb-4 group"
      >
        <h2 className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#1A1A1A]/40 group-hover:text-[#1A1A1A]/60 transition-colors m-0">{title}</h2>
        {isOpen ? <ChevronUp className="w-4 h-4 text-[#1A1A1A]/40" /> : <ChevronDown className="w-4 h-4 text-[#1A1A1A]/40" />}
      </button>
      {isOpen && (
        <div className="animate-in slide-in-from-top-2 fade-in duration-200">
          {children}
        </div>
      )}
    </section>
  );
};

export default function MapMasterPage() {
  const [appMode, setAppMode] = useState<'vector' | 'custom'>('vector');
  const [scope, setScope] = useState<MapScope>('world');
  const [type, setType] = useState<MapType>('political');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<{ correct: boolean; message: string } | null>(null);
  const [feedbackPos, setFeedbackPos] = useState<{ x: number; y: number } | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [gameStatus, setGameStatus] = useState<GameStatus>('idle');
  const [practiceInfo, setPracticeInfo] = useState<{ name: string; id: string } | null>(null);
  const [gameMode, setGameMode] = useState<'click' | 'drag'>('click');
  const [selectedGeoId, setSelectedGeoId] = useState<string | null>(null);
  const [hoveredGeoName, setHoveredGeoName] = useState<string | null>(null);
  const [hoveredGeoId, setHoveredGeoId] = useState<string | null>(null);
  const [mapData, setMapData] = useState<any>(null);
  const [riverData, setRiverData] = useState<any>(null);
  const [lakeData, setLakeData] = useState<any>(null);
  const [dynamicQuestions, setDynamicQuestions] = useState<Question[]>([]);
  const [customQuizLocations, setCustomQuizLocations] = useState<ExtractedLocation[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [keepLabelsOnDrop, setKeepLabelsOnDrop] = useState(true);
  const [droppedLabels, setDroppedLabels] = useState<{ id: string, name: string, geo: any }[]>([]);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [selectedPracticeRegion, setSelectedPracticeRegion] = useState<string | null>(null);
  const [practiceRegionInfo, setPracticeRegionInfo] = useState<{ text: string, links: any[] } | null>(null);
  const [practiceNews, setPracticeNews] = useState<string | null>(null);
  const [activePracticeTab, setActivePracticeTab] = useState<'overview' | 'news'>('overview');
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);

  const [activeTool, setActiveTool] = useState<'none' | 'elevation'>('none');
  const [weatherEnabled, setWeatherEnabled] = useState(false);
  const [weatherData, setWeatherData] = useState<any[]>([]);
  const [elevationPoints, setElevationPoints] = useState<[number, number][]>([]);
  const [elevationData, setElevationData] = useState<any[]>([]);
  const [isFetchingElevation, setIsFetchingElevation] = useState(false);

  const [bookmarks, setBookmarks] = useState<Bookmark[]>(() => {
    const saved = localStorage.getItem('mapBookmarks');
    return saved ? JSON.parse(saved) : [];
  });
  const [isAddingBookmark, setIsAddingBookmark] = useState(false);
  const [newBookmarkName, setNewBookmarkName] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    localStorage.setItem('mapBookmarks', JSON.stringify(bookmarks));
  }, [bookmarks]);

  useEffect(() => {
    let isMounted = true;
    const loadMapData = async () => {
      setIsLoading(true);
      setDynamicQuestions([]);
      try {
        const response = await fetch(MAP_SOURCES[scope]);
        if (!response.ok) throw new Error(`Failed to fetch map data: ${response.statusText}`);
        const data = await response.json();
        
        if (isMounted) {
          let features: any[] = [];
          if (data.type === 'Topology') {
            const key = Object.keys(data.objects)[0];
            features = feature(data, data.objects[key] as any).features;
          } else if (data.type === 'FeatureCollection') {
            features = data.features;
          }

          // Filter features by continent if scope is a continent
          const continentMap: Record<string, string> = {
            'asia': 'Asia',
            'africa': 'Africa',
            'europe': 'Europe',
            'north-america': 'North America',
            'south-america': 'South America',
            'oceania': 'Oceania'
          };

          if (continentMap[scope]) {
            features = features.filter((f: any) => f.properties?.CONTINENT === continentMap[scope]);
            // Also update the mapData to only include these features so the map only renders the continent
            setMapData({ ...data, features });
          } else {
            setMapData(data);
          }

          let finalQuestions: Question[] = [];
          if (type === 'political') {
            const generatedQuestions = features.map((geo: any, index: number) => {
              const geoId = geo.id || geo.properties?.id || geo.properties?.['hc-key'] || geo.properties?.ISO_A3 || geo.properties?.ST_NM || geo.properties?.district || geo.properties?.NAME_1 || `geo-${index}`;
              const geoName = geo.properties?.name || geo.properties?.NAME || geo.properties?.ST_NM || geo.properties?.district || geo.properties?.NAME_1 || "Unknown Region";

              return {
                id: `dyn-${geoId}-${index}`,
                text: `Locate ${geoName}`,
                targetId: geoId,
                targetName: geoName,
                category: 'political' as MapType
              };
            }).filter(q => q.targetName !== "Unknown Region" && q.targetName.trim() !== "");
            finalQuestions = generatedQuestions;
          } else {
            // Use predefined questions for physical, climatic, capitals
            const predefined = QUESTIONS[scope] || [];
            finalQuestions = predefined.filter(q => q.category === type);
          }

          const shuffled = [...finalQuestions].sort(() => Math.random() - 0.5);
          setDynamicQuestions(shuffled);
          
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error loading map data:", error);
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    loadMapData();
    return () => { isMounted = false; };
  }, [scope, type]);

  useEffect(() => {
    let isMounted = true;
    const loadRiverData = async () => {
      if (type !== 'rivers') return;
      setIsLoading(true);
      setDynamicQuestions([]);
      try {
        const riverUrl = RIVER_SOURCES[scope];
        const lakeUrl = LAKE_SOURCES[scope];

        let allRiverFeatures: any[] = [];
        let allLakeFeatures: any[] = [];

        if (riverUrl) {
          const res = await fetch(riverUrl);
          const data = await res.json();
          if (isMounted && data && data.features) {
            if (scope === 'india' || scope === 'world' || scope === 'odisha') {
              allRiverFeatures = data.features.filter((f: any) => {
                const props = f.properties || {};
                const name = props.name || props.name_en || props.NAME || props.Name || props.name_alt || "";

                if (scope === 'india' && (!customQuizLocations || customQuizLocations.length === 0)) {
                  const allowedIndianRivers = [
                    "Banas", "Beas", "Betwa", "Bhima", "Brahmani", "Brahmaputra", "Cauvery", 
                    "Chambal", "Chenab", "Gandak", "Ganges", "Ghäghara", "Godävari", "Indravati", 
                    "Indus", "Jhelum", "Krishna", "Mahi", "Mahäna Nadï", "Narmada", "Palar", 
                    "Parbati", "Penner", "Ravi", "Son", "Sutlej", "Tapi", "Tista", "Tungabhadra", 
                    "Wainganga", "Yamuna"
                  ];
                  return allowedIndianRivers.includes(name);
                }

                // Exclude major non-Indian rivers that might be in the global dataset
                const excluded = ["Mekong", "Salween", "Irrawaddy", "Yangtze", "Chindwin", "Sittaung", "Red River", "Pearl River", "Amur", "Lena", "Yenisei", "Ob", "Volga", "Danube", "Rhine", "Seine", "Thames", "Mississippi", "Missouri", "Amazon", "Nile", "Congo", "Zambezi", "Murray", "Darling", "Yukon", "Mackenzie", "St. Lawrence", "Rio Grande", "Orinoco", "Parana", "Niger", "Orange", "Limpopo", "Zambezi", "Okavango"];
                if (name && excluded.some(ex => name.includes(ex))) return false;

                // Bounding box for India region [68, 8, 97, 37]
                let inBBox = true;
                try {
                  const geometry = f.geometry;
                  if (geometry) {
                    let firstCoord: any = null;
                    if (geometry.type === "LineString") {
                      firstCoord = geometry.coordinates[0];
                    } else if (geometry.type === "MultiLineString") {
                      if (geometry.coordinates[0]) firstCoord = geometry.coordinates[0][0];
                    }
                    
                    if (Array.isArray(firstCoord)) {
                      const [lon, lat] = firstCoord;
                      // India roughly [68, 8, 97, 37]. Using [66, 6, 99, 39] for safety.
                      if (lon < 66 || lon > 99 || lat < 6 || lat > 39) inBBox = false;
                    }
                  }
                } catch (err) {
                  // Keep if check fails
                }
                
                return inBBox;
              });
              setRiverData({ type: "FeatureCollection", features: allRiverFeatures });
            } else {
              allRiverFeatures = data.features;
              setRiverData(data);
            }
          }
        }

        if (lakeUrl) {
          const res = await fetch(lakeUrl);
          const data = await res.json();
          if (isMounted && data && data.features) {
            if (scope === 'india' || scope === 'world' || scope === 'odisha') {
              allLakeFeatures = data.features.filter((f: any) => {
                const props = f.properties || {};
                const name = props.name || props.name_en || props.NAME || props.Name;

                if (scope === 'india' && (!customQuizLocations || customQuizLocations.length === 0)) {
                  const allowedIndianLakes = [
                    "Bhadra Reservoir", "Gandhi Sagar Dam", "Gobind Sagar Reservoir", 
                    "Hinakud Dam", "Krishna Raja Sagar", "Nagarjuna Sagar Dam", 
                    "Stanley Reservoir", "Tungabhadra"
                  ];
                  return allowedIndianLakes.includes(name);
                }

                // Bounding box for India lakes
                let inBBox = true;
                try {
                  const geometry = f.geometry;
                  if (geometry) {
                    let firstCoord: any = null;
                    if (geometry.type === "Polygon") {
                      if (geometry.coordinates[0]) firstCoord = geometry.coordinates[0][0];
                    } else if (geometry.type === "MultiPolygon") {
                      if (geometry.coordinates[0] && geometry.coordinates[0][0]) firstCoord = geometry.coordinates[0][0][0];
                    }
                    
                    if (Array.isArray(firstCoord)) {
                      const [lon, lat] = firstCoord;
                      // India roughly [68, 8, 97, 37]. Using [66, 6, 99, 39] for safety.
                      if (lon < 66 || lon > 99 || lat < 6 || lat > 39) inBBox = false;
                    }
                  }
                } catch (err) {
                  // Keep if check fails
                }

                return inBBox;
              });
              setLakeData({ type: "FeatureCollection", features: allLakeFeatures });
            } else {
              allLakeFeatures = data.features;
              setLakeData(data);
            }
          }
        }

        if (isMounted) {
          const riverQuestions = allRiverFeatures.map((geo: any, index: number) => {
            const geoId = getGeoId(geo);
            const p = geo.properties || {};
            let geoName = p.name || p.name_en || p.NAME || p.Name || p.name_alt || "Unknown River";
            
            if (scope === 'india') {
              if (geoName === 'Godävari') geoName = 'Godavari';
              if (geoName === 'Mahäna Nadï') geoName = 'Mahanadi';
              if (geoName === 'Ghäghara') geoName = 'Ghaghara';
              if (geoName === 'Cauvery') geoName = 'Kaveri';
            }

            return {
              id: `dyn-river-${geoId}-${index}`,
              text: `Locate the ${geoName}`,
              targetId: geoId,
              targetName: geoName,
              category: 'rivers' as MapType
            };
          });

          const lakeQuestions = allLakeFeatures.map((geo: any, index: number) => {
            const geoId = getGeoId(geo);
            const p = geo.properties || {};
            let geoName = p.name || p.name_en || p.NAME || p.Name || "Unknown Lake";
            
            if (scope === 'india') {
              if (geoName === 'Hinakud Dam') geoName = 'Hirakud Dam';
            }

            return {
              id: `dyn-lake-${geoId}-${index}`,
              text: `Locate ${geoName}`,
              targetId: geoId,
              targetName: geoName,
              category: 'rivers' as MapType
            };
          });

          const combined = [...riverQuestions, ...lakeQuestions]
            .filter(q => q.targetName !== "Unknown River" && q.targetName !== "Unknown Lake" && q.targetName.trim() !== "");
          
          const shuffled = combined.sort(() => Math.random() - 0.5);
          setDynamicQuestions(shuffled);
          setIsLoading(false);
        }
      } catch (e) {
        console.error("Error loading river/lake data:", e);
        if (isMounted) setIsLoading(false);
      }
    };

    loadRiverData();
    return () => { isMounted = false; };
  }, [scope, type, customQuizLocations]);

  useEffect(() => {
    if (!weatherEnabled) {
      setWeatherData([]);
      return;
    }

    let isMounted = true;
    const fetchWeather = async () => {
      const cities = MAJOR_CITIES[scope] || MAJOR_CITIES['world'];
      try {
        const promises = cities.map(async (city) => {
          const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${city.coordinates[1]}&longitude=${city.coordinates[0]}&current_weather=true`);
          const data = await res.json();
          return { ...city, weather: data.current_weather };
        });
        const results = await Promise.all(promises);
        if (isMounted) {
          setWeatherData(results);
        }
      } catch (e) {
        console.error("Error fetching weather:", e);
      }
    };
    fetchWeather();
    return () => { isMounted = false; };
  }, [weatherEnabled, scope]);

  useEffect(() => {
    if (elevationPoints.length !== 2) {
      setElevationData([]);
      return;
    }

    let isMounted = true;
    const fetchElevation = async () => {
      setIsFetchingElevation(true);
      try {
        const [p1, p2] = elevationPoints;
        const points = [];
        const steps = 20;
        for (let i = 0; i <= steps; i++) {
          const t = i / steps;
          const lon = p1[0] + (p2[0] - p1[0]) * t;
          const lat = p1[1] + (p2[1] - p1[1]) * t;
          points.push({ lon, lat });
        }
        
        const lats = points.map(p => p.lat).join(',');
        const lons = points.map(p => p.lon).join(',');
        
        const res = await fetch(`https://api.open-meteo.com/v1/elevation?latitude=${lats}&longitude=${lons}`);
        const data = await res.json();
        
        if (isMounted && data.elevation) {
          const chartData = data.elevation.map((elev: number, idx: number) => ({
            distance: `${Math.round((idx / steps) * 100)}%`,
            elevation: elev
          }));
          setElevationData(chartData);
        }
      } catch (e) {
        console.error("Error fetching elevation:", e);
      } finally {
        if (isMounted) setIsFetchingElevation(false);
      }
    };
    fetchElevation();
    return () => { isMounted = false; };
  }, [elevationPoints]);

  const currentQuestions = useMemo(() => {
    if (customQuizLocations && customQuizLocations.length > 0) {
      return customQuizLocations.map((loc, index) => ({
        id: `custom-${index}`,
        targetId: loc.name,
        targetName: loc.name,
        text: `Find ${loc.name}`,
        category: type,
        hint: `Look for ${loc.name} on the map.`
      }));
    }

    let baseQuestions = [];
    if (type === 'political' || type === 'rivers') {
      baseQuestions = dynamicQuestions;
    } else {
      baseQuestions = QUESTIONS[scope]?.filter(q => q.category === type) || [];
    }

    return baseQuestions;
  }, [scope, type, dynamicQuestions, customQuizLocations]);

  const [isMoving, setIsMoving] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const handleMoveStart = useCallback(() => setIsMoving(true), []);
  const handleMoveEnd = useCallback(() => setIsMoving(false), []);

  const getMapColors = () => {
    switch (type) {
      case 'physical':
        return {
          bg: "#E8F5E9",
          default: "#A5D6A7",
          hover: "#81C784",
          selected: "#2E7D32"
        };
      case 'climatic':
        return {
          bg: "#FFF3E0",
          default: "#FFCC80",
          hover: "#FFB74D",
          selected: "#E65100"
        };
      case 'capitals':
        return {
          bg: "#F3E5F5",
          default: "#CE93D8",
          hover: "#BA68C8",
          selected: "#7B1FA2"
        };
      case 'rivers':
        return {
          bg: "#E3F2FD",
          default: "#BBDEFB",
          hover: "#90CAF9",
          selected: "#1976D2"
        };
      default:
        return {
          bg: "#FDFCF8",
          default: "#F5F5F0",
          hover: "#E6D5B8",
          selected: "#1A1A1A"
        };
    }
  };

  const getMapTransform = () => {
    switch (scope) {
      case 'india': return { center: [80, 22] as [number, number], zoom: 1 };
      case 'odisha': return { center: [84.5, 20.5] as [number, number], zoom: 1 };
      case 'asia': return { center: [90, 30] as [number, number], zoom: 2 };
      case 'africa': return { center: [20, 0] as [number, number], zoom: 2.5 };
      case 'europe': return { center: [20, 50] as [number, number], zoom: 3.5 };
      case 'north-america': return { center: [-100, 40] as [number, number], zoom: 2 };
      case 'south-america': return { center: [-60, -20] as [number, number], zoom: 2.5 };
      case 'oceania': return { center: [140, -20] as [number, number], zoom: 3 };
      default: return { center: [0, 0] as [number, number], zoom: 1 };
    }
  };

  const colors = useMemo(() => getMapColors(), [type]);
  const mapTransform = useMemo(() => getMapTransform(), [scope]);

  const currentQuestion = currentQuestions[currentQuestionIndex];

  const handleMouseEnter = useCallback((name: string, id: string, geo: any) => {
    setHoveredGeoName(name);
    setHoveredGeoId(id);
    (window as any)._hoveredGeo = geo;
    if (gameStatus === 'practice') {
      setPracticeInfo({ name, id });
    }
  }, [gameStatus]);

  const handleMouseLeave = useCallback(() => {
    setHoveredGeoName(null);
    setHoveredGeoId(null);
    (window as any)._hoveredGeo = null;
    if (gameStatus === 'practice') {
      setPracticeInfo(null);
    }
  }, [gameStatus]);

  const processAnswer = useCallback((geo: any) => {
    if (!currentQuestion) return;
    const geoId = getGeoId(geo);
    const geoName = geo.properties?.name || geo.properties?.NAME || geo.properties?.ST_NM || geo.properties?.district || geo.properties?.NAME_1 || geo.properties?.name_en || geo.properties?.NAME_EN;

    setSelectedGeoId(geoId);

    const normalize = (s: string) => s ? s.toLowerCase().replace(/ river| lake/g, '').trim() : "";
    const targetNorm = normalize(currentQuestion.targetName);
    const targetIdNorm = normalize(currentQuestion.targetId);
    
    const isCorrect = normalize(geoId) === targetIdNorm || 
                      normalize(geoId) === targetNorm ||
                      normalize(geoName || "") === targetNorm ||
                      normalize(geo.properties?.name_en || "") === targetNorm ||
                      normalize(geo.properties?.NAME_EN || "") === targetNorm ||
                      geoId === currentQuestion.targetId;

    if (isCorrect) {
      setScore(s => s + 1);
      setFeedback({ correct: true, message: `Correct! That is ${geoName}.` });
      if (gameMode === 'drag' && keepLabelsOnDrop) {
        setDroppedLabels(prev => {
          // Prevent duplicates in manual drops
          if (prev.some(l => l.id === geoId)) return prev;
          return [...prev, { id: geoId, name: geoName, geo }];
        });
      }
    } else {
      setFeedback({ correct: false, message: `Incorrect. That is ${geoName}. Try to find ${currentQuestion.targetName}.` });
    }

    setTimeout(() => {
      setFeedback(null);
      setSelectedGeoId(null);
      if (isCorrect) {
        if (currentQuestionIndex < currentQuestions.length - 1) {
          setCurrentQuestionIndex(i => i + 1);
        } else {
          setGameStatus('finished');
          setShowConfetti(true);
          setTimeout(() => setShowConfetti(false), 5000);
        }
      }
    }, 2000);
  }, [currentQuestion, currentQuestionIndex, currentQuestions.length, gameMode, keepLabelsOnDrop]);

  const handleGeographyClick = useCallback((geo: any, e: React.MouseEvent) => {
    if (activeTool === 'elevation') {
      const centroid = geoCentroid(geo);
      if (centroid && !isNaN(centroid[0]) && !isNaN(centroid[1])) {
        setElevationPoints(prev => {
          if (prev.length >= 2) return [centroid as [number, number]];
          return [...prev, centroid as [number, number]];
        });
      }
      return;
    }
    if (gameStatus === 'practice') {
      const geoName = geo.properties?.name || geo.properties?.NAME || geo.properties?.ST_NM || geo.properties?.district || geo.properties?.NAME_1 || geo.properties?.name_en || geo.properties?.NAME_EN;
      if (geoName) {
        setSelectedPracticeRegion(geoName);
      }
      return;
    }
    if (gameStatus !== 'playing' || feedback || gameMode === 'drag') return;
    setFeedbackPos({ x: e.clientX, y: e.clientY });
    processAnswer(geo);
  }, [gameStatus, feedback, gameMode, processAnswer, activeTool]);

  const handleDragEnd = (geo: any) => {
    if (gameStatus !== 'playing' || feedback || !geo) return;
    processAnswer(geo);
  };

  const skipQuestion = () => {
    if (gameStatus !== 'playing' || feedback || !currentQuestion) return;
    
    // Highlight the correct answer
    setSelectedGeoId(currentQuestion.targetId);
    setFeedback({ 
      correct: false, 
      message: `Skipped. The correct answer was ${currentQuestion.targetName}.` 
    });

    setTimeout(() => {
      setFeedback(null);
      setSelectedGeoId(null);
      if (currentQuestionIndex < currentQuestions.length - 1) {
        setCurrentQuestionIndex(i => i + 1);
      } else {
        setGameStatus('finished');
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }, 2500);
  };

  const getGeoId = (geo: any) => {
    const p = geo.properties || {};
    return geo.id || p.id || p['hc-key'] || p.ISO_A3 || p.ST_NM || p.district || p.NAME_1 || p.name || p.name_en || p.NAME || p.Name || p.name_alt;
  };

  const submitQuiz = () => {
    if (gameStatus !== 'playing') return;
    
    // Find all correct geographies for all questions in the current quiz
    const allLabels = currentQuestions.map(q => {
      let foundGeo = null;
      if (customQuizLocations && customQuizLocations.length > 0) {
        const loc = customQuizLocations.find(l => l.name === q.targetId);
        if (loc) {
          foundGeo = {
            properties: { name: loc.name, id: loc.name },
            geometry: { type: "Point", coordinates: [loc.lng, loc.lat] }
          };
        }
      } else if (type === 'rivers') {
        const riverFeat = riverData?.features?.find((f: any) => getGeoId(f) === q.targetId);
        const lakeFeat = lakeData?.features?.find((f: any) => getGeoId(f) === q.targetId);
        foundGeo = riverFeat || lakeFeat;
      } else {
        foundGeo = mapData?.features?.find((f: any) => getGeoId(f) === q.targetId);
      }
      return { id: q.targetId, name: q.targetName, geo: foundGeo };
    }).filter(l => l.geo);

    // De-duplicate labels by ID to prevent React key warnings
    const uniqueLabels = Array.from(new Map(allLabels.map(item => [item.id, item])).values());

    setDroppedLabels(uniqueLabels);
    setGameStatus('finished');
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 5000);
  };

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsFullScreen(false);
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, []);

  useEffect(() => {
    if (!selectedPracticeRegion) {
      setPracticeRegionInfo(null);
      return;
    }
    
    let isMounted = true;
    const fetchInfo = async () => {
      setIsFetchingInfo(true);
      try {
        const { GoogleGenAI } = await import('@google/genai');
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });
        
        const [overviewResponse, newsResponse] = await Promise.all([
          ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Provide a brief, 2-paragraph geographical and cultural overview of ${selectedPracticeRegion}. Mention a couple of top landmarks.`,
            config: {
              tools: [{ googleMaps: {} }],
            },
          }),
          ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `What are the top 3 current news events happening in or related to ${selectedPracticeRegion}? Keep it brief and factual.`,
            config: {
              tools: [{ googleSearch: {} }],
            },
          })
        ]);
        
        if (isMounted) {
          const text = overviewResponse.text || "";
          const chunks = overviewResponse.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
          const links = chunks.map((chunk: any) => {
            if (chunk.maps?.uri) {
              return { title: chunk.maps.title || 'View on Maps', uri: chunk.maps.uri };
            }
            return null;
          }).filter(Boolean);
          
          const uniqueLinks = Array.from(new Map(links.map((l: any) => [l.uri, l])).values());
          
          setPracticeRegionInfo({ text, links: uniqueLinks });
          setPracticeNews(newsResponse.text || "No recent news found.");
        }
      } catch (error) {
        console.error("Error fetching region info:", error);
        if (isMounted) {
          setPracticeRegionInfo({ text: "Failed to load information. Please try again later.", links: [] });
          setPracticeNews("Failed to load news.");
        }
      } finally {
        if (isMounted) {
          setIsFetchingInfo(false);
        }
      }
    };
    
    fetchInfo();
    return () => { isMounted = false; };
  }, [selectedPracticeRegion]);

  const startPractice = () => {
    setGameStatus('practice');
    setScore(0);
    setFeedback(null);
    setSelectedGeoId(null);
    setDroppedLabels([]);
    setSelectedPracticeRegion(null);
    setActivePracticeTab('overview');
  };

  const exitPractice = () => {
    setGameStatus('idle');
    setPracticeInfo(null);
    setSelectedPracticeRegion(null);
  };

  const startGame = () => {
    if (currentQuestions.length === 0) return;
    setScore(0);
    setCurrentQuestionIndex(0);
    setGameStatus('playing');
    setFeedback(null);
    setDroppedLabels([]);
  };

  const resetGame = () => {
    setGameStatus('idle');
    setScore(0);
    setCurrentQuestionIndex(0);
    setDroppedLabels([]);
  };

  return (
    <div className="h-screen flex flex-col bg-[#FDFCF8] text-[#1A1A1A] font-sans selection:bg-[#E6D5B8] overflow-hidden">
      {showConfetti && <ReactConfetti />}
      
      {/* Header */}
      <header className="border-b border-[#1A1A1A]/10 bg-white/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-[#1A1A1A]/5 rounded-xl transition-colors text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
              title={isSidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
            >
              {isSidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
            </button>
            <div className="w-10 h-10 bg-[#1A1A1A] rounded-xl flex items-center justify-center text-white">
              <Compass className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight uppercase">UPSC Map Master</h1>
              <p className="text-[10px] font-medium text-[#1A1A1A]/50 uppercase tracking-widest">Geography & Cartography</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex bg-[#1A1A1A]/5 p-1 rounded-lg">
              <button
                onClick={() => setAppMode('vector')}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-md transition-colors",
                  appMode === 'vector' ? "bg-white shadow-sm text-[#1A1A1A]" : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                )}
              >
                Vector Maps
              </button>
              <button
                onClick={() => setAppMode('custom')}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold rounded-md transition-colors",
                  appMode === 'custom' ? "bg-white shadow-sm text-[#1A1A1A]" : "text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                )}
              >
                Custom Upload
              </button>
            </div>
            {appMode === 'vector' && gameStatus === 'practice' && (
              <div className="flex items-center gap-4">
                <div className="px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-emerald-600 text-xs font-bold flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                  PRACTICE MODE
                </div>
                <button
                  onClick={exitPractice}
                  className="px-4 py-2 bg-[#1A1A1A]/5 hover:bg-[#1A1A1A]/10 border border-[#1A1A1A]/10 rounded-full text-[#1A1A1A] text-xs font-bold transition-colors"
                >
                  EXIT
                </button>
              </div>
            )}
            {appMode === 'vector' && (
              <div className="flex items-center gap-2 bg-[#F5F5F0] px-4 py-2 rounded-full border border-[#1A1A1A]/5">
                <Trophy className="w-4 h-4 text-[#B8860B]" />
                <span className="text-sm font-bold">{score} / {currentQuestions.length}</span>
              </div>
            )}
            {appMode === 'vector' && (
              <button 
                onClick={resetGame}
                className="p-2 hover:bg-[#F5F5F0] rounded-full transition-colors"
              >
                <RotateCcw className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </header>

      {appMode === 'custom' ? (
        <CustomMapQuiz 
          onStartCustomVectorQuiz={(data) => {
            setScope((data.scope || 'world').toLowerCase() as MapScope);
            setType((data.type || 'political').toLowerCase() as MapType);
            setCustomQuizLocations(data.labels || []);
            setAppMode('vector');
            setGameStatus('playing');
            setCurrentQuestionIndex(0);
            setScore(0);
            setFeedback(null);
            setFeedbackPos(null);
          }}
        />
      ) : (
        <main className={cn(
          "flex-1 w-full mx-auto p-4 lg:px-6 lg:py-6 flex flex-col lg:flex-row gap-4 lg:gap-8 overflow-y-auto lg:overflow-hidden transition-all duration-300",
          isSidebarOpen ? "max-w-7xl" : "max-w-[1600px]"
        )}>
        {/* Sidebar Controls */}
        {isSidebarOpen && (
          <aside className="w-full lg:w-[300px] shrink-0 space-y-6 lg:space-y-8 lg:overflow-y-auto lg:pr-4 pb-8">
            <SidebarSection title="Activity Mode">
            <div className="grid gap-2">
              <button
                onClick={startGame}
                disabled={currentQuestions.length === 0}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left",
                  gameStatus === 'playing' 
                    ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                    : "bg-white border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30",
                  currentQuestions.length === 0 && "opacity-50 cursor-not-allowed"
                )}
              >
                <Trophy className="w-4 h-4" />
                <span className="text-sm font-medium">Quiz Mode</span>
              </button>
              <button
                onClick={startPractice}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left",
                  gameStatus === 'practice' 
                    ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                    : "bg-white border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
                )}
              >
                <Search className="w-4 h-4" />
                <span className="text-sm font-medium">Practice Mode</span>
              </button>
            </div>
          </SidebarSection>

          <SidebarSection title="Quiz Style">
            <div className="flex flex-col gap-3">
              <div className="flex bg-white border border-[#1A1A1A]/10 rounded-xl p-1">
                <button
                  onClick={() => { setGameMode('click'); if (gameStatus !== 'practice') resetGame(); }}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    gameMode === 'click' ? "bg-[#1A1A1A] text-white" : "text-[#1A1A1A]/60 hover:bg-[#F5F5F0]"
                  )}
                >
                  Point & Click
                </button>
                <button
                  onClick={() => { setGameMode('drag'); if (gameStatus !== 'practice') resetGame(); }}
                  className={cn(
                    "flex-1 py-2 text-xs font-bold rounded-lg transition-all",
                    gameMode === 'drag' ? "bg-[#1A1A1A] text-white" : "text-[#1A1A1A]/60 hover:bg-[#F5F5F0]"
                  )}
                >
                  Drag & Drop
                </button>
              </div>
              {gameMode === 'drag' && (
                <label className="flex items-center gap-2 px-2 cursor-pointer">
                  <input 
                    type="checkbox" 
                    checked={keepLabelsOnDrop}
                    onChange={(e) => setKeepLabelsOnDrop(e.target.checked)}
                    className="w-4 h-4 accent-[#1A1A1A] rounded"
                  />
                  <span className="text-xs font-medium text-[#1A1A1A]/80">Keep labels on correct drop</span>
                </label>
              )}
            </div>
          </SidebarSection>

          <SidebarSection title="Select Scope">
            <div className="grid gap-2">
              {(['world', 'asia', 'africa', 'europe', 'north-america', 'south-america', 'oceania', 'india', 'odisha'] as MapScope[]).map((s) => (
                <button
                  key={s}
                  onClick={() => { 
                    setScope(s); 
                    setCustomQuizLocations(null);
                    if (gameStatus !== 'practice') {
                      resetGame(); 
                    } else {
                      setDroppedLabels([]);
                      setFeedback(null);
                      setSelectedGeoId(null);
                    }
                  }}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl border transition-all duration-200 text-left",
                    scope === s 
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A] shadow-lg shadow-[#1A1A1A]/20" 
                      : "bg-white border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
                  )}
                >
                  <div className="flex items-center gap-3">
                    {s === 'world' && <Globe className="w-4 h-4" />}
                    {['asia', 'africa', 'europe', 'north-america', 'south-america', 'oceania'].includes(s) && <MapIcon className="w-4 h-4" />}
                    {s === 'india' && <Flag className="w-4 h-4" />}
                    {s === 'odisha' && <MapIcon className="w-4 h-4" />}
                    <span className="text-sm font-medium capitalize">{s.replace('-', ' ')}</span>
                  </div>
                  {scope === s && <ChevronRight className="w-4 h-4" />}
                </button>
              ))}
            </div>
          </SidebarSection>

          <SidebarSection title="Map Layer" defaultOpen={false}>
            <div className="grid gap-2">
              {[
                { id: 'political', icon: Flag, label: 'Political' },
                { id: 'physical', icon: Mountain, label: 'Physical' },
                { id: 'climatic', icon: CloudSun, label: 'Climatic' },
                { id: 'capitals', icon: Landmark, label: 'Capitals' },
                { id: 'rivers', icon: Compass, label: 'Rivers' },
              ].map((l) => (
                <button
                  key={l.id}
                  onClick={() => { 
                    setType(l.id as MapType); 
                    setCustomQuizLocations(null);
                    if (gameStatus !== 'practice') {
                      resetGame(); 
                    } else {
                      setDroppedLabels([]);
                      setFeedback(null);
                      setSelectedGeoId(null);
                    }
                  }}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left",
                    type === l.id 
                      ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                      : "bg-white border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
                  )}
                >
                  <l.icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{l.label}</span>
                </button>
              ))}
            </div>
          </SidebarSection>

          <SidebarSection title="Bookmarks" defaultOpen={false}>
            <div className="flex flex-col gap-2">
              {bookmarks.map((bookmark) => (
                <div key={bookmark.id} className="flex items-center justify-between px-4 py-3 rounded-xl border bg-white border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30 transition-all">
                  <button
                    onClick={() => {
                      setScope(bookmark.scope);
                      setType(bookmark.type);
                      setCustomQuizLocations(bookmark.customQuizLocations || null);
                      if (bookmark.regionId) {
                        setSelectedGeoId(bookmark.regionId);
                        if (bookmark.regionName) {
                          setSelectedPracticeRegion(bookmark.regionName);
                        }
                      } else {
                        setSelectedGeoId(null);
                        setSelectedPracticeRegion(null);
                      }
                      
                      // Also reset the game logic if we were playing, to start a fresh map check
                      if (gameStatus !== 'practice') {
                        setGameStatus('idle');
                        setScore(0);
                        setFeedback(null);
                        setCurrentQuestionIndex(0);
                      }
                    }}
                    className="flex items-center gap-3 text-left flex-1 overflow-hidden"
                  >
                    <Bookmark className={cn("w-4 h-4 shrink-0", bookmark.customQuizLocations ? "text-blue-500 fill-blue-500/20" : "text-[#1A1A1A]/60")} />
                    <div className="flex flex-col truncate">
                      <span className="text-sm font-medium truncate">{bookmark.name}</span>
                      {bookmark.customQuizLocations && (
                        <span className="text-[10px] text-blue-500/80 font-bold uppercase tracking-wider">Custom Upload</span>
                      )}
                    </div>
                  </button>
                  <button
                    onClick={() => {
                      setBookmarks(prev => prev.filter(b => b.id !== bookmark.id));
                    }}
                    className="p-1 hover:bg-[#FFEBEE] hover:text-[#C62828] rounded-md transition-colors text-[#1A1A1A]/40 shrink-0 ml-2"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              
              {isAddingBookmark ? (
                <div className="flex items-center gap-2 px-3 py-2 rounded-xl border border-[#1A1A1A]/30 bg-white shadow-sm">
                  <input
                    type="text"
                    value={newBookmarkName}
                    onChange={(e) => setNewBookmarkName(e.target.value)}
                    placeholder="Bookmark name..."
                    className="flex-1 text-sm outline-none bg-transparent min-w-0"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && newBookmarkName.trim()) {
                        const newBookmark: Bookmark = {
                          id: Date.now().toString(),
                          name: newBookmarkName.trim(),
                          scope,
                          type,
                          center: mapTransform.center,
                          zoom: mapTransform.zoom,
                          regionId: selectedGeoId || undefined,
                          regionName: selectedPracticeRegion || undefined,
                          customQuizLocations: customQuizLocations,
                        };
                        setBookmarks(prev => [...prev, newBookmark]);
                        setIsAddingBookmark(false);
                        setNewBookmarkName("");
                      } else if (e.key === 'Escape') {
                        setIsAddingBookmark(false);
                        setNewBookmarkName("");
                      }
                    }}
                  />
                  <button 
                    onClick={() => {
                      if (newBookmarkName.trim()) {
                        const newBookmark: Bookmark = {
                          id: Date.now().toString(),
                          name: newBookmarkName.trim(),
                          scope,
                          type,
                          center: mapTransform.center,
                          zoom: mapTransform.zoom,
                          regionId: selectedGeoId || undefined,
                          regionName: selectedPracticeRegion || undefined,
                          customQuizLocations: customQuizLocations,
                        };
                        setBookmarks(prev => [...prev, newBookmark]);
                        setIsAddingBookmark(false);
                        setNewBookmarkName("");
                      }
                    }}
                    className="p-1 bg-[#1A1A1A] text-white rounded hover:bg-[#333] shrink-0"
                  >
                    <CheckSquare className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => {
                      setIsAddingBookmark(false);
                      setNewBookmarkName("");
                    }}
                    className="p-1 hover:bg-[#F5F5F0] rounded shrink-0"
                  >
                    <XCircle className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setIsAddingBookmark(true)}
                  className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-[#1A1A1A]/20 hover:border-[#1A1A1A]/40 hover:bg-[#F5F5F0] transition-all text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                >
                  <Bookmark className="w-4 h-4" />
                  <span className="text-sm font-medium">Save Bookmark</span>
                </button>
              )}
            </div>
          </SidebarSection>

          <SidebarSection title="Map Tools" defaultOpen={false}>
            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 px-4 py-3 rounded-xl border border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30 bg-white cursor-pointer transition-all">
                <input 
                  type="checkbox" 
                  checked={weatherEnabled}
                  onChange={(e) => setWeatherEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[#1A1A1A] rounded"
                />
                <CloudRain className="w-4 h-4 text-[#1A1A1A]/60" />
                <span className="text-sm font-medium text-[#1A1A1A]">Live Weather</span>
              </label>
              
              <button
                onClick={() => {
                  setActiveTool(activeTool === 'elevation' ? 'none' : 'elevation');
                  setElevationPoints([]);
                  setElevationData([]);
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl border transition-all duration-200 text-left",
                  activeTool === 'elevation'
                    ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" 
                    : "bg-white border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
                )}
              >
                <LineChart className="w-4 h-4" />
                <span className="text-sm font-medium">Elevation Profile</span>
              </button>
            </div>
          </SidebarSection>

          <div className="p-6 bg-[#E6D5B8]/20 rounded-2xl border border-[#E6D5B8] space-y-3">
            <div className="flex items-center gap-2 text-[#8B4513]">
              <Info className="w-4 h-4" />
              <span className="text-[11px] font-bold uppercase tracking-wider">UPSC Tip</span>
            </div>
            <p className="text-xs leading-relaxed text-[#5D4037]">
              Focus on neighboring countries, major mountain ranges, and climatic transitions. For Odisha, remember the coastal districts and river basins.
            </p>
          </div>
        </aside>
        )}

        {/* Map Area */}
        <div 
          ref={mapContainerRef}
          className={cn(
            "relative rounded-[32px] border border-[#1A1A1A]/10 shadow-2xl shadow-[#1A1A1A]/5 overflow-hidden flex flex-col transition-all duration-500 flex-1 w-full",
            isFullScreen ? "fixed inset-0 z-[100] rounded-none border-none" : "h-[600px] lg:h-full"
          )}
          style={{ backgroundColor: colors.bg }}
        >
          {/* Full Screen Toggle */}
          <button
            onClick={() => setIsFullScreen(!isFullScreen)}
            className="absolute top-8 right-8 z-20 p-3 bg-white/80 backdrop-blur-md rounded-xl border border-[#1A1A1A]/10 shadow-lg hover:bg-white transition-all group"
            title={isFullScreen ? "Exit Full Screen" : "Full Screen"}
          >
            {isFullScreen ? (
              <Minimize className="w-5 h-5 text-[#1A1A1A]" />
            ) : (
              <Maximize className="w-5 h-5 text-[#1A1A1A]" />
            )}
          </button>

          {/* Quiz Overlay */}
          <div className="absolute top-8 left-0 right-0 flex justify-center z-10 pointer-events-none">
            <div className="w-full max-w-sm px-4">
              <AnimatePresence mode="wait">
                {gameStatus === 'playing' && currentQuestions.length === 0 && (
                  <motion.div
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="bg-[#1A1A1A] text-white p-4 rounded-2xl shadow-2xl border border-white/10 text-center relative pointer-events-auto"
                  >
                    <h3 className="text-lg font-medium leading-tight mb-2">No Questions Found</h3>
                    <p className="text-sm text-white/70">
                      We couldn't find any matching locations for this map. Try a different map or clear the custom labels.
                    </p>
                  </motion.div>
                )}
                {gameStatus === 'playing' && currentQuestion && (
                  <motion.div
                    drag
                    dragConstraints={mapContainerRef}
                    dragMomentum={false}
                    initial={{ y: -20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: -20, opacity: 0 }}
                    className="bg-[#1A1A1A] text-white p-4 rounded-2xl shadow-2xl border border-white/10 text-center relative pointer-events-auto cursor-move"
                  >
                  <div className="flex items-center justify-between mb-3 opacity-40">
                    <GripHorizontal className="w-4 h-4" />
                    <p className="text-[9px] font-bold uppercase tracking-[0.2em]">Q {currentQuestionIndex + 1} / {currentQuestions.length}</p>
                    <div className="w-4" /> {/* Spacer for symmetry */}
                  </div>
                  
                  {gameMode === 'click' ? (
                    <h3 className="text-lg font-medium leading-tight mb-1">{currentQuestion.text}</h3>
                  ) : (
                    <div className="flex flex-col items-center gap-3">
                      <p className="text-xs text-white/60">Drag label to location:</p>
                      <motion.div
                        drag
                        dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                        dragElastic={1}
                        onDragStart={(e) => {
                          e.stopPropagation();
                          setIsDragging(true);
                        }}
                        onDragEnd={(event, info) => {
                          setIsDragging(false);
                          const hoveredGeo = (window as any)._hoveredGeo;
                          if (hoveredGeo) {
                            setFeedbackPos({ x: info.point.x, y: info.point.y });
                            handleDragEnd(hoveredGeo);
                          }
                        }}
                        whileDrag={{ scale: 1.1, zIndex: 100 }}
                        className={cn(
                          "px-4 py-2 bg-[#E6D5B8] text-[#1A1A1A] rounded-full font-bold shadow-xl cursor-grab active:cursor-grabbing border-2 border-white/20 transition-shadow text-sm",
                          isDragging && "pointer-events-none shadow-2xl"
                        )}
                        style={{ touchAction: 'none' }}
                      >
                        {currentQuestion.targetName}
                      </motion.div>
                    </div>
                  )}

                  {currentQuestion.hint && (
                    <p className="mt-1 text-[10px] text-white/40 italic">Hint: {currentQuestion.hint}</p>
                  )}

                  <div className="mt-4 flex items-center justify-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        skipQuestion();
                      }}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors border border-white/10 group relative cursor-pointer"
                      title="Skip Question"
                    >
                      <SkipForward className="w-4 h-4" />
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">Skip</span>
                    </button>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        submitQuiz();
                      }}
                      className="p-2 bg-[#4CAF50] hover:bg-[#45a049] rounded-lg transition-colors border border-white/10 group relative cursor-pointer"
                      title="Submit Quiz"
                    >
                      <CheckSquare className="w-4 h-4" />
                      <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-[#1A1A1A] text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap border border-white/10">Submit</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

          {/* Hover Tooltip (Study/Practice Mode) */}
          <AnimatePresence>
            {(gameStatus === 'idle' || gameStatus === 'practice') && hoveredGeoName && !isMoving && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 bg-[#1A1A1A]/90 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/10 shadow-2xl flex items-center gap-3 pointer-events-none"
              >
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span className="text-white font-medium text-lg tracking-tight">{hoveredGeoName}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Feedback Toast */}
          <AnimatePresence>
            {feedback && feedbackPos && (
              <motion.div
                initial={{ y: 20, opacity: 0, scale: 0.9 }}
                animate={{ y: 0, opacity: 1, scale: 1 }}
                exit={{ y: 20, opacity: 0, scale: 0.9 }}
                className={cn(
                  "fixed z-50 px-6 py-4 rounded-2xl flex items-center gap-3 shadow-xl border -translate-x-1/2 -translate-y-full pointer-events-none",
                  feedback.correct 
                    ? "bg-[#E8F5E9] text-[#2E7D32] border-[#C8E6C9]" 
                    : "bg-[#FFEBEE] text-[#C62828] border-[#FFCDD2]"
                )}
                style={{
                  left: feedbackPos.x,
                  top: feedbackPos.y - 20, // slightly above the cursor
                }}
              >
                {feedback.correct ? <CheckCircle2 className="w-5 h-5" /> : <XCircle className="w-5 h-5" />}
                <span className="text-sm font-bold">{feedback.message}</span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Practice Mode Info Panel */}
          <AnimatePresence>
            {gameStatus === 'practice' && selectedPracticeRegion && (
              <motion.div
                initial={{ x: '100%', opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: '100%', opacity: 0 }}
                className="absolute top-0 right-0 bottom-0 w-80 bg-white/95 backdrop-blur-xl border-l border-[#1A1A1A]/10 shadow-2xl z-40 flex flex-col"
              >
                <div className="p-4 border-b border-[#1A1A1A]/10 flex items-center justify-between bg-white">
                  <h3 className="font-bold text-lg truncate pr-4">{selectedPracticeRegion}</h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button 
                      onClick={() => {
                        const isBookmarked = bookmarks.some(b => b.regionId === selectedGeoId);
                        if (isBookmarked) {
                          setBookmarks(prev => prev.filter(b => b.regionId !== selectedGeoId));
                        } else {
                          const newBookmark: Bookmark = {
                            id: Date.now().toString(),
                            name: selectedPracticeRegion,
                            scope,
                            type,
                            center: mapTransform.center,
                            zoom: mapTransform.zoom,
                            regionId: selectedGeoId || undefined,
                            regionName: selectedPracticeRegion || undefined,
                            customQuizLocations: customQuizLocations,
                          };
                          setBookmarks(prev => [...prev, newBookmark]);
                        }
                      }}
                      className="p-2 hover:bg-[#F5F5F0] rounded-full transition-colors"
                      title="Bookmark Region"
                    >
                      <Bookmark className={cn("w-5 h-5", bookmarks.some(b => b.regionId === selectedGeoId) ? "fill-[#1A1A1A] text-[#1A1A1A]" : "text-[#1A1A1A]/60")} />
                    </button>
                    <button 
                      onClick={() => setSelectedPracticeRegion(null)}
                      className="p-2 hover:bg-[#F5F5F0] rounded-full transition-colors"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                
                <div className="flex border-b border-[#1A1A1A]/10 bg-[#F5F5F0]">
                  <button
                    onClick={() => setActivePracticeTab('overview')}
                    className={cn(
                      "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors",
                      activePracticeTab === 'overview' ? "bg-white border-b-2 border-[#1A1A1A] text-[#1A1A1A]" : "text-[#1A1A1A]/50 hover:text-[#1A1A1A]"
                    )}
                  >
                    Overview
                  </button>
                  <button
                    onClick={() => setActivePracticeTab('news')}
                    className={cn(
                      "flex-1 py-3 text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2",
                      activePracticeTab === 'news' ? "bg-white border-b-2 border-[#1A1A1A] text-[#1A1A1A]" : "text-[#1A1A1A]/50 hover:text-[#1A1A1A]"
                    )}
                  >
                    <Newspaper className="w-3 h-3" />
                    Live News
                  </button>
                </div>
                
                <div className="flex-1 overflow-y-auto p-6">
                  {isFetchingInfo ? (
                    <div className="flex flex-col items-center justify-center h-full gap-4 text-[#1A1A1A]/50">
                      <div className="w-8 h-8 border-4 border-[#1A1A1A]/20 border-t-[#1A1A1A] rounded-full animate-spin" />
                      <p className="text-sm font-medium animate-pulse">Gathering intel...</p>
                    </div>
                  ) : practiceRegionInfo ? (
                    <div className="space-y-6">
                      {activePracticeTab === 'overview' ? (
                        <>
                          <div className="prose prose-sm prose-stone">
                            <Markdown>{practiceRegionInfo.text}</Markdown>
                          </div>
                          
                          {practiceRegionInfo.links.length > 0 && (
                            <div className="space-y-3 pt-4 border-t border-[#1A1A1A]/10">
                              <h4 className="text-xs font-bold uppercase tracking-wider text-[#1A1A1A]/50">Map References</h4>
                              <div className="flex flex-col gap-2">
                                {practiceRegionInfo.links.map((link: any, idx: number) => (
                                  <a 
                                    key={idx} 
                                    href={link.uri} 
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 hover:underline bg-blue-50/50 p-2 rounded-lg transition-colors"
                                  >
                                    <MapIcon className="w-4 h-4 shrink-0" />
                                    <span className="truncate">{link.title}</span>
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="prose prose-sm prose-stone">
                          <Markdown>{practiceNews || "No news available."}</Markdown>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Map Rendering */}
          <div className="flex-1 w-full h-full cursor-crosshair relative">
            {isLoading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-40">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-4 border-[#1A1A1A] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1A1A1A]/60">Loading {scope} Map...</p>
                </div>
              </div>
            ) : (
              <ComposableMap
                key={scope} // CRITICAL: Force re-render on scope change
                projection={['india', 'odisha'].includes(scope) ? "geoMercator" : "geoEqualEarth"}
                projectionConfig={
                  scope === 'india' 
                    ? { scale: 1000, center: [80, 22] } 
                    : scope === 'odisha'
                    ? { scale: 4500, center: [84.5, 20.5] }
                    : {}
                }
                style={{ width: "100%", height: "100%" }}
              >
                <ZoomableGroup 
                  center={mapTransform.center}
                  zoom={mapTransform.zoom}
                  onMoveStart={handleMoveStart}
                  onMoveEnd={handleMoveEnd}
                >
                  {!['india', 'odisha'].includes(scope) && (
                    <>
                      <Sphere stroke="#1A1A1A" strokeWidth={0.5} fill="transparent" id="sphere" />
                      <Graticule stroke="#1A1A1A" strokeWidth={0.5} opacity={0.1} />
                    </>
                  )}
                  <Geographies key={`${scope}-${type}`} geography={mapData}>
                    {({ geographies }) => (
                      <GeographyList 
                        geographies={geographies}
                        scope={scope}
                        type={type}
                        gameStatus={gameStatus}
                        feedback={feedback}
                        selectedGeoId={selectedGeoId}
                        hoveredGeoId={hoveredGeoId}
                        isDragging={isDragging}
                        isMoving={isMoving}
                        colors={colors}
                        handleMouseEnter={handleMouseEnter}
                        handleMouseLeave={handleMouseLeave}
                        handleGeographyClick={handleGeographyClick}
                        getPoliticalColor={getPoliticalColor}
                      />
                    )}
                  </Geographies>

                  {type === 'rivers' && riverData && (
                    <Geographies geography={riverData}>
                      {({ geographies }) => (
                        <RiverList 
                          geographies={geographies}
                          scope={scope}
                          gameStatus={gameStatus}
                          feedback={feedback}
                          selectedGeoId={selectedGeoId}
                          hoveredGeoName={hoveredGeoName}
                          isMoving={isMoving}
                          handleMouseEnter={handleMouseEnter}
                          handleMouseLeave={handleMouseLeave}
                          handleGeographyClick={handleGeographyClick}
                        />
                      )}
                    </Geographies>
                  )}

                  {type === 'rivers' && lakeData && (
                    <Geographies geography={lakeData}>
                      {({ geographies }) => (
                        <LakeList 
                          geographies={geographies}
                          scope={scope}
                          gameStatus={gameStatus}
                          feedback={feedback}
                          selectedGeoId={selectedGeoId}
                          hoveredGeoName={hoveredGeoName}
                          isMoving={isMoving}
                          handleMouseEnter={handleMouseEnter}
                          handleMouseLeave={handleMouseLeave}
                          handleGeographyClick={handleGeographyClick}
                        />
                      )}
                    </Geographies>
                  )}
                  {droppedLabels.map((label, idx) => (
                    <RegionLabel key={`dropped-${label.id}-${idx}`} geo={label.geo} name={label.name} scope={scope} />
                  ))}

                  {weatherEnabled && weatherData.map((city, idx) => (
                    <Marker key={`weather-${idx}`} coordinates={city.coordinates}>
                      <g transform="translate(-12, -24)">
                        <circle cx="12" cy="12" r="14" fill="white" fillOpacity={0.8} stroke="#1A1A1A" strokeWidth={1} />
                        <text x="12" y="16" textAnchor="middle" fontSize="10px" fontWeight="bold" fill="#1A1A1A">
                          {Math.round(city.weather.temperature)}°
                        </text>
                      </g>
                    </Marker>
                  ))}

                  {activeTool === 'elevation' && elevationPoints.length > 0 && (
                    <>
                      {elevationPoints.map((p, idx) => (
                        <Marker key={`elev-pt-${idx}`} coordinates={p}>
                          <circle r={4} fill="#E65100" stroke="#FFF" strokeWidth={1.5} />
                        </Marker>
                      ))}
                      {elevationPoints.length === 2 && (
                        <Line
                          from={elevationPoints[0]}
                          to={elevationPoints[1]}
                          stroke="#E65100"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeDasharray="4 4"
                        />
                      )}
                    </>
                  )}

                  {customQuizLocations && customQuizLocations.map((loc, idx) => (
                    loc.lat !== undefined && loc.lng !== undefined && (
                      <Marker 
                        key={`custom-loc-${idx}`} 
                        coordinates={[loc.lng, loc.lat]}
                        onClick={(e) => {
                          e.stopPropagation();
                          if (gameStatus === 'playing' && !feedback) {
                            setFeedbackPos({ x: e.clientX, y: e.clientY });
                            processAnswer({ 
                              properties: { name: loc.name, id: loc.name },
                              geometry: { type: "Point", coordinates: [loc.lng, loc.lat] }
                            });
                          }
                        }}
                        onMouseEnter={() => {
                          handleMouseEnter(loc.name, loc.name, {
                            properties: { name: loc.name, id: loc.name },
                            geometry: { type: "Point", coordinates: [loc.lng, loc.lat] }
                          });
                        }}
                        onMouseLeave={handleMouseLeave}
                        style={{ cursor: gameStatus === 'playing' ? 'pointer' : 'default' }}
                      >
                        <circle 
                          r={hoveredGeoId === loc.name ? 6 : 4} 
                          fill={selectedGeoId === loc.name ? colors.selected : (hoveredGeoId === loc.name ? colors.hover : colors.default)} 
                          stroke="#1A1A1A" 
                          strokeWidth={1.5} 
                          className="transition-all duration-200"
                        />
                        {(gameStatus !== 'playing' || (feedback && selectedGeoId === loc.name) || droppedLabels.some(l => l.id === loc.name)) && (
                          <text 
                            textAnchor="middle" 
                            y={-10} 
                            style={{ 
                              fontFamily: "system-ui", 
                              fill: "#1A1A1A", 
                              fontSize: "10px", 
                              fontWeight: "bold",
                              pointerEvents: "none",
                              opacity: hoveredGeoId === loc.name || selectedGeoId === loc.name ? 1 : 0.7
                            }}
                          >
                            {loc.name}
                          </text>
                        )}
                      </Marker>
                    )
                  ))}
                </ZoomableGroup>
              </ComposableMap>
            )}
          </div>

          {/* Elevation Profile Chart */}
          <AnimatePresence>
            {activeTool === 'elevation' && (
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-xl border-t border-[#1A1A1A]/10 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-30 p-4"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Mountain className="w-5 h-5 text-[#E65100]" />
                    <h3 className="font-bold text-sm">Elevation Profile</h3>
                  </div>
                  {elevationPoints.length < 2 && (
                    <p className="text-xs text-[#1A1A1A]/60 font-medium animate-pulse">
                      Click two points on the map to generate an elevation profile.
                    </p>
                  )}
                  {elevationPoints.length === 2 && (
                    <button 
                      onClick={() => { setElevationPoints([]); setElevationData([]); }}
                      className="text-xs font-bold text-[#E65100] hover:text-[#BF360C] transition-colors"
                    >
                      Clear Points
                    </button>
                  )}
                </div>
                
                <div className="h-40 w-full">
                  {isFetchingElevation ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3">
                      <div className="w-6 h-6 border-2 border-[#E65100] border-t-transparent rounded-full animate-spin" />
                      <span className="text-xs font-medium text-[#1A1A1A]/50">Analyzing terrain...</span>
                    </div>
                  ) : elevationData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={elevationData} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="colorElev" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#E65100" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#E65100" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="distance" tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <YAxis tick={{ fontSize: 10 }} tickLine={false} axisLine={false} />
                        <RechartsTooltip 
                          contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: '12px', fontWeight: 'bold' }}
                          formatter={(value: number) => [`${Math.round(value)}m`, 'Elevation']}
                          labelFormatter={(label) => `Distance: ${label}`}
                        />
                        <Area type="monotone" dataKey="elevation" stroke="#E65100" strokeWidth={2} fillOpacity={1} fill="url(#colorElev)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center border-2 border-dashed border-[#1A1A1A]/10 rounded-xl">
                      <span className="text-xs font-medium text-[#1A1A1A]/40">No data available</span>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Legend / Footer */}
          <div className="p-6 border-t border-[#1A1A1A]/5 bg-white/30 backdrop-blur-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-[#1A1A1A]/20 rounded-sm" style={{ backgroundColor: colors.default }}></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/40">
                  {type === 'political' ? 'Region' : type === 'physical' ? 'Terrain' : type === 'climatic' ? 'Climate Zone' : 'Capital City'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border border-[#1A1A1A]/20 rounded-sm" style={{ backgroundColor: colors.hover }}></div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#1A1A1A]/40">Focus</span>
              </div>
            </div>
            <p className="text-[10px] font-bold uppercase tracking-widest text-[#1A1A1A]/30">
              UPSC Cartography Engine v1.0 • {type.toUpperCase()} MODE
            </p>
          </div>
        </div>
      </main>
      )}
    </div>
  );
}


