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

@Entity()
export default class User {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  @Column({ type: "bigint", nullable: true, unique: true })
  telegramId?: number;

  @Column({ type: "bigint", default: 0 })
  balance!: number;

  @Column(() => Subscribe)
  subscribe?: Subscribe;

  @Column({ default: 0 })
  generations!: number;
}
