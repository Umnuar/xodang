import { eventBus } from '@/utils/event-bus';
import { isDarkMode, setDarkMode } from '@/services/storage.service';
import { router } from '@/router';
import { getLucideIcon } from '@/utils/icons';
import { openOnboarding } from '@/features/onboarding/onboarding';

export function setActiveNavLink(sectionId: string): void {
    document.querySelectorAll('.menu-link').forEach(link => {
        const href = link.getAttribute('href');
        const dataSection = (link as HTMLElement).dataset.section;
        const isActive = href === `#${sectionId}` || dataSection === sectionId;
        link.classList.toggle('active', isActive);
        if (isActive) {
            link.setAttribute('aria-current', 'page');
        } else {
            link.removeAttribute('aria-current');
        }
    });
}

function applyThemeUI(darkModeToggle: HTMLElement | null, isDark: boolean): void {
    document.documentElement.classList.toggle('dark-mode', isDark);
    document.body.classList.toggle('dark-mode', isDark);

    const themeMeta = document.querySelector('meta[name="theme-color"]');
    if (themeMeta) {
        themeMeta.setAttribute('content', isDark ? '#0f1012' : '#1e7e48');
    }

    if (darkModeToggle) {
        darkModeToggle.setAttribute('aria-pressed', String(isDark));
        darkModeToggle.innerHTML = isDark
            ? `${getLucideIcon('sun', 'lucide-icon theme-icon', 16)} <span class="theme-label">Chế độ sáng</span>`
            : `${getLucideIcon('moon', 'lucide-icon theme-icon', 16)} <span class="theme-label">Chế độ tối</span>`;
    }
}

export function showSection(sectionId: string): void {
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) return;
    if (targetSection.classList.contains('active')) {
        setActiveNavLink(sectionId);
        return;
    }

    document.querySelectorAll('.container').forEach(section => {
        section.classList.remove('active');
    });
    targetSection.classList.add('active');

    setActiveNavLink(sectionId);

    if (typeof window.scrollTo === 'function') {
        window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior });
    }

    eventBus.emit('tab:change', sectionId);
}

export function initNavbar(): void {
    const navContainers = document.querySelectorAll('.navbar, .mobile-bottom-nav');
    if (navContainers.length === 0) return;

    const handleNavClick = (e: Event): void => {
        const target = e.target as HTMLElement;
        const link = target.closest('.menu-link') as HTMLAnchorElement | null;
        if (link) {
            e.preventDefault();
            const sectionId = link.dataset.section || link.getAttribute('href')?.replace('#', '');
            if (sectionId) {
                router.navigate(sectionId);
            }
        }
    };

    navContainers.forEach(container => {
        container.addEventListener('click', handleNavClick);
    });

    const openOnboardingBtn = document.getElementById('openOnboardingBtn');
    openOnboardingBtn?.addEventListener('click', () => {
        openOnboarding();
    });

    const footerOnboardingBtn = document.getElementById('footerOnboardingBtn');
    footerOnboardingBtn?.addEventListener('click', () => {
        openOnboarding();
    });

    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        applyThemeUI(darkModeToggle, isDarkMode());

        darkModeToggle.addEventListener('click', () => {
            const nextDark = !document.documentElement.classList.contains('dark-mode');
            setDarkMode(nextDark);
            applyThemeUI(darkModeToggle, nextDark);
        });
    }
}
