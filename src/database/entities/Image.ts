import { Column } from "typeorm";
import {
  ImageQuality,
  ImageSize as ImageSize,
  ImageStyle as ImageStyle,
} from "../ImageTypes";

export class Image {
  @Column({
    enum: ImageQuality,
    default: ImageQuality.HD,
  })
  quality!: ImageQuality;

  @Column({
    enum: ImageSize,
    default: ImageSize.High,
  })
  size!: ImageSize;

  @Column({
    enum: ImageStyle,
    default: ImageStyle.Vivid,
  })
  style!: ImageStyle;
}
