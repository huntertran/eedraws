let originalData;
let categories = [];

let historyChart      = null;
let distributionChart = null;
let heatmapChart      = null;
let invitationsChart  = null;
let scatterChart      = null;
let historyDefaultRange   = { start: null, end: null };
let lastRoundVM           = null;
let suppressCategoryUpdate = false;

const COLORWAY = ['#E03028','#D4A017','#4A9EDB','#5BC99C','#C065D0','#F07843','#73BFA0','#E87060'];

const THEME = {
    bg:      '#0D1117',
    surface: '#131920',
    grid:    '#1A2230',
    axis:    '#344050',
    label:   '#9BBCCC',
    text:    '#E8F2FA',
    red:     '#C4261B',
    redBright:'#E03028',
    font:    "'IBM Plex Mono', 'Courier New', monospace",
};

function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

function darkTooltip(extra) {
    return Object.assign({
        backgroundColor: 'rgba(13,17,23,0.97)',
        borderColor: THEME.grid,
        borderWidth: 1,
        textStyle: { color: THEME.text, fontFamily: THEME.font, fontSize: 11 },
        extraCssText: 'border-radius:2px; box-shadow:0 4px 20px rgba(0,0,0,0.5);',
    }, extra);
}

function darkAxis(extra) {
    return Object.assign({
        axisLine:  { lineStyle: { color: THEME.grid } },
        axisTick:  { lineStyle: { color: THEME.axis } },
        axisLabel: { color: THEME.label, fontFamily: THEME.font, fontSize: 10 },
        splitLine: { lineStyle: { color: THEME.grid, type: 'dashed' } },
    }, extra);
}

// ── DATA FETCHING ──────────────────────────────────────────────────────────────

async function start() {
    try {
        originalData = await fetchDataAndStore();
        getCategories(originalData); // populates categories[]

        lastRoundVM = new LastRoundViewModel(originalData.rounds[0]);
        ko.applyBindings(lastRoundVM, document.getElementById('latest-draw-container'));
        ko.applyBindings(categories, document.getElementById('category-select-container'));

        // Set default category to the last draw's category, suppressing redraws during init
        suppressCategoryUpdate = true;
        const defaultCat = originalData.rounds[0].drawName;
        categories.forEach(cat => { if (cat.name === defaultCat) cat.selected(true); });
        suppressCategoryUpdate = false;

        drawAllCharts();

        const overlay = document.getElementById('loading-overlay');
        overlay.classList.add('hidden');
        setTimeout(() => { overlay.style.display = 'none'; }, 450);

        document.getElementById('filter-callout').classList.add('visible');
    } catch (err) {
        console.error(err);
        const overlay = document.getElementById('loading-overlay');
        overlay.querySelector('.loading-score').textContent = '!';
        overlay.querySelector('.loading-text').textContent = 'Failed to load data';
    }
}

async function fetchDataAndStore() {
    const today = new Date().toISOString().slice(0, 10);
    const url = `https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json?date=${today}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return response.json();
}

function getCategories(data) {
    let x = [], y = [], z = [], text = [];
    let selectedCategories = [];
    let category = new Set();

    for (let i = 0; i < data.rounds.length; i++) {
        if (selectedCategories.length > 0 && !selectedCategories.includes(data.rounds[i].drawName)) continue;

        x.push(data.rounds[i].drawDate);
        y.push(parseInt(data.rounds[i].drawCRS));
        z.push(parseScoreBands(data.rounds[i]));
        text.push(data.rounds[i].drawCRS);

        if (!category.has(data.rounds[i].drawName)) {
            category.add(data.rounds[i].drawName);
            categories.push(new Category(data.rounds[i].drawName));
        }
    }
    return { x, y, z, text, category };
}

function prepareData(data, singleCategory) {
    let x = [], y = [], z = [], text = [];
    let category = new Set();

    for (let i = 0; i < data.rounds.length; i++) {
        if (singleCategory != data.rounds[i].drawName) continue;
        x.push(data.rounds[i].drawDate);
        y.push(parseInt(data.rounds[i].drawCRS));
        z.push(parseScoreBands(data.rounds[i]));
        text.push(data.rounds[i].drawCRS);
        if (!category.has(data.rounds[i].drawName)) category.add(data.rounds[i].drawName);
    }
    return { x, y, z, text, category };
}

function parseScoreBands(round) {
    const fields = ['dd1','dd2','dd4','dd5','dd6','dd7','dd8','dd10','dd11','dd12','dd13','dd14','dd15','dd16','dd17'];
    return fields.map(f => parseInt(round[f].replace(/,/g, '')));
}

// ── CHARTS ────────────────────────────────────────────────────────────────────

function drawCRSScoreHistory() {
    const el = document.getElementById('ee-draws');
    if (!historyChart) {
        historyChart = echarts.init(el);
        window.addEventListener('resize', () => historyChart.resize());
    }

    const activeNames = getActiveCategories();
    const activeCats = categories.filter(cat => activeNames.includes(cat.name));
    let lastDate, earlyDate;

    const series = activeCats.map((cat, i) => {
        const d = prepareData(originalData, cat.name);
        const color = COLORWAY[i % COLORWAY.length];

        if (!lastDate || d.x[0] > lastDate) lastDate = d.x[0];
        const prevLen = Math.min(10, d.x.length - 1);
        if (!earlyDate || d.x[prevLen] < earlyDate) earlyDate = d.x[prevLen];

        return {
            name: cat.name,
            type: 'line',
            smooth: 0.4,
            color,
            symbolSize: 5,
            symbol: 'circle',
            lineStyle: { width: 2.5 },
            areaStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: hexToRgba(color, 0.18) },
                    { offset: 1, color: hexToRgba(color, 0) },
                ])
            },
            emphasis: { focus: 'series' },
            data: d.x.map((date, j) => [date, d.y[j]]),
        };
    });

    const end = new Date(lastDate);
    end.setDate(end.getDate() + 3);
    const endStr = end.toISOString().slice(0, 10);

    historyDefaultRange = { start: earlyDate, end: endStr };

    historyChart.setOption({
        backgroundColor: THEME.bg,
        color: COLORWAY,
        tooltip: darkTooltip({
            trigger: 'axis',
            axisPointer: {
                type: 'cross',
                lineStyle: { color: THEME.axis },
                crossStyle: { color: THEME.axis },
                label: { backgroundColor: THEME.surface, color: THEME.label, fontFamily: THEME.font, fontSize: 10 },
            },
            formatter(params) {
                const date = params[0].axisValue;
                const rows = params.map(p =>
                    `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}: <b>${p.value[1]}</b>`
                ).join('<br>');
                return `<div style="margin-bottom:4px;color:${THEME.label}">${date}</div>${rows}`;
            },
        }),
        legend: {
            top: 8,
            right: 12,
            textStyle: { color: THEME.label, fontFamily: THEME.font, fontSize: 11 },
            inactiveColor: THEME.axis,
        },
        grid: { top: 50, right: 24, bottom: 80, left: 64 },
        xAxis: darkAxis({
            type: 'time',
            boundaryGap: false,
            name: 'Draw Date',
            nameLocation: 'middle',
            nameGap: 28,
            nameTextStyle: { color: THEME.label, fontFamily: THEME.font, fontSize: 11 },
        }),
        yAxis: darkAxis({
            type: 'value',
            name: 'CRS Score',
            nameLocation: 'middle',
            nameGap: 48,
            nameTextStyle: { color: THEME.label, fontFamily: THEME.font, fontSize: 11 },
            scale: true,
        }),
        dataZoom: [
            {
                type: 'inside',
                startValue: earlyDate,
                endValue: endStr,
            },
            {
                type: 'slider',
                height: 22,
                bottom: 10,
                startValue: earlyDate,
                endValue: endStr,
                handleStyle: { color: THEME.red, borderColor: THEME.red },
                moveHandleStyle: { color: THEME.red },
                selectedDataBackground: {
                    lineStyle: { color: THEME.red },
                    areaStyle: { color: hexToRgba(THEME.red, 0.12) },
                },
                dataBackground: {
                    lineStyle: { color: THEME.axis },
                    areaStyle: { color: hexToRgba(THEME.axis, 0.08) },
                },
                filledColor: hexToRgba(THEME.red, 0.12),
                borderColor: THEME.grid,
                backgroundColor: THEME.surface,
                textStyle: { color: THEME.label, fontFamily: THEME.font, fontSize: 10 },
                labelFormatter(val) {
                    return new Date(val).toISOString().slice(0, 10);
                },
            },
        ],
        series,
    }, { notMerge: true });
}

function drawLastScoreContribution(data) {
    const el = document.getElementById('score-distribution');
    if (!distributionChart) {
        distributionChart = echarts.init(el);
        window.addEventListener('resize', () => distributionChart.resize());
    }

    const scoreRanges = ['0-300','301-350','351-400','401-410','411-420','421-430','431-440','441-450','451-460','461-470','471-480','481-490','491-500','501-600','601-1200'];
    const fields = ['dd17','dd16','dd15','dd14','dd13','dd12','dd11','dd10','dd8','dd7','dd6','dd5','dd4','dd2','dd1'];
    const counts = fields.map(f => parseInt(data[f].replace(/,/g, '')));

    distributionChart.setOption({
        backgroundColor: THEME.bg,
        tooltip: darkTooltip({
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter: params => {
                const p = params[0];
                return `<b>${p.name}</b><br>Profiles: <b>${Number(p.value).toLocaleString()}</b>`;
            },
        }),
        grid: { top: 16, right: 16, bottom: 72, left: 72 },
        xAxis: darkAxis({
            type: 'category',
            data: scoreRanges,
            name: 'CRS Score Range',
            nameLocation: 'middle',
            nameGap: 36,
            nameTextStyle: { color: THEME.label, fontFamily: THEME.font, fontSize: 11 },
            axisLabel: { rotate: 35, fontSize: 9 },
        }),
        yAxis: darkAxis({
            type: 'value',
            name: 'Profiles in pool',
            nameLocation: 'middle',
            nameGap: 56,
            nameTextStyle: { color: THEME.label, fontFamily: THEME.font, fontSize: 11 },
        }),
        series: [{
            type: 'bar',
            data: counts,
            barMaxWidth: 36,
            itemStyle: {
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                    { offset: 0, color: THEME.redBright },
                    { offset: 1, color: '#5C1010' },
                ]),
                borderRadius: [2, 2, 0, 0],
            },
            emphasis: {
                itemStyle: {
                    color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                        { offset: 0, color: '#FF5548' },
                        { offset: 1, color: THEME.redBright },
                    ]),
                }
            },
            label: {
                show: true,
                position: 'top',
                color: THEME.label,
                fontFamily: THEME.font,
                fontSize: 9,
                formatter: params => Number(params.value).toLocaleString(),
            },
        }],
    });
}

function formatNumber(n) {
    if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
    return n.toString();
}

function drawScoreDistributionsHeatmap() {
    const el = document.getElementById('score-distributions-heatmap');
    if (!heatmapChart) {
        heatmapChart = echarts.init(el);
        window.addEventListener('resize', () => heatmapChart.resize());
    }

    const scoreRanges = ['0-300','301-350','351-400','401-410','411-420','421-430','431-440','441-450','451-460','461-470','471-480','481-490','491-500','501-600','601-1200'];

    const active = getActiveCategories();
    const pairs = originalData.rounds
        .filter(r => active.includes(r.drawName))
        .map(r => [r.drawDate, parseScoreBands(r)])
        .filter(([, z]) => !z.every(v => v === 0 || isNaN(v)))
        .reverse();

    const dates    = pairs.map(([date]) => date);
    const zAligned = pairs.map(([, z]) => z);

    let flatData = [];
    let maxVal = 0;

    for (let di = 0; di < dates.length; di++) {
        const row = zAligned[di];
        for (let si = 0; si < scoreRanges.length; si++) {
            const v = row[si] || 0;
            if (v > maxVal) maxVal = v;
            flatData.push([si, di, v]);
        }
    }

    heatmapChart.setOption({
        backgroundColor: THEME.bg,
        tooltip: darkTooltip({
            formatter(params) {
                const [si, di, v] = params.value;
                return `<b>${scoreRanges[si]}</b><br>${dates[di]}<br>Profiles: <b>${Number(v).toLocaleString()}</b>`;
            },
        }),
        grid: { top: 16, right: 100, bottom: 80, left: 72 },
        xAxis: darkAxis({
            type: 'category',
            data: scoreRanges,
            name: 'CRS Score Range',
            nameLocation: 'middle',
            nameGap: 38,
            nameTextStyle: { color: THEME.text, fontFamily: THEME.font, fontSize: 11 },
            axisLabel: { rotate: 35, fontSize: 10, color: THEME.text, fontFamily: THEME.font },
            splitArea: { show: false },
        }),
        yAxis: darkAxis({
            type: 'category',
            data: dates,
            axisLabel: { fontSize: 10, color: THEME.text, fontFamily: THEME.font },
            splitArea: { show: false },
            splitLine: { show: false },
        }),
        visualMap: {
            min: 0,
            max: maxVal,
            calculable: true,
            orient: 'vertical',
            right: 12,
            top: 'center',
            itemWidth: 14,
            itemHeight: 180,
            inRange: {
                color: ['#0D1117', '#2A0A07', '#6B160F', '#C4261B', '#E8352A'],
            },
            textStyle: { color: THEME.text, fontFamily: THEME.font, fontSize: 10 },
            formatter: v => formatNumber(v),
        },
        series: [{
            type: 'heatmap',
            data: flatData,
            emphasis: {
                itemStyle: {
                    borderColor: '#fff',
                    borderWidth: 1,
                    shadowBlur: 8,
                    shadowColor: hexToRgba(THEME.redBright, 0.5),
                },
            },
            progressive: 1000,
            animation: false,
        }],
    });
}

function drawInvitationsHistory() {
    const el = document.getElementById('invitations-history');
    if (!invitationsChart) {
        invitationsChart = echarts.init(el);
        window.addEventListener('resize', () => invitationsChart.resize());
    }

    const active = getActiveCategories();
    const catMap = {};
    const catOrder = [];
    originalData.rounds.filter(r => active.includes(r.drawName)).forEach(r => {
        if (!catMap[r.drawName]) {
            catMap[r.drawName] = [];
            catOrder.push(r.drawName);
        }
        catMap[r.drawName].push([r.drawDate, parseInt((r.drawSize || '0').replace(/,/g, ''))]);
    });

    const series = catOrder.map((name, i) => ({
        name,
        type: 'bar',
        data: catMap[name],
        color: COLORWAY[i % COLORWAY.length],
        barMaxWidth: 10,
        emphasis: { focus: 'series' },
        itemStyle: { borderRadius: [2, 2, 0, 0] },
    }));

    // Default view: last ~12 months
    const cutoff = new Date();
    cutoff.setFullYear(cutoff.getFullYear() - 1);
    const cutoffStr = cutoff.toISOString().slice(0, 10);

    invitationsChart.setOption({
        backgroundColor: THEME.bg,
        color: COLORWAY,
        legend: {
            top: 8,
            right: 12,
            textStyle: { color: THEME.label, fontFamily: THEME.font, fontSize: 11 },
            inactiveColor: THEME.axis,
        },
        tooltip: darkTooltip({
            trigger: 'axis',
            axisPointer: { type: 'shadow' },
            formatter(params) {
                const date = params[0].axisValue;
                const rows = params
                    .filter(p => p.value && p.value[1] > 0)
                    .map(p => `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px"></span>${p.seriesName}: <b>${Number(p.value[1]).toLocaleString()}</b>`)
                    .join('<br>');
                return `<div style="margin-bottom:4px;color:${THEME.label}">${date}</div>${rows}`;
            },
        }),
        grid: { top: 50, right: 24, bottom: 80, left: 72 },
        xAxis: darkAxis({
            type: 'time',
            name: 'Draw Date',
            nameLocation: 'middle',
            nameGap: 28,
            nameTextStyle: { color: THEME.label, fontFamily: THEME.font, fontSize: 11 },
        }),
        yAxis: darkAxis({
            type: 'value',
            name: 'Invitations',
            nameLocation: 'middle',
            nameGap: 56,
            nameTextStyle: { color: THEME.label, fontFamily: THEME.font, fontSize: 11 },
        }),
        dataZoom: [
            { type: 'inside', startValue: cutoffStr },
            {
                type: 'slider',
                height: 22,
                bottom: 10,
                startValue: cutoffStr,
                handleStyle: { color: THEME.red, borderColor: THEME.red },
                moveHandleStyle: { color: THEME.red },
                selectedDataBackground: {
                    lineStyle: { color: THEME.red },
                    areaStyle: { color: hexToRgba(THEME.red, 0.12) },
                },
                dataBackground: {
                    lineStyle: { color: THEME.axis },
                    areaStyle: { color: hexToRgba(THEME.axis, 0.08) },
                },
                filledColor: hexToRgba(THEME.red, 0.12),
                borderColor: THEME.grid,
                backgroundColor: THEME.surface,
                textStyle: { color: THEME.label, fontFamily: THEME.font, fontSize: 10 },
                labelFormatter(val) { return new Date(val).toISOString().slice(0, 10); },
            },
        ],
        series,
    });
}

function drawScoreVsInvitations() {
    const el = document.getElementById('score-vs-invitations');
    if (!scatterChart) {
        scatterChart = echarts.init(el);
        window.addEventListener('resize', () => scatterChart.resize());
    }

    const active = getActiveCategories();
    const catMap = {};
    const catOrder = [];
    originalData.rounds.filter(r => active.includes(r.drawName)).forEach(r => {
        if (!catMap[r.drawName]) {
            catMap[r.drawName] = [];
            catOrder.push(r.drawName);
        }
        catMap[r.drawName].push([
            parseInt(r.drawCRS),
            parseInt((r.drawSize || '0').replace(/,/g, '')),
            r.drawDate,
        ]);
    });

    const series = catOrder.map((name, i) => ({
        name,
        type: 'scatter',
        data: catMap[name],
        symbolSize: 9,
        color: COLORWAY[i % COLORWAY.length],
        emphasis: {
            focus: 'series',
            itemStyle: { shadowBlur: 10, shadowColor: hexToRgba(COLORWAY[i % COLORWAY.length], 0.5) },
        },
    }));

    scatterChart.setOption({
        backgroundColor: THEME.bg,
        color: COLORWAY,
        legend: {
            top: 8,
            right: 12,
            textStyle: { color: THEME.label, fontFamily: THEME.font, fontSize: 11 },
            inactiveColor: THEME.axis,
        },
        tooltip: darkTooltip({
            formatter(params) {
                const [crs, inv, date] = params.value;
                return [
                    `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${params.color};margin-right:6px"></span><b>${params.seriesName}</b>`,
                    `<span style="color:${THEME.label}">${date}</span>`,
                    `CRS cutoff: <b>${crs}</b>`,
                    `Invitations: <b>${Number(inv).toLocaleString()}</b>`,
                ].join('<br>');
            },
        }),
        grid: { top: 50, right: 24, bottom: 60, left: 72 },
        xAxis: darkAxis({
            type: 'value',
            name: 'CRS Cutoff Score',
            nameLocation: 'middle',
            nameGap: 32,
            nameTextStyle: { color: THEME.label, fontFamily: THEME.font, fontSize: 11 },
            scale: true,
        }),
        yAxis: darkAxis({
            type: 'value',
            name: 'Invitations',
            nameLocation: 'middle',
            nameGap: 56,
            nameTextStyle: { color: THEME.label, fontFamily: THEME.font, fontSize: 11 },
        }),
        series,
    });
}

function toggleFilterPanel() {
    const panel  = document.getElementById('filter-panel');
    const toggle = document.getElementById('filter-toggle');
    const isOpen = panel.classList.toggle('open');
    toggle.classList.toggle('open', isOpen);
}

function closeFilterPanel() {
    document.getElementById('filter-panel').classList.remove('open');
    document.getElementById('filter-toggle').classList.remove('open');
}

function updateFilterSummary() {
    const el = document.getElementById('filter-summary');
    if (!el) return;
    const active = categories.filter(c => c.selected.peek()).map(c => c.name);
    if (active.length === 0 || active.length === categories.length) {
        el.textContent = 'All';
    } else if (active.length === 1) {
        el.textContent = active[0];
    } else {
        el.textContent = `${active.length} selected`;
    }
}

document.addEventListener('click', e => {
    const bar = document.getElementById('filter-bar');
    if (bar && !bar.contains(e.target)) closeFilterPanel();
});

function getActiveCategories() {
    const active = categories.filter(c => c.selected.peek()).map(c => c.name);
    return active.length > 0 ? active : categories.map(c => c.name);
}

function updateLatestDraw() {
    if (!lastRoundVM) return;
    const active = getActiveCategories();
    const latest = originalData.rounds.find(r => active.includes(r.drawName));
    if (!latest) return;
    const elapsed = Math.floor((new Date() - new Date(latest.drawDate)) / 86400000);
    lastRoundVM.drawNumber(latest.drawNumber);
    lastRoundVM.drawDate(latest.drawDate);
    lastRoundVM.elapsedTime(elapsed);
    lastRoundVM.category(latest.drawName);
    lastRoundVM.crsScore(latest.drawCRS);
    lastRoundVM.invitations(latest.drawSize);
    drawLastScoreContribution(latest);
}

function drawAllCharts() {
    updateFilterSummary();
    drawCRSScoreHistory();
    drawInvitationsHistory();
    drawScoreVsInvitations();
    drawScoreDistributionsHeatmap();
    updateLatestDraw();
}

function resetInvitationsZoom() {
    if (invitationsChart) invitationsChart.dispatchAction({ type: 'restore' });
}

function resetScatterView() {
    if (scatterChart) scatterChart.dispatchAction({ type: 'restore' });
}

function resetHistoryZoom() {
    if (!historyChart || !historyDefaultRange.start) return;
    historyChart.setOption({
        dataZoom: [
            { startValue: historyDefaultRange.start, endValue: historyDefaultRange.end },
            { startValue: historyDefaultRange.start, endValue: historyDefaultRange.end },
        ],
    });
}

// ── VIEW MODELS ────────────────────────────────────────────────────────────────

class LastRoundViewModel {
    constructor(lastRound) {
        const drawDate = new Date(lastRound.drawDate);
        const today = new Date();
        const elapsedTime = Math.floor((today - drawDate) / (1000 * 60 * 60 * 24));

        this.drawNumber  = ko.observable(lastRound.drawNumber);
        this.drawDate    = ko.observable(lastRound.drawDate);
        this.elapsedTime = ko.observable(elapsedTime);
        this.category    = ko.observable(lastRound.drawName);
        this.crsScore    = ko.observable(lastRound.drawCRS);
        this.invitations = ko.observable(lastRound.drawSize);
    }
}

class Category {
    constructor(category) {
        var self = this;
        self.name = category;
        self.selected = ko.observable();

        self.selected.subscribe(function (newValue) {
            if (suppressCategoryUpdate) return;
            categories.forEach(cat => {
                if (cat.name === self.name || self.name.includes(cat.name)) {
                    cat.selected(newValue);
                }
            });
            drawAllCharts();
        });
    }
}

start();
