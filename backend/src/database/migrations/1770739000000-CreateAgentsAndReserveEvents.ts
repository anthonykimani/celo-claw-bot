import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateAgentsAndReserveEvents1770739000000 implements MigrationInterface {
  name = 'CreateAgentsAndReserveEvents1770739000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS "uuid-ossp"`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "agents" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "name" character varying(100) NOT NULL,
        "strategy_type" character varying(40) NOT NULL DEFAULT 'crypto',
        "risk_level" character varying(10) NOT NULL DEFAULT 'medium',
        "personality" text,
        "trading_enabled" boolean NOT NULL DEFAULT true,
        "last_trading_balance_usdc" numeric(18,8) NOT NULL DEFAULT 0,
        "total_pnl_usdc" numeric(18,8) NOT NULL DEFAULT 0,
        "total_trades" integer NOT NULL DEFAULT 0,
        "winning_trades" integer NOT NULL DEFAULT 0,
        "win_rate" numeric(6,2) NOT NULL DEFAULT 0,
        "reserve_address" character varying,
        "erc8004_agent_id" character varying,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_agents_id" PRIMARY KEY ("id")
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_agents_name" ON "agents" ("name")`);

    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "reserve_events" (
        "id" SERIAL NOT NULL,
        "agent_id" uuid NOT NULL,
        "amount_cusd" numeric(18,8) NOT NULL,
        "tx_hash" character varying,
        "note" text,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_reserve_events_id" PRIMARY KEY ("id"),
        CONSTRAINT "FK_reserve_events_agent" FOREIGN KEY ("agent_id") REFERENCES "agents"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX IF NOT EXISTS "idx_reserve_events_agent_created" ON "reserve_events" ("agent_id", "created_at")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_reserve_events_agent_created"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "reserve_events"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "idx_agents_name"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "agents"`);
  }
}
