import { useEffect, useRef, useState } from 'react';
import Globe, { GlobeMethods } from 'react-globe.gl';

export default function GlobeComponent() {
  const globeEl = useRef<GlobeMethods>();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: containerRef.current.offsetWidth,
          height: containerRef.current.offsetHeight
        });
      }
    };
    
    // Initial size
    updateDimensions();
    
    // Resize listener
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      // Auto-rotate
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      
      // Set initial point of view over India
      globeEl.current.pointOfView({ lat: 20.5937, lng: 78.9629, altitude: 1.8 }, 2000);
    }
  }, [dimensions]); // Re-run if dimensions change and globe re-renders

  const wastePoints = [
    { lat: 28.6139, lng: 77.2090, size: 0.5, city: 'Delhi' },
    { lat: 19.0760, lng: 72.8777, size: 0.8, city: 'Mumbai' },
    { lat: 22.5726, lng: 88.3639, size: 0.4, city: 'Kolkata' },
    { lat: 12.9716, lng: 77.5946, size: 0.6, city: 'Bangalore' },
    { lat: 13.0827, lng: 80.2707, size: 0.5, city: 'Chennai' }
  ];

  return (
    <div ref={containerRef} className="w-full h-full min-h-[400px] flex items-center justify-center bg-transparent rounded-xl overflow-hidden">
      {dimensions.width > 0 && (
        <Globe
          ref={globeEl}
          width={dimensions.width}
          height={dimensions.height}
          globeImageUrl="//unpkg.com/three-globe/example/img/earth-blue-marble.jpg"
          bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
          pointsData={wastePoints}
          pointColor={() => "#10b981"}
          pointAltitude={0.05}
          pointRadius={(d: any) => d.size}
          pointsMerge={false}
          pointLabel={(d: any) => `
            <div style="background: white; color: black; padding: 8px; border-radius: 8px; font-family: sans-serif; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
              <strong style="color: #10b981; font-size: 14px;">${d.city}</strong><br/>
              <span style="font-size: 12px; color: #4b5563;">Waste Collection Point</span>
            </div>
          `}
          backgroundColor="rgba(0,0,0,0)"
        />
      )}
    </div>
  );
}
