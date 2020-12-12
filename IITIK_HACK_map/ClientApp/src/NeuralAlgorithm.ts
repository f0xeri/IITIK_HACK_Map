const population_size = 60; // Количество хромосом в поколении
const mutation_prob = 10;   // Вероятности
const lifetime = 2000;      // Итераций

let N: number = 0;          // Количество точек, а ещё длина массива с маршрутом

class Chromosome {
    one_chromosome: Array<number> = [];     // Массив - маршрут
}

function create_random_chromosome() : Chromosome {
    let c: Chromosome = new Chromosome();
    c.one_chromosome = new Array<number>(N);
    for (let i = 0; i < N; ++i) c.one_chromosome[i] = i;
    
    for (let i = N - 1; i > 0; --i) {
        let randomIndex = Math.floor(Math.random() * (1 - i + 1)) + i;
        [c.one_chromosome[i], c.one_chromosome[randomIndex]] = [c.one_chromosome[randomIndex], c.one_chromosome[i]];
    }
    return c;
}

// 1 / длина маршрута
function fitness(source: number[][], c : Chromosome) : number {
    let value: number = 0;
    for (let i = 0; i < N - 1; ++i) {
        value += source[c.one_chromosome[i]][c.one_chromosome[i + 1]];
    }
    return 1.0 / value;
}

// длина маршрута
function value_f(source: number[][], c : Chromosome) : number {
    let value: number = 0;
    for (let i = 0; i < N - 1; ++i) {
        if (c.one_chromosome[i] == -1) 
            break;
        else 
            value += source[c.one_chromosome[i]][c.one_chromosome[i + 1]];
    }
    return value;
}

// Сумма фитнесов до last включительно
function fitness_sum(source: number[][], population: Array<Chromosome>, last: number) : number {
    let ans: number = 0;
    for (let i = 0; i <= last; ++i) {
        ans += fitness(source, population[i]);
    }
    return ans;
}

//Выбор лучших хромосом
function RWS(source: number[][], population: Array<Chromosome>, points: Array<number>, keep_size: number) {
    let keep: Array<Chromosome> = new Array<Chromosome>(keep_size).fill(new Chromosome());
    for (let i = 0; i < keep_size; ++i) keep[i].one_chromosome = new Array<number>(N);
    let ind: number = 0;

    for (let in_ = 0; in_ < keep_size; ++in_) {
        let p: number = points[in_];
        let i: number = 0;
        
        while (fitness_sum(source, population, i) < p) {
            ++i;
        }
        keep[ind].one_chromosome = population[i].one_chromosome;
        ind++;
    }
    for (let i = 0; i < keep_size; ++i)
    population[i].one_chromosome = keep[i].one_chromosome;
}

// Алгоритм SUS
function Selection_(source: number[][], population: Array<Chromosome>) {
    let F: number = fitness_sum(source, population, population_size - 1);   // Сумма всей популяции
    let n: number = Math.floor(2 * population_size / 3);                      // Количество отбираемых
    let P: number = F / n;                                                       // Шаг
    let start: number = Math.random() * P;                                       //Точка начала

    // Все точки
    let points: Array<number> = new Array<number>(n); 
    for (let i = 0; i < n; ++i) {
        // Шагаем от старта по P
        points[i] = start + i * P;
    }
    // Соотносим fitnessaм хромосомы
    RWS(source, population, points, n);
}

// Поиск индекса следующего за индексом элемента value
function search_next(c: Chromosome, value: number) : number {
    for (let i = 0; i < N; ++i) {
        if (c.one_chromosome[i] == value) return (i + 1);
    }
    return N;
}

// Поиск кратчайшего пути из from в город не включенный в маршрут до ind включительно
function cheapest(source: number[][], from: number, c: Chromosome, ind: number) : number {
    let cheapest_cost: number = Infinity;
    let cheapest = 0;
    let break_flag: boolean = false;
    for (let i = 0; i < N; ++i) {
        // Проверка каждого города - есть ли он в маршруте
        break_flag = false;
        for (let j = 0; j < ind; ++j) {
            if (c.one_chromosome[j] == i) {
                break_flag = true;
                break;
            }
        }
        // Если города в маршруте нет, то сравниваем с самым дешевым переходом
        if (!break_flag) {
            if (source[from][i] < cheapest_cost) {
                cheapest_cost = source[from][i];
                cheapest = i;
            }
        }
    }
    // Вовзращаем индекс самого дешевого перехода
    return cheapest;
}

// Проверка есть ли город value в маршруте c до ind
function present(c: Chromosome, ind: number, value: number) : boolean {
    for (let j = 1; j <= ind; ++j)
    if (c.one_chromosome[j] == value)
        return true;
    return false;
}

function Greedy(source: number[][], p1: Chromosome, p2: Chromosome, c: Chromosome) {
    c.one_chromosome[0] = p1.one_chromosome[0];
    for (let i = 1; i < N; ++i) {
        let prev_gen: number = c.one_chromosome[i - 1];     // Прошлый город
        let next_ind: number= search_next(p1, prev_gen);    // Индекс следующего
        let select_cheapest: boolean = true;
        // Если следующего в маршруте нет (конец маршрута)
        if (next_ind != N) {
            // Иначе получаем номер города
            let first_candidate: number = p1.one_chromosome[next_ind];
            // Если города нет в маршруте
            if (!present(c, i - 1, first_candidate)) {
                // То же самое для 2 родителя
                next_ind = search_next(p2, prev_gen);
                if (next_ind != N) {
                    let second_candidate: number = p2.one_chromosome[next_ind];
                    if (!present(c, i - 1, second_candidate)) {
                        // Если все условия выполнены выбираем лучший из 2 переходов
                        select_cheapest = false;
                        if (source[prev_gen][first_candidate] < source[prev_gen][second_candidate])
                            c.one_chromosome[i] = first_candidate;
                        else
                            c.one_chromosome[i] = second_candidate;
                    }
                }
            }
        }
        //Е сли любое нарушено выбираем самый дешевый из доступных
        if (select_cheapest)
            c.one_chromosome[i] = cheapest(source, prev_gen, c, i - 1); 
    }
}

function Crossover(source: number[][], population: Array<Chromosome>) {
    for (let i = 0; i < 2 * population_size / 3; i += 2)
        Greedy(source, population[i], population[i + 1], population[i / 2 + 2 *population_size / 3]);
}

function mutator(c: Chromosome) {
    // Свапаем 2 любых пункта в маршруте. Не свапаем одинаковые. Не свапаем 0 ни с каким
    let a: number = Math.floor(Math.random() * (N - 1)) + 1;
    let b: number;
    do b = Math.floor(Math.random() * (N - 1)) + 1; while (b == a);
    [c.one_chromosome[a], c.one_chromosome[b]] = [c.one_chromosome[b], c.one_chromosome[a]];
}

function Mutation(population: Array<Chromosome>) {
    for (let i = 0; i < population_size; ++i) {
        // С шансом mutation_prob вызываем mutator для каждой хромосомы
        let chance: number = Math.floor(Math.random() * (100 - 1 + 1)) + 1;
        if (chance <= mutation_prob)
            mutator(population[i]);
    }
}

// Выбор лучшей хромосомы в популяции по fitness
function best(source: number[][], population: Array<Chromosome>) : Chromosome {
    let best_i: number = 0;
    for (let i = 1; i < population_size; ++i)
    if (fitness(source, population[i]) > fitness(source, population[best_i]))
        best_i = i;
    return population[best_i];
}

function GA(matrix: number[][]): Chromosome {
    let best_overall: Chromosome = new Chromosome();        // Лучшая хромосома
    best_overall.one_chromosome = new Array<number>(N);
    for (let i = 0; i < N; ++i) best_overall.one_chromosome[i] = i;
    let population: Array<Chromosome> = new Array<Chromosome>(population_size);
    for (let i = 0; i < population_size; ++i) population[i] = create_random_chromosome();

    for (let i = 0; i < lifetime; ++i) {
        Selection_(matrix, population);
        Crossover(matrix,  population);
        Mutation(population);

        // Сравнение лучшей из этого поколения с лучшей за всё время
        let best_overall_f: number = fitness(matrix,best_overall);
        let challenger: Chromosome = best(matrix, population);
        let best_current_f: number = fitness(matrix, challenger);

        // Замена лучшей за всё время
        if(best_current_f > best_overall_f)
            for (let j = 0; j < N; ++j)
        best_overall.one_chromosome[j] = challenger.one_chromosome[j];
    }
    return best_overall;
}

function startNeuralAlgorithm(matrix: number[][], n: number) {
    N = n;
    
    // Правим матрицу расстояний под нужды алгоритма
    let D: number[][] = new Array(N).fill(0).map(() => new Array(N).fill(0));
    
    for (let i = 0; i < N; ++i) {
        for (let j = 0; j < N; ++j) {
            if (i === j) D[i][j] = Infinity;
            else D[i][j] = matrix[i][j];
        }
    }
    D[0][1] = Infinity;
    D[1][0] = Infinity;

    // Получение лучшей хромосомы
    let sol: Chromosome = GA(D);
    
    // Разбиваем путь на две части
    let way1: Chromosome = new Chromosome();
    way1.one_chromosome = new Array<number>(N);
    for (let i = 0; i < N; ++i) way1.one_chromosome[i] = -1;

    let way2: Chromosome = new Chromosome();
    way2.one_chromosome = new Array<number>(N);
    for (let i = 0; i < N; ++i) way2.one_chromosome[i] = -1;
    
    let ind: number = 0;
    while (sol.one_chromosome[ind] != 1)
    {
        way1.one_chromosome[ind] = sol.one_chromosome[ind];
        ++ind;
    }

    // Удаляем лишние -1
    for (let i = 0; i < N - ind; ++i)
        way2.one_chromosome[i] = sol.one_chromosome[i + ind];
    way1.one_chromosome = way1.one_chromosome.filter((x) => (x !== -1));
    way2.one_chromosome = way2.one_chromosome.filter((x) => (x !== -1));
    return {sol, way1, way2};
}

export default startNeuralAlgorithm;