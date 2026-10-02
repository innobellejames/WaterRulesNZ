function validDate(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false; const date = new Date(value + "T00:00:00Z"); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; }
const BASES = { wellington: "https://hilltop.gw.govt.nz/Data.hts", otago: "https://gisdata.orc.govt.nz/hilltop/Telemetry.hts" };
const reply = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": status === 200 ? "public, max-age=300" : "no-store" } });
const decode = (s) => s.replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&");
const tag = (s, t) => decode(s.match(new RegExp(`<${t}(?: [^>]*)?>([\\s\\S]*?)</${t}>`))?.[1] || "");
async function read(url) { const r = await fetch(url, { signal: AbortSignal.timeout(25000) }); if (!r.ok)
    throw Error("The source is unavailable."); const s = await r.text(); if (s.length > 6_000_000)
    throw Error("The requested response is too large. Choose a shorter period."); if (/^\s*(?:<!doctype\s+html|<html\b)/i.test(s) || r.headers.get("content-type")?.includes("text/html"))
    throw Error("The provider returned a web page instead of rainfall data. Retry or open its official rainfall view."); return s; }
export async function handleRegionalRainfall(request) {
    const q = new URL(request.url).searchParams, provider = q.get("provider") || "", action = q.get("action") || "sites", site = q.get("site") || "";
    if (!["wellington", "otago", "canterbury"].includes(provider) || !["sites", "series", "catalogue"].includes(action))
        return reply({ error: "Unknown rainfall source or request." }, 400);
    if (action !== "sites" && (!site.trim() || site.length > 180 || /[<>\x00-\x1f]/.test(site)))
        return reply({ error: "Choose a valid station." }, 400);
    const retrievedAt = new Date().toISOString();
    try {
        if (provider === "canterbury") {
            const url = "https://gis.ecan.govt.nz/arcgis/rest/services/Public/WaterQualityandMonitoring/FeatureServer/5/query?" + new URLSearchParams({ f: "json", where: "1=1", outFields: "SITE,SITENAME,LAST_SAMPLE,LAST_HOUR,RAIN_TODAY,RAIN_1_DAY_AGO,RAIN_2_DAYS_AGO,RAIN_3_DAYS_AGO,RAIN_4_DAYS_AGO,RAIN_5_DAYS_AGO,RAIN_6_DAYS_AGO,RAIN_7_DAYS_AGO", returnGeometry: "false" });
            const raw = JSON.parse(await read(url));
            if (!raw.features)
                throw Error("Canterbury returned no station data.");
            const stations = raw.features.map(f => f.attributes).filter(f => typeof f.SITE === "string");
            if (action === "sites")
                return reply({ sites: stations.map(s => ({ name: s.SITE })), retrievedAt, source: url });
            const s = stations.find(s => s.SITE === site);
            if (!s)
                return reply({ error: "Station not found in the current Canterbury snapshot." }, 404);
            return reply({ site, retrievedAt, source: url, lastSample: s.LAST_SAMPLE, rows: [{ label: "Today (partial)", value: s.RAIN_TODAY }, { label: "1 day ago", value: s.RAIN_1_DAY_AGO }, ...Array.from({ length: 6 }, (_, i) => ({ label: `${i + 2} days ago`, value: s[`RAIN_${i + 2}_DAYS_AGO`] }))], lastHour: s.LAST_HOUR, convention: "Rolling periods as labelled by Environment Canterbury. They are not assigned calendar dates here; an old last-sample timestamp may indicate a stale gauge. Today may be incomplete." });
        }
        const base = BASES[provider];
        const params = new URLSearchParams({ Service: "Hilltop", Request: action === "sites" ? "SiteList" : action === "catalogue" ? "MeasurementList" : "GetData", ...(action === "sites" ? { Measurement: "Rainfall" } : { Site: site }) });
        if (action === "series") {
            const start = q.get("start") || "", end = q.get("end") || "";
            if (!validDate(start) || !validDate(end) || start > end || start < "1900-01-01" || end > new Date(Date.now() + 86400000).toISOString().slice(0, 10) || Date.parse(end) - Date.parse(start) > 366 * 86400000)
                return reply({ error: "Choose valid dates covering at most 366 days." }, 400);
            params.set("Measurement", "Rainfall");
            params.set("From", start + "T00:00:00");
            params.set("To", end + "T23:59:59");
            params.set("Interval", "1 day");
            params.set("Method", "Total");
            params.set("ShowQuality", "Yes");
        }
        // Hilltop's older server does not decode '+' as a space in station names.
        const url = base + "?" + params.toString().replace(/\+/g, "%20"), xml = await read(url);
        const error = tag(xml, "Error");
        if (error)
            return reply({ error: "The provider returned: " + error + ". Check the station's archive period or use the current official rainfall view." }, 422);
        if (action === "sites")
            return reply({ sites: [...new Set([...xml.matchAll(/<Site\b[^>]*Name="([^"]+)"/g)].map(m => decode(m[1])))].map(name => ({ name })), retrievedAt, source: url });
        if (action === "catalogue") {
            const blocks = [...xml.matchAll(/<DataSource\b[^>]*Name="([^"]+)"[^>]*>([\s\S]*?)<\/DataSource>/g)];
            const b = blocks.find(b => b[1] === "Rainfall");
            return reply({ start: b ? tag(b[2], "From") : "", end: b ? tag(b[2], "To") : "", retrievedAt, source: url });
        }
        const units = tag(xml, "Units");
        if (units !== "mm")
            throw Error("The source did not identify rainfall in millimetres.");
        const rows = [...xml.matchAll(/<E>([\s\S]*?)<\/E>/g)].map(m => { const stamp = tag(m[1], "T"), raw = tag(m[1], "I1"); const number = raw.trim() ? Number(raw) : NaN; return { date: stamp.slice(0, 10), label: stamp.replace("T", " "), value: Number.isFinite(number) && number >= 0 ? number : null, quality: tag(m[1], "Q1") || tag(m[1], "Q") || "Not supplied" }; }).filter(r => /^\d{4}-\d{2}-\d{2}$/.test(r.date));
        return reply({ site, rows, units, retrievedAt, source: url, convention: `Provider-generated daily totals; timestamps and interval labels are retained from ${provider === "otago" ? "ORC Hilltop (NZST, UTC+12; no daylight-saving adjustment)" : "Greater Wellington Hilltop"}. Confirm the interval boundaries and quality with the provider before comparing other daily datasets. Missing intervals are not zero.` });
    }
    catch (e) {
        return reply({ error: e instanceof SyntaxError ? "The provider returned unreadable station data. Retry or open its official rainfall view." : e.message || "The rainfall source could not be loaded. Retry or open its official data view." }, 502);
    }
}
