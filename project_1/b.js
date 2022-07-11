import a from "./a.js";

const b = {
    value: 'b',
    getA: function() {
        return a.value + ' from b.js'
    }
}

export default b