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
import { VoiceModel, VoiceQuality } from "../VoiceTypes";
import { Voice } from "./Voice";
import { Image } from "./Image";
import Message from "./Message";
@Entity()
export default class Chat {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "bigint", nullable: true, unique: true })
  telegramId?: number;

  @Column(() => Voice)
  voice!: Voice;

  @Column(() => Image)
  image!: Image;

  @OneToMany(() => Message, (message) => message.from)
  messages?: Message[];
}
