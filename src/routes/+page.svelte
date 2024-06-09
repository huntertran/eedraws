<script>
    // This example loads csv data as json using @rollup/plugin-dsv
    // import data from "./_data/points.csv";

    import CrsScores from "./_components/CrsScores.svelte";

    export let data;
    let rounds = data.rounds;
</script>

<!-- <h1>Welcome to Express Entry Draws Visualization</h1> -->
<CrsScores data={rounds} />

<style>
    /*
      The wrapper div needs to have an explicit width and height in CSS.
      It can also be a flexbox child or CSS grid element.
      The point being it needs dimensions since the <LayerCake> element will
      expand to fill it.
    */
    .chart-container {
        width: 100%;
        height: 300px;
    }
</style>
