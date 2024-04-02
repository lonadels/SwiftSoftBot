export enum ImageQuality {
  Standart = "standart",
  HD = "hd",
}

export type ChatImageQuality = "standard" | "hd";

export enum ImageSize {
  Low = "256x256",
  Medium = "512x512",
  High = "1024x1024",
  Vertical = "1792x1024",
  Horizontal = "1024x1792",
}

export enum ImageStyle {
  Natural = "natural",
  Vivid = "vivid",
}

export default { ImageQuality, ImageSize, ImageStyle };
