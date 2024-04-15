import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import User from "./User";
import Chat from "./Chat";
import { Image } from "./Image";
import { Photo } from "./Photo";
import { Quote } from "./Quote";

@Entity()
export default class Message {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "bigint", nullable: true, unique: true })
  telegramId?: number;

  @ManyToOne(() => User, (user) => user.messages, { nullable: true })
  @JoinColumn()
  from?: User;

  @ManyToOne(() => Chat, (chat) => chat.messages)
  @JoinColumn()
  chat!: Chat;

  @CreateDateColumn()
  at!: Date;

  @ManyToMany(() => Photo)
  @JoinTable()
  photos?: Photo[];

  @Column()
  content!: string;

  @Column(() => Quote)
  quote!: Quote;
}
