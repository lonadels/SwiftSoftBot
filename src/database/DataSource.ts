import { DataSource } from "typeorm";

import User from "./entities/User";

export default new DataSource({
  type: "postgres",
  host: process.env.DB_HOST,
  port: 5432,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  synchronize: true,
  logging: process.env.DB_LOG === "1",
  entities: [User],
  subscribers: [],
  migrations: [],
});
