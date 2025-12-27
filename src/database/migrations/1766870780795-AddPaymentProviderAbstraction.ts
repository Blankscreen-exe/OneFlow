import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentProviderAbstraction1766870780795 implements MigrationInterface {
    name = 'AddPaymentProviderAbstraction1766870780795'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_users_agency"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_clients_created_by"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_clients_agency"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP CONSTRAINT "FK_proposals_created_by"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP CONSTRAINT "FK_proposals_agency"`);
        await queryRunner.query(`ALTER TABLE "agencies" DROP CONSTRAINT "FK_agencies_created_by"`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" DROP CONSTRAINT "FK_resignation_requests_processed_by"`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" DROP CONSTRAINT "FK_resignation_requests_user"`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" DROP CONSTRAINT "FK_resignation_requests_agency"`);
        await queryRunner.query(`ALTER TABLE "client_assignments" DROP CONSTRAINT "FK_client_assignments_assigned_by"`);
        await queryRunner.query(`ALTER TABLE "client_assignments" DROP CONSTRAINT "FK_client_assignments_business_developer"`);
        await queryRunner.query(`ALTER TABLE "client_assignments" DROP CONSTRAINT "FK_client_assignments_client"`);
        await queryRunner.query(`ALTER TABLE "client_assignments" DROP CONSTRAINT "FK_client_assignments_agency"`);
        await queryRunner.query(`ALTER TABLE "agency_memberships" DROP CONSTRAINT "FK_agency_memberships_user"`);
        await queryRunner.query(`ALTER TABLE "agency_memberships" DROP CONSTRAINT "FK_agency_memberships_agency"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_clients_agency"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_proposals_agency"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_resignation_requests_agency"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_resignation_requests_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_resignation_requests_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_client_assignments_agency"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_client_assignments_client"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_client_assignments_business_developer"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agency_memberships_agency"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agency_memberships_user"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_agency_memberships_role"`);
        await queryRunner.query(`ALTER TABLE "client_assignments" DROP CONSTRAINT "UQ_client_assignments"`);
        await queryRunner.query(`ALTER TABLE "agency_memberships" DROP CONSTRAINT "UQ_agency_memberships"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP COLUMN "agencyId"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP COLUMN "createdById"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "defaultPaymentProvider" character varying NOT NULL DEFAULT 'stripe'`);
        await queryRunner.query(`ALTER TABLE "users" ADD "paymentProviderAccountId" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "paymentOnboardingStatus" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "paymentOnboardingLink" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "paymentOnboardingCompletedAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "paymentProvider" character varying`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "providerPaymentId" character varying`);
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "UQ_50d2f08323fc3531369f2f41841" UNIQUE ("providerPaymentId")`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "providerAccountId" character varying`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "providerChargeId" character varying`);
        await queryRunner.query(`ALTER TABLE "payments" ADD "providerMetadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "agencies" ADD "defaultPaymentProvider" character varying NOT NULL DEFAULT 'stripe'`);
        await queryRunner.query(`ALTER TABLE "agencies" ADD "paymentProviderAccountId" character varying`);
        await queryRunner.query(`ALTER TABLE "agencies" ADD "paymentOnboardingStatus" character varying`);
        await queryRunner.query(`ALTER TABLE "agencies" ADD "paymentOnboardingLink" character varying`);
        await queryRunner.query(`ALTER TABLE "agencies" ADD "paymentOnboardingCompletedAt" TIMESTAMP`);
        
        // Data migration: Copy existing Stripe data to generic fields
        // For payments
        await queryRunner.query(`
            UPDATE "payments" 
            SET 
                "paymentProvider" = 'stripe',
                "providerPaymentId" = "stripePaymentIntentId",
                "providerAccountId" = "stripeAccountId",
                "providerChargeId" = "stripeChargeId"
            WHERE "stripePaymentIntentId" IS NOT NULL 
                AND "paymentProvider" IS NULL
        `);

        // For users
        await queryRunner.query(`
            UPDATE "users" 
            SET 
                "defaultPaymentProvider" = 'stripe',
                "paymentProviderAccountId" = "stripeAccountId",
                "paymentOnboardingStatus" = CASE 
                    WHEN "stripeOnboardingStatus" = 'active' THEN 'completed'
                    WHEN "stripeOnboardingStatus" = 'pending' THEN 'pending'
                    WHEN "stripeOnboardingStatus" = 'restricted' THEN 'restricted'
                    ELSE 'not_started'
                END,
                "paymentOnboardingLink" = "stripeOnboardingLink",
                "paymentOnboardingCompletedAt" = "stripeOnboardingCompletedAt"
            WHERE "stripeAccountId" IS NOT NULL
                AND "paymentProviderAccountId" IS NULL
        `);

        // For agencies
        await queryRunner.query(`
            UPDATE "agencies" 
            SET 
                "defaultPaymentProvider" = 'stripe',
                "paymentProviderAccountId" = "stripeAccountId",
                "paymentOnboardingStatus" = CASE 
                    WHEN "stripeOnboardingStatus" = 'active' THEN 'completed'
                    WHEN "stripeOnboardingStatus" = 'pending' THEN 'pending'
                    WHEN "stripeOnboardingStatus" = 'restricted' THEN 'restricted'
                    ELSE 'not_started'
                END,
                "paymentOnboardingLink" = "stripeOnboardingLink",
                "paymentOnboardingCompletedAt" = "stripeOnboardingCompletedAt"
            WHERE "stripeAccountId" IS NOT NULL
                AND "paymentProviderAccountId" IS NULL
        `);
        
        await queryRunner.query(`ALTER TABLE "proposals" DROP CONSTRAINT "FK_a203223b94df0abb854c0ca404a"`);
        await queryRunner.query(`ALTER TABLE "proposals" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" DROP COLUMN "status"`);
        await queryRunner.query(`CREATE TYPE "public"."resignation_requests_status_enum" AS ENUM('pending', 'approved', 'rejected')`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" ADD "status" "public"."resignation_requests_status_enum" NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "agency_memberships" DROP COLUMN "role"`);
        await queryRunner.query(`CREATE TYPE "public"."agency_memberships_role_enum" AS ENUM('admin', 'manager', 'business_developer')`);
        await queryRunner.query(`ALTER TABLE "agency_memberships" ADD "role" "public"."agency_memberships_role_enum" NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_c0bd1b641403ecd274c2ec22df" ON "payments" ("paymentProvider") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_50d2f08323fc3531369f2f4184" ON "payments" ("providerPaymentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ebd20f6156932c2c52a4bda104" ON "resignation_requests" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_7bcb054b2845691b29df7e13e7" ON "resignation_requests" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_9c02a80c1fde84d9b41835ed33" ON "resignation_requests" ("agencyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_2edaaf6b81eda505dd9a2a3e22" ON "client_assignments" ("businessDeveloperId") `);
        await queryRunner.query(`CREATE INDEX "IDX_be30f188a00e3877e1b6ed9f2b" ON "client_assignments" ("clientId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6697e79c4ca94143bd18b875c2" ON "client_assignments" ("agencyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8545b2ad377ad6be63b7419052" ON "agency_memberships" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_39f52a6c7fb00c2c5e0622015c" ON "agency_memberships" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6bd343fa7a10e2800a9128cc55" ON "agency_memberships" ("agencyId") `);
        await queryRunner.query(`ALTER TABLE "client_assignments" ADD CONSTRAINT "UQ_98a0725a0e055beb738d9c9932f" UNIQUE ("agencyId", "clientId")`);
        await queryRunner.query(`ALTER TABLE "agency_memberships" ADD CONSTRAINT "UQ_58ac4b726bc10d8d6c6defeae79" UNIQUE ("agencyId", "userId")`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_184debc49e72b43579476cc6e75" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_59c1e5e51addd6ebebf76230b37" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "proposals" ADD CONSTRAINT "FK_a203223b94df0abb854c0ca404a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" ADD CONSTRAINT "FK_9c02a80c1fde84d9b41835ed33a" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" ADD CONSTRAINT "FK_7bcb054b2845691b29df7e13e7e" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" ADD CONSTRAINT "FK_08928220c20154801ae8719f4c5" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_assignments" ADD CONSTRAINT "FK_6697e79c4ca94143bd18b875c2e" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_assignments" ADD CONSTRAINT "FK_be30f188a00e3877e1b6ed9f2bd" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_assignments" ADD CONSTRAINT "FK_2edaaf6b81eda505dd9a2a3e229" FOREIGN KEY ("businessDeveloperId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_assignments" ADD CONSTRAINT "FK_83b5e2160daf6739119f0f3d00a" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agency_memberships" ADD CONSTRAINT "FK_6bd343fa7a10e2800a9128cc550" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agency_memberships" ADD CONSTRAINT "FK_39f52a6c7fb00c2c5e0622015c2" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "agency_memberships" DROP CONSTRAINT "FK_39f52a6c7fb00c2c5e0622015c2"`);
        await queryRunner.query(`ALTER TABLE "agency_memberships" DROP CONSTRAINT "FK_6bd343fa7a10e2800a9128cc550"`);
        await queryRunner.query(`ALTER TABLE "client_assignments" DROP CONSTRAINT "FK_83b5e2160daf6739119f0f3d00a"`);
        await queryRunner.query(`ALTER TABLE "client_assignments" DROP CONSTRAINT "FK_2edaaf6b81eda505dd9a2a3e229"`);
        await queryRunner.query(`ALTER TABLE "client_assignments" DROP CONSTRAINT "FK_be30f188a00e3877e1b6ed9f2bd"`);
        await queryRunner.query(`ALTER TABLE "client_assignments" DROP CONSTRAINT "FK_6697e79c4ca94143bd18b875c2e"`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" DROP CONSTRAINT "FK_08928220c20154801ae8719f4c5"`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" DROP CONSTRAINT "FK_7bcb054b2845691b29df7e13e7e"`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" DROP CONSTRAINT "FK_9c02a80c1fde84d9b41835ed33a"`);
        await queryRunner.query(`ALTER TABLE "proposals" DROP CONSTRAINT "FK_a203223b94df0abb854c0ca404a"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_59c1e5e51addd6ebebf76230b37"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_184debc49e72b43579476cc6e75"`);
        await queryRunner.query(`ALTER TABLE "agency_memberships" DROP CONSTRAINT "UQ_58ac4b726bc10d8d6c6defeae79"`);
        await queryRunner.query(`ALTER TABLE "client_assignments" DROP CONSTRAINT "UQ_98a0725a0e055beb738d9c9932f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6bd343fa7a10e2800a9128cc55"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_39f52a6c7fb00c2c5e0622015c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8545b2ad377ad6be63b7419052"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6697e79c4ca94143bd18b875c2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_be30f188a00e3877e1b6ed9f2b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2edaaf6b81eda505dd9a2a3e22"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c02a80c1fde84d9b41835ed33"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7bcb054b2845691b29df7e13e7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ebd20f6156932c2c52a4bda104"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_50d2f08323fc3531369f2f4184"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c0bd1b641403ecd274c2ec22df"`);
        await queryRunner.query(`ALTER TABLE "agency_memberships" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."agency_memberships_role_enum"`);
        await queryRunner.query(`ALTER TABLE "agency_memberships" ADD "role" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."resignation_requests_status_enum"`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" ADD "status" character varying NOT NULL DEFAULT 'pending'`);
        await queryRunner.query(`ALTER TABLE "proposals" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "proposals" ADD CONSTRAINT "FK_a203223b94df0abb854c0ca404a" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agencies" DROP COLUMN "paymentOnboardingCompletedAt"`);
        await queryRunner.query(`ALTER TABLE "agencies" DROP COLUMN "paymentOnboardingLink"`);
        await queryRunner.query(`ALTER TABLE "agencies" DROP COLUMN "paymentOnboardingStatus"`);
        await queryRunner.query(`ALTER TABLE "agencies" DROP COLUMN "paymentProviderAccountId"`);
        await queryRunner.query(`ALTER TABLE "agencies" DROP COLUMN "defaultPaymentProvider"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "providerMetadata"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "providerChargeId"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "providerAccountId"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "UQ_50d2f08323fc3531369f2f41841"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "providerPaymentId"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP COLUMN "paymentProvider"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "paymentOnboardingCompletedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "paymentOnboardingLink"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "paymentOnboardingStatus"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "paymentProviderAccountId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "defaultPaymentProvider"`);
        await queryRunner.query(`ALTER TABLE "proposals" ADD "createdById" uuid`);
        await queryRunner.query(`ALTER TABLE "proposals" ADD "agencyId" uuid`);
        await queryRunner.query(`ALTER TABLE "agency_memberships" ADD CONSTRAINT "UQ_agency_memberships" UNIQUE ("agencyId", "userId")`);
        await queryRunner.query(`ALTER TABLE "client_assignments" ADD CONSTRAINT "UQ_client_assignments" UNIQUE ("agencyId", "clientId")`);
        await queryRunner.query(`CREATE INDEX "IDX_agency_memberships_role" ON "agency_memberships" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_agency_memberships_user" ON "agency_memberships" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_agency_memberships_agency" ON "agency_memberships" ("agencyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_client_assignments_business_developer" ON "client_assignments" ("businessDeveloperId") `);
        await queryRunner.query(`CREATE INDEX "IDX_client_assignments_client" ON "client_assignments" ("clientId") `);
        await queryRunner.query(`CREATE INDEX "IDX_client_assignments_agency" ON "client_assignments" ("agencyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_resignation_requests_status" ON "resignation_requests" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_resignation_requests_user" ON "resignation_requests" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_resignation_requests_agency" ON "resignation_requests" ("agencyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_proposals_agency" ON "proposals" ("agencyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_clients_agency" ON "clients" ("agencyId") `);
        await queryRunner.query(`ALTER TABLE "agency_memberships" ADD CONSTRAINT "FK_agency_memberships_agency" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agency_memberships" ADD CONSTRAINT "FK_agency_memberships_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_assignments" ADD CONSTRAINT "FK_client_assignments_agency" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_assignments" ADD CONSTRAINT "FK_client_assignments_client" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_assignments" ADD CONSTRAINT "FK_client_assignments_business_developer" FOREIGN KEY ("businessDeveloperId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_assignments" ADD CONSTRAINT "FK_client_assignments_assigned_by" FOREIGN KEY ("assignedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" ADD CONSTRAINT "FK_resignation_requests_agency" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" ADD CONSTRAINT "FK_resignation_requests_user" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "resignation_requests" ADD CONSTRAINT "FK_resignation_requests_processed_by" FOREIGN KEY ("processedById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "agencies" ADD CONSTRAINT "FK_agencies_created_by" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "proposals" ADD CONSTRAINT "FK_proposals_agency" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "proposals" ADD CONSTRAINT "FK_proposals_created_by" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_clients_agency" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_clients_created_by" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_users_agency" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
