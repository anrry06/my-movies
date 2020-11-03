'use strict';

const Movies = {
    options: {
        parent: null,
        count: 20,
        buttonClick: null,
        type: 'movie'
    },
    blocs: [],
    data: [],
    filtersBlock: null,
    searchBlock: null,

    init: function (options) {
        options = options || {};

        Movies.options = Object.assign(Movies.options, options);
        // Movies.loadData(function (data) {
            Movies.data = options.data;
            Movies.options.parent.innerHTML += Movies.getHtml();
            Movies.filtersBlock = new Filters({
                parent: document.querySelector('#filters-col')
            });

            Movies.searchBlock = new Search({
                parent: document.querySelector('#search-col')
            });

            Movies.randomBlock = new Random({
                parent: document.querySelector('#random-col')
            });

            for (let i = 0; i < Movies.data.length; i++) {
                let rp = new Blocks({
                    id: i,
                    parent: document.querySelector('#block-col' + i),
                    data: Movies.data[i],
                    type: Movies.options.type,
                    buttonClick: Movies.options.buttonClick
                });
                Movies.blocs.push(rp);
            }
        // });
    },

    loadData: function (next) {
        fetch('http://localhost:4444/data')
            .then(function (response) {
                response
                    .json()
                    .then(function (json) {
                        console.log(json);
                        next(json);
                    })
                    .catch(function (error) {
                        throw error;
                    });
            })
            .catch(function (error) {
                throw error;
            });
    },

    getHtml: function () {
        let blocs = '';
        for (let i = 0; i < Movies.data.length; i++) {
            blocs += `<div class="col-md block" id="block-col${i}"></div>`;
        }

        return `
            <div class="container-fluid" id="movies">
                <div class="row filters-container">
                    <div class="col-md" id="filters-col"></div>
                    <div class="col-md" id="search-col"></div>
                    <div class="col-md" id="random-col"></div>
                </div>
                <div id="blocks">
                    ${blocs}
                </div>
            </div>
        `;
    },
};

class Blocks {
    constructor(options) {
        options = options || {};

        let defaults = {
            parent: null,
            id: null,
            data: {},
            type: 'movie',
            buttonClick: null
        };
        this.options = Object.assign(defaults, options);

        this.options.parent.innerHTML += this.getHtml();

        this.el = document.querySelector(`#block-${this.options.id}`);

        this.loadElements();
        this.initEvents();
    }

    loadElements() {
        this.open = this.el.querySelector('.open');
    }

    initEvents() {
        this.open.onclick = this.onOpenClick;
    }

    onOpenClick = (e) => {
        e.preventDefault();
        if(this.options.type === 'movie'){
            let path = this.options.data.path;
            console.log(path);
            if(path !== ''){
                this.options.buttonClick(path);
            }
        }
        else {
            this.options.buttonClick(this.options.data.name);
        }
    };

    debug(...args) {
        console.log('ID: ' + this.options.id, ...args);
    }

    getHtml() {
        let imagePath = this.options.data.image.path === undefined ? 'images/no-cover.png' : this.options.data.image.path;
        let buttonLabel = this.options.type === 'movie' ? 'Open' : 'Search on Rarbgproxy.org';
        return `
            <div class="card" id="block-${this.options.id}" data-name="${this.options.data.name}">
                <img src="${imagePath}" loading="lazy" class="card-img-top" alt="...">
                <div class="card-body">
                    <h5 class="card-title">${this.options.data.name}</h5>
                    <p class="card-text">${this.options.data.year}</p>
                    <button data-path="${this.options.data.path}" class="btn btn-primary open">${buttonLabel}</button>
                </div>
            </div>
        `;
    }
}

class Filters {
    constructor(options) {
        options = options || {};

        let defaults = {
            parent: null,
            id: null,
            data: {},
        };
        this.options = Object.assign(defaults, options);

        this.options.parent.innerHTML += this.getHtml();

        this.el = document.querySelector(`#filters`);

        this.loadElements();
        this.initEvents();
    }

    loadElements() {
        this.numbers = this.el.querySelector('.numbers');
        this.letters = this.el.querySelectorAll('.letter');
    }

    initEvents() {
        this.numbers.onclick = this.onNumbersClick;
        this.letters.forEach(l => l.onclick = this.onLetterClick);
    }

    onNumbersClick = (e) => {
        e.preventDefault();
        this.letters.forEach(l => {
            l.classList.remove('btn-danger');
        });
        this.numbers.classList.toggle('btn-danger');
        let active = this.numbers.classList.contains('btn-danger');
        if(active){
            document.querySelectorAll('#blocks .card.hide').forEach(c => c.classList.remove('hide'));
            let cards = document.querySelectorAll('#blocks .card');
            cards.forEach(function(card){
                let name = card.getAttribute('data-name');
                if(!name.match(/^([0-9])/)){
                    card.classList.add('hide');
                }
            })
        }
        else {
            document.querySelectorAll('#blocks .card.hide').forEach(c => c.classList.remove('hide'));
        }
    };

    onLetterClick = (e) => {
        e.preventDefault();
        this.letters.forEach(l => {
            if(l !== e.target){
                l.classList.remove('btn-danger');
            }
        });
        this.numbers.classList.remove('btn-danger');
        e.target.classList.toggle('btn-danger');
        let active = e.target.classList.contains('btn-danger');
        if(active){
            document.querySelectorAll('#blocks .card.hide').forEach(c => c.classList.remove('hide'));
            let cards = document.querySelectorAll('#blocks .card');
            let letter = e.target.innerHTML;
            cards.forEach(function(card){
                let name = card.getAttribute('data-name');
                let reg = new RegExp(`^${letter}`, 'i')
                if(!reg.test(name)){
                    card.classList.add('hide');
                }
            })
        }
        else {
            document.querySelectorAll('#blocks .card.hide').forEach(c => c.classList.remove('hide'));
        }
    };

    getHtml() {
        let a='abcdefghijklmnopqrstuvwxyz'.split('');
        let letters = `<div class="btn-group" role="group" aria-label="Letters">`;
        for(let i = 0, l = a.length; i < l; i++){
            if(i%7 === 0){
                letters += `</div><div class="btn-group" role="group" aria-label="Letters">`;
            }
            let buttonClass = i%2 === 0 ? 'primary' : 'secondary';
            letters += `<button class="btn btn-${buttonClass} letter">${a[i]}</button>`;
        }
        letters += `</div>`;
        return `
            <div class="card" id="filters">
                <div class="card-body">
                    <ul class="list-group list-group-flush">
                        <li class="list-group-item"><button class="btn btn-primary numbers">1-9</button></li>
                        <li class="list-group-item">${letters}</li>
                    </ul>
                </div>
            </div>
        `;
    }
}

class Search {
    constructor(options) {
        options = options || {};

        let defaults = {
            parent: null,
            id: null,
            data: {},
        };
        this.options = Object.assign(defaults, options);

        this.options.parent.innerHTML += this.getHtml();

        this.el = document.querySelector(`#search`);

        this.loadElements();
        this.initEvents();
    }

    loadElements() {
        this.search = this.el.querySelector('.search');
    }

    initEvents() {
        this.search.onkeyup = this.onSearchKeyup;
    }

    onSearchKeyup = (e) => {
        document.querySelectorAll('#blocks .card.hideSearch').forEach(c => c.classList.remove('hideSearch'));
        let cards = document.querySelectorAll('#blocks .card');
        let search = e.target.value;
        cards.forEach(function(card){
            let name = card.getAttribute('data-name');
            let reg = new RegExp(search, 'i')
            if(!reg.test(name)){
                card.classList.add('hideSearch');
            }
        })
    }

    getHtml() {
        return `
            <div class="card" id="search">
                <div class="card-body">
                    <input type="text" class="form-control search" id="searchValue" placeholder="Search">
                </div>
            </div>
        `;
    }
}

class Random {
    constructor(options) {
        options = options || {};

        let defaults = {
            parent: null,
            id: null,
            data: {},
        };
        this.options = Object.assign(defaults, options);

        this.options.parent.innerHTML += this.getHtml();

        this.el = document.querySelector(`#random`);

        this.loadElements();
        this.initEvents();
    }

    loadElements() {
        this.random = this.el.querySelector('.random');
    }

    initEvents() {
        this.random.onclick = this.onRandomClick;
    }

    onRandomClick = (e) => {
        e.preventDefault();
        let cards = document.querySelectorAll('#blocks .card');
        cards.forEach(c => c.classList.remove('hideSearch', 'hide'));
        const randomElement = cards[Math.floor(Math.random() * cards.length)];
        cards.forEach(c => {
            if(c !== randomElement){
                c.classList.add('hide')
            }
        });
    }

    getHtml() {
        return `
            <div class="card" id="random">
                <div class="card-body">
                    <button class="btn btn-primary random">Random</button>
                </div>
            </div>
        `;
    }
}

const utils = {
    setButtonClass(el, cls) {
        let classes = [
            'btn-danger',
            'btn-info',
            'btn-warning',
            'btn-success',
            'btn-dark',
        ];
        el.classList.remove(...classes);
        el.classList.add(cls);
    },
};
