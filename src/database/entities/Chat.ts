import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Subscribe } from "./Subscribe";
import { Voice, Quality } from "../VoiceTypes";

@Entity()
export default class Chat {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "bigint", nullable: true, unique: true })
  telegramId?: number;

  @Column({
    enum: ["alloy", "echo", "fable", "nova", "onyx", "shimmer"],
    default: "nova",
  })
  voice!: Voice;

  @Column({
    enum: ["fast", "high"],
    default: "high",
  })
  quality!: Quality;
}
