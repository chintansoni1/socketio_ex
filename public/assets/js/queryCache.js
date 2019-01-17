/// <reference path="/js/source/main.js" />

/**
 * Cache selectors so we're not thrashing the layout (as much) with repetitive dom queries
 * https://www.youtube.com/watch?v=hDNQhERJPE4
 */
(function ($) {
    var cache = {};

    $.query = function (selector) {
        if (typeof cache[selector] === "undefined") {
            cache[selector] = $(selector);
        }

        return cache[selector];
    };

})(jQuery);
