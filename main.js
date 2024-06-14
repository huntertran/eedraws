async function start() {
    const data = await fetchDataAndStore();
    draw(prepareData(data));
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
    Plotly.newPlot(eeDraws, [data], {
        margin: { t: 0 },
        xaxis: {
            title: {
                text: 'Draw Date'
            }
        },
        yaxis: {
            title: {
                text: 'CRS Score'
            },
            fixedrange: true
        }
    });
}

// Call the function to fetch and store the data
start();