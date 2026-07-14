class PlatMap {
    constructor(containerId, detailsPanelId) {
        this.mapContainer = document.getElementById(containerId);
        this.detailsPanel = document.getElementById(detailsPanelId);
        this.lotsData = {};
        this.selectedLot = null;
        this.searchTerm = '';
        this.svgElement = null;
        this.lotElements = [];
        this.activeStatusFilter = null;
        this.activeCategoryFilter = 'all';
        this.unitCategoryMap = {};
        this.unitCategoryOverrides = this.buildUnitCategoryOverrides();
        this.baseViewBox = null;
        this.currentZoom = 1;
        this.minZoom = 1;
        this.maxZoom = 4;
        this.nonPropertyElements = [];
        this.constructionDotsByUnit = {};
        this.pinchState = {
            active: false,
            startDistance: 0,
            startViewBox: null,
            startCenterSvg: null
        };
        this.dragState = {
            active: false,
            pointerId: null,
            pointerType: null,
            startTargetUnitId: null,
            lastX: 0,
            lastY: 0,
            moved: false,
            suppressLotClick: false
        };
        this.onTouchStart = null;
        this.onTouchMove = null;
        this.onTouchEnd = null;
        this.onPointerDown = null;
        this.onPointerMove = null;
        this.onPointerUp = null;
        this.googleSheetUrl = 'https://script.google.com/macros/s/AKfycbwd_sSg5XZTFJOJLrFBR0Fq3Hj3lIcVek6fExuPwHOqfPlzIR5VxJd2ZxrXMhy3hQ/exec';
        window.addEventListener('resize', () => this.updateMobileMapLayout());
    }

    buildUnitCategoryOverrides() {
        const overrides = {};

        for (let i = 1; i <= 10; i++) overrides[`FH4-${i}`] = '4br-single-family';
        for (let i = 1; i <= 25; i++) overrides[`FH3-${i}`] = '3br-single-family';
        for (let i = 1; i <= 12; i++) {
            overrides[`TNW-${i}`] = '3br-townhouses';
            overrides[`TSW-${i}`] = '3br-townhouses';
        }

        const threeBedTownhouses = [
            'TE-1', 'TE-6', 'TE-9',
            'TGA-1', 'TGA-4', 'TGA-9', 'TGA-12',
            'TGB-1', 'TGB-4', 'TGB-9', 'TGB-12'
        ];
        const twoBedTownhouses = [
            'TE-2', 'TE-3', 'TE-4', 'TE-5', 'TE-7', 'TE-8',
            'TGA-2', 'TGA-3', 'TGA-5', 'TGA-6', 'TGA-7', 'TGA-8', 'TGA-10', 'TGA-11',
            'TGB-2', 'TGB-3', 'TGB-5', 'TGB-6', 'TGB-7', 'TGB-8', 'TGB-10', 'TGB-11'
        ];

        threeBedTownhouses.forEach((unitId) => { overrides[unitId] = '3br-townhouses'; });
        twoBedTownhouses.forEach((unitId) => { overrides[unitId] = '2br-townhouses'; });

        return overrides;
    }

    hasDisplayValue(value) {
        return value !== undefined && value !== null && String(value).trim() !== '';
    }

    getFirstFilledValue(source, keys) {
        for (const key of keys) {
            if (Object.prototype.hasOwnProperty.call(source, key) && this.hasDisplayValue(source[key])) {
                return String(source[key]).trim();
            }
        }

        return '';
    }

    formatTooltipFeatureValue(value, suffix, existingPattern) {
        if (!this.hasDisplayValue(value)) return '';

        const text = String(value).trim();
        if (existingPattern.test(text)) {
            return text;
        }

        return `${text} ${suffix}`;
    }

    buildTooltipFeatures(lotData) {
        const features = [];
        const plotSize = this.formatTooltipFeatureValue(lotData.plotSize, 'Sqm', /sq\.?\s*m/i);
        const bedrooms = this.formatTooltipFeatureValue(lotData.bedrooms, 'Beds', /bed/i);
        const bathrooms = this.formatTooltipFeatureValue(lotData.bathrooms, 'Baths', /bath/i);
        const parkingSpaces = this.formatTooltipFeatureValue(lotData.parkingSpaces, 'Cars', /car/i);

        if (plotSize) features.push(plotSize);
        if (bedrooms) features.push(bedrooms);
        if (bathrooms) features.push(bathrooms);
        if (parkingSpaces) features.push(parkingSpaces);

        return features;
    }

    normalizeConstructionStatus(value) {
        const normalized = String(value || '').trim().toLowerCase();
        if (normalized === 'under construction') return 'under-construction';
        if (normalized === 'completed') return 'completed';
        return 'none';
    }

    getConstructionDotFill(status) {
        if (status === 'under-construction') return '#ffd400';
        if (status === 'completed') return '#2f54ff';
        return '';
    }

    getConstructionDotPosition(element, dotRadius) {
        const bbox = element.getBBox();
        if (!bbox || bbox.width <= 0 || bbox.height <= 0) return null;

        const minY = bbox.y + dotRadius + 2;
        const maxY = bbox.y + bbox.height - dotRadius - 2;
        if (minY > maxY) return null;

        const centerY = Math.max(minY, Math.min(bbox.y + (bbox.height / 2), maxY));
        return {
            cx: bbox.x + (bbox.width / 2),
            cy: centerY
        };
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
            this.initializeViewBox();
            this.initializePinchZoom();
            this.initializePan();
            this.updateMobileMapLayout();
        } catch (error) {
            console.error('Error loading SVG:', error);
            this.mapContainer.innerHTML = `<p style="padding: 20px; color: red;">Error loading map. Make sure svg/map.svg exists.</p>`;
        }
    }

    initializeViewBox() {
        if (!this.svgElement) return;

        const currentViewBox = this.parseViewBox(this.svgElement.getAttribute('viewBox'));
        if (currentViewBox) {
            this.baseViewBox = { ...currentViewBox };
            return;
        }

        const width = Number(this.svgElement.getAttribute('width')) || this.svgElement.clientWidth;
        const height = Number(this.svgElement.getAttribute('height')) || this.svgElement.clientHeight;
        if (width > 0 && height > 0) {
            const fallback = { x: 0, y: 0, width, height };
            this.baseViewBox = fallback;
            this.setViewBox(fallback);
        }
    }

    parseViewBox(value) {
        if (!value) return null;
        const parts = value.trim().split(/\s+/).map(Number);
        if (parts.length !== 4 || parts.some(Number.isNaN)) return null;
        return { x: parts[0], y: parts[1], width: parts[2], height: parts[3] };
    }

    setViewBox(viewBox) {
        if (!this.svgElement) return;
        this.svgElement.setAttribute('viewBox', `${viewBox.x} ${viewBox.y} ${viewBox.width} ${viewBox.height}`);
    }

    getCurrentViewBox() {
        if (!this.svgElement) return null;
        return this.parseViewBox(this.svgElement.getAttribute('viewBox'));
    }

    getViewBoxForZoom(zoom, anchorX = 0.5, anchorY = 0.5) {
        if (!this.baseViewBox) return null;
        const width = this.baseViewBox.width / zoom;
        const height = this.baseViewBox.height / zoom;
        const centerX = this.baseViewBox.x + (this.baseViewBox.width * anchorX);
        const centerY = this.baseViewBox.y + (this.baseViewBox.height * anchorY);
        const unclamped = {
            x: centerX - (width / 2),
            y: centerY - (height / 2),
            width,
            height
        };
        return this.clampViewBox(unclamped);
    }

    setZoom(zoom) {
        if (!this.baseViewBox) return;
        const clampedZoom = Math.min(this.maxZoom, Math.max(this.minZoom, Number(zoom) || 1));
        this.currentZoom = clampedZoom;
        const nextViewBox = this.getViewBoxForZoom(clampedZoom);
        if (nextViewBox) {
            this.setViewBox(nextViewBox);
        }
    }

    getTouchDistance(touchA, touchB) {
        const dx = touchB.clientX - touchA.clientX;
        const dy = touchB.clientY - touchA.clientY;
        return Math.hypot(dx, dy);
    }

    getTouchCenter(touchA, touchB) {
        return {
            x: (touchA.clientX + touchB.clientX) / 2,
            y: (touchA.clientY + touchB.clientY) / 2
        };
    }

    clientToSvgPoint(clientX, clientY) {
        if (!this.svgElement) return null;
        const ctm = this.svgElement.getScreenCTM();
        if (!ctm) return null;
        const point = this.svgElement.createSVGPoint();
        point.x = clientX;
        point.y = clientY;
        return point.matrixTransform(ctm.inverse());
    }

    clampViewBox(viewBox) {
        if (!this.baseViewBox) return viewBox;
        const maxX = this.baseViewBox.x + this.baseViewBox.width - viewBox.width;
        const maxY = this.baseViewBox.y + this.baseViewBox.height - viewBox.height;
        return {
            x: Math.min(Math.max(viewBox.x, this.baseViewBox.x), maxX),
            y: Math.min(Math.max(viewBox.y, this.baseViewBox.y), maxY),
            width: viewBox.width,
            height: viewBox.height
        };
    }

    initializePinchZoom() {
        if (!this.mapContainer || !this.svgElement) return;

        if (this.onTouchStart) {
            this.mapContainer.removeEventListener('touchstart', this.onTouchStart);
            this.mapContainer.removeEventListener('touchmove', this.onTouchMove);
            this.mapContainer.removeEventListener('touchend', this.onTouchEnd);
            this.mapContainer.removeEventListener('touchcancel', this.onTouchEnd);
        }

        this.onTouchStart = (event) => {
            if (window.matchMedia('(max-width: 640px)').matches) return;
            if (event.touches.length !== 2) return;
            const currentViewBox = this.getCurrentViewBox();
            if (!currentViewBox) return;

            const centerClient = this.getTouchCenter(event.touches[0], event.touches[1]);
            const centerSvg = this.clientToSvgPoint(centerClient.x, centerClient.y);
            if (!centerSvg) return;

            this.pinchState.active = true;
            this.pinchState.startDistance = this.getTouchDistance(event.touches[0], event.touches[1]);
            this.pinchState.startViewBox = currentViewBox;
            this.pinchState.startCenterSvg = centerSvg;
            event.preventDefault();
        };

        this.onTouchMove = (event) => {
            if (!this.pinchState.active || event.touches.length !== 2 || !this.baseViewBox) return;

            const distance = this.getTouchDistance(event.touches[0], event.touches[1]);
            if (distance <= 0 || this.pinchState.startDistance <= 0) return;

            const rawScale = this.pinchState.startDistance / distance;
            const nextWidth = this.pinchState.startViewBox.width * rawScale;
            const minWidth = this.baseViewBox.width / this.maxZoom;
            const maxWidth = this.baseViewBox.width / this.minZoom;
            const width = Math.min(Math.max(nextWidth, minWidth), maxWidth);
            const height = (width * this.baseViewBox.height) / this.baseViewBox.width;

            const center = this.pinchState.startCenterSvg;
            const start = this.pinchState.startViewBox;
            const ratioX = (center.x - start.x) / start.width;
            const ratioY = (center.y - start.y) / start.height;

            const unclamped = {
                x: center.x - (width * ratioX),
                y: center.y - (height * ratioY),
                width,
                height
            };

            const nextViewBox = this.clampViewBox(unclamped);
            this.setViewBox(nextViewBox);
            this.currentZoom = this.baseViewBox.width / nextViewBox.width;
            event.preventDefault();
        };

        this.onTouchEnd = (event) => {
            if (event.touches.length < 2) {
                this.pinchState.active = false;
            }
        };

        this.mapContainer.addEventListener('touchstart', this.onTouchStart, { passive: false });
        this.mapContainer.addEventListener('touchmove', this.onTouchMove, { passive: false });
        this.mapContainer.addEventListener('touchend', this.onTouchEnd, { passive: true });
        this.mapContainer.addEventListener('touchcancel', this.onTouchEnd, { passive: true });
    }

    initializePan() {
        if (!this.mapContainer || !this.svgElement) return;

        if (this.onPointerDown) {
            this.mapContainer.removeEventListener('pointerdown', this.onPointerDown);
            this.mapContainer.removeEventListener('pointermove', this.onPointerMove);
            this.mapContainer.removeEventListener('pointerup', this.onPointerUp);
            this.mapContainer.removeEventListener('pointercancel', this.onPointerUp);
            this.mapContainer.removeEventListener('pointerleave', this.onPointerUp);
        }

        this.onPointerDown = (event) => {
            if (event.pointerType === 'mouse' && event.button !== 0) return;
            this.dragState.active = true;
            this.dragState.pointerId = event.pointerId;
            this.dragState.pointerType = event.pointerType || 'mouse';
            const startLotTarget = event.target && event.target.closest ? event.target.closest('.lot[data-unit-id]') : null;
            this.dragState.startTargetUnitId = startLotTarget ? startLotTarget.dataset.unitId : null;
            this.dragState.lastX = event.clientX;
            this.dragState.lastY = event.clientY;
            this.dragState.moved = false;
            this.mapContainer.style.cursor = 'grabbing';
        };

        this.onPointerMove = (event) => {
            if (!this.dragState.active || this.dragState.pointerId !== event.pointerId) return;

            const currentViewBox = this.getCurrentViewBox();
            if (!currentViewBox) return;

            const rect = this.mapContainer.getBoundingClientRect();
            if (!rect.width || !rect.height) return;

            const dx = event.clientX - this.dragState.lastX;
            const dy = event.clientY - this.dragState.lastY;
            const moveThreshold = this.dragState.pointerType === 'touch' ? 14 : 4;

            const unitXPerPixel = currentViewBox.width / rect.width;
            const unitYPerPixel = currentViewBox.height / rect.height;

            const nextViewBox = this.clampViewBox({
                x: currentViewBox.x - (dx * unitXPerPixel),
                y: currentViewBox.y - (dy * unitYPerPixel),
                width: currentViewBox.width,
                height: currentViewBox.height
            });

            const viewBoxChanged =
                Math.abs(nextViewBox.x - currentViewBox.x) > 0.001 ||
                Math.abs(nextViewBox.y - currentViewBox.y) > 0.001;

            if (viewBoxChanged && (Math.abs(dx) + Math.abs(dy) > moveThreshold)) {
                this.dragState.moved = true;
            }

            this.setViewBox(nextViewBox);
            this.dragState.lastX = event.clientX;
            this.dragState.lastY = event.clientY;
            event.preventDefault();
        };

        this.onPointerUp = (event) => {
            if (!this.dragState.active) return;

            this.dragState.active = false;
            this.dragState.pointerId = null;
            this.dragState.pointerType = null;
            this.mapContainer.style.cursor = 'grab';

            if (!this.dragState.moved && this.dragState.startTargetUnitId) {
                this.selectLot(this.dragState.startTargetUnitId);
                this.dragState.startTargetUnitId = null;
                this.dragState.suppressLotClick = false;
                return;
            }
            this.dragState.startTargetUnitId = null;

            if (this.dragState.moved) {
                this.dragState.suppressLotClick = true;
                setTimeout(() => {
                    this.dragState.suppressLotClick = false;
                }, 120);
            }
        };

        this.mapContainer.addEventListener('pointerdown', this.onPointerDown, { passive: false });
        this.mapContainer.addEventListener('pointermove', this.onPointerMove, { passive: false });
        this.mapContainer.addEventListener('pointerup', this.onPointerUp, { passive: true });
        this.mapContainer.addEventListener('pointercancel', this.onPointerUp, { passive: true });
        this.mapContainer.addEventListener('pointerleave', this.onPointerUp, { passive: true });
        this.mapContainer.style.cursor = 'grab';
    }

    /**
     * Make mobile map start larger and remain visible after orientation changes
     */
    updateMobileMapLayout() {
        if (!this.svgElement || !this.baseViewBox) return;

        const isMobile = window.matchMedia('(max-width: 640px)').matches;
        this.currentZoom = isMobile ? 1.35 : 1;
        this.setZoom(this.currentZoom);
        this.pinchState.active = false;

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
                    plotSize: this.getFirstFilledValue(lot, ['PlotSize', 'Plot Size']),
                    preBooked: lot.PreBooked || '',
                    status: lot.Status || 'Unreleased',
                    price: lot.Price || '',
                    bedrooms: this.getFirstFilledValue(lot, ['Bedrooms', 'Bedroom', 'Beds']),
                    bathrooms: this.getFirstFilledValue(lot, ['Bathrooms', 'Bathroom', 'Baths']),
                    parkingSpaces: this.getFirstFilledValue(lot, ['Parking Spaces', 'ParkingSpaces', 'Parking', 'Cars']),
                    constructionStatus: this.normalizeConstructionStatus(
                        this.getFirstFilledValue(lot, ['Construction Status', 'ConstructionStatus'])
                    ),
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
            tooltip.className = 'lot-tooltip';
            tooltip.style.cssText = `
                position: fixed;
                pointer-events: none;
                z-index: 1000;
                display: none;
            `;
            document.body.appendChild(tooltip);
        }

        // Find all lot elements (any element with ID containing a hyphen)
        const lotElements = svg.querySelectorAll('[id*="-"]');
        this.lotElements = Array.from(lotElements);
        this.unitCategoryMap = {};
        this.constructionDotsByUnit = {};
        const existingDotsLayer = svg.querySelector('#constructionStatusDots');
        if (existingDotsLayer) existingDotsLayer.remove();
        const constructionDotsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        constructionDotsLayer.id = 'constructionStatusDots';
        svg.appendChild(constructionDotsLayer);

        this.lotElements.forEach(element => {
            const unitId = element.id;
            const lotData = this.lotsData[unitId];

            if (lotData) {
                // Add status class for styling
                const statusClass = `status-${lotData.status.toLowerCase().replace(/\s+/g, '-')}`;
                element.classList.add('lot', statusClass);
                element.dataset.unitId = unitId;
                this.unitCategoryMap[unitId] = this.detectCategoryFromLayerGroup(element);
                const dotFill = this.getConstructionDotFill(lotData.constructionStatus);
                if (dotFill) {
                    const dotRadius = 6.48;
                    const dotPosition = this.getConstructionDotPosition(element, dotRadius);
                    if (dotPosition) {
                        const marker = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
                        marker.classList.add('construction-dot');
                        marker.dataset.unitId = unitId;
                        marker.setAttribute('cx', String(dotPosition.cx));
                        marker.setAttribute('cy', String(dotPosition.cy));
                        marker.setAttribute('r', String(dotRadius));
                        marker.setAttribute('fill', dotFill);
                        marker.setAttribute('stroke', '#8f8f8f');
                        marker.setAttribute('stroke-width', '2');
                        marker.setAttribute('pointer-events', 'none');
                        constructionDotsLayer.appendChild(marker);
                        this.constructionDotsByUnit[unitId] = marker;
                    }
                }

                // Add click listener
                element.addEventListener('click', (e) => {
                    if (this.dragState.suppressLotClick) {
                        e.preventDefault();
                        return;
                    }
                    e.stopPropagation();
                    this.selectLot(unitId);
                });

                // Add hover effect with tooltip
                element.addEventListener('mouseenter', () => {
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
                    const tooltipFeatures = this.buildTooltipFeatures(lotData);
                    const featuresSection = tooltipFeatures.length > 0
                        ? `
                            <div class="lot-tooltip-features">
                                ${tooltipFeatures.map((feature) => `<span class="lot-tooltip-feature">${feature}</span>`).join('')}
                            </div>
                        `
                        : '';
                    
                    // Show tooltip with status in colored badge
                    tooltip.innerHTML = `
                        <div class="lot-tooltip-main">
                            <div class="lot-tooltip-title">${unitId}</div>
                            <div class="lot-tooltip-status" style="background-color: ${bgColor};">${lotData.status}</div>
                            <div class="lot-tooltip-name">${lotData.name}</div>
                        </div>
                        ${featuresSection}
                    `;
                    tooltip.style.display = 'block';
                    
                    // Position tooltip above lot with extra gap and viewport clamping
                    const rect = element.getBoundingClientRect();
                    const tooltipWidth = tooltip.offsetWidth;
                    const tooltipHeight = tooltip.offsetHeight;
                    const horizontalPadding = 8;
                    const bubbleGap = 22;
                    const desiredLeft = rect.left + rect.width / 2 - tooltipWidth / 2;
                    const clampedLeft = Math.max(
                        horizontalPadding,
                        Math.min(desiredLeft, window.innerWidth - tooltipWidth - horizontalPadding)
                    );
                    const desiredTop = rect.top - tooltipHeight - bubbleGap;
                    const clampedTop = Math.max(8, desiredTop);

                    tooltip.style.left = `${clampedLeft}px`;
                    tooltip.style.top = `${clampedTop}px`;
                });

                element.addEventListener('mouseleave', () => {
                    // Hide tooltip
                    tooltip.style.display = 'none';
                });
            }
        });

        this.nonPropertyElements = Array.from(
            svg.querySelectorAll('polygon,path,polyline,rect,circle,ellipse,line,text,image')
        ).filter((element) => !element.classList.contains('lot') && !element.classList.contains('construction-dot'));
        this.nonPropertyElements.forEach((element) => {
            element.classList.add('non-property-element');
        });

        this.applyCombinedFilters();
    }

    detectCategoryFromLayerGroup(element) {
        const interactiveRoot = this.svgElement ? this.svgElement.querySelector('#Interactive_Lots') : null;
        let node = element;
        while (node && node !== interactiveRoot) {
            if (node.tagName && node.tagName.toLowerCase() === 'g' && node.id) {
                if (node.id.includes('_2BR_Townhouses')) return '2br-townhouses';
                if (node.id.includes('_3BR_Townhouses')) return '3br-townhouses';
                if (node.id.includes('_3BR_Single_Family_Homes')) return '3br-single-family';
                if (node.id.includes('_4BR_Single_Family_Homes')) return '4br-single-family';
            }
            node = node.parentElement;
        }
        return null;
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
    }

    resetFilters() {
        this.activeCategoryFilter = 'all';
        this.activeStatusFilter = null;
        this.applyCombinedFilters();
    }

    getCategoryForUnit(unitId) {
        const overriddenCategory = this.unitCategoryOverrides[unitId];
        if (overriddenCategory) return overriddenCategory;

        const groupedCategory = this.unitCategoryMap[unitId];
        if (groupedCategory) return groupedCategory;

        // Fallback for legacy SVGs that may not have expected group ids
        if (unitId.startsWith('FH4-')) return '4br-single-family';
        if (unitId.startsWith('FH3-')) return '3br-single-family';
        if (unitId.startsWith('TSW-') || unitId.startsWith('TNW-')) return '3br-townhouses';
        if (unitId.startsWith('TE-') || unitId.startsWith('TGA-') || unitId.startsWith('TGB-')) return '2br-townhouses';
        return 'all';
    }

    setCategoryFilter(category) {
        this.activeCategoryFilter = category || 'all';
        this.applyCombinedFilters();
    }

    setStatusFilter(status) {
        this.activeStatusFilter = status || null;
        this.applyCombinedFilters();
    }

    applyCombinedFilters() {
        if (!this.svgElement) return;

        const hasStatusFocus = !!this.activeStatusFilter;
        const hasCategoryFocus = this.activeCategoryFilter !== 'all';
        const hasFocus = hasStatusFocus || hasCategoryFocus;
        this.svgElement.classList.toggle('status-focus-on', hasFocus);
        this.nonPropertyElements.forEach((element) => {
            element.classList.toggle('non-property-muted', hasFocus);
        });

        this.lotElements.forEach(lot => {
            const unitId = lot.dataset.unitId || lot.id;
            const lotData = this.lotsData[unitId];
            if (!lotData) return;

            const categoryMatch = this.activeCategoryFilter === 'all' || this.getCategoryForUnit(unitId) === this.activeCategoryFilter;
            lot.classList.toggle('filtered-out', !categoryMatch);

            const statusKey = lotData.status.toLowerCase().replace(/\s+/g, '');
            const statusMatch = statusKey === this.activeStatusFilter;
            const hasCategoryFocus = this.activeCategoryFilter !== 'all';
            let focusHit = false;
            if (hasStatusFocus && hasCategoryFocus) focusHit = statusMatch && categoryMatch;
            else if (hasStatusFocus) focusHit = statusMatch;
            else if (hasCategoryFocus) focusHit = categoryMatch;
            lot.classList.toggle('status-focus-hit', focusHit);

            const constructionDot = this.constructionDotsByUnit[unitId];
            if (constructionDot) {
                constructionDot.classList.toggle('filtered-out', !categoryMatch);
                constructionDot.classList.toggle('status-focus-hit', focusHit);
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