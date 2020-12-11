import React, {useState, useEffect} from 'react';
import {YMaps, Map, Placemark} from 'react-yandex-maps';
import {AddressesView} from "./AddressesView";
import {Row, Col} from "reactstrap";
import AntColonyOptimizationAlgorithm from "../AntColonyOptimizationAlgorithm.ts"

export const Home = () => {
  const [coords, setCoord] = useState([]);
  const [inputType, setInputType] = useState('search');

  const map = React.useRef(null);
  const ymaps = React.useRef(null);

  let routeCoords = []; /*["Россия, Астрахань, Моздокская улица, 54 ", 
    "Россия, Астрахань, Боевая улица, 62 ", 
    "Россия, Астрахань, улица Татищева, 16 ", 
    "Россия, Астраханская область, Приволжский район, а…орт Астрахань (Нариманово) имени Б.М. Кустодиева "];*/
  const routeCoordsRef = React.useRef(routeCoords);
  
  // обновляем маршрут, если координаты изменились
  useEffect(() => {
    if (map.current != null) {
      buildRoute(ymaps.current);
      //loadSuggest(ymaps.current);
    }
  }, [coords])

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
        // отключил, чтобы не потратить всё
        // geocode(ymaps, e.get("item").value);
        // вместо геокодера
        setCoord(coords =>
          [...coords, {index: coords.length, address: e.get("item").value, coordinates: ""}]);
        routeCoords.push(e.get("item").value);
      });
    }
  };
  
  async function buildDistanceMatrix(ymaps) {
    const n = routeCoordsRef.current.length;
    // матрица n*n заполненная нулями
    let distanceMatrix = [];
    
    for (let i = 0; i < n; i++) {
      let newArr = [];
      for (let j = 0; j < n; j++) {
        // получаем расстояние между coord[i] и coord[j]
        await ymaps.route([routeCoordsRef.current[i], routeCoordsRef.current[j]]).then((route) => {
          newArr.push(route.getLength())
          //console.log(i, j, routeCoordsRef.current[i], routeCoordsRef.current[j], route.getLength());
        });
      }
      distanceMatrix.push(newArr);
    }
    return distanceMatrix;
  }

  async function buildRoute(ymaps) {
    const n = routeCoordsRef.current.length;
    //map.current.geoObjects.removeAll();
    let distanceMatrix = await buildDistanceMatrix(ymaps);
    let res = AntColonyOptimizationAlgorithm(distanceMatrix, n, 0);
    console.log(res);
    map.current.geoObjects.removeAll();
    ymaps.route(routeCoordsRef.current, {
      mapStateAutoApply: true, reverseGeocoding: inputType === "coords"
    }).then(function (route) {
      route.getPaths().options.set({
        strokeColor: '0000ffff',
        opacity: 0.9
      });
      // добавляем маршрут на карту
      map.current.geoObjects.add(route);
      console.log(route.getLength());
    });
  }

  const style = {
    left: 0,
    top: 0,
    width: '73.82vw',
    height: '90vh'
  };
  return (
    <div>
      <Row>

        <Col xl="3">
          <h1>Точки</h1>
          <AddressesView coords={coords} setCoord={setCoord} routeCoords={routeCoordsRef} inputType={inputType} setInputType={setInputType}/>
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
              <Map style={style}
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
