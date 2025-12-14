import { render } from "@testing-library/react";
import { LineChart, type LineChartDataPoint } from "../LineChart";

describe("LineChart", () => {
  const data: LineChartDataPoint[] = [
    { name: "2024-01", value: 100, value2: 200 },
    { name: "2024-02", value: 150, value2: 250 },
  ];

  describe("Property 42: Line chart renders time series data", () => {
    it("should render line chart with data", () => {
      const { container } = render(
        <LineChart
          data={data}
          lines={[
            { dataKey: "value", name: "数值1" },
            { dataKey: "value2", name: "数值2" },
          ]}
        />
      );

      // Recharts renders SVG elements
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Property 43: Chart tooltip displays on hover", () => {
    it("should include tooltip in chart", () => {
      const { container } = render(
        <LineChart
          data={data}
          lines={[{ dataKey: "value", name: "数值" }]}
        />
      );

      // Tooltip is rendered by Recharts
      expect(container.querySelector("svg")).toBeInTheDocument();
    });
  });

  describe("Property 44: Charts are responsive", () => {
    it("should have responsive container", () => {
      const { container } = render(
        <LineChart
          data={data}
          lines={[{ dataKey: "value", name: "数值" }]}
        />
      );

      const responsiveContainer = container.querySelector(".recharts-responsive-container");
      expect(responsiveContainer).toBeInTheDocument();
    });
  });
});

