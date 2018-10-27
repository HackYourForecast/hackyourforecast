"use strict";

$(document).ready(function(e) {
  $(document).scroll(function(e) {
    let $nav = $(".navbar");
    $nav.toggleClass("scrolled", $(this).scrollTop() > $nav.height());
  });
});
