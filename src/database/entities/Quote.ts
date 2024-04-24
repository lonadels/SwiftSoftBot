import { Column, JoinColumn, ManyToOne } from "typeorm";
import User from "./User";

export class Quote {
  @Column({ nullable: true, type: "bigint" })
  @JoinColumn()
  from?: number;

  @Column({ nullable: true })
  @JoinColumn()
  content?: string;
}
