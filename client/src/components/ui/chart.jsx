import * as React from "react"
import { cn } from "@/lib/utils"
import { LineChart as ClientLineChart, PieChart as ClientPieChart } from "./client-chart"

export function LineChart({
  data,
  categories,
  index,
  colors = ["#2563eb", "#f59e0b", "#10b981"],
  valueFormatter,
  className
}) {
  return (
    <ClientLineChart
      data={data}
      categories={categories}
      index={index}
      colors={colors}
      valueFormatter={valueFormatter}
      className={cn("h-[200px] w-full", className)}
    />
  )
}

export function PieChart({
  data,
  colors = ["#2563eb", "#f59e0b", "#10b981", "#3730a3", "#dc2626"],
  className
}) {
  return (
    <ClientPieChart
      data={data}
      colors={colors}
      className={cn("h-[200px] w-full", className)}
    />
  )
}
