// Depth-independent footer. Relies on window.PF set by nav.js; falls back to
// computing it here so footer works even if nav.js hasn't run yet.
if (!window.PF) {
    const p = location.pathname;
    const i = p.indexOf('/portfolio/');
    window.PF = i >= 0
        ? p.slice(0, i + '/portfolio/'.length)
        : p.slice(0, p.lastIndexOf('/') + 1) + 'portfolio/';
    window.ROOT = window.PF.slice(0, -'portfolio/'.length);
}

class footer_class extends HTMLElement {
    connectedCallback() {
        const PF = window.PF;
        this.innerHTML = `
        <footer class="footer">
            <h3 class="contact">CONTACT ME</h3>
            <ul class="links">
                <li class="Con_list"><a class="blog" rel="noopener" href="https://taystudios.com/blog/en/" target='_blank'><img id="Con-img" alt="MainBlog" src="${PF}resources/main/Blog.png" height="18" width="18"/> BLOG</a></li>
                <li class="Con_list"><a class="instagram" rel="noopener" href="https://www.instagram.com/lee_taehyuk/" target='_blank'><img id="Con-img" alt="Instagram" src="${PF}resources/main/Instagram.png" height="18" width="18"/> INSTAGRAM</a></li>
                <li class="Con_list"><a class="linkedin" rel="noopener" href="https://www.linkedin.com/in/taehyuk-lee-9b4179225/" target='_blank'><img id="Con-img" alt="linkedin" src="${PF}resources/main/linked-in.png" height="18" width="18"/> LINKED-IN</a></li>
                <li class="Con_list"><a class="github" rel="noopener" href="https://github.com/taehyuklee/" target='_blank'><img id="Con-img" alt="github" src="${PF}resources/main/github.png" height="18" width="18"/> GIT-HUB</a></li>
            </ul>
            <p>feel free to contact me!</p>
        </footer>
    `;
    }
}

customElements.define('footer-component', footer_class);
// Backwards-compatible aliases used by sub-pages and the index page.
customElements.define('other-footer-component', class extends footer_class {});
customElements.define('index-footer-component', class extends footer_class {});
