"use client"

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface PriceChartProps {
  data: any[];
}

export function PriceChart({ data }: PriceChartProps) {
  const colors = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];
  const keys = Object.keys(data[0]).filter(key => key !== 'date');
  
  return (
    <div className="h-full w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
          <XAxis 
            dataKey="date"
            className="text-xs"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            className="text-xs"
            tickLine={false}
            axisLine={false}
            tickFormatter={(value) => `¥${value}`}
          />
          <Tooltip 
            content={({ active, payload, label }: { 
              active?: boolean; 
              payload?: any[]; 
              label?: string; 
            })  => {  
              if (active && payload && payload.length) {
                return (
                  <div className="rounded-lg border bg-background p-2 shadow-sm">
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex flex-col">
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          日期
                        </span>
                        <span className="font-bold text-xs">{label}</span>
                      </div>
                      {payload.map((item: any, index: number) => (
                        <div key={index} className="flex flex-col">
                          <span className="text-[0.70rem] uppercase text-muted-foreground">
                            {item.name}
                          </span>
                          <span className="font-bold text-xs">
                            ¥{item.value.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )
              }
              return null
            }}
          />
          <Legend />
          {keys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              className="text-xs"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 5 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}