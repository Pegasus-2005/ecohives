import { useState, useEffect } from "react";
import { Recycle, Users, CheckCircle, Wind, ArrowRight, MapPin } from "lucide-react";
import { Link } from "react-router-dom";
import GlobeComponent from "../components/GlobeComponent";

export default function Dashboard() {
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const res = await fetch("/api/reports");
        const data = await res.json();
        if (res.ok) {
          setRecentActivity(data.reports.slice(0, 5)); // Get top 5 recent
        }
      } catch (err) {
        console.error("Failed to fetch reports", err);
      }
    };
    fetchReports();
  }, []);

  const stats = [
    {
      name: "Total Waste Collected",
      value: "12,458 kg",
      change: "+12%",
      trend: "up",
      icon: Recycle,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      name: "Active Users",
      value: "3,247",
      change: "+8%",
      trend: "up",
      icon: Users,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      name: "Reports Verified",
      value: "8,932",
      change: "+15%",
      trend: "up",
      icon: CheckCircle,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      name: "CO₂ Offset",
      value: "2,145 kg",
      change: "+20%",
      trend: "up",
      icon: Wind,
      color: "text-teal-600",
      bgColor: "bg-teal-100",
    },
  ];

  return (
    <div className="space-y-8 relative z-0">
      {/* Hero Section with Globe */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-sm border border-green-100/50 overflow-hidden flex flex-col lg:flex-row">
        <div className="p-8 lg:p-12 lg:w-1/2 flex flex-col justify-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-50 text-green-700 text-sm font-medium mb-6 w-fit border border-green-200">
            <span className="flex h-2 w-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
            Global Waste Collection Network
          </div>
          <h1 className="text-4xl lg:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            Make an impact, <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-teal-500">
              one report at a time.
            </span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-lg leading-relaxed">
            EcoHives uses AI and geospatial visualization to make waste reporting transparent, engaging, and data-driven. Join our community to clean up your city and earn rewards.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link 
              to="/report" 
              className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-xl text-white bg-green-600 hover:bg-green-700 transition-colors shadow-sm"
            >
              Report Waste Now
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link 
              to="/map" 
              className="inline-flex items-center justify-center px-6 py-3 border border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 transition-colors shadow-sm"
            >
              View Network Map
            </Link>
          </div>
        </div>
        <div className="lg:w-1/2 bg-gray-900 relative min-h-[400px] lg:min-h-[500px]">
          <div className="absolute inset-0 bg-gradient-to-r from-white via-transparent to-transparent z-10 hidden lg:block pointer-events-none"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-transparent z-10 block lg:hidden pointer-events-none"></div>
          <GlobeComponent />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.name} className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-green-100/50 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className={`h-12 w-12 rounded-full flex items-center justify-center ${stat.bgColor}`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-green-600 font-medium">{stat.change}</span>
                <span className="text-gray-500 ml-2">from last month</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-sm border border-green-100/50 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
          <Link to="/map" className="text-sm font-medium text-green-600 hover:text-green-700">View all</Link>
        </div>
        <div className="space-y-4">
          {recentActivity.length > 0 ? recentActivity.map((activity, i) => (
            <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50 last:border-0">
              <div className="flex items-center space-x-4">
                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center">
                  <Recycle className="h-5 w-5 text-gray-500" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{activity.waste_type || "Waste"} Reported</p>
                  <p className="text-xs text-gray-500 flex items-center">
                    <MapPin className="h-3 w-3 mr-1" />
                    {activity.address || `${activity.lat.toFixed(4)}, ${activity.lng.toFixed(4)}`} • {new Date(activity.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                activity.status === 'Collected' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
              }`}>
                {activity.status}
              </span>
            </div>
          )) : (
            <div className="text-sm text-gray-500 text-center py-4">No recent activity.</div>
          )}
        </div>
      </div>
    </div>
  );
}
