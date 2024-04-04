import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Photo {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  // TODO: check data
  @Column({ type: "bytea", nullable: false })
  buffer!: Buffer;
}
