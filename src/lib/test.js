let imdb = require('./imdb');
// console.time('getMovieById');
// imdb.getMovieById('tt0120617', (error, data) => {
//     console.timeEnd('getMovieById');
//     console.log(error, data);
// })

// console.time('findMovieBySearch');
// imdb.findMovieBySearch({
//     name: 'Bravo Two Zero',
//     type: 'movie',
//     year: '1999'
// }, (error, data) => {
//     console.timeEnd('findMovieBySearch');
//     console.log(error, data);
// })

let test = async () => {
    try {
        let imdbData = await imdb.getMovieById('tt0120617');
        console.log(imdbData);
    } catch (error) {
        throw error;
    }
}

test();