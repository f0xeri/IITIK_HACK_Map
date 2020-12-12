import React, {useState, useEffect} from 'react';
import {YMaps, Map, Placemark} from 'react-yandex-maps';
import {AddressesView} from "./AddressesView";
import {Row, Col} from "reactstrap";
// import AntColonyOptimizationAlgorithm from "../AntColonyOptimizationAlgorithm.ts"
import startNeuralAlgorithm from "../NeuralAlgorithm";

export const Home = () => {

  // текущий инпут - поиск по адресам (search) или ввод координат (coords)
  const [inputType, setInputType] = useState('search');

  // точки, содержат индекс и адрес/координаты
  const [coords, setCoord] = useState([]);

  // итоговые пути: 
  // points - массив номеров исходных точек, из которых состоит маршрут
  // pointCoords - координаты точек из points
  // length - длина маршрута
  const [way1, setWay1] = useState({points: [], pointCoords: [], length: 0});
  const [way2, setWay2] = useState({points: [], pointCoords: [], length: 0});

  // ссылки на map и ymaps
  const map = React.useRef(null);
  const ymaps = React.useRef(null);

  // исключительно координаты маршрута и ссылка на них
  let routeCoords = [];
  const routeCoordsRef = React.useRef(routeCoords);

  // обновляем маршрут, если координаты изменились
  useEffect(() => {
    if (map.current != null) {
      buildRoute(ymaps.current);
    }
  }, [coords])

  // возвращаем подсказки, если пользователь переключился в режим ввода адресов
  useEffect(() => {
    if (map.current != null && inputType === "search") {
      loadSuggest(ymaps.current);
    }
  }, [inputType])

  /* подсказки пока что ТОЛЬКО по адресу, 
   * с yandex#search не получается получить координаты геокодером
   * route тоже требует именно адрес */
  const loadSuggest = ymaps => {
    let inputElement = document.getElementById("suggest");
    let lastValue = inputElement.value;
    if (inputType === "search") {
      let event = new Event('input', {bubbles: true});
      const suggestView = new ymaps.SuggestView("suggest", {provider: 'yandex#map'});
      suggestView.events.add("select", (e) => {
        inputElement.value = e.get("item").value;
        let tracker = inputElement._valueTracker;
        if (tracker) {
          tracker.setValue(lastValue);
        }
        inputElement.dispatchEvent(event);

        setCoord(coords =>
          [...coords, {index: coords.length, address: e.get("item").value, coordinates: ""}]);
        routeCoordsRef.current.push(e.get("item").value);
      });
    }
  };

  async function buildDistanceMatrix(ymaps) {
    const n = routeCoordsRef.current.length;
    // матрица n*n, заполненная нулями
    let distanceMatrix = Array(n).fill(Array(n).fill(0));

    // await в цикле в цикле - ужасно, но выход найти пока что не получилось
    for (let i = 0; i < n; i++) {
      let newArr = Array(n).fill(0);
      for (let j = i + 1; j < n; j++) {
        await ymaps.route([routeCoordsRef.current[i], routeCoordsRef.current[j]]).then((route) => {
          newArr[j] = route.getLength();
          // console.log(i, j, routeCoordsRef.current[i], routeCoordsRef.current[j], route.getLength());
        });
      }
      distanceMatrix[i] = newArr;
    }
    return distanceMatrix;
  }

  function drawRoute(ymaps, coords, setWay, way, color) {
    ymaps.route(coords, {
      mapStateAutoApply: true, reverseGeocoding: inputType === "coords"
    }).then(function (route) {
      route.getPaths().options.set({
        strokeColor: color,
        opacity: 0.9
      });
      // добавляем маршрут на карту
      map.current.geoObjects.add(route);
      console.log(route.getLength());
      setWay({length: route.getLength(), points: way.points, pointCoords: way.pointCoords});
    });
  }

  async function buildRoute(ymaps) {
    map.current.geoObjects.removeAll();
    const n = routeCoordsRef.current.length;

    let distanceMatrix = await buildDistanceMatrix(ymaps);
    if (routeCoordsRef.current.length > 1) {
      // доделываем матрицу (симметрия)
      console.log(distanceMatrix);
      for (let i = n - 1; i >= 0; i--) {
        for (let j = i; j >= 0; j--) {
          if (i !== j) {
            distanceMatrix[i][j] = distanceMatrix[j][i];
          }
        }
      }
      console.log(distanceMatrix);

      // запускаем нейронный алгоритм
      let res = startNeuralAlgorithm(distanceMatrix, n);

      // обновляем массивы координат с изменённым порядком (neural)
      let newRouteCoords = [];    // общий маршрут
      let way1RouteCoords = [];
      let way2RouteCoords = [];
      for (let i = 0; i < n; i++) {
        newRouteCoords.push(routeCoordsRef.current[res.sol.one_chromosome[i]]);
      }
      for (let i = 0; i < res.way1.one_chromosome.length; i++) {
        way1RouteCoords.push(routeCoordsRef.current[res.way1.one_chromosome[i]]);
      }
      for (let i = 0; i < res.way2.one_chromosome.length; i++) {
        way2RouteCoords.push(routeCoordsRef.current[res.way2.one_chromosome[i]]);
      }
      console.log(newRouteCoords);

      if (inputType === "coords") {
        drawRoute(ymaps, way1RouteCoords, setWay1, {pointCoords: way1RouteCoords, points: res.way1.one_chromosome}, '0000ffff');
        drawRoute(ymaps, way2RouteCoords, setWay2, {pointCoords: way2RouteCoords, points: res.way2.one_chromosome}, 'ff0000');
      } else {
        drawRoute(ymaps, newRouteCoords, setWay1, {pointCoords: newRouteCoords, points: res.sol.one_chromosome}, '0000ffff');
      }
    }
  }

  return (
    <div>
      <Row>

        <Col xl="3">
          <h1>Точки</h1>
          <AddressesView coords={coords} setCoord={setCoord} routeCoords={routeCoordsRef} inputType={inputType} setInputType={setInputType}/>
          <div style={{color: "blue"}}>Длина маршрута первого контролёра - {Math.round(way1.length / 1000)} км<br/>Его путевые точки - {way1.points.map((x) => <span>{x} </span>)}</div>
          <br/>
          <div style={{color: "red"}}>Длина маршрута второго контролёра - {Math.round(way2.length / 1000)} км<br/>Его путевые точки - {way2.points.map((x) => <span>{x} </span>)}</div>
        </Col>

        <Col>
          <h1>Карта</h1>
          <YMaps
            query={{
              ns: "use-load-option",
              apikey: process.env.REACT_APP_YANDEX_MAP_API_KEY,
              load: "geocode"
            }}>
            <div>
              <Map style={{left: 0, top: 0, width: '73.82vw', height: '90vh'}}
                   instanceRef={map}
                   onLoad={ymapsInstance => {
                     loadSuggest(ymapsInstance);
                     ymaps.current = ymapsInstance;
                   }}
                   modules={["SuggestView", "geocode", "route"]}
                   defaultState={{center: [55.75, 37.57], zoom: 3}}>
                {coords.map(coord =>
                  <Placemark geometry={coord.coordinates}/>
                )}
              </Map>
            </div>
          </YMaps>
        </Col>

      </Row>
    </div>
  );
}
