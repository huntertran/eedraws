let originalData;
let preparedData;

async function start() {
    originalData = await fetchDataAndStore();
    preparedData = prepareData(originalData);
    ko.applyBindings(new LastRoundViewModel(originalData.rounds[0]), document.getElementById('latest-draw-container'));
    ko.applyBindings(new ScoreDistributionOptionsModel(preparedData.category), document.getElementById('category-select-container'));
    drawCRSScoreHistory(preparedData);
    drawScoreDistributionsHeatmap(preparedData);
    drawLastScoreContribution(originalData.rounds[0]);
}

async function fetchDataAndStore() {
    // const today = new Date().toISOString().slice(0, 10); // Format: YYYY-MM-DD
    const today = new Date().toISOString().slice(0, 13); // Format: YYYY-MM-DD
    const url = `https://www.canada.ca/content/dam/ircc/documents/json/ee_rounds_123_en.json?date=${today}`;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
    }

    return response.json();
}

function prepareData(data, selectedCategories = []) {
    let x = [];
    let y = [];
    let z = [];
    let text = [];
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
        }
    }

    return { x, y, z, text, category };
}

function drawCRSScoreHistory(data, selectedCategories = []) {
    eeDraws = document.getElementById('ee-draws');

    if (selectedCategories.length > 0) {
        // recall prepareData with selectedCategories
        data = prepareData(originalData, selectedCategories);
    }

    let drawData = {
        x: data.x,
        y: data.y,
        color: data.category,
        text: data.text,
        line: {
            shape: 'spline',
            smoothing: 0.7,
        },
        type: 'scattergl',
        mode: 'lines+markers',
        textposition: 'top center',
    }

    var today = new Date();
    let sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(today.getMonth() - 6);

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
            range: [data.x[30], data.x[0]],
            rangeslider: {},
            fixedrange: true
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

    Plotly.newPlot(eeDraws, [drawData], layout, config);
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

function drawScoreDistributionsHeatmap(data) {
    let drawData = [{
        y: data.x,
        x: ["0-300", "301-350", "351-400", "401-410", "411-420", "421-430", "431-440", "441-450", "451-460", "461-470", "471-480", "481-490", "491-500", "501-600", "601-1200"],
        z: data.z.filter(arr => !arr.every(val => val === 0)).map(arr => arr.reverse()),
        // text: data.x,
        textposition: 'auto',
        type: 'heatmap',
        colorscale: 'Reds',
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

class ScoreDistributionOptionsModel {
    constructor(categories) {
        let allOption = 'All';
        let generalOption = 'General | No Program Specified';
        let selectedOptions = [];
        let computedCategories = Array.from(categories);

        computedCategories.unshift(generalOption);
        computedCategories.unshift(allOption);


        this.categories = ko.observableArray(computedCategories);
        this.selectedCategory = ko.observable();
        this.selectedCategory.subscribe(function (newValue) {
            switch (newValue) {
                case allOption:
                    selectedOptions = [];
                    break;
                case generalOption:
                    selectedOptions = ['General', 'No Program Specified'];
                    break;
                default:
                    selectedOptions = [newValue];
                    break;
            }

            drawCRSScoreHistory(preparedData, selectedOptions);
        });
    }
}

// Call the function to fetch and store the data
start();