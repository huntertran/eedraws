async function start() {
    const data = await fetchDataAndStore();
    draw(prepareData(data));
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

    var layout = {
        margin: { t: 0 },
        xaxis: {
            autorange: true,
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
            rangeslider: { range: ['2015-02-17', '2017-02-16'] },
        },
        yaxis: {
            title: {
                text: 'CRS Score'
            },
            fixedrange: true
        }
    };

    var config = {
        responsive: true
    };

    Plotly.newPlot(eeDraws, [data], layout, config);
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