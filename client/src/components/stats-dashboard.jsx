import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, LineChart } from "@/components/ui/chart";
import { format, subDays } from "date-fns";
import { Package, Leaf, AlertTriangle, Apple } from "lucide-react";
export function StatsDashboard({ pantryItems }) {
    // Calculate category distribution
    const categoryData = pantryItems.reduce((acc, item) => {
        const category = item.category || 'Uncategorized';
        acc[category] = (acc[category] || 0) + 1;
        return acc;
    }, {});
    // Calculate average sustainability score
    const avgSustainability = pantryItems.reduce((sum, item) => { var _a; return sum + (((_a = item.sustainabilityInfo) === null || _a === void 0 ? void 0 : _a.score) || 0); }, 0) / (pantryItems.length || 1);
    // Calculate expiring items timeline (next 30 days)
    const today = new Date();
    const timelineData = Array.from({ length: 30 }, (_, i) => {
        const date = format(subDays(today, i), 'MMM d');
        const count = pantryItems.filter(item => item.expiryDate && format(new Date(item.expiryDate), 'MMM d') === date).length;
        return { date, count };
    }).reverse();
    // Calculate total nutrition values
    const totalNutrition = pantryItems.reduce((acc, item) => {
        var _a, _b, _c, _d;
        return ({
            calories: acc.calories + (((_a = item.nutritionInfo) === null || _a === void 0 ? void 0 : _a.calories) || 0),
            protein: acc.protein + (((_b = item.nutritionInfo) === null || _b === void 0 ? void 0 : _b.protein) || 0),
            carbs: acc.carbs + (((_c = item.nutritionInfo) === null || _c === void 0 ? void 0 : _c.carbs) || 0),
            fat: acc.fat + (((_d = item.nutritionInfo) === null || _d === void 0 ? void 0 : _d.fat) || 0),
        });
    }, { calories: 0, protein: 0, carbs: 0, fat: 0 });
    return (<div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Items</CardTitle>
          <Package className="h-4 w-4 text-muted-foreground"/>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{pantryItems.length}</div>
          <p className="text-xs text-muted-foreground">
            Across {Object.keys(categoryData).length} categories
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Sustainability Score</CardTitle>
          <Leaf className="h-4 w-4 text-green-500"/>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{avgSustainability.toFixed(1)}</div>
          <p className="text-xs text-muted-foreground">Average score out of 100</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expiring Soon</CardTitle>
          <AlertTriangle className="h-4 w-4 text-orange-500"/>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {pantryItems.filter(item => {
            if (!item.expiryDate)
                return false;
            const days = Math.floor((new Date(item.expiryDate).getTime() - new Date().getTime()) /
                (1000 * 60 * 60 * 24));
            return days <= 7;
        }).length}
          </div>
          <p className="text-xs text-muted-foreground">Items expiring within 7 days</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Nutrition</CardTitle>
          <Apple className="h-4 w-4 text-green-500"/>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{totalNutrition.calories.toLocaleString()}</div>
          <p className="text-xs text-muted-foreground">
            Total calories in pantry
          </p>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Category Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <PieChart data={Object.entries(categoryData).map(([name, value]) => ({
            name,
            value
        }))}/>
        </CardContent>
      </Card>

      <Card className="col-span-2">
        <CardHeader>
          <CardTitle className="text-base">Expiry Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <LineChart data={timelineData} categories={["count"]} index="date" colors={["#f97316"]} valueFormatter={(value) => String(value)}/>
        </CardContent>
      </Card>
    </div>);
}
