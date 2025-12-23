import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPasswordColumnToUsers1766530173290 implements MigrationInterface {
    name = 'AddPasswordColumnToUsers1766530173290'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "users" ("id" varchar PRIMARY KEY NOT NULL, "email" varchar NOT NULL, "password" varchar NOT NULL, "firstName" varchar, "lastName" varchar, "createdAt" datetime NOT NULL DEFAULT (datetime('now')), "updatedAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"))`);
        await queryRunner.query(`CREATE TABLE "password_reset_tokens" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "token" varchar NOT NULL, "expiresAt" datetime NOT NULL, "used" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_ab673f0e63eac966762155508ee" UNIQUE ("token"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ab673f0e63eac966762155508e" ON "password_reset_tokens" ("token") `);
        await queryRunner.query(`DROP INDEX "IDX_ab673f0e63eac966762155508e"`);
        await queryRunner.query(`CREATE TABLE "temporary_password_reset_tokens" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "token" varchar NOT NULL, "expiresAt" datetime NOT NULL, "used" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_ab673f0e63eac966762155508ee" UNIQUE ("token"), CONSTRAINT "FK_d6a19d4b4f6c62dcd29daa497e2" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE NO ACTION ON UPDATE NO ACTION)`);
        await queryRunner.query(`INSERT INTO "temporary_password_reset_tokens"("id", "userId", "token", "expiresAt", "used", "createdAt") SELECT "id", "userId", "token", "expiresAt", "used", "createdAt" FROM "password_reset_tokens"`);
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
        await queryRunner.query(`ALTER TABLE "temporary_password_reset_tokens" RENAME TO "password_reset_tokens"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ab673f0e63eac966762155508e" ON "password_reset_tokens" ("token") `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_ab673f0e63eac966762155508e"`);
        await queryRunner.query(`ALTER TABLE "password_reset_tokens" RENAME TO "temporary_password_reset_tokens"`);
        await queryRunner.query(`CREATE TABLE "password_reset_tokens" ("id" varchar PRIMARY KEY NOT NULL, "userId" varchar NOT NULL, "token" varchar NOT NULL, "expiresAt" datetime NOT NULL, "used" boolean NOT NULL DEFAULT (0), "createdAt" datetime NOT NULL DEFAULT (datetime('now')), CONSTRAINT "UQ_ab673f0e63eac966762155508ee" UNIQUE ("token"))`);
        await queryRunner.query(`INSERT INTO "password_reset_tokens"("id", "userId", "token", "expiresAt", "used", "createdAt") SELECT "id", "userId", "token", "expiresAt", "used", "createdAt" FROM "temporary_password_reset_tokens"`);
        await queryRunner.query(`DROP TABLE "temporary_password_reset_tokens"`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ab673f0e63eac966762155508e" ON "password_reset_tokens" ("token") `);
        await queryRunner.query(`DROP INDEX "IDX_ab673f0e63eac966762155508e"`);
        await queryRunner.query(`DROP TABLE "password_reset_tokens"`);
        await queryRunner.query(`DROP TABLE "users"`);
    }

}
