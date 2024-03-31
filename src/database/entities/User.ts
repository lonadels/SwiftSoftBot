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
import { Voices } from "../Voices";

@Entity()
export default class User {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "bigint", nullable: true, unique: true })
  telegramId?: number;

  @Column(() => Subscribe)
  subscribe!: Subscribe;

  @Column({ default: 0 })
  generations!: number;

  @Column({
    enum: ["alloy", "echo", "fable", "nova", "onyx", "shimmer"],
    default: "nova",
  })
  voice!: Voices;
}
