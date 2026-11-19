export const warehouse = { id: 'almacen', label: 'Almacén', x: 7, y: 4 }
export const gridWidth = 12
export const gridHeight = 8

export function createPuzzle(random = Math.random) {
  const available = []
  // Leave space between targets so their touch areas don't overlap on a phone.
  for (let y = 2; y < gridHeight; y += 2) {
    for (let x = 2; x < gridWidth; x += 2) {
      if (distance({ x, y }, warehouse) >= 2) available.push({ x, y })
    }
  }

  const count = 4 + Math.floor(random() * 5)
  const cities = Array.from({ length: count }, (_, index) => {
    const [position] = available.splice(Math.floor(random() * available.length), 1)
    return { ...position, id: `ciudad-${index + 1}`, label: `Ciudad ${index + 1}` }
  })
  return { cities, optimalCost: shortestLoop(warehouse, cities) }
}

export function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function routeCost(route) {
  return route.slice(1).reduce((sum, node, index) => sum + distance(route[index], node), 0)
}

function shortestLoop(current, remaining) {
  if (remaining.length === 0) return distance(current, warehouse)
  return Math.min(...remaining.map((city) => (
    distance(current, city) + shortestLoop(city, remaining.filter((other) => other !== city))
  )))
}

export function isClosed(route, puzzle) {
  return route.length === puzzle.cities.length + 2
}

export function isOptimal(route, puzzle) {
  return isClosed(route, puzzle) && Math.abs(routeCost(route) - puzzle.optimalCost) < 1e-9
}

export function selectNode(route, node, puzzle) {
  if (isClosed(route, puzzle)) return route
  if (node === warehouse) {
    return route.length === 0 || route.length === puzzle.cities.length + 1 ? [...route, node] : route
  }
  return route.length > 0 && !route.includes(node) ? [...route, node] : route
}
