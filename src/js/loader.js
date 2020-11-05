module.exports = {
    display: function(data){
        let msg = data.join(' ');
        let loader = document.querySelector('#loader');
        let html = `
            <div class="alert alert-info" role="alert">
                ${msg}
            </div>
        `;
        loader.innerHTML = html + loader.innerHTML;
    },

    hide: function(){
        $(() => {
            $('#overlay').fadeOut(500);
            $('#loader-container').fadeOut(500);
        })
    }
};