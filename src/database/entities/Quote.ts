import { Column, JoinColumn, ManyToOne } from "typeorm";
import {
  ImageQuality,
  ImageResolution as ImageResolution,
  ImageStyle as ImageStyle,
} from "../ImageTypes";
import User from "./User";

export class Quote {
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  from?: User;

  @Column({ nullable: true })
  @JoinColumn()
  context?: string;
}
