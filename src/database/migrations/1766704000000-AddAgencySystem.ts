import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAgencySystem1766704000000 implements MigrationInterface {
    name = 'AddAgencySystem1766704000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create agencies table
        await queryRunner.query(`
            CREATE TABLE "agencies" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "description" text,
                "website" character varying,
                "phone" character varying,
                "address" character varying,
                "taxId" character varying,
                "logo" character varying,
                "createdById" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_agencies" PRIMARY KEY ("id"),
                CONSTRAINT "FK_agencies_created_by" FOREIGN KEY ("createdById") 
                    REFERENCES "users"("id") ON DELETE NO ACTION
            )
        `);

        // Create agency_memberships table
        await queryRunner.query(`
            CREATE TABLE "agency_memberships" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "agencyId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "role" character varying NOT NULL,
                "joinedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_agency_memberships" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_agency_memberships" UNIQUE ("agencyId", "userId"),
                CONSTRAINT "FK_agency_memberships_agency" FOREIGN KEY ("agencyId") 
                    REFERENCES "agencies"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_agency_memberships_user" FOREIGN KEY ("userId") 
                    REFERENCES "users"("id") ON DELETE CASCADE
            )
        `);

        // Create resignation_requests table
        await queryRunner.query(`
            CREATE TABLE "resignation_requests" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "agencyId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "message" text,
                "status" character varying NOT NULL DEFAULT 'pending',
                "requestedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "processedAt" TIMESTAMP,
                "processedById" uuid,
                CONSTRAINT "PK_resignation_requests" PRIMARY KEY ("id"),
                CONSTRAINT "FK_resignation_requests_agency" FOREIGN KEY ("agencyId") 
                    REFERENCES "agencies"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_resignation_requests_user" FOREIGN KEY ("userId") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_resignation_requests_processed_by" FOREIGN KEY ("processedById") 
                    REFERENCES "users"("id") ON DELETE NO ACTION
            )
        `);

        // Create client_assignments table
        await queryRunner.query(`
            CREATE TABLE "client_assignments" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "agencyId" uuid NOT NULL,
                "clientId" uuid NOT NULL,
                "businessDeveloperId" uuid NOT NULL,
                "assignedById" uuid NOT NULL,
                "assignedAt" TIMESTAMP NOT NULL DEFAULT now(),
                "notes" text,
                CONSTRAINT "PK_client_assignments" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_client_assignments" UNIQUE ("agencyId", "clientId"),
                CONSTRAINT "FK_client_assignments_agency" FOREIGN KEY ("agencyId") 
                    REFERENCES "agencies"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_client_assignments_client" FOREIGN KEY ("clientId") 
                    REFERENCES "clients"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_client_assignments_business_developer" FOREIGN KEY ("businessDeveloperId") 
                    REFERENCES "users"("id") ON DELETE CASCADE,
                CONSTRAINT "FK_client_assignments_assigned_by" FOREIGN KEY ("assignedById") 
                    REFERENCES "users"("id") ON DELETE NO ACTION
            )
        `);

        // Add agencyId to users table
        await queryRunner.query(`
            ALTER TABLE "users" ADD "agencyId" uuid
        `);

        await queryRunner.query(`
            ALTER TABLE "users" ADD CONSTRAINT "FK_users_agency" FOREIGN KEY ("agencyId") 
                REFERENCES "agencies"("id") ON DELETE NO ACTION
        `);

        // Create indexes
        await queryRunner.query(`
            CREATE INDEX "IDX_agency_memberships_agency" ON "agency_memberships" ("agencyId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_agency_memberships_user" ON "agency_memberships" ("userId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_agency_memberships_role" ON "agency_memberships" ("role")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_resignation_requests_agency" ON "resignation_requests" ("agencyId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_resignation_requests_user" ON "resignation_requests" ("userId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_resignation_requests_status" ON "resignation_requests" ("status")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_client_assignments_agency" ON "client_assignments" ("agencyId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_client_assignments_client" ON "client_assignments" ("clientId")
        `);

        await queryRunner.query(`
            CREATE INDEX "IDX_client_assignments_business_developer" ON "client_assignments" ("businessDeveloperId")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes
        await queryRunner.query(`DROP INDEX "public"."IDX_client_assignments_business_developer"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_client_assignments_client"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_client_assignments_agency"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_resignation_requests_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_resignation_requests_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_resignation_requests_agency"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agency_memberships_role"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agency_memberships_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agency_memberships_agency"`);

        // Drop foreign key and column from users
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_agency"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "agencyId"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "client_assignments"`);
        await queryRunner.query(`DROP TABLE "resignation_requests"`);
        await queryRunner.query(`DROP TABLE "agency_memberships"`);
        await queryRunner.query(`DROP TABLE "agencies"`);
    }
}




