import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";
import { SupportedMimeTypes } from "../../modules/SupportedMimeTypes";

@Entity()
export class Attachment {
  @PrimaryGeneratedColumn({ type: "bigint" })
  id!: number;

  // TODO: check data
  @Column({ type: "bytea", nullable: false })
  buffer!: Buffer;

  @Column({ enum: SupportedMimeTypes, default: SupportedMimeTypes.PNG })
  mimeType!: SupportedMimeTypes;
}
