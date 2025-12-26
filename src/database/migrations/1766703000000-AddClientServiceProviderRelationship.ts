import { MigrationInterface, QueryRunner } from "typeorm";

export class AddClientServiceProviderRelationship1766703000000 implements MigrationInterface {
    name = 'AddClientServiceProviderRelationship1766703000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create client_service_providers junction table
        await queryRunner.query(`
            CREATE TABLE "client_service_providers" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "clientId" uuid NOT NULL,
                "serviceProviderId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_client_service_providers" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_client_service_providers" UNIQUE ("clientId", "serviceProviderId"),
                CONSTRAINT "FK_client_service_providers_client" FOREIGN KEY ("clientId") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_client_service_providers_service_provider" FOREIGN KEY ("serviceProviderId") 
                    REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);
        
        // Create indexes for performance
        await queryRunner.query(`
            CREATE INDEX "IDX_client_service_providers_client" ON "client_service_providers" ("clientId")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_client_service_providers_service_provider" ON "client_service_providers" ("serviceProviderId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_client_service_providers_service_provider"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_client_service_providers_client"`);
        await queryRunner.query(`DROP TABLE "client_service_providers"`);
    }
}

