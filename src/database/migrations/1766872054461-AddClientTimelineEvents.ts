import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClientTimelineEvents1766872054461 implements MigrationInterface {
    name = 'AddClientTimelineEvents1766872054461'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "client_timeline_events" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "clientId" uuid NOT NULL, "userId" uuid NOT NULL, "type" character varying NOT NULL, "title" character varying NOT NULL, "description" text, "metadata" jsonb, "relatedEntityType" character varying, "relatedEntityId" character varying, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_083cec1173b4be3ece603e88f31" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_d89c5b579469dea3e1ecfcf46a" ON "client_timeline_events" ("relatedEntityType", "relatedEntityId") `);
        await queryRunner.query(`CREATE INDEX "IDX_af4872c55ea1ca2175e3af8b59" ON "client_timeline_events" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_26a6f3e40728f1d1905ea13611" ON "client_timeline_events" ("type") `);
        await queryRunner.query(`CREATE INDEX "IDX_0f4e04c2261135c70537ddb414" ON "client_timeline_events" ("clientId") `);
        await queryRunner.query(`ALTER TABLE "client_timeline_events" ADD CONSTRAINT "FK_0f4e04c2261135c70537ddb4141" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_timeline_events" ADD CONSTRAINT "FK_1ced60643be45f6f7ce3c0429ed" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client_timeline_events" DROP CONSTRAINT "FK_1ced60643be45f6f7ce3c0429ed"`);
        await queryRunner.query(`ALTER TABLE "client_timeline_events" DROP CONSTRAINT "FK_0f4e04c2261135c70537ddb4141"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0f4e04c2261135c70537ddb414"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_26a6f3e40728f1d1905ea13611"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_af4872c55ea1ca2175e3af8b59"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d89c5b579469dea3e1ecfcf46a"`);
        await queryRunner.query(`DROP TABLE "client_timeline_events"`);
    }

}
