const kinds = ["Broken link", "Outdated information", "Incorrect answer or citation", "Accessibility or display", "Other", "General enquiry"];
export function parseIssue(raw) {
    if (!raw || typeof raw !== "object" || Array.isArray(raw))
        throw Error("Enter a valid issue report.");
    const v = raw;
    if (v.website)
        throw Error("Unable to accept this report.");
    if (typeof v.kind !== "string" || !kinds.includes(v.kind))
        throw Error("Choose an issue type.");
    if (typeof v.details !== "string" || v.details.trim().length < 10 || v.details.length > 6000)
        throw Error("Describe the issue using 10–6,000 characters.");
    const replyTo = typeof v.replyTo === "string" ? v.replyTo.trim() : "";
    if (replyTo && (replyTo.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(replyTo) || /[\r\n]/.test(replyTo)))
        throw Error("Enter a valid reply email, or leave it blank.");
    let page = "";
    if (typeof v.page === "string" && v.page.length < 2000) {
        try {
            const u = new URL(v.page);
            if (["https:", "http:", "file:"].includes(u.protocol)) {
                u.search = "";
                page = u.href;
            }
        }
        catch { }
    }
    if (typeof v.id !== "string" || !/^report-[a-zA-Z0-9-]{16,64}$/.test(v.id))
        throw Error("Refresh the form and try again.");
    return { id: v.id, kind: v.kind, details: v.details.trim(), replyTo, page, createdAt: new Date().toISOString() };
}
export async function deliverIssue(issue, config, send = fetch) {
    if (!config.to)
        return "pending";
    if (config.provider === "formsubmit") {
        const origin = config.origin || new URL(issue.page).origin;
        if (!/^https?:\/\//.test(origin))
            return "pending";
        const response = await send("https://formsubmit.co/ajax/" + encodeURIComponent(config.to), { method: "POST", headers: { Accept: "application/json", "Content-Type": "application/json", Referer: origin + "/" }, body: JSON.stringify({ _subject: `WaterRules NZ: ${issue.kind}`, reference: issue.id, message: issue.details, page: issue.page, date: issue.createdAt, ...(issue.replyTo ? { email: issue.replyTo } : {}), _template: "table" }), signal: AbortSignal.timeout(15000) });
        if (!response.ok)
            throw Error("Mail service did not accept the message.");
        const result = await response.json();
        if (result.success === true || result.success === "true")
            return "sent";
        if (/activat/i.test(result.message || ""))
            return "activation-required";
        throw Error("Mail service did not accept the message.");
    }
    if (!config.key || !config.from)
        return "pending";
    const response = await send("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${config.key}`, "Content-Type": "application/json", "Idempotency-Key": issue.id }, body: JSON.stringify({ from: config.from, to: [config.to], subject: `WaterRules NZ: ${issue.kind}`, text: `Reference: ${issue.id}\nDate: ${issue.createdAt}\nPage: ${issue.page}\nReply email: ${issue.replyTo || "Not supplied"}\n\n${issue.details}`, ...(issue.replyTo ? { reply_to: issue.replyTo } : {}) }), signal: AbortSignal.timeout(15000) });
    if (!response.ok)
        throw Error("Mail service did not accept the message.");
    const result = await response.json();
    if (!result.id)
        throw Error("Mail service returned no delivery reference.");
    return "sent";
}
