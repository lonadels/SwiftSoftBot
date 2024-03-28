import { Column } from "typeorm";

export class Subscribe {
  @Column({ default: 0 })
  starts!: Date;

  @Column({ default: 0 })
  expires!: Date;
}
