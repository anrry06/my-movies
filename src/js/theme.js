class ThemeConfig {
    constructor() {
        this.themeChangeHandlers = [];
    }

    initTheme(theme) {
        if(theme){
            return this.displayTheme(theme);
        }
        this.displayTheme(this.detectTheme());
    }

    detectTheme() {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }

    displayTheme(theme) {
        document.body.setAttribute('data-theme', theme);
        for (let handler of this.themeChangeHandlers) {
            handler(theme);
        }
    }
}
