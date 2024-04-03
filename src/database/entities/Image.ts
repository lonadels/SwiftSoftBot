import { Column } from "typeorm";
import {
  ImageQuality,
  ImageResolution as ImageResolution,
  ImageStyle as ImageStyle,
} from "../ImageTypes";

export class Image {
  @Column({
    enum: ImageQuality,
    default: ImageQuality.HD,
  })
  quality!: ImageQuality;

  @Column({
    enum: ImageResolution,
    default: ImageResolution.High,
  })
  resolution!: ImageResolution;

  @Column({
    enum: ImageStyle,
    default: ImageStyle.Vivid,
  })
  style!: ImageStyle;
}
