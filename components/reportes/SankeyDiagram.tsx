'use client'

// ---- Node definitions ----

interface SankeyNode {
  id: string
  label: string
  amount: string
  pct: string
  color: string
  x: number
  y: number
  h: number
  w: number
}

interface SankeyFlow {
  fromId: string
  toId: string
  // source y offset, target y offset, width
  sy: number
  ty: number
  w: number
  color: string
}

const W = 20 // node width

const leftNodes: SankeyNode[] = [
  { id: 'lContPub',  label: 'Contrato Público',    amount: 'S/.4.84M', pct: '52%', color: '#22C55E', x: 120, y: 50,  h: 260, w: W },
  { id: 'lContPri',  label: 'Contrato Privado',    amount: 'S/.2.05M', pct: '22%', color: '#3B82F6', x: 120, y: 320, h: 110, w: W },
  { id: 'lConsult',  label: 'Consultoría Técnica', amount: 'S/.1.30M', pct: '14%', color: '#EAB308', x: 120, y: 440, h:  70, w: W },
  { id: 'lSuperv',   label: 'Supervisión Obras',   amount: 'S/.1.12M', pct: '12%', color: '#8B5CF6', x: 120, y: 520, h:  60, w: W },
]

const centerNodes: SankeyNode[] = [
  { id: 'cR5',      label: 'Carretera Ruta 5',      amount: 'S/.3.72M', pct: '40%', color: '#22C55E', x: 490, y:  30, h: 200, w: W },
  { id: 'cEdif',    label: 'Edificio Sede Gen.',    amount: 'S/.1.86M', pct: '20%', color: '#F97316', x: 490, y: 240, h: 100, w: W },
  { id: 'cPuente',  label: 'Puente Río-Lurín',      amount: 'S/.1.67M', pct: '18%', color: '#06B6D4', x: 490, y: 350, h:  90, w: W },
  { id: 'cSaneam',  label: 'Saneamiento Lima Sur',  amount: 'S/.1.40M', pct: '15%', color: '#3B82F6', x: 490, y: 450, h:  75, w: W },
  { id: 'cConsH',   label: 'Cons. Hidráulica',      amount: 'S/.0.65M', pct: '7%',  color: '#EAB308', x: 490, y: 535, h:  35, w: W },
]

const rightNodes: SankeyNode[] = [
  { id: 'rMano',    label: 'Mano de Obra',          amount: 'S/.3.07M', pct: '33%', color: '#EF4444', x: 860, y:  30, h: 165, w: W },
  { id: 'rMat',     label: 'Materiales y Equipos',  amount: 'S/.2.42M', pct: '26%', color: '#F97316', x: 860, y: 205, h: 130, w: W },
  { id: 'rSub',     label: 'Subcontrat.',            amount: 'S/.1.58M', pct: '17%', color: '#06B6D4', x: 860, y: 345, h:  85, w: W },
  { id: 'rAdm',     label: 'Gastos Adm.',            amount: 'S/.0.93M', pct: '10%', color: '#8B5CF6', x: 860, y: 440, h:  50, w: W },
  { id: 'rUtil',    label: 'Utilidad Neta',          amount: 'S/.1.30M', pct: '14%', color: '#22C55E', x: 860, y: 500, h:  70, w: W },
]

// Flows: left→center (proportional fractions)
// Each left node splits across center nodes proportional to center node size
// We'll define them manually for clarity

function buildBezier(
  x1: number, y1: number, x2: number, y2: number,
  h1: number, h2: number, color: string
): string {
  const mx = (x1 + x2) / 2
  const top1 = y1, bot1 = y1 + h1
  const top2 = y2, bot2 = y2 + h2
  return `
    M ${x1} ${top1}
    C ${mx} ${top1}, ${mx} ${top2}, ${x2} ${top2}
    L ${x2} ${bot2}
    C ${mx} ${bot2}, ${mx} ${bot1}, ${x1} ${bot1}
    Z
  `.trim()
}

// Build flows: left → center
const lcFlows: SankeyFlow[] = []
// Distribute each left node across center nodes (simplified proportional)
const lcMatrix: [string, string, number][] = [
  ['lContPub', 'cR5',     0.50],
  ['lContPub', 'cEdif',   0.20],
  ['lContPub', 'cPuente', 0.18],
  ['lContPub', 'cSaneam', 0.12],
  ['lContPri', 'cR5',     0.25],
  ['lContPri', 'cEdif',   0.40],
  ['lContPri', 'cSaneam', 0.35],
  ['lConsult', 'cPuente', 0.55],
  ['lConsult', 'cConsH',  0.45],
  ['lSuperv',   'cSaneam', 0.50],
  ['lSuperv',   'cConsH',  0.50],
]

const crFlows: SankeyFlow[] = []
// center → right distribution
const crMatrix: [string, string, number][] = [
  ['cR5',     'rMano', 0.35], ['cR5',     'rMat',  0.30], ['cR5',     'rSub',  0.20], ['cR5',     'rAdm', 0.05], ['cR5',     'rUtil', 0.10],
  ['cEdif',   'rMano', 0.30], ['cEdif',   'rMat',  0.25], ['cEdif',   'rSub',  0.20], ['cEdif',   'rAdm', 0.10], ['cEdif',   'rUtil', 0.15],
  ['cPuente', 'rMano', 0.35], ['cPuente', 'rMat',  0.25], ['cPuente', 'rSub',  0.15], ['cPuente', 'rAdm', 0.10], ['cPuente', 'rUtil', 0.15],
  ['cSaneam', 'rMano', 0.33], ['cSaneam', 'rMat',  0.26], ['cSaneam', 'rSub',  0.20], ['cSaneam', 'rAdm', 0.12], ['cSaneam', 'rUtil', 0.09],
  ['cConsH',  'rMano', 0.33], ['cConsH',  'rMat',  0.26], ['cConsH',  'rSub',  0.16], ['cConsH',  'rAdm', 0.12], ['cConsH',  'rUtil', 0.13],
]

function findNode(id: string): SankeyNode {
  return [...leftNodes, ...centerNodes, ...rightNodes].find(n => n.id === id)!
}

function buildFlowPaths(
  matrix: [string, string, number][],
  fromIsLeft: boolean
) {
  // For each from-node, track cumulative y offsets used
  const fromUsed: Record<string, number> = {}
  const toUsed: Record<string, number> = {}

  return matrix.map(([fromId, toId, frac]) => {
    const fn = findNode(fromId)
    const tn = findNode(toId)
    const fh = Math.max(2, fn.h * frac)
    const th = Math.max(2, tn.h * frac)

    if (fromUsed[fromId] === undefined) fromUsed[fromId] = 0
    if (toUsed[toId] === undefined) toUsed[toId] = 0

    const sy = fn.y + fromUsed[fromId]
    const ty = tn.y + toUsed[toId]
    fromUsed[fromId] += fh
    toUsed[toId] += th

    const x1 = fn.x + fn.w
    const x2 = tn.x

    return {
      fromId, toId,
      sy, ty, w: fh, // we use fh/th
      color: fromIsLeft ? fn.color : fn.color,
      path: buildBezier(x1, sy, x2, ty, fh, th, fn.color),
      nodeColor: fn.color,
      th,
    }
  })
}

const lcPaths = buildFlowPaths(lcMatrix, true)
const crPaths = buildFlowPaths(crMatrix, false)

function NodeRect({ node }: { node: SankeyNode }) {
  return (
    <rect
      x={node.x}
      y={node.y}
      width={node.w}
      height={node.h}
      fill={node.color}
      rx={3}
      opacity={0.9}
    />
  )
}

function LeftLabel({ node }: { node: SankeyNode }) {
  return (
    <g>
      <text x={node.x - 8} y={node.y + node.h / 2 - 6} textAnchor="end" fill="#F8FAFC" fontSize={9} fontWeight="600">
        {node.label}
      </text>
      <text x={node.x - 8} y={node.y + node.h / 2 + 5} textAnchor="end" fill="#94A3B8" fontSize={8}>
        {node.amount} · {node.pct}
      </text>
    </g>
  )
}

function CenterLabel({ node }: { node: SankeyNode }) {
  if (node.h >= 30) {
    return (
      <text
        x={node.x + node.w / 2}
        y={node.y + node.h / 2 + 3}
        textAnchor="middle"
        fill="#F8FAFC"
        fontSize={8}
        fontWeight="600"
      >
        {node.pct}
      </text>
    )
  }
  return null
}

function CenterSideLabel({ node }: { node: SankeyNode }) {
  return (
    <text
      x={node.x + node.w / 2}
      y={node.y - 4}
      textAnchor="middle"
      fill="#94A3B8"
      fontSize={8}
    >
      {node.label}
    </text>
  )
}

function RightLabel({ node }: { node: SankeyNode }) {
  return (
    <g>
      <text x={node.x + node.w + 8} y={node.y + node.h / 2 - 6} textAnchor="start" fill="#F8FAFC" fontSize={9} fontWeight="600">
        {node.label}
      </text>
      <text x={node.x + node.w + 8} y={node.y + node.h / 2 + 5} textAnchor="start" fill="#94A3B8" fontSize={8}>
        {node.amount} · {node.pct}
      </text>
    </g>
  )
}

export function SankeyDiagram() {
  return (
    <div className="w-full h-full overflow-auto">
      <svg
        viewBox="0 0 1000 620"
        className="w-full h-full"
        style={{ minHeight: '400px' }}
      >
        {/* Column headers */}
        <text x={130} y={20} textAnchor="middle" fill="#EAB308" fontSize={10} fontWeight="700" letterSpacing="0.05em">
          FUENTES DE INGRESO
        </text>
        <text x={500} y={20} textAnchor="middle" fill="#EAB308" fontSize={10} fontWeight="700" letterSpacing="0.05em">
          PROYECTOS
        </text>
        <text x={870} y={20} textAnchor="middle" fill="#EAB308" fontSize={10} fontWeight="700" letterSpacing="0.05em">
          DISTRIBUCIÓN DE GASTO
        </text>

        {/* Flow paths left→center */}
        {lcPaths.map((fp, i) => (
          <path
            key={`lc-${i}`}
            d={(fp as unknown as { path: string }).path}
            fill={(fp as unknown as { nodeColor: string }).nodeColor}
            fillOpacity={0.25}
            stroke="none"
          />
        ))}

        {/* Flow paths center→right */}
        {crPaths.map((fp, i) => (
          <path
            key={`cr-${i}`}
            d={(fp as unknown as { path: string }).path}
            fill={(fp as unknown as { nodeColor: string }).nodeColor}
            fillOpacity={0.22}
            stroke="none"
          />
        ))}

        {/* Left nodes */}
        {leftNodes.map(n => <NodeRect key={n.id} node={n} />)}
        {/* Center nodes */}
        {centerNodes.map(n => <NodeRect key={n.id} node={n} />)}
        {/* Right nodes */}
        {rightNodes.map(n => <NodeRect key={n.id} node={n} />)}

        {/* Left labels */}
        {leftNodes.map(n => <LeftLabel key={`ll-${n.id}`} node={n} />)}

        {/* Center side labels */}
        {centerNodes.map(n => <CenterSideLabel key={`csl-${n.id}`} node={n} />)}
        {/* Center inside labels */}
        {centerNodes.map(n => <CenterLabel key={`cl-${n.id}`} node={n} />)}

        {/* Right labels */}
        {rightNodes.map(n => <RightLabel key={`rl-${n.id}`} node={n} />)}

        {/* Legend top-right */}
        <g transform="translate(700, 30)">
          {leftNodes.map((n, i) => (
            <g key={`leg-${i}`} transform={`translate(0, ${i * 16})`}>
              <rect x={0} y={0} width={10} height={8} fill={n.color} rx={1} opacity={0.85} />
              <text x={14} y={8} fill="#94A3B8" fontSize={8}>{n.label}</text>
            </g>
          ))}
        </g>
      </svg>
    </div>
  )
}
