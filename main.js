async function start() {
    const data = await fetchDataAndStore();
    const preparedData = prepareData(data);
    draw(preparedData);
    drawScoreDistributionsHeatmap(preparedData);
    drawLastScoreContribution(data.rounds[0]);
    ko.applyBindings(new LastRoundViewModel(data.rounds[0]));
}
async function fetchDataAndStore() {
    const url = "https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json";
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

function prepareData(data) {
    let x = [];
    let y = [];
    let z = [];
    let text = [];
    for (let i = 0; i < data.rounds.length; i++) {
        x.push(data.rounds[i].drawDate);
        y.push(parseInt(data.rounds[i].drawCRS));
        z.push([
            parseInt(data.rounds[i].dd1.replace(/,/g, ''), 10),
            parseInt(data.rounds[i].dd2.replace(/,/g, ''), 10),
            parseInt(data.rounds[i].dd4.replace(/,/g, ''), 10),
            parseInt(data.rounds[i].dd5.replace(/,/g, ''), 10),
            parseInt(data.rounds[i].dd6.replace(/,/g, ''), 10),
            parseInt(data.rounds[i].dd7.replace(/,/g, ''), 10),
            parseInt(data.rounds[i].dd8.replace(/,/g, ''), 10),
            parseInt(data.rounds[i].dd10.replace(/,/g, ''), 10),
            parseInt(data.rounds[i].dd11.replace(/,/g, ''), 10),
            parseInt(data.rounds[i].dd12.replace(/,/g, ''), 10),
            parseInt(data.rounds[i].dd13.replace(/,/g, ''), 10),
            parseInt(data.rounds[i].dd14.replace(/,/g, ''), 10),
            parseInt(data.rounds[i].dd15.replace(/,/g, ''), 10),
            parseInt(data.rounds[i].dd16.replace(/,/g, ''), 10),
            parseInt(data.rounds[i].dd17.replace(/,/g, ''), 10)
        ]);
        text.push(data.rounds[i].drawCRS);
    }

    return { x, y, z, text };
}

function draw(data) {
    eeDraws = document.getElementById('ee-draws');

    let drawData = {
        x: data.x,
        y: data.y,
        text: data.text,
        line: {
            shape: 'spline',
            smoothing: 0.7,
        },
        type: 'scattergl',
        mode: 'lines+markers+text',
        textposition: 'top center',
    }

    var today = new Date();
    let sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

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
            range: [data.x[30], data.x[0]],
            rangeslider: {},
        },
        yaxis: {
            title: {
                text: 'CRS Score'
            },
            fixedrange: false
        }
    };

    var config = {
        responsive: true
    };

    Plotly.newPlot(eeDraws, [drawData], layout, config);
}

function drawLastScoreContribution(data) {
    let myData = [
        {
            x: ["601-1200", "501-600", "491-500", "481-490", "471-480", "461-470", "451-460", "441-450", "431-440", "421-430", "411-420", "401-410", "351-400", "301-350", "0-300"],
            y: [data.dd1, data.dd2, data.dd4, data.dd5, data.dd6, data.dd7, data.dd8, data.dd10, data.dd11, data.dd12, data.dd13, data.dd14, data.dd15, data.dd16, data.dd17],
            type: 'bar',
            text: [data.dd1, data.dd2, data.dd4, data.dd5, data.dd6, data.dd7, data.dd8, data.dd10, data.dd11, data.dd12, data.dd13, data.dd14, data.dd15, data.dd16, data.dd17],
            textposition: 'auto',
        }
    ];

    var layout = {
        margin: { t: 0 },
        xaxis: {
            autorange: true,
            title: {
                text: 'Distribution'
            },
        },
        yaxis: {
            autorange: true,
            title: {
                text: 'CRS Score'
            },
        }
    };

    var config = {
        responsive: true
    };

    Plotly.newPlot('score-distribution', myData, layout, config);
}

function drawScoreDistributionsHeatmap(data) {
    let drawData = [{
        x: data.x,
        y: ["601-1200", "501-600", "491-500", "481-490", "471-480", "461-470", "451-460", "441-450", "431-440", "421-430", "411-420", "401-410", "351-400", "301-350", "0-300"],
        z: data.z,
        text: data.z,
        textposition: 'auto',
        type: 'heatmap',
        // colorscale: 'Viridis',
        showscale: true
    }];

    var config = {
        responsive: true
    };

    var testData1 = [
        {
            z: [[1, 20, 30], [20, 1, 60], [30, 60, 1]],
            type: 'heatmap'
        }
    ];

    var testData = [
        {
            z: data.z,
            type: 'heatmap'
        }
    ];

    // Plotly.newPlot('score-distributions-heatmap', data, layout, config);
    Plotly.newPlot('score-distributions-heatmap', drawData);

}

function LastRoundViewModel(lastRound) {
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

// Call the function to fetch and store the data
start();