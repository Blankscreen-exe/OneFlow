import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateOwnershipToAgency1766705000000 implements MigrationInterface {
    name = 'UpdateOwnershipToAgency1766705000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Update clients table
        await queryRunner.query(`
            ALTER TABLE "clients" ADD "agencyId" uuid
        `);

        await queryRunner.query(`
            ALTER TABLE "clients" ADD "createdById" uuid
        `);

        await queryRunner.query(`
            ALTER TABLE "clients" ADD CONSTRAINT "FK_clients_agency" FOREIGN KEY ("agencyId") 
                REFERENCES "agencies"("id") ON DELETE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "clients" ADD CONSTRAINT "FK_clients_created_by" FOREIGN KEY ("createdById") 
                REFERENCES "users"("id") ON DELETE NO ACTION
        `);

        // Make userId nullable in clients
        await queryRunner.query(`
            ALTER TABLE "clients" ALTER COLUMN "userId" DROP NOT NULL
        `);

        // Update proposals table
        await queryRunner.query(`
            ALTER TABLE "proposals" ADD "agencyId" uuid
        `);

        await queryRunner.query(`
            ALTER TABLE "proposals" ADD "createdById" uuid
        `);

        await queryRunner.query(`
            ALTER TABLE "proposals" ADD CONSTRAINT "FK_proposals_agency" FOREIGN KEY ("agencyId") 
                REFERENCES "agencies"("id") ON DELETE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "proposals" ADD CONSTRAINT "FK_proposals_created_by" FOREIGN KEY ("createdById") 
                REFERENCES "users"("id") ON DELETE NO ACTION
        `);

        // Make userId nullable in proposals
        await queryRunner.query(`
            ALTER TABLE "proposals" ALTER COLUMN "userId" DROP NOT NULL
        `);

        // Update invoices table
        await queryRunner.query(`
            ALTER TABLE "invoices" ADD "agencyId" uuid
        `);

        await queryRunner.query(`
            ALTER TABLE "invoices" ADD "createdById" uuid
        `);

        await queryRunner.query(`
            ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_agency" FOREIGN KEY ("agencyId") 
                REFERENCES "agencies"("id") ON DELETE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "invoices" ADD CONSTRAINT "FK_invoices_created_by" FOREIGN KEY ("createdById") 
                REFERENCES "users"("id") ON DELETE NO ACTION
        `);

        // Make userId nullable in invoices
        await queryRunner.query(`
            ALTER TABLE "invoices" ALTER COLUMN "userId" DROP NOT NULL
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_clients_agency" ON "clients" ("agencyId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_proposals_agency" ON "proposals" ("agencyId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_invoices_agency" ON "invoices" ("agencyId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_invoices_agency"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_proposals_agency"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_clients_agency"`);

        // Revert invoices table
        await queryRunner.query(`ALTER TABLE "invoices" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_created_by"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_invoices_agency"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "createdById"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP COLUMN "agencyId"`);

        // Revert proposals table
        await queryRunner.query(`ALTER TABLE "proposals" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP CONSTRAINT "FK_proposals_created_by"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP CONSTRAINT "FK_proposals_agency"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP COLUMN "createdById"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP COLUMN "agencyId"`);

        // Revert clients table
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_clients_created_by"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_clients_agency"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "createdById"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "agencyId"`);
    }
}

