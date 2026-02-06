import { NextResponse } from "next/server";

type RsvpPayload = {
  attendance: "yes" | "no";
  name: string;
  email: string;
  phone: string;
};

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function escapeAirtableString(v: string): string {
  // Airtable formula strings usam aspas simples: '...'
  // Email quase nunca tem ', mas fica seguro.
  return v.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

async function airtableJson(res: Response): Promise<any> {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Partial<RsvpPayload>;

    // ✅ VALIDAR
    const name = body.name?.trim() || "";
    const emailRaw = body.email?.trim() || "";
    const phone = body.phone?.trim() || "";
    const attendance = body.attendance;

    if (name.length < 2) return NextResponse.json({ ok: false, error: "Nome é obrigatório." }, { status: 400 });
    if (!emailRaw) return NextResponse.json({ ok: false, error: "Email é obrigatório." }, { status: 400 });
    if (!isValidEmail(emailRaw)) return NextResponse.json({ ok: false, error: "Email inválido." }, { status: 400 });
    if (!phone) return NextResponse.json({ ok: false, error: "Telemóvel é obrigatório." }, { status: 400 });
    if (attendance !== "yes" && attendance !== "no") {
      return NextResponse.json({ ok: false, error: "Attendance inválido." }, { status: 400 });
    }

    // ✅ NORMALIZAR EMAIL (para dedup)
    const emailKey = emailRaw.toLowerCase();

    const token = requiredEnv("AIRTABLE_TOKEN");
    const baseId = requiredEnv("AIRTABLE_BASE_ID");
    const tableIdRaw = requiredEnv("AIRTABLE_TABLE_ID");

    if (tableIdRaw.startsWith("shr")) {
      throw new Error("AIRTABLE_TABLE_ID parece um share id 'shr...'. Usa o NOME da tabela ou 'tbl...'.");
    }

    const table = encodeURIComponent(tableIdRaw);

    const fields = {
      "Nome": name,
      "Endereço de Email": emailRaw, // guardas como a pessoa escreveu
      "Contacto": phone,
      "Vai comparecer?": attendance === "yes" ? "Sim" : "Não",
      "Nota": "Site",
    };

    // ✅ 1) PROCURAR EXISTENTE PELO EMAIL (case-insensitive)
    const formula = `LOWER({Endereço de Email})='${escapeAirtableString(emailKey)}'`;
    const searchUrl =
      `https://api.airtable.com/v0/${baseId}/${table}` +
      `?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;

    const findRes = await fetch(searchUrl, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!findRes.ok) {
      const data = await airtableJson(findRes);
      return NextResponse.json(
        { ok: false, error: `Airtable search error (${findRes.status}): ${JSON.stringify(data)}` },
        { status: 500 }
      );
    }

    const found = (await findRes.json()) as { records?: Array<{ id: string }> };
    const recordId = found.records?.[0]?.id;

    // ✅ 2) UPDATE se existir, senão CREATE
    if (recordId) {
      const patchRes = await fetch(`https://api.airtable.com/v0/${baseId}/${table}/${recordId}`, {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ fields }),
      });

      if (!patchRes.ok) {
        const data = await airtableJson(patchRes);
        return NextResponse.json(
          { ok: false, error: `Airtable update error (${patchRes.status}): ${JSON.stringify(data)}` },
          { status: 500 }
        );
      }

      return NextResponse.json({ ok: true, action: "updated" });
    }

    const createRes = await fetch(`https://api.airtable.com/v0/${baseId}/${table}`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ records: [{ fields }] }),
    });

    if (!createRes.ok) {
      const data = await airtableJson(createRes);
      return NextResponse.json(
        { ok: false, error: `Airtable create error (${createRes.status}): ${JSON.stringify(data)}` },
        { status: 500 }
      );
    }

    return NextResponse.json({ ok: true, action: "created" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro inesperado.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
