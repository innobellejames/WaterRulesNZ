function validDate(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false; const date = new Date(value + "T00:00:00Z"); return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value; }
const BASE = "https://envdata.es.govt.nz/services/";
const json = (body, status = 200) => Response.json(body, { status, headers: { "Cache-Control": status === 200 ? "public, max-age=300" : "no-store" } });
export async function handleRainfall(request) {
    const q = new URL(request.url).searchParams, action = q.get("action") || "sites", site = q.get("site") || "";
    if (!["sites", "recent", "history", "catalogue"].includes(action))
        return json({ error: "Unknown rainfall request." }, 400);
    if (action !== "sites" && (!site.trim() || site.length > 140 || /[<>\x00-\x1f]/.test(site)))
        return json({ error: "Choose a rainfall station." }, 400);
    let path = "sites.ashx", params = new URLSearchParams({ f: "rainfall.xml" });
    if (action === "recent") {
        const interval = q.get("interval") || "30";
        if (!["7", "30", "60", "90", "180", "365"].includes(interval))
            return json({ error: "Unsupported period." }, 400);
        path = "data.ashx";
        params = new URLSearchParams({ s: site, m: "Rainfall", i: interval });
    }
    if (action === "catalogue") {
        path = "catalogue.ashx";
        params = new URLSearchParams({ site, measurement: "Rainfall" });
    }
    if (action === "history") {
        const start = q.get("start") || "", end = q.get("end") || "";
        if (!validDate(start) || !validDate(end) || start > end || start < "1900-01-01" || end > new Date(Date.now() + 86400000).toISOString().slice(0, 10))
            return json({ error: "Enter a valid historical date range." }, 400);
        const fmt = (s) => s.split("-").reverse().join("-");
        path = "historical.ashx";
        params = new URLSearchParams({ site, measurement: "Rainfall", start: fmt(start), end: fmt(end), w: "1100", h: "480", mode: "1", b64: "1" });
    }
    try {
        const response = await fetch(BASE + path + "?" + params, { signal: AbortSignal.timeout(30000), headers: { Accept: "application/json,text/plain" } });
        if (!response.ok)
            throw new Error("Rainfall source unavailable");
        const body = await response.text();
        if (body.length > 8_000_000)
            throw new Error("Rainfall response too large");
        if (action === "history") {
            if (!/^R0lGOD[dh][A-Za-z0-9+/=\r\n]*$/.test(body.trim()))
                return json({ error: "The source returned no historical graph for this station and date range. Try another range or open Environment Southland." }, 422);
            return json({ image: "data:image/gif;base64," + body.trim(), site, start: q.get("start"), end: q.get("end"), retrievedAt: new Date().toISOString(), source: "https://envdata.es.govt.nz/" });
        }
        const data = JSON.parse(body);
        if (action === "sites" && !Array.isArray(data.sites) || action === "recent" && !Array.isArray(data.data))
            throw new Error("Invalid rainfall source response");
        return json({ data, retrievedAt: new Date().toISOString(), source: "https://envdata.es.govt.nz/" });
    }
    catch {
        return json({ error: "Environment Southland rainfall data could not be loaded. Please retry or open the official portal." }, 502);
    }
}
