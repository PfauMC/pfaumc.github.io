import assert from 'node:assert/strict'
import { sortCities, sortPlaces } from '../src/lib/catalogSort.js'

const cities = [
  { name: 'Ясный', residentCount: 2 },
  { name: 'Бор', residentCount: 3 },
  { name: 'Астра', residentCount: 2 },
]
assert.deepEqual(sortCities(cities).map(({ name }) => name), ['Бор', 'Астра', 'Ясный'])
assert.equal(cities[0].name, 'Ясный')

const places = [
  { name: 'Ярмарка', rating: 5, reviewCount: 1, createdAt: '2026-01-01T00:00:00Z' },
  { name: 'Базар', rating: 4, reviewCount: 4, createdAt: '2026-03-01T00:00:00Z' },
  { name: 'Аллея', rating: 5, reviewCount: 2, createdAt: '2026-02-01T00:00:00Z' },
  { name: 'Арка', rating: null, reviewCount: 0, createdAt: '2026-04-01T00:00:00Z' },
]
assert.deepEqual(sortPlaces(places).map(({ name }) => name), ['Аллея', 'Ярмарка', 'Базар', 'Арка'])
assert.deepEqual(sortPlaces(places, 'newest').map(({ name }) => name), ['Арка', 'Базар', 'Аллея', 'Ярмарка'])
assert.deepEqual(sortPlaces(places, 'reviews').map(({ name }) => name), ['Базар', 'Аллея', 'Ярмарка', 'Арка'])
assert.deepEqual(sortPlaces([
  { name: 'Б', createdAt: '2026-01-01T00:00:00Z' },
  { name: 'А', createdAt: '2026-01-01T00:00:00.500Z' },
], 'newest').map(({ name }) => name), ['А', 'Б'])
assert.equal(places[0].name, 'Ярмарка')
