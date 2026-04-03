import { useState, useEffect } from "react";
import { Trophy, Star, Gift, ArrowRight } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Rewards() {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        const res = await fetch("/api/leaderboard");
        const data = await res.json();
        if (res.ok) {
          setLeaderboard(data.leaderboard);
        }
      } catch (err) {
        console.error("Failed to fetch leaderboard", err);
      }
    };
    fetchLeaderboard();
  }, []);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* User Stats Banner */}
      <div className="bg-gradient-to-r from-green-600 to-teal-600 rounded-2xl p-8 text-white shadow-lg flex flex-col md:flex-row items-center justify-between">
        <div className="flex items-center space-x-6">
          <div className="h-20 w-20 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm border border-white/30">
            <Trophy className="h-10 w-10 text-yellow-300" />
          </div>
          <div>
            <h2 className="text-3xl font-bold">{user?.points || 0} pts</h2>
            <p className="text-green-100 mt-1">Eco Warrior Level {Math.floor((user?.points || 0) / 500) + 1}</p>
          </div>
        </div>
        <div className="mt-6 md:mt-0 text-center md:text-right">
          <p className="text-sm text-green-100 mb-2">{500 - ((user?.points || 0) % 500)} pts to next level</p>
          <div className="w-64 h-3 bg-black/20 rounded-full overflow-hidden">
            <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${((user?.points || 0) % 500) / 5}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Available Rewards */}
        <div className="md:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Gift className="h-5 w-5 mr-2 text-green-600" />
            Redeem Rewards
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              { title: "₹500 Coffee Shop Gift Card", pts: 500, color: "bg-orange-100 text-orange-600" },
              { title: "Eco-Friendly Tote Bag", pts: 1200, color: "bg-green-100 text-green-600" },
              { title: "Public Transit Pass (1 Day)", pts: 800, color: "bg-blue-100 text-blue-600" },
              { title: "Plant a Tree in your name", pts: 2000, color: "bg-teal-100 text-teal-600" },
            ].map((reward, i) => (
              <div key={i} className="border border-gray-100 rounded-xl p-4 hover:border-green-300 transition-colors cursor-pointer group">
                <div className={`h-12 w-12 rounded-lg flex items-center justify-center mb-4 ${reward.color}`}>
                  <Star className="h-6 w-6" />
                </div>
                <h4 className="font-bold text-gray-900">{reward.title}</h4>
                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-green-600">{reward.pts} pts</span>
                  <button className="text-sm font-medium text-gray-400 group-hover:text-green-600 flex items-center transition-colors">
                    Redeem <ArrowRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            Top Contributors
          </h3>
          <div className="space-y-4">
            {leaderboard.length > 0 ? leaderboard.map((lUser, i) => (
              <div key={lUser.id} className={`flex items-center justify-between p-3 rounded-lg ${lUser.id === user?.id ? 'bg-green-50 border border-green-100' : ''}`}>
                <div className="flex items-center space-x-3">
                  <span className={`font-bold w-5 text-center ${i < 3 ? 'text-yellow-500' : 'text-gray-400'}`}>
                    {i + 1}
                  </span>
                  <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600">
                    {lUser.name.charAt(0).toUpperCase()}
                  </div>
                  <span className={`font-medium ${lUser.id === user?.id ? 'text-green-700' : 'text-gray-900'}`}>
                    {lUser.name} {lUser.id === user?.id && "(You)"}
                  </span>
                </div>
                <span className="text-sm font-bold text-gray-600">{lUser.points.toLocaleString()}</span>
              </div>
            )) : (
              <div className="text-center text-gray-500 py-4">No contributors yet. Be the first!</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
