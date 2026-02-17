import type { UnderstandingLevel } from '../data/types';

export function levelToColor(level: UnderstandingLevel): string {
  switch (level) {
    case 0:
      return '#e74c3c'; // 赤
    case 1:
      return '#e67e22';
    case 2:
      return '#f1c40f';
    case 3:
      return '#27ae60'; // 濃緑
    case 4:
      return '#2ecc71';
    default:
      return '#bdc3c7';
  }
}
