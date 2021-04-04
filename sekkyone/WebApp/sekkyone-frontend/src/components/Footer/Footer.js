/*eslint-disable*/
import React from "react";
// @material-ui/core components
import { makeStyles } from "@material-ui/core/styles";
// core components
import styles from "assets/jss/material-dashboard-react/components/footerStyle.js";

const useStyles = makeStyles(styles);

export default function Footer(props) {
  const classes = useStyles();
  return (
    <footer className={classes.footer}>
        <p className={classes.right}>
          <span>
            Sekkyone - IoT Project - Dashboard by Creative Tim
          </span>
        </p>
    </footer>
  );
}
