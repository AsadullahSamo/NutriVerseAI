import * as React from "react"
import {
  Line,
  LineChart as RechartsLineChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Pie,
  PieChart as RechartsPieChart,
  Cell
} from "recharts"
import { cn } from "@/lib/utils"

export function LineChart({
  data,
  categories,
  index,
  colors = ["#2563eb", "#f59e0b", "#10b981"],
  valueFormatter,
  className
}) {
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className={cn("h-[200px] w-full flex items-center justify-center", className)}>
        <div className="text-sm text-muted-foreground">Loading chart...</div>
      </div>
    )
  }

  return (
    <div className={cn("h-[200px] w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart
          data={data}
          margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
        >
          <XAxis
            dataKey={index}
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            stroke="#888888"
            fontSize={12}
            tickLine={false}
            axisLine={false}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload) return null
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="grid grid-cols-2 gap-2">
                    {payload.map(category => (
                      <div
                        key={`${category.dataKey}`}
                        className="flex flex-col"
                      >
                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                          {category.dataKey}
                        </span>
                        <span className="font-bold text-muted-foreground">
                          {valueFormatter && typeof category.value === "number"
                            ? valueFormatter(category.value)
                            : category.value}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            }}
          />
          {categories.map((category, i) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[i % colors.length]}
              strokeWidth={2}
              dot={false}
            />
          ))}
        </RechartsLineChart>
      </ResponsiveContainer>
    </div>
  )
}

export function PieChart({
  data,
  colors = ["#2563eb", "#f59e0b", "#10b981", "#3730a3", "#dc2626"],
  className
}) {
  const [isClient, setIsClient] = React.useState(false)
  const total = data.reduce((sum, item) => sum + item.value, 0)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  if (!isClient) {
    return (
      <div className={cn("h-[200px] w-full flex items-center justify-center", className)}>
        <div className="text-sm text-muted-foreground">Loading chart...</div>
      </div>
    )
  }

  return (
    <div className={cn("h-[200px] w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={colors[index % colors.length]}
              />
            ))}
          </Pie>
          <Tooltip
            content={({ active, payload }) => {
              if (!active || !payload?.[0]) return null
              const item = payload[0]
              const percentage = ((Number(item.value) / total) * 100).toFixed(1)
              return (
                <div className="rounded-lg border bg-background p-2 shadow-sm">
                  <div className="flex flex-col">
                    <span className="text-[0.70rem] uppercase text-muted-foreground">
                      {item.name}
                    </span>
                    <span className="font-bold">
                      {item.value} ({percentage}%)
                    </span>
                  </div>
                </div>
              )
            }}
          />
          <Legend
            verticalAlign="bottom"
            height={36}
            content={({ payload }) => {
              if (!payload) return null
              return (
                <div className="flex flex-wrap justify-center gap-4">
                  {payload.map((entry, index) => (
                    <div
                      key={`legend-${index}`}
                      className="flex items-center gap-1"
                    >
                      <div
                        className="h-2 w-2 rounded-full"
                        style={{
                          backgroundColor: colors[index % colors.length]
                        }}
                      />
                      <span className="text-xs font-medium">{entry.value}</span>
                    </div>
                  ))}
                </div>
              )
            }}
          />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}
