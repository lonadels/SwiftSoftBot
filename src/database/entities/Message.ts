import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import User from "./User";
import Branch from "./Branch";

@Entity()
export default class Message {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "bigint" })
  telegramId!: number;

  @ManyToOne(() => User, (user) => user.messages)
  @JoinColumn()
  user?: User;

  @ManyToOne(() => Branch, (branch) => branch.messages)
  @JoinColumn()
  branch?: Branch;
}
