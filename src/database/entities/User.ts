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
import Branch from "./Branch";

@Entity()
export default class User {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "bigint", nullable: true, unique: true })
  telegramId?: number;

  @OneToMany(() => Message, (message) => message.user)
  messages?: Message[];

  @OneToMany(() => Branch, (branch) => branch.user)
  branches?: Branch[];
}
