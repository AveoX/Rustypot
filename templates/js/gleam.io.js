(function () {
    if (document.querySelectorAll) {
        var base = "https://js.gleam.io",
            defaultImage = "https://js.gleam.io/images/logo.png",
            elems = document.querySelectorAll('a.e-gleam, a.e-widget');

        for (var i = 0; i < elems.length; i++) {
            var elem = elems[i],
                loadingText = elem.getAttribute('data-loading-text') || 'Loading...',
                key = elem.href.match(/(?:\/|%2f)([a-z0-9]{5})(?:\/|%2f)/i, '/')[1],
                replacement = document.createElement('div');
            if(('' + elem.className).match(/generic-loader/) || !defaultImage) {
              replacement.innerHTML = "<div><div class='e-widget-fc'><div class='e-widget-c1 e-widget-c'></div><div class='e-widget-c2 e-widget-c'></div><div class='e-widget-c3 e-widget-c'></div><div class='e-widget-c4 e-widget-c'></div><div class='e-widget-c5 e-widget-c'></div><div class='e-widget-c6 e-widget-c'></div><div class='e-widget-c7 e-widget-c'></div><div class='e-widget-c8 e-widget-c'></div><div class='e-widget-c9 e-widget-c'></div><div class='e-widget-c10 e-widget-c'></div><div class='e-widget-c11 e-widget-c'></div><div class='e-widget-c12 e-widget-c'></div></div></div>";
            } else {
              replacement.innerHTML = "<div><img class='app-spin' src='" + defaultImage + "'/> "+loadingText+"</div>";
            }
            replacement.className = "GleamEmbed" + key + " e-widget-preloader";
            elem.parentNode.replaceChild(replacement, elem);
            if (!document.getElementById("e-widget-preload-styles")) {
                var c = document.createElement('style'),
                    css = "html body .e-widget-preloader,html body iframe.e-embed-frame{box-shadow:0 0 2px rgba(0,0,0,0.3),0 3px 5px rgba(0,0,0,0.2);width:100%;max-width:540px;min-width:320px;margin:0 auto 20px;display:block;float:none;background:white}html body .e-widget-preloader\u003ediv{line-height:200px;font-size:30px;text-align:center;font-family:sans-serif;color:#666}html body .e-widget-preloader\u003e*\u003eimg{vertical-align:middle !important;height:74px !important;width:74px !important;margin:0 10px 0 0 !important;border:none !important;display:inline-block !important;float:none !important}html body .e-widget-preloader\u003ediv\u003eimg.app-spin{-webkit-animation:app-spin 2s infinite linear;animation:app-spin 2s infinite linear} @-moz-keyframes app-spin{from{-moz-transform:rotate(0deg)}to{-moz-transform:rotate(360deg)}}@-webkit-keyframes app-spin{from{-webkit-transform:rotate(0deg)}to{-webkit-transform:rotate(360deg)}}@keyframes app-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}html body .e-widget-fc{width:74px;height:74px;position:relative;display:inline-block;vertical-align:middle;margin:0 16px 0 0 !important}.e-widget-fc .e-widget-c{width:100%;height:100%;position:absolute;left:0;top:0}.e-widget-fc .e-widget-c:before{content:'';display:block;margin:0 auto;width:15%;height:15%;background-color:#333;border-radius:100%;-webkit-animation:e-widget-cFadeDelay 1.2s infinite ease-in-out both;animation:e-widget-cFadeDelay 1.2s infinite ease-in-out both}.e-widget-fc .e-widget-c2{-webkit-transform:rotate(30deg);transform:rotate(30deg)}.e-widget-fc .e-widget-c2:before{-webkit-animation-delay:-1.1s;animation-delay:-1.1s}.e-widget-fc .e-widget-c3{-webkit-transform:rotate(60deg);transform:rotate(60deg)}.e-widget-fc .e-widget-c3:before{-webkit-animation-delay:-1s;animation-delay:-1s}.e-widget-fc .e-widget-c4{-webkit-transform:rotate(90deg);transform:rotate(90deg)}.e-widget-fc .e-widget-c4:before{-webkit-animation-delay:-0.9s;animation-delay:-0.9s}.e-widget-fc .e-widget-c5{-webkit-transform:rotate(120deg);transform:rotate(120deg)}.e-widget-fc .e-widget-c5:before{-webkit-animation-delay:-0.8s;animation-delay:-0.8s}.e-widget-fc .e-widget-c6{-webkit-transform:rotate(150deg);transform:rotate(150deg)}.e-widget-fc .e-widget-c6:before{-webkit-animation-delay:-0.7s;animation-delay:-0.7s}.e-widget-fc .e-widget-c7{-webkit-transform:rotate(180deg);transform:rotate(180deg)}.e-widget-fc .e-widget-c7:before{-webkit-animation-delay:-0.6s;animation-delay:-0.6s}.e-widget-fc .e-widget-c8{-webkit-transform:rotate(210deg);transform:rotate(210deg)}.e-widget-fc .e-widget-c8:before{-webkit-animation-delay:-0.5s;animation-delay:-0.5s}.e-widget-fc .e-widget-c9{-webkit-transform:rotate(240deg);transform:rotate(240deg)}.e-widget-fc .e-widget-c9:before{-webkit-animation-delay:-0.4s;animation-delay:-0.4s}.e-widget-fc .e-widget-c10{-webkit-transform:rotate(270deg);transform:rotate(270deg)}.e-widget-fc .e-widget-c10:before{-webkit-animation-delay:-0.3s;animation-delay:-0.3s}.e-widget-fc .e-widget-c11{-webkit-transform:rotate(300deg);transform:rotate(300deg)}.e-widget-fc .e-widget-c11:before{-webkit-animation-delay:-0.2s;animation-delay:-0.2s}.e-widget-fc .e-widget-c12{-webkit-transform:rotate(330deg);transform:rotate(330deg)}.e-widget-fc .e-widget-c12:before{-webkit-animation-delay:-0.1s;animation-delay:-0.1s}@-webkit-keyframes e-widget-cFadeDelay{0%, 39%, 100%{opacity:0}40%{opacity:1}}@keyframes e-widget-cFadeDelay{0%, 39%, 100%{opacity:0}40%{opacity:1}}.e-widget-spinner{width:60px;height:60px;margin:25px auto 0;position:relative;display:block;background-image:-owg-linear-gradient(to right, #6D9FD5 0%, #69C5E5 14%, #D5D66D 28%, #CDDC38 42%, #F2C32E 56%, #F3852F 70%, #F36A22 84%, #F36A22 100%);background-image:-webkit-linear-gradient(to right, #6D9FD5 0%, #69C5E5 14%, #D5D66D 28%, #CDDC38 42%, #F2C32E 56%, #F3852F 70%, #F36A22 84%, #F36A22 100%);background-image:-moz-linear-gradient(to right, #6D9FD5 0%, #69C5E5 14%, #D5D66D 28%, #CDDC38 42%, #F2C32E 56%, #F3852F 70%, #F36A22 84%, #F36A22 100%);background-image:-o-linear-gradient(to right, #6D9FD5 0%, #69C5E5 14%, #D5D66D 28%, #CDDC38 42%, #F2C32E 56%, #F3852F 70%, #F36A22 84%, #F36A22 100%);background-image:linear-gradient(to right, #6D9FD5 0%, #69C5E5 14%, #D5D66D 28%, #CDDC38 42%, #F2C32E 56%, #F3852F 70%, #F36A22 84%, #F36A22 100%);border-radius:100%;z-index:1;animation:e-widget-spinner 400ms linear infinite}.e-widget-spinner:before,.e-widget-spinner:after{position:absolute;top:0;left:0;background-color:#fff;content:''}.e-widget-spinner:before{width:54px;height:54px;top:3px;left:3px;border-radius:100%}.e-widget-spinner:after{width:60px;height:30px}@-moz-keyframes e-widget-spinner{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@-webkit-keyframes e-widget-spinner{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}@keyframes e-widget-spinner{0%{transform:rotate(0deg)}100%{transform:rotate(360deg)}}";
                c.setAttribute('id', 'e-widget-preload-styles');
                c.setAttribute("type", "text/css");
                if(c.styleSheet) {
                    c.styleSheet.cssText = css
                } else {
                    c.textContent = css;
                }
                document.getElementsByTagName('head')[0].appendChild(c);
            }
            var g = document.createElement('script'), s = document.getElementsByTagName('script')[0];
            var extras = [];
            if(('' + elem.className).match(/no-button/)) {
                extras.push("no_button");
            }
            if(('' + elem.className).match(/xdga/)) {
                extras.push("xdga");
            }

            g.src = base + '/' + key + '/embed.js' + (extras.length > 0 ? ("?" + extras.join("&")) : '');
            s.parentNode.insertBefore(g, s);
        }
    }
})();