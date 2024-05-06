import DataSource from "../database/DataSource";
import User from "../database/entities/User";
import {MoreThanOrEqual} from "typeorm";
import {Role} from "../database/Role";

export async function getDevelopers() {
    const userRepo = DataSource.getRepository(User);
    return await userRepo.findBy({role: MoreThanOrEqual(Role.Developer)});
}