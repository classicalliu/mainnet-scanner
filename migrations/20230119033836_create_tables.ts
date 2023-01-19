import { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
    await knex.schema
    .createTable("contracts", (table: Knex.TableBuilder) => {
      table.bigIncrements("id");

      table.string("code_hash").notNullable()
      table.string("hash_type").notNullable();

      table.unique([
        "code_hash",
        "hash_type"
      ])

    });

    await knex.schema.createTable("factory_scripts", (table: Knex.TableBuilder) => {
        table.bigIncrements("id");
        
        table.string("code_hash").notNullable()
        table.string("hash_type").notNullable()
        table.string("args").notNullable()

        table.unique([
            "code_hash",
            "hash_type",
            "args"
        ])
    })

    await knex.schema.createTable("tokens", (table: Knex.TableBuilder) => {
        table.bigIncrements("id");

        table.string("out_point_tx_hash").notNullable();
        table.integer("out_point_index").notNullable();
        table.bigint("factory_script_id").notNullable();
        table.bigint("contract_id").notNullable();
        table.bigint("block_number").notNullable();

        table.unique([
            "out_point_tx_hash",
            "out_point_index",
        ])
    })

    await knex.schema.createTable("flags", (table: Knex.TableBuilder) => {
        table.bigIncrements("id");
        
        table.string("key").notNullable().unique();
        table.string("value").notNullable()
    })

    await knex("flags").insert({ key: "current_tip", value: "0" })
}


export async function down(knex: Knex): Promise<void> {
}

