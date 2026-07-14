import React from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  PieChart, 
  Pie, 
  Cell 
} from 'recharts';
import { 
  TrendingUp, 
  BarChart3, 
  Calendar, 
  Palmtree, 
  Activity 
} from 'lucide-react';
import { GlassCard } from '../components/GlassCard';
import { 
  getMonthWeekdays, 
  getDateString, 
  formatMinutes 
} from '../utils/timeUtils';
import { DayLog } from '../hooks/useHoursTracker';

interface AnalyticsPageProps {
  logs: Record<string, DayLog>;
  stats: any;
  selectedDate: Date;
}

export const AnalyticsPage: React.FC<AnalyticsPageProps> = ({
  logs,
  stats,
  selectedDate,
}) => {
  const {
    totalWeekdays,
    completedWeekdays,
    averageMinutesPerDay,
    totalTargetMinutes,
    completedMinutesTillToday,
    leaveUsedThisMonth,
    remainingLeaveBalance
  } = stats;

  const year = selectedDate.getFullYear();
  const monthIndex = selectedDate.getMonth();
  
  // All weekdays in month
  const weekdays = getMonthWeekdays(year, monthIndex);

  // 1. Daily Work Hours Chart Data
  const dailyData = weekdays.map((d, index) => {
    const key = getDateString(d);
    const log = logs[key];
    const dateLabel = d.getDate();
    
    let hoursWorked = 0;
    let type = 'unfilled';
    
    if (log) {
      if (log.isLeave) {
        hoursWorked = log.leaveHours;
        type = 'leave';
      } else {
        hoursWorked = log.minutesWorked / 60.0;
        type = log.minutesWorked >= 480 ? 'target' : 'deficit';
      }
    }
    
    return {
      name: `Day ${dateLabel}`,
      hours: parseFloat(hoursWorked.toFixed(2)),
      target: 8.0,
      type
    };
  });

  // 2. Cumulative Progress Chart Data
  let cumulativeTarget = 0;
  let cumulativeCompleted = 0;
  let hasPassedToday = false;
  const todayStr = getDateString(new Date(2026, 6, 14)); // July 14, 2026
  
  const cumulativeData = weekdays.map((d) => {
    const key = getDateString(d);
    const log = logs[key];
    const dateLabel = d.getDate();
    
    cumulativeTarget += 8.0;
    
    // Check if day is <= today
    const dateIsPastOrToday = d <= new Date(2026, 6, 14);
    
    if (dateIsPastOrToday) {
      if (log) {
        cumulativeCompleted += log.isLeave ? log.leaveHours : (log.minutesWorked / 60.0);
      }
      return {
        name: `Day ${dateLabel}`,
        Target: parseFloat(cumulativeTarget.toFixed(1)),
        Completed: parseFloat(cumulativeCompleted.toFixed(1))
      };
    } else {
      // Future day - only plot target line, omit Completed to keep lines clean
      return {
        name: `Day ${dateLabel}`,
        Target: parseFloat(cumulativeTarget.toFixed(1)),
        Completed: null // Will not plot on line
      };
    }
  });

  // 3. Predictions Line Graph Data
  // We plot trajectories from Day 1 to the end of the month
  let currentAccumulated = 0;
  
  const predictionData = weekdays.map((d, idx) => {
    const key = getDateString(d);
    const log = logs[key];
    const dateLabel = d.getDate();
    const dateIsPastOrToday = d <= new Date(2026, 6, 14);

    if (dateIsPastOrToday) {
      if (log) {
        currentAccumulated += log.isLeave ? log.leaveHours : (log.minutesWorked / 60.0);
      }
      
      // Up to today, all scenarios map to the actual completed value
      return {
        name: `Day ${dateLabel}`,
        Target: parseFloat(((idx + 1) * 8).toFixed(1)),
        Actual: parseFloat(currentAccumulated.toFixed(1)),
        'Continue Average': parseFloat(currentAccumulated.toFixed(1)),
        'Standard 8h': parseFloat(currentAccumulated.toFixed(1)),
        'Stay 30m Extra': parseFloat(currentAccumulated.toFixed(1)),
        'Work 9h Daily': parseFloat(currentAccumulated.toFixed(1)),
      };
    } else {
      // Future projections:
      const remainingDaysIndex = idx - completedWeekdays + 1;
      
      const forecastAvg = currentAccumulated + (averageMinutesPerDay / 60.0) * remainingDaysIndex;
      const forecastStd = currentAccumulated + 8.0 * remainingDaysIndex;
      const forecastExtra30 = currentAccumulated + 8.5 * remainingDaysIndex;
      const forecastWork9 = currentAccumulated + 9.0 * remainingDaysIndex;
      
      return {
        name: `Day ${dateLabel}`,
        Target: parseFloat(((idx + 1) * 8).toFixed(1)),
        Actual: null,
        'Continue Average': parseFloat(forecastAvg.toFixed(1)),
        'Standard 8h': parseFloat(forecastStd.toFixed(1)),
        'Stay 30m Extra': parseFloat(forecastExtra30.toFixed(1)),
        'Work 9h Daily': parseFloat(forecastWork9.toFixed(1)),
      };
    }
  });

  // 4. Pie Chart Leave Breakdown
  const leaveData = [
    { name: 'Remaining Leaves', value: Math.max(0, remainingLeaveBalance) },
    { name: 'Used Leaves (Shortage + Days)', value: leaveUsedThisMonth },
  ];
  
  const COLORS = ['#34d399', '#f87171'];

  // Tooltip formatter for time values
  const hoursTooltipFormatter = (value: any) => [`${value} hours`, 'Hours'];
  const cumulativeTooltipFormatter = (value: any) => [`${value} hours`, 'Time'];

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Daily worked bar chart */}
        <GlassCard className="p-5" hoverEffect={false}>
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="p-1.5 bg-emerald-500/15 rounded-lg text-emerald-400 border border-emerald-500/25">
              <BarChart3 className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Daily Work Hours Chart</h3>
          </div>
          
          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" domain={[0, 12]} />
                <Tooltip 
                  formatter={hoursTooltipFormatter}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                <Bar dataKey="hours" name="Hours Worked" radius={[4, 4, 0, 0]}>
                  {dailyData.map((entry, index) => {
                    let color = '#ef4444'; // Red for deficit
                    if (entry.type === 'leave') color = '#64748b'; // Gray for leave
                    if (entry.type === 'target') color = '#10b981'; // Green for target met
                    if (entry.type === 'deficit') color = '#f59e0b'; // Amber for slight deficit
                    if (entry.type === 'unfilled') color = '#ef444450';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
                <Line type="monotone" dataKey="target" name="Target (8h)" stroke="#64748b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Cumulative progress chart */}
        <GlassCard className="p-5" hoverEffect={false}>
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="p-1.5 bg-teal-500/15 rounded-lg text-teal-400 border border-teal-500/25">
              <TrendingUp className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Cumulative Progress Chart</h3>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={cumulativeData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  formatter={cumulativeTooltipFormatter}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                <Area type="monotone" dataKey="Completed" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorCompleted)" />
                <Line type="monotone" dataKey="Target" stroke="#64748b" strokeWidth={1.5} strokeDasharray="5 5" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Row of Forecast prediction and Pie breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Prediction Line Graph */}
        <GlassCard className="p-5 lg:col-span-2" hoverEffect={false}>
          <div className="flex items-center gap-2 mb-4 px-1">
            <div className="p-1.5 bg-blue-500/15 rounded-lg text-blue-400 border border-blue-500/25">
              <Activity className="w-4 h-4" />
            </div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Monthly Projection Scenarios</h3>
          </div>

          <div className="h-64 w-full text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={predictionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip 
                  formatter={cumulativeTooltipFormatter}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff' }}
                />
                <Legend wrapperStyle={{ color: '#94a3b8' }} />
                <Line type="monotone" dataKey="Target" stroke="#64748b" strokeWidth={1.5} strokeDasharray="4 4" dot={false} />
                <Line type="monotone" dataKey="Actual" name="Actual Hours" stroke="#10b981" strokeWidth={3} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Continue Average" stroke="#38bdf8" strokeWidth={1.5} strokeDasharray="2 2" dot={false} />
                <Line type="monotone" dataKey="Standard 8h" stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="2 2" dot={false} />
                <Line type="monotone" dataKey="Stay 30m Extra" stroke="#c084fc" strokeWidth={1.5} strokeDasharray="2 2" dot={false} />
                <Line type="monotone" dataKey="Work 9h Daily" stroke="#a3e635" strokeWidth={1.5} strokeDasharray="2 2" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Leave Usage Breakdown Donut */}
        <GlassCard className="p-5 flex flex-col justify-between" hoverEffect={false}>
          <div>
            <div className="flex items-center gap-2 mb-4 px-1">
              <div className="p-1.5 bg-purple-500/15 rounded-lg text-purple-400 border border-purple-500/25">
                <Palmtree className="w-4 h-4" />
              </div>
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">Leave Usage Allocation</h3>
            </div>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leaveData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={70}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {leaveData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <div className="w-3 h-3 rounded bg-emerald-400" />
                <span>Remaining Leaves</span>
              </div>
              <span className="font-bold text-emerald-400">{Math.max(0, remainingLeaveBalance).toFixed(3)}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 text-slate-300">
                <div className="w-3 h-3 rounded bg-rose-400" />
                <span>Used / Deducted Leaves</span>
              </div>
              <span className="font-bold text-rose-400">{leaveUsedThisMonth.toFixed(3)}</span>
            </div>
          </div>
        </GlassCard>
      </div>
    </div>
  );
};
