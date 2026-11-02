import L from 'leaflet';

export const SPACE_TYPE_COLORS: Record<string, string> = {
  COMMUNITY_HALL: '#7c3aed',
  HOSPITAL_ROOM: '#ef4444',
  CLASSROOM: '#f59e0b',
  PWD_OFFICE: '#2563eb',
  TRAINING_HALL: '#10b981',
  TRANSIT_ROOM: '#6b7280',
};

const DEFAULT_SPACE_COLOR = '#6b7280';
const STYLE_ELEMENT_ID = 'space-map-pin-style';

const ensureSpacePinStyles = (): void => {
  if (typeof document === 'undefined') return;
  if (document.getElementById(STYLE_ELEMENT_ID)) return;

  const style = document.createElement('style');
  style.id = STYLE_ELEMENT_ID;
  style.textContent = `
.space-map-pin {
	transition: transform 220ms cubic-bezier(0.34, 1.56, 0.64, 1);
	transform-origin: bottom center;
}

.space-map-pin:hover {
	transform: scale(1.2);
}

.space-map-pin.selected {
	transform: scale(1.28);
	filter: drop-shadow(0 0 7px var(--pin-glow, rgba(124, 58, 237, 0.53)));
}
`;

  document.head.appendChild(style);
};

const getTypeColor = (spaceType: string): string => {
  return SPACE_TYPE_COLORS[spaceType] ?? DEFAULT_SPACE_COLOR;
};

const getSymbolSvg = (spaceType: string): string => {
  const shared =
    'fill="none" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"';

  switch (spaceType) {
    case 'COMMUNITY_HALL':
      return `
<circle cx="18.5" cy="17" r="2" ${shared} />
<circle cx="25.5" cy="17" r="2" ${shared} />
<path d="M14.6 24c0-2.7 1.8-4.8 3.9-4.8s3.9 2.1 3.9 4.8" ${shared} />
<path d="M21.6 24c0-2.7 1.8-4.8 3.9-4.8s3.9 2.1 3.9 4.8" ${shared} />
`;

    case 'HOSPITAL_ROOM':
      return `
<path d="M22 14v12" ${shared} />
<path d="M16 20h12" ${shared} />
`;

    case 'CLASSROOM':
      return `
<path d="M22 16 16 19.5V26l6-3.5" ${shared} />
<path d="M22 16 28 19.5V26l-6-3.5" ${shared} />
<path d="M22 16v6.5" ${shared} />
`;

    case 'PWD_OFFICE':
      return `
<path d="M16 17h12" ${shared} />
<path d="M18 17v10" ${shared} />
<path d="M26 17v10" ${shared} />
`;

    case 'TRAINING_HALL':
      return `
<path d="M14 19 22 15l8 4-8 4-8-4Z" ${shared} />
<path d="M18 21v3.5c0 1.2 1.8 2.2 4 2.2s4-1 4-2.2V21" ${shared} />
<path d="M30 19v4.5" ${shared} />
`;

    case 'TRANSIT_ROOM':
      return `
<path d="M18 20v-2.5a4 4 0 0 1 8 0V20" ${shared} />
<rect x="16" y="20" width="12" height="8" rx="1.4" ${shared} />
`;

    default:
      return `
<path d="M16 17h12" ${shared} />
<path d="M18 17v10" ${shared} />
<path d="M26 17v10" ${shared} />
`;
  }
};

export const createSpaceIcon = (spaceType: string, isSelected: boolean): L.DivIcon => {
  ensureSpacePinStyles();

  const typeColor = getTypeColor(spaceType);
  const pinGlow = `${typeColor}88`;
  const symbol = getSymbolSvg(spaceType);

  return L.divIcon({
    className: isSelected ? 'space-map-pin selected' : 'space-map-pin',
    html: `
<span
	class="space-map-pin${isSelected ? ' selected' : ''}"
	style="--pin-glow:${pinGlow};display:inline-flex;width:44px;height:54px;"
	role="img"
	aria-label="${spaceType.replaceAll('_', ' ').toLowerCase()} pin"
>
	<svg width="44" height="54" viewBox="0 0 44 54" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
		<defs>
			<filter id="space-pin-shadow" x="-30%" y="-20%" width="160%" height="170%">
				<feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="rgba(0,0,0,0.30)" />
			</filter>
			<filter id="space-symbol-contrast" x="-50%" y="-50%" width="200%" height="200%">
				<feDropShadow dx="0" dy="0" stdDeviation="0.7" flood-color="rgba(15,23,42,0.9)" />
			</filter>
		</defs>

		<path
			d="M22 1.5C12.34 1.5 4.5 9.34 4.5 19c0 12.2 17.5 33.5 17.5 33.5S39.5 31.2 39.5 19C39.5 9.34 31.66 1.5 22 1.5Z"
			fill="${typeColor}"
			filter="url(#space-pin-shadow)"
		/>

		<circle cx="22" cy="20" r="10" fill="white" />

		<g filter="url(#space-symbol-contrast)">
			${symbol}
		</g>
	</svg>
</span>
`,
    iconSize: [44, 54],
    iconAnchor: [22, 54],
  });
};
