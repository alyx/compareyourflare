var targets = [
    {cdn: "cloudflare", host: "cloudflare.compareyourflare.com"},
    {cdn: "bunny", host: "bunny.compareyourflare.com"},
    {cdn: "fastly", host: "fastly.compareyourflare.com"},
    {cdn: "azure", host: "azure.compareyourflare.com"},
    {cdn: "azure (frontdoor)", host: "cyf.z01.azurefd.net"},
    {cdn: "akamai", host: "cyfakamai.azureedge.net"},
    {cdn: "verizon", host: "cyfverizon.azureedge.net"},
    {cdn: "verizon (premium)", host: "cyfverizonprem.azureedge.net"},
    {cdn: "direct", host: "direct.compareyourflare.com"}
]

const ITERATIONS = 20;
var statsReady = false;
var gResults = []

function newStatsRequest() {
    //button = document.getElementById('newstats')
    //parent = button.parentElement
    //button.remove()
    parent = document.getElementById('resultsTable')
    var progress = document.createElement('div')
    progress.classList.add('progress')
    progress.setAttribute('id', 'progresscontainer')
    progress.style.height = "100%"
    parent.appendChild(progress)
    var bar = document.createElement('div')
    bar.classList.add("progress-bar", "progress-bar-striped", "progress-bar-animated")
    bar.setAttribute("id", "statsbar")
    bar.setAttribute("role", "progressbar")
    bar.setAttribute("aria-valuenow", "0")
    bar.setAttribute("aria-valuemin", "0")
    bar.setAttribute("aria-valuemax", targets.length.toString())
    bar.style.width = "0%"
    bar.style.height = "2rem"
    bar.innerHTML = "Loading..."
    progress.appendChild(bar)
    /*
    <div class="progress">
  <div class="progress-bar progress-bar-striped progress-bar-animated" 
  role="progressbar" aria-valuenow="75" aria-valuemin="0" aria-valuemax="100" style="width: 75%"></div>
</div>
*/
    //button.disabled = true
    //button.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> <span id="currentTest">Loading...</span>'

    cta = document.getElementById('cta')
    form = document.getElementById('detailsform')
    cta.style.display = "none"
    form.style.display = "block"
    generateStats().then(results => { gResults = results; statsReady = true })
}

async function generateStats() {
    var results = []
    var fetchConfig = {
        method: 'GET',
        mode: 'no-cors',
        cache: 'no-cache',
    }
    
//    for (const target of targets) {
      for (var t = 0; t < targets.length; t++) {
        target = targets[t]
        //currentTest = document.getElementById('currentTest')
        //currentTest.innerHTML = target.cdn + "..."
        statsbar = document.getElementById('statsbar')
        statsbar.innerHTML = target.cdn
        statsbar.setAttribute("aria-valuenow", t+1)
        curr = ((100 * (t+1)) / targets.length).toFixed(0)
        console.log(curr)
        statsbar.style.width = curr.toString() + "%"
        // Warm the cache
        url = "https://" + target.host + "/jquery-3.6.0.min.js"
        await fetch(url, fetchConfig)
        for (var i = 0; i < ITERATIONS; i++) {
            var start = window.performance.now();
            await fetch(url, fetchConfig)
            var end = window.performance.now();
            results.push({ cdn: target.cdn, time: end - start, cache: true })
        }
        for (var i = 0; i < ITERATIONS; i++) {
            var start = window.performance.now();
            await fetch(url + "?nonce=" + start + i, fetchConfig)
            var end = window.performance.now();
            results.push({ cdn: target.cdn, time: end - start, cache: false })
        }
    }
    return results;
}

function displayStats(results) {
    var target = document.getElementById('resultsTable')
    var table = document.createElement('table')
    table.classList.add("table")
    var body = document.createElement('tbody')
    table.appendChild(body)
    var headerTr = document.createElement('tr')
    body.appendChild(headerTr)
    for (const column of ["CDN", "Cached", "Average Time"]) {
        var th = document.createElement('th')
        th.appendChild(document.createTextNode(column))
        headerTr.appendChild(th);
    }

    for (const row of targets) {
        for (cached of [true, false]) {
            var tr = document.createElement('tr')
            body.appendChild(tr)

            var cdnTd = document.createElement('td')
            cdnTd.appendChild(document.createTextNode(row.cdn))
            tr.append(cdnTd)

            var cacheTd = document.createElement('td')
            cacheTd.appendChild(document.createTextNode(cached.toString()))
            tr.append(cacheTd)

            i = 0
            for (r of results.filter(function (e) { return (e.cdn == row.cdn && e.cache == cached) })) {
                i = i+r.time
            }
            i = i/ITERATIONS
            var timeTd = document.createElement('td')
            timeTd.appendChild(document.createTextNode(i.toString()))
            tr.append(timeTd)
        }
    }
    target.appendChild(table)
    //button = document.getElementById('newstats')
    //button.remove()
    bar = document.getElementById('statsbar')
    bar.remove()
    header = document.getElementById('testBox')
    header.innerHTML = "Your Results"
    details = document.getElementById('testDetails')
    details.remove()
}