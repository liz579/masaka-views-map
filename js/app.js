let platMap;

document.addEventListener('DOMContentLoaded', async function() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const mapWrapper = document.getElementById('mapWrapper');
    const categoryButtons = document.querySelectorAll('.category-btn');
    const legendButtons = document.querySelectorAll('.legend-button');
    const zoomSliderDesktop = document.getElementById('zoomSliderDesktop');
    const zoomSliderMobile = document.getElementById('zoomSliderMobile');

    // Initialize the map
    platMap = new PlatMap('mapWrapper', 'detailsContent');

    try {
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');
        loadingIndicator.classList.add('loading-flash');
        if (mapWrapper) mapWrapper.classList.add('loading-flash');

        // Load SVG map
        await platMap.loadSVG('svg/map.svg');

        // Load lot data from Google Sheet
        await platMap.loadLotData();

        // Hide loading indicator
        loadingIndicator.classList.add('hidden');
        loadingIndicator.classList.remove('loading-flash');
        if (mapWrapper) mapWrapper.classList.remove('loading-flash');

        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
        loadingIndicator.innerHTML = '<span style="color: red;">❌ Error loading map. Check console.</span>';
        loadingIndicator.classList.remove('loading-flash');
        if (mapWrapper) mapWrapper.classList.remove('loading-flash');
    }

    // Category filter menu
    categoryButtons.forEach((button) => {
        button.addEventListener('click', () => {
            categoryButtons.forEach((btn) => btn.classList.remove('active'));
            button.classList.add('active');
            platMap.setCategoryFilter(button.dataset.category);
        });
    });

    // Click legend item to focus status; click same item again to clear
    legendButtons.forEach((button) => {
        button.addEventListener('click', () => {
            const status = button.dataset.status;
            const isActive = button.classList.contains('active');
            legendButtons.forEach((btn) => btn.classList.remove('active'));
            if (isActive) {
                platMap.setStatusFilter(null);
                return;
            }
            button.classList.add('active');
            platMap.setStatusFilter(status);
        });
    });

    // Slider zoom (desktop + mobile)
    const syncZoom = (value) => {
        const zoom = Number(value);
        if (zoomSliderDesktop) zoomSliderDesktop.value = zoom;
        if (zoomSliderMobile) zoomSliderMobile.value = zoom;
        platMap.setZoom(zoom);
    };

    if (zoomSliderDesktop) {
        zoomSliderDesktop.addEventListener('input', (e) => syncZoom(e.target.value));
    }
    if (zoomSliderMobile) {
        zoomSliderMobile.addEventListener('input', (e) => syncZoom(e.target.value));
    }

    // Click outside map to deselect
    document.addEventListener('click', function(e) {
        if (!e.target.closest('svg') && !e.target.closest('.details-panel')) {
            if (platMap.selectedLot) {
                platMap.clearSelection();
            }
        }
    });

    // Keyboard shortcut: Escape to clear
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            categoryButtons.forEach((btn) => btn.classList.remove('active'));
            const allButton = document.querySelector('.category-btn[data-category="all"]');
            if (allButton) allButton.classList.add('active');
            legendButtons.forEach((btn) => btn.classList.remove('active'));
            platMap.resetFilters();
            platMap.clearSelection();
        }
    });

    // Update legend with unit counts
    updateLegendCounts();

    function updateLegendCounts() {
        const counts = {
            'available': 0,
            'reserved': 0,
            'prebooked': 0,
            'sold': 0,
            'unreleased': 0
        };

        Object.values(platMap.lotsData).forEach(lot => {
            const statusKey = lot.status.toLowerCase().replace(/\s+/g, '');
            if (counts.hasOwnProperty(statusKey)) {
                counts[statusKey]++;
            }
        });

        document.querySelectorAll('.legend-count').forEach((el, idx) => {
            const statuses = ['available', 'reserved', 'prebooked', 'sold', 'unreleased'];
            el.textContent = `(${counts[statuses[idx]]})`;
        });
    }

    // Auto-refresh data every 5 minutes (300000 ms)
    setInterval(async () => {
        console.log('Refreshing data from Google Sheet...');
        await platMap.refreshData();
    }, 300000);

    // Set initial slider state from map layout
    if (zoomSliderDesktop) zoomSliderDesktop.value = platMap.currentZoom;
    if (zoomSliderMobile) zoomSliderMobile.value = platMap.currentZoom;

    window.addEventListener('resize', () => {
        if (zoomSliderDesktop) zoomSliderDesktop.value = platMap.currentZoom;
        if (zoomSliderMobile) zoomSliderMobile.value = platMap.currentZoom;
    });
});