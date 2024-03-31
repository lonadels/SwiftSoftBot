import { Column } from "typeorm";

export class Subscribe {
  @Column({ nullable: true })
  starts?: Date;

  @Column({ nullable: true })
  expires?: Date;
}
