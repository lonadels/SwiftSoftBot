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
import { VoiceModel } from "../VoiceTypes";
import Message from "./Message";

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

  @OneToMany(() => Message, (message) => message.from)
  messages?: Message[];

  @Column()
  name!: string;
}
