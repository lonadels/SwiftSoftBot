import { Context } from "grammy";
import { useType } from "../hooks/useType";
import checkHasArgs from "../utils/checkHasArgs";
import { GPTModule, IGPTModule } from "../modules/GPTModule";

export default function voice(gptModule: IGPTModule) {
  return () => gptModule.voice;
}
