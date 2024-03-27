import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import User from "./User";
import Message from "./Message";

@Entity()
export default class Branch {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @ManyToOne(() => User, (user) => user.messages)
  @JoinColumn()
  user?: User;

  @OneToMany(() => Message, (message) => message.branch)
  messages?: Message[];

  @Column({ type: "bigint" })
  chatId?: number;
}
