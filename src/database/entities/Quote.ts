import { Column, JoinColumn, ManyToOne } from "typeorm";
import User from "./User";

export class Quote {
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn()
  from?: User;

  @Column({ nullable: true })
  @JoinColumn()
  content?: string;
}
