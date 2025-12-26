import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProposalSendingFeatures1766701487305 implements MigrationInterface {
    name = 'AddProposalSendingFeatures1766701487305'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add acceptanceToken to proposals table
        await queryRunner.query(`ALTER TABLE "proposals" ADD "acceptanceToken" character varying`);
        await queryRunner.query(`ALTER TABLE "proposals" ADD CONSTRAINT "UQ_b8982cf9af14890960929af983f" UNIQUE ("acceptanceToken")`);
        await queryRunner.query(`CREATE INDEX "IDX_b8982cf9af14890960929af983" ON "proposals" ("acceptanceToken") `);
        
        // Add new columns to proposal_contact_methods table
        await queryRunner.query(`ALTER TABLE "proposal_contact_methods" ADD "sentAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "proposal_contact_methods" ADD "deliveryStatus" character varying NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "proposal_contact_methods" ADD "acceptedVia" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "proposal_contact_methods" ADD "errorMessage" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove columns from proposal_contact_methods
        await queryRunner.query(`ALTER TABLE "proposal_contact_methods" DROP COLUMN "errorMessage"`);
        await queryRunner.query(`ALTER TABLE "proposal_contact_methods" DROP COLUMN "acceptedVia"`);
        await queryRunner.query(`ALTER TABLE "proposal_contact_methods" DROP COLUMN "deliveryStatus"`);
        await queryRunner.query(`ALTER TABLE "proposal_contact_methods" DROP COLUMN "sentAt"`);
        
        // Remove acceptanceToken from proposals
        await queryRunner.query(`DROP INDEX "public"."IDX_b8982cf9af14890960929af983"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP CONSTRAINT "UQ_b8982cf9af14890960929af983f"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP COLUMN "acceptanceToken"`);
    }
}
