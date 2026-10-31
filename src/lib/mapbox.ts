import mapboxgl from 'mapbox-gl';

mapboxgl.accessToken = import.meta.env.VITE_MAPBOX_TOKEN as string;

export type LightPreset = 'dawn' | 'day' | 'dusk' | 'night';

/** Luz do mapa acompanha o horário local, como num jogo */
export function presetForNow(d = new Date()): LightPreset {
  const h = d.getHours() + d.getMinutes() / 60;
  if (h >= 6.5 && h < 8) return 'dawn';
  if (h >= 8 && h < 16.6) return 'day';
  if (h >= 16.6 && h < 18) return 'dusk';
  return 'night';
}

export function createMap(container: HTMLElement, opts: Partial<mapboxgl.MapOptions> & { light?: LightPreset; flat?: boolean } = {}) {
  const { light, flat, ...rest } = opts;
  const map = new mapboxgl.Map({
    container,
    style: 'mapbox://styles/mapbox/standard',
    config: {
      basemap: {
        lightPreset: light ?? 'day',
        showPointOfInterestLabels: false,
        showTransitLabels: !!flat,
        show3dObjects: !flat,
      },
    },
    attributionControl: false,
    language: 'pt',
    ...rest,
  } as mapboxgl.MapOptions);
  map.addControl(new mapboxgl.AttributionControl({ compact: true }), 'bottom-left');
  return map;
}

export { mapboxgl };
