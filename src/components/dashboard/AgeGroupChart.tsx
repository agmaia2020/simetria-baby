
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface AgeGroup {
  grupo: string;
  count: number;
}

interface AgeGroupChartProps {
  data: AgeGroup[];
  chartConfig: any;
}

export const AgeGroupChart = ({ data, chartConfig }: AgeGroupChartProps) => {
  console.log("AgeGroupChart data:", data);
  
  // Ordenar os dados de forma decrescente por count
  const sortedData = [...data].sort((a, b) => b.count - a.count);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Faixa Etária</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={sortedData}
              layout="vertical"
              margin={{ left: 80, right: 20, top: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                type="number"
                fontSize={12}
              />
              <YAxis 
                type="category"
                dataKey="grupo"
                fontSize={12}
                width={80}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar 
                dataKey="count"
                fill="#3b82f6"
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
