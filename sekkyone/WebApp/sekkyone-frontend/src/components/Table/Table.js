import React, {useState} from "react";
import PropTypes from "prop-types";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
// core components
import styles from "assets/jss/material-dashboard-react/components/tableStyle.js";
import { IconButton } from "@material-ui/core";
import KeyboardArrowDownIcon from '@material-ui/icons/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@material-ui/icons/KeyboardArrowUp';

import Box from '@material-ui/core/Box';
import Collapse from '@material-ui/core/Collapse';
import Typography from '@material-ui/core/Typography';

const useStyles = makeStyles(styles);

export default function CustomTable(props) {
  const [open, setOpen] = useState(false);
  const classes = useStyles();
  const { tableHead, tableData, tableHeaderColor } = props;

  const average_spec = function(param,id){
    var intParam;
    if(param === "TEMP"){
      intParam = 2;
    } else if(param === "HUM"){
      intParam = 3;
    } else if(param === "FILL"){
      intParam = 5;
    }
    var sum = 0.0;
    for(var i = 0; i < tableData.length; i++){
      if(tableData[i].device_id == id){
        sum += parseFloat(tableData[i][intParam])
      }
    }
    return (sum / tableData.length).toFixed(2);
  }

  const maximum_spec = function(param,id){
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
    for(var i = 0; i < tableData.length; i++){
      if(tableData[i].device_id == id){
        if(parseFloat(tableData[i][intParam]) > max) {
          max = parseFloat(tableData[i][intParam]);
          date = tableData[i][1];
        }
      }
    }
    return {
      mes: max.toFixed(1),
      date: date
    }
  }

  const minimum_spec = function(param,id){
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
    for(var i = 0; i < tableData.length; i++){
      if(tableData[i].device_id == id){
        if(parseFloat(tableData[i][intParam]) < min) {
          min = parseFloat(tableData[i][intParam]);
          date = tableData[i][1];
        }
      }
    }
    return {
      mes: min.toFixed(1),
      date: date
    }
  }


  // [[station1, temp_media, hum_media, filling_medio],[station2, temp_media...],... ]
  const getDeviceList = function(){
    let deviceList = [];
    for(var i = 0; i < tableData.length; i++){
      if(!deviceList.includes(tableData[i].device_id)){
        let id = tableData[i].device_id;
        deviceList.push([
          id,
          average_spec("TEMP",id),
          average_spec("HUM",id),
          average_spec("FILL",id),
          minimum_spec("TEMP",id),
          minimum_spec("HUM",id),
          minimum_spec("FILL",id),
          maximum_spec("TEMP",id),
          maximum_spec("HUM",id),
          maximum_spec("FILL",id)
        ])
      }
    }
    return deviceList;
  }

  const getDeviceAggregatedValues = function(id){
    const list = getDeviceList();
    for(var i = 0; i < list.length; i++){
      if(list[i][1] === id){
        return list[i];
      }
    }
    return null;
  }

  return (
    <div className={classes.tableResponsive}>
      <Table className={classes.table} id={props.id}>
        {tableHead !== undefined ? (
          <TableHead className={classes[tableHeaderColor + "TableHeader"]}>
            <TableRow className={classes.tableHeadRow}>
              {tableHead.map((prop, key) => {
                return (
                  <TableCell
                    className={classes.tableCell + " " + classes.tableHeadCell}
                    key={key}
                  >
                    {prop}
                  </TableCell>
                );
              })}
            </TableRow>
          </TableHead>
        ) : null}
        <TableBody>
          {tableData.map((prop, key) => {
            return (
              <React.Fragment>
                <TableRow key={key} className={classes.tableBodyRow}>
                  <TableCell className={classes.tableCell} key={"arrow"+key}>
                    <IconButton aria-label="expand row" size="small" onClick={e => setOpen(!open)}>
                      {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
                    </IconButton>
                  </TableCell>
                  {prop.map((prop, key) => {
                    return (
                      <TableCell className={classes.tableCell} key={key}>
                        {prop}
                      </TableCell>
                    );
                  })}
                </TableRow>
                <TableRow>
                  <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
                    <Collapse in={open} timeout="auto" unmountOnExit>
                      <Box margin={1}>
                        <Typography variant="h6" gutterBottom component="div">
                          Aggregated Values
                        </Typography>
                        <Table size="small" aria-label="purchases">
                          <TableHead>
                            <TableRow>
                              <TableCell>Avg Temp</TableCell>
                              <TableCell>Avg Hum</TableCell>
                              <TableCell>Avg Fill</TableCell>
                              <TableCell>Max Temp</TableCell>
                              <TableCell>Max Hum</TableCell>
                              <TableCell>Max Fill</TableCell>
                              <TableCell>Min Temp</TableCell>
                              <TableCell>Min Hum</TableCell>
                              <TableCell>Min Fill</TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {getDeviceAggregatedValues(prop.id).map((aggreg) => (
                              <TableRow key={aggreg+"_"+prop.id}>
                                {aggreg.map((prop_aggreg, key_aggreg) => {
                                  return (
                                    <TableCell className={classes.tableCell} key={key_aggreg}>
                                      {prop_aggreg}
                                    </TableCell>
                                  );
                                })}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </Box>
                    </Collapse>
                  </TableCell>
                </TableRow>
              </React.Fragment>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

CustomTable.defaultProps = {
  tableHeaderColor: "gray"
};

CustomTable.propTypes = {
  tableHeaderColor: PropTypes.oneOf([
    "warning",
    "primary",
    "danger",
    "success",
    "info",
    "rose",
    "gray"
  ]),
  tableHead: PropTypes.arrayOf(PropTypes.string),
  tableData: PropTypes.arrayOf(PropTypes.arrayOf(PropTypes.string))
};
