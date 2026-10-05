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
<p class="p1"><span class="s1">const BASE = "https://envdata.es.govt.nz/services/";</span></p>
<p class="p1"><span class="s1">const json = (body, status = 200) =&gt; Response.json(body, { status, headers: { "Cache-Control": status === 200 ? "public, max-age=300" : "no-store" } });</span></p>
<p class="p1"><span class="s1">export async function handleRainfall(request) {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>const q = new URL(request.url).searchParams, action = q.get("action") || "sites", site = q.get("site") || "";</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>if (!["sites", "recent", "history", "catalogue"].includes(action))</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>return json({ error: "Unknown rainfall request." }, 400);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>if (action !== "sites" &amp;&amp; (!site.trim() || site.length &gt; 140 || /[&lt;&gt;\x00-\x1f]/.test(site)))</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>return json({ error: "Choose a rainfall station." }, 400);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>let path = "sites.ashx", params = new URLSearchParams({ f: "rainfall.xml" });</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>if (action === "recent") {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>const interval = q.get("interval") || "30";</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>if (!["7", "30", "60", "90", "180", "365"].includes(interval))</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>return json({ error: "Unsupported period." }, 400);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>path = "data.ashx";</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>params = new URLSearchParams({ s: site, m: "Rainfall", i: interval });</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>if (action === "catalogue") {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>path = "catalogue.ashx";</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>params = new URLSearchParams({ site, measurement: "Rainfall" });</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>if (action === "history") {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>const start = q.get("start") || "", end = q.get("end") || "";</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>if (!validDate(start) || !validDate(end) || start &gt; end || start &lt; "1900-01-01" || end &gt; new Date(Date.now() + 86400000).toISOString().slice(0, 10))</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>return json({ error: "Enter a valid historical date range." }, 400);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>const fmt = (s) =&gt; s.split("-").reverse().join("-");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>path = "historical.ashx";</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>params = new URLSearchParams({ site, measurement: "Rainfall", start: fmt(start), end: fmt(end), w: "1100", h: "480", mode: "1", b64: "1" });</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>try {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>const response = await fetch(BASE + path + "?" + params, { signal: AbortSignal.timeout(30000), headers: { Accept: "application/json,text/plain" } });</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>if (!response.ok)</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>throw new Error("Rainfall source unavailable");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>const body = await response.text();</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>if (body.length &gt; 8_000_000)</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>throw new Error("Rainfall response too large");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>if (action === "history") {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>if (!/^R0lGOD[dh][A-Za-z0-9+/=\r\n]*$/.test(body.trim()))</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">                </span>return json({ error: "The source returned no historical graph for this station and date range. Try another range or open Environment Southland." }, 422);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>return json({ image: "data:image/gif;base64," + body.trim(), site, start: q.get("start"), end: q.get("end"), retrievedAt: new Date().toISOString(), source: "https://envdata.es.govt.nz/" });</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>const trimmed = body.trim();</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>if (action === "sites" &amp;&amp; /^&lt;/.test(trimmed)) {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>const sites = [...trimmed.matchAll(/&lt;Site\\b[^&gt;]*(?:Name|name)="([^"]+)"/g)].map(m =&gt; m[1].replace(/&amp;amp;/g, "&amp;").replace(/&amp;quot;/g, '"')).filter(Boolean);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>if (sites.length) return json({ data: { sites: sites.map(name =&gt; ({ name })) }, retrievedAt: new Date().toISOString(), source: "https://envdata.es.govt.nz/" });</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>let data;</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>try {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>data = JSON.parse(trimmed);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>} catch {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>throw new Error("Environment Southland returned an unsupported rainfall format.");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>if (action === "sites" &amp;&amp; !Array.isArray(data.sites) || action === "recent" &amp;&amp; !Array.isArray(data.data))</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">            </span>throw new Error("Invalid rainfall source response");</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>return json({ data, retrievedAt: new Date().toISOString(), source: "https://envdata.es.govt.nz/" });</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>}</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>catch {</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">        </span>return json({ error: "Environment Southland rainfall data could not be loaded. Please retry or open the official portal." }, 502);</span></p>
<p class="p1"><span class="s1"><span class="Apple-converted-space">    </span>}</span></p>
<p class="p1"><span class="s1">}</span></p>
</body>
</html>
