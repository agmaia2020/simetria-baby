
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
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Faixa Etária</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} layout="horizontal" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} />
              <YAxis 
                type="category" 
                dataKey="grupo" 
                fontSize={12}
                width={60}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
