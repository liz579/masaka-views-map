class PlatMap {
    constructor(containerId, detailsPanelId) {
        this.mapContainer = document.getElementById(containerId);
        this.detailsPanel = document.getElementById(detailsPanelId);
        this.lotsData = {};
        this.selectedLot = null;
        this.searchTerm = '';
        this.svgElement = null;
        this.googleSheetUrl = 'https://script.google.com/macros/s/AKfycbwd_sSg5XZTFJOJLrFBR0Fq3Hj3lIcVek6fExuPwHOqfPlzIR5VxJd2ZxrXMhy3hQ/exec';
        window.addEventListener('resize', () => this.updateMobileMapLayout());
    }

    /**
     * Fetch and embed SVG map
     */
    async loadSVG(svgPath) {
        try {
            const response = await fetch(svgPath);
            const svgText = await response.text();
            this.mapContainer.innerHTML = svgText;
            this.svgElement = this.mapContainer.querySelector('svg');
            this.updateMobileMapLayout();
        } catch (error) {
            console.error('Error loading SVG:', error);
            this.mapContainer.innerHTML = `<p style="padding: 20px; color: red;">Error loading map. Make sure svg/map.svg exists.</p>`;
        }
    }

    /**
     * Make mobile map start larger and remain visible after orientation changes
     */
    updateMobileMapLayout() {
        if (!this.svgElement) return;

        const isMobile = window.matchMedia('(max-width: 640px)').matches;

        if (isMobile) {
            this.svgElement.style.width = '170%';
            this.svgElement.style.maxWidth = 'none';
            this.svgElement.style.height = 'auto';

            requestAnimationFrame(() => {
                const overflowX = this.mapContainer.scrollWidth - this.mapContainer.clientWidth;
                if (overflowX > 0) {
                    this.mapContainer.scrollLeft = Math.round(overflowX / 2);
                }
            });
            return;
        }

        this.svgElement.style.width = '100%';
        this.svgElement.style.maxWidth = '100%';
        this.svgElement.style.height = 'auto';
        this.mapContainer.scrollLeft = 0;
    }

    /**
     * Fetch lot data from Google Sheet via Apps Script
     */
    async loadLotData() {
        try {
            const response = await fetch(this.googleSheetUrl);
            const data = await response.json();
            this.parseLotData(data);
        } catch (error) {
            console.error('Error loading lot data from Google Sheet:', error);
        }
    }

    /**
     * Parse Google Sheet data and index by UnitID
     */
    parseLotData(data) {
        if (!Array.isArray(data)) {
            console.error('Invalid data format from Google Sheet');
            return;
        }

        data.forEach(lot => {
            const unitId = lot.UnitID;
            if (unitId) {
                this.lotsData[unitId] = {
                    unitId: unitId,
                    name: lot.Name || '',
                    description: lot.Description || '',
                    imageUrl: lot.ImageURL || '',
                    plotSize: lot.PlotSize || '',
                    preBooked: lot.PreBooked || '',
                    status: lot.Status || 'Unreleased',
                    price: lot.Price || '',
                    coordinates: this.parseCoordinates(lot.Coordinates)
                };
            }
        });

        this.renderLotsData();
    }

    /**
     * Parse coordinates from JSON string
     */
    parseCoordinates(coordinatesStr) {
        if (!coordinatesStr || coordinatesStr.trim() === '') {
            return null;
        }
        try {
            return JSON.parse(coordinatesStr);
        } catch (e) {
            return null;
        }
    }

    /**
     * Apply lot data to SVG elements and set up interactions
     */
    renderLotsData() {
        const svg = this.mapContainer.querySelector('svg');
        if (!svg) {
            console.error('SVG not found in container');
            return;
        }

        // Create or get tooltip element
        let tooltip = document.getElementById('lotTooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'lotTooltip';
            tooltip.style.cssText = `
                position: fixed;
                background: #f5f5f5;
                color: #333;
                padding: 10px 12px;
                border: 1px solid #333;
                border-radius: 6px;
                font-size: 12px;
                font-weight: bold;
                pointer-events: none;
                z-index: 1000;
                display: none;
                white-space: normal;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
                max-width: 150px;
                text-align: center;
            `;
            document.body.appendChild(tooltip);
        }

        // Find all lot elements (any element with ID containing a hyphen)
        const lotElements = svg.querySelectorAll('[id*="-"]');

        lotElements.forEach(element => {
            const unitId = element.id;
            const lotData = this.lotsData[unitId];

            if (lotData) {
                // Add status class for styling
                const statusClass = `status-${lotData.status.toLowerCase().replace(/\s+/g, '-')}`;
                element.classList.add('lot', statusClass);
                element.dataset.unitId = unitId;

                // Add click listener
                element.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.selectLot(unitId);
                });

                // Add hover effect with tooltip
                element.addEventListener('mouseenter', (e) => {
                    element.style.filter = 'brightness(0.85) drop-shadow(0 0 5px rgba(0,0,0,0.3))';
                    
                    // Determine status color
                    const statusColor = {
                        'available': '#2ecc71',
                        'reserved': '#f39c12',
                        'prebooked': '#9b59b6',
                        'sold': '#e74c3c',
                        'unreleased': '#95a5a6'
                    };
                    const statusLower = lotData.status.toLowerCase().replace(/\s+/g, '');
                    const bgColor = statusColor[statusLower] || '#95a5a6';
                    
                    // Show tooltip with status in colored badge
                    tooltip.innerHTML = `
                        <div style="font-weight: bold; margin-bottom: 6px; color: #333;">${unitId}</div>
                        <div style="font-size: 11px; margin-bottom: 6px; color: #333;">${lotData.name}</div>
                        <div style="display: inline-block; background-color: ${bgColor}; color: white; padding: 4px 10px; border-radius: 12px; font-size: 11px; font-weight: bold;">${lotData.status}</div>
                    `;
                    tooltip.style.display = 'block';
                    
                    // Position tooltip above with arrow pointing down
                    const rect = element.getBoundingClientRect();
                    const tooltipWidth = 150;
                    tooltip.style.left = (rect.left + rect.width / 2 - tooltipWidth / 2) + 'px';
                    tooltip.style.top = (rect.top - 70) + 'px';
                    
                    // Add arrow/pointer using clip-path
                    tooltip.style.clipPath = 'polygon(0 0, 100% 0, 100% calc(100% - 8px), 52% calc(100% - 8px), 50% 100%, 48% calc(100% - 8px), 0 calc(100% - 8px))';
                });

                element.addEventListener('mouseleave', (e) => {
                    if (this.selectedLot !== unitId) {
                        element.style.filter = 'none';
                    }
                    // Hide tooltip
                    tooltip.style.display = 'none';
                });
            }
        });
    }

    /**
     * Select a lot and display details
     */
    selectLot(unitId) {
        const lotData = this.lotsData[unitId];

        if (!lotData) {
            console.error('Lot not found:', unitId);
            return;
        }

        // Clear previous selection
        if (this.selectedLot) {
            const prevElement = this.mapContainer.querySelector(`svg [data-unit-id="${this.selectedLot}"]`);
            if (prevElement) {
                prevElement.classList.remove('selected');
                prevElement.style.filter = 'none';
            }
        }

        // Select new lot
        this.selectedLot = unitId;
        const currentElement = this.mapContainer.querySelector(`svg [data-unit-id="${unitId}"]`);
        if (currentElement) {
            currentElement.classList.add('selected');
            currentElement.style.filter = 'brightness(1.15) drop-shadow(0 0 8px rgba(52, 152, 219, 0.5))';
        }

        // Display details
        this.displayLotDetails(lotData);
    }

    /**
     * Display lot details in sidebar
     */
    displayLotDetails(lotData) {
        const statusClass = `status-${lotData.status.toLowerCase().replace(/\s+/g, '-')}`;

        let html = `
            <div class="lot-details">
                <h2>${lotData.unitId}</h2>
        `;

        if (lotData.imageUrl) {
            html += `<img src="${lotData.imageUrl}" alt="${lotData.name}" class="lot-image" onerror="this.style.display='none';">`;
        }

        html += `
                <div class="detail-item">
                    <div class="detail-label">Name</div>
                    <div class="detail-value">${lotData.name}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Status</div>
                    <div class="status-badge ${statusClass}">${lotData.status}</div>
                </div>

                <div class="detail-item">
                    <div class="detail-label">Price</div>
                    <div class="detail-value price">USD ${Number(lotData.price).toLocaleString()}</div>
                    <div class="detail-value" style="font-size: 12px; color: #7f8c8d; margin-top: 4px;">≈ RWF ${Number(lotData.price * 1470).toLocaleString()}</div>
                </div>
        `;

        if (lotData.plotSize) {
            html += `
                <div class="detail-item">
                    <div class="detail-label">Plot Size</div>
                    <div class="detail-value">${lotData.plotSize}</div>
                </div>
            `;
        }

        if (lotData.preBooked) {
            html += `
                <div class="detail-item">
                    <div class="detail-label">Pre-Booked</div>
                    <div class="detail-value">${lotData.preBooked}</div>
                </div>
            `;
        }

        if (lotData.description) {
            html += `
                <div class="detail-item">
                    <div class="detail-label">Description</div>
                    <div class="detail-value">${lotData.description}</div>
                </div>
            `;
        }

        html += `
                <div class="detail-item" style="border: none; margin-top: 15px;">
                    <button class="book-btn" onclick="window.open('https://docs.google.com/forms/d/1s1bDxHw0f1DfecVyu2OAps2Epb02hyfYIEq5B1Pd49I/edit', '_blank')">
                        📅 Book This Unit
                    </button>
                </div>
            </div>`;
        this.detailsPanel.innerHTML = html;
    }

    /**
     * Clear selection and reset sidebar
     */
    clearSelection() {
        if (this.selectedLot) {
            const element = this.mapContainer.querySelector(`svg [data-unit-id="${this.selectedLot}"]`);
            if (element) {
                element.classList.remove('selected');
                element.style.filter = 'none';
            }
        }

        this.selectedLot = null;
        this.searchTerm = '';
        this.detailsPanel.innerHTML = '<p class="no-selection">👈 Click a lot to view details</p>';

        // Show all lots
        const allLots = this.mapContainer.querySelectorAll('svg .lot');
        allLots.forEach(lot => {
            lot.classList.remove('filtered-out');
        });
    }

    /**
     * Filter lots by search term
     */
    filterLots(searchTerm) {
        this.searchTerm = searchTerm.toLowerCase().trim();

        const allLots = this.mapContainer.querySelectorAll('svg .lot');

        if (!this.searchTerm) {
            allLots.forEach(lot => lot.classList.remove('filtered-out'));
            return;
        }

        allLots.forEach(lot => {
            const unitId = lot.dataset.unitId;
            const lotData = this.lotsData[unitId];

            if (lotData) {
                const matches = 
                    unitId.toLowerCase().includes(this.searchTerm) ||
                    lotData.name.toLowerCase().includes(this.searchTerm);

                lot.classList.toggle('filtered-out', !matches);
            } else {
                lot.classList.add('filtered-out');
            }
        });
    }

    /**
     * Refresh data from Google Sheet
     */
    async refreshData() {
        await this.loadLotData();
        this.selectedLot = null;
        this.searchTerm = '';
    }
}