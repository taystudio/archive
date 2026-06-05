// Cover page (index.html) — minimal behaviour
// Mark JS active so reveal-on-scroll hidden states apply (no-JS shows everything).
document.documentElement.classList.add('cv-js');
document.addEventListener('DOMContentLoaded', function () {
    document.body.classList.add('cv-js');
    // Smooth-scroll for the "Explore" cue
    var cue = document.querySelector('.cv-scroll');
    var target = document.getElementById('cv-explore');
    if (cue && target) {
        cue.addEventListener('click', function (e) {
            e.preventDefault();
            target.scrollIntoView({ behavior: 'smooth' });
        });
    }

    // Reveal cards on scroll
    var reveal = document.querySelectorAll('.cv-card, .cv-explore__title, .cv-explore__eyebrow');
    if ('IntersectionObserver' in window && reveal.length) {
        var io = new IntersectionObserver(function (entries) {
            entries.forEach(function (en) {
                if (en.isIntersecting) {
                    en.target.classList.add('is-in');
                    io.unobserve(en.target);
                }
            });
        }, { threshold: 0.15 });
        reveal.forEach(function (c) { io.observe(c); });
    } else {
        reveal.forEach(function (c) { c.classList.add('is-in'); });
    }
});
