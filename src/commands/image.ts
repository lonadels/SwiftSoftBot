import { Context } from "grammy";
import openai from "openai";
import User from "../database/entities/User";
import { useType } from "../hooks/useType";
import { convertImageFormat } from "../utils/convertImageFormat";
import { createReadStreamFromBuffer } from "../utils/createReadStreamFromBuffer";
import DataSource from "../database/DataSource";
import checkHasArgs from "../utils/checkHasArgs";
import { IGPTModule } from "../modules/GPTModule";

export default function image(gptModule: IGPTModule) {
  return () => gptModule.image;
}
