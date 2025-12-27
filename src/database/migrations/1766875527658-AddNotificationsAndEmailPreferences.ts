import { MigrationInterface, QueryRunner } from "typeorm";

export class AddNotificationsAndEmailPreferences1766875527658 implements MigrationInterface {
    name = 'AddNotificationsAndEmailPreferences1766875527658'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create notifications table
        await queryRunner.query(`CREATE TABLE "notifications" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "type" character varying NOT NULL, "recipientEmail" character varying NOT NULL, "relatedEntityType" character varying, "relatedEntityId" character varying, "sentAt" TIMESTAMP NOT NULL DEFAULT now(), "metadata" jsonb, "userId" uuid, "agencyId" uuid, CONSTRAINT "PK_6a72c3c0f683f6462415e653c3a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_da0c321a0029ebe7bacf5adecb" ON "notifications" ("agencyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_692a909ee0fa9383e7859f9b40" ON "notifications" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_aff39d8c029ddf01bbbc6c5bc4" ON "notifications" ("recipientEmail", "sentAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_3257ecd8b1c5d73437143509d0" ON "notifications" ("type", "relatedEntityId") `);
        
        // Add email preferences columns
        await queryRunner.query(`ALTER TABLE "users" ADD "emailPreferences" jsonb`);
        await queryRunner.query(`ALTER TABLE "clients" ADD "emailPreferences" jsonb`);
        await queryRunner.query(`ALTER TABLE "agencies" ADD "emailPreferences" jsonb`);
        
        // Add foreign key constraints for notifications
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_692a909ee0fa9383e7859f9b406" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "notifications" ADD CONSTRAINT "FK_da0c321a0029ebe7bacf5adecbf" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints for notifications
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_da0c321a0029ebe7bacf5adecbf"`);
        await queryRunner.query(`ALTER TABLE "notifications" DROP CONSTRAINT "FK_692a909ee0fa9383e7859f9b406"`);
        
        // Drop email preferences columns
        await queryRunner.query(`ALTER TABLE "agencies" DROP COLUMN "emailPreferences"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "emailPreferences"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailPreferences"`);
        
        // Drop notifications indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_3257ecd8b1c5d73437143509d0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aff39d8c029ddf01bbbc6c5bc4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_692a909ee0fa9383e7859f9b40"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_da0c321a0029ebe7bacf5adecb"`);
        
        // Drop notifications table
        await queryRunner.query(`DROP TABLE "notifications"`);
    }

}
