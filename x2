<!DOCTYPE html PUBLIC "-//W3C//DTD HTML 4.01//EN" "http://www.w3.org/TR/html4/strict.dtd">
<html>
<head>
  <meta http-equiv="Content-Type" content="text/html; charset=utf-8">
  <meta http-equiv="Content-Style-Type" content="text/css">
  <title></title>
  <meta name="Description" content="Explore New Zealand drinking water supplier requirements with linked official sources.">
  <meta name="Generator" content="Cocoa HTML Writer">
  <meta name="CocoaVersion" content="2299.77">
  <style type="text/css">
    p.p1 {margin: 0.0px 0.0px 0.0px 0.0px; font: 12.0px Times; -webkit-text-stroke: #000000}
    span.s1 {font-kerning: none}
  </style>
</head>
<body>
<p class="p1"><span class="s1">function validDate(value) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value))</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>return false; const date = new Date(value + "T00:00:00Z"); return Number.isFinite(date.getTime()) &amp;&amp; date.toISOString().slice(0, 10) === value; }</span></p>
<p class="p1"><span class="s1">const BASES = { wellington: "https://hilltop.gw.govt.nz/Data.hts", otago: "https://gisdata.orc.govt.nz/hilltop/Telemetry.hts" };</span></p>
<p class="p1"><span class="s1">const reply = (body, status = 200) =&gt; Response.json(body, { status, headers: { "Cache-Control": status === 200 ? "public, max-age=300" : "no-store" } });</span></p>
<p class="p1"><span class="s1">const decode = (s) =&gt; s.replace(/&amp;quot;/g, '"').replace(/&amp;apos;/g, "'").replace(/&amp;lt;/g, "&lt;").replace(/&amp;gt;/g, "&gt;").replace(/&amp;amp;/g, "&amp;");</span></p>
<p class="p1"><span class="s1">const tag = (s, t) =&gt; decode(s.match(new RegExp(`&lt;${t}(?: [^&gt;]*)?&gt;([\\s\\S]*?)&lt;/${t}&gt;`))?.[1] || "");</span></p>
<p class="p1"><span class="s1">async function read(url) { const r = await fetch(url, { signal: AbortSignal.timeout(25000) }); if (!r.ok)</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>throw Error("The source is unavailable."); const s = await r.text(); if (s.length &gt; 6_000_000)</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>throw Error("The requested response is too large. Choose a shorter period."); if (/^\s*(?:&lt;!doctype\s+html|&lt;html\b)/i.test(s) || r.headers.get("content-type")?.includes("text/html"))</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>throw Error("The provider returned a web page instead of rainfall data. Retry or open its official rainfall view."); return s; }</span></p>
<p class="p1"><span class="s1">export async function handleRegionalRainfall(request) {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>const q = new URL(request.url).searchParams, provider = q.get("provider") || "", action = q.get("action") || "sites", site = q.get("site") || "";</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>if (!["wellington", "otago", "canterbury"].includes(provider) || !["sites", "series", "catalogue"].includes(action))</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>return reply({ error: "Unknown rainfall source or request." }, 400);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>if (action !== "sites" &amp;&amp; (!site.trim() || site.length &gt; 180 || /[&lt;&gt;\x00-\x1f]/.test(site)))</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>return reply({ error: "Choose a valid station." }, 400);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>const retrievedAt = new Date().toISOString();</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>try {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>if (provider === "canterbury") {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>const url = "https://gis.ecan.govt.nz/arcgis/rest/services/Public/WaterQualityandMonitoring/FeatureServer/5/query?" + new URLSearchParams({ f: "json", where: "1=1", outFields: "SITE,SITENAME,LAST_SAMPLE,LAST_HOUR,RAIN_TODAY,RAIN_1_DAY_AGO,RAIN_2_DAYS_AGO,RAIN_3_DAYS_AGO,RAIN_4_DAYS_AGO,RAIN_5_DAYS_AGO,RAIN_6_DAYS_AGO,RAIN_7_DAYS_AGO", returnGeometry: "false" });</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>const raw = JSON.parse(await read(url));</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>if (!raw.features)</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">                </span>throw Error("Canterbury returned no station data.");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>const stations = raw.features.map(f =&gt; f.attributes).filter(f =&gt; typeof f.SITE === "string");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>if (action === "sites")</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">                </span>return reply({ sites: stations.map(s =&gt; ({ name: s.SITE })), retrievedAt, source: url });</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>const s = stations.find(s =&gt; s.SITE === site);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>if (!s)</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">                </span>return reply({ error: "Station not found in the current Canterbury snapshot." }, 404);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>return reply({ site, retrievedAt, source: url, lastSample: s.LAST_SAMPLE, rows: [{ label: "Today (partial)", value: s.RAIN_TODAY }, { label: "1 day ago", value: s.RAIN_1_DAY_AGO }, ...Array.from({ length: 6 }, (_, i) =&gt; ({ label: `${i + 2} days ago`, value: s[`RAIN_${i + 2}_DAYS_AGO`] }))], lastHour: s.LAST_HOUR, convention: "Rolling periods as labelled by Environment Canterbury. They are not assigned calendar dates here; an old last-sample timestamp may indicate a stale gauge. Today may be incomplete." });</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>const base = BASES[provider];</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>const params = new URLSearchParams({ Service: "Hilltop", Request: action === "sites" ? "SiteList" : action === "catalogue" ? "MeasurementList" : "GetData", ...(action === "sites" ? { Measurement: "Rainfall" } : { Site: site }) });</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>if (action === "series") {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>const start = q.get("start") || "", end = q.get("end") || "";</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>if (!validDate(start) || !validDate(end) || start &gt; end || start &lt; "1900-01-01" || end &gt; new Date(Date.now() + 86400000).toISOString().slice(0, 10) || Date.parse(end) - Date.parse(start) &gt; 366 * 86400000)</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">                </span>return reply({ error: "Choose valid dates covering at most 366 days." }, 400);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>params.set("Measurement", "Rainfall");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>params.set("From", start + "T00:00:00");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>params.set("To", end + "T23:59:59");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>params.set("Interval", "1 day");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>params.set("Method", "Total");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>params.set("ShowQuality", "Yes");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>// Hilltop's older server does not decode '+' as a space in station names.</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>const url = base + "?" + params.toString().replace(/\+/g, "%20"), xml = await read(url);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>const error = tag(xml, "Error");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>if (error)</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>return reply({ error: "The provider returned: " + error + ". Check the station's archive period or use the current official rainfall view." }, 422);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>if (action === "sites")</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>return reply({ sites: [...new Set([...xml.matchAll(/&lt;Site\b[^&gt;]*Name="([^"]+)"/g)].map(m =&gt; decode(m[1])))].map(name =&gt; ({ name })), retrievedAt, source: url });</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>if (action === "catalogue") {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>const blocks = [...xml.matchAll(/&lt;DataSource\b[^&gt;]*Name="([^"]+)"[^&gt;]*&gt;([\s\S]*?)&lt;\/DataSource&gt;/g)];</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>const b = blocks.find(b =&gt; b[1] === "Rainfall");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>return reply({ start: b ? tag(b[2], "From") : "", end: b ? tag(b[2], "To") : "", retrievedAt, source: url });</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>const units = tag(xml, "Units");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>if (units !== "mm")</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>throw Error("The source did not identify rainfall in millimetres.");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>const rows = [...xml.matchAll(/&lt;E&gt;([\s\S]*?)&lt;\/E&gt;/g)].map(m =&gt; { const stamp = tag(m[1], "T"), raw = tag(m[1], "I1"); const number = raw.trim() ? Number(raw) : NaN; return { date: stamp.slice(0, 10), label: stamp.replace("T", " "), value: Number.isFinite(number) &amp;&amp; number &gt;= 0 ? number : null, quality: tag(m[1], "Q1") || tag(m[1], "Q") || "Not supplied" }; }).filter(r =&gt; /^\d{4}-\d{2}-\d{2}$/.test(r.date));</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>return reply({ site, rows, units, retrievedAt, source: url, convention: `Provider-generated daily totals; timestamps and interval labels are retained from ${provider === "otago" ? "ORC Hilltop (NZST, UTC+12; no daylight-saving adjustment)" : "Greater Wellington Hilltop"}. Confirm the interval boundaries and quality with the provider before comparing other daily datasets. Missing intervals are not zero.` });</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>catch (e) {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>return reply({ error: e instanceof SyntaxError ? "The provider returned unreadable station data. Retry or open its official rainfall view." : e.message || "The rainfall source could not be loaded. Retry or open its official data view." }, 502);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>}</span></p>
<p class="p1"><span class="s1">}</span></p>
</body>
</html>
