const REGISTER = 'https://hinekorako.taumataarowai.govt.nz/publicregister/laboratories/';
const ORIGIN = new URL(REGISTER).origin;
const norm = (x) => x.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
let cached;
function attribute(html, name) { return html.match(new RegExp(name + '\\s*=\\s*["\x27]([^"\x27]+)', 'i'))?.[1]; }
export function parseRegisterRecords(body, checkedAt) {
    if (!Array.isArray(body.Records))
        throw Error('Official register returned no readable records.');
    return body.Records.map((r) => { const attrs = r.Attributes; const value = (key) => { const a = Array.isArray(attrs) ? attrs.find((a) => a.Name === key || a.Key === key) : attrs?.[key]; const v = a?.Value ?? a; return String(v?.DisplayValue ?? a?.DisplayValue ?? v?.Name ?? v?.Value ?? v ?? ''); }; return { id: r.Id || value('ta_publicregisterlaboratoryid'), name: value('ta_name'), city: value('ta_physicaladdresscity'), ianzStatus: value('ta_ianzstatus'), accreditationClass: value('ta_classofaccreditation'), checkedAt }; }).filter((r) => r.name && r.city);
}
export async function readOfficialLaboratories() {
    if (cached && Date.now() - cached.time < 5 * 60 * 1000)
        return cached.records;
    const cookies = new Map();
    async function portal(url, options = {}) { const u = new URL(url, ORIGIN); if (u.origin !== ORIGIN)
        throw Error('Unexpected register origin.'); const headers = new Headers(options.headers); headers.set('Accept', 'application/json,text/html'); if (cookies.size)
        headers.set('Cookie', Array.from(cookies).map(([k, v]) => k + '=' + v).join('; ')); const response = await fetch(u, { ...options, headers, redirect: 'manual', signal: AbortSignal.timeout(18000) }); for (const c of response.headers.getSetCookie?.() || []) {
        const pair = c.split(';')[0], i = pair.indexOf('=');
        if (i > 0)
            cookies.set(pair.slice(0, i), pair.slice(i + 1));
    } if (!response.ok)
        throw Error('Official register response ' + response.status); return response; }
    const page = await (await portal(REGISTER)).text();
    const endpoint = attribute(page, 'data-get-url'), encoded = attribute(page, 'data-view-layouts');
    if (!endpoint || !encoded)
        throw Error('Official register layout could not be read.');
    const layouts = JSON.parse(atob(encoded));
    const selected = attribute(page, 'data-selected-view');
    const layout = layouts.find((l) => l.Id === selected) || layouts[0];
    if (!layout?.Base64SecureConfiguration)
        throw Error('Register view configuration missing.');
    // Anonymous portal anti-forgery token: no sign-in or credential is required or stored.
    const tokenHtml = await (await portal('/_layout/tokenhtml')).text();
    const token = attribute(tokenHtml, 'value');
    if (!token)
        throw Error('Anonymous register request token unavailable.');
    const records = [];
    let config = layout.Base64SecureConfiguration;
    for (let pageNumber = 1; pageNumber <= 20; pageNumber++) {
        const response = await portal(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json; charset=utf-8', '__RequestVerificationToken': token, 'X-Requested-With': 'XMLHttpRequest', Referer: REGISTER }, body: JSON.stringify({ base64SecureConfiguration: config, page: pageNumber, pageSize: 100, timezoneOffset: 0, search: null, filter: null, metaFilter: null, customParameters: [] }) });
        const body = await response.json();
        const batch = parseRegisterRecords(body, new Date().toISOString());
        records.push(...batch);
        if (!body.MoreRecords && (!body.PageCount || pageNumber >= body.PageCount))
            break;
        if (pageNumber === 20)
            throw Error('Register pagination exceeded safety limit.');
        if (body.ViewConfiguration)
            config = body.ViewConfiguration;
    }
    if (!records.length)
        throw Error('No readable laboratory records returned.');
    cached = { time: Date.now(), records };
    return records;
}
export async function handleLaboratoryRegister(request) {
    const url = new URL(request.url), name = url.searchParams.get('name')?.trim() || '', branch = url.searchParams.get('branch')?.trim() || '';
    const checkedAt = new Date().toISOString();
    const respond = (body, status = 200) => Response.json(body, { status, headers: { 'Cache-Control': 'no-store' } });
    if ((name && !branch) || (!name && branch) || name.length > 180 || branch.length > 180)
        return respond({ error: 'Enter both the exact laboratory name and branch.' }, 400);
    try {
        const all = await readOfficialLaboratories();
        const records = name ? all.filter(r => norm(r.name) === norm(name) && norm(r.city) === norm(branch)) : all;
        return respond({ status: name ? (records.length ? 'matched' : 'unverified') : 'available', source: REGISTER, checkedAt, records, message: name ? (records.length ? 'Exact official name and city matched. Check IANZ status and class below. Test-specific methods, determinands and accreditation at the sample date remain unverified.' : 'No exact name and city match was returned. This does not establish that the laboratory is unaccredited. Check the official register.') : all.length + ' laboratory records read automatically from HineKōrako. Select the exact laboratory and city; test-specific scope requires separate evidence.' });
    }
    catch {
        return respond({ status: 'unverified', source: REGISTER, checkedAt, records: [], message: 'Live HineKōrako records are currently unavailable to this server. Retry or open the official register. No accreditation confirmation is issued when records cannot be read.' });
    }
}
