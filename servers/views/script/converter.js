"use strict";

const convertToUnix = () => {
  let value = document.getElementById("date-input").value;
  let p = document.getElementById("unix-field");
  let convertDate = Date.parse(value) / 1000;
  p.innerHTML = convertDate;
};
