"use strict";

const createHTMLElement = (tag, parent, text) => {
  const newElement = document.createElement(tag);

  text ? (newElement.innerHTML = text) : "";

  if (parent) {
    parent.appendChild(newElement);
  } else {
    document.body.appendChild(newElement);
  }

  return newElement;
};

const setAttributes = (el, attrib) => {
  for (const key in attrib) {
    el.setAttribute(key, attrib[key]);
  }
};

export { createHTMLElement, setAttributes };
