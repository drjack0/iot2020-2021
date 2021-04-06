import React, {useEffect, useMemo, useRef, useState} from "react";
// react plugin for creating charts
import ChartistGraph from "react-chartist";
// @material-ui/core
import { makeStyles } from "@material-ui/core/styles";
import Icon from "@material-ui/core/Icon";
// @material-ui/icons
import AccessTime from "@material-ui/icons/AccessTime";

// core components
import GridItem from "components/Grid/GridItem.js";
import GridContainer from "components/Grid/GridContainer.js";
import Table from "components/Table/Table.js";
import Card from "components/Card/Card.js";
import CardHeader from "components/Card/CardHeader.js";
import CardIcon from "components/Card/CardIcon.js";
import CardBody from "components/Card/CardBody.js";
import CardFooter from "components/Card/CardFooter.js";
import CustomInput from "components/CustomInput/CustomInput.js";
import Button from "components/CustomButtons/Button.js";

import axios from "axios";

import {
  temperatureChart,
  humidityChart,
  fillChart,
  parseDataHumidity,
  parseDataTemperature,
  parseDataFill
} from "variables/charts.js";

import styles from "assets/jss/material-dashboard-react/views/dashboardStyle.js";

import useWebSocket, { ReadyState } from "react-use-websocket";

const useStyles = makeStyles(styles);

export default function Dashboard() {
  const classes = useStyles();

  const [mqttMes, setMqttMes] = useState("");

  const socketURL = "wss://qwd3tq7x8l.execute-api.us-east-1.amazonaws.com/dev";
  const restURL = "https://8nbuwj3tae.execute-api.us-east-1.amazonaws.com/dev/sekkyone"
  const messageHistory = useRef([]);

  const [storedValues, setStoredValues] = useState();
  const [isLoading, setLoading] = useState(false);
  const [appOK, setOK] = useState(false);

  useEffect(() => {
    getDataStored();
    console.log("Use effect call...")
  },[]);

  const average = function(param){
    var intParam;
    if(param === "TEMP"){
      intParam = 2;
    } else if(param === "HUM"){
      intParam = 3;
    } else if(param === "FILL"){
      intParam = 5;
    }
    var sum = 0.0;
    for(var i = 0; i < sortedArray.length; i++){
      sum += parseFloat(sortedArray[i][intParam])
    }
    return (sum / sortedArray.length).toFixed(2);
  }

  const minimum = function(param){
    var intParam;
    if(param === "TEMP"){
      intParam = 2;
    } else if(param === "HUM"){
      intParam = 3;
    } else if(param === "FILL"){
      intParam = 5;
    }
    var min = 101.0;
    var date = "";
    for(var i = 0; i < sortedArray.length; i++){
      if(parseFloat(sortedArray[i][intParam]) < min) {
        min = parseFloat(sortedArray[i][intParam]);
        date = sortedArray[i][1];
      }
    }
    return {
      mes: min.toFixed(1),
      date: date
    }
  }

  const maximum = function(param){
    var intParam;
    if(param === "TEMP"){
      intParam = 2;
    } else if(param === "HUM"){
      intParam = 3;
    } else if(param === "FILL"){
      intParam = 5;
    }
    var max = 0;
    var date = ""
    for(var i = 0; i < sortedArray.length; i++){
      if(parseFloat(sortedArray[i][intParam]) > max) {
        max = parseFloat(sortedArray[i][intParam]);
        date = sortedArray[i][1];
      }
    }
    return {
      mes: max.toFixed(1),
      date: date
    }
  }

  const getDataStored = async() => {
    setLoading(true)
    try{
      const res = await axios.get(restURL+"/lastday");
      setStoredValues(res.data);
    } catch(err) {
      console.log("ERR", err);
      return;
    } finally {
      setLoading(false);
      setOK(true);
    }
  }

  const sendState = async(event) => {
    console.log(mqttMes);
    try{
      const res = axios.post(restURL+"/postmes",{message: mqttMes});
      console.log(res);
    } catch(err){
      console.log("ERR",err);
      return;
    }
  }

  function compare(a,b){
    if(a.sensor_time < b.sensor_time){
      return -1;
    }
    if(a.sensor_time > b.sensor_time){
      return 1;
    }
    return 0;
  }

  var sortedArray = [];
//["sekkyone_station1", "Lun 25 Mar 8:00 UTC", "23.0°C", "41%", "0%", "15%"]
  const prepareDataTable = () => {
    let dataTable = [];
    storedValues.Items.sort(compare).map((mes,idx) => {
      dataTable.push([mes.device_id, getFormatDate(mes.sensor_time), mes.device_data.temperature+"°C", mes.device_data.humidity+"%", mes.device_data.levelFlame+"%", mes.device_data.levelFill+"%"])
    });
    sortedArray = dataTable;
    return true;
  }

  const getFormatDate = (timestamp) => {
    var date = new Date(parseInt(timestamp));
    return date.getDate() + "/" + (date.getMonth()+1) + "/" + date.getFullYear() + " " + date.getHours() + ":" + date.getMinutes() + ":" + date.getSeconds();
  }

  const {
    lastMessage,
    readyState
  } = useWebSocket(socketURL);

  messageHistory.current = useMemo(() =>
    messageHistory.current.concat(lastMessage),[lastMessage]);

  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'ON',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'NO',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];
  return (   
    appOK && prepareDataTable() &&
    <div>
      <GridContainer>
        <GridItem xs={12} sm={6} md={3}>
          <Card>
            <CardHeader color="warning" stats icon>
              <CardIcon color="warning">
                <Icon>device_thermostat</Icon>
              </CardIcon>
              <p className={classes.cardCategory}>Temperature</p>
              <h3 className={classes.cardTitle}>
                {lastMessage !== null ? JSON.parse(lastMessage.data).device_data.temperature : ((isLoading && storedValues.Items.length === 0) ? "Con.." : (sortedArray.length === 0 ? "No data" : storedValues.Items[storedValues.Items.length - 1].device_data.temperature))} <small>°C</small>
              </h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <Icon>update</Icon>
                  Real time measurement: {lastMessage !== null ? connectionStatus : "No data received"}
              </div>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <Card>
            <CardHeader color="success" stats icon>
              <CardIcon color="success">
                <Icon>invert_colors</Icon>
              </CardIcon>
              <p className={classes.cardCategory}>Humidity</p>
              <h3 className={classes.cardTitle}>
              {lastMessage !== null ? JSON.parse(lastMessage.data).device_data.humidity : ((isLoading && storedValues.Items[0] === undefined) ? "Con.." : (sortedArray.length === 0 ? "No data" : storedValues.Items[storedValues.Items.length - 1].device_data.humidity))} <small>%</small></h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <Icon>update</Icon>
                  Real time measurement: {lastMessage !== null ? connectionStatus : "No data received"}
              </div>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <Card>
            <CardHeader color="danger" stats icon>
              <CardIcon color="danger">
                <Icon>local_fire_department</Icon>
              </CardIcon>
              <p className={classes.cardCategory}>Flame Level</p>
              <h3 className={classes.cardTitle}>
                {lastMessage !== null ? JSON.parse(lastMessage.data).device_data.levelFlame : ((isLoading && storedValues.Items[0] === undefined) ? "Con.." : (sortedArray.length === 0 ? "No data" : storedValues.Items[storedValues.Items.length - 1].device_data.levelFlame))} <small>%</small>
              </h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <Icon>update</Icon>
                  Real time measurement: {lastMessage !== null ? connectionStatus : "No data received"}
              </div>
            </CardFooter>
          </Card>
        </GridItem>
        <GridItem xs={12} sm={6} md={3}>
          <Card>
            <CardHeader color="info" stats icon>
              <CardIcon color="info">
                <Icon>delete_outline</Icon>
              </CardIcon>
              <p className={classes.cardCategory}>Fill Level</p>
              <h3 className={classes.cardTitle}>
              {lastMessage !== null ? JSON.parse(lastMessage.data).device_data.levelFill : ((isLoading && storedValues.Items[0] === undefined) ? "Con.." : (sortedArray.length === 0 ? "No data" : storedValues.Items[storedValues.Items.length - 1].device_data.levelFill))} <small>%</small>
              </h3>
            </CardHeader>
            <CardFooter stats>
              <div className={classes.stats}>
                <Icon>update</Icon>
                  Real time measurement: {lastMessage !== null ? connectionStatus : "No data received"}
              </div>
            </CardFooter>
          </Card>
        </GridItem>
      </GridContainer>

       
      <GridContainer>
        <GridItem xs={12} sm={12} md={4}>
          <Card chart>
            <CardHeader color="warning">
              <ChartistGraph
                className="ct-chart"
                data={parseDataTemperature(sortedArray)}
                type="Line"
                options={temperatureChart.options}
                listener={temperatureChart.animation}
              />
            </CardHeader>
            <CardBody>
              <h4 className={classes.cardTitle}>Daily Temperature</h4>
              <p className={classes.cardCategory}>
                  <Icon fontSize="small">functions</Icon>{" "}Average: {sortedArray.length === 0 ? "..." : average("TEMP")}°C
              </p>
              <p className={classes.cardCategory}>
                  <Icon fontSize="small">expand_more</Icon>{" "}Minimum: {sortedArray.length === 0 ? "..." : minimum("TEMP").mes}°C at {sortedArray.length === 0 ? "..." : minimum("TEMP").date}
              </p>
              <p className={classes.cardCategory}>
                  <Icon fontSize="small">expand_less</Icon>{" "}Maximum: {sortedArray.length === 0 ? "..." : maximum("TEMP").mes}°C at {sortedArray.length === 0 ? "..." : maximum("TEMP").date}
              </p>
            </CardBody>
            <CardFooter chart>
              <div className={classes.stats}>
                <AccessTime /> Last Value {sortedArray.length === 0 ? "..." : sortedArray[sortedArray.length-1][1]}
              </div>
            </CardFooter>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={12} md={4}>
          <Card chart>
            <CardHeader color="success">
              <ChartistGraph
                className="ct-chart"
                data={parseDataHumidity(sortedArray)}
                type="Line"
                options={humidityChart.options}
                responsiveOptions={humidityChart.responsiveOptions}
                listener={humidityChart.animation}
              />
            </CardHeader>
            <CardBody>
              <h4 className={classes.cardTitle}>Daily Humidity</h4>
              <p className={classes.cardCategory}>
                  <Icon fontSize="small">functions</Icon>{" "}Average: {sortedArray.length === 0 ? "..." : average("HUM")}%
              </p>
              <p className={classes.cardCategory}>
                  <Icon fontSize="small">expand_more</Icon>{" "}Minimum: {sortedArray.length === 0 ? "..." : minimum("HUM").mes}% at {sortedArray.length === 0 ? "..." : minimum("HUM").date}
              </p>
              <p className={classes.cardCategory}>
                  <Icon fontSize="small">expand_less</Icon>{" "}Maximum: {sortedArray.length === 0 ? "..." : maximum("HUM").mes}% at {sortedArray.length === 0 ? "..." : maximum("HUM").date}
              </p>
            </CardBody>
            <CardFooter chart>
              <div className={classes.stats}>
                <AccessTime /> Last Value {sortedArray.length === 0 ? "..." : sortedArray[sortedArray.length-1][1]}
              </div>
            </CardFooter>
          </Card>
        </GridItem>

        <GridItem xs={12} sm={12} md={4}>
          <Card chart>
            <CardHeader color="info">
              <ChartistGraph
                className="ct-chart"
                data={parseDataFill(sortedArray)}
                type="Bar"
                options={fillChart.options}
                listener={fillChart.animation}
              />
            </CardHeader>
            <CardBody>
              <h4 className={classes.cardTitle}>Daily Fill Level</h4>
              <p className={classes.cardCategory}>
                  <Icon fontSize="small">functions</Icon>{" "}Average: {sortedArray.length === 0? "..." : average("FILL")}%
              </p>
              <p className={classes.cardCategory}>
                  <Icon fontSize="small">expand_more</Icon>{" "}Minimum: {sortedArray.length === 0 ? "..." : minimum("FILL").mes}% at {sortedArray.length === 0 ? "..." : minimum("FILL").date}
              </p>
              <p className={classes.cardCategory}>
                  <Icon fontSize="small">expand_less</Icon>{" "}Maximum: {sortedArray.length === 0 ? "..." : maximum("FILL").mes}% at {sortedArray.length === 0 ? "..." : maximum("FILL").date}
              </p>
            </CardBody>
            <CardFooter chart>
              <div className={classes.stats}>
                <AccessTime /> Last Value {sortedArray.length === 0 ? "..." : sortedArray[sortedArray.length-1][1]}
              </div>
            </CardFooter>
          </Card>
        </GridItem>
      </GridContainer>

      <GridContainer>
        <GridItem xs={12}>
          <Card>
            <CardHeader color="rose">
              <h4 className={classes.cardTitleWhite}>Set device state</h4>
              <p className={classes.cardCategoryWhite}>Publish a (max 5 chars) message to device</p>
            </CardHeader>
            <CardBody>
                  <CustomInput
                    labelText="Insert the state-message"
                    id="mqtt-message"
                    formControlProps={{
                      fullWidth: true
                    }}
                    inputProps={{
                      disabled: false,
                      onChange: e => {setMqttMes(e.target.value)},
                    }}
                    value= {mqttMes}                                
                  />
                  <Button disabled={mqttMes.length > 5} type="button" color="rose" size="sm" onClick={() => sendState(mqttMes)}><Icon fontSize = "small">send</Icon> Send</Button>
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>


      <GridContainer>
        <GridItem xs={12}>
          <Card>
            <CardHeader color="primary">
              <h4 className={classes.cardTitleWhite}>Last Day Measurements</h4>
              <p className={classes.cardCategoryWhite}>
                Refresh page to update data
              </p>
            </CardHeader>
            <CardBody>
              <Table
                tableHeaderColor="primary"
                tableHead={["Device", "Timestamp", "Temperature", "Humidity", "Flame Level", "Fill Level"]}
                /*tableData={[
                  ["sekkyone_station1", "Lun 25 Mar 8:00 UTC", "23.0°C", "41%", "0%", "15%"],
                  ["sekkyone_station1", "Lun 25 Mar 8:15 UTCr", "23.2°C", "41%", "0%", "20%"],
                  ["sekkyone_station1", "Lun 25 Mar 8:30 UTC", "23.5°C", "43%", "0%", "50%"],
                  ["sekkyone_station1", "Lun 25 Mar 8:45 UTC", "23.1°C", "41%", "0%", "76%"]
                ]}*/
                tableData={
                  sortedArray
                }
              />
            </CardBody>
          </Card>
        </GridItem>
      </GridContainer>
    </div>
  );
}
