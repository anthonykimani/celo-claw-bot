import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAgentFieldsForBotAttribution1770832000000 implements MigrationInterface {
  name = 'AddAgentFieldsForBotAttribution1770832000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "agents" ADD COLUMN IF NOT EXISTS "strategy_params" jsonb`);

    await queryRunner.query(`ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "agent_id" uuid`);
    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_orders_agent_id" ON "orders" ("agent_id")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_orders_agent_id"`);
    await queryRunner.query(`ALTER TABLE "orders" DROP COLUMN IF EXISTS "agent_id"`);

    await queryRunner.query(`ALTER TABLE "agents" DROP COLUMN IF EXISTS "strategy_params"`);
  }
}
