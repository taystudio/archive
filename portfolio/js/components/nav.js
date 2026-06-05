// Depth-independent path helpers — work no matter how deep the page is nested
// (portfolio/html/, portfolio/html/document/, portfolio/html/document/posts/, …)
// and whether the site is served from the domain root or a project subpath.
// Attached to window (not `const`) so footer.js/header.js can share these without
// redeclaration collisions in the shared classic-script global scope.
if (!window.PF) {
    const p = location.pathname;
    const i = p.indexOf('/portfolio/');
    window.PF = i >= 0
        ? p.slice(0, i + '/portfolio/'.length)              // ".../portfolio/"
        : p.slice(0, p.lastIndexOf('/') + 1) + 'portfolio/'; // root page (index.html)
    window.ROOT = window.PF.slice(0, -'portfolio/'.length);  // ".../"
}

class nav_class extends HTMLElement {
    connectedCallback() {
        const PF = window.PF, ROOT = window.ROOT;
        this.innerHTML =
        '<nav class="navigator">' +
        `<h3 class="site-name"><a href="${PF}html/TAYLEE Home.html">TAYLEE's <a class="name-archive">Archive</a></a></h3>` +
        '<ul class="menu_ul">' +
            '<li class="list_menu"><a id="dropdownButton" class="dropbtn" onclick="">Home</a>' +
                '<div id="dropdownContent" class="dropdown-content">' +
                    `<a class="nav_menu" href="${PF}html/TAYLEE Home.html">Portfolio</a>` +
                    `<a class="nav_menu" href="${ROOT}index.html">Main Page</a>` +
                '</div></li>' +
            `<li class="list_menu"><a class="nav_menu" href="${PF}html/TAYLEE Info.html">Info</a></li>` +
            `<li class="list_menu"><a class="nav_menu" href="${PF}html/TAYLEE documents.html">Documents</a></li>` +
            `<li class="list_menu"><a class="nav_menu" href="${PF}html/TAYLEE research.html">Research</a></li>` +
            `<li class="list_menu"><a class="nav_menu" href="${PF}html/TAYLEE project.html">Project</a></li>` +
        '</ul>' +
        '<a href="#" class="nav__toogle">' +
        `<i class="hamburger"><img id="ham_menu" alt="hamburger" src="${PF}resources/main/hamburger menu.png" width=24 height=24></i>` +
        '</a>' +
        '</nav>';
    }
}

customElements.define('nav-component', nav_class);
// Backwards-compatible alias used by sub-pages; now identical (depth-independent).
customElements.define('other-nav-component', class extends nav_class {});
