import React, { Component } from 'react';
import './App.css';
import WeatherChart from './components/WeatherChart.js';
import Select from 'react-select';

class App extends Component {

  state = {
    options: [],
    selectedOption: { value: 'total', label: 'Total' },
    dataLoadingStatus: 'Loading..',
    itemsCountChart: [],
    tempChart: [],
    windChart: [],
    pressureChart: [],
    lastUpdateChart: [],
    tempDiffChart: []
  };

  updateStats = (statsArray) => {

    const tempColumns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'Temp sum' },
    ];
    const windColumns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'Wind sum' },
    ];
    const pressureColumns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'Pressure sum' },
    ]
    const itemsCountColumns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'Item count' }
    ];
    const lastUpdateColumns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'Last Update' },
    ];
    const tempDiffColumns = [
      { type: 'date', label: 'Time' },
      { type: 'number', label: 'Met.no diff' },
    ];

    let itemsCountRows = [];
    let tempRows = [];
    let windRows = [];
    let pressureRows = [];
    let lastUpdateRows = [];
    let tempDiffRows = [];

    for (let item in statsArray) {

      const { runTimeStamp,
        sumOfTempC,
        sumOfWindMps,
        sumOfPressureHPA,
        countOfItems,
        lastUpdateTimestamp,
        sumOfTempCDiff } = statsArray[item];
      const rowDate = new Date(runTimeStamp * 1000);
      tempRows.push([rowDate, sumOfTempC]);
      itemsCountRows.push([rowDate, countOfItems]);
      windRows.push([rowDate, sumOfWindMps]);
      pressureRows.push([rowDate, sumOfPressureHPA]);
      lastUpdateRows.push([rowDate, (runTimeStamp - lastUpdateTimestamp) / 60]);
      tempDiffRows.push([rowDate, sumOfTempCDiff]);

    }

    this.setState({
      tempChart: [tempColumns, ...tempRows],
      windChart: [windColumns, ...windRows],
      pressureChart: [pressureColumns, ...pressureRows],
      itemsCountChart: [itemsCountColumns, ...itemsCountRows],
      lastUpdateChart: [lastUpdateColumns, ...lastUpdateRows],
      tempDiffChart: [tempDiffColumns, ...tempDiffRows],
      dataLoadingStatus: 'ready',
    })

  }

  setSelect = (sourceList) => {
    const optionsObj = sourceList.map(option => ({ value: option, label: option }));
    this.setState({
      options: [{ value: 'total', label: 'Total' },
      ...optionsObj]
    });
  }

  selectHandleChange = (selectedOption) => {
    this.setState({ selectedOption });
    this.callApi(`/api/stats/${selectedOption.value}`)
      .then((data) => this.updateStats(data))
      .catch(err => console.log(err));
  }

  componentDidMount() {
    this.callApi('/api/stats/list')
      .then((data) => this.setSelect(data.sources))
      .catch(err => console.log(err));
    this.callApi(`/api/stats/${this.state.selectedOption.value}`)
      .then((data) => this.updateStats(data))
      .catch(err => console.log(err));
  }

  callApi = async (url) => {
    const response = await fetch(url);
    const body = await response.json();
    if (response.status !== 200) throw Error(body.message);
    return body;
  };

  render() {
    return (this.state.dataLoadingStatus === 'ready') ?
      <div className="App">
        <header>
          <h3>Select a source:</h3>
          <Select
            className='select'
            value={this.state.selectedOption}
            onChange={this.selectHandleChange}
            options={this.state.options}
          />

        </header>
        <h2> {this.state.selectedOption.label} </h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center' }}>
          <WeatherChart chartData={this.state.itemsCountChart} title='Count of cities' />
          <WeatherChart chartData={this.state.tempChart} title='Sum of temp C' />
          <WeatherChart chartData={this.state.windChart} title='Sum of wind mps' />
          <WeatherChart chartData={this.state.pressureChart} title='Sum of pressure HPA' />
          <WeatherChart chartData={this.state.lastUpdateChart} title='Last update in minutes' />
          <WeatherChart
            chartData={this.state.tempDiffChart} title='Sum of temp diff with Met.no' />
        </div>
      </div>
      : <div> Loading data, please wait... </div>
      ;
  }
}

export default App;