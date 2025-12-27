import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPaymentIntegration1766796095630 implements MigrationInterface {
    name = 'AddPaymentIntegration1766796095630'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "client_service_providers" DROP CONSTRAINT "FK_client_service_providers_client"`);
        await queryRunner.query(`ALTER TABLE "client_service_providers" DROP CONSTRAINT "FK_client_service_providers_service_provider"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_client_service_providers_client"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_client_service_providers_service_provider"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_role"`);
        await queryRunner.query(`ALTER TABLE "client_service_providers" DROP CONSTRAINT "UQ_client_service_providers"`);
        await queryRunner.query(`CREATE TABLE "payments" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoiceId" uuid NOT NULL, "stripePaymentIntentId" character varying, "stripeChargeId" character varying, "stripeAccountId" character varying, "amount" numeric(10,2) NOT NULL, "platformFee" numeric(10,2) NOT NULL DEFAULT '0', "platformFeeRate" numeric(5,2) NOT NULL DEFAULT '0', "status" character varying NOT NULL DEFAULT 'pending', "paymentMethod" character varying, "refunded" boolean NOT NULL DEFAULT false, "refundAmount" numeric(10,2) NOT NULL DEFAULT '0', "metadata" jsonb, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "UQ_57059f281caef51ef1c15adaf35" UNIQUE ("stripePaymentIntentId"), CONSTRAINT "PK_197ab7af18c93fbb0c9b28b4a59" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_32b41cdb985a296213e9a928b5" ON "payments" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_a40a6820f48045500e10d73ebf" ON "payments" ("stripeAccountId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_57059f281caef51ef1c15adaf3" ON "payments" ("stripePaymentIntentId") `);
        await queryRunner.query(`CREATE INDEX "IDX_43d19956aeab008b49e0804c14" ON "payments" ("invoiceId") `);
        await queryRunner.query(`CREATE TABLE "invoice_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "invoiceId" uuid NOT NULL, "description" character varying NOT NULL, "quantity" numeric(10,2) NOT NULL DEFAULT '1', "unitPrice" numeric(10,2) NOT NULL, "total" numeric(10,2) NOT NULL, "sortOrder" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_53b99f9e0e2945e69de1a12b75a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid, "agencyId" uuid, "createdById" uuid, "clientId" uuid NOT NULL, "proposalId" uuid, "invoiceNumber" character varying NOT NULL, "status" character varying NOT NULL DEFAULT 'draft', "subtotal" numeric(10,2) NOT NULL DEFAULT '0', "taxRate" numeric(5,2) NOT NULL DEFAULT '0', "taxAmount" numeric(10,2) NOT NULL DEFAULT '0', "total" numeric(10,2) NOT NULL DEFAULT '0', "amountPaid" numeric(10,2) NOT NULL DEFAULT '0', "amountDue" numeric(10,2) NOT NULL DEFAULT '0', "dueDate" date, "stripePaymentLinkId" character varying, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "sentAt" TIMESTAMP, "paidAt" TIMESTAMP, "accessToken" character varying, CONSTRAINT "UQ_38f9c8a74e16bbf1b0e2558f6fd" UNIQUE ("accessToken"), CONSTRAINT "PK_668cef7c22a427fd822cc1be3ce" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_38f9c8a74e16bbf1b0e2558f6f" ON "invoices" ("accessToken") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8922bb867dee7fe99ef6b79c8c" ON "invoices" ("userId", "invoiceNumber") `);
        await queryRunner.query(`CREATE INDEX "IDX_ac0f09364e3701d9ed35435288" ON "invoices" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_e21d0eceeb091f7f5054dfb5d6" ON "invoices" ("proposalId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d9df936180710f9968da7cf4a5" ON "invoices" ("clientId") `);
        await queryRunner.query(`CREATE INDEX "IDX_45a530583d2dc83ae3dc2f0618" ON "invoices" ("agencyId") `);
        await queryRunner.query(`CREATE INDEX "IDX_fcbe490dc37a1abf68f19c5ccb" ON "invoices" ("userId") `);
        
        // Add Stripe columns to agencies table if it exists
        const agenciesTableExists = await queryRunner.hasTable('agencies');
        if (agenciesTableExists) {
            // Check if columns exist before adding
            const hasStripeAccountId = await queryRunner.hasColumn('agencies', 'stripeAccountId');
            if (!hasStripeAccountId) {
                await queryRunner.query(`ALTER TABLE "agencies" ADD "stripeAccountId" character varying`);
                await queryRunner.query(`ALTER TABLE "agencies" ADD CONSTRAINT "UQ_22aa1c04905cd529a5566e3584d" UNIQUE ("stripeAccountId")`);
            }
            if (!(await queryRunner.hasColumn('agencies', 'stripeOnboardingStatus'))) {
                await queryRunner.query(`ALTER TABLE "agencies" ADD "stripeOnboardingStatus" character varying NOT NULL DEFAULT 'not_started'`);
            }
            if (!(await queryRunner.hasColumn('agencies', 'platformFeeRate'))) {
                await queryRunner.query(`ALTER TABLE "agencies" ADD "platformFeeRate" numeric(5,2) NOT NULL DEFAULT '10'`);
            }
            if (!(await queryRunner.hasColumn('agencies', 'stripeOnboardingLink'))) {
                await queryRunner.query(`ALTER TABLE "agencies" ADD "stripeOnboardingLink" character varying`);
            }
            if (!(await queryRunner.hasColumn('agencies', 'stripeOnboardingCompletedAt'))) {
                await queryRunner.query(`ALTER TABLE "agencies" ADD "stripeOnboardingCompletedAt" TIMESTAMP`);
            }
        }
        
        // Only add agencyId to users if it doesn't exist
        const hasUserAgencyId = await queryRunner.hasColumn('users', 'agencyId');
        if (!hasUserAgencyId) {
            await queryRunner.query(`ALTER TABLE "users" ADD "agencyId" uuid`);
        }
        // Add Stripe columns to users if they don't exist
        if (!(await queryRunner.hasColumn('users', 'stripeAccountId'))) {
            await queryRunner.query(`ALTER TABLE "users" ADD "stripeAccountId" character varying`);
            await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "UQ_47e0e61507d870e967c509e5cd9" UNIQUE ("stripeAccountId")`);
        }
        if (!(await queryRunner.hasColumn('users', 'stripeOnboardingStatus'))) {
            await queryRunner.query(`ALTER TABLE "users" ADD "stripeOnboardingStatus" character varying NOT NULL DEFAULT 'not_started'`);
        }
        if (!(await queryRunner.hasColumn('users', 'platformFeeRate'))) {
            await queryRunner.query(`ALTER TABLE "users" ADD "platformFeeRate" numeric(5,2) NOT NULL DEFAULT '10'`);
        }
        if (!(await queryRunner.hasColumn('users', 'stripeOnboardingLink'))) {
            await queryRunner.query(`ALTER TABLE "users" ADD "stripeOnboardingLink" character varying`);
        }
        if (!(await queryRunner.hasColumn('users', 'stripeOnboardingCompletedAt'))) {
            await queryRunner.query(`ALTER TABLE "users" ADD "stripeOnboardingCompletedAt" TIMESTAMP`);
        }
        
        // Only add columns to clients if they don't exist
        if (!(await queryRunner.hasColumn('clients', 'agencyId'))) {
            await queryRunner.query(`ALTER TABLE "clients" ADD "agencyId" uuid`);
        }
        if (!(await queryRunner.hasColumn('clients', 'createdById'))) {
            await queryRunner.query(`ALTER TABLE "clients" ADD "createdById" uuid`);
        }
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('admin', 'service_provider', 'client')`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" "public"."users_role_enum" NOT NULL DEFAULT 'service_provider'`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_59c1e5e51addd6ebebf76230b37"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_59390d42a3bb0907edbac9fd58"`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "userId" DROP NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_638692606c7873331187c1bc98" ON "client_service_providers" ("serviceProviderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_f0eb8bbb9159f33a3c8e33b9ba" ON "client_service_providers" ("clientId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_59390d42a3bb0907edbac9fd58" ON "clients" ("userId", "email") `);
        await queryRunner.query(`ALTER TABLE "client_service_providers" ADD CONSTRAINT "UQ_3d21529a92b4f4316998ce60c0a" UNIQUE ("clientId", "serviceProviderId")`);
        await queryRunner.query(`ALTER TABLE "client_service_providers" ADD CONSTRAINT "FK_f0eb8bbb9159f33a3c8e33b9bae" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_service_providers" ADD CONSTRAINT "FK_638692606c7873331187c1bc981" FOREIGN KEY ("serviceProviderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        // Add foreign key constraints only if they don't exist
        if (!hasUserAgencyId) {
            await queryRunner.query(`ALTER TABLE "users" ADD CONSTRAINT "FK_184debc49e72b43579476cc6e75" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }
        
        const hasClientAgencyId = await queryRunner.hasColumn('clients', 'agencyId');
        const hasClientCreatedById = await queryRunner.hasColumn('clients', 'createdById');
        
        // Check if constraints exist before adding
        const clientAgencyFkExists = await queryRunner.query(`
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'FK_24b4626ed7131b82ccdf89089c9' AND table_name = 'clients'
        `);
        if (hasClientAgencyId && clientAgencyFkExists.length === 0) {
            await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_24b4626ed7131b82ccdf89089c9" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }
        
        const clientCreatedByFkExists = await queryRunner.query(`
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'FK_d9da07105d53c46866e802f2590' AND table_name = 'clients'
        `);
        if (hasClientCreatedById && clientCreatedByFkExists.length === 0) {
            await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_d9da07105d53c46866e802f2590" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        }
        await queryRunner.query(`ALTER TABLE "payments" ADD CONSTRAINT "FK_43d19956aeab008b49e0804c145" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoice_items" ADD CONSTRAINT "FK_7fb6895fc8fad9f5200e91abb59" FOREIGN KEY ("invoiceId") REFERENCES "invoices"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_fcbe490dc37a1abf68f19c5ccb9" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_45a530583d2dc83ae3dc2f0618c" FOREIGN KEY ("agencyId") REFERENCES "agencies"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_dc9c84f58ab53b5c844c276e435" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_d9df936180710f9968da7cf4a51" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "invoices" ADD CONSTRAINT "FK_e21d0eceeb091f7f5054dfb5d65" FOREIGN KEY ("proposalId") REFERENCES "proposals"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        // Foreign key constraints for agency-related tables are already created in AddAgencySystem migration
        // Only add if tables exist and constraints don't
        if (agenciesTableExists) {
            const agencyCreatedByFkExists = await queryRunner.query(`
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = 'FK_5a4334608603cc538560a2df82c' AND table_name = 'agencies'
            `);
            if (agencyCreatedByFkExists.length === 0) {
                await queryRunner.query(`ALTER TABLE "agencies" ADD CONSTRAINT "FK_5a4334608603cc538560a2df82c" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
            }
        }
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
        await queryRunner.query(`ALTER TABLE "agencies" DROP CONSTRAINT "FK_5a4334608603cc538560a2df82c"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_e21d0eceeb091f7f5054dfb5d65"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_d9df936180710f9968da7cf4a51"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_dc9c84f58ab53b5c844c276e435"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_45a530583d2dc83ae3dc2f0618c"`);
        await queryRunner.query(`ALTER TABLE "invoices" DROP CONSTRAINT "FK_fcbe490dc37a1abf68f19c5ccb9"`);
        await queryRunner.query(`ALTER TABLE "invoice_items" DROP CONSTRAINT "FK_7fb6895fc8fad9f5200e91abb59"`);
        await queryRunner.query(`ALTER TABLE "payments" DROP CONSTRAINT "FK_43d19956aeab008b49e0804c145"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_d9da07105d53c46866e802f2590"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_24b4626ed7131b82ccdf89089c9"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP CONSTRAINT "FK_59c1e5e51addd6ebebf76230b37"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "FK_184debc49e72b43579476cc6e75"`);
        await queryRunner.query(`ALTER TABLE "client_service_providers" DROP CONSTRAINT "FK_638692606c7873331187c1bc981"`);
        await queryRunner.query(`ALTER TABLE "client_service_providers" DROP CONSTRAINT "FK_f0eb8bbb9159f33a3c8e33b9bae"`);
        await queryRunner.query(`ALTER TABLE "client_service_providers" DROP CONSTRAINT "UQ_3d21529a92b4f4316998ce60c0a"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_59390d42a3bb0907edbac9fd58"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f0eb8bbb9159f33a3c8e33b9ba"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_638692606c7873331187c1bc98"`);
        await queryRunner.query(`ALTER TABLE "clients" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_59390d42a3bb0907edbac9fd58" ON "clients" ("userId", "email") `);
        await queryRunner.query(`ALTER TABLE "clients" ADD CONSTRAINT "FK_59c1e5e51addd6ebebf76230b37" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "role"`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "role" character varying NOT NULL DEFAULT 'service_provider'`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "createdById"`);
        await queryRunner.query(`ALTER TABLE "clients" DROP COLUMN "agencyId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stripeOnboardingCompletedAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stripeOnboardingLink"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "platformFeeRate"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stripeOnboardingStatus"`);
        await queryRunner.query(`ALTER TABLE "users" DROP CONSTRAINT "UQ_47e0e61507d870e967c509e5cd9"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "stripeAccountId"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "agencyId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6bd343fa7a10e2800a9128cc55"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_39f52a6c7fb00c2c5e0622015c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8545b2ad377ad6be63b7419052"`);
        await queryRunner.query(`DROP TABLE "agency_memberships"`);
        await queryRunner.query(`DROP TYPE "public"."agency_memberships_role_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6697e79c4ca94143bd18b875c2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_be30f188a00e3877e1b6ed9f2b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_2edaaf6b81eda505dd9a2a3e22"`);
        await queryRunner.query(`DROP TABLE "client_assignments"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9c02a80c1fde84d9b41835ed33"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7bcb054b2845691b29df7e13e7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ebd20f6156932c2c52a4bda104"`);
        await queryRunner.query(`DROP TABLE "resignation_requests"`);
        await queryRunner.query(`DROP TYPE "public"."resignation_requests_status_enum"`);
        await queryRunner.query(`DROP TABLE "agencies"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fcbe490dc37a1abf68f19c5ccb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_45a530583d2dc83ae3dc2f0618"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d9df936180710f9968da7cf4a5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e21d0eceeb091f7f5054dfb5d6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ac0f09364e3701d9ed35435288"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8922bb867dee7fe99ef6b79c8c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_38f9c8a74e16bbf1b0e2558f6f"`);
        await queryRunner.query(`DROP TABLE "invoices"`);
        await queryRunner.query(`DROP TABLE "invoice_items"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_43d19956aeab008b49e0804c14"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_57059f281caef51ef1c15adaf3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a40a6820f48045500e10d73ebf"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_32b41cdb985a296213e9a928b5"`);
        await queryRunner.query(`DROP TABLE "payments"`);
        await queryRunner.query(`ALTER TABLE "client_service_providers" ADD CONSTRAINT "UQ_client_service_providers" UNIQUE ("clientId", "serviceProviderId")`);
        await queryRunner.query(`CREATE INDEX "IDX_users_role" ON "users" ("role") `);
        await queryRunner.query(`CREATE INDEX "IDX_client_service_providers_service_provider" ON "client_service_providers" ("serviceProviderId") `);
        await queryRunner.query(`CREATE INDEX "IDX_client_service_providers_client" ON "client_service_providers" ("clientId") `);
        await queryRunner.query(`ALTER TABLE "client_service_providers" ADD CONSTRAINT "FK_client_service_providers_service_provider" FOREIGN KEY ("serviceProviderId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "client_service_providers" ADD CONSTRAINT "FK_client_service_providers_client" FOREIGN KEY ("clientId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
