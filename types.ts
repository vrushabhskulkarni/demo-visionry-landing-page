
/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/

// MediaPipe Type Definitions (Augmenting window)
declare global {
  interface Window {
    Hands: any;
    Camera: any;
    drawConnectors: any;
    drawLandmarks: any;
    HAND_CONNECTIONS: any;
  }
}

// Added missing types to fix compilation errors in GeminiSlingshot and geminiService
export type BubbleColor = 'red' | 'blue' | 'green' | 'yellow' | 'purple' | 'orange';

export interface Point {
  x: number;
  y: number;
}

export interface Bubble {
  id: string;
  row: number;
  col: number;
  x: number;
  y: number;
  color: BubbleColor;
  active: boolean;
}

export interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

export interface StrategicHint {
  message: string;
  rationale?: string;
  targetRow?: number;
  targetCol?: number;
  recommendedColor?: BubbleColor;
}

export interface DebugInfo {
  latency: number;
  screenshotBase64?: string;
  promptContext?: string;
  rawResponse?: string;
  parsedResponse?: any;
  error?: string;
  timestamp?: string;
}

export interface AiResponse {
  hint: StrategicHint;
  debug: DebugInfo;
}

export {};
