async function start() {
    const data = await fetchDataAndStore();
    draw(prepareData(data));
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
    for (let i = 0; i < data.rounds.length; i++) {
        x.push(data.rounds[i].drawDate);
        y.push(data.rounds[i].drawCRS);
    }
    return { x, y, type: 'scatter' };
}

function draw(data) {
    eeDraws = document.getElementById('ee-draws');

    data.line = {
        shape: 'spline',
        smoothing: 0.7,
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

    Plotly.newPlot(eeDraws, [data], layout, config);
}

function drawLastScoreContribution(data) {

    let myData = [
        {
            x: ["dd1", "dd2", "dd3", "dd4", "dd5", "dd6", "dd7", "dd8", "dd9", "dd10", "dd11", "dd12", "dd13", "dd14", "dd15", "dd16", "dd17"],
            y: [data.dd1, data.dd2, data.dd3, data.dd4, data.dd5, data.dd6, data.dd7, data.dd8, data.dd9, data.dd10, data.dd11, data.dd12, data.dd13, data.dd14, data.dd15, data.dd16, data.dd17],
            type: 'bar'
        }
    ];

    var layout = {
        margin: { t: 0 },
        autosize: true,
        xaxis: {
            autorange: false,
            title: {
                text: 'Distribution'
            },
        },
        yaxis: {
            title: {
                text: 'CRS Score'
            },
            // range: [0, Math.max(...myData[0].y)]
        }
    };

    var config = {
        responsive: true
    };

    Plotly.newPlot('score-distribution', myData, layout, config);
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