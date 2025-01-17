
export function Header() {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 400 120">
  <defs>
    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" style="stop-color:#FB1F0B;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#FF4D3C;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="400" height="120" fill="white"/>
  <text x="20" y="70" font-family="Arial, sans-serif" font-size="36" font-weight="bold" fill="url(#gradient)">Staccdorp</text>
  <text x="20" y="100" font-family="Arial, sans-serif" font-size="18" fill="#333">by AirShip</text>
</svg>`;

    const svgDataUrl = `data:image/svg+xml,${encodeURIComponent(svg)}`;

    return (
        <img src={svgDataUrl} alt="Staccdorp Logo" className="max-w-xl" />
    );
}
