import React, {useState} from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import './AddressesView.css'

export const AddressesView = ({coords, setCoord, routeCoords, inputType, setInputType}) => {
  
  const [input, setInput] = useState('');

  function onInputChange(e) {
    e.preventDefault();
    //setInput(e.target.value.replace(/\s+/g,' '));
    setInput(e.target.value);
  }
  
  // временно убрал редактирование готовых точек
  const onCoordChange = (e, coord)  => {
    /*coord.address = e.target.value.replace(/\s+/g,' ');
    let coordsTemp = [...coords];
    let routeCoordsTemp = [...routeCoords.current];
    coordsTemp[coord.index] = coord;

    routeCoords.current[coord.index] = e.target.value.replace(/\s+/g,' ');
    console.log(routeCoords);
    setCoord(coordsTemp);*/
  }
  
  const deleteCoord = coord => {
    setCoord(coords => coords.filter((e) => e.index !== coord.index));
    routeCoords.current.splice(coord.index, 1); 
  }
  
  const setCoordsButtonOnClick = e => {
    e.preventDefault();
    routeCoords.current = [];
    routeCoords.current = input.split(";");
    for (let i = 0; i < routeCoords.current.length; i++) {
      routeCoords.current[i] = routeCoords.current[i].replaceAll(",", ".").split(" ");
    }
    setCoord([]);
    for (let x in routeCoords.current) {
      setCoord(coords =>
        [...coords, {index: coords.length, address: "", coordinates: x}]);
    }
    console.log(routeCoords.current);
  }


  /*function addNewAddress(e) {
    e.preventDefault();
    setAddresses([...addresses, input]);
  }*/
  // <button onClick={addNewAddress} type="submit" className="btn-primary">Добавить адрес</button>
  return (
    <div>
      <div onChange={event => {setInputType(event.target.value)}}>
        <div><input type="radio" value="search" defaultChecked  name="inputType"/> Поиск по адресу </div>
        <div><input type="radio" value="coords" name="inputType"/> Ввод координат </div>
      </div>
      {inputType === "search" && <input value={input} onChange={onInputChange} size={70} type="text" id="suggest"/>}
      {inputType === "coords" && 
        <div>
          <textarea value={input} onChange={onInputChange} style={{width: '532px'}} id="suggest"/>
          <button onClick={setCoordsButtonOnClick} type="submit" className="btn-primary">Построить</button>
          <span> или </span>
          <button type="submit" className="btn-primary">Загрузить из файла</button>
        </div>}
      <div>
        {coords.map(coord =>
          <div>
            <input value={coord.address} onChange={(e) => onCoordChange(e, coord)} size={70} type="text"/>
            <span><button className="btn-danger" onClick={() => deleteCoord(coord)}>Удалить</button></span>
          </div>
        )}
      </div>
    </div>
  );
}