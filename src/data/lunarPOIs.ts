import { LunarPOI, BasemapLayerInfo } from '../types/lunar';

export const LUNAR_BASEMAP_LAYERS: BasemapLayerInfo[] = [
  {
    id: 'natural',
    name: 'Natural Surface (LROC WAC)',
    shortName: 'Visual Mosaic',
    description: 'Calibrated monochrome visual surface mosaic acquired by the Lunar Reconnaissance Orbiter Camera (LROC) Wide Angle Camera.',
    instrument: 'LROC WAC (7-band Multispectral)',
    mission: 'NASA Lunar Reconnaissance Orbiter (LRO)',
  },
  {
    id: 'topographic',
    name: 'LOLA Elevation (Topography)',
    shortName: 'LOLA Elevation',
    description: 'False-color hypsometric tint elevation map derived from the Lunar Orbiter Laser Altimeter. Scale ranges from -9 km (violet/blue) to +10.7 km (red/white).',
    instrument: 'LOLA (Lunar Orbiter Laser Altimeter)',
    mission: 'NASA LRO / Goddard Space Flight Center',
    colorScale: ['#2d0554', '#0984e3', '#00cec9', '#6ab04c', '#f1c40f', '#e74c3c', '#ffffff']
  },
  {
    id: 'shaded-relief',
    name: 'LOLA Shaded Relief / Hillshade',
    shortName: 'Shaded Relief',
    description: 'High-contrast synthetic hillshade illumination accentuating crater terraces, volcanic rilles, wrinkle ridges, and impact ejecta blankets.',
    instrument: 'LOLA Digital Elevation Model (DEM)',
    mission: 'USGS Astrogeology / NASA PDS Geosciences',
  }
];

export const LUNAR_POIS: LunarPOI[] = [
  // ================= APOLLO MISSIONS =================
  {
    id: 'apollo-11',
    name: 'Apollo 11',
    subTitle: 'Tranquility Base (Statio Tranquillitatis)',
    category: 'apollo',
    lat: 0.67408,
    lng: 23.47297,
    elevationMeters: -2570,
    landingDate: 'July 20, 1969',
    agency: 'NASA',
    country: 'United States',
    crew: ['Neil Armstrong (CDR)', 'Buzz Aldrin (LMP)', 'Michael Collins (CMP)'],
    duration: '21 hrs 36 mins (Surface)',
    samplesReturnedKg: 21.55,
    accentColor: '#38bdf8',
    description: 'First crewed lunar landing in human history. The Lunar Module "Eagle" touched down in southwestern Mare Tranquillitatis near crater West.',
    historicalSignificance: '"That\'s one small step for [a] man, one giant leap for mankind." Accomplished the national goal set by President John F. Kennedy in 1961.',
    keyScientificGoals: [
      'First sample collection of ancient basaltic mare regolith',
      'Deployment of Early Apollo Surface Experiments Package (EASEP)',
      'Laser Ranging Retroreflector (LRRR) still operational today',
      'Passive Seismic Experiment to detect lunar quakes'
    ],
    surfaceFeatures: 'Smooth volcanic basalt plain pocked with small impact craters and strewn boulders up to 0.8 meters across.'
  },
  {
    id: 'apollo-12',
    name: 'Apollo 12',
    subTitle: 'Ocean of Storms (Oceanus Procellarum)',
    category: 'apollo',
    lat: -3.01239,
    lng: -23.42157,
    elevationMeters: -2980,
    landingDate: 'November 19, 1969',
    agency: 'NASA',
    country: 'United States',
    crew: ['Charles "Pete" Conrad (CDR)', 'Alan Bean (LMP)', 'Richard Gordon (CMP)'],
    duration: '31 hrs 31 mins (Surface)',
    samplesReturnedKg: 34.35,
    accentColor: '#38bdf8',
    description: 'First pinpoint lunar landing. Touched down merely 163 meters from the uncrewed robotic probe Surveyor 3, which landed 2.5 years earlier.',
    historicalSignificance: 'Demonstrated precise automated pinpoint guidance necessary for exploring complex geological highland landing sites.',
    keyScientificGoals: [
      'Retrieved pieces of Surveyor 3 to analyze long-term space exposure',
      'Deployment of full Apollo Lunar Surface Experiments Package (ALSEP)',
      'Collected ilmenite-rich basalt rocks from Oceanus Procellarum'
    ],
    surfaceFeatures: 'Volcanic mare terrain dissected by Copernicus ray material and shallow crater clusters.'
  },
  {
    id: 'apollo-14',
    name: 'Apollo 14',
    subTitle: 'Fra Mauro Highlands',
    category: 'apollo',
    lat: -3.64530,
    lng: -17.47136,
    elevationMeters: -1450,
    landingDate: 'February 5, 1971',
    agency: 'NASA',
    country: 'United States',
    crew: ['Alan Shepard (CDR)', 'Edgar Mitchell (LMP)', 'Stuart Roosa (CMP)'],
    duration: '33 hrs 31 mins (Surface)',
    samplesReturnedKg: 42.28,
    accentColor: '#38bdf8',
    description: 'Exploration of the hilly Fra Mauro Formation, which represents ejecta debris thrown outward during the cataclysmic impact that excavated Mare Imbrium.',
    historicalSignificance: 'Alan Shepard hit two golf balls on the lunar surface. First human mission to utilize the Modular Equipment Transporter (handcart).',
    keyScientificGoals: [
      'Sample primordial impact breccias from deep within the Moon',
      'Hiked to the rim of 300-meter-wide Cone Crater',
      'Active seismic profiling with explosive thumper charges'
    ],
    surfaceFeatures: 'Hummocky ejecta terrain consisting of ridges, mounds, and boulder fields from Cone Crater.'
  },
  {
    id: 'apollo-15',
    name: 'Apollo 15',
    subTitle: 'Hadley-Apennine Basin',
    category: 'apollo',
    lat: 26.13222,
    lng: 3.63386,
    elevationMeters: -1800,
    landingDate: 'July 30, 1971',
    agency: 'NASA',
    country: 'United States',
    crew: ['David Scott (CDR)', 'James Irwin (LMP)', 'Alfred Worden (CMP)'],
    duration: '66 hrs 55 mins (Surface)',
    samplesReturnedKg: 77.31,
    accentColor: '#38bdf8',
    description: 'First "J-mission" featuring extended duration and the maiden deployment of the electric Lunar Roving Vehicle (LRV), traversing 27.9 km.',
    historicalSignificance: 'Discovered the famous "Genesis Rock" (anorthosite sample 15415), dating back over 4 billion years to the Moon\'s primordial crust.',
    keyScientificGoals: [
      'Exploration of the sinuous volcanic rille Rima Hadley (1.5 km wide, 300 m deep)',
      'Sampling the base of Montes Apenninus rising 4,500 meters high',
      'Famous hammer vs feather gravitational drop test performed by David Scott'
    ],
    surfaceFeatures: 'Spectacular junction between the towering 4-km Apennine peaks and a deep meandering lava channel.'
  },
  {
    id: 'apollo-16',
    name: 'Apollo 16',
    subTitle: 'Descartes Highlands',
    category: 'apollo',
    lat: -8.97301,
    lng: 15.50019,
    elevationMeters: 7450,
    landingDate: 'April 21, 1972',
    agency: 'NASA',
    country: 'United States',
    crew: ['John Young (CDR)', 'Charles Duke (LMP)', 'Ken Mattingly (CMP)'],
    duration: '71 hrs 2 mins (Surface)',
    samplesReturnedKg: 95.71,
    accentColor: '#38bdf8',
    description: 'The only Apollo expedition directed specifically into the central lunar highlands to investigate suspected highland volcanism.',
    historicalSignificance: 'Sample analysis revolutionized planetary geology by proving the Descartes formation was impact breccia rather than volcanic rhyolite.',
    keyScientificGoals: [
      'Sampled North Ray and South Ray craters',
      'Traversed 26.7 km in the Lunar Roving Vehicle',
      'Far UV Camera / Spectrograph deployed to photograph Earth\'s geocorona'
    ],
    surfaceFeatures: 'Heavily cratered, high-albedo anorthosite highland plateau at high elevation.'
  },
  {
    id: 'apollo-17',
    name: 'Apollo 17',
    subTitle: 'Taurus-Littrow Valley',
    category: 'apollo',
    lat: 20.19080,
    lng: 30.77168,
    elevationMeters: -2500,
    landingDate: 'December 11, 1972',
    agency: 'NASA',
    country: 'United States',
    crew: ['Eugene Cernan (CDR)', 'Harrison Schmitt (LMP/Geologist)', 'Ronald Evans (CMP)'],
    duration: '75 hrs 0 mins (Surface)',
    samplesReturnedKg: 110.52,
    accentColor: '#38bdf8',
    description: 'The final Apollo lunar landing and the only mission to include a professional field scientist (geologist Dr. Harrison "Jack" Schmitt).',
    historicalSignificance: 'Eugene Cernan was the last human to leave footprints on the lunar surface during the 20th century. Set longest EVA duration and largest sample haul.',
    keyScientificGoals: [
      'Discovered orange pyroclastic volcanic glass beads at Shorty Crater',
      'Sampled ancient massifs flanking the narrow rift valley',
      'Traversed 35.7 km across the valley floor in LRV'
    ],
    surfaceFeatures: 'Deep fault-bounded valley surrounded by massifs soaring 2,500 meters above the dark valley floor.'
  },

  // ================= CHANDRAYAAN-3 =================
  {
    id: 'chandrayaan-3',
    name: 'Chandrayaan-3',
    subTitle: 'Shiv Shakti Point (Lunar South Pole)',
    category: 'chandrayaan',
    lat: -69.373,
    lng: 32.319,
    elevationMeters: -1980,
    landingDate: 'August 23, 2023',
    agency: 'ISRO',
    country: 'India',
    crew: ['Uncrewed (Vikram Lander & Pragyan Rover)'],
    duration: '1 Lunar Day (14 Earth days)',
    samplesReturnedKg: 0,
    accentColor: '#f97316',
    description: 'Historic milestone making India the first nation in history to achieve a soft touchdown in the high-latitude lunar South Pole region.',
    historicalSignificance: 'Validated indigenous soft-landing technologies and confirmed presence of sulfur, iron, titanium, and aluminum via rover payloads.',
    keyScientificGoals: [
      'ChaSTE probe measured subsurface thermal conductivity gradient (first in-situ polar thermal profile)',
      'Pragyan rover LIBS & APXS spectroscopy confirmed elemental sulfur in polar regolith',
      'RAMBHA-LP evaluated near-surface plasma density',
      'ILSA detected micro-lunar seismic events'
    ],
    surfaceFeatures: 'High-latitude cratered terrain between Manzinus C and Simpelius N craters, with permanent shadow pockets nearby.'
  },

  // ================= ARTEMIS III CANDIDATE REGIONS =================
  {
    id: 'artemis-shackleton-ridge',
    name: 'Shackleton Connecting Ridge',
    subTitle: 'Artemis III Candidate Region',
    category: 'artemis',
    lat: -89.44,
    lng: 140.0,
    elevationMeters: 4200,
    agency: 'NASA / Artemis Program',
    country: 'International Coalition',
    crew: ['Artemis III Crew (Planned 2 Astronauts)'],
    duration: 'Planned ~6.5 Days',
    accentColor: '#a855f7',
    description: 'Prominent ridge connecting Shackleton crater with adjacent relief at 89.4° South. Receives nearly continuous solar illumination (~86-90% of year).',
    historicalSignificance: 'Target site for the first human return to the Moon in over 50 years, and the first woman and person of color to step on the Moon.',
    keyScientificGoals: [
      'Access Permanently Shadowed Regions (PSRs) harboring billion-year-old water ice volatiles',
      'Establish permanent solar power arrays in Peaks of Eternal Light',
      'Sample ancient South Pole-Aitken Basin crustal materials'
    ],
    surfaceFeatures: 'Knife-edge ridge with extreme slopes plunging into cold traps at temperatures below 40 Kelvin (-233°C).'
  },
  {
    id: 'artemis-malapert-mountain',
    name: 'Malapert Mountain (Massif)',
    subTitle: 'Artemis III Candidate Region',
    category: 'artemis',
    lat: -84.9,
    lng: 12.9,
    elevationMeters: 5100,
    agency: 'NASA / Artemis Program',
    country: 'International Coalition',
    crew: ['Artemis III Candidate'],
    duration: 'Planned',
    accentColor: '#a855f7',
    description: 'Colossal mountain peak rising 5,000 meters above surrounding plains. Provides uninterrupted line-of-sight communication with Earth.',
    historicalSignificance: 'Premier hub for communications relays, long-duration solar generation, and scientific exploration of southern polar terrain.',
    keyScientificGoals: [
      'Continuous Earth direct radio visibility for communications without lunar relay satellites',
      'Survey volatiles in neighboring cold traps',
      'Install astronomical long-wave radio telescope arrays'
    ],
    surfaceFeatures: 'Broad high-altitude massif summit with gentle slopes suitable for human lander descent.'
  },
  {
    id: 'artemis-haworth-rim',
    name: 'Haworth Crater Rim',
    subTitle: 'Artemis III Candidate Region',
    category: 'artemis',
    lat: -87.87,
    lng: -5.1,
    elevationMeters: 3800,
    agency: 'NASA / Artemis Program',
    country: 'International Coalition',
    crew: ['Artemis III Candidate'],
    duration: 'Planned',
    accentColor: '#a855f7',
    description: 'Rugged elevated rim adjacent to Haworth Crater, which contains one of the largest permanently shadowed cold traps in the polar zone.',
    historicalSignificance: 'High-priority destination to investigate volatile ice deposits, hydrogen enrichment, and prebiotic organic compounds.',
    keyScientificGoals: [
      'Rover deployment into deep permanent shadow',
      'Analyze volatiles for In-Situ Resource Utilization (ISRU) fuel and oxygen production'
    ],
    surfaceFeatures: 'Steep crater wall overlooking pitch-black crater floors where temperatures never rise above 35 Kelvin.'
  },
  {
    id: 'artemis-nobile-rim',
    name: 'Nobile Rim 1',
    subTitle: 'Artemis III & VIPER Site',
    category: 'artemis',
    lat: -85.2,
    lng: 37.0,
    elevationMeters: 2900,
    agency: 'NASA / Artemis Program',
    country: 'International Coalition',
    crew: ['Artemis III Candidate'],
    duration: 'Planned',
    accentColor: '#a855f7',
    description: 'Elevated plateau adjacent to Nobile crater, selected for its mix of illuminated high points and easily traversable gentle routes to icy shadow zones.',
    historicalSignificance: 'A cornerstone exploration zone for understanding volatile migration, distribution, and stability on airless bodies.',
    keyScientificGoals: [
      'Subsurface regolith drilling down to 1 meter depth',
      'Mapping water ice concentrations via neutron spectrometers'
    ],
    surfaceFeatures: 'Rolling cratered highland terrain with alternating zones of bright sunlight and deep shadow.'
  },

  // ================= FAR SIDE & OTHER NOTABLE MISSIONS =================
  {
    id: 'change-4',
    name: 'Chang\'e 4',
    subTitle: 'Von Kármán Crater (Lunar Far Side)',
    category: 'change',
    lat: -45.444,
    lng: 177.588,
    elevationMeters: -5900,
    landingDate: 'January 3, 2019',
    agency: 'CNSA',
    country: 'China',
    crew: ['Uncrewed (Lander & Yutu-2 Rover)'],
    duration: 'Over 5 Years (Active)',
    samplesReturnedKg: 0,
    accentColor: '#ef4444',
    description: 'First successful soft touchdown on the mysterious Far Side of the Moon, communicating via the Queqiao relay satellite in halo orbit around Earth-Moon L2.',
    historicalSignificance: 'Opened the lunar far side to surface exploration. Yutu-2 has traversed over 1,500 meters, discovering mantle-derived olivine mineral signatures.',
    keyScientificGoals: [
      'Low-frequency radio astronomy free from Earth atmospheric and RF interference',
      'Ground-penetrating radar imaging down to 40 meters depth',
      'Mini-biosphere experiment germinating cotton seeds on the Moon'
    ],
    surfaceFeatures: 'Ancient basalt-flooded floor of Von Kármán crater inside the monumental South Pole-Aitken basin.'
  },
  {
    id: 'change-5',
    name: 'Chang\'e 5',
    subTitle: 'Mons Rümker (Oceanus Procellarum)',
    category: 'change',
    lat: 43.0576,
    lng: -51.9161,
    elevationMeters: -2570,
    landingDate: 'December 1, 2020',
    agency: 'CNSA',
    country: 'China',
    crew: ['Uncrewed (Sample Return)'],
    duration: '48 hrs (Surface)',
    samplesReturnedKg: 1.731,
    accentColor: '#ef4444',
    description: 'First robotic sample return mission since Soviet Luna 24 in 1976. Drilled and scooped volcanic rocks from the geologically young northern Ocean of Storms.',
    historicalSignificance: 'Radiometric dating revealed volcanic activity continued on the Moon until 2.0 billion years ago—over a billion years later than previously believed.',
    keyScientificGoals: [
      'Drilled core sample up to 2 meters depth',
      'Automated lunar orbit rendezvous and sample capsule return to Earth',
      'Discovered new lunar mineral Changesite-(Y)'
    ],
    surfaceFeatures: 'Extremely young basaltic lava flows with smooth topography and sparse crater density.'
  },
  {
    id: 'luna-2',
    name: 'Luna 2',
    subTitle: 'Palus Putredinis (Mare Imbrium)',
    category: 'historic',
    lat: 29.1,
    lng: 0.0,
    elevationMeters: -2100,
    landingDate: 'September 13, 1959',
    agency: 'Soviet Space Program',
    country: 'USSR',
    crew: ['Uncrewed (Impact probe)'],
    duration: 'Impacted surface',
    accentColor: '#eab308',
    description: 'First human-made spacecraft to reach another celestial body, impacting the Moon east of Mare Serenitatis near the Archimedes crater.',
    historicalSignificance: 'Confirmed the Moon possesses no significant dipole magnetic field or radiation belts comparable to Earth\'s Van Allen belts.',
    keyScientificGoals: [
      'Cosmic ray and micrometeoroid detection',
      'First direct measurement of solar wind flux outside Earth magnetosphere'
    ],
    surfaceFeatures: 'Lava plain bounded by the towering Apennine mountain range.'
  },

  // ================= MAJOR GEOLOGICAL CRATERS =================
  {
    id: 'tycho-crater',
    name: 'Tycho Crater',
    subTitle: 'Young Rayed Impact Crater',
    category: 'geological',
    lat: -43.3,
    lng: -11.2,
    elevationMeters: -4800,
    agency: 'Geological Feature',
    country: 'Lunar Feature',
    accentColor: '#22c55e',
    description: 'A 85-km-wide, 4.8-km-deep impact crater formed approximately 108 million years ago during Earth\'s Cretaceous era (dinosaur age).',
    historicalSignificance: 'Its immense bright ejecta rays stretch across more than 1,500 kilometers of the lunar near side, easily visible to the naked eye from Earth.',
    keyScientificGoals: [
      'Benchmark for calibration of lunar crater chronology',
      'Central peak rises 1.6 km above crater floor',
      'Surveyed closely by Surveyor 7 in 1968'
    ],
    surfaceFeatures: 'Sharp rim, terraced walls, massive central mountain peak, and prominent radial ray streaks.'
  },
  {
    id: 'copernicus-crater',
    name: 'Copernicus Crater',
    subTitle: 'The "Monarch of the Moon"',
    category: 'geological',
    lat: 9.62,
    lng: -20.08,
    elevationMeters: -3800,
    agency: 'Geological Feature',
    country: 'Lunar Feature',
    accentColor: '#22c55e',
    description: 'Spectacular 93-km-wide crater located in eastern Oceanus Procellarum, representing the prototype of late-stage lunar impact cratering.',
    historicalSignificance: 'Dubbed the "Monarch of the Moon" by astronomer Thomas Gwyn Elger. Defines the Copernican System period in lunar geological history.',
    keyScientificGoals: [
      'Study deep crust excavation and impact melt sheet dynamics',
      'Multiple central peaks rising 1.2 km above floor',
      'Sampled indirectly via rays crossed by Apollo 12'
    ],
    surfaceFeatures: 'Hexagonal crater rim, tiered terrace walls, flat crater floor filled with hummocky impact melt.'
  },

  // 1. Shackleton Crater
  {
    id: 'shackleton-crater',
    name: 'Shackleton Crater',
    subTitle: 'South Pole Cold Trap & Artemis Exploration Hub',
    category: 'geological',
    lat: -89.67,
    lng: 129.78,
    elevationMeters: -3800,
    agency: 'IAU / Lunar Feature',
    country: 'South Polar Region',
    accentColor: '#10b981',
    description: 'An impact crater 21 km wide and 4.2 km deep situated directly on the lunar South Pole. Named after Antarctic explorer Sir Ernest Shackleton.',
    historicalSignificance: 'Its peaks receive quasi-continuous sunlight (up to 90% of the year), while its deep interior floor lies in perpetual darkness under 40 Kelvin (-233°C), harboring ancient volatile ice deposits.',
    keyScientificGoals: [
      'Extract water ice and volatiles for rocket propellants and life support',
      'Deploy solar power arrays along the illuminated rim crests',
      'Establish permanent infrastructure for long-term crewed scientific bases',
      'Sample primitive volatile ice records dating back billions of years'
    ],
    surfaceFeatures: 'Steep 30° crater walls plunging into pitch-black permanent shadows, surrounded by peaks of near-eternal light.'
  },

  // 2. South Pole-Aitken Basin
  {
    id: 'south-pole-aitken-basin',
    name: 'South Pole-Aitken Basin',
    subTitle: 'Largest & Deepest Impact Structure in Solar System',
    category: 'geological',
    lat: -53.0,
    lng: -169.0,
    elevationMeters: -9150,
    agency: 'IAU / Lunar Feature',
    country: 'Lunar Far Side',
    accentColor: '#8b5cf6',
    description: 'A colossal pre-Nectarian impact basin spanning roughly 2,500 km across the lunar far side. Reaches the lowest elevation on the Moon (-9,150 m in Antoniadi crater).',
    historicalSignificance: 'The oldest, largest, and deepest impact basin recognized on the Moon. Excavated deep into the lunar lower crust and potentially exposed the upper mantle.',
    keyScientificGoals: [
      'Sample excavated deep-seated mantle and lower-crust rocks (pyroxene, anorthosite)',
      'Constrain the timing and magnitude of the Late Heavy Bombardment',
      'Investigate giant impact excavation and melt-sheet differentiation dynamics',
      'Ground truth farside geological history (Chang\'e 4 & Chang\'e 6 landing zone)'
    ],
    surfaceFeatures: 'Vast low-albedo depression with mountainous multi-ring boundaries, flooded floors, and severe gravitational anomalies.'
  },

  // 3. Newton Crater
  {
    id: 'newton-crater',
    name: 'Newton Crater',
    subTitle: 'Deep Near-Side Southern Limb Crater',
    category: 'geological',
    lat: -76.52,
    lng: -17.44,
    elevationMeters: -4200,
    agency: 'IAU / Lunar Feature',
    country: 'Lunar Near Side',
    accentColor: '#10b981',
    description: 'A massive 78-km-wide and over 6.1-km-deep impact crater located in the rugged southern highlands near the limb. Named after Sir Isaac Newton.',
    historicalSignificance: 'One of the deepest craters visible from Earth. Its towering terraced rim prevents sunlight from ever reaching a large portion of the southern crater floor.',
    keyScientificGoals: [
      'Analyze extreme shadow zones on the near-side southern limb',
      'Examine complex terraced wall slumping and multi-stage collapse',
      'Investigate secondary cratering and impact melt pools'
    ],
    surfaceFeatures: 'Deeply sunken, irregular floor dissected by shadows, surrounded by high terraced walls.'
  },

  // 4. Cabeus Crater
  {
    id: 'cabeus-crater',
    name: 'Cabeus Crater',
    subTitle: 'Confirmed Lunar Water Ice Reservoir (LCROSS Site)',
    category: 'geological',
    lat: -85.33,
    lng: -35.50,
    elevationMeters: -4800,
    agency: 'IAU / Lunar Feature',
    country: 'South Polar Region',
    accentColor: '#06b6d4',
    description: 'A 100-km-wide, 5.9-km-deep impact crater located near the South Pole. Named after 17th-century Italian philosopher Niccolò Cabeo.',
    historicalSignificance: 'Target of NASA\'s LCROSS kinetic impactor on October 9, 2009. Spectral analysis of the ejecta plume conclusively confirmed water ice (~5.6% by mass) alongside hydroxyl, methane, and carbon monoxide.',
    keyScientificGoals: [
      'Quantify total subsurface volatile inventories and isotopic composition',
      'Determine solar-wind vs. cometary origin of trapped water molecules',
      'In-situ resource extraction for water and propellant production'
    ],
    surfaceFeatures: 'Heavily eroded ancient rim, deep floor cold traps, with significant hydrogen concentration measured by neutron spectrometers.'
  },

  // 5. Shoemaker Crater
  {
    id: 'shoemaker-crater',
    name: 'Shoemaker Crater',
    subTitle: 'Hydrogen-Rich South Polar Cold Trap',
    category: 'geological',
    lat: -88.1,
    lng: 44.9,
    elevationMeters: -3500,
    agency: 'IAU / Lunar Feature',
    country: 'South Polar Region',
    accentColor: '#10b981',
    description: 'A 50.9-km-wide impact crater located near the South Pole. Named in honor of astrogeology pioneer Eugene Shoemaker.',
    historicalSignificance: 'Final resting place of Dr. Eugene Shoemaker, whose ashes were carried aboard NASA\'s Lunar Prospector spacecraft and impacted into the crater on July 31, 1999.',
    keyScientificGoals: [
      'Direct ground-truth measurement of high-concentration hydrogen deposits',
      'Study long-term thermal retention of water ice in 40 K cold traps',
      'Investigate ancient impact regolith mixing at polar latitudes'
    ],
    surfaceFeatures: 'Permanently shadowed interior basin, circular rim pocked with micro-impacts.'
  },

  // 6. Faustini Crater
  {
    id: 'faustini-crater',
    name: 'Faustini Crater',
    subTitle: 'Perennial Cold Trap Crater',
    category: 'geological',
    lat: -87.18,
    lng: 84.31,
    elevationMeters: -3700,
    agency: 'IAU / Lunar Feature',
    country: 'South Polar Region',
    accentColor: '#10b981',
    description: 'A 39-km-wide impact crater located between Shoemaker and Amundsen. Named after Italian polar cartographer Arnaldo Faustini.',
    historicalSignificance: 'Houses one of the most stable thermal cold traps on the Moon, where sub-surface ice remains stable over multi-billion-year geologic timescales.',
    keyScientificGoals: [
      'Core drilling into undisturbed polar permafrost and cryosphere',
      'Assess stability of surface ice under micro-meteorite bombardment',
      'Map radar backscatter cross-sections to determine ice thickness'
    ],
    surfaceFeatures: 'Rugged degraded rim with continuous shadow covering over 80% of the crater floor.'
  },

  // 7. Haworth Crater
  {
    id: 'haworth-crater',
    name: 'Haworth Crater',
    subTitle: 'Ultra-Cold PSR Trap (< 35 Kelvin)',
    category: 'geological',
    lat: -87.45,
    lng: -51.17,
    elevationMeters: -4100,
    agency: 'IAU / Lunar Feature',
    country: 'South Polar Region',
    accentColor: '#06b6d4',
    description: 'A 51.4-km-wide crater located in the south-polar region near Malapert mountain. Named after British radio astronomer Walter Norman Haworth.',
    historicalSignificance: 'Measured by LRO Diviner to reach temperatures below 35 Kelvin (-238°C), making it one of the coldest recorded locations in the solar system, capable of trapping extremely volatile species like methane and nitrogen.',
    keyScientificGoals: [
      'Search for super-volatile compounds (carbon dioxide, ammonia, methane)',
      'Analyze prebiotic organic chemistry delivered by primitive comets',
      'Deploy autonomous cryogenic exploration rovers'
    ],
    surfaceFeatures: 'Deep bowl-shaped depression with high rims and perpetual sub-surface cryogenic freezing conditions.'
  },

  // 8. De Gerlache Crater
  {
    id: 'de-gerlache-crater',
    name: 'De Gerlache Crater',
    subTitle: 'Connecting Ridge Polar Crater',
    category: 'geological',
    lat: -88.34,
    lng: -67.59,
    elevationMeters: -3600,
    agency: 'IAU / Lunar Feature',
    country: 'South Polar Region',
    accentColor: '#10b981',
    description: 'A 32.7-km-wide impact crater situated between Shackleton and Haworth. Named after Belgian Antarctic explorer Adrien de Gerlache.',
    historicalSignificance: 'The ridge linking De Gerlache with Shackleton is a candidate landing site for NASA\'s Artemis III human landing missions, providing high solar visibility and immediate proximity to shadowed ice stores.',
    keyScientificGoals: [
      'High-bandwidth direct optical communication links to Earth',
      'Surface traversing from illuminated ridge into cryogenic shadow traps',
      'Install persistent solar power arrays and regenerative fuel cells'
    ],
    surfaceFeatures: 'Illuminated narrow rim crest with steep internal drops into deep permanently shadowed interior.'
  },

  // 9. Sverdrup Crater
  {
    id: 'sverdrup-crater',
    name: 'Sverdrup Crater',
    subTitle: 'Farside South Polar Basin',
    category: 'geological',
    lat: -88.32,
    lng: -153.39,
    elevationMeters: -3900,
    agency: 'IAU / Lunar Feature',
    country: 'South Polar Far Side',
    accentColor: '#10b981',
    description: 'A 35-km-wide crater located on the lunar far side just 50 km from the South Pole. Named after Norwegian Arctic oceanographer Otto Sverdrup.',
    historicalSignificance: 'Its farside polar location shields it completely from Earth\'s radio interference, making its rim one of the premier candidate locations for lunar low-frequency radio astronomy arrays.',
    keyScientificGoals: [
      'Establish radio-quiet cosmological observatories to probe the cosmic Dark Ages',
      'Analyze volatile sequestration on the farside polar hemisphere',
      'Explore deep crustal far-side impact breccia'
    ],
    surfaceFeatures: 'Rounded crater rim with complete perpetual shadow over its central floor.'
  },

  // 10. Nobile Crater
  {
    id: 'nobile-crater',
    name: 'Nobile Crater',
    subTitle: 'NASA VIPER Rover Primary Target',
    category: 'geological',
    lat: -85.28,
    lng: 53.27,
    elevationMeters: -3600,
    agency: 'IAU / Lunar Feature',
    country: 'South Polar Region',
    accentColor: '#f59e0b',
    description: 'A 79.3-km-wide crater situated near the South Pole. Named after Italian aeronautical explorer Umberto Nobile.',
    historicalSignificance: 'Primary target region selected for NASA\'s Volatiles Investigating Polar Exploration Rover (VIPER) mission to map the distribution and concentration of ice and volatiles in the lunar regolith.',
    keyScientificGoals: [
      'Deploy 1-meter drill to sample subsurface volatile gradient',
      'Determine if ice exists as uniform layers, crystalline sheets, or discrete grains',
      'Create high-resolution lunar resource maps for future Artemis basecamp development'
    ],
    surfaceFeatures: 'Terraced crater rim surrounded by accessible rolling plateaus and multiple shadowed micro-cold traps.'
  },

  // 11. Schrödinger Basin
  {
    id: 'schrodinger-basin',
    name: 'Schrödinger Basin',
    subTitle: 'Young Peak-Ring Impact Basin with Volcanic Vents',
    category: 'geological',
    lat: -75.0,
    lng: 132.4,
    elevationMeters: -4500,
    agency: 'IAU / Lunar Feature',
    country: 'Lunar Far Side',
    accentColor: '#a855f7',
    description: 'A magnificent 312-km-wide peak-ring impact basin located near the South Pole on the far side. Named after Austrian quantum physicist Erwin Schrödinger.',
    historicalSignificance: 'The second youngest impact basin on the Moon after Orientale. Features a stunning inner peak ring, complex faults, and a deep explosive volcanic pyroclastic vent that erupted deep-seated magma.',
    keyScientificGoals: [
      'Sample deep lunar crust and mantle rocks uplifted in the peak ring',
      'Investigate explosive pyroclastic volcanism and volatile degassing',
      'Install lunar farside seismic and heat-flow geophysical stations',
      'Explore candidate landing site for robotic and crewed exploration'
    ],
    surfaceFeatures: 'Multi-ring basin structure, inner ring of peaks rising up to 2.5 km, graben rilles, and dark pyroclastic ash deposits.'
  },

  // 12. Amundsen Crater
  {
    id: 'amundsen-crater',
    name: 'Amundsen Crater',
    subTitle: 'Colossal South Polar Complex Crater',
    category: 'geological',
    lat: -84.44,
    lng: 83.07,
    elevationMeters: -4300,
    agency: 'IAU / Lunar Feature',
    country: 'South Polar Region',
    accentColor: '#10b981',
    description: 'A massive complex crater 103.4 km in diameter and 5.8 km deep near the South Pole. Named after Norwegian explorer Roald Amundsen, first human to reach Earth\'s South Pole.',
    historicalSignificance: 'One of the largest craters in the south polar region. Features pronounced multi-tiered wall slump terraces, an off-center central peak, and extensive permanently shadowed zones rich in hydrogen.',
    keyScientificGoals: [
      'Study large-scale terrace slumping and complex crater mechanics',
      'Analyze volatile concentration across shadowed crater floor terraces',
      'Sample central peak rocks uplifted from depths over 10 kilometers'
    ],
    surfaceFeatures: 'Terraced rim walls, broad flat floor, central mountain massifs, and extensive cold-trap shadows.'
  },

  // 13. Amundsen-Ganswindt Basin
  {
    id: 'amundsen-ganswindt-basin',
    name: 'Amundsen-Ganswindt Basin',
    subTitle: 'Ancient Pre-Nectarian Polar Basin',
    category: 'geological',
    lat: -81.1,
    lng: 120.0,
    elevationMeters: -3900,
    agency: 'IAU / Lunar Feature',
    country: 'South Polar Far Side',
    accentColor: '#8b5cf6',
    description: 'An ancient pre-Nectarian impact basin roughly 355 km across, underlying the lunar south polar farside between craters Amundsen and Ganswindt.',
    historicalSignificance: 'Represents one of the oldest impact structures preserved in the southern hemisphere, deeply degraded by subsequent impacts including the Schrödinger basin.',
    keyScientificGoals: [
      'Constrain the earliest chronology of lunar basin formation (~4.2 to 4.3 billion years ago)',
      'Analyze basin-ejecta overlap with the South Pole-Aitken and Schrödinger events',
      'Study ancient crustal composition prior to the cataclysmic bombardment'
    ],
    surfaceFeatures: 'Subdued circular topographic depression overlain by dense secondary impact craters and highland anorthositic ejecta.'
  }
];

export interface LunarLandmarkRegion {
  name: string;
  lat: number;
  lng: number;
  radius: number;
}

// Landmark lunar regions for geographic identification & proximity search
export const LUNAR_LANDMARKS: LunarLandmarkRegion[] = [
  { name: 'Mare Tranquillitatis', lat: 8, lng: 31, radius: 14 },
  { name: 'Oceanus Procellarum', lat: 18, lng: -57, radius: 28 },
  { name: 'Mare Imbrium', lat: 32, lng: -15, radius: 18 },
  { name: 'Mare Serenitatis', lat: 28, lng: 17, radius: 12 },
  { name: 'Mare Crisium', lat: 17, lng: 59, radius: 9 },
  { name: 'Mare Fecunditatis', lat: -7, lng: 51, radius: 13 },
  { name: 'Mare Nectaris', lat: -15, lng: 35, radius: 8 },
  { name: 'Mare Nubium', lat: -21, lng: -16, radius: 11 },
  { name: 'Mare Humorum', lat: -24, lng: -38, radius: 7 },
  { name: 'South Pole-Aitken Basin', lat: -53, lng: -169, radius: 28 },
  { name: 'Mare Orientale', lat: -19, lng: -92, radius: 10 },
  { name: 'Tycho Crater Region', lat: -43.3, lng: -11.2, radius: 5 },
  { name: 'Copernicus Crater Region', lat: 9.6, lng: -20.1, radius: 5 },
  { name: 'Lunar South Pole (Artemis Target)', lat: -89.0, lng: 0, radius: 6 },
  { name: 'Lunar North Pole (Peary Region)', lat: 89.0, lng: 0, radius: 6 },
  { name: 'Mare Moscoviense (Far Side)', lat: 27, lng: 147, radius: 8 },
  { name: 'Shackleton Crater', lat: -89.67, lng: 129.78, radius: 1.5 },
  { name: 'Cabeus Crater', lat: -85.33, lng: -35.50, radius: 4 },
  { name: 'Shoemaker Crater', lat: -88.1, lng: 44.9, radius: 2.5 },
  { name: 'Faustini Crater', lat: -87.18, lng: 84.31, radius: 2.5 },
  { name: 'Haworth Crater', lat: -87.45, lng: -51.17, radius: 3 },
  { name: 'De Gerlache Crater', lat: -88.34, lng: -67.59, radius: 2.5 },
  { name: 'Sverdrup Crater', lat: -88.32, lng: -153.39, radius: 2.5 },
  { name: 'Nobile Crater', lat: -85.28, lng: 53.27, radius: 3.5 },
  { name: 'Newton Crater', lat: -76.52, lng: -17.44, radius: 3.5 },
  { name: 'Schrödinger Basin', lat: -75.0, lng: 132.4, radius: 8 },
  { name: 'Amundsen Crater', lat: -84.44, lng: 83.07, radius: 4 },
  { name: 'Amundsen-Ganswindt Basin', lat: -81.1, lng: 120.0, radius: 10 },
];

