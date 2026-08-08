import { Card } from "@/components/ui";
import styles from "./MonthlyBarChart.module.scss";

export interface MonthlyBarChartDatum {
  key: string;
  label: string;
  value: number;
}

interface MonthlyBarChartProps {
  title: string;
  data: MonthlyBarChartDatum[];
  formatValue: (value: number) => string;
  emptyMessage: string;
  color?: string;
}

// A single-series bar chart — no legend (the card title already names what's plotted, see
// dataviz skill's mark spec). Bars are plain HTML/CSS (height as a %, capped width, 4px
// rounded top, baseline rule), not SVG, so the per-bar hover/focus tooltip is just CSS —
// no chart library, no JS pointer-tracking state needed for something this small.
export default function MonthlyBarChart({
  title,
  data,
  formatValue,
  emptyMessage,
  color = "#004261",
}: MonthlyBarChartProps) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const hasData = data.some((d) => d.value > 0);

  return (
    <Card className={styles.card}>
      <h3 className={styles.title}>{title}</h3>
      {hasData ? (
        <div className={styles.chart}>
          {data.map((datum) => (
            <div key={datum.key} className={styles.column}>
              <div
                className={styles.barWrapper}
                tabIndex={0}
                role="img"
                aria-label={`${datum.label}: ${formatValue(datum.value)}`}
              >
                <span className={styles.tooltip}>{formatValue(datum.value)}</span>
                <div
                  className={styles.bar}
                  style={{ height: `${(datum.value / max) * 100}%`, backgroundColor: color }}
                />
              </div>
              <span className={styles.columnLabel}>{datum.label}</span>
            </div>
          ))}
        </div>
      ) : (
        <p className={styles.emptyState}>{emptyMessage}</p>
      )}
    </Card>
  );
}
