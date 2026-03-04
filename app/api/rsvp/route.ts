import { NextResponse } from "next/server";

type Attendance = "yes" | "no";

type LookupRequest = {
  step: "lookup";
  attendance: Attendance;
  name: string;
  email: string;
  phone: string;
  phoneDigits: string;
  isChild?: boolean; 
};

type SubmitRequest = {
  step: "submit";
  attendance: Attendance;
  name: string;
  email: string;
  phone: string;
  phoneDigits: string;

  groupId: string;
  groupName: string;

  members: Array<{
    guestId: string;
    name: string;
    attendance: Attendance;
  }>;
};

type FamilyLookupRequest = {
  step: "family_lookup";
  familyCode: string;
};

type FamilySubmitRequest = {
  step: "family_submit";
  familyCode: string;
  members: Array<{
    guestId: string;
    attendance: Attendance;
  }>;
};

// ✅ CORREÇÃO: union (|) em vez de intersection (&) e SEM Partial<...>
type RsvpRequest =
  | LookupRequest
  | SubmitRequest
  | FamilyLookupRequest
  | FamilySubmitRequest
  | {
      // fallback seguro (se vier payload antigo/bugado)
      step?: string;
      [k: string]: any;
    };

// ========================
// Airtable field names (EXATOS)
// ========================
const FIELD_FAMILY_CODE = "Código da família"; // <- EXATO (como na tua imagem)
const FIELD_GROUP_NAME = "Nome do Grupo";
const FIELD_GROUP_MEMBERS = "Membros";

const FIELD_GUEST_NAME = "Nome";
const FIELD_GUEST_EMAIL = "Email";
const FIELD_GUEST_TEL_DIGITS = "Tel_digits"; // ✅ EXATO como no Airtable
const FIELD_GUEST_GROUP = "Grupo";

const FIELD_RSVP_ANSWER = "Resposta";
const FIELD_RSVP_GUEST_LOOKUP = "Convidado"; // lookup (ícone lupa)
const FIELD_RSVP_GUEST_LINK = "Convidado-LINK"; // link (onde guardas o recordId)
const FIELD_OPEN_CHILD = "Criança ?"; // ✅ EXATO (com espaço)
// ========================
// Helpers
// ========================
type AirtableUpdateRecord = { id: string; fields: Record<string, any> };
type AirtableCreateRecord = { fields: Record<string, any> };

async function airtableBatchUpdate(args: {
  token: string;
  baseId: string;
  table: string;
  records: AirtableUpdateRecord[];
}): Promise<void> {
  const { token, baseId, table, records } = args;
  if (!records.length) return;

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;

  for (const batch of chunk(records)) {
    const r = await airtableFetchJson(
      url,
      {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: batch }),
      },
      token
    );

    if (!r.ok) throw new Error(`Airtable batch update error (${r.status}): ${JSON.stringify(r.data)}`);
  }
}

async function airtableBatchCreate(args: {
  token: string;
  baseId: string;
  table: string;
  records: AirtableCreateRecord[];
}): Promise<void> {
  const { token, baseId, table, records } = args;
  if (!records.length) return;

  const url = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;

  for (const batch of chunk(records)) {
    const r = await airtableFetchJson(
      url,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records: batch }),
      },
      token
    );

    if (!r.ok) throw new Error(`Airtable batch create error (${r.status}): ${JSON.stringify(r.data)}`);
  }
}
const AIRTABLE_BATCH_LIMIT = 10;

function chunk<T>(arr: T[], size = AIRTABLE_BATCH_LIMIT): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

async function listAllByFormula(args: {
  token: string;
  baseId: string;
  table: string;
  formula: string;
  pageSize?: number;
}): Promise<AirtableRecord[]> {
  const { token, baseId, table, formula, pageSize = 100 } = args;

  const baseUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(table)}`;
  const records: AirtableRecord[] = [];
  let offset: string | undefined;

  while (true) {
    const url =
      `${baseUrl}?pageSize=${pageSize}&filterByFormula=${encodeURIComponent(formula)}` +
      (offset ? `&offset=${encodeURIComponent(offset)}` : "");

    const r = await airtableFetchJson(url, { method: "GET" }, token);
    if (!r.ok) throw new Error(`Airtable list error (${r.status}): ${JSON.stringify(r.data)}`);

    const page: AirtableRecord[] = Array.isArray(r.data?.records) ? r.data.records : [];
    records.push(...page);

    offset = r.data?.offset;
    if (!offset) break;
  }

  return records;
}

async function findRsvpsByFamilyCode(args: {
  token: string;
  baseId: string;
  rsvpTable: string;
  familyCode: string;
}): Promise<AirtableRecord[]> {
  const { token, baseId, rsvpTable, familyCode } = args;
  const code = escapeAirtableString(normFamilyCode(familyCode));

  // mesmo critério que já usas, só que agora 1 vez
  const formula = `UPPER(ARRAYJOIN({${FIELD_FAMILY_CODE}}))='${code}'`;

  return listAllByFormula({ token, baseId, table: rsvpTable, formula });
}

function indexRsvpsByGuestId(rsvps: AirtableRecord[]): Map<string, AirtableRecord[]> {
  const map = new Map<string, AirtableRecord[]>();

  for (const r of rsvps) {
    const ids = r.fields?.[FIELD_RSVP_GUEST_LINK];
    const guestId = Array.isArray(ids) ? String(ids[0] || "") : "";
    if (!guestId) continue;

    const arr = map.get(guestId) ?? [];
    arr.push(r);
    map.set(guestId, arr);
  }

  // opcional: ordena para “latest first”
  for (const [k, arr] of map.entries()) {
    arr.sort((a, b) => new Date(b.createdTime || 0).getTime() - new Date(a.createdTime || 0).getTime());
    map.set(k, arr);
  }

  return map;
}
function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

function isValidEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v.trim());
}

function escapeAirtableString(v: string): string {
  return String(v).replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

function normEmail(v: string): string {
  return v.trim().toLowerCase();
}
function digitsOnly(v: string): string {
  return String(v ?? "").replace(/\D/g, "");
}

async function findGuestByTelDigits(args: {
  token: string;
  baseId: string;
  guestsTable: string;
  phoneLocalDigits: string; // ex: 935163201
  phoneFullDigits?: string; // ex: 351935163201
}): Promise<AirtableRecord | null> {
  const { token, baseId, guestsTable, phoneLocalDigits, phoneFullDigits } = args;

  const local = escapeAirtableString(phoneLocalDigits);
  const full = phoneFullDigits ? escapeAirtableString(phoneFullDigits) : "";

  // Força comparação como texto (mesmo se Tel_digits for número)
  const f = `{${FIELD_GUEST_TEL_DIGITS}} & ''`;

  const formula = full
    ? `OR((${f})='${local}', (${f})='${full}')`
    : `(${f})='${local}'`;

  const url =
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(guestsTable)}` +
    `?maxRecords=2&filterByFormula=${encodeURIComponent(formula)}`;

  const r = await airtableFetchJson(url, { method: "GET" }, token);
  if (!r.ok) throw new Error(`Airtable tel_digits search error (${r.status}): ${JSON.stringify(r.data)}`);

  const records: AirtableRecord[] = Array.isArray(r.data?.records) ? r.data.records : [];

  // Se der mais de 1 match, telemóvel duplicado → não arrisca
  if (records.length > 1) {
    throw new Error("Encontrámos mais do que um convidado com este número. Contacta os noivos.");
  }

  return records[0] ?? null;
}

function normFamilyCode(v: string): string {
  return v.trim().toUpperCase();
}

function tokenShort(): string {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const rand = () => Math.floor(Math.random() * 16).toString(16).toUpperCase();
  let t = "P";
  for (let i = 0; i < 9; i++) t += rand();
  const idx = 1 + Math.floor(Math.random() * (t.length - 1));
  t =
    t.slice(0, idx) +
    letters[Math.floor(Math.random() * letters.length)] +
    t.slice(idx + 1);
  return t.slice(0, 10);
}

async function airtableJson(res: Response): Promise<any> {
  const text = await res.text().catch(() => "");
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { raw: text };
  }
}

async function airtableFetchJson(
  url: string,
  init: RequestInit,
  token: string
): Promise<{ ok: boolean; status: number; data: any }> {
  const res = await fetch(url, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.headers || {}),
    },
  });
  const data = await airtableJson(res);
  return { ok: res.ok, status: res.status, data };
}

type AirtableRecord = {
  id: string;
  fields: Record<string, any>;
  createdTime?: string;
};

function respostaToAttendance(v: any): Attendance | null {
  const s = String(v ?? "").toLowerCase().trim();
  if (s === "sim") return "yes";
  if (s === "não" || s === "nao") return "no";
  return null;
}

function guestNameFromRecord(r: AirtableRecord): string {
  const f = r.fields || {};
  return String(f[FIELD_GUEST_NAME] || f["Name"] || f["nome"] || "").trim();
}

// ========================
// Guests: achar por email
// ========================
async function findGuestByEmail(args: {
  token: string;
  baseId: string;
  guestsTable: string;
  emailKey: string;
}): Promise<AirtableRecord | null> {
  const { token, baseId, guestsTable, emailKey } = args;

  const formula = `LOWER({${FIELD_GUEST_EMAIL}})='${escapeAirtableString(emailKey)}'`;
  const url =
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(guestsTable)}` +
    `?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;

  const r = await airtableFetchJson(url, { method: "GET" }, token);
  if (!r.ok) {
    throw new Error(
      `Airtable guest search error (${r.status}): ${JSON.stringify(r.data)}`
    );
  }

  return (r.data?.records?.[0] as AirtableRecord | undefined) ?? null;
}

// ========================
// Grupos: ler + membros
// ========================
async function getGroupAndMembers(args: {
  token: string;
  baseId: string;
  groupsTable: string;
  guestsTable: string;
  groupId: string;
}): Promise<{
  groupName: string;
  familyCode: string;
  memberIds: string[];
  members: AirtableRecord[];
}> {
  const { token, baseId, groupsTable, guestsTable, groupId } = args;

  const gUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
    groupsTable
  )}/${groupId}`;
  const gRes = await airtableFetchJson(gUrl, { method: "GET" }, token);
  if (!gRes.ok) {
    throw new Error(
      `Airtable group read error (${gRes.status}): ${JSON.stringify(gRes.data)}`
    );
  }

  const gFields = gRes.data?.fields || {};
  const groupName = String(
    gFields[FIELD_GROUP_NAME] || gFields["Name"] || gFields["Nome"] || "Grupo"
  ).trim();

  const familyCode = String(gFields[FIELD_FAMILY_CODE] || "").trim();

  const memberIds: string[] = Array.isArray(gFields[FIELD_GROUP_MEMBERS])
    ? gFields[FIELD_GROUP_MEMBERS]
    : [];
  if (!memberIds.length) return { groupName, familyCode, memberIds: [], members: [] };

  const or = memberIds
    .map((id) => `RECORD_ID()='${escapeAirtableString(id)}'`)
    .join(",");
  const formula = `OR(${or})`;

  const mUrl =
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(guestsTable)}` +
    `?pageSize=100&filterByFormula=${encodeURIComponent(formula)}`;

  const mRes = await airtableFetchJson(mUrl, { method: "GET" }, token);
  if (!mRes.ok) {
    throw new Error(
      `Airtable members read error (${mRes.status}): ${JSON.stringify(mRes.data)}`
    );
  }

  const members: AirtableRecord[] = Array.isArray(mRes.data?.records)
    ? mRes.data.records
    : [];
  return { groupName, familyCode, memberIds, members };
}

async function findGroupByFamilyCode(args: {
  token: string;
  baseId: string;
  groupsTable: string;
  familyCode: string;
}): Promise<AirtableRecord | null> {
  const { token, baseId, groupsTable, familyCode } = args;

  const codeUpper = escapeAirtableString(normFamilyCode(familyCode));
  const formula = `UPPER({${FIELD_FAMILY_CODE}})='${codeUpper}'`;

  const url =
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(groupsTable)}` +
    `?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;

  const r = await airtableFetchJson(url, { method: "GET" }, token);
  if (!r.ok) {
    throw new Error(
      `Airtable group search error (${r.status}): ${JSON.stringify(r.data)}`
    );
  }

  return (r.data?.records?.[0] as AirtableRecord | undefined) ?? null;
}

// ========================
// RSVP: procurar por (Código da família + Convidado)
// ========================
async function findRsvpsByFamilyAndGuestName(args: {
  token: string;
  baseId: string;
  rsvpTable: string;
  familyCode: string;
  guestName: string;
}): Promise<AirtableRecord[]> {
  const { token, baseId, rsvpTable, familyCode, guestName } = args;

  const code = escapeAirtableString(normFamilyCode(familyCode));
  const name = escapeAirtableString(guestName.trim());

  const formula =
    `AND(` +
    `UPPER(ARRAYJOIN({${FIELD_FAMILY_CODE}}))='${code}',` +
    `ARRAYJOIN({${FIELD_RSVP_GUEST_LOOKUP}})='${name}'` +
    `)`;

  const url =
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(rsvpTable)}` +
    `?pageSize=10&filterByFormula=${encodeURIComponent(formula)}`;

  const r = await airtableFetchJson(url, { method: "GET" }, token);
  if (!r.ok) {
    throw new Error(
      `Airtable rsvp search error (${r.status}): ${JSON.stringify(r.data)}`
    );
  }

  return Array.isArray(r.data?.records) ? (r.data.records as AirtableRecord[]) : [];
}

function pickLatestByCreatedTime(records: AirtableRecord[]): AirtableRecord | null {
  if (!records.length) return null;
  return records
    .slice()
    .sort(
      (a, b) =>
        new Date(b.createdTime || 0).getTime() - new Date(a.createdTime || 0).getTime()
    )[0]!;
}

async function upsertRsvpByGuest(args: {
  token: string;
  baseId: string;
  rsvpTable: string;

  guestId: string; // usado no CREATE (link)
  guestName: string;
  familyCode: string;

  attendance: Attendance;

  emailRaw?: string;
  phone?: string;
  tokenValue?: string;
}): Promise<"created" | "updated"> {
  const {
    token,
    baseId,
    rsvpTable,
    guestId,
    guestName,
    familyCode,
    attendance,
    emailRaw,
    phone,
    tokenValue,
  } = args;

  const resposta = attendance === "yes" ? "Sim" : "Não";

  const matches = await findRsvpsByFamilyAndGuestName({
    token,
    baseId,
    rsvpTable,
    familyCode,
    guestName,
  });

  if (matches.length) {
    const fields: Record<string, any> = { [FIELD_RSVP_ANSWER]: resposta };
    if (emailRaw) fields["Email digitado"] = emailRaw;
    if (phone) fields["Telefone digitado"] = phone;
    if (tokenValue) fields["Token"] = tokenValue;

    for (const rec of matches) {
      const patchUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(
        rsvpTable
      )}/${rec.id}`;
      const patch = await airtableFetchJson(
        patchUrl,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fields }),
        },
        token
      );
      if (!patch.ok) {
        throw new Error(
          `Airtable rsvp update error (${patch.status}): ${JSON.stringify(patch.data)}`
        );
      }
    }

    return "updated";
  }

  const fields: Record<string, any> = {
    [FIELD_RSVP_ANSWER]: resposta,
    [FIELD_RSVP_GUEST_LINK]: [guestId],
  };
  if (emailRaw) fields["Email digitado"] = emailRaw;
  if (phone) fields["Telefone digitado"] = phone;
  if (tokenValue) fields["Token"] = tokenValue;

  const createUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(rsvpTable)}`;
  const create = await airtableFetchJson(
    createUrl,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ records: [{ fields }] }),
    },
    token
  );
  if (!create.ok) {
    throw new Error(
      `Airtable rsvp create error (${create.status}): ${JSON.stringify(create.data)}`
    );
  }

  return "created";
}

// ========================
// RSVP Livres
// ========================
async function upsertOpenRsvp(args: {
  token: string;
  baseId: string;
  openTable: string;
  name: string;
  emailRaw: string;
  emailKey: string;
  phone: string;
  attendance: Attendance;
  tokenValue: string;
  isChild?: boolean;
}): Promise<"created" | "updated"> {
  const { token, baseId, openTable, name, emailRaw, emailKey, phone, attendance, tokenValue } = args;

  const formula = `LOWER({Email digitado})='${escapeAirtableString(emailKey)}'`;
  const searchUrl =
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(openTable)}` +
    `?maxRecords=1&filterByFormula=${encodeURIComponent(formula)}`;

  const find = await airtableFetchJson(searchUrl, { method: "GET" }, token);
  if (!find.ok) throw new Error(`Airtable open search error (${find.status}): ${JSON.stringify(find.data)}`);

  const recordId = find.data?.records?.[0]?.id as string | undefined;

const fields = {
  Nome: name,
  "Email digitado": emailRaw,
  "Telefone digitado": phone,
  Resposta: attendance === "yes" ? "Sim" : "Não",
  Token: tokenValue,

  [FIELD_OPEN_CHILD]: Boolean(args.isChild), 
};

  if (recordId) {
    const patchUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(openTable)}/${recordId}`;
    const patch = await airtableFetchJson(
      patchUrl,
      { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fields }) },
      token
    );
    if (!patch.ok) throw new Error(`Airtable open update error (${patch.status}): ${JSON.stringify(patch.data)}`);
    return "updated";
  }

  const createUrl = `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(openTable)}`;
  const create = await airtableFetchJson(
    createUrl,
    { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ records: [{ fields }] }) },
    token
  );
  if (!create.ok) throw new Error(`Airtable open create error (${create.status}): ${JSON.stringify(create.data)}`);
  return "created";
}

// ========================
// POST handler
// ========================
export async function POST(req: Request) {
  try {
    // ✅ CORREÇÃO: não forces TS aqui (evita "never" no build)
    const bodyUnknown = (await req.json()) as unknown;
    const body = (bodyUnknown ?? {}) as any as RsvpRequest;

    const step = typeof (body as any)?.step === "string" ? String((body as any).step).trim() : "lookup";

    const token = requiredEnv("AIRTABLE_TOKEN");
    const baseId = requiredEnv("AIRTABLE_BASE_ID");

    const guestsTable = requiredEnv("AIRTABLE_GUESTS_TABLE");
    const groupsTable = requiredEnv("AIRTABLE_GROUPS_TABLE");
    const rsvpTable = requiredEnv("AIRTABLE_RSVP_TABLE");
    const openTable = requiredEnv("AIRTABLE_OPEN_RSVP_TABLE");

    // =========================
    // 1) Fluxo por Código da família
    // =========================
    if (step === "family_lookup") {
      const familyCode = normFamilyCode(String((body as any).familyCode || ""));
      if (!familyCode) {
        return NextResponse.json({ ok: false, error: "Código de família é obrigatório." }, { status: 400 });
      }

      const groupRec = await findGroupByFamilyCode({ token, baseId, groupsTable, familyCode });
      if (!groupRec) {
        return NextResponse.json({ ok: false, error: "Código inválido ou grupo não encontrado." }, { status: 404 });
      }

      const groupId = groupRec.id;
      const { groupName, familyCode: codeFromGroup, members } = await getGroupAndMembers({
        token,
        baseId,
        groupsTable,
        guestsTable,
        groupId,
      });

      const familyKey = (codeFromGroup || familyCode).trim();
const allRsvps = await findRsvpsByFamilyCode({ token, baseId, rsvpTable, familyCode: familyKey });
const rsvpByGuestId = indexRsvpsByGuestId(allRsvps);
      const outMembers: any[] = [];
      for (const r of members) {
        const f = r.fields || {};
        const name = String(f[FIELD_GUEST_NAME] || f["Name"] || "").trim();
        if (!name) continue;

        const role = String(f["Papel na família"] || "").trim();
        const isChild = Boolean(f["Criança?"] || false);

 const list = rsvpByGuestId.get(r.id) ?? [];
const latest = list[0] ?? null;
const current = respostaToAttendance(latest?.fields?.[FIELD_RSVP_ANSWER]);

        outMembers.push({
          guestId: r.id,
          name,
          role,
          isChild,
          attendance: current ?? "no",
        });
      }

      return NextResponse.json({
        ok: true,
        mode: "family",
        group: { id: groupId, name: groupName, code: familyKey },
        members: outMembers,
      });
    }

    if (step === "family_submit") {
      const familyCode = normFamilyCode(String((body as any).familyCode || ""));
      const membersReq = Array.isArray((body as any).members) ? (body as any).members : [];

      if (!familyCode) return NextResponse.json({ ok: false, error: "Código de família é obrigatório." }, { status: 400 });
      if (!membersReq.length) return NextResponse.json({ ok: false, error: "members em falta." }, { status: 400 });

      const groupRec = await findGroupByFamilyCode({ token, baseId, groupsTable, familyCode });
      if (!groupRec) return NextResponse.json({ ok: false, error: "Código inválido ou grupo não encontrado." }, { status: 404 });

      const groupId = groupRec.id;

      const groupData = await getGroupAndMembers({
        token,
        baseId,
        groupsTable,
        guestsTable,
        groupId,
      });

      const familyKey = (groupData.familyCode || familyCode).trim();
const allRsvps = await findRsvpsByFamilyCode({ token, baseId, rsvpTable, familyCode: familyKey });
const rsvpByGuestId = indexRsvpsByGuestId(allRsvps);
    
    

      const updates: AirtableUpdateRecord[] = [];
const creates: AirtableCreateRecord[] = [];

for (const m of membersReq) {
  const guestId = String(m.guestId || "").trim();
  if (!guestId) continue;

  if (groupData.memberIds.length && !groupData.memberIds.includes(guestId)) continue;

  const a: Attendance = m.attendance === "no" ? "no" : "yes";
  const resposta = a === "yes" ? "Sim" : "Não";

  const existing = rsvpByGuestId.get(guestId) ?? [];

  if (existing.length) {
    // mantém o teu comportamento: atualiza TODOS os existentes desse convidado
    for (const rec of existing) {
      updates.push({ id: rec.id, fields: { [FIELD_RSVP_ANSWER]: resposta } });
    }
  } else {
    creates.push({
      fields: {
        [FIELD_RSVP_ANSWER]: resposta,
        [FIELD_RSVP_GUEST_LINK]: [guestId],
      },
    });
  }
}

await airtableBatchUpdate({ token, baseId, table: rsvpTable, records: updates });
await airtableBatchCreate({ token, baseId, table: rsvpTable, records: creates });

const anyUpdated = updates.length > 0;
const anyCreated = creates.length > 0;

      return NextResponse.json({
        ok: true,
        mode: "done",
        bucket: "group",
        action: anyUpdated ? "updated" : anyCreated ? "created" : "updated",
        familyCode: familyKey,
        group: { id: groupId, name: groupData.groupName },
      });
    }

    // =========================
    // 2) Fluxo normal (lookup/submit)
    // =========================
    const name = String((body as any).name || "").trim();
    const emailRaw = String((body as any).email || "").trim();
    const phone = String((body as any).phone || "").trim();
    const phoneDigits = String((body as any).phoneDigits || "").trim();
    const attendance = (body as any).attendance as Attendance;

    if (name.length < 2) return NextResponse.json({ ok: false, error: "Nome é obrigatório." }, { status: 400 });
    if (!emailRaw) return NextResponse.json({ ok: false, error: "Email é obrigatório." }, { status: 400 });
    if (!isValidEmail(emailRaw)) return NextResponse.json({ ok: false, error: "Email inválido." }, { status: 400 });
    if (!phone) return NextResponse.json({ ok: false, error: "Telemóvel é obrigatório." }, { status: 400 });
    if (attendance !== "yes" && attendance !== "no")
      return NextResponse.json({ ok: false, error: "Resposta inválida." }, { status: 400 });

    const emailKey = normEmail(emailRaw);

    if (step === "submit") {
      const groupId = String((body as any).groupId || "").trim();
      const groupName = String((body as any).groupName || "").trim();
      const members = Array.isArray((body as any).members) ? (body as any).members : [];

      if (!groupId) return NextResponse.json({ ok: false, error: "groupId em falta." }, { status: 400 });
      if (!groupName) return NextResponse.json({ ok: false, error: "groupName em falta." }, { status: 400 });
      if (!members.length) return NextResponse.json({ ok: false, error: "members em falta." }, { status: 400 });

      const groupInfo = await getGroupAndMembers({ token, baseId, groupsTable, guestsTable, groupId });
      const familyKey = (groupInfo.familyCode || "").trim();
      const t = tokenShort();

      let anyUpdated = false;
      let anyCreated = false;

      for (const m of members) {
        const guestId = String(m.guestId || "").trim();
        const guestName = String(m.name || "").trim();
        const a: Attendance = m.attendance === "no" ? "no" : "yes";
        if (!guestId || !guestName || !familyKey) continue;

        const action = await upsertRsvpByGuest({
          token,
          baseId,
          rsvpTable,
          guestId,
          guestName,
          familyCode: familyKey,
          attendance: a,
          emailRaw,
          phone,
          tokenValue: t,
        });

        if (action === "updated") anyUpdated = true;
        if (action === "created") anyCreated = true;
      }

      return NextResponse.json({
        ok: true,
        mode: "done",
        bucket: "group",
        action: anyUpdated ? "updated" : anyCreated ? "created" : "updated",
        familyCode: familyKey,
        token: t,
      });
    }

  let guest = await findGuestByEmail({ token, baseId, guestsTable, emailKey });

const isChild = Boolean((body as any).isChild);

// ✅ fallback por telefone (Tel_digits)
if (!guest) {
  const phoneLocalDigits = digitsOnly(phoneDigits); // vem do UI (9/11/etc)
  const dialDigits = digitsOnly(String((body as any).dial || "")); // "+351" -> "351"
  const phoneFullDigits = dialDigits && phoneLocalDigits ? `${dialDigits}${phoneLocalDigits}` : "";

  if (phoneLocalDigits.length >= 6) {
    guest = await findGuestByTelDigits({
      token,
      baseId,
      guestsTable,
      phoneLocalDigits,
      phoneFullDigits: phoneFullDigits || undefined,
    });
  }
}
    if (!guest) {
      const t = tokenShort();
   const action = await upsertOpenRsvp({
        token,
        baseId,
        openTable,
        name,
        emailRaw,
        emailKey,
        phone,
        attendance,
        tokenValue: t,
        isChild,
      });

      return NextResponse.json({ ok: true, mode: "done", bucket: "open", action, token: t });
    }

    const gIds: string[] = Array.isArray(guest.fields?.[FIELD_GUEST_GROUP]) ? guest.fields[FIELD_GUEST_GROUP] : [];
    const groupId = gIds[0] || "";

    if (!groupId) {
      const t = tokenShort();
      const action = await upsertOpenRsvp({
        token,
        baseId,
        openTable,
        name,
        emailRaw,
        emailKey,
        phone,
        attendance,
        tokenValue: t,
        isChild,
      });

      return NextResponse.json({ ok: true, mode: "done", bucket: "open", action, token: t });
    }

    const group = await getGroupAndMembers({ token, baseId, groupsTable, guestsTable, groupId });
    const familyKey = (group.familyCode || "").trim();

    if (group.members.length <= 1) {
      const t = tokenShort();
      const guestName = guestNameFromRecord(guest);

      if (!guestName || !familyKey) {
        const action = await upsertOpenRsvp({
        token,
        baseId,
        openTable,
        name,
        emailRaw,
        emailKey,
        phone,
        attendance,
        tokenValue: t,
        isChild,
      });
        return NextResponse.json({ ok: true, mode: "done", bucket: "open", action, token: t });
      }

      const action = await upsertRsvpByGuest({
        token,
        baseId,
        rsvpTable,
        guestId: guest.id,
        guestName,
        familyCode: familyKey,
        attendance,
        emailRaw,
        phone,
        tokenValue: t,
      });

      return NextResponse.json({
        ok: true,
        mode: "done",
        bucket: "group",
        action,
        familyCode: familyKey,
        token: t,
      });
    }

    const members = group.members
      .map((r) => {
        const f = r.fields || {};
        const n = String(f[FIELD_GUEST_NAME] || f["Name"] || "").trim();
        const role = String(f["Papel na família"] || "").trim();
        const isChild = Boolean(f["Criança?"] || false);
        if (!n) return null;
        return { guestId: r.id, name: n, role, isChild };
      })
      .filter(Boolean);

    return NextResponse.json({
      ok: true,
      mode: "group",
      group: { id: groupId, name: group.groupName, code: familyKey },
      members,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Erro inesperado.";
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
