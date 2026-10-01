import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Baseline: schema that existed before migrations were introduced
 * (created by `synchronize`). Skipped on databases that already have it.
 */
export class InitialSchema1790886955856 implements MigrationInterface {
  name = 'InitialSchema1790886955856';

  public async up(queryRunner: QueryRunner): Promise<void> {
    if (await queryRunner.hasTable('promotions')) {
      return;
    }

    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);
    await queryRunner.query(`
      CREATE TABLE "promotions" (
        "id" character varying NOT NULL,
        "name" character varying NOT NULL,
        "tag" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_a10a12e3401890fd79e06b57ff2" UNIQUE ("tag"),
        CONSTRAINT "PK_380cecbbe3ac11f0e5a7c452c34" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "meals" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "additionals" character varying,
        "price" numeric(10, 2) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "promotionId" character varying,
        CONSTRAINT "PK_e6f830ac9b463433b58ad6f1a59" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "users" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "username" character varying NOT NULL,
        "email" character varying NOT NULL,
        "password" character varying NOT NULL,
        "role" character varying NOT NULL DEFAULT 'user',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_fe0bb3f6520ee0469504521e710" UNIQUE ("username"),
        CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
        CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "meals"
      ADD CONSTRAINT "FK_fcef389ce24d684e4b738a64072" FOREIGN KEY ("promotionId") REFERENCES "promotions"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "meals" DROP CONSTRAINT "FK_fcef389ce24d684e4b738a64072"`,
    );
    await queryRunner.query(`DROP TABLE "users"`);
    await queryRunner.query(`DROP TABLE "meals"`);
    await queryRunner.query(`DROP TABLE "promotions"`);
  }
}
