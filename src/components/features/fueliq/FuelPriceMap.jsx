/**
 * FuelPriceMap - Interactive choropleth map showing state diesel prices
 * Reusable in dashboard and modals
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, MAP_STYLES, DEFAULT_CENTER } from '../../../services/map/config';
import usStatesGeo from '../../../assets/geo/us-states.json';

mapboxgl.accessToken = MAPBOX_TOKEN;

// Map state names from GeoJSON to state codes
const STATE_NAME_TO_CODE = {
  'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
  'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
  'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
  'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
  'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
  'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
  'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
  'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
  'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
  'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
  'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
  'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
  'Wisconsin': 'WI', 'Wyoming': 'WY', 'District of Columbia': 'DC',
  'Puerto Rico': 'PR'
};

export function FuelPriceMap({
  prices = [],
  selectedState = null,
  onStateClick = null,
  className = '',
  height = '500px'
}) {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const popup = useRef(null);
  const [loaded, setLoaded] = useState(false);

  // Build GeoJSON with price data joined in
  const getEnrichedGeoJSON = useCallback(() => {
    const priceMap = {};
    for (const p of prices) {
      priceMap[p.state_code] = p;
    }

    return {
      ...usStatesGeo,
      features: usStatesGeo.features.map(feature => {
        const stateCode = STATE_NAME_TO_CODE[feature.properties.name];
        const priceData = priceMap[stateCode];
        return {
          ...feature,
          properties: {
            ...feature.properties,
            state_code: stateCode || '',
            price: priceData?.price_per_gallon || 0,
            change: priceData?.change || 0,
            has_data: !!priceData
          }
        };
      })
    };
  }, [prices]);

  // Initialize map
  useEffect(() => {
    if (map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: MAP_STYLES.navigationNight,
      center: DEFAULT_CENTER,
      zoom: 3.5,
      interactive: true,
      attributionControl: false,
      minZoom: 2,
      maxZoom: 8
    });

    map.current.addControl(
      new mapboxgl.NavigationControl({ showCompass: false }),
      'top-right'
    );

    popup.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 10
    });

    map.current.on('load', () => setLoaded(true));

    return () => {
      popup.current?.remove();
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add/update choropleth layer when prices change
  useEffect(() => {
    if (!loaded || !map.current || !prices.length) return;

    const enrichedGeo = getEnrichedGeoJSON();
    const sourceId = 'states-source';
    const layerId = 'states-fill';
    const outlineId = 'states-outline';
    const highlightId = 'states-highlight';

    // Remove existing layers/source
    if (map.current.getLayer(highlightId)) map.current.removeLayer(highlightId);
    if (map.current.getLayer(outlineId)) map.current.removeLayer(outlineId);
    if (map.current.getLayer(layerId)) map.current.removeLayer(layerId);
    if (map.current.getSource(sourceId)) map.current.removeSource(sourceId);

    // Add source
    map.current.addSource(sourceId, {
      type: 'geojson',
      data: enrichedGeo
    });

    // Find price range for color scale
    const validPrices = prices.map(p => p.price_per_gallon).filter(p => p > 0);
    const minPrice = Math.min(...validPrices);
    const maxPrice = Math.max(...validPrices);
    const midPrice = (minPrice + maxPrice) / 2;

    // Choropleth fill layer (green → yellow → red)
    map.current.addLayer({
      id: layerId,
      type: 'fill',
      source: sourceId,
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'has_data'], false],
          '#1a1a2e',
          [
            'interpolate', ['linear'],
            ['get', 'price'],
            minPrice, '#22c55e',
            midPrice, '#eab308',
            maxPrice, '#ef4444'
          ]
        ],
        'fill-opacity': [
          'case',
          ['==', ['get', 'has_data'], false],
          0.3,
          0.75
        ]
      }
    });

    // State outline layer
    map.current.addLayer({
      id: outlineId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#ffffff',
        'line-width': 0.5,
        'line-opacity': 0.4
      }
    });

    // Highlight layer for selected state
    map.current.addLayer({
      id: highlightId,
      type: 'line',
      source: sourceId,
      paint: {
        'line-color': '#ffffff',
        'line-width': 2.5,
        'line-opacity': 0.9
      },
      filter: ['==', 'state_code', '']
    });

    // Hover interaction
    map.current.on('mousemove', layerId, (e) => {
      if (!e.features?.length) return;
      map.current.getCanvas().style.cursor = 'pointer';

      const feature = e.features[0];
      const { name, state_code, price, change, has_data } = feature.properties;

      if (!has_data) {
        popup.current.setLngLat(e.lngLat).setHTML(
          `<div style="font-family:system-ui;padding:4px 0;">
            <strong>${name}</strong>
            <div style="color:#999;font-size:12px;">No data available</div>
          </div>`
        ).addTo(map.current);
        return;
      }

      const changeStr = change > 0
        ? `<span style="color:#ef4444;">+$${change.toFixed(3)}</span>`
        : change < 0
          ? `<span style="color:#22c55e;">-$${Math.abs(change).toFixed(3)}</span>`
          : '<span style="color:#999;">No change</span>';

      popup.current.setLngLat(e.lngLat).setHTML(
        `<div style="font-family:system-ui;padding:4px 0;">
          <strong>${name} (${state_code})</strong>
          <div style="font-size:18px;font-weight:700;margin:4px 0;">$${price.toFixed(3)}/gal</div>
          <div style="font-size:12px;">Weekly: ${changeStr}</div>
        </div>`
      ).addTo(map.current);
    });

    map.current.on('mouseleave', layerId, () => {
      map.current.getCanvas().style.cursor = '';
      popup.current.remove();
    });

    // Click interaction
    map.current.on('click', layerId, (e) => {
      if (!e.features?.length) return;
      const stateCode = e.features[0].properties.state_code;
      if (stateCode && onStateClick) {
        onStateClick(stateCode);
      }
    });
  }, [loaded, prices, getEnrichedGeoJSON, onStateClick]);

  // Update highlight when selected state changes
  useEffect(() => {
    if (!loaded || !map.current) return;
    const highlightId = 'states-highlight';
    if (map.current.getLayer(highlightId)) {
      map.current.setFilter(highlightId, ['==', 'state_code', selectedState || '']);
    }
  }, [loaded, selectedState]);

  return (
    <div className={`relative rounded-card overflow-hidden ${className}`} style={{ height }}>
      <div ref={mapContainer} className="w-full h-full" />
      {!loaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface-secondary">
          <div className="text-text-tertiary text-body-sm">Loading map...</div>
        </div>
      )}
    </div>
  );
}

export default FuelPriceMap;
