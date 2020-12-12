const N_MIN = 3;            // минимальное количество вершин
const N_MAX = 30;           // максимальное количество вершин

const ALPHA = 1;            // вес фермента
const BETTA = 3;            // коэффициент эвристики

const T_MAX = 200;          // время жизни колонии
const M = 20;               // количество муравьев в колонии
const Q = 100;              // количество
const RHO = 0.5;            // коэффициент испарения феромона

class WAY_TYPE {
    length: number = 0;
    tabu: Array<number> = [];
    itabu: number = 0;
}

function probability(to: number, ant: WAY_TYPE, pheromone: Array<Array<number>>, distance: Array<Array<number>>, nVertexes: number) {
    // если вершина уже посещена, возвращаем 0
    for (let i: number = 0; i < ant.itabu; ++i) if (to == ant.tabu[i]) return 0;
    
    let sum: number = 0.0;
    let from: number = ant.tabu[ant.itabu - 1];
    // считаем сумму в знаменателе
    for (let j = 0; j < nVertexes; ++j) {
        let flag: number = 1;
        // проверяем, посещал ли муравей j вершину
        for (let i = 0; i < ant.itabu; ++i) if (j == ant.tabu[i]) flag = 0;
        //console.log(distance);
        //console.log(pheromone);
        if (flag) sum += Math.pow(pheromone[from][j], ALPHA) * Math.pow(distance[from][j], BETTA);
    }
    return Math.pow(pheromone[from][to], ALPHA) * Math.pow(distance[from][to], BETTA) / sum;
}

function AntColonyOptimizationAlgorithm(distanceMatrix: number[][], nVertexes: number, start: number) : WAY_TYPE {
    let way: WAY_TYPE = new WAY_TYPE();
    way.itabu = 0;
    way.length = -1;
    way.tabu = Array(nVertexes).fill(0);
    let distance: Array<Array<number>>;
    let pheromone: Array<Array<number>>;
    distance = Array(nVertexes).fill(Array(nVertexes).fill(0));
    pheromone = Array(nVertexes).fill(Array(nVertexes).fill(0));
    
    for (let i = 0; i < nVertexes; ++i) {
        for (let j = 0; j < nVertexes; ++j) {
            pheromone[i][j] = 1.0 / nVertexes;
            if (i != j) distance[i][j] = 1.0 / distanceMatrix[i][j];
        }
    }
    
    let ants : Array<WAY_TYPE> = new Array(M);
    for (let k = 0; k < M; ++k) {
        ants[k] = new WAY_TYPE();
        ants[k].itabu = 0;
        ants[k].length= 0;
        ants[k].tabu = Array(nVertexes).fill(0);
        ants[k].tabu[ants[k].itabu++] = start;
    }

    // основной цикл
    for (let t = 0; t < T_MAX; ++t) {
        for (let k = 0; k < M; ++k) {
            // поиск маршрута для k-го муравья
            do {
                let j_max: number = -1;
                let p_max: number = 0.0;
                for (let j = 0; j < nVertexes; j++) {
                    if (ants[k].tabu[ants[k].itabu - 1] != j) {
                        let p: number = probability(j, ants[k], pheromone, distance, nVertexes);

                        if (p && p >= p_max) {
                            p_max = p;
                            j_max = j;
                        }
                    }
                }
                ants[k].length += distanceMatrix[ants[k].tabu[ants[k].itabu - 1]][j_max];
                ants[k].tabu[ants[k].itabu++] = j_max;
            } while (ants[k].itabu != nVertexes);
            // оставляем феромон на пути муравья
            for (let i = 0; i < ants[k].itabu - 1; ++i) {
                let from: number = ants[k].tabu[i % ants[k].itabu];
                let to: number = ants[k].tabu[(i + 1) % ants[k].itabu];
                pheromone[from][to] += Q / ants[k].length;
                pheromone[to][from] = pheromone[from][to];
            }
            // проверка на лучшее решение
            if ((ants[k].length  < way.length) || way.length < 0) {
                way.itabu = ants[k].itabu;
                way.length = ants[k].length;
                for (let i = 0; i < way.itabu; ++i) way.tabu[i] = ants[k].tabu[i];
            }
            // обновление муравьев
            ants[k].itabu = 1;
            ants[k].length = 0.0;
        }
        // цикл по ребрам
        for (let i = 0; i < nVertexes; ++i) {
            for (let j = 0; j < nVertexes; ++j) {
                // обновление феромона для ребра (i, j)
                if (i != j) pheromone[i][j] *= (1 - RHO);
            }
        }
        for (let i = 0; i < way.itabu - 1; ++i) {
            let from: number = way.tabu[i % way.itabu];
            let to: number = way.tabu[(i + 1) % way.itabu];
            pheromone[from][to] += (Q * 3.0) / way.length;
            pheromone[to][from] = pheromone[from][to];
        }
    }
    // возвращаем кратчайший маршрут
    return way;
}

export default AntColonyOptimizationAlgorithm;