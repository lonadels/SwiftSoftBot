import {
    Column,
    CreateDateColumn,
    Entity,
    JoinColumn,
    JoinTable,
    ManyToMany,
    ManyToOne,
    PrimaryGeneratedColumn,
} from "typeorm";
import User from "./User";
import Chat from "./Chat";
import {Attachment} from "./Attachment";
import {Quote} from "./Quote";

@Entity()
export default class Message {
    @PrimaryGeneratedColumn({type: "bigint"})
    id!: number;

    @Column({type: "bigint", nullable: true, unique: true})
    telegramId?: number;

    @ManyToOne(() => User, (user) => user.messages, {nullable: true})
    @JoinColumn()
    from?: User;

    @ManyToOne(() => Chat, (chat) => chat.messages)
    @JoinColumn()
    chat!: Chat;

    @CreateDateColumn()
    at!: Date;

    @ManyToMany(() => Attachment)
    @JoinTable()
    attachments?: Attachment[];

    @Column({default: ""})
    content!: string;

    @Column(() => Quote)
    quote!: Quote;
}
