import { Column } from "typeorm";
import { VoiceModel, VoiceQuality } from "../VoiceTypes";

export class Voice {
  @Column({
    enum: VoiceModel,
    default: VoiceModel.Nova,
  })
  name!: VoiceModel;

  @Column({
    enum: VoiceQuality,
    default: VoiceQuality.HD,
  })
  quality!: VoiceQuality;
}
