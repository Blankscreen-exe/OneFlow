import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClientContacts1766699715138 implements MigrationInterface {
    name = 'AddClientContacts1766699715138'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "proposal_contact_methods" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "proposalId" uuid NOT NULL, "contactId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1c76fa77a82119d05e02665cbf6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9e5c13a3eb6f13ca3a6c91283d" ON "proposal_contact_methods" ("proposalId") `);
        await queryRunner.query(`CREATE TABLE "client_contacts" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clientId" uuid NOT NULL, "type" character varying NOT NULL, "value" character varying NOT NULL, "label" character varying, "isPrimary" boolean NOT NULL DEFAULT false, "isPrimaryPhone" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1d0ab11dc872cb18d4850c970a5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_b12571ed31604ee44ce5bc8c89" ON "client_contacts" ("clientId") `);
        await queryRunner.query(`ALTER TABLE "proposal_contact_methods" ADD CONSTRAINT "FK_9e5c13a3eb6f13ca3a6c91283d1" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "proposal_contact_methods" ADD CONSTRAINT "FK_d87f80e9bf8eabce28627937d66" FOREIGN KEY ("contactId") REFERENCES "client_contacts"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_contacts" ADD CONSTRAINT "FK_b12571ed31604ee44ce5bc8c893" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client_contacts" DROP CONSTRAINT "FK_b12571ed31604ee44ce5bc8c893"`);
        await queryRunner.query(`ALTER TABLE "proposal_contact_methods" DROP CONSTRAINT "FK_d87f80e9bf8eabce28627937d66"`);
        await queryRunner.query(`ALTER TABLE "proposal_contact_methods" DROP CONSTRAINT "FK_9e5c13a3eb6f13ca3a6c91283d1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b12571ed31604ee44ce5bc8c89"`);
        await queryRunner.query(`DROP TABLE "client_contacts"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9e5c13a3eb6f13ca3a6c91283d"`);
        await queryRunner.query(`DROP TABLE "proposal_contact_methods"`);
    }

}
