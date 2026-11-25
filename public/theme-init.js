(function () {
    try {
        var isDark = localStorage.getItem('darkMode') === 'true';
        if (isDark) {
            document.documentElement.classList.add('dark-mode');
        }
        var themeMeta = document.querySelector('meta[name="theme-color"]');
        if (themeMeta) {
            themeMeta.setAttribute('content', isDark ? '#0f1012' : '#1e7e48');
        }
        if (isDark && document.body) {
            document.body.classList.add('dark-mode');
        } else if (isDark) {
            document.addEventListener('DOMContentLoaded', function () {
                if (document.body) {
                    document.body.classList.add('dark-mode');
                }
            }, { once: true });
        }
    } catch (_e) {
    }
})();
