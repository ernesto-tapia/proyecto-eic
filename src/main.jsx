import React, { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { createPuzzle, gridHeight, gridWidth, isClosed, isOptimal, routeCost, selectNode, warehouse } from './route.js'
import './style.css'

const assets = import.meta.env.BASE_URL + 'assets/'
const money = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' })
const pesos = new Intl.NumberFormat('es-MX', { maximumFractionDigits: 0 })
const numbers = new Intl.NumberFormat('es-MX')
const challenges = [
  ['logistica', 'Logística'],
  ['operaciones', 'Operaciones'],
  ['calidad', 'Calidad'],
  ['ergonomia', 'Ergonomía'],
  ['emprendimiento', 'Emprendimiento'],
]
const defects = [690000, 308537, 66807, 6210, 233, 3.4]
const sigmaStandardTitle = 'Calidad 6 sigma (6σ) · El estándar de la calidad'

function Header({ title, goHome }) {
  return <header className="screen-header">
    <h1 tabIndex={-1}>{title}</h1>
    {goHome && <button className="green" onClick={goHome}><span aria-hidden="true">← </span>Regresar</button>}
  </header>
}

function Landing({ open, complete }) {
  return <>
    <Header title="¿Te has preguntado qué hace una persona que estudia IIS?" />
    <div className="landing">
      <img src={assets + 'estudiante.png'} alt="" />
      <div>
        <p>Descúbrelo aquí, elige el principio de tu aventura y obtén el badge de IIS</p>
        <ul className="challenges">
          {challenges.map(([id, label]) => <li key={id}>
            {id in complete
              ? <><button className="blue" onClick={() => open(id)}>{label}</button>{complete[id] && <small>Completado</small>}</>
              : <><span className="blue unavailable">{label}</span><small>Próximamente</small></>}
          </li>)}
        </ul>
      </div>
    </div>
  </>
}

function RouteGrid({ cities, route, onSelect }) {
  return <div className="grid" role="group" aria-label="Cuadrícula de logística">
    <svg viewBox="0 0 12 8" preserveAspectRatio="none" aria-hidden="true">
      {Array.from({ length: gridWidth - 1 }, (_, i) => <line key={'x' + i} x1={i + 1} x2={i + 1} y1="0" y2="8" />)}
      {Array.from({ length: gridHeight - 1 }, (_, i) => <line key={'y' + i} y1={i + 1} y2={i + 1} x1="0" x2="12" />)}
      <polyline points={route.map(({ x, y }) => `${x},${y}`).join(' ')} />
    </svg>
    {[warehouse, ...cities].map((node) => <button
      key={node.id}
      type="button"
      className={`node ${node === warehouse ? 'warehouse' : 'city'}`}
      style={{ left: `${node.x / gridWidth * 100}%`, top: `${node.y / gridHeight * 100}%` }}
      aria-label={node.label}
      aria-pressed={route.includes(node)}
      onClick={() => onSelect(node)}
    ><span>{node === warehouse ? '' : route.indexOf(node) > 0 ? route.indexOf(node) : ''}</span></button>)}
  </div>
}

function Logistics({ goHome, finish }) {
  const [puzzle] = useState(createPuzzle)
  const { cities, optimalCost } = puzzle
  const [route, setRoute] = useState([])
  const closed = isClosed(route, puzzle)
  const optimal = isOptimal(route, puzzle)
  const visited = cities.filter((city) => route.includes(city)).length
  const current = route.at(-1)

  function choose(node) {
    const next = selectNode(route, node, puzzle)
    setRoute(next)
    if (!closed && isOptimal(next, puzzle)) finish('logistica')
  }

  return <>
    <Header title="Reto de logística" goHome={goHome} />
    <p>Encuentra la ruta más corta que pase por todos los puntos y vuelva al almacén.</p>
    <p>Selecciona el almacén para empezar. Cada unidad de distancia cuesta $1.</p>
    <div className="logistics">
      <aside className="legend" aria-label="Leyenda">
        <div>Almacén <span className="marker warehouse" /></div>
        <div>Ciudad <span className="marker city" /></div>
        <img src={assets + 'camion.png'} alt="" />
      </aside>
      <div className="route-panel">
        <RouteGrid cities={cities} route={route} onSelect={choose} />
        <div className="route-summary" aria-live="polite">
          <strong>{closed ? 'Tu ruta' : 'Costo de la ruta'} · {money.format(routeCost(route))}</strong>
          {closed
            ? <><p>Ruta óptima · {money.format(optimalCost)}</p><p>{optimal ? '¡Encontraste una ruta óptima!' : 'Puedes intentar una ruta más corta.'}</p></>
            : <p>{visited} de {cities.length} ciudades visitadas{current ? ` · ${current.label}` : ''}{visited === cities.length ? ' · Vuelve al almacén.' : ''}</p>}
        </div>
        {closed && <button className="green" onClick={() => {
          setRoute([])
          document.querySelector('.node.warehouse')?.focus()
        }}>Volver a intentar</button>}
      </div>
    </div>
  </>
}

const plot = Array.from({ length: 161 }, (_, i) => {
  const z = (i - 80) / 24
  return [20 + i * 3.5, 260 - 220 * Math.exp(-z * z / 2)]
})
const curve = plot.map(([x, y]) => `${x},${y}`).join(' ')

function BellCurve({ level }) {
  const halfWidth = [0, 24, 45, 59, 69, 76, 80][level]
  const shaded = plot.slice(80 - halfWidth, 81 + halfWidth)
  return <svg className="bell" viewBox="0 0 600 270" role="img" aria-label={level ? `Curva de campana, área sombreada para ${level} sigma` : 'Curva de campana'}>
    <path d="M 12 15 V 260 H 588" className="axes" />
    {level === 0
      ? <path d="M 300 40 V 260" className="center-line" />
      : <polygon className="shaded" points={`${shaded[0][0]},260 ${shaded.map((point) => point.join(',')).join(' ')} ${shaded.at(-1)[0]},260`} />}
    <polyline className={level === 0 ? 'intro-curve' : 'curve'} points={curve} />
  </svg>
}

function Quality({ goHome, finish }) {
  const [level, setLevel] = useState(0)
  const [choice, setChoice] = useState(null)
  const count = defects[level - 1]

  return <>
    <Header title="Reto de Calidad" goHome={goHome} />
    <div className="quality-heading">
      <div className={level === 0 ? undefined : 'layout-placeholder'} aria-hidden={level !== 0}>
        <p>¿Has oído sobre el estándar 6 sigma?</p>
        <p>Mueve el control para aprender más.</p>
      </div>
      <span className="sigma-title layout-placeholder" aria-hidden="true">{sigmaStandardTitle}</span>
      {level > 0 && <h2 className="sigma-title">
        {level === 6 ? sigmaStandardTitle : `Calidad ${level} sigma (${level}σ)`}
      </h2>}
    </div>
    <div className="quality">
      <div className="quality-plot">
        <BellCurve level={level} />
        <label className="visually-hidden" htmlFor="sigma">Nivel sigma</label>
        <input id="sigma" type="range" min="0" max="6" step="1" value={level}
          aria-valuetext={level === 0 ? 'Introducción' : `${level} sigma`}
          style={{ '--progress': `${level / 6 * 100}%` }}
          onChange={(event) => setLevel(Number(event.target.value))} />
      </div>
      <div className="quality-copy" aria-live="polite">
        {level === 0
          ? <p>La curva de campana se usa para ver cómo se distribuyen los datos. En este caso lo veremos como defectos por millón de piezas producidas.</p>
          : <><p>Representa <strong>{numbers.format(count)}</strong> defectos por millón producidos.</p>
            <p>Considerando el iPhone 13 en $10,000, son <strong>{'$' + pesos.format(count * 10000)} pesos</strong> de defectos.</p></>}
      </div>
    </div>
    {level === 6 && <section className="quiz" aria-labelledby="quiz-title">
      <h2 id="quiz-title">¿Cuál crees que es el nivel aceptable para la industria?</h2>
      <div className="quiz-options">
        {[4, 5, 6].map((option) => <button key={option} className="blue" aria-pressed={choice === option} onClick={() => {
          setChoice(option)
          finish('calidad')
        }}>{option} sigma</button>)}
      </div>
      <div aria-live="polite">
        {choice && <p className="quiz-response">Empresas e industrias que utilizan {choice} sigma · Próximamente.</p>}
      </div>
    </section>}
  </>
}

function Final({ goHome }) {
  return <>
    <Header title="¡Felicidades!" goHome={goHome} />
    <div className="final">
      <div className="badge" aria-label="Badge de IIS obtenido">IIS</div>
      <p>Ahora sabes qué es lo que hace un Ingeniero Industrial y de Sistemas</p>
      <p>Si tienes dudas, acércate al módulo de la EIC</p>
    </div>
  </>
}

function App() {
  const [screen, setScreen] = useState('inicio')
  const [completed, setCompleted] = useState({ logistica: false, calidad: false })
  const main = useRef(null)
  const allDone = completed.logistica && completed.calidad

  useEffect(() => {
    main.current.querySelector('h1')?.focus()
  }, [screen])

  const goHome = () => setScreen('inicio')
  const finish = (id) => setCompleted((previous) => ({ ...previous, [id]: true }))

  return <main ref={main}>
    {screen === 'inicio' && <Landing open={setScreen} complete={completed} />}
    {screen === 'logistica' && <Logistics goHome={goHome} finish={finish} />}
    {screen === 'calidad' && <Quality goHome={goHome} finish={finish} />}
    {screen === 'final' && <Final goHome={goHome} />}
    {allDone && screen !== 'final' && <div className="finish">
      <button className="green" onClick={() => setScreen('final')}>Ver mi badge de IIS</button>
    </div>}
  </main>
}

createRoot(document.getElementById('root')).render(<App />)
