import * as React from "react"
import { cn } from "@/lib/utils"

// Simple client-side check
function useIsClient() {
  const [isClient, setIsClient] = React.useState(false)

  React.useEffect(() => {
    setIsClient(true)
  }, [])

  return isClient
}

export function LineChart({
  data,
  categories,
  index,
  colors = ["#2563eb", "#f59e0b", "#10b981"],
  valueFormatter,
  className
}) {
  const isClient = useIsClient()
  const [RechartsComponents, setRechartsComponents] = React.useState(null)

  React.useEffect(() => {
    if (isClient) {
      import('recharts').then((recharts) => {
        setRechartsComponents(recharts)
      }).catch(console.error)
    }
  }, [isClient])

  if (!isClient || !RechartsComponents) {
    return (
      <div className={cn("h-[200px] w-full flex items-center justify-center bg-muted/50 rounded-lg", className)}>
        <div className="text-sm text-muted-foreground animate-pulse">Loading chart...</div>
      </div>
    )
  }

  const { LineChart: RechartsLineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend } = RechartsComponents

  return (
    <div className={cn("h-[200px] w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsLineChart data={data}>
          <XAxis
            dataKey={index}
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#374151' }}
          />
          <YAxis
            tick={{ fontSize: 12 }}
            tickLine={{ stroke: '#374151' }}
            tickFormatter={valueFormatter}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
            formatter={valueFormatter}
          />
          <Legend />
          {categories.map((category, idx) => (
            <Line
              key={category}
              type="monotone"
              dataKey={category}
              stroke={colors[idx % colors.length]}
              strokeWidth={2}
              dot={{ fill: colors[idx % colors.length], strokeWidth: 2, r: 4 }}
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
  const isClient = useIsClient()
  const [RechartsComponents, setRechartsComponents] = React.useState(null)

  React.useEffect(() => {
    if (isClient) {
      import('recharts').then((recharts) => {
        setRechartsComponents(recharts)
      }).catch(console.error)
    }
  }, [isClient])

  if (!isClient || !RechartsComponents) {
    return (
      <div className={cn("h-[200px] w-full flex items-center justify-center bg-muted/50 rounded-lg", className)}>
        <div className="text-sm text-muted-foreground animate-pulse">Loading chart...</div>
      </div>
    )
  }

  const { PieChart: RechartsPieChart, Pie, ResponsiveContainer, Tooltip, Legend, Cell } = RechartsComponents

  return (
    <div className={cn("h-[200px] w-full", className)}>
      <ResponsiveContainer width="100%" height="100%">
        <RechartsPieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            outerRadius={60}
            dataKey="value"
            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: '6px'
            }}
          />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  )
}
