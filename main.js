let originalData;
let preparedData;
let categories = [];

async function start() {
    originalData = await fetchDataAndStore();
    preparedData = getCategories(originalData);

    ko.applyBindings(new LastRoundViewModel(originalData.rounds[0]), document.getElementById('latest-draw-container'));
    ko.applyBindings(categories, document.getElementById('category-select-container'));

    drawCRSScoreHistory();
    drawScoreDistributionsHeatmap(preparedData);
    drawLastScoreContribution(originalData.rounds[0]);
}

async function fetchDataAndStore() {
    const today = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD
    // const today = new Date().toISOString().slice(0, 13); // Format: YYYY-MM-DD
    const url = `https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json?date=${today}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

function getCategories(data) {
    let x = [];
    let y = [];
    let z = [];
    let text = [];
    let selectedCategories = [];
    let category = new Set();
    for (let i = 0; i < data.rounds.length; i++) {
        if (selectedCategories.length > 0 && !selectedCategories.includes(data.rounds[i].drawName)) {
            continue;
        }

        x.push(data.rounds[i].drawDate);
        y.push(parseInt(data.rounds[i].drawCRS));
        z.push([
            parseInt(data.rounds[i].dd1.replace(/,/g, '')),
            parseInt(data.rounds[i].dd2.replace(/,/g, '')),
            parseInt(data.rounds[i].dd4.replace(/,/g, '')),
            parseInt(data.rounds[i].dd5.replace(/,/g, '')),
            parseInt(data.rounds[i].dd6.replace(/,/g, '')),
            parseInt(data.rounds[i].dd7.replace(/,/g, '')),
            parseInt(data.rounds[i].dd8.replace(/,/g, '')),
            parseInt(data.rounds[i].dd10.replace(/,/g, '')),
            parseInt(data.rounds[i].dd11.replace(/,/g, '')),
            parseInt(data.rounds[i].dd12.replace(/,/g, '')),
            parseInt(data.rounds[i].dd13.replace(/,/g, '')),
            parseInt(data.rounds[i].dd14.replace(/,/g, '')),
            parseInt(data.rounds[i].dd15.replace(/,/g, '')),
            parseInt(data.rounds[i].dd16.replace(/,/g, '')),
            parseInt(data.rounds[i].dd17.replace(/,/g, ''))
        ]);

        text.push(data.rounds[i].drawCRS);
        if (!category.has(data.rounds[i].drawName)) {
            category.add(data.rounds[i].drawName);
            categories.push(new Category(data.rounds[i].drawName));
        }
    }

    return { x, y, z, text, category };
}

function prepareData(data, singleCategory) {
    let x = [];
    let y = [];
    let z = [];
    let text = [];
    let category = new Set();
    for (let i = 0; i < data.rounds.length; i++) {
        if (singleCategory != data.rounds[i].drawName) {
            continue;
        }

        x.push(data.rounds[i].drawDate);
        y.push(parseInt(data.rounds[i].drawCRS));
        z.push([
            parseInt(data.rounds[i].dd1.replace(/,/g, '')),
            parseInt(data.rounds[i].dd2.replace(/,/g, '')),
            parseInt(data.rounds[i].dd4.replace(/,/g, '')),
            parseInt(data.rounds[i].dd5.replace(/,/g, '')),
            parseInt(data.rounds[i].dd6.replace(/,/g, '')),
            parseInt(data.rounds[i].dd7.replace(/,/g, '')),
            parseInt(data.rounds[i].dd8.replace(/,/g, '')),
            parseInt(data.rounds[i].dd10.replace(/,/g, '')),
            parseInt(data.rounds[i].dd11.replace(/,/g, '')),
            parseInt(data.rounds[i].dd12.replace(/,/g, '')),
            parseInt(data.rounds[i].dd13.replace(/,/g, '')),
            parseInt(data.rounds[i].dd14.replace(/,/g, '')),
            parseInt(data.rounds[i].dd15.replace(/,/g, '')),
            parseInt(data.rounds[i].dd16.replace(/,/g, '')),
            parseInt(data.rounds[i].dd17.replace(/,/g, ''))
        ]);
        text.push(data.rounds[i].drawCRS);

        if (!category.has(data.rounds[i].drawName)) {
            category.add(data.rounds[i].drawName);
        }
    }

    return { x, y, z, text, category };
}

function drawCRSScoreHistory() {
    eeDraws = document.getElementById('ee-draws');
    let drawData = [];
    var lastDataPointDate;
    var previous10DataPointsDate;

    // check if none of the categories are selected
    if (categories.every(cat => cat.selected.peek() == undefined || cat.selected.peek() == false)) {
        categories.forEach(cat => {
            if (cat.name == "General") {
                cat.selected(true);
            }
        });
    }

    for (let i = 0; i < categories.length; i++) {
        let category = categories[i];
        if (category.selected.peek() == undefined || category.selected.peek() == false) {
            continue;
        }
        let selectedData = prepareData(originalData, category.name);
        drawData.push({
            x: selectedData.x,
            y: selectedData.y,
            color: category.name,
            text: selectedData.text,
            name: category.name,
            line: {
                shape: 'spline',
                smoothing: 0.7,
            },
            type: 'scatter'
        });

        if (lastDataPointDate == undefined) {
            lastDataPointDate = selectedData.x[0];
        }
        else {
            if (lastDataPointDate < selectedData.x[0]) {
                lastDataPointDate = selectedData.x[0];
            }
        }

        var previousDataLength = selectedData.x.length < 10 ? selectedData.x.length : 10;

        if (previous10DataPointsDate == undefined) {
            previous10DataPointsDate = selectedData.x[previousDataLength];
        }
        else {
            if (previous10DataPointsDate > selectedData.x[previousDataLength]) {
                previous10DataPointsDate = selectedData.x[previousDataLength];
            }
        }
    }

    lastDataPointDate = new Date(lastDataPointDate);
    lastDataPointDate.setDate(lastDataPointDate.getDate() + 3);
    lastDataPointDate = lastDataPointDate.toISOString().split('T')[0];

    var layout = {
        margin: { t: 0 },
        xaxis: {
            autorange: false,
            title: {
                text: 'Draw Date'
            },
            type: 'date',
            rangeselector: {
                buttons: [
                    {
                        count: 1,
                        label: '1m',
                        step: 'month',
                        stepmode: 'backward'
                    },
                    {
                        count: 6,
                        label: '6m',
                        step: 'month',
                        stepmode: 'backward'
                    },
                    { step: 'all' }
                ]
            },
            range: [previous10DataPointsDate, lastDataPointDate],
            // range: ['2018-01-17', '2025-01-23'],
            rangeslider: {},
            fixedrange: false
        },
        yaxis: {
            title: {
                text: 'CRS Score'
            },
            fixedrange: true
        }
    };

    var config = {
        responsive: true,
        displayModeBar: false
    };

    Plotly.newPlot(eeDraws, drawData, layout, config);
}

function drawLastScoreContribution(data) {
    let myData = [
        {
            x: ["601-1200", "501-600", "491-500", "481-490", "471-480", "461-470", "451-460", "441-450", "431-440", "421-430", "411-420", "401-410", "351-400", "301-350", "0-300"].reverse(),
            y: [data.dd1, data.dd2, data.dd4, data.dd5, data.dd6, data.dd7, data.dd8, data.dd10, data.dd11, data.dd12, data.dd13, data.dd14, data.dd15, data.dd16, data.dd17].reverse(),
            type: 'bar',
            text: [data.dd1, data.dd2, data.dd4, data.dd5, data.dd6, data.dd7, data.dd8, data.dd10, data.dd11, data.dd12, data.dd13, data.dd14, data.dd15, data.dd16, data.dd17].reverse(),
            textposition: 'auto',
        }
    ];

    var layout = {
        margin: { t: 0 },
        xaxis: {
            autorange: true,
            title: {
                text: 'CRS Score Range'
            },
            fixedrange: true
        },
        yaxis: {
            autorange: true,
            title: {
                text: 'Number of profiles in the pool'
            },
            fixedrange: true
        }
    };

    var config = {
        responsive: true,
        displayModeBar: false
    };

    Plotly.newPlot('score-distribution', myData, layout, config);
}

function formatNumber(n) {
    if (n >= 1000) {
        return (n / 1000).toFixed(1) + "K";
    } else {
        return n.toString();
    }
}

function heatmapHoverText(x, y, z) {
    return z.map((row, i) => row.map((item, j) => {
        return `
Range: ${x[j]}<br>
Date:  ${y[i]}<br>
Count: ${formatNumber(item)}`
    }));
}

function drawScoreDistributionsHeatmap(data) {
    let x = ["0-300", "301-350", "351-400", "401-410", "411-420", "421-430", "431-440", "441-450", "451-460", "461-470", "471-480", "481-490", "491-500", "501-600", "601-1200"];
    let y = data.x;
    let z = data.z.filter(arr => !arr.every(val => val === 0)).map(arr => arr.reverse());
    let drawData = [{
        y: y,
        x: x,
        z: z,
        textposition: 'auto',
        text: heatmapHoverText(x, y, z),
        hoverinfo: 'text',
        type: 'heatmap',
        colorscale: 'Reds',
        showscale: true,
    }];

    var layout = {
        autosize: true,
        margin: {
            t: 16,
        },
        xaxis: {
            autorange: true,
            title: {
                text: 'CRS Score Range'
            },
            fixedrange: true
        },
        yaxis: {
            autorange: true,
            fixedrange: true
        }
    };

    var config = {
        responsive: true,
        displayModeBar: false
    };

    Plotly.newPlot('score-distributions-heatmap', drawData, layout, config);

}

class LastRoundViewModel {
    constructor(lastRound) {
        const drawDate = new Date(lastRound.drawDate);
        const today = new Date();
        const elapsedTime = Math.floor((today - drawDate) / (1000 * 60 * 60 * 24));

        this.drawNumber = ko.observable(lastRound.drawNumber);
        this.drawDate = ko.observable(lastRound.drawDate);
        this.elapsedTime = ko.observable(elapsedTime);
        this.category = ko.observable(lastRound.drawName);
        this.crsScore = ko.observable(lastRound.drawCRS);
        this.invitations = ko.observable(lastRound.drawSize);
    }
}

class Category {
    constructor(category) {
        var self = this;
        self.name = category;
        self.selected = ko.observable();

        self.selected.subscribe(function (newValue) {
            categories.forEach(cat => {
                if (cat.name == self.name || self.name.includes(cat.name)) {
                    cat.selected(newValue);
                }
            })
            drawCRSScoreHistory();
        });
    }
}

// Call the function to fetch and store the data
start();