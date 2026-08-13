/**
 * A rolled die drawn as its own silhouette, with the result inside.
 *
 * A d20 result in a square box looks like a spreadsheet cell. Showing the
 * actual shape means the table can read what was rolled at a glance, without
 * anyone parsing notation.
 */
const SHAPES: Record<number, string> = {
  // Icosahedron seen face-on: a hexagon.
  20: 'M50 3 L91 26 L91 74 L50 97 L9 74 L9 26 Z',
  // Dodecahedron: a pentagon-ish rounded form.
  12: 'M50 4 L94 36 L77 88 L23 88 L6 36 Z',
  // Trapezohedron: a tall kite.
  10: 'M50 3 L92 38 L50 97 L8 38 Z',
  // Octahedron: a diamond.
  8: 'M50 2 L95 50 L50 98 L5 50 Z',
  // Cube: a rounded square.
  6: 'M14 14 H86 A6 6 0 0 1 92 20 V80 A6 6 0 0 1 86 86 H14 A6 6 0 0 1 8 80 V20 A6 6 0 0 1 14 14 Z',
  // Tetrahedron: a triangle.
  4: 'M50 6 L94 88 L6 88 Z'
}

export function DieBadge({
  sides,
  value,
  color,
  size = 64,
  dim = false
}: {
  sides: number
  value: number
  color: string
  size?: number
  dim?: boolean
}): React.JSX.Element {
  const path = SHAPES[sides] ?? SHAPES[6]!
  // Triangles and kites have far less room in the middle than a hexagon.
  const fontSize = sides === 4 ? 34 : sides === 10 ? 36 : 40
  const textY = sides === 4 ? 70 : sides === 10 ? 46 : 50

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ opacity: dim ? 0.55 : 1, display: 'block' }}
      aria-label={`d${sides} showing ${value}`}
    >
      <path d={path} fill={color} fillOpacity={0.22} stroke={color} strokeWidth={4} strokeLinejoin="round" />
      <text
        x="50"
        y={textY}
        textAnchor="middle"
        dominantBaseline="central"
        fill="#ffffff"
        style={{
          fontSize,
          fontWeight: 700,
          fontFamily: 'Georgia, serif',
          paintOrder: 'stroke',
          stroke: '#000000',
          strokeWidth: 3,
          strokeLinejoin: 'round'
        }}
      >
        {value}
      </text>
    </svg>
  )
}
