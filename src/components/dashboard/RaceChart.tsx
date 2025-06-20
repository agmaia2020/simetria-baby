
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer } from "recharts";

interface RaceData {
  raca: string;
  count: number;
}

interface RaceChartProps {
  data: RaceData[];
  chartConfig: any;
}

export const RaceChart = ({ data, chartConfig }: RaceChartProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Distribuição por Raça/Cor</CardTitle>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig} className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="raca" 
                fontSize={12}
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis fontSize={12} />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Bar dataKey="count" fill="#3B82F6" />
            </BarChart>
          </ResponsiveContainer>
        </ChartContainer>
      </CardContent>
    </Card>
  );
};
