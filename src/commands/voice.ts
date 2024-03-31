import { Context } from "grammy";
import { useType } from "../hooks/useType";
import checkHasArgs from "../utils/checkHasArgs";
import { GPTModule } from "../modules/GPTModule";

export default function voice(gptModule: GPTModule) {
  return () => gptModule.voice;
}
