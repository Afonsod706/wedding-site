import { NextResponse } from "next/server";

type GuestbookPayload = {
  name: string;
  email?: string;
  message: string;
  createdAt?: string;
};

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

export async function GET() {
  try {
    const token = requiredEnv("AIRTABLE_TOKEN");
    const baseId = requiredEnv("AIRTABLE_BASE_ID");
    const tableRaw = requiredEnv("AIRTABLE_GUESTBOOK_TABLE_ID");

    if (tableRaw.startsWith("shr")) {
      throw new Error("AIRTABLE_GUESTBOOK_TABLE_ID está errado (parece 'shr...'). Usa o nome da tabela ou 'tbl...'.");
    }

    const table = encodeURIComponent(tableRaw);

    const url = new URL(`https://api.airtable.com/v0/${baseId}/${table}`);
    url.searchParams.set("pageSize", "50");
    url.searchParams.set("sort[0][field]", "CreatedAt");
    url.searchParams.set("sort[0][direction]", "desc");

    const airtableRes = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!airtableRes.ok) {
      const text = await airtableRes.text().catch(() => "");
      return NextResponse.json({ ok: false, error: `Airtable error (${airtableRes.status}): ${text}` }, { status: 500 });
    }

    const data = (await airtableRes.json()) as {
      records: Array<{ fields: any; createdTime: string }>;
    };

    const items = (data.records || []).map((r) => {
      const f = r.fields || {};
      return {
        name: String(f["Nome"] || "Anónimo"),
        message: String(f["Mensagem"] || ""),
        createdAt: String(f["CreatedAt"] || r.createdTime || new Date().toISOString()),
      };
    });

    return NextResponse.json({ ok: true, items });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro inesperado.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<GuestbookPayload>;

    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const message = (body.message || "").trim();
    const createdAt = (body.createdAt || new Date().toISOString()).trim();

    if (name.length < 2) return NextResponse.json({ ok: false, error: "Nome é obrigatório." }, { status: 400 });
    if (message.length < 3) return NextResponse.json({ ok: false, error: "Mensagem é obrigatória." }, { status: 400 });
    if (name.length > 80) return NextResponse.json({ ok: false, error: "Nome muito longo." }, { status: 400 });
    if (message.length > 800) return NextResponse.json({ ok: false, error: "Mensagem muito longa (máx 800)." }, { status: 400 });
    if (email && !isValidEmail(email)) return NextResponse.json({ ok: false, error: "Email inválido." }, { status: 400 });

    const token = requiredEnv("AIRTABLE_TOKEN");
    const baseId = requiredEnv("AIRTABLE_BASE_ID");
    const tableRaw = requiredEnv("AIRTABLE_GUESTBOOK_TABLE_ID");

    if (tableRaw.startsWith("shr")) {
      throw new Error("AIRTABLE_GUESTBOOK_TABLE_ID está errado (parece 'shr...'). Usa o nome da tabela ou 'tbl...'.");
    }

    const table = encodeURIComponent(tableRaw);

    // ✅ nomes iguais aos teus campos no Airtable
    const fields = {
      Nome: name,
      Email: email || "",
      Mensagem: message,
      CreatedAt: createdAt,
      Nota: "Site",
    };

    const airtableRes = await fetch(`https://api.airtable.com/v0/${baseId}/${table}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ fields }] }),
    });

    if (!airtableRes.ok) {
      const text = await airtableRes.text().catch(() => "");
      return NextResponse.json({ ok: false, error: `Airtable error (${airtableRes.status}): ${text}` }, { status: 500 });
    }

    return NextResponse.json({ ok: true, item: { name, message, createdAt } });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro inesperado.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
