import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { PGlite } from "@electric-sql/pglite";
const userA = "11111111-1111-4111-8111-111111111111",
  userB = "22222222-2222-4222-8222-222222222222",
  admin = "33333333-3333-4333-8333-333333333333";
test("Postgres security, server totals, stock and admin transactions", async (t) => {
  const db = new PGlite();
  await db.exec(
    `create role anon;create role authenticated;create schema auth;create table auth.users(id uuid primary key);create function auth.uid() returns uuid language sql stable as $$select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid$$;grant usage on schema public,auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;insert into auth.users values('${userA}'),('${userB}'),('${admin}');`,
  );
  await db.exec(
    fs.readFileSync(
      new URL("../supabase/migrations/20260924_pantry.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    fs.readFileSync(
      new URL("../supabase/seed-development.sql", import.meta.url),
      "utf8",
    ),
  );
  await db.exec(
    fs.readFileSync(
      new URL(
        "../supabase/migrations/20260925_restrict_anonymous.sql",
        import.meta.url,
      ),
      "utf8",
    ),
  );
  await db.exec(`insert into nr_admins values('${admin}')`);
  const as = async (id) =>
    db.exec(
      `reset role;select set_config('request.jwt.claim.sub','${id || ""}',false);set role ${id ? "authenticated" : "anon"};`,
    );
  const address = {
    name: "Test Customer",
    email: "test@example.com",
    street: "1 Example Street",
    city: "Example",
    region: "Example",
    postal: "12345",
    country: "US",
  };
  const order = async (lines, request = crypto.randomUUID(), a = address) => {
    const r = await db.query(
      "select nr_place_preview_order($1::jsonb,$2::jsonb,$3::uuid) as id",
      [JSON.stringify(lines), JSON.stringify(a), request],
    );
    return r.rows[0].id;
  };
  await t.test(
    "anonymous can read catalog but cannot place orders or become admin",
    async () => {
      await as(null);
      assert.equal(
        (await db.query("select * from nr_products")).rows.length,
        7,
      );
      await assert.rejects(order([{ id: "mango-250", qty: 1 }]));
      await assert.rejects(db.exec(`insert into nr_admins values('${userA}')`));
    },
  );
  let orderId;
  await t.test(
    "server computes exact 10kg fee, ignores client total, idempotent retries",
    async () => {
      await as(userA);
      const request = crypto.randomUUID();
      orderId = await order(
        [{ id: "turmeric-1000", qty: 10, price: 0.01, total: 0 }],
        request,
      );
      const row = (
        await db.query("select * from nr_orders where id=$1", [orderId])
      ).rows[0];
      assert.equal(row.weight_g, 10000);
      assert.equal(Number(row.shipping), 2400);
      assert.equal(Number(row.subtotal), 5720);
      assert.equal(Number(row.total), 8120);
      assert.equal(
        await order([{ id: "turmeric-1000", qty: 10 }], request),
        orderId,
      );
      assert.equal((await db.query("select * from nr_orders")).rows.length, 1);
    },
  );
  await t.test(
    "over 10kg delivery free; preview remains unpaid and does not reserve stock",
    async () => {
      const id = await order([
        { id: "turmeric-1000", qty: 10 },
        { id: "mango-250", qty: 1 },
      ]);
      const row = (await db.query("select * from nr_orders where id=$1", [id]))
        .rows[0];
      assert.equal(row.weight_g, 10250);
      assert.equal(Number(row.shipping), 0);
      assert.equal(row.payment_status, "not_paid");
      assert.equal(
        (await db.query("select stock from nr_variants where id='mango-250'"))
          .rows[0].stock,
        100,
      );
    },
  );
  await t.test(
    "server rejects unknown products, duplicates, fractional and excessive quantities, invalid destination",
    async () => {
      for (const lines of [
        [{ id: "bad", qty: 1 }],
        [
          { id: "mango-250", qty: 1 },
          { id: "mango-250", qty: 2 },
        ],
        [{ id: "mango-250", qty: 1.5 }],
        [{ id: "mango-250", qty: 0 }],
        [{ id: "mango-250", qty: 100 }],
        [],
      ])
        await assert.rejects(order(lines));
      await assert.rejects(
        order([{ id: "mango-250", qty: 1 }], crypto.randomUUID(), {
          ...address,
          country: "ZZ",
        }),
      );
    },
  );
  await t.test(
    "customers cannot forge orders, prices, payment state or admin access",
    async () => {
      await assert.rejects(db.exec("update nr_variants set price=1"));
      await assert.rejects(
        db.exec("update nr_orders set payment_status='paid'"),
      );
      await assert.rejects(
        db.query("select nr_save_product($1,$2,$3)", [
          "mango",
          JSON.stringify({ name: "Changed" }),
          "[]",
        ]),
      );
      await assert.rejects(
        db.exec(
          `insert into nr_orders(user_id,request_id,address,items,subtotal,shipping,total,weight_g) values('${userA}',gen_random_uuid(),'{}','[]',1,0,1,1)`,
        ),
      );
      await db.exec("update nr_orders set status='cancelled'");
      assert.equal(
        (await db.query("select status from nr_orders where id=$1", [orderId]))
          .rows[0].status,
        "preview",
      );
    },
  );
  await t.test("saved boxes and orders isolated per customer", async () => {
    await db.query("insert into nr_boxes(user_id,lines) values($1,$2)", [
      userA,
      JSON.stringify([{ id: "mango-250", qty: 2 }]),
    ]);
    await as(userB);
    assert.equal((await db.query("select * from nr_orders")).rows.length, 0);
    assert.equal((await db.query("select * from nr_boxes")).rows.length, 0);
    await assert.rejects(
      db.query("insert into nr_boxes(user_id,lines) values($1,$2)", [
        userA,
        "[]",
      ]),
    );
  });
  await t.test(
    "admin may manage products and preview status, but cannot mark paid",
    async () => {
      await as(admin);
      assert.equal(
        (await db.query("select nr_is_admin() as yes")).rows[0].yes,
        true,
      );
      assert.equal((await db.query("select * from nr_orders")).rows.length, 2);
      await db.query("update nr_orders set status=$1 where id=$2", [
        "reviewed",
        orderId,
      ]);
      await db.query("select nr_save_product($1,$2,$3)", [
        "mango",
        JSON.stringify({
          name: "Mango Pickle",
          image: "/images/mango.webp",
          notes: "Test",
          description: "Test",
          active: true,
        }),
        JSON.stringify([{ id: "mango-250", price: 300, stock: 1 }]),
      ]);
      assert.equal(
        Number(
          (await db.query("select price from nr_variants where id='mango-250'"))
            .rows[0].price,
        ),
        300,
      );
      await assert.rejects(
        db.exec("update nr_orders set payment_status='paid'"),
      );
    },
  );
  await t.test(
    "stock limits enforced server-side after admin changes",
    async () => {
      await as(userA);
      await assert.rejects(order([{ id: "mango-250", qty: 2 }]));
    },
  );
  await db.close();
});
