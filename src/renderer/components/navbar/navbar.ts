/**
 * Navbar Component Controller
 * Event delegation for section navigation and dark mode toggle.
 */

import { eventBus } from '../event-bus';
import { STORAGE_KEYS } from '@/shared/constants/storage-keys';

export function showSection(sectionId: string): void {
    const targetSection = document.getElementById(sectionId);
    if (!targetSection) return;

    // Toggle active on containers
    document.querySelectorAll('.container').forEach(section => {
        section.classList.remove('active');
    });
    targetSection.classList.add('active');

    // Toggle active on menu links
    document.querySelectorAll('.menu-link').forEach(link => {
        link.classList.remove('active');
        const href = link.getAttribute('href');
        const dataSection = (link as HTMLElement).dataset.section;
        if (href === `#${sectionId}` || dataSection === sectionId) {
            link.classList.add('active');
        }
    });

    // Notify listeners via event bus
    eventBus.emit('tab:change', sectionId);
}

export function initNavbar(): void {
    const nav = document.querySelector('.navbar');
    if (!nav) return;

    // Event Delegation for Navigation Links
    nav.addEventListener('click', (e: Event) => {
        const target = e.target as HTMLElement;
        const link = target.closest('.menu-link') as HTMLAnchorElement | null;
        if (link) {
            e.preventDefault();
            const sectionId = link.dataset.section || link.getAttribute('href')?.replace('#', '');
            if (sectionId) {
                showSection(sectionId);
            }
        }
    });

    // Dark Mode Toggle
    const darkModeToggle = document.getElementById('darkModeToggle');
    if (darkModeToggle) {
        // Init state from storage
        const isDark = localStorage.getItem(STORAGE_KEYS.DARK_MODE) === 'true';
        if (isDark) {
            document.body.classList.add('dark-mode');
            darkModeToggle.innerHTML = '<i class="fas fa-sun"></i> Light Mode';
        }

        darkModeToggle.addEventListener('click', () => {
            document.body.classList.toggle('dark-mode');
            const currentDark = document.body.classList.contains('dark-mode');
            localStorage.setItem(STORAGE_KEYS.DARK_MODE, String(currentDark));
            darkModeToggle.innerHTML = currentDark
                ? '<i class="fas fa-sun"></i> Light Mode'
                : '<i class="fas fa-moon"></i> Dark Mode';
        });
    }

    // Expose showSection to global scope for Phase A backwards compatibility
    (window as unknown as { showSection: (id: string) => void }).showSection = showSection;
}
