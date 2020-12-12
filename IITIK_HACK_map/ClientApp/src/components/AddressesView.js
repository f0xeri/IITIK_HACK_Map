import React, {useState} from 'react';
import 'bootstrap/dist/css/bootstrap.css';
import './AddressesView.css'

export const AddressesView = ({coords, setCoord, routeCoords, inputType, setInputType}) => {
  
  const [input, setInput] = useState('');

  function onInputChange(e) {
    e.preventDefault();
    setInput(e.target.value);
  }
  
  const deleteCoord = coord => {
    setCoord(coords => coords.filter((e) => e.index !== coord.index));
    routeCoords.current.splice(coord.index, 1); 
  }
  
  const setCoordsButtonOnClick = e => {
    e.preventDefault();
    routeCoords.current = [];
    routeCoords.current = input.split("\n");
    for (let i = 0; i < routeCoords.current.length; i++) {
      routeCoords.current[i] = routeCoords.current[i].replaceAll(",", ".").split(";");
    }
    setCoord([]);
    for (let i = 0; i < routeCoords.current; i++) {
      setCoord(coords =>
        [...coords, {index: coords.length, address: "", coordinates: routeCoords.current[i]}]);
    }
  }
  
  // загружаем и парсим файл и сохраняем его содержимое куда надо
  const coordsFileUpload = e => {
    setInput("");
    let reader = new FileReader();
    reader.readAsText(e.target.files[0]);
    reader.onloadend = (e) => {
      setInput(e.target.result);
      routeCoords.current = [];
      routeCoords.current = e.target.result.split("\n");
      for (let i = 0; i < routeCoords.current.length; i++) {
        routeCoords.current[i] = routeCoords.current[i].replaceAll(",", ".").split(";");
      }
      setCoord([]);
    }
    for (let x in routeCoords.current) {
      setCoord(coords =>
        [...coords, {index: coords.length, address: "", coordinates: x}]);
    }
  }
  
  return (
    <div>
      <div onChange={event => {setInputType(event.target.value); setCoord([]); routeCoords.current = []; setInput("")}}>
        <div><input type="radio" value="search" defaultChecked  name="inputType"/> Поиск по адресу </div>
        <div><input type="radio" value="coords" name="inputType"/> Ввод координат </div>
      </div>
      {inputType === "search" && <input value={input} onChange={onInputChange} size={70} type="text" id="suggest"/>}
      {inputType === "coords" && 
        <div>
          <h6> Загрузите координаты из файла</h6>
          <input type="file" onChange={coordsFileUpload}/>
          <h6> Или введите их</h6>
          <textarea value={input} onChange={onInputChange} style={{width: '532px'}}/>
          <button onClick={setCoordsButtonOnClick} type="submit" className="btn-primary">Построить</button>
        </div>
      }
      <div>
        {coords.map(coord =>
          <div>
            {inputType === "search" && <input value={coord.address} size={70} type="text"/>}
            <span><button className="btn-danger" onClick={() => deleteCoord(coord)}>Удалить</button></span>
          </div>
        )}
      </div>
    </div>
  );
}