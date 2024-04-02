import { Column } from "typeorm";
import { VoiceName, VoiceQuality } from "../VoiceTypes";

export class Voice {
  @Column({
    enum: VoiceName,
    default: VoiceName.Nova,
  })
  name!: VoiceName;

  @Column({
    enum: VoiceQuality,
    default: VoiceQuality.HD,
  })
  quality!: VoiceQuality;
}
