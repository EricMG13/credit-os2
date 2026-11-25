import { createContext, useContext } from "react";

/** The print document draws charts without interactive controls and with a compact plot. */
export const ChartPrintContext = createContext<boolean | number>(false);

export function useChartPlotHeight(screenHeight: number) {
  const print = useContext(ChartPrintContext);
  return typeof print === "number" ? print : print ? 128 : screenHeight;
}
