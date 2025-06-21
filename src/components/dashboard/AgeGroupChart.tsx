
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
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Faixa Etária</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart 
              data={data} 
              layout="horizontal" 
              margin={{ left: 80, right: 20, top: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                fontSize={12}
                domain={[0, 'dataMax + 1']}
                stroke="#64748b"
              />
              <YAxis 
                type="category" 
                dataKey="grupo" 
                fontSize={12}
                width={80}
                stroke="#64748b"
              />
              <ChartTooltip 
                content={<ChartTooltipContent />} 
                cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
              />
              <Bar 
                dataKey="count" 
                fill="var(--color-count, #3b82f6)"
                stroke="#1e40af"
                strokeWidth={1}
                radius={[0, 4, 4, 0]}
                minPointSize={5}
              />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
