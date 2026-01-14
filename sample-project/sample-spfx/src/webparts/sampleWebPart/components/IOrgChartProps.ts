import { WebPartContext } from '@microsoft/sp-webpart-base';

export interface IOrgChartProps {
  description: string;
  isDarkTheme: boolean;
  width: number;
  height: number;
  rootUserEmail: string;
  maxDepth: number;
  context: WebPartContext;
}
