

const https = require('https');
const cheerio = require('cheerio');


let helpers = {}

helpers.yearSimilar = function(parsedYear, altYear) {
    if (!parsedYear || !altYear) return true
    else {
        parsedYear = parseInt(parsedYear)
        altYear = parseInt(altYear)
        if (altYear >= parsedYear -1 && altYear <= parsedYear +1)
            return true
    }
    return false
}

helpers.levenshteinDistance = function(s1, s2) {

    function editDistance(s1, s2) {
      s1 = s1.toLowerCase()
      s2 = s2.toLowerCase()
    
      let costs = new Array()

      for (let i = 0; i <= s1.length; i++) {
        let lastValue = i
        for (let j = 0; j <= s2.length; j++) {
          if (i === 0)
            costs[j] = j
          else {
            if (j > 0) {
              let newValue = costs[j - 1]
              if (s1.charAt(i - 1) !== s2.charAt(j - 1))
                newValue = Math.min(Math.min(newValue, lastValue), costs[j]) + 1
              costs[j - 1] = lastValue
              lastValue = newValue
            }
          }
        }
        if (i > 0)
          costs[s2.length] = lastValue
      }
      return costs[s2.length]
    }

    let longer = s1
    let shorter = s2

    if (s1.length < s2.length) {
        longer = s2
        shorter = s1
    }

    let longerLength = longer.length

    if (longerLength === 0)
        return 1.0

    return (longerLength - editDistance(longer, shorter)) / parseFloat(longerLength)
}

helpers.sanitizeName = function(name) {
    return name.replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase().replace('the ','')
}

helpers.nameSimilar = function(parsedName, altName) {
    if (!parsedName || !altName) return 0
    else {
        parsedName = helpers.sanitizeName(parsedName)
        altName = helpers.sanitizeName(altName)
        if (parsedName === altName) return 1
        else return helpers.levenshteinDistance(parsedName, altName)
    }
}

helpers.nameAlmostSimilar = function(parsedName, altName) {
    if (!parsedName || !altName) return false
    else {
        parsedName = helpers.sanitizeName(parsedName)
        altName = helpers.sanitizeName(altName)
        if (parsedName.startsWith(altName) || parsedName.endsWith(altName) || altName.startsWith(parsedName) || altName.endsWith(parsedName))
            return true
    }
    return false
}

// Utility to reduce the name to it's most basic form

helpers.simplifyName = function(args) { 
    if (!args || !args.name)
      return null

    let name = args.name.toLowerCase()
        .trim()
        .replace(/\([^\(]+\)$/, '') // remove brackets at end
        .replace(/&/g, "and") // unify & vs "and"
        .replace(/[^0-9a-z ]+/g, ' ') // remove any special characters
        .split(' ')
        .filter(function(r){ return r })
        .join(' ') // remove any aditional whitespaces

    if (args.year && name.endsWith(' ' + args.year))
        name = name.replace(new RegExp(' ' + args.year + '$', 'i'), '')

    return name

}

let imdb = {
    searchKeys: [
        {
            'name': 'title',
            'search': '#title-overview-widget > div.vital > div.title_block > div > div.titleBar > div.title_wrapper > h1',
            'type': 'text'
        },
        {
            'name': 'year',
            'search': '#titleYear > a',
            'type': 'text'
        },
        {
            'name': 'contentRating',
            'search': '#title-overview-widget > div.vital > div.title_block > div > div.titleBar > div.title_wrapper > div > meta',
            'type': 'attribute',
            'attribute': 'content'
        },
        {
            'name': 'runtime',
            'search': '#title-overview-widget > div.vital > div.title_block > div > div.titleBar > div.title_wrapper > div > time',
            'type': 'text'
        },
        {
            'name': 'description',
            'search': '#title-overview-widget > div.plot_summary_wrapper > div.plot_summary > div.summary_text',
            'type': 'text',
            'alernative': {
                'search': '#title-overview-widget > div.minPosterWithPlotSummaryHeight > div.plot_summary_wrapper > div.plot_summary.minPlotHeightWithPoster > div.summary_text',
                'type': 'text'
            }
        },
        {
            'name': 'rating',
            'search': '#title-overview-widget > div.vital > div.title_block > div > div.ratings_wrapper > div.imdbRating > div.ratingValue > strong > span',
            'type': 'text'
        },
        {
            'name': 'poster',
            'search': '#title-overview-widget > div.vital > div.slate_wrapper > div.poster > a > img',
            'type': 'attribute',
            'attribute': 'src',
            'alernative': {
                'search': '#title-overview-widget > div.minPosterWithPlotSummaryHeight > div.poster > a > img',
                'type': 'attribute',
                'attribute': 'src'
            }
        },
        {
            'name': 'director',
            'search': '#title-overview-widget > div.plot_summary_wrapper > div.plot_summary > div:nth-child(2) > span > a > span',
            'type': 'text',
            'alernative': {
                'search': '#title-overview-widget > div.minPosterWithPlotSummaryHeight > div.plot_summary_wrapper > div.plot_summary.minPlotHeightWithPoster > div:nth-child(2) > span > a > span',
                'type': 'text'
            }
        },
        {
            'name': 'metascore',
            'search': '#title-overview-widget > div.plot_summary_wrapper > div.titleReviewBar > div:nth-child(1) > a > div > span',
            'type': 'text'
        },
        {
            'name': 'writer',
            'search': '#title-overview-widget > div.plot_summary_wrapper > div.plot_summary > div:nth-child(3) > span:nth-child(2) > a > span',
            'type': 'text',
            'alernative': {
                'search': '#title-overview-widget > div.minPosterWithPlotSummaryHeight > div.plot_summary_wrapper > div.plot_summary.minPlotHeightWithPoster > div:nth-child(3) > span:nth-child(2) > a > span',
                'type': 'text'
            }
        },
        {
            'name': 'genre',
            'search': '#title-overview-widget > div.vital > div.title_block > div > div.titleBar > div.title_wrapper > div',
            'type': 'text'
        },
    ],

    getMovieById: (id) => {
        return new Promise((resolve, reject) => {
            https.get('https://www.imdb.com/title/' + id + '/', res => {
                let data = ""

                res.on("data", d => {
                    data += d
                })
                res.on("end", () => {
                    data = data.replace(/(\r\n|\n|\r)/gm, "").replace(/ +(?= )/g, '');

                    let QS = cheerio.load(data);

                    let parseSearchKeys = sk => {
                        let element = QS(sk.search);
                        let result = null;
                        if (sk.type === 'text' && element) {
                            result = element.text();
                        }
                        else if (sk.type === 'attribute' && element) {
                            result = element.attr(sk.attribute);
                        }

                        if (result === null && sk.alernative) {
                            return parseSearchKeys(sk.alernative);
                        }

                        if (result && result !== null) {
                            result = result.split(/\n/).map(s => s.trim()).join('').trim();
                        }
                        return result;
                    };
                    let movie = {};
                    imdb.searchKeys.forEach(sk => {
                        let result = parseSearchKeys(sk);
                        if (sk.name === 'title') {
                            result = result.replace(/\(\d+\)/g, '').trim();
                        }
                        if (sk.name === 'genre') {
                            let split = result.split('|');
                            if (split[2] !== null) {
                                result = split[2].split(',').map(s => s.replace(/\n/g, '').replace(/\s\s/g, ' ').trim());
                            }
                            else {
                                result = null;
                            }
                        }
                        movie[sk.name] = result;
                    });

                    resolve(movie);
                })
            })
                .on("error", reject)
                .end();
        });
    },

    getActorById: function (id) {
        return new Promise((resolve, reject) => {
            https.get('http://www.imdb.com/name/' + id + '/', res => {
                let data = ""

                res.on("data", d => {
                    data += d
                })
                res.on("end", () => {
                    let $ = cheerio.load(data.replace(/(\r\n|\n|\r)/gm, "").replace(/ +(?= )/g, ''));
                    let name = data.match(/<span class="itemprop" itemprop="name">([a-z0-9_ ]+)<\/span>/i)[1];

                    let moviesList = [];
                    let tvList = [];
                    $ = cheerio.load(data);

                    $("div.filmo-row").each(function (i, element) {
                        if (element.attribs.id.split("-", 2)[0] === "actor" || element.attribs.id.split("-", 2)[0] === "actress") {
                            let movie = element.children[0].next.next.next.children[0].children[0].data;
                            let nextWord = element.children[0].next.next.next.children[0].children[0].parent.parent.next.data;
                            if (!(nextWord.length > 1)) {
                                moviesList.push(movie);
                            } else {
                                tvList.push(movie);
                            }
                        }
                    });

                    resolve({
                        name: name || "N/A",
                        moviesList: moviesList || "N/A",
                        tvList: tvList || "N/A"
                    });

                })
            })
                .on("error", reject)
                .end();
        });
    },

    matchSimilar: function(results, task) {
        // similarity target for levenshtein distance
        let similarityGoal = 0.6

        let pick, secondBest, firstResult

        results.some(function(result) {

            // make result readable, the imdb result keys make no sense otherwise
            let res = {
                id: result.id,
                name: result.l,
                year: result.y,
                type: result.q,
                yearRange: result.yr,
                image: result.i ? {
                    src: result.i[0],
                    width: result.i[1],
                    height: result.i[2]
                } : undefined,
                starring: result.s,
            }

            let movieMatch = task.type === 'movie' && (res.type === 'feature' || res.type === 'TV movie')

            let seriesMatch = task.type === 'series' && ['TV series', 'TV mini-series'].indexOf(res.type) > -1

            if (!task.type || movieMatch || seriesMatch) {

                if (helpers.yearSimilar(task.year, res.year)) {

                    // try to match by levenshtein distance
                    let similarity = helpers.nameSimilar(task.name, res.name)

                    if (similarity > similarityGoal) {
                        if (!pick || (pick && similarity > pick.similarity)) {
                            pick = res
                            pick.similarity = similarity
                        }
                    }

                    // fallback to non-levenshtein distance logic:
                    // if the result name includes the task name or vice-versa (at end or start)
                    if (!secondBest && helpers.nameAlmostSimilar(task.name, res.name))
                        secondBest = res

                    // if nothing else is found, pick first result
                    // (because what we're searching for might be the alternative name of the first result)
                    // this is ignored if strict mode enabled
                    if (!firstResult && !task.strict)
                        firstResult = res
                }

            }
        })

        // if pick doesn't include the task name (because it's only the most similar textually)
        // then pick the second best result (because it does)
        // example scenario:
        // task.name = 'Ghost Hound'
        // pick.name = 'Ghost Hunt'
        // secondBest.name = 'Shinreigari: Ghost Hound'

        if (secondBest && pick) {
            if (!helpers.nameAlmostSimilar(task.name, pick.name))
                pick = secondBest
        }

        return pick || secondBest || firstResult || null;
    },

    findMovieBySearch: function(options, retryed){
        return new Promise((resolve, reject) => {
            let search = options.name + (options.year ? ' ' + options.year : '');
            let url = 'https://sg.media-imdb.com/suggests/' + search.charAt(0).toLowerCase() + '/' + encodeURIComponent(search)  + '.json'

            https.get(url, res => {
                let data = ""

                res.on("data", d => {
                    data += d
                })
                res.on("end", () => {
                    let imdbParse = JSON.parse(data.match(/{.*}/g))

                    let results = imdbParse.d;

                    let matchResult = imdb.matchSimilar(results, options);
                    if(matchResult){
                        return resolve(matchResult)
                    }

                    if(!retryed){
                        return imdb.findMovieBySearch(options, true);
                    }

                    return resolve();
                })
            })
                .on("error", reject)
                .end();

        })
    }
    
};

module.exports = imdb;