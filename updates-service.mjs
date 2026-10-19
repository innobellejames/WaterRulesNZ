const regulator = 'https://www.taumataarowai.govt.nz';
export const projectSources = [
    ['Watercare', 'https://www.watercare.co.nz/home/about-us/latest-news-and-media/critical-renewals-under-way-at-Rosedale-Wastewater-Treatment-plant'],
    ['Watercare', 'https://www.watercare.co.nz/home/about-us/latest-news-and-media/major-milestone-reached-at-rosedale-wastewater-treatment-plant'],
    ['Christchurch City Council', 'https://www.newsline.ccc.govt.nz/news/story/latest-updates-on-the-wastewater-treatment-plant'],
    ['Christchurch City Council', 'https://ccc.govt.nz/services/water-and-drainage/water-projects/akaroa-wastewater-scheme']
];
function clean(value) { return value.replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/&#0?39;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/&nbsp;/g, ' ').replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n))).replace(/\s+/g, ' ').trim(); }
function meta(html, name) { for (const tag of html.match(/<meta\s[^>]*>/gi) || []) {
    const key = tag.match(/(?:property|name)=["']([^"']+)/i)?.[1];
    if (key === name)
        return clean(tag.match(/content=["']([\s\S]*?)["']\s*\/?\s*>/i)?.[1] || '');
} return ''; }
async function get(url) { const r = await fetch(url, { headers: { Accept: 'text/html', 'User-Agent': 'WaterRulesNZ official-source reader' }, signal: AbortSignal.timeout(18000) }); if (!r.ok)
    throw Error(`Source unavailable (${r.status})`); const text = await r.text(); if (text.length > 4000000 || !/<html|<div/i.test(text))
    throw Error('Unexpected source format'); return text; }
export async function refreshUpdates(previous) {
    const now = new Date().toISOString(), warnings = [];
    let news = previous?.news || [];
    try {
        const html = await get(regulator + '/home/articles?sort=desc&ajax=1');
        const rows = [];
        for (const block of html.split(/<div class="result--news">/).slice(1)) {
            const path = block.match(/<a class="card__link" href="([^"]+)"/)?.[1];
            const title = clean(block.match(/<h3 class="result__title h5">([\s\S]*?)<\/h3>/)?.[1] || '');
            const date = clean(block.match(/<span class="card__date p--small">([\s\S]*?)<\/span>/)?.[1] || '');
            if (path?.startsWith('/home/articles/') && title && date && Number.isFinite(Date.parse(date)) && !rows.some(x => x.url === regulator + path))
                rows.push({ title: title.slice(0, 240), date, url: regulator + path });
        }
        if (rows.length < 3)
            throw Error('No validated articles');
        news = rows.sort((a, b) => Date.parse(b.date) - Date.parse(a.date)).slice(0, 12);
    }
    catch {
        warnings.push('Official news could not be refreshed. Previous verified entries remain available.');
    }
    const projects = await Promise.all(projectSources.map(async ([owner, url]) => { try {
        const html = await get(url);
        const title = meta(html, 'og:title') || clean(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '');
        if (!title || /access denied|just a moment|not found|cloudflare/i.test(title))
            throw Error('Blocked');
        const date = meta(html, 'article:published_time') || meta(html, 'datePublished') || '';
        return { owner, url, title: title.slice(0, 240), date: date && Number.isFinite(Date.parse(date)) ? date : '', summary: meta(html, 'og:description').slice(0, 320) };
    }
    catch {
        warnings.push(`${owner}: an owner page could not be refreshed.`);
        return previous?.projects.find(p => p.url === url) || null;
    } }));
    if (!news.length && !projects.some(Boolean))
        throw Error('No sources could be verified; previous snapshot retained.');
    return { checkedAt: now, news, projects: projects.filter((x) => !!x), warnings };
}
