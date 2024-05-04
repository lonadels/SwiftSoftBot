import {Column, Entity, OneToMany, PrimaryGeneratedColumn,} from "typeorm";
import Message from "./Message";
import {Role} from "../Role";

@Entity()
export default class User {
    @PrimaryGeneratedColumn({type: "bigint"})
    id!: number;

    @Column({type: "bigint", nullable: true, unique: true})
    telegramId!: number;

    @OneToMany(() => Message, (message) => message.from)
    messages?: Message[];

    @Column()
    name!: string;

    @Column({enum: Role, default: Role.User})
    role!: Role;
}
