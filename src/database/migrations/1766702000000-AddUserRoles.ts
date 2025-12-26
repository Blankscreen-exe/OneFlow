import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserRoles1766702000000 implements MigrationInterface {
    name = 'AddUserRoles1766702000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add role column with default value
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD "role" character varying NOT NULL DEFAULT 'service_provider'
        `);
        
        // Create index on role for faster queries
        await queryRunner.query(`
            CREATE INDEX "IDX_users_role" ON "users" ("role")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_users_role"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
    }
}

