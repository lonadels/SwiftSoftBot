import {Column, JoinColumn} from "typeorm";

export class Quote {
    @Column({nullable: true, type: "bigint"})
    @JoinColumn()
    from?: number;

    @Column({nullable: true})
    @JoinColumn()
    content?: string;
}
