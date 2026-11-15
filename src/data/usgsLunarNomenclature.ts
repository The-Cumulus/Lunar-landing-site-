export interface USGSNomenclatureFeature {
  id: string;
  name: string;
  cleanName: string;
  category: 'crater' | 'landing_site' | 'mare' | 'mons' | 'vallis';
  lat: number;
  lng: number;
  diameterKm?: number;
  depthKm?: number;
  origin: string;
  quadName?: string;
  geologicEra?: string;
  scientificNotes: string;
}

export const USGS_LUNAR_NOMENCLATURE: USGSNomenclatureFeature[] = [
  // ================= MAJOR IMPACT CRATERS =================
  {
    id: 'crater-tycho',
    name: 'Tycho',
    cleanName: 'Tycho Crater',
    category: 'crater',
    lat: -43.31000,
    lng: -11.20000,
    diameterKm: 86.0,
    depthKm: 4.8,
    origin: 'Tycho Brahe (1546–1601), Danish astronomer who made accurate astronomical observations.',
    quadName: 'LQ26 (Tycho)',
    geologicEra: 'Copernican (~108 million years old)',
    scientificNotes: 'Prominent young impact crater renowned for its vast system of bright rays extending over 1,500 km across the lunar nearside. Features a 1.6-km-tall central peak and sharply terraced walls.'
  },
  {
    id: 'crater-copernicus',
    name: 'Copernicus',
    cleanName: 'Copernicus Crater',
    category: 'crater',
    lat: 9.62000,
    lng: -20.08000,
    diameterKm: 93.0,
    depthKm: 3.8,
    origin: 'Nicolaus Copernicus (1473–1543), Polish astronomer who formulated the heliocentric model.',
    quadName: 'LQ11 (Copernicus)',
    geologicEra: 'Copernican (~800 million years old)',
    scientificNotes: 'Referred to by Johannes Hevelius as the "Monarch of the Moon". Archetype of a complex impact crater with multi-tiered slump terraces, three central mountain peaks, and massive ray ejecta.'
  },
  {
    id: 'crater-kepler',
    name: 'Kepler',
    cleanName: 'Kepler Crater',
    category: 'crater',
    lat: 8.12000,
    lng: -38.01000,
    diameterKm: 31.0,
    depthKm: 2.6,
    origin: 'Johannes Kepler (1571–1630), German astronomer and mathematician who formulated the laws of planetary motion.',
    quadName: 'LQ10 (Kepler)',
    geologicEra: 'Copernican',
    scientificNotes: 'Sharp ray crater located between Oceanus Procellarum and Mare Insularum. Its high albedo rays intersect with the rays from Copernicus.'
  },
  {
    id: 'crater-aristarchus',
    name: 'Aristarchus',
    cleanName: 'Aristarchus Crater',
    category: 'crater',
    lat: 23.73000,
    lng: -47.49000,
    diameterKm: 40.0,
    depthKm: 3.7,
    origin: 'Aristarchus of Samos (c. 310–230 BC), Greek astronomer who first proposed a heliocentric universe.',
    quadName: 'LQ04 (Aristarchus)',
    geologicEra: 'Copernican (~450 million years old)',
    scientificNotes: 'The brightest large geographic feature on the Moon with an albedo almost double that of surrounding mare terrain. Located on the Aristarchus Plateau, a region rich in pyroclastic volcanic ash and the Vallis Schröteri rille.'
  },
  {
    id: 'crater-clavius',
    name: 'Clavius',
    cleanName: 'Clavius Basin / Crater',
    category: 'crater',
    lat: -58.40000,
    lng: -14.40000,
    diameterKm: 225.0,
    depthKm: 4.9,
    origin: 'Christopher Clavius (1538–1612), German Jesuit mathematician and astronomer who contributed to the Gregorian calendar.',
    quadName: 'LQ28 (Clavius)',
    geologicEra: 'Nectarian (~3.92 billion years old)',
    scientificNotes: 'One of the largest craters on the lunar nearside, visible even to the naked eye. Famous for its curving internal arc of descending craterlets (Rutherfurd, Clavius D, C, N, J, JA). SOFIA detected molecular water ice here in 2020.'
  },
  {
    id: 'crater-plato',
    name: 'Plato',
    cleanName: 'Plato Crater',
    category: 'crater',
    lat: 51.62000,
    lng: -9.38000,
    diameterKm: 101.0,
    depthKm: 2.0,
    origin: 'Plato (c. 427–347 BC), Classical Greek philosopher.',
    quadName: 'LQ02 (Plato)',
    geologicEra: 'Upper Imbrian',
    scientificNotes: 'Flooded crater in the Montes Alpes with an exceptionally dark, flat basaltic interior floor with low albedo. Its jagged rim walls cast dramatic needle-sharp shadows across the floor during sunrise.'
  },
  {
    id: 'crater-archimedes',
    name: 'Archimedes',
    cleanName: 'Archimedes Crater',
    category: 'crater',
    lat: 29.72000,
    lng: -3.99000,
    diameterKm: 83.0,
    depthKm: 2.1,
    origin: 'Archimedes (c. 287–212 BC), Greek mathematician and engineer of Syracuse.',
    quadName: 'LQ03 (Archimedes)',
    geologicEra: 'Upper Imbrian (~3.8 billion years old)',
    scientificNotes: 'Largest crater within the interior plain of Mare Imbrium. Its floor is completely filled by smooth mare basalt, lacking a central peak because lava flooded the excavation cavity.'
  },
  {
    id: 'crater-ptolemaeus',
    name: 'Ptolemaeus',
    cleanName: 'Ptolemaeus Walled Plain',
    category: 'crater',
    lat: -9.28000,
    lng: -1.84000,
    diameterKm: 153.0,
    depthKm: 2.4,
    origin: 'Claudius Ptolemy (c. 100–170 AD), Greco-Egyptian astronomer and author of the Almagest.',
    quadName: 'LQ19 (Ptolemaeus)',
    geologicEra: 'Nectarian',
    scientificNotes: 'Prominent ancient walled plain located near the center of the lunar disk (Prime Meridian). Its level floor is pocked with ghost craters and the sharp 9-km crater Ammonius.'
  },
  {
    id: 'crater-alphonsus',
    name: 'Alphonsus',
    cleanName: 'Alphonsus Crater',
    category: 'crater',
    lat: -13.40000,
    lng: -2.80000,
    diameterKm: 119.0,
    depthKm: 2.7,
    origin: 'Alfonso X of Castile (1221–1284), King known as "El Sabio" who sponsored the Alfonsine astronomical tables.',
    quadName: 'LQ19 (Ptolemaeus)',
    geologicEra: 'Nectarian',
    scientificNotes: 'Features a steep central peak rising 1.5 km and dark-halo volcanic vent spots along internal fractures. Crash site of NASA Ranger 9 in 1965.'
  },
  {
    id: 'crater-theophilus',
    name: 'Theophilus',
    cleanName: 'Theophilus Crater',
    category: 'crater',
    lat: -11.45000,
    lng: 26.28000,
    diameterKm: 100.0,
    depthKm: 4.4,
    origin: 'Theophilus of Alexandria (died 412 AD), Coptic patriarch and astronomer.',
    quadName: 'LQ20 (Theophilus)',
    geologicEra: 'Eratosthenian (~3.2 billion years old)',
    scientificNotes: 'Deep impact crater overlapping Cyrillus on the northwestern edge of Mare Nectaris. Has an enormous triple central peak rising 1.4 km above the crater floor.'
  },
  {
    id: 'crater-langrenus',
    name: 'Langrenus',
    cleanName: 'Langrenus Crater',
    category: 'crater',
    lat: -8.86000,
    lng: 61.04000,
    diameterKm: 132.0,
    depthKm: 4.5,
    origin: 'Michiel Florent van Langren (1598–1675), Belgian astronomer and cartographer who produced the first lunar map with nomenclature.',
    quadName: 'LQ21 (Langrenus)',
    geologicEra: 'Eratosthenian',
    scientificNotes: 'Magnificent circular impact crater on the eastern shore of Mare Fecunditatis. Has a stepped inner terrace wall up to 20 km wide and twin central peaks.'
  },
  {
    id: 'crater-petavius',
    name: 'Petavius',
    cleanName: 'Petavius Crater',
    category: 'crater',
    lat: -25.29000,
    lng: 60.78000,
    diameterKm: 182.0,
    depthKm: 3.4,
    origin: 'Denis Pétau (Dionysius Petavius, 1583–1652), French Jesuit theologian and chronological scholar.',
    quadName: 'LQ21 (Langrenus)',
    geologicEra: 'Imbrian',
    scientificNotes: 'Large walled crater renowned for Rima Petavius, an immense deep graben fracture that runs from the central mountain peak all the way to the southwestern rim.'
  },
  {
    id: 'crater-eratosthenes',
    name: 'Eratosthenes',
    cleanName: 'Eratosthenes Crater',
    category: 'crater',
    lat: 14.50000,
    lng: -11.30000,
    diameterKm: 58.0,
    depthKm: 3.6,
    origin: 'Eratosthenes of Cyrene (c. 276–194 BC), Greek mathematician and geographer who first calculated Earth\'s circumference.',
    quadName: 'LQ11 (Copernicus)',
    geologicEra: 'Eratosthenian',
    scientificNotes: 'Type feature defining the Eratosthenian stratigraphic period. Sits at the western terminus of the Montes Apenninus range with steep terraced walls.'
  },
  {
    id: 'crater-gassendi',
    name: 'Gassendi',
    cleanName: 'Gassendi Crater',
    category: 'crater',
    lat: -17.55000,
    lng: -39.96000,
    diameterKm: 110.0,
    depthKm: 2.8,
    origin: 'Pierre Gassendi (1592–1655), French astronomer and philosopher who observed the 1631 transit of Mercury.',
    quadName: 'LQ18 (Gassendi)',
    geologicEra: 'Nectarian',
    scientificNotes: 'Floor-fractured crater on the northern edge of Mare Humorum. Covered by criss-crossing rilles (Rimae Gassendi) created by magma intrusion beneath the floor.'
  },
  {
    id: 'crater-bullialdus',
    name: 'Bullialdus',
    cleanName: 'Bullialdus Crater',
    category: 'crater',
    lat: -20.70000,
    lng: -22.20000,
    diameterKm: 61.0,
    depthKm: 3.5,
    origin: 'Ismaël Bullialdus (Boulliau, 1605–1694), French astronomer who proposed an inverse-square law for gravity.',
    quadName: 'LQ19 (Ptolemaeus)',
    geologicEra: 'Upper Imbrian',
    scientificNotes: 'Isolated complex crater in western Mare Nubium with crisp polygonal rim, pristine slump terraces, and multiple central peaks.'
  },
  {
    id: 'crater-posidonius',
    name: 'Posidonius',
    cleanName: 'Posidonius Crater',
    category: 'crater',
    lat: 31.80000,
    lng: 29.90000,
    diameterKm: 95.0,
    depthKm: 2.3,
    origin: 'Posidonius of Apamea (c. 135–51 BC), Greek Stoic philosopher and astronomer.',
    quadName: 'LQ05 (Posidonius)',
    geologicEra: 'Upper Imbrian',
    scientificNotes: 'Spectacular floor-fractured crater located along the boundary of Mare Serenitatis and Lacus Somniorum, featuring an inner secondary ring wall and sinuous rilles.'
  },
  {
    id: 'crater-shackleton',
    name: 'Shackleton',
    cleanName: 'Shackleton Crater',
    category: 'crater',
    lat: -89.67000,
    lng: 129.78000,
    diameterKm: 21.0,
    depthKm: 4.2,
    origin: 'Sir Ernest Shackleton (1874–1922), Anglo-Irish Antarctic explorer.',
    quadName: 'LQ30 (Lunar South Pole)',
    geologicEra: 'Eratosthenian',
    scientificNotes: 'Ultra-cold south polar impact crater with near-perpetual sunlight along its rim crests and perpetual cryogenic shadow (< 40 K) on its floor, harboring billions of kilograms of water ice deposits.'
  },
  {
    id: 'crater-cabeus',
    name: 'Cabeus',
    cleanName: 'Cabeus Crater',
    category: 'crater',
    lat: -85.33000,
    lng: -35.50000,
    diameterKm: 100.0,
    depthKm: 4.0,
    origin: 'Niccolò Cabeo (1586–1650), Italian Jesuit philosopher and physicist who studied magnetism.',
    quadName: 'LQ30 (Lunar South Pole)',
    geologicEra: 'Nectarian',
    scientificNotes: 'Site of NASA\'s historic LCROSS kinetic impact in October 2009, which excavated a plume of vapor and dust directly proving the existence of water ice (5.5 wt%), methane, and carbon dioxide in polar cold traps.'
  },
  {
    id: 'crater-shoemaker',
    name: 'Shoemaker',
    cleanName: 'Shoemaker Crater',
    category: 'crater',
    lat: -88.10000,
    lng: 44.90000,
    diameterKm: 51.0,
    depthKm: 3.5,
    origin: 'Eugene M. Shoemaker (1928–1997), American pioneer in astrogeology who co-discovered Comet Shoemaker-Levy 9.',
    quadName: 'LQ30 (Lunar South Pole)',
    geologicEra: 'Nectarian',
    scientificNotes: 'Permanently shadowed south polar cold trap crater. Resting place of Dr. Eugene Shoemaker\'s memorial ashes delivered by NASA Lunar Prospector in 1999.'
  },
  {
    id: 'crater-schrodinger',
    name: 'Schrödinger',
    cleanName: 'Schrödinger Peak-Ring Basin',
    category: 'crater',
    lat: -75.00000,
    lng: 132.40000,
    diameterKm: 312.0,
    depthKm: 4.5,
    origin: 'Erwin Schrödinger (1887–1961), Austrian physicist and Nobel laureate who formulated wave mechanics.',
    quadName: 'LQ29 (Schrödinger)',
    geologicEra: 'Imbrian (~3.8 billion years old)',
    scientificNotes: 'Second youngest impact basin on the Moon after Orientale. Features an inner peak ring 150 km wide, explosive pyroclastic volcanic vents, and graben faults exposing deep lunar mantle rocks.'
  },

  // ================= HISTORIC LANDING SITES =================
  {
    id: 'landing-apollo-11',
    name: 'Apollo 11 (Statio Tranquillitatis)',
    cleanName: 'Apollo 11 Landing Site',
    category: 'landing_site',
    lat: 0.67408,
    lng: 23.47297,
    origin: 'NASA Apollo 11 Mission (Neil Armstrong & Buzz Aldrin, July 20, 1969).',
    quadName: 'LQ12 (Theophilus / Tranquillitatis)',
    scientificNotes: 'First crewed lunar landing site. Lunar Module "Eagle" landed in southern Mare Tranquillitatis. Returned 21.55 kg of basalt and deployed the Laser Ranging Retroreflector (LRRR).'
  },
  {
    id: 'landing-apollo-12',
    name: 'Apollo 12 & Surveyor 3',
    cleanName: 'Apollo 12 / Surveyor 3 Site',
    category: 'landing_site',
    lat: -3.01239,
    lng: -23.42157,
    origin: 'NASA Apollo 12 Mission (Pete Conrad & Alan Bean, November 19, 1969).',
    quadName: 'LQ18 (Fra Mauro / Procellarum)',
    scientificNotes: 'First pinpoint lunar landing. Touched down 163 meters from the robotic Surveyor 3 lander. Retrieved camera parts to study long-term cosmic radiation exposure.'
  },
  {
    id: 'landing-apollo-14',
    name: 'Apollo 14 (Fra Mauro)',
    cleanName: 'Apollo 14 Landing Site',
    category: 'landing_site',
    lat: -3.64530,
    lng: -17.47136,
    origin: 'NASA Apollo 14 Mission (Alan Shepard & Edgar Mitchell, February 5, 1971).',
    quadName: 'LQ19 (Ptolemaeus)',
    scientificNotes: 'Explored the hilly Fra Mauro ejecta blanket excavated by the Mare Imbrium impact. Sampled deep ancient crustal breccias and deployed ALSEP.'
  },
  {
    id: 'landing-apollo-15',
    name: 'Apollo 15 (Hadley-Apennine)',
    cleanName: 'Apollo 15 Landing Site',
    category: 'landing_site',
    lat: 26.13222,
    lng: 3.63386,
    origin: 'NASA Apollo 15 Mission (David Scott & James Irwin, July 30, 1971).',
    quadName: 'LQ03 (Archimedes / Montes Apenninus)',
    scientificNotes: 'First "J-mission" with the Lunar Roving Vehicle (LRV). Explored the 1.5-km-wide Hadley Rille and the towering 4.6-km-tall Mons Hadley Delta. Discovered the "Genesis Rock" (anorthosite).'
  },
  {
    id: 'landing-apollo-16',
    name: 'Apollo 16 (Descartes Highlands)',
    cleanName: 'Apollo 16 Landing Site',
    category: 'landing_site',
    lat: -8.97301,
    lng: 15.50019,
    origin: 'NASA Apollo 16 Mission (John Young & Charlie Duke, April 21, 1972).',
    quadName: 'LQ20 (Theophilus / Descartes)',
    scientificNotes: 'Only Apollo mission to land in the lunar central highlands. Proved that the Cayley Formation was impact breccia rather than volcanic rhyolite.'
  },
  {
    id: 'landing-apollo-17',
    name: 'Apollo 17 (Taurus-Littrow)',
    cleanName: 'Apollo 17 Landing Site',
    category: 'landing_site',
    lat: 20.19080,
    lng: 30.77168,
    origin: 'NASA Apollo 17 Mission (Eugene Cernan & Harrison Schmitt, December 11, 1972).',
    quadName: 'LQ05 (Posidonius / Taurus-Littrow)',
    scientificNotes: 'Final Apollo lunar landing. Geologist Harrison Schmitt discovered orange volcanic pyroclastic soil at Shorty Crater. Returned 110.5 kg of pristine lunar samples.'
  },
  {
    id: 'landing-chandrayaan-3',
    name: 'Chandrayaan-3 (Shiv Shakti Point)',
    cleanName: 'Chandrayaan-3 Landing Site',
    category: 'landing_site',
    lat: -69.37300,
    lng: 32.31900,
    origin: 'ISRO Chandrayaan-3 Mission (Vikram Lander & Pragyan Rover, August 23, 2023).',
    quadName: 'LQ27 (South Polar Highlands)',
    scientificNotes: 'First successful soft landing in the high-latitude lunar south polar region (69.37° S). Conducted in-situ spectroscopy discovering sulfur, iron, and titanium in high-latitude regolith.'
  },
  {
    id: 'landing-change-4',
    name: 'Chang\'e 4 (Von Kármán / SPA)',
    cleanName: 'Chang\'e 4 Landing Site',
    category: 'landing_site',
    lat: -45.45000,
    lng: 177.60000,
    origin: 'CNSA Chang\'e 4 Mission (Yutu-2 Rover, January 3, 2019).',
    quadName: 'LQ25 (Farside / Von Kármán)',
    scientificNotes: 'First historic soft landing on the lunar far side. Touched down inside Von Kármán Crater in the immense South Pole-Aitken (SPA) basin. Utilized Queqiao relay satellite.'
  },
  {
    id: 'landing-change-6',
    name: 'Chang\'e 6 (Apollo Basin / SPA)',
    cleanName: 'Chang\'e 6 Landing Site',
    category: 'landing_site',
    lat: -41.64000,
    lng: -153.99000,
    origin: 'CNSA Chang\'e 6 Mission, June 1, 2024.',
    quadName: 'LQ24 (Farside / Apollo Basin)',
    scientificNotes: 'First mission in history to collect and return samples from the lunar far side. Successfully retrieved 1,935.3 grams of ancient farside basalt and SPA impact melt.'
  },

  // ================= MAJOR LUNAR MARIA & MOUNTAINS =================
  {
    id: 'mare-tranquillitatis',
    name: 'Mare Tranquillitatis',
    cleanName: 'Sea of Tranquility',
    category: 'mare',
    lat: 8.50000,
    lng: 31.40000,
    diameterKm: 873.0,
    origin: 'Named "Sea of Tranquility" by Francesco Grimaldi and Giovanni Battista Riccioli in 1651.',
    scientificNotes: 'Ancient titanium-rich basaltic plain with high ilmenite concentration. Characterized by irregular margins and distinct bluish spectral tone.'
  },
  {
    id: 'mare-imbrium',
    name: 'Mare Imbrium',
    cleanName: 'Sea of Rains',
    category: 'mare',
    lat: 32.80000,
    lng: -15.60000,
    diameterKm: 1145.0,
    origin: 'Named "Sea of Rains" in 1651 by Riccioli.',
    scientificNotes: 'Colossal impact basin formed 3.85 billion years ago. Ringed by towering mountain arcs (Apennines, Alps, Caucasus) and flooded with multiple basalt flows.'
  },
  {
    id: 'mare-serenitatis',
    name: 'Mare Serenitatis',
    cleanName: 'Sea of Serenity',
    category: 'mare',
    lat: 28.00000,
    lng: 17.50000,
    diameterKm: 707.0,
    origin: 'Named "Sea of Serenity" in 1651 by Riccioli.',
    scientificNotes: 'Circular impact basin displaying prominent mascon (mass concentration) gravity anomalies and dark basaltic margin rings.'
  },
  {
    id: 'mare-crisium',
    name: 'Mare Crisium',
    cleanName: 'Sea of Crises',
    category: 'mare',
    lat: 17.00000,
    lng: 59.10000,
    diameterKm: 555.0,
    origin: 'Named "Sea of Crises" in 1651 by Riccioli.',
    scientificNotes: 'Isolated circular mare basin surrounded by an unbroken highland ring. Home to Soviet automated sample returners Luna 16, Luna 20, and Luna 24.'
  },
  {
    id: 'mons-huygens',
    name: 'Mons Huygens',
    cleanName: 'Mons Huygens (Montes Apenninus)',
    category: 'mons',
    lat: 20.00000,
    lng: -2.90000,
    diameterKm: 40.0,
    origin: 'Christiaan Huygens (1629–1695), Dutch astronomer and physicist who discovered Titan and Saturn\'s rings.',
    scientificNotes: 'The Moon\'s tallest mountain massif, rising approximately 5.5 kilometers (18,000 feet) above the basaltic floor of Mare Imbrium.'
  }
];

/**
 * Generate official GeoJSON FeatureCollection of USGS Lunar Nomenclature
 */
export function getUSGSNomenclatureGeoJSON() {
  return {
    type: 'FeatureCollection',
    features: USGS_LUNAR_NOMENCLATURE.map(feature => ({
      type: 'Feature',
      id: feature.id,
      geometry: {
        type: 'Point',
        coordinates: [feature.lng, feature.lat]
      },
      properties: {
        id: feature.id,
        name: feature.name,
        cleanName: feature.cleanName,
        category: feature.category,
        lat: feature.lat,
        lng: feature.lng,
        diameterKm: feature.diameterKm,
        depthKm: feature.depthKm,
        origin: feature.origin,
        quadName: feature.quadName,
        geologicEra: feature.geologicEra,
        scientificNotes: feature.scientificNotes
      }
    }))
  };
}
