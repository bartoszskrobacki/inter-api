import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMenu1790886955857 implements MigrationInterface {
  name = 'AddMenu1790886955857';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "menus" (
        "id" SERIAL NOT NULL,
        "tag" character varying NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "UQ_707613147cf6c44ae397d4ec484" UNIQUE ("tag"),
        CONSTRAINT "PK_3fec3d93327f4538e0cbd4349c4" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "menu_categories" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "position" integer NOT NULL DEFAULT '0',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "menuId" integer,
        CONSTRAINT "PK_124ae987900336f983881cb04e6" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      CREATE TABLE "menu_items" (
        "id" SERIAL NOT NULL,
        "name" character varying NOT NULL,
        "description" character varying,
        "price" numeric(10, 2) NOT NULL,
        "position" integer NOT NULL DEFAULT '0',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "categoryId" integer,
        CONSTRAINT "PK_57e6188f929e5dc6919168620c8" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "menu_categories"
      ADD CONSTRAINT "FK_ac8a799d6184c90f13648b38f78" FOREIGN KEY ("menuId") REFERENCES "menus"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "menu_items"
      ADD CONSTRAINT "FK_d56e5ccc298e8bf721f75a7eb96" FOREIGN KEY ("categoryId") REFERENCES "menu_categories"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "menu_items" DROP CONSTRAINT "FK_d56e5ccc298e8bf721f75a7eb96"`,
    );
    await queryRunner.query(
      `ALTER TABLE "menu_categories" DROP CONSTRAINT "FK_ac8a799d6184c90f13648b38f78"`,
    );
    await queryRunner.query(`DROP TABLE "menu_items"`);
    await queryRunner.query(`DROP TABLE "menu_categories"`);
    await queryRunner.query(`DROP TABLE "menus"`);
  }
}
