import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import Message from "./Message";
@Entity()
export default class Chat {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "bigint", nullable: true, unique: true })
  telegramId?: number;

  @OneToMany(() => Message, (message) => message.from)
  messages?: Message[];

  @Column({ default: "" })
  systemInstructions!: string;
}
