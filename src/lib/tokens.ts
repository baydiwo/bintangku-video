import tokensJson from "../../brand/tokens.json";

export const tokens = tokensJson;

export const mascot = tokensJson.mascot as {
  navy: string;
  white: string;
  cream: string;
  blue: string;
  earBlue: string;
  bulb: string;
  hubYellow: string;
  cheek: string;
  outline: string;
  tread: string;
  visor: string;
};

export const palette = tokensJson.palette;
