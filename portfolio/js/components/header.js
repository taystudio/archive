
class common_header_class extends HTMLElement{
    connectedCallback(){
        // depth-independent site root (works at any nesting depth and on subpath deploys),
        // mirroring nav.js. Falls back to a local computation when nav.js isn't present (index.html).
        var root = window.ROOT;
        if (!root) {
            var p = location.pathname;
            var i = p.indexOf('/portfolio/');
            root = i >= 0 ? p.slice(0, i + 1) : p.slice(0, p.lastIndexOf('/') + 1);
        }
        this.innerHTML =`
        <head>
            <meta charset="UTF-8">
            <meta http-equiv="X-UA-Compatible" content="IE=edge">
            <!--<meta name="viewport" content="width=device-width, initial-scale=1.0">-->

            <!-- Favicon (custom TAYLEE monogram) -->
            <link rel="icon" type="image/svg+xml" href="${root}favicon.svg">
            <link rel="icon" type="image/png" sizes="32x32" href="${root}favicon-32x32.png">
            <link rel="icon" type="image/png" sizes="16x16" href="${root}favicon-16x16.png">
            <link rel="icon" href="${root}favicon.ico" sizes="any">
            <link rel="apple-touch-icon" href="${root}apple-touch-icon.png">
            <meta name="theme-color" content="#04263f">

            <!--google font Montserrat-->
            <link href="https://fonts.googleapis.com/css2?family=Montserrat:ital
            ,wght@0,300;0,400;0,500;0,600;0,700;1,300;1,400;1,500;1,600;1,700&display=swap"
            rel="stylesheet">

            <!-- Google font -->
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@100;300;400;500;700;900&display=swap" 
            rel="stylesheet">

            <!-- Noto Sans -->
            <link href="https://fonts.googleapis.com/css2?family=Noto+Sans:wght@700&display=swap" rel="stylesheet">

            <!-- Latex -->
            <script type="text/x-mathjax-config">
                MathJax.Hub.Config({            
                    tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']]}            
                });
            </script>
            <script src='https://cdnjs.cloudflare.com/ajax/libs/mathjax/2.7.5/latest.js?config=TeX-MML-AM_CHTML' async></script>

        </head>
        `
    }
}

customElements.define('common-header-component', common_header_class);