/**
 * RouteOptimizer.js
 * Ported from Ghost Team Strategy (Python -> JS)
 * Implements A* Algorithm for optimized pathfinding on the map graph.
 */

// Heuristic function (Haversine distance for geo-coordinates)
function heuristic(a, b) {
    const R = 6371e3; // metres
    const φ1 = a.lat * Math.PI / 180;
    const φ2 = b.lat * Math.PI / 180;
    const Δφ = (b.lat - a.lat) * Math.PI / 180;
    const Δλ = (b.lng - a.lng) * Math.PI / 180;

    const x = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
        Math.cos(φ1) * Math.cos(φ2) *
        Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));

    return R * c;
}

export class RouteOptimizer {
    constructor() {
        this.graph = new Map(); // Adjacency list
    }

    // Add a node to the routing graph
    addNode(id, lat, lng) {
        this.graph.set(id, { lat, lng, neighbors: [] });
    }

    // Add a connection between nodes
    addEdge(nodeA, nodeB, weight) {
        if (this.graph.has(nodeA) && this.graph.has(nodeB)) {
            this.graph.get(nodeA).neighbors.push({ id: nodeB, weight });
            this.graph.get(nodeB).neighbors.push({ id: nodeA, weight }); // Undirected
        }
    }

    // A* Pathfinding Algorithm
    findShortestPath(startId, endId) {
        const openSet = new Set([startId]);
        const cameFrom = new Map();

        const gScore = new Map(); // Cost from start
        gScore.set(startId, 0);

        const fScore = new Map(); // Estimated total cost
        fScore.set(startId, heuristic(this.graph.get(startId), this.graph.get(endId)));

        while (openSet.size > 0) {
            // Get node in openSet with lowest fScore
            let current = null;
            let minF = Infinity;
            for (const node of openSet) {
                const score = fScore.get(node) || Infinity;
                if (score < minF) {
                    minF = score;
                    current = node;
                }
            }

            if (current === endId) {
                return this.reconstructPath(cameFrom, current);
            }

            openSet.delete(current);

            const currentNode = this.graph.get(current);
            if (!currentNode) continue;

            for (const neighbor of currentNode.neighbors) {
                const tentativeG = (gScore.get(current) || Infinity) + neighbor.weight;

                if (tentativeG < (gScore.get(neighbor.id) || Infinity)) {
                    cameFrom.set(neighbor.id, current);
                    gScore.set(neighbor.id, tentativeG);

                    const neighborNode = this.graph.get(neighbor.id);
                    fScore.set(neighbor.id, tentativeG + heuristic(neighborNode, this.graph.get(endId)));

                    if (!openSet.has(neighbor.id)) {
                        openSet.add(neighbor.id);
                    }
                }
            }
        }

        return null; // No path found
    }

    reconstructPath(cameFrom, current) {
        const totalPath = [current];
        while (cameFrom.has(current)) {
            current = cameFrom.get(current);
            totalPath.unshift(current);
        }
        return totalPath;
    }
}
