"use strict";

const convertToUnix = () => {
  let value = document.getElementById("date-input").value;
  let input = document.getElementById("unix-field");
  let convertDate = Date.parse(value) / 1000;
  input.value = convertDate;
};
