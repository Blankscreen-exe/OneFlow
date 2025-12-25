import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1766697976461 implements MigrationInterface {
    name = 'InitialSchema1766697976461'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "proposals" ADD "coverLetter" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "proposals" DROP COLUMN "coverLetter"`);
    }

}
