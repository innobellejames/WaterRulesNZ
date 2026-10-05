function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00Z");
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

const BASES = {
  wellington: "https://hilltop.gw.govt.nz/Data.hts",
  otago: "https://gisdata.orc.govt.nz/hilltop/Telemetry.hts",
};

const reply = (body, status = 200) =>
  Response.json(body, {
    status,
    headers: {
      "Cache-Control": status === 200 ? "public, max-age=300" : "no-store",
    },
  });

const decode = (s) =>
  String(s)
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&");

const tag = (s, t) => {
  const match = String(s).match(new RegExp(`<${t}(?: [^>]*)?>([\\s\\S]*?)</${t}>`));
  return match ? decode(match[1]) : "";
};

async function read(url) {
  const r = await fetch(url, { signal: AbortSignal.timeout(25000) });
  if (!r.ok) throw Error("The source is unavailable.");

  const s = await r.text();
  if (s.length > 6_000_000) {
    throw Error("The requested response is too large. Choose a shorter period.");
  }

  if (/^\s*(?:<!doctype\s+html|<html\b|<body\b)/i.test(s)) {
    throw Error("The provider returned a web page instead of rainfall data. Retry or open its official rainfall view.");
  }

  return s;
}

export async function handleRegionalRainfall(request) {
  const q = new URL(request.url).searchParams;
  const provider = q.get("provider") || "";
  const action = q.get("action") || "sites";
  const site = q.get("site") || "";

  if (!["wellington", "otago", "canterbury"].includes(provider) || !["sites", "series", "catalogue"].includes(action)) {
    return reply({ error: "Unknown rainfall source or request." }, 400);
  }

  if (action !== "sites" && (!site.trim() || site.length > 180 || /[<>\x00-\x1f]/.test(site))) {
    return reply({ error: "Choose a valid station." }, 400);
  }

  const retrievedAt = new Date().toISOString();

  try {
    if (provider === "canterbury") {
      const url = "https://gis.ecan.govt.nz/arcgis/rest/services/Public/WaterQualityandMonitoring/FeatureServer/0/query?where=1%3D1&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=SITE%2CLAST_SAMPLE&f=json";
      const raw = JSON.parse(await read(url));

      if (!raw.features) {
        throw Error("Canterbury returned no station data.");
      }

      const stations = raw.features
        .map((f) => f.attributes)
        .filter((f) => typeof f.SITE === "string");

      if (action === "sites") {
        return reply({ sites: stations.map((s) => ({ name: s.SITE })), retrievedAt, source: url });
      }

      const s = stations.find((station) => station.SITE === site);
      if (!s) {
        return reply({ error: "Station not found in the current Canterbury snapshot." }, 404);
      }

      return reply({
        site,
        retrievedAt,
        source: url,
        lastSample: s.LAST_SAMPLE,
        rows: [{ label: "Today (partial)", value: s.LAST_SAMPLE ?? null }],
      });
    }

    const base = BASES[provider];
    const params = new URLSearchParams({
      Service: "Hilltop",
      Request: action === "sites" ? "SiteList" : action === "catalogue" ? "Catalogue" : "GetData",
      Site: site,
    });

    if (action === "series") {
      const start = q.get("start") || "";
      const end = q.get("end") || "";

      if (!validDate(start) || !validDate(end) || start > end || start < "1900-01-01" || end > new Date().toISOString().slice(0, 10)) {
        return reply({ error: "Choose valid dates covering at most 366 days." }, 400);
      }

      params.set("Measurement", "Rainfall");
      params.set("From", start + "T00:00:00");
      params.set("To", end + "T23:59:59");
      params.set("Interval", "1 day");
      params.set("Method", "Total");
      params.set("ShowQuality", "Yes");
    }

    // Hilltop's older server does not decode '+' as a space in station names.
    const url = base + "?" + params.toString().replace(/\+/g, "%20");
    const xml = await read(url);
    const error = tag(xml, "Error");

    if (error) {
      return reply({ error: "The provider returned: " + error + ". Check the station's archive period or use the site list first." }, 400);
    }

    if (action === "sites") {
      const sites = [...new Set([...xml.matchAll(/<Site\b[^>]*Name="([^"]+)"/g)].map((m) => decode(m[1])))]
        .sort((a, b) => a.localeCompare(b));
      return reply({ sites, retrievedAt, source: url });
    }

    if (action === "catalogue") {
      const blocks = [...xml.matchAll(/<DataSource\b[^>]*Name="([^"]+)"[^>]*>([\s\S]*?)<\/DataSource>/g)];
      const b = blocks.find((match) => match[1] === "Rainfall");
      return reply({
        start: b ? tag(b[2], "From") : "",
        end: b ? tag(b[2], "To") : "",
        retrievedAt,
        source: url,
        site,
      });
    }

    const units = tag(xml, "Units");
    if (units !== "mm") {
      throw Error("The source did not identify rainfall in millimetres.");
    }

    const rows = [...xml.matchAll(/<E>([\s\S]*?)<\/E>/g)].map((m) => {
      const stamp = tag(m[1], "T");
      const valueText = tag(m[1], "Value");
      const value = Number.parseFloat(valueText || "");

      return {
        date: stamp ? stamp.slice(0, 10) : "",
        value: Number.isFinite(value) ? value : null,
      };
    }).filter((row) => row.date && row.value !== null);

    return reply({
      site,
      rows,
      units,
      retrievedAt,
      source: url,
      convention: "Provider-generated daily totals; time zone follows the source data.",
    });
  } catch (e) {
    return reply({
      error: e instanceof SyntaxError
        ? "The provider returned unreadable station data. Retry or open its official rainfall view."
        : e.message || "The source failed. Retry or open its official rainfall view.",
    }, e instanceof TypeError ? 502 : 400);
  }
}
