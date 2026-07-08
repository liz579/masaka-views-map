let platMap;

document.addEventListener('DOMContentLoaded', async function() {
    const loadingIndicator = document.getElementById('loadingIndicator');
    const searchInput = document.getElementById('searchInput');
    const clearBtn = document.getElementById('clearBtn');
    const detailsPanel = document.getElementById('detailsContent');

    // Initialize the map
    platMap = new PlatMap('mapWrapper', 'detailsContent');

    try {
        // Show loading indicator
        loadingIndicator.classList.remove('hidden');

        // Load SVG map
        await platMap.loadSVG('svg/map.svg');

        // Load lot data from Google Sheet
        await platMap.loadLotData();

        // Hide loading indicator
        loadingIndicator.classList.add('hidden');

        console.log('Map initialized successfully');
    } catch (error) {
        console.error('Error initializing map:', error);
        loadingIndicator.innerHTML = '<span style="color: red;">❌ Error loading map. Check console.</span>';
    }

    // Search input handler
    searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value;

        if (searchTerm.trim()) {
            clearBtn.style.display = 'block';
        } else {
            clearBtn.style.display = 'none';
        }

        platMap.filterLots(searchTerm);
    });

    // Clear button handler
    clearBtn.addEventListener('click', function() {
        searchInput.value = '';
        clearBtn.style.display = 'none';
        platMap.clearSelection();
    });

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
            searchInput.value = '';
            clearBtn.style.display = 'none';
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
});