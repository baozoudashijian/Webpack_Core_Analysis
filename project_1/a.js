import b from "./b.js";

const a = {
    value: 'a',
    getB: function() {
        return b.value + ' from a.js'
    }
}

export default a