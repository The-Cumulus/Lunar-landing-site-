export interface FlyoverWaypoint {
  id: string;
  name: string;
  tag: string;
  lat: number;
  lng: number;
  altitudeMeters: number;
  headingDeg: number;
  pitchDeg: number;
  description: string;
  durationSeconds?: number;
  hoverSeconds?: number;
}

export const LUNAR_FLYOVER_LANDMARKS: FlyoverWaypoint[] = [
  {
    id: 'tycho',
    name: 'Tycho Crater',
    tag: 'Impact Structure',
    lat: -43.31,
    lng: -11.36,
    altitudeMeters: 85000,
    headingDeg: 45,
    pitchDeg: -30,
    description: 'Prominent 86 km wide young impact crater with a 1.6 km high central peak and extensive bright ray system.',
    durationSeconds: 5,
    hoverSeconds: 4
  },
  {
    id: 'copernicus',
    name: 'Copernicus Crater',
    tag: 'Terraced Massif',
    lat: 9.62,
    lng: -20.08,
    altitudeMeters: 75000,
    headingDeg: 110,
    pitchDeg: -28,
    description: 'Magnificent 93 km diameter crater featuring massive stepped terrace walls and central mountain peaks.',
    durationSeconds: 5,
    hoverSeconds: 4
  },
  {
    id: 'apollo11',
    name: 'Apollo 11 (Tranquility Base)',
    tag: 'Historic Landing Site',
    lat: 0.674,
    lng: 23.473,
    altitudeMeters: 28000,
    headingDeg: 15,
    pitchDeg: -25,
    description: 'First human landing site on the Moon (July 20, 1969). High-resolution LRO NAC mosaic available here.',
    durationSeconds: 5,
    hoverSeconds: 4
  },
  {
    id: 'shackleton',
    name: 'Shackleton Crater (South Pole)',
    tag: 'Artemis Target / PSR',
    lat: -89.54,
    lng: 0.0,
    altitudeMeters: 55000,
    headingDeg: 180,
    pitchDeg: -26,
    description: 'Ultra-cold 21 km impact crater at the lunar South Pole. Rim receives quasi-continuous sunlight while the interior traps volatile ice.',
    durationSeconds: 5,
    hoverSeconds: 4
  },
  {
    id: 'aristarchus',
    name: 'Aristarchus & Vallis Schröteri',
    tag: 'Volcanic Rille',
    lat: 23.7,
    lng: -47.4,
    altitudeMeters: 70000,
    headingDeg: 290,
    pitchDeg: -32,
    description: 'The brightest large feature on the lunar nearside, flanked by the largest sinuous volcanic rille on the Moon.',
    durationSeconds: 5,
    hoverSeconds: 4
  },
  {
    id: 'apollo17',
    name: 'Apollo 17 (Taurus-Littrow Valley)',
    tag: 'Deep Lunar Canyon',
    lat: 20.19,
    lng: 30.77,
    altitudeMeters: 38000,
    headingDeg: 35,
    pitchDeg: -24,
    description: 'Dramatic geological valley bordered by towering 2 km high massifs where Apollo 17 astronauts discovered orange pyroclastic glass.',
    durationSeconds: 5,
    hoverSeconds: 4
  },
  {
    id: 'orientale',
    name: 'Mare Orientale',
    tag: 'Multi-Ring Basin',
    lat: -19.4,
    lng: -92.8,
    altitudeMeters: 280000,
    headingDeg: 90,
    pitchDeg: -45,
    description: 'The youngest and best-preserved multiring impact basin on the Moon, spanning 930 km across three concentric mountain rings.',
    durationSeconds: 6,
    hoverSeconds: 4
  }
];
