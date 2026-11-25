import { eventBus } from '@/utils/event-bus';
import { isDarkMode, setDarkMode } from '@/services/storage.service';
import { router } from '@/router';
import { getLucideIcon } from '@/utils/icons';

export function showSection(sectionId: string): void {
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) return;

    document.querySelectorAll('.container').forEach(section => {
        section.classList.remove('active');
    });
    targetSection.classList.add('active');

    document.querySelectorAll('.menu-link').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        const dataSection = (link as HTMLElement).dataset.section;
        if (href === `#${sectionId}` || dataSection === sectionId) {
            link.classList.add('active');
        }
    });

    eventBus.emit('tab:change', sectionId);
}

export function initNavbar(): void {
    const nav = document.querySelector('.navbar');
    if (!nav) return;

    nav.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        const link = target.closest('.menu-link') as HTMLAnchorElement | null;
        if (link) {
            e.preventDefault();
            const sectionId = link.dataset.section || link.getAttribute('href')?.replace('#', '');
            if (sectionId) {
                router.navigate(sectionId);
            }
        }
    });

    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        if (isDarkMode()) {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = `${getLucideIcon('sun', 'lucide-icon theme-icon', 16)} <span class="theme-label">Giao diện</span>`;
        }

        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const currentDark = document.body.classList.contains('dark-mode');
            setDarkMode(currentDark);
            darkModeToggle.innerHTML = currentDark
                ? `${getLucideIcon('sun', 'lucide-icon theme-icon', 16)} <span class="theme-label">Giao diện</span>`
                : `${getLucideIcon('moon', 'lucide-icon theme-icon', 16)} <span class="theme-label">Giao diện</span>`;
        });
    }
}
